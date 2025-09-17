import { Buffer } from 'node:buffer';
import { inspect } from 'node:util';
import { calculateBits, camelize, camelToSnakeCase, DISCORDENO_VERSION, delay, getBotIdFromToken, hasProperty, logger, processReactionString, snowflakeToTimestamp, urlToBase64 } from '@discordeno/utils';
import { createInvalidRequestBucket } from './invalidBucket.js';
import { Queue } from './queue.js';
import { createRoutes } from './routes.js';
export const DISCORD_API_VERSION = 10;
export const DISCORD_API_URL = 'https://discord.com/api';
export const AUDIT_LOG_REASON_HEADER = 'x-audit-log-reason';
export const RATE_LIMIT_REMAINING_HEADER = 'x-ratelimit-remaining';
export const RATE_LIMIT_RESET_AFTER_HEADER = 'x-ratelimit-reset-after';
export const RATE_LIMIT_GLOBAL_HEADER = 'x-ratelimit-global';
export const RATE_LIMIT_BUCKET_HEADER = 'x-ratelimit-bucket';
export const RATE_LIMIT_LIMIT_HEADER = 'x-ratelimit-limit';
export const RATE_LIMIT_SCOPE_HEADER = 'x-ratelimit-scope';
export function createRestManager(options) {
    const applicationId = options.applicationId ? BigInt(options.applicationId) : getBotIdFromToken(options.token);
    const baseUrl = options.proxy?.baseUrl ?? DISCORD_API_URL;
    // Discord error can get nested a lot, so we use a custom inspect to change the depth to Infinity
    const baseErrorPrototype = {
        [inspect.custom] (_depth, options, _inspect) {
            return _inspect(this, {
                ...options,
                depth: Infinity,
                // Since we call inspect on ourself, we need to disable the calls to the inspect.custom symbol or else it will cause an infinite loop.
                customInspect: false
            });
        }
    };
    const rest = {
        applicationId,
        authorization: options.proxy?.authorization,
        authorizationHeader: options.proxy?.authorizationHeader ?? 'authorization',
        baseUrl,
        deleteQueueDelay: 60000,
        globallyRateLimited: false,
        invalidBucket: createInvalidRequestBucket({
            logger: options.logger
        }),
        isProxied: !baseUrl.startsWith(DISCORD_API_URL),
        updateBearerTokenEndpoint: options.proxy?.updateBearerTokenEndpoint,
        maxRetryCount: Infinity,
        processingRateLimitedPaths: false,
        queues: new Map(),
        rateLimitedPaths: new Map(),
        token: options.token,
        version: options.version ?? DISCORD_API_VERSION,
        logger: options.logger ?? logger,
        events: {
            request: ()=>{},
            response: ()=>{},
            requestError: ()=>{},
            ...options.events
        },
        routes: createRoutes(),
        createBaseHeaders () {
            return {
                'user-agent': `DiscordBot (https://github.com/discordeno/discordeno, v${DISCORDENO_VERSION})`
            };
        },
        checkRateLimits (url, identifier) {
            const ratelimited = rest.rateLimitedPaths.get(`${identifier}${url}`);
            const global = rest.rateLimitedPaths.get('global');
            const now = Date.now();
            if (ratelimited && now < ratelimited.resetTimestamp) {
                return ratelimited.resetTimestamp - now;
            }
            if (global && now < global.resetTimestamp) {
                return global.resetTimestamp - now;
            }
            return false;
        },
        async updateTokenQueues (oldToken, newToken) {
            if (rest.isProxied) {
                if (!rest.updateBearerTokenEndpoint) {
                    throw new Error("The 'proxy.updateBearerTokenEndpoint' option needs to be set when using a rest proxy and needed to call 'updateTokenQueues'");
                }
                const headers = {
                    'content-type': 'application/json'
                };
                if (rest.authorization !== undefined) {
                    headers[rest.authorizationHeader] = rest.authorization;
                }
                await fetch(`${rest.baseUrl}/${rest.updateBearerTokenEndpoint}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        oldToken,
                        newToken
                    }),
                    headers
                });
                return;
            }
            const newIdentifier = `Bearer ${newToken}`;
            // Update all the queues
            for (const [key, queue] of rest.queues.entries()){
                if (!key.startsWith(`Bearer ${oldToken}`)) continue;
                rest.queues.delete(key);
                queue.identifier = newIdentifier;
                const newKey = `${newIdentifier}${queue.url}`;
                const newQueue = rest.queues.get(newKey);
                // Merge the queues
                if (newQueue) {
                    newQueue.waiting.unshift(...queue.waiting);
                    newQueue.pending.unshift(...queue.pending);
                    queue.waiting = [];
                    queue.pending = [];
                    queue.cleanup();
                } else {
                    rest.queues.set(newKey, queue);
                }
            }
            for (const [key, ratelimitPath] of rest.rateLimitedPaths.entries()){
                if (!key.startsWith(`Bearer ${oldToken}`)) continue;
                rest.rateLimitedPaths.set(`${newIdentifier}${ratelimitPath.url}`, ratelimitPath);
                if (ratelimitPath.bucketId) {
                    rest.rateLimitedPaths.set(`${newIdentifier}${ratelimitPath.bucketId}`, ratelimitPath);
                }
            }
        },
        changeToDiscordFormat (obj) {
            if (obj === null) return null;
            if (typeof obj === 'object') {
                if (Array.isArray(obj)) {
                    return obj.map((item)=>rest.changeToDiscordFormat(item));
                }
                const newObj = {};
                for (const key of Object.keys(obj)){
                    const value = obj[key];
                    // If the key is already in snake_case we can assume it is already in the discord format.
                    if (key.includes('_')) {
                        newObj[key] = value;
                        continue;
                    }
                    // Some falsy values should be allowed like null or 0
                    if (value !== undefined) {
                        switch(key){
                            case 'permissions':
                            case 'allow':
                            case 'deny':
                                newObj[key] = typeof value === 'string' ? value : calculateBits(value);
                                continue;
                            case 'defaultMemberPermissions':
                                newObj.default_member_permissions = typeof value === 'string' ? value : calculateBits(value);
                                continue;
                            case 'nameLocalizations':
                                newObj.name_localizations = value;
                                continue;
                            case 'descriptionLocalizations':
                                newObj.description_localizations = value;
                                continue;
                        }
                    }
                    newObj[camelToSnakeCase(key)] = rest.changeToDiscordFormat(value);
                }
                return newObj;
            }
            if (typeof obj === 'bigint') return obj.toString();
            return obj;
        },
        createRequestBody (method, options) {
            const headers = this.createBaseHeaders();
            if (options?.unauthorized !== true) headers.authorization = `Bot ${rest.token}`;
            // IF A REASON IS PROVIDED ENCODE IT IN HEADERS
            if (options?.reason !== undefined) {
                headers[AUDIT_LOG_REASON_HEADER] = encodeURIComponent(options?.reason);
            }
            let body;
            // Have to check for attachments first, since body then has to be send in a different way.
            if (options?.files !== undefined) {
                const form = new FormData();
                for(let i = 0; i < options.files.length; ++i){
                    form.append(`files[${i}]`, options.files[i].blob, options.files[i].name);
                }
                // Have to use changeToDiscordFormat or else JSON.stringify may throw an error for the presence of BigInt(s) in the json
                form.append('payload_json', JSON.stringify(rest.changeToDiscordFormat({
                    ...options.body,
                    files: undefined
                })));
                // No need to set the `content-type` header since `fetch` does that automatically for us when we use a `FormData` object.
                body = form;
            } else if (options?.body && options.headers && options.headers['content-type'] === 'application/x-www-form-urlencoded') {
                // OAuth2 body handling
                const formBody = [];
                const discordBody = rest.changeToDiscordFormat(options.body);
                for(const prop in discordBody){
                    formBody.push(`${encodeURIComponent(prop)}=${encodeURIComponent(discordBody[prop])}`);
                }
                body = formBody.join('&');
            } else if (options?.body !== undefined) {
                if (options.body instanceof FormData) {
                    body = options.body;
                // No need to set the `content-type` header since `fetch` does that automatically for us when we use a `FormData` object.
                } else {
                    body = JSON.stringify(rest.changeToDiscordFormat(options.body));
                    headers['content-type'] = `application/json`;
                }
            }
            // SOMETIMES SPECIAL HEADERS (E.G. CUSTOM AUTHORIZATION) NEED TO BE USED
            if (options?.headers) {
                Object.assign(headers, options.headers);
            }
            return {
                body,
                headers,
                method
            };
        },
        processRateLimitedPaths () {
            const now = Date.now();
            for (const [key, value] of rest.rateLimitedPaths.entries()){
                //   rest.debug(
                // `[REST - processRateLimitedPaths] Running for of loop. ${
                //   value.resetTimestamp - now
                // }`
                //   )
                // If the time has not reached cancel
                if (value.resetTimestamp > now) continue;
                // Rate limit is over, delete the rate limiter
                rest.rateLimitedPaths.delete(key);
                // If it was global, also mark the global value as false
                if (key === 'global') rest.globallyRateLimited = false;
            }
            // ALL PATHS ARE CLEARED CAN CANCEL OUT!
            if (rest.rateLimitedPaths.size === 0) {
                rest.processingRateLimitedPaths = false;
            } else {
                rest.processingRateLimitedPaths = true;
                // RECHECK IN 1 SECOND
                setTimeout(()=>{
                    // rest.debug('[REST - processRateLimitedPaths] Running setTimeout.')
                    rest.processRateLimitedPaths();
                }, 1000);
            }
        },
        /** Processes the rate limit headers and determines if it needs to be rate limited and returns the bucket id if available */ processHeaders (url, headers, identifier) {
            let rateLimited = false;
            // GET ALL NECESSARY HEADERS
            const remaining = headers.get(RATE_LIMIT_REMAINING_HEADER);
            const retryAfter = headers.get(RATE_LIMIT_RESET_AFTER_HEADER);
            const reset = Date.now() + Number(retryAfter) * 1000;
            const global = headers.get(RATE_LIMIT_GLOBAL_HEADER);
            // undefined override null needed for typings
            const bucketId = headers.get(RATE_LIMIT_BUCKET_HEADER) ?? undefined;
            const limit = headers.get(RATE_LIMIT_LIMIT_HEADER);
            // If we didn't received the identifier, fallback to the bot token
            identifier ??= `Bot ${rest.token}`;
            rest.queues.get(`${identifier}${url}`)?.handleCompletedRequest({
                remaining: remaining ? Number(remaining) : undefined,
                interval: retryAfter ? Number(retryAfter) * 1000 : undefined,
                max: limit ? Number(limit) : undefined
            });
            // IF THERE IS NO REMAINING RATE LIMIT, MARK IT AS RATE LIMITED
            if (remaining === '0') {
                rateLimited = true;
                // SAVE THE URL AS LIMITED, IMPORTANT FOR NEW REQUESTS BY USER WITHOUT BUCKET
                rest.rateLimitedPaths.set(`${identifier}${url}`, {
                    url,
                    resetTimestamp: reset,
                    bucketId
                });
                // SAVE THE BUCKET AS LIMITED SINCE DIFFERENT URLS MAY SHARE A BUCKET
                if (bucketId) {
                    rest.rateLimitedPaths.set(`${identifier}${bucketId}`, {
                        url,
                        resetTimestamp: reset,
                        bucketId
                    });
                }
            }
            // IF THERE IS NO REMAINING GLOBAL LIMIT, MARK IT RATE LIMITED GLOBALLY
            if (global) {
                const retryAfter = Number(headers.get('retry-after')) * 1000;
                const globalReset = Date.now() + retryAfter;
                //   rest.debug(
                // `[REST = Globally Rate Limited] URL: ${url} | Global Rest: ${globalReset}`
                //   )
                rest.globallyRateLimited = true;
                rateLimited = true;
                setTimeout(()=>{
                    rest.globallyRateLimited = false;
                }, retryAfter);
                rest.rateLimitedPaths.set('global', {
                    url: 'global',
                    resetTimestamp: globalReset,
                    bucketId
                });
                if (bucketId) {
                    rest.rateLimitedPaths.set(identifier, {
                        url: 'global',
                        resetTimestamp: globalReset,
                        bucketId
                    });
                }
            }
            if (rateLimited && !rest.processingRateLimitedPaths) {
                rest.processRateLimitedPaths();
            }
            return rateLimited ? bucketId : undefined;
        },
        async sendRequest (options) {
            const url = `${rest.baseUrl}/v${rest.version}${options.route}`;
            const payload = rest.createRequestBody(options.method, options.requestBodyOptions);
            const loggingHeaders = {
                ...payload.headers
            };
            if (payload.headers.authorization) {
                const authorizationScheme = payload.headers.authorization?.split(' ')[0];
                loggingHeaders.authorization = `${authorizationScheme} tokenhere`;
            }
            const request = new Request(url, payload);
            rest.events.request(request, {
                body: options.requestBodyOptions?.body
            });
            rest.logger.debug(`sending request to ${url}`, 'with payload:', {
                ...payload,
                headers: loggingHeaders
            });
            const response = await fetch(request).catch(async (error)=>{
                rest.logger.error(error);
                rest.events.requestError(request, error, {
                    body: options.requestBodyOptions?.body
                });
                // Mark request as completed
                rest.invalidBucket.handleCompletedRequest(999, false);
                options.reject({
                    ok: false,
                    status: 999,
                    error: 'Possible network or request shape issue occurred. If this is rare, its a network glitch. If it occurs a lot something is wrong.'
                });
                throw error;
            });
            rest.logger.debug(`request fetched from ${url} with status ${response.status} & ${response.statusText}`);
            // Sometimes the Content-Type may be "application/json; charset=utf-8", for this reason, we need to check the start of the header
            const body = await (response.headers.get('Content-Type')?.startsWith('application/json') ? response.json() : response.text()).catch(()=>null);
            rest.events.response(request, response, {
                requestBody: options.requestBodyOptions?.body,
                responseBody: body
            });
            // Mark request as completed
            rest.invalidBucket.handleCompletedRequest(response.status, response.headers.get(RATE_LIMIT_SCOPE_HEADER) === 'shared');
            // Set the bucket id if it was available on the headers
            const bucketId = rest.processHeaders(rest.simplifyUrl(options.route, options.method), response.headers, payload.headers.authorization);
            if (bucketId) options.bucketId = bucketId;
            if (response.status < 200 || response.status >= 400) {
                rest.logger.debug(`Request to ${url} failed.`);
                if (response.status !== 429) {
                    options.reject({
                        ok: false,
                        status: response.status,
                        statusText: response.statusText,
                        body
                    });
                    return;
                }
                rest.logger.debug(`Request to ${url} was ratelimited.`);
                // Too many attempts, get rid of request from queue.
                if (options.retryCount >= rest.maxRetryCount) {
                    rest.logger.debug(`Request to ${url} exceeded the maximum allowed retries.`, 'with payload:', payload);
                    // rest.debug(`[REST - RetriesMaxed] ${JSON.stringify(options)}`)
                    options.reject({
                        ok: false,
                        status: response.status,
                        statusText: response.statusText,
                        error: 'The request was rate limited and it maxed out the retries limit.'
                    });
                    return;
                }
                options.retryCount += 1;
                const resetAfter = response.headers.get(RATE_LIMIT_RESET_AFTER_HEADER);
                if (resetAfter) await delay(Number(resetAfter) * 1000);
                return await options.retryRequest?.(options);
            }
            // Discord sometimes sends a response with no content
            options.resolve({
                ok: true,
                status: response.status,
                body: response.status === 204 ? undefined : body
            });
        },
        simplifyUrl (url, method) {
            const routeInformationKey = [
                method
            ];
            const queryParamIndex = url.indexOf('?');
            const route = queryParamIndex !== -1 ? url.slice(0, queryParamIndex) : url;
            // Since the urls start with / the first part will always be empty
            const splittedRoute = route.split('/');
            // 1) Strip the minor params
            //    The only majors are channels, guilds, webhooks and webhooks with their token
            const strippedRoute = splittedRoute.map((part, index, array)=>{
                // While parseInt will truncate the snowflake id, it will still tell us if it is a number
                const isNumber = Number.isFinite(parseInt(part, 10));
                if (!isNumber) {
                    // Reactions emoji need to be stripped as it is a minor parameter
                    if (index >= 1 && array[index - 1] === 'reactions') return 'x';
                    // If we are on a webhook or if it is part of the route, keep it as it is a major parameter
                    return part;
                }
                // Check if we are on a channel id, a guild id or a webhook id
                const isMajor = index >= 1 && (array[index - 1] === 'channels' || array[index - 1] === 'guilds' || array[index - 1] === 'webhooks');
                if (isMajor) return part;
                return 'x';
            }).join('/');
            routeInformationKey.push(strippedRoute);
            // 2) Account for exceptions
            //    - https://github.com/discord/discord-api-docs/issues/1092
            //    - https://github.com/discord/discord-api-docs/issues/1295
            // The 2 exceptions are for message delete, so we need to check if we are in that route
            if (method === 'DELETE' && splittedRoute.length === 5 && splittedRoute[1] === 'channels' && strippedRoute.endsWith('/messages/x')) {
                const messageId = splittedRoute[4];
                const timestamp = snowflakeToTimestamp(messageId);
                const now = Date.now();
                // https://github.com/discord/discord-api-docs/issues/1092
                if (now - timestamp < 10_000) {
                    routeInformationKey.push('message-delete-10s');
                }
                // https://github.com/discord/discord-api-docs/issues/1295
                // 2 weeks = 2 * 7 * 24 * 60 * 60 * 1000 = 1209600000
                if (now - timestamp > 1209600000) {
                    routeInformationKey.push('message-delete-2w');
                }
            }
            return routeInformationKey.join(':');
        },
        async processRequest (request) {
            const url = rest.simplifyUrl(request.route, request.method);
            if (request.runThroughQueue === false) {
                await rest.sendRequest(request);
                return;
            }
            // If we the request has a token, use it
            // Else fallback to prefix with the bot token
            const queueIdentifier = request.requestBodyOptions?.headers?.authorization ?? `Bot ${rest.token}`;
            const queue = rest.queues.get(`${queueIdentifier}${url}`);
            if (queue !== undefined) {
                queue.makeRequest(request);
            } else {
                // CREATES A NEW QUEUE
                const bucketQueue = new Queue(rest, {
                    url,
                    deleteQueueDelay: rest.deleteQueueDelay,
                    identifier: queueIdentifier
                });
                // Save queue
                rest.queues.set(`${queueIdentifier}${url}`, bucketQueue);
                // Add request to queue
                bucketQueue.makeRequest(request);
            }
        },
        async makeRequest (method, route, options) {
            // This error needs to be created here because of how stack traces get calculated
            const error = new Error();
            if (rest.isProxied) {
                if (rest.authorization) {
                    options ??= {};
                    options.headers ??= {};
                    options.headers[rest.authorizationHeader] = rest.authorization;
                }
                const request = new Request(`${rest.baseUrl}/v${rest.version}${route}`, rest.createRequestBody(method, options));
                rest.events.request(request, {
                    body: options?.body
                });
                const result = await fetch(request);
                // Sometimes the Content-Type may be "application/json; charset=utf-8", for this reason, we need to check the start of the header
                const body = await (result.headers.get('Content-Type')?.startsWith('application/json') ? result.json() : result.text()).catch(()=>null);
                rest.events.response(request, result, {
                    requestBody: options?.body,
                    responseBody: body
                });
                if (!result.ok) {
                    error.cause = Object.assign(Object.create(baseErrorPrototype), {
                        ok: false,
                        status: result.status,
                        body
                    });
                    throw error;
                }
                return result.status !== 204 ? typeof body === 'string' ? JSON.parse(body) : body : undefined;
            }
            return await new Promise(async (resolve, reject)=>{
                const payload = {
                    route,
                    method,
                    requestBodyOptions: options,
                    retryCount: 0,
                    retryRequest: async (payload)=>{
                        await rest.processRequest(payload);
                    },
                    resolve: (data)=>{
                        resolve(data.status !== 204 ? typeof data.body === 'string' ? JSON.parse(data.body) : data.body : undefined);
                    },
                    reject: (reason)=>{
                        let errorText;
                        switch(reason.status){
                            case 400:
                                errorText = "The options was improperly formatted, or the server couldn't understand it.";
                                break;
                            case 401:
                                errorText = 'The Authorization header was missing or invalid.';
                                break;
                            case 403:
                                errorText = 'The Authorization token you passed did not have permission to the resource.';
                                break;
                            case 404:
                                errorText = "The resource at the location specified doesn't exist.";
                                break;
                            case 405:
                                errorText = 'The HTTP method used is not valid for the location specified.';
                                break;
                            case 429:
                                errorText = "You're being ratelimited.";
                                break;
                            case 502:
                                errorText = 'There was not a gateway available to process your options. Wait a bit and retry.';
                                break;
                            default:
                                errorText = reason.statusText ?? 'Unknown error';
                        }
                        error.message = `[${reason.status}] ${errorText}`;
                        // If discord sent us JSON, it is probably going to be an error message from which we can get and add some information about the error to the error message, the full body will be in the error.cause
                        // https://discord.com/developers/docs/reference#error-messages
                        if (typeof reason.body === 'object' && hasProperty(reason.body, 'code') && hasProperty(reason.body, 'message')) {
                            error.message += `\nDiscord error: [${reason.body.code}] ${reason.body.message}`;
                        }
                        error.cause = Object.assign(Object.create(baseErrorPrototype), reason);
                        reject(error);
                    },
                    runThroughQueue: options?.runThroughQueue
                };
                await rest.processRequest(payload);
            });
        },
        async get (url, options) {
            return camelize(await rest.makeRequest('GET', url, options));
        },
        async post (url, options) {
            return camelize(await rest.makeRequest('POST', url, options));
        },
        async delete (url, options) {
            camelize(await rest.makeRequest('DELETE', url, options));
        },
        async patch (url, options) {
            return camelize(await rest.makeRequest('PATCH', url, options));
        },
        async put (url, options) {
            return camelize(await rest.makeRequest('PUT', url, options));
        },
        async addReaction (channelId, messageId, reaction) {
            reaction = processReactionString(reaction);
            await rest.put(rest.routes.channels.reactions.bot(channelId, messageId, reaction));
        },
        async addReactions (channelId, messageId, reactions, ordered = false) {
            if (!ordered) {
                await Promise.all(reactions.map(async (reaction)=>{
                    await rest.addReaction(channelId, messageId, reaction);
                }));
                return;
            }
            for (const reaction of reactions){
                await rest.addReaction(channelId, messageId, reaction);
            }
        },
        async addRole (guildId, userId, roleId, reason) {
            await rest.put(rest.routes.guilds.roles.member(guildId, userId, roleId), {
                reason
            });
        },
        async addThreadMember (channelId, userId) {
            await rest.put(rest.routes.channels.threads.user(channelId, userId));
        },
        async addDmRecipient (channelId, userId, body) {
            await rest.put(rest.routes.channels.dmRecipient(channelId, userId), {
                body
            });
        },
        async createAutomodRule (guildId, body, reason) {
            return await rest.post(rest.routes.guilds.automod.rules(guildId), {
                body,
                reason
            });
        },
        async createChannel (guildId, body, reason) {
            return await rest.post(rest.routes.guilds.channels(guildId), {
                body,
                reason
            });
        },
        async createEmoji (guildId, body, reason) {
            return await rest.post(rest.routes.guilds.emojis(guildId), {
                body,
                reason
            });
        },
        async createApplicationEmoji (body) {
            return await rest.post(rest.routes.applicationEmojis(rest.applicationId), {
                body
            });
        },
        async createGlobalApplicationCommand (body, options) {
            const restOptions = {
                body
            };
            if (options?.bearerToken) {
                restOptions.unauthorized = true;
                restOptions.headers = {
                    authorization: `Bearer ${options.bearerToken}`
                };
            }
            return await rest.post(rest.routes.interactions.commands.commands(rest.applicationId), restOptions);
        },
        async createGuildApplicationCommand (body, guildId, options) {
            const restOptions = {
                body
            };
            if (options?.bearerToken) {
                restOptions.unauthorized = true;
                restOptions.headers = {
                    authorization: `Bearer ${options.bearerToken}`
                };
            }
            return await rest.post(rest.routes.interactions.commands.guilds.all(rest.applicationId, guildId), restOptions);
        },
        async createGuildSticker (guildId, options, reason) {
            const form = new FormData();
            form.append('file', options.file.blob, options.file.name);
            form.append('name', options.name);
            form.append('description', options.description);
            form.append('tags', options.tags);
            return await rest.post(rest.routes.guilds.stickers(guildId), {
                body: form,
                reason
            });
        },
        async createGuildTemplate (guildId, body) {
            return await rest.post(rest.routes.guilds.templates.all(guildId), {
                body
            });
        },
        async createForumThread (channelId, body, reason) {
            return await rest.post(rest.routes.channels.forum(channelId), {
                body,
                files: body.files,
                reason
            });
        },
        async createInvite (channelId, body = {}, reason) {
            return await rest.post(rest.routes.channels.invites(channelId), {
                body,
                reason
            });
        },
        async createRole (guildId, body, reason) {
            return await rest.post(rest.routes.guilds.roles.all(guildId), {
                body,
                reason
            });
        },
        async createScheduledEvent (guildId, body, reason) {
            return await rest.post(rest.routes.guilds.events.events(guildId), {
                body,
                reason
            });
        },
        async createStageInstance (body, reason) {
            return await rest.post(rest.routes.channels.stages(), {
                body,
                reason
            });
        },
        async createWebhook (channelId, options, reason) {
            return await rest.post(rest.routes.channels.webhooks(channelId), {
                body: {
                    name: options.name,
                    avatar: options.avatar ? await urlToBase64(options.avatar) : undefined
                },
                reason
            });
        },
        async deleteAutomodRule (guildId, ruleId, reason) {
            await rest.delete(rest.routes.guilds.automod.rule(guildId, ruleId), {
                reason
            });
        },
        async deleteChannel (channelId, reason) {
            await rest.delete(rest.routes.channels.channel(channelId), {
                reason
            });
        },
        async deleteChannelPermissionOverride (channelId, overwriteId, reason) {
            await rest.delete(rest.routes.channels.overwrite(channelId, overwriteId), {
                reason
            });
        },
        async deleteEmoji (guildId, id, reason) {
            await rest.delete(rest.routes.guilds.emoji(guildId, id), {
                reason
            });
        },
        async deleteApplicationEmoji (id) {
            await rest.delete(rest.routes.applicationEmoji(rest.applicationId, id));
        },
        async deleteFollowupMessage (token, messageId) {
            await rest.delete(rest.routes.interactions.responses.message(rest.applicationId, token, messageId), {
                unauthorized: true
            });
        },
        async deleteGlobalApplicationCommand (commandId) {
            await rest.delete(rest.routes.interactions.commands.command(rest.applicationId, commandId));
        },
        async deleteGuildApplicationCommand (commandId, guildId) {
            await rest.delete(rest.routes.interactions.commands.guilds.one(rest.applicationId, guildId, commandId));
        },
        async deleteGuildSticker (guildId, stickerId, reason) {
            await rest.delete(rest.routes.guilds.sticker(guildId, stickerId), {
                reason
            });
        },
        async deleteGuildTemplate (guildId, templateCode) {
            await rest.delete(rest.routes.guilds.templates.guild(guildId, templateCode));
        },
        async deleteIntegration (guildId, integrationId, reason) {
            await rest.delete(rest.routes.guilds.integration(guildId, integrationId), {
                reason
            });
        },
        async deleteInvite (inviteCode, reason) {
            await rest.delete(rest.routes.guilds.invite(inviteCode), {
                reason
            });
        },
        async deleteMessage (channelId, messageId, reason) {
            await rest.delete(rest.routes.channels.message(channelId, messageId), {
                reason
            });
        },
        async deleteMessages (channelId, messageIds, reason) {
            await rest.post(rest.routes.channels.bulk(channelId), {
                body: {
                    messages: messageIds.slice(0, 100).map((id)=>id.toString())
                },
                reason
            });
        },
        async deleteOriginalInteractionResponse (token) {
            await rest.delete(rest.routes.interactions.responses.original(rest.applicationId, token), {
                unauthorized: true
            });
        },
        async deleteOwnReaction (channelId, messageId, reaction) {
            reaction = processReactionString(reaction);
            await rest.delete(rest.routes.channels.reactions.bot(channelId, messageId, reaction));
        },
        async deleteReactionsAll (channelId, messageId) {
            await rest.delete(rest.routes.channels.reactions.all(channelId, messageId));
        },
        async deleteReactionsEmoji (channelId, messageId, reaction) {
            reaction = processReactionString(reaction);
            await rest.delete(rest.routes.channels.reactions.emoji(channelId, messageId, reaction));
        },
        async deleteRole (guildId, roleId, reason) {
            await rest.delete(rest.routes.guilds.roles.one(guildId, roleId), {
                reason
            });
        },
        async deleteScheduledEvent (guildId, eventId) {
            await rest.delete(rest.routes.guilds.events.event(guildId, eventId));
        },
        async deleteStageInstance (channelId, reason) {
            await rest.delete(rest.routes.channels.stage(channelId), {
                reason
            });
        },
        async deleteUserReaction (channelId, messageId, userId, reaction) {
            reaction = processReactionString(reaction);
            await rest.delete(rest.routes.channels.reactions.user(channelId, messageId, reaction, userId));
        },
        async deleteWebhook (webhookId, reason) {
            await rest.delete(rest.routes.webhooks.id(webhookId), {
                reason
            });
        },
        async deleteWebhookMessage (webhookId, token, messageId, options) {
            await rest.delete(rest.routes.webhooks.message(webhookId, token, messageId, options), {
                unauthorized: true
            });
        },
        async deleteWebhookWithToken (webhookId, token) {
            await rest.delete(rest.routes.webhooks.webhook(webhookId, token), {
                unauthorized: true
            });
        },
        async editApplicationCommandPermissions (guildId, commandId, bearerToken, permissions) {
            return await rest.put(rest.routes.interactions.commands.permission(rest.applicationId, guildId, commandId), {
                body: {
                    permissions
                },
                headers: {
                    authorization: `Bearer ${bearerToken}`
                }
            });
        },
        async editAutomodRule (guildId, ruleId, body, reason) {
            return await rest.patch(rest.routes.guilds.automod.rule(guildId, ruleId), {
                body,
                reason
            });
        },
        async editBotProfile (options) {
            const avatar = options?.botAvatarURL ? await urlToBase64(options?.botAvatarURL) : options?.botAvatarURL;
            const banner = options?.botBannerURL ? await urlToBase64(options?.botBannerURL) : options?.botBannerURL;
            return await rest.patch(rest.routes.currentUser(), {
                body: {
                    username: options.username?.trim(),
                    avatar,
                    banner
                }
            });
        },
        async editChannel (channelId, body, reason) {
            return await rest.patch(rest.routes.channels.channel(channelId), {
                body,
                reason
            });
        },
        async editChannelPermissionOverrides (channelId, body, reason) {
            await rest.put(rest.routes.channels.overwrite(channelId, body.id), {
                body,
                reason
            });
        },
        async editChannelPositions (guildId, body) {
            await rest.patch(rest.routes.guilds.channels(guildId), {
                body
            });
        },
        async editEmoji (guildId, id, body, reason) {
            return await rest.patch(rest.routes.guilds.emoji(guildId, id), {
                body,
                reason
            });
        },
        async editApplicationEmoji (id, body) {
            return await rest.patch(rest.routes.applicationEmoji(rest.applicationId, id), {
                body
            });
        },
        async editFollowupMessage (token, messageId, body) {
            return await rest.patch(rest.routes.interactions.responses.message(rest.applicationId, token, messageId), {
                body,
                files: body.files,
                unauthorized: true
            });
        },
        async editGlobalApplicationCommand (commandId, body) {
            return await rest.patch(rest.routes.interactions.commands.command(rest.applicationId, commandId), {
                body
            });
        },
        async editGuild (guildId, body, reason) {
            return await rest.patch(rest.routes.guilds.guild(guildId), {
                body,
                reason
            });
        },
        async editGuildApplicationCommand (commandId, guildId, body) {
            return await rest.patch(rest.routes.interactions.commands.guilds.one(rest.applicationId, guildId, commandId), {
                body
            });
        },
        async editGuildSticker (guildId, stickerId, body, reason) {
            return await rest.patch(rest.routes.guilds.sticker(guildId, stickerId), {
                body,
                reason
            });
        },
        async editGuildTemplate (guildId, templateCode, body) {
            return await rest.patch(rest.routes.guilds.templates.guild(guildId, templateCode), {
                body
            });
        },
        async editMessage (channelId, messageId, body) {
            return await rest.patch(rest.routes.channels.message(channelId, messageId), {
                body,
                files: body.files
            });
        },
        async editOriginalInteractionResponse (token, body) {
            return await rest.patch(rest.routes.interactions.responses.original(rest.applicationId, token), {
                body,
                files: body.files,
                unauthorized: true
            });
        },
        async editOwnVoiceState (guildId, options) {
            await rest.patch(rest.routes.guilds.voice(guildId), {
                body: {
                    ...options,
                    requestToSpeakTimestamp: options.requestToSpeakTimestamp ? new Date(options.requestToSpeakTimestamp).toISOString() : options.requestToSpeakTimestamp
                }
            });
        },
        async editScheduledEvent (guildId, eventId, body, reason) {
            return await rest.patch(rest.routes.guilds.events.event(guildId, eventId), {
                body,
                reason
            });
        },
        async editRole (guildId, roleId, body, reason) {
            return await rest.patch(rest.routes.guilds.roles.one(guildId, roleId), {
                body,
                reason
            });
        },
        async editRolePositions (guildId, body, reason) {
            return await rest.patch(rest.routes.guilds.roles.all(guildId), {
                body,
                reason
            });
        },
        async editStageInstance (channelId, topic, reason) {
            return await rest.patch(rest.routes.channels.stage(channelId), {
                body: {
                    topic
                },
                reason
            });
        },
        async editUserVoiceState (guildId, options) {
            await rest.patch(rest.routes.guilds.voice(guildId, options.userId), {
                body: options
            });
        },
        async editWebhook (webhookId, body, reason) {
            return await rest.patch(rest.routes.webhooks.id(webhookId), {
                body,
                reason
            });
        },
        async editWebhookMessage (webhookId, token, messageId, options) {
            return await rest.patch(rest.routes.webhooks.message(webhookId, token, messageId, options), {
                body: options,
                files: options.files,
                unauthorized: true
            });
        },
        async editWebhookWithToken (webhookId, token, body) {
            return await rest.patch(rest.routes.webhooks.webhook(webhookId, token), {
                body,
                unauthorized: true
            });
        },
        async editWelcomeScreen (guildId, body, reason) {
            return await rest.patch(rest.routes.guilds.welcome(guildId), {
                body,
                reason
            });
        },
        async editWidgetSettings (guildId, body, reason) {
            return await rest.patch(rest.routes.guilds.widget(guildId), {
                body,
                reason
            });
        },
        async executeWebhook (webhookId, token, options) {
            return await rest.post(rest.routes.webhooks.webhook(webhookId, token, options), {
                body: options,
                unauthorized: true
            });
        },
        async followAnnouncement (sourceChannelId, targetChannelId, reason) {
            return await rest.post(rest.routes.channels.follow(sourceChannelId), {
                body: {
                    webhookChannelId: targetChannelId
                },
                reason
            });
        },
        async getActiveThreads (guildId) {
            return await rest.get(rest.routes.channels.threads.active(guildId));
        },
        async getApplicationCommandPermission (guildId, commandId, options) {
            const restOptions = {};
            if (options?.accessToken) {
                restOptions.unauthorized = true;
                restOptions.headers = {
                    authorization: `Bearer ${options.accessToken}`
                };
            }
            return await rest.get(rest.routes.interactions.commands.permission(options?.applicationId ?? rest.applicationId, guildId, commandId), restOptions);
        },
        async getApplicationCommandPermissions (guildId, options) {
            const restOptions = {};
            if (options?.accessToken) {
                restOptions.unauthorized = true;
                restOptions.headers = {
                    authorization: `Bearer ${options.accessToken}`
                };
            }
            return await rest.get(rest.routes.interactions.commands.permissions(options?.applicationId ?? rest.applicationId, guildId), restOptions);
        },
        async getApplicationInfo () {
            return await rest.get(rest.routes.oauth2.application());
        },
        async editApplicationInfo (body) {
            return await rest.patch(rest.routes.application(), {
                body
            });
        },
        async getCurrentAuthenticationInfo (token) {
            return await rest.get(rest.routes.oauth2.currentAuthorization(), {
                headers: {
                    authorization: `Bearer ${token}`
                },
                unauthorized: true
            });
        },
        async exchangeToken (clientId, clientSecret, body) {
            const basicCredentials = Buffer.from(`${clientId}:${clientSecret}`);
            const restOptions = {
                body,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    authorization: `Basic ${basicCredentials.toString('base64')}`
                },
                runThroughQueue: false,
                unauthorized: true
            };
            if (body.grantType === 'client_credentials') {
                restOptions.body.scope = body.scope.join(' ');
            }
            return await rest.post(rest.routes.oauth2.tokenExchange(), restOptions);
        },
        async revokeToken (clientId, clientSecret, body) {
            const basicCredentials = Buffer.from(`${clientId}:${clientSecret}`);
            await rest.post(rest.routes.oauth2.tokenRevoke(), {
                body,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    authorization: `Basic ${basicCredentials.toString('base64')}`
                },
                unauthorized: true
            });
        },
        async getAuditLog (guildId, options) {
            return await rest.get(rest.routes.guilds.auditlogs(guildId, options));
        },
        async getAutomodRule (guildId, ruleId) {
            return await rest.get(rest.routes.guilds.automod.rule(guildId, ruleId));
        },
        async getAutomodRules (guildId) {
            return await rest.get(rest.routes.guilds.automod.rules(guildId));
        },
        async getAvailableVoiceRegions () {
            return await rest.get(rest.routes.regions());
        },
        async getBan (guildId, userId) {
            return await rest.get(rest.routes.guilds.members.ban(guildId, userId));
        },
        async getBans (guildId, options) {
            return await rest.get(rest.routes.guilds.members.bans(guildId, options));
        },
        async getChannel (id) {
            return await rest.get(rest.routes.channels.channel(id));
        },
        async getChannelInvites (channelId) {
            return await rest.get(rest.routes.channels.invites(channelId));
        },
        async getChannels (guildId) {
            return await rest.get(rest.routes.guilds.channels(guildId));
        },
        async getChannelWebhooks (channelId) {
            return await rest.get(rest.routes.channels.webhooks(channelId));
        },
        async getDmChannel (userId) {
            return await rest.post(rest.routes.channels.dm(), {
                body: {
                    recipientId: userId
                }
            });
        },
        async getGroupDmChannel (body) {
            return await rest.post(rest.routes.channels.dm(), {
                body
            });
        },
        async getEmoji (guildId, emojiId) {
            return await rest.get(rest.routes.guilds.emoji(guildId, emojiId));
        },
        async getApplicationEmoji (emojiId) {
            return await rest.get(rest.routes.applicationEmoji(rest.applicationId, emojiId));
        },
        async getEmojis (guildId) {
            return await rest.get(rest.routes.guilds.emojis(guildId));
        },
        async getApplicationEmojis () {
            return await rest.get(rest.routes.applicationEmojis(rest.applicationId));
        },
        async getFollowupMessage (token, messageId) {
            return await rest.get(rest.routes.interactions.responses.message(rest.applicationId, token, messageId), {
                unauthorized: true
            });
        },
        async getGatewayBot () {
            return await rest.get(rest.routes.gatewayBot());
        },
        async getGlobalApplicationCommand (commandId) {
            return await rest.get(rest.routes.interactions.commands.command(rest.applicationId, commandId));
        },
        async getGlobalApplicationCommands (options) {
            return await rest.get(rest.routes.interactions.commands.commands(rest.applicationId, options?.withLocalizations));
        },
        async getGuild (guildId, options = {
            counts: true
        }) {
            return await rest.get(rest.routes.guilds.guild(guildId, options.counts));
        },
        async getGuilds (token, options) {
            const makeRequestOptions = token ? {
                headers: {
                    authorization: `Bearer ${token}`
                },
                unauthorized: true
            } : undefined;
            return await rest.get(rest.routes.guilds.userGuilds(options), makeRequestOptions);
        },
        async getGuildApplicationCommand (commandId, guildId) {
            return await rest.get(rest.routes.interactions.commands.guilds.one(rest.applicationId, guildId, commandId));
        },
        async getGuildApplicationCommands (guildId, options) {
            return await rest.get(rest.routes.interactions.commands.guilds.all(rest.applicationId, guildId, options?.withLocalizations));
        },
        async getGuildPreview (guildId) {
            return await rest.get(rest.routes.guilds.preview(guildId));
        },
        async getGuildTemplate (templateCode) {
            return await rest.get(rest.routes.guilds.templates.code(templateCode));
        },
        async getGuildTemplates (guildId) {
            return await rest.get(rest.routes.guilds.templates.all(guildId));
        },
        async getGuildWebhooks (guildId) {
            return await rest.get(rest.routes.guilds.webhooks(guildId));
        },
        async getIntegrations (guildId) {
            return await rest.get(rest.routes.guilds.integrations(guildId));
        },
        async getInvite (inviteCode, options) {
            return await rest.get(rest.routes.guilds.invite(inviteCode, options));
        },
        async getInvites (guildId) {
            return await rest.get(rest.routes.guilds.invites(guildId));
        },
        async getMessage (channelId, messageId) {
            return await rest.get(rest.routes.channels.message(channelId, messageId));
        },
        async getMessages (channelId, options) {
            return await rest.get(rest.routes.channels.messages(channelId, options));
        },
        async getStickerPack (stickerPackId) {
            return await rest.get(rest.routes.stickerPack(stickerPackId));
        },
        async getStickerPacks () {
            return await rest.get(rest.routes.stickerPacks());
        },
        async getOriginalInteractionResponse (token) {
            return await rest.get(rest.routes.interactions.responses.original(rest.applicationId, token), {
                unauthorized: true
            });
        },
        async getChannelPins (channelId, options) {
            return await rest.get(rest.routes.channels.messagePins(channelId, options));
        },
        async getPinnedMessages (channelId) {
            return await rest.get(rest.routes.channels.pins(channelId));
        },
        async getPrivateArchivedThreads (channelId, options) {
            return await rest.get(rest.routes.channels.threads.private(channelId, options));
        },
        async getPrivateJoinedArchivedThreads (channelId, options) {
            return await rest.get(rest.routes.channels.threads.joined(channelId, options));
        },
        async getPruneCount (guildId, options) {
            return await rest.get(rest.routes.guilds.prune(guildId, options));
        },
        async getPublicArchivedThreads (channelId, options) {
            return await rest.get(rest.routes.channels.threads.public(channelId, options));
        },
        async getRoles (guildId) {
            return await rest.get(rest.routes.guilds.roles.all(guildId));
        },
        async getRole (guildId, roleId) {
            return await rest.get(rest.routes.guilds.roles.one(guildId, roleId));
        },
        async getScheduledEvent (guildId, eventId, options) {
            return await rest.get(rest.routes.guilds.events.event(guildId, eventId, options?.withUserCount));
        },
        async getScheduledEvents (guildId, options) {
            return await rest.get(rest.routes.guilds.events.events(guildId, options?.withUserCount));
        },
        async getScheduledEventUsers (guildId, eventId, options) {
            return await rest.get(rest.routes.guilds.events.users(guildId, eventId, options));
        },
        async getSessionInfo () {
            return await rest.getGatewayBot();
        },
        async getStageInstance (channelId) {
            return await rest.get(rest.routes.channels.stage(channelId));
        },
        async getOwnVoiceState (guildId) {
            return await rest.get(rest.routes.guilds.voice(guildId));
        },
        async getUserVoiceState (guildId, userId) {
            return await rest.get(rest.routes.guilds.voice(guildId, userId));
        },
        async getSticker (stickerId) {
            return await rest.get(rest.routes.sticker(stickerId));
        },
        async getGuildSticker (guildId, stickerId) {
            return await rest.get(rest.routes.guilds.sticker(guildId, stickerId));
        },
        async getGuildStickers (guildId) {
            return await rest.get(rest.routes.guilds.stickers(guildId));
        },
        async getThreadMember (channelId, userId, options) {
            return await rest.get(rest.routes.channels.threads.getUser(channelId, userId, options));
        },
        async getThreadMembers (channelId, options) {
            return await rest.get(rest.routes.channels.threads.members(channelId, options));
        },
        async getReactions (channelId, messageId, reaction, options) {
            return await rest.get(rest.routes.channels.reactions.message(channelId, messageId, reaction, options));
        },
        async getUser (id) {
            return await rest.get(rest.routes.user(id));
        },
        async getCurrentUser (token) {
            return await rest.get(rest.routes.currentUser(), {
                headers: {
                    authorization: `Bearer ${token}`
                },
                unauthorized: true
            });
        },
        async getUserConnections (token) {
            return await rest.get(rest.routes.oauth2.connections(), {
                headers: {
                    authorization: `Bearer ${token}`
                },
                unauthorized: true
            });
        },
        async getUserApplicationRoleConnection (token, applicationId) {
            return await rest.get(rest.routes.oauth2.roleConnections(applicationId), {
                headers: {
                    authorization: `Bearer ${token}`
                },
                unauthorized: true
            });
        },
        async getVanityUrl (guildId) {
            return await rest.get(rest.routes.guilds.vanity(guildId));
        },
        async getVoiceRegions (guildId) {
            return await rest.get(rest.routes.guilds.regions(guildId));
        },
        async getWebhook (webhookId) {
            return await rest.get(rest.routes.webhooks.id(webhookId));
        },
        async getWebhookMessage (webhookId, token, messageId, options) {
            return await rest.get(rest.routes.webhooks.message(webhookId, token, messageId, options), {
                unauthorized: true
            });
        },
        async getWebhookWithToken (webhookId, token) {
            return await rest.get(rest.routes.webhooks.webhook(webhookId, token), {
                unauthorized: true
            });
        },
        async getWelcomeScreen (guildId) {
            return await rest.get(rest.routes.guilds.welcome(guildId));
        },
        async getWidget (guildId) {
            return await rest.get(rest.routes.guilds.widgetJson(guildId));
        },
        async getWidgetSettings (guildId) {
            return await rest.get(rest.routes.guilds.widget(guildId));
        },
        async joinThread (channelId) {
            await rest.put(rest.routes.channels.threads.me(channelId));
        },
        async leaveGuild (guildId) {
            await rest.delete(rest.routes.guilds.leave(guildId));
        },
        async leaveThread (channelId) {
            await rest.delete(rest.routes.channels.threads.me(channelId));
        },
        async publishMessage (channelId, messageId) {
            return await rest.post(rest.routes.channels.crosspost(channelId, messageId));
        },
        async removeRole (guildId, userId, roleId, reason) {
            await rest.delete(rest.routes.guilds.roles.member(guildId, userId, roleId), {
                reason
            });
        },
        async removeThreadMember (channelId, userId) {
            await rest.delete(rest.routes.channels.threads.user(channelId, userId));
        },
        async removeDmRecipient (channelId, userId) {
            await rest.delete(rest.routes.channels.dmRecipient(channelId, userId));
        },
        async sendFollowupMessage (token, options) {
            return await rest.post(rest.routes.webhooks.webhook(rest.applicationId, token), {
                body: options,
                files: options.files,
                unauthorized: true
            });
        },
        async sendInteractionResponse (interactionId, token, options, params) {
            return await rest.post(rest.routes.interactions.responses.callback(interactionId, token, params), {
                body: options,
                files: options.data?.files,
                runThroughQueue: false,
                unauthorized: true
            });
        },
        async sendMessage (channelId, body) {
            return await rest.post(rest.routes.channels.messages(channelId), {
                body,
                files: body.files
            });
        },
        async startThreadWithMessage (channelId, messageId, body, reason) {
            return await rest.post(rest.routes.channels.threads.message(channelId, messageId), {
                body,
                reason
            });
        },
        async startThreadWithoutMessage (channelId, body, reason) {
            return await rest.post(rest.routes.channels.threads.all(channelId), {
                body,
                reason
            });
        },
        async getPollAnswerVoters (channelId, messageId, answerId, options) {
            return await rest.get(rest.routes.channels.polls.votes(channelId, messageId, answerId, options));
        },
        async endPoll (channelId, messageId) {
            return await rest.post(rest.routes.channels.polls.expire(channelId, messageId));
        },
        async syncGuildTemplate (guildId) {
            return await rest.put(rest.routes.guilds.templates.all(guildId));
        },
        async banMember (guildId, userId, body, reason) {
            await rest.put(rest.routes.guilds.members.ban(guildId, userId), {
                body,
                reason
            });
        },
        async bulkBanMembers (guildId, options, reason) {
            return await rest.post(rest.routes.guilds.members.bulkBan(guildId), {
                body: options,
                reason
            });
        },
        async editBotMember (guildId, body, reason) {
            return await rest.patch(rest.routes.guilds.members.bot(guildId), {
                body,
                reason
            });
        },
        async editMember (guildId, userId, body, reason) {
            return await rest.patch(rest.routes.guilds.members.member(guildId, userId), {
                body,
                reason
            });
        },
        async getMember (guildId, userId) {
            return await rest.get(rest.routes.guilds.members.member(guildId, userId));
        },
        async getCurrentMember (guildId, token) {
            return await rest.get(rest.routes.guilds.members.currentMember(guildId), {
                headers: {
                    authorization: `Bearer ${token}`
                },
                unauthorized: true
            });
        },
        async getMembers (guildId, options) {
            return await rest.get(rest.routes.guilds.members.members(guildId, options));
        },
        async getApplicationActivityInstance (applicationId, instanceId) {
            return await rest.get(rest.routes.applicationActivityInstance(applicationId, instanceId));
        },
        async kickMember (guildId, userId, reason) {
            await rest.delete(rest.routes.guilds.members.member(guildId, userId), {
                reason
            });
        },
        async pinMessage (channelId, messageId, reason) {
            await rest.put(rest.routes.channels.messagePin(channelId, messageId), {
                reason
            });
        },
        async pruneMembers (guildId, body, reason) {
            return await rest.post(rest.routes.guilds.members.prune(guildId), {
                body,
                reason
            });
        },
        async searchMembers (guildId, query, options) {
            return await rest.get(rest.routes.guilds.members.search(guildId, query, options));
        },
        async getGuildOnboarding (guildId) {
            return await rest.get(rest.routes.guilds.onboarding(guildId));
        },
        async editGuildOnboarding (guildId, options, reason) {
            return await rest.put(rest.routes.guilds.onboarding(guildId), {
                body: options,
                reason
            });
        },
        async modifyGuildIncidentActions (guildId, options) {
            return await rest.put(rest.routes.guilds.incidentActions(guildId), {
                body: options
            });
        },
        async unbanMember (guildId, userId, reason) {
            await rest.delete(rest.routes.guilds.members.ban(guildId, userId), {
                reason
            });
        },
        async unpinMessage (channelId, messageId, reason) {
            await rest.delete(rest.routes.channels.messagePin(channelId, messageId), {
                reason
            });
        },
        async triggerTypingIndicator (channelId) {
            await rest.post(rest.routes.channels.typing(channelId));
        },
        async upsertGlobalApplicationCommands (body, options) {
            const restOptions = {
                body
            };
            if (options?.bearerToken) {
                restOptions.unauthorized = true;
                restOptions.headers = {
                    authorization: `Bearer ${options.bearerToken}`
                };
            }
            return await rest.put(rest.routes.interactions.commands.commands(rest.applicationId), restOptions);
        },
        async upsertGuildApplicationCommands (guildId, body, options) {
            const restOptions = {
                body
            };
            if (options?.bearerToken) {
                restOptions.unauthorized = true;
                restOptions.headers = {
                    authorization: `Bearer ${options.bearerToken}`
                };
            }
            return await rest.put(rest.routes.interactions.commands.guilds.all(rest.applicationId, guildId), restOptions);
        },
        async editUserApplicationRoleConnection (token, applicationId, body) {
            return await rest.put(rest.routes.oauth2.roleConnections(applicationId), {
                body,
                headers: {
                    authorization: `Bearer ${token}`
                },
                unauthorized: true
            });
        },
        async addGuildMember (guildId, userId, body) {
            return await rest.put(rest.routes.guilds.members.member(guildId, userId), {
                body
            });
        },
        async createTestEntitlement (applicationId, body) {
            return await rest.post(rest.routes.monetization.entitlements(applicationId), {
                body
            });
        },
        async listEntitlements (applicationId, options) {
            return await rest.get(rest.routes.monetization.entitlements(applicationId, options));
        },
        async getEntitlement (applicationId, entitlementId) {
            return await rest.get(rest.routes.monetization.entitlement(applicationId, entitlementId));
        },
        async deleteTestEntitlement (applicationId, entitlementId) {
            await rest.delete(rest.routes.monetization.entitlement(applicationId, entitlementId));
        },
        async consumeEntitlement (applicationId, entitlementId) {
            await rest.post(rest.routes.monetization.consumeEntitlement(applicationId, entitlementId));
        },
        async listSkus (applicationId) {
            return await rest.get(rest.routes.monetization.skus(applicationId));
        },
        async listSubscriptions (skuId, options) {
            return await rest.get(rest.routes.monetization.subscriptions(skuId, options));
        },
        async getSubscription (skuId, subscriptionId) {
            return await rest.get(rest.routes.monetization.subscription(skuId, subscriptionId));
        },
        async sendSoundboardSound (channelId, options) {
            await rest.post(rest.routes.soundboard.sendSound(channelId), {
                body: options
            });
        },
        async listDefaultSoundboardSounds () {
            return await rest.get(rest.routes.soundboard.listDefault());
        },
        async listGuildSoundboardSounds (guildId) {
            return await rest.get(rest.routes.soundboard.guildSounds(guildId));
        },
        async getGuildSoundboardSound (guildId, soundId) {
            return await rest.get(rest.routes.soundboard.guildSound(guildId, soundId));
        },
        async createGuildSoundboardSound (guildId, options, reason) {
            return await rest.post(rest.routes.soundboard.guildSounds(guildId), {
                body: options,
                reason
            });
        },
        async modifyGuildSoundboardSound (guildId, soundId, options, reason) {
            return await rest.post(rest.routes.soundboard.guildSound(guildId, soundId), {
                body: options,
                reason
            });
        },
        async deleteGuildSoundboardSound (guildId, soundId, reason) {
            return await rest.delete(rest.routes.soundboard.guildSound(guildId, soundId), {
                reason
            });
        },
        async listApplicationRoleConnectionsMetadataRecords (applicationId) {
            return await rest.get(rest.routes.applicationRoleConnectionMetadata(applicationId));
        },
        async updateApplicationRoleConnectionsMetadataRecords (applicationId, options) {
            return await rest.put(rest.routes.applicationRoleConnectionMetadata(applicationId), {
                body: options
            });
        },
        async createLobby (options) {
            return await rest.post(rest.routes.lobby.create(), {
                body: options
            });
        },
        async getLobby (lobbyId) {
            return await rest.get(rest.routes.lobby.lobby(lobbyId));
        },
        async modifyLobby (lobbyId, options) {
            return await rest.patch(rest.routes.lobby.lobby(lobbyId), {
                body: options
            });
        },
        async deleteLobby (lobbyId) {
            return await rest.delete(rest.routes.lobby.lobby(lobbyId));
        },
        async addMemberToLobby (lobbyId, userId, options) {
            return await rest.put(rest.routes.lobby.member(lobbyId, userId), {
                body: options
            });
        },
        async removeMemberFromLobby (lobbyId, userId) {
            return await rest.delete(rest.routes.lobby.member(lobbyId, userId));
        },
        async leaveLobby (lobbyId, bearerToken) {
            return await rest.delete(rest.routes.lobby.leave(lobbyId), {
                headers: {
                    authorization: `Bearer ${bearerToken}`
                },
                unauthorized: true
            });
        },
        async linkChannelToLobby (lobbyId, bearerToken, options) {
            return await rest.patch(rest.routes.lobby.link(lobbyId), {
                body: options,
                headers: {
                    authorization: `Bearer ${bearerToken}`
                },
                unauthorized: true
            });
        },
        async unlinkChannelToLobby (lobbyId, bearerToken) {
            return await rest.patch(rest.routes.lobby.link(lobbyId), {
                headers: {
                    authorization: `Bearer ${bearerToken}`
                },
                unauthorized: true
            });
        },
        preferSnakeCase (enabled) {
            const camelizer = enabled ? (x)=>x : camelize;
            rest.get = async (url, options)=>{
                return camelizer(await rest.makeRequest('GET', url, options));
            };
            rest.post = async (url, options)=>{
                return camelizer(await rest.makeRequest('POST', url, options));
            };
            rest.delete = async (url, options)=>{
                camelizer(await rest.makeRequest('DELETE', url, options));
            };
            rest.patch = async (url, options)=>{
                return camelizer(await rest.makeRequest('PATCH', url, options));
            };
            rest.put = async (url, options)=>{
                return camelizer(await rest.makeRequest('PUT', url, options));
            };
            return rest;
        }
    };
    return rest;
}
var HttpResponseCode = /*#__PURE__*/ function(HttpResponseCode) {
    /** Minimum value of a code in oder to consider that it was successful. */ HttpResponseCode[HttpResponseCode["Success"] = 200] = "Success";
    /** Request completed successfully, but Discord returned an empty body. */ HttpResponseCode[HttpResponseCode["NoContent"] = 204] = "NoContent";
    /** Minimum value of a code in order to consider that something went wrong. */ HttpResponseCode[HttpResponseCode["Error"] = 400] = "Error";
    /** This request got rate limited. */ HttpResponseCode[HttpResponseCode["TooManyRequests"] = 429] = "TooManyRequests";
    return HttpResponseCode;
}(HttpResponseCode || {});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYW5hZ2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ25vZGU6YnVmZmVyJ1xuaW1wb3J0IHsgdHlwZSBJbnNwZWN0T3B0aW9ucywgaW5zcGVjdCB9IGZyb20gJ25vZGU6dXRpbCdcbmltcG9ydCB0eXBlIHtcbiAgQmlnU3RyaW5nLFxuICBDYW1lbGl6ZSxcbiAgRGlzY29yZEFjY2Vzc1Rva2VuUmVzcG9uc2UsXG4gIERpc2NvcmRBY3Rpdml0eUluc3RhbmNlLFxuICBEaXNjb3JkQXBwbGljYXRpb24sXG4gIERpc2NvcmRBcHBsaWNhdGlvbkNvbW1hbmQsXG4gIERpc2NvcmRBcHBsaWNhdGlvblJvbGVDb25uZWN0aW9uLFxuICBEaXNjb3JkQXBwbGljYXRpb25Sb2xlQ29ubmVjdGlvbk1ldGFkYXRhLFxuICBEaXNjb3JkQXVkaXRMb2csXG4gIERpc2NvcmRBdXRvTW9kZXJhdGlvblJ1bGUsXG4gIERpc2NvcmRCYW4sXG4gIERpc2NvcmRCdWxrQmFuLFxuICBEaXNjb3JkQ2hhbm5lbCxcbiAgRGlzY29yZENvbm5lY3Rpb24sXG4gIERpc2NvcmRDdXJyZW50QXV0aG9yaXphdGlvbixcbiAgRGlzY29yZEVtb2ppLFxuICBEaXNjb3JkRW50aXRsZW1lbnQsXG4gIERpc2NvcmRGb2xsb3dlZENoYW5uZWwsXG4gIERpc2NvcmRHZXRBbnN3ZXJWb3Rlc1Jlc3BvbnNlLFxuICBEaXNjb3JkR2V0R2F0ZXdheUJvdCxcbiAgRGlzY29yZEd1aWxkLFxuICBEaXNjb3JkR3VpbGRBcHBsaWNhdGlvbkNvbW1hbmRQZXJtaXNzaW9ucyxcbiAgRGlzY29yZEd1aWxkT25ib2FyZGluZyxcbiAgRGlzY29yZEd1aWxkUHJldmlldyxcbiAgRGlzY29yZEd1aWxkV2lkZ2V0LFxuICBEaXNjb3JkR3VpbGRXaWRnZXRTZXR0aW5ncyxcbiAgRGlzY29yZEluY2lkZW50c0RhdGEsXG4gIERpc2NvcmRJbnRlZ3JhdGlvbixcbiAgRGlzY29yZEludGVyYWN0aW9uQ2FsbGJhY2tSZXNwb25zZSxcbiAgRGlzY29yZEludml0ZSxcbiAgRGlzY29yZEludml0ZU1ldGFkYXRhLFxuICBEaXNjb3JkTGlzdEFjdGl2ZVRocmVhZHMsXG4gIERpc2NvcmRMaXN0QXJjaGl2ZWRUaHJlYWRzLFxuICBEaXNjb3JkTG9iYnksXG4gIERpc2NvcmRMb2JieU1lbWJlcixcbiAgRGlzY29yZE1lbWJlcixcbiAgRGlzY29yZE1lbWJlcldpdGhVc2VyLFxuICBEaXNjb3JkTWVzc2FnZSxcbiAgRGlzY29yZFBydW5lZENvdW50LFxuICBEaXNjb3JkUm9sZSxcbiAgRGlzY29yZFNjaGVkdWxlZEV2ZW50LFxuICBEaXNjb3JkU2t1LFxuICBEaXNjb3JkU291bmRib2FyZFNvdW5kLFxuICBEaXNjb3JkU3RhZ2VJbnN0YW5jZSxcbiAgRGlzY29yZFN0aWNrZXIsXG4gIERpc2NvcmRTdGlja2VyUGFjayxcbiAgRGlzY29yZFN1YnNjcmlwdGlvbixcbiAgRGlzY29yZFRlbXBsYXRlLFxuICBEaXNjb3JkVGhyZWFkTWVtYmVyLFxuICBEaXNjb3JkVXNlcixcbiAgRGlzY29yZFZhbml0eVVybCxcbiAgRGlzY29yZFZvaWNlUmVnaW9uLFxuICBEaXNjb3JkVm9pY2VTdGF0ZSxcbiAgRGlzY29yZFdlYmhvb2ssXG4gIERpc2NvcmRXZWxjb21lU2NyZWVuLFxuICBNb2RpZnlHdWlsZFRlbXBsYXRlLFxufSBmcm9tICdAZGlzY29yZGVuby90eXBlcydcbmltcG9ydCB7XG4gIGNhbGN1bGF0ZUJpdHMsXG4gIGNhbWVsaXplLFxuICBjYW1lbFRvU25ha2VDYXNlLFxuICBESVNDT1JERU5PX1ZFUlNJT04sXG4gIGRlbGF5LFxuICBnZXRCb3RJZEZyb21Ub2tlbixcbiAgaGFzUHJvcGVydHksXG4gIGxvZ2dlcixcbiAgcHJvY2Vzc1JlYWN0aW9uU3RyaW5nLFxuICBzbm93Zmxha2VUb1RpbWVzdGFtcCxcbiAgdXJsVG9CYXNlNjQsXG59IGZyb20gJ0BkaXNjb3JkZW5vL3V0aWxzJ1xuaW1wb3J0IHsgY3JlYXRlSW52YWxpZFJlcXVlc3RCdWNrZXQgfSBmcm9tICcuL2ludmFsaWRCdWNrZXQuanMnXG5pbXBvcnQgeyBRdWV1ZSB9IGZyb20gJy4vcXVldWUuanMnXG5pbXBvcnQgeyBjcmVhdGVSb3V0ZXMgfSBmcm9tICcuL3JvdXRlcy5qcydcbmltcG9ydCB0eXBlIHsgQ3JlYXRlUmVxdWVzdEJvZHlPcHRpb25zLCBDcmVhdGVSZXN0TWFuYWdlck9wdGlvbnMsIE1ha2VSZXF1ZXN0T3B0aW9ucywgUmVzdE1hbmFnZXIsIFNlbmRSZXF1ZXN0T3B0aW9ucyB9IGZyb20gJy4vdHlwZXMuanMnXG5cbmV4cG9ydCBjb25zdCBESVNDT1JEX0FQSV9WRVJTSU9OID0gMTBcbmV4cG9ydCBjb25zdCBESVNDT1JEX0FQSV9VUkwgPSAnaHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGknXG5cbmV4cG9ydCBjb25zdCBBVURJVF9MT0dfUkVBU09OX0hFQURFUiA9ICd4LWF1ZGl0LWxvZy1yZWFzb24nXG5leHBvcnQgY29uc3QgUkFURV9MSU1JVF9SRU1BSU5JTkdfSEVBREVSID0gJ3gtcmF0ZWxpbWl0LXJlbWFpbmluZydcbmV4cG9ydCBjb25zdCBSQVRFX0xJTUlUX1JFU0VUX0FGVEVSX0hFQURFUiA9ICd4LXJhdGVsaW1pdC1yZXNldC1hZnRlcidcbmV4cG9ydCBjb25zdCBSQVRFX0xJTUlUX0dMT0JBTF9IRUFERVIgPSAneC1yYXRlbGltaXQtZ2xvYmFsJ1xuZXhwb3J0IGNvbnN0IFJBVEVfTElNSVRfQlVDS0VUX0hFQURFUiA9ICd4LXJhdGVsaW1pdC1idWNrZXQnXG5leHBvcnQgY29uc3QgUkFURV9MSU1JVF9MSU1JVF9IRUFERVIgPSAneC1yYXRlbGltaXQtbGltaXQnXG5leHBvcnQgY29uc3QgUkFURV9MSU1JVF9TQ09QRV9IRUFERVIgPSAneC1yYXRlbGltaXQtc2NvcGUnXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZXN0TWFuYWdlcihvcHRpb25zOiBDcmVhdGVSZXN0TWFuYWdlck9wdGlvbnMpOiBSZXN0TWFuYWdlciB7XG4gIGNvbnN0IGFwcGxpY2F0aW9uSWQgPSBvcHRpb25zLmFwcGxpY2F0aW9uSWQgPyBCaWdJbnQob3B0aW9ucy5hcHBsaWNhdGlvbklkKSA6IGdldEJvdElkRnJvbVRva2VuKG9wdGlvbnMudG9rZW4pXG5cbiAgY29uc3QgYmFzZVVybCA9IG9wdGlvbnMucHJveHk/LmJhc2VVcmwgPz8gRElTQ09SRF9BUElfVVJMXG4gIC8vIERpc2NvcmQgZXJyb3IgY2FuIGdldCBuZXN0ZWQgYSBsb3QsIHNvIHdlIHVzZSBhIGN1c3RvbSBpbnNwZWN0IHRvIGNoYW5nZSB0aGUgZGVwdGggdG8gSW5maW5pdHlcbiAgY29uc3QgYmFzZUVycm9yUHJvdG90eXBlID0ge1xuICAgIFtpbnNwZWN0LmN1c3RvbV0oX2RlcHRoOiBudW1iZXIsIG9wdGlvbnM6IEluc3BlY3RPcHRpb25zLCBfaW5zcGVjdDogdHlwZW9mIGluc3BlY3QpIHtcbiAgICAgIHJldHVybiBfaW5zcGVjdCh0aGlzLCB7XG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIGRlcHRoOiBJbmZpbml0eSxcbiAgICAgICAgLy8gU2luY2Ugd2UgY2FsbCBpbnNwZWN0IG9uIG91cnNlbGYsIHdlIG5lZWQgdG8gZGlzYWJsZSB0aGUgY2FsbHMgdG8gdGhlIGluc3BlY3QuY3VzdG9tIHN5bWJvbCBvciBlbHNlIGl0IHdpbGwgY2F1c2UgYW4gaW5maW5pdGUgbG9vcC5cbiAgICAgICAgY3VzdG9tSW5zcGVjdDogZmFsc2UsXG4gICAgICB9KVxuICAgIH0sXG4gIH1cblxuICBjb25zdCByZXN0OiBSZXN0TWFuYWdlciA9IHtcbiAgICBhcHBsaWNhdGlvbklkLFxuICAgIGF1dGhvcml6YXRpb246IG9wdGlvbnMucHJveHk/LmF1dGhvcml6YXRpb24sXG4gICAgYXV0aG9yaXphdGlvbkhlYWRlcjogb3B0aW9ucy5wcm94eT8uYXV0aG9yaXphdGlvbkhlYWRlciA/PyAnYXV0aG9yaXphdGlvbicsXG4gICAgYmFzZVVybCxcbiAgICBkZWxldGVRdWV1ZURlbGF5OiA2MDAwMCxcbiAgICBnbG9iYWxseVJhdGVMaW1pdGVkOiBmYWxzZSxcbiAgICBpbnZhbGlkQnVja2V0OiBjcmVhdGVJbnZhbGlkUmVxdWVzdEJ1Y2tldCh7IGxvZ2dlcjogb3B0aW9ucy5sb2dnZXIgfSksXG4gICAgaXNQcm94aWVkOiAhYmFzZVVybC5zdGFydHNXaXRoKERJU0NPUkRfQVBJX1VSTCksXG4gICAgdXBkYXRlQmVhcmVyVG9rZW5FbmRwb2ludDogb3B0aW9ucy5wcm94eT8udXBkYXRlQmVhcmVyVG9rZW5FbmRwb2ludCxcbiAgICBtYXhSZXRyeUNvdW50OiBJbmZpbml0eSxcbiAgICBwcm9jZXNzaW5nUmF0ZUxpbWl0ZWRQYXRoczogZmFsc2UsXG4gICAgcXVldWVzOiBuZXcgTWFwKCksXG4gICAgcmF0ZUxpbWl0ZWRQYXRoczogbmV3IE1hcCgpLFxuICAgIHRva2VuOiBvcHRpb25zLnRva2VuLFxuICAgIHZlcnNpb246IG9wdGlvbnMudmVyc2lvbiA/PyBESVNDT1JEX0FQSV9WRVJTSU9OLFxuICAgIGxvZ2dlcjogb3B0aW9ucy5sb2dnZXIgPz8gbG9nZ2VyLFxuICAgIGV2ZW50czoge1xuICAgICAgcmVxdWVzdDogKCkgPT4ge30sXG4gICAgICByZXNwb25zZTogKCkgPT4ge30sXG4gICAgICByZXF1ZXN0RXJyb3I6ICgpID0+IHt9LFxuICAgICAgLi4ub3B0aW9ucy5ldmVudHMsXG4gICAgfSxcblxuICAgIHJvdXRlczogY3JlYXRlUm91dGVzKCksXG5cbiAgICBjcmVhdGVCYXNlSGVhZGVycygpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgICd1c2VyLWFnZW50JzogYERpc2NvcmRCb3QgKGh0dHBzOi8vZ2l0aHViLmNvbS9kaXNjb3JkZW5vL2Rpc2NvcmRlbm8sIHYke0RJU0NPUkRFTk9fVkVSU0lPTn0pYCxcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgY2hlY2tSYXRlTGltaXRzKHVybCwgaWRlbnRpZmllcikge1xuICAgICAgY29uc3QgcmF0ZWxpbWl0ZWQgPSByZXN0LnJhdGVMaW1pdGVkUGF0aHMuZ2V0KGAke2lkZW50aWZpZXJ9JHt1cmx9YClcblxuICAgICAgY29uc3QgZ2xvYmFsID0gcmVzdC5yYXRlTGltaXRlZFBhdGhzLmdldCgnZ2xvYmFsJylcbiAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KClcblxuICAgICAgaWYgKHJhdGVsaW1pdGVkICYmIG5vdyA8IHJhdGVsaW1pdGVkLnJlc2V0VGltZXN0YW1wKSB7XG4gICAgICAgIHJldHVybiByYXRlbGltaXRlZC5yZXNldFRpbWVzdGFtcCAtIG5vd1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYmFsICYmIG5vdyA8IGdsb2JhbC5yZXNldFRpbWVzdGFtcCkge1xuICAgICAgICByZXR1cm4gZ2xvYmFsLnJlc2V0VGltZXN0YW1wIC0gbm93XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0sXG5cbiAgICBhc3luYyB1cGRhdGVUb2tlblF1ZXVlcyhvbGRUb2tlbiwgbmV3VG9rZW4pIHtcbiAgICAgIGlmIChyZXN0LmlzUHJveGllZCkge1xuICAgICAgICBpZiAoIXJlc3QudXBkYXRlQmVhcmVyVG9rZW5FbmRwb2ludCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIFwiVGhlICdwcm94eS51cGRhdGVCZWFyZXJUb2tlbkVuZHBvaW50JyBvcHRpb24gbmVlZHMgdG8gYmUgc2V0IHdoZW4gdXNpbmcgYSByZXN0IHByb3h5IGFuZCBuZWVkZWQgdG8gY2FsbCAndXBkYXRlVG9rZW5RdWV1ZXMnXCIsXG4gICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAgICAgICAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz5cblxuICAgICAgICBpZiAocmVzdC5hdXRob3JpemF0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBoZWFkZXJzW3Jlc3QuYXV0aG9yaXphdGlvbkhlYWRlcl0gPSByZXN0LmF1dGhvcml6YXRpb25cbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGZldGNoKGAke3Jlc3QuYmFzZVVybH0vJHtyZXN0LnVwZGF0ZUJlYXJlclRva2VuRW5kcG9pbnR9YCwge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIG9sZFRva2VuLFxuICAgICAgICAgICAgbmV3VG9rZW4sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV3SWRlbnRpZmllciA9IGBCZWFyZXIgJHtuZXdUb2tlbn1gXG5cbiAgICAgIC8vIFVwZGF0ZSBhbGwgdGhlIHF1ZXVlc1xuICAgICAgZm9yIChjb25zdCBba2V5LCBxdWV1ZV0gb2YgcmVzdC5xdWV1ZXMuZW50cmllcygpKSB7XG4gICAgICAgIGlmICgha2V5LnN0YXJ0c1dpdGgoYEJlYXJlciAke29sZFRva2VufWApKSBjb250aW51ZVxuXG4gICAgICAgIHJlc3QucXVldWVzLmRlbGV0ZShrZXkpXG4gICAgICAgIHF1ZXVlLmlkZW50aWZpZXIgPSBuZXdJZGVudGlmaWVyXG5cbiAgICAgICAgY29uc3QgbmV3S2V5ID0gYCR7bmV3SWRlbnRpZmllcn0ke3F1ZXVlLnVybH1gXG4gICAgICAgIGNvbnN0IG5ld1F1ZXVlID0gcmVzdC5xdWV1ZXMuZ2V0KG5ld0tleSlcblxuICAgICAgICAvLyBNZXJnZSB0aGUgcXVldWVzXG4gICAgICAgIGlmIChuZXdRdWV1ZSkge1xuICAgICAgICAgIG5ld1F1ZXVlLndhaXRpbmcudW5zaGlmdCguLi5xdWV1ZS53YWl0aW5nKVxuICAgICAgICAgIG5ld1F1ZXVlLnBlbmRpbmcudW5zaGlmdCguLi5xdWV1ZS5wZW5kaW5nKVxuXG4gICAgICAgICAgcXVldWUud2FpdGluZyA9IFtdXG4gICAgICAgICAgcXVldWUucGVuZGluZyA9IFtdXG5cbiAgICAgICAgICBxdWV1ZS5jbGVhbnVwKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN0LnF1ZXVlcy5zZXQobmV3S2V5LCBxdWV1ZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHJhdGVsaW1pdFBhdGhdIG9mIHJlc3QucmF0ZUxpbWl0ZWRQYXRocy5lbnRyaWVzKCkpIHtcbiAgICAgICAgaWYgKCFrZXkuc3RhcnRzV2l0aChgQmVhcmVyICR7b2xkVG9rZW59YCkpIGNvbnRpbnVlXG5cbiAgICAgICAgcmVzdC5yYXRlTGltaXRlZFBhdGhzLnNldChgJHtuZXdJZGVudGlmaWVyfSR7cmF0ZWxpbWl0UGF0aC51cmx9YCwgcmF0ZWxpbWl0UGF0aClcblxuICAgICAgICBpZiAocmF0ZWxpbWl0UGF0aC5idWNrZXRJZCkge1xuICAgICAgICAgIHJlc3QucmF0ZUxpbWl0ZWRQYXRocy5zZXQoYCR7bmV3SWRlbnRpZmllcn0ke3JhdGVsaW1pdFBhdGguYnVja2V0SWR9YCwgcmF0ZWxpbWl0UGF0aClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBjaGFuZ2VUb0Rpc2NvcmRGb3JtYXQob2JqOiBhbnkpOiBhbnkge1xuICAgICAgaWYgKG9iaiA9PT0gbnVsbCkgcmV0dXJuIG51bGxcblxuICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgICByZXR1cm4gb2JqLm1hcCgoaXRlbSkgPT4gcmVzdC5jaGFuZ2VUb0Rpc2NvcmRGb3JtYXQoaXRlbSkpXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuZXdPYmo6IGFueSA9IHt9XG5cbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMob2JqKSkge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV1cblxuICAgICAgICAgIC8vIElmIHRoZSBrZXkgaXMgYWxyZWFkeSBpbiBzbmFrZV9jYXNlIHdlIGNhbiBhc3N1bWUgaXQgaXMgYWxyZWFkeSBpbiB0aGUgZGlzY29yZCBmb3JtYXQuXG4gICAgICAgICAgaWYgKGtleS5pbmNsdWRlcygnXycpKSB7XG4gICAgICAgICAgICBuZXdPYmpba2V5XSA9IHZhbHVlXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFNvbWUgZmFsc3kgdmFsdWVzIHNob3VsZCBiZSBhbGxvd2VkIGxpa2UgbnVsbCBvciAwXG4gICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgICAgICAgIGNhc2UgJ3Blcm1pc3Npb25zJzpcbiAgICAgICAgICAgICAgY2FzZSAnYWxsb3cnOlxuICAgICAgICAgICAgICBjYXNlICdkZW55JzpcbiAgICAgICAgICAgICAgICBuZXdPYmpba2V5XSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZSA6IGNhbGN1bGF0ZUJpdHModmFsdWUpXG4gICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgY2FzZSAnZGVmYXVsdE1lbWJlclBlcm1pc3Npb25zJzpcbiAgICAgICAgICAgICAgICBuZXdPYmouZGVmYXVsdF9tZW1iZXJfcGVybWlzc2lvbnMgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gdmFsdWUgOiBjYWxjdWxhdGVCaXRzKHZhbHVlKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgIGNhc2UgJ25hbWVMb2NhbGl6YXRpb25zJzpcbiAgICAgICAgICAgICAgICBuZXdPYmoubmFtZV9sb2NhbGl6YXRpb25zID0gdmFsdWVcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICBjYXNlICdkZXNjcmlwdGlvbkxvY2FsaXphdGlvbnMnOlxuICAgICAgICAgICAgICAgIG5ld09iai5kZXNjcmlwdGlvbl9sb2NhbGl6YXRpb25zID0gdmFsdWVcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIG5ld09ialtjYW1lbFRvU25ha2VDYXNlKGtleSldID0gcmVzdC5jaGFuZ2VUb0Rpc2NvcmRGb3JtYXQodmFsdWUpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3T2JqXG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnYmlnaW50JykgcmV0dXJuIG9iai50b1N0cmluZygpXG5cbiAgICAgIHJldHVybiBvYmpcbiAgICB9LFxuXG4gICAgY3JlYXRlUmVxdWVzdEJvZHkobWV0aG9kLCBvcHRpb25zKSB7XG4gICAgICBjb25zdCBoZWFkZXJzID0gdGhpcy5jcmVhdGVCYXNlSGVhZGVycygpXG5cbiAgICAgIGlmIChvcHRpb25zPy51bmF1dGhvcml6ZWQgIT09IHRydWUpIGhlYWRlcnMuYXV0aG9yaXphdGlvbiA9IGBCb3QgJHtyZXN0LnRva2VufWBcblxuICAgICAgLy8gSUYgQSBSRUFTT04gSVMgUFJPVklERUQgRU5DT0RFIElUIElOIEhFQURFUlNcbiAgICAgIGlmIChvcHRpb25zPy5yZWFzb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBoZWFkZXJzW0FVRElUX0xPR19SRUFTT05fSEVBREVSXSA9IGVuY29kZVVSSUNvbXBvbmVudChvcHRpb25zPy5yZWFzb24pXG4gICAgICB9XG5cbiAgICAgIGxldCBib2R5OiBzdHJpbmcgfCBGb3JtRGF0YSB8IHVuZGVmaW5lZFxuXG4gICAgICAvLyBIYXZlIHRvIGNoZWNrIGZvciBhdHRhY2htZW50cyBmaXJzdCwgc2luY2UgYm9keSB0aGVuIGhhcyB0byBiZSBzZW5kIGluIGEgZGlmZmVyZW50IHdheS5cbiAgICAgIGlmIChvcHRpb25zPy5maWxlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IGZvcm0gPSBuZXcgRm9ybURhdGEoKVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMuZmlsZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBmb3JtLmFwcGVuZChgZmlsZXNbJHtpfV1gLCBvcHRpb25zLmZpbGVzW2ldLmJsb2IsIG9wdGlvbnMuZmlsZXNbaV0ubmFtZSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhdmUgdG8gdXNlIGNoYW5nZVRvRGlzY29yZEZvcm1hdCBvciBlbHNlIEpTT04uc3RyaW5naWZ5IG1heSB0aHJvdyBhbiBlcnJvciBmb3IgdGhlIHByZXNlbmNlIG9mIEJpZ0ludChzKSBpbiB0aGUganNvblxuICAgICAgICBmb3JtLmFwcGVuZCgncGF5bG9hZF9qc29uJywgSlNPTi5zdHJpbmdpZnkocmVzdC5jaGFuZ2VUb0Rpc2NvcmRGb3JtYXQoeyAuLi5vcHRpb25zLmJvZHksIGZpbGVzOiB1bmRlZmluZWQgfSkpKVxuXG4gICAgICAgIC8vIE5vIG5lZWQgdG8gc2V0IHRoZSBgY29udGVudC10eXBlYCBoZWFkZXIgc2luY2UgYGZldGNoYCBkb2VzIHRoYXQgYXV0b21hdGljYWxseSBmb3IgdXMgd2hlbiB3ZSB1c2UgYSBgRm9ybURhdGFgIG9iamVjdC5cbiAgICAgICAgYm9keSA9IGZvcm1cbiAgICAgIH0gZWxzZSBpZiAob3B0aW9ucz8uYm9keSAmJiBvcHRpb25zLmhlYWRlcnMgJiYgb3B0aW9ucy5oZWFkZXJzWydjb250ZW50LXR5cGUnXSA9PT0gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpIHtcbiAgICAgICAgLy8gT0F1dGgyIGJvZHkgaGFuZGxpbmdcbiAgICAgICAgY29uc3QgZm9ybUJvZHk6IHN0cmluZ1tdID0gW11cblxuICAgICAgICBjb25zdCBkaXNjb3JkQm9keSA9IHJlc3QuY2hhbmdlVG9EaXNjb3JkRm9ybWF0KG9wdGlvbnMuYm9keSlcblxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gZGlzY29yZEJvZHkpIHtcbiAgICAgICAgICBmb3JtQm9keS5wdXNoKGAke2VuY29kZVVSSUNvbXBvbmVudChwcm9wKX09JHtlbmNvZGVVUklDb21wb25lbnQoZGlzY29yZEJvZHlbcHJvcF0pfWApXG4gICAgICAgIH1cblxuICAgICAgICBib2R5ID0gZm9ybUJvZHkuam9pbignJicpXG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbnM/LmJvZHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAob3B0aW9ucy5ib2R5IGluc3RhbmNlb2YgRm9ybURhdGEpIHtcbiAgICAgICAgICBib2R5ID0gb3B0aW9ucy5ib2R5XG4gICAgICAgICAgLy8gTm8gbmVlZCB0byBzZXQgdGhlIGBjb250ZW50LXR5cGVgIGhlYWRlciBzaW5jZSBgZmV0Y2hgIGRvZXMgdGhhdCBhdXRvbWF0aWNhbGx5IGZvciB1cyB3aGVuIHdlIHVzZSBhIGBGb3JtRGF0YWAgb2JqZWN0LlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJvZHkgPSBKU09OLnN0cmluZ2lmeShyZXN0LmNoYW5nZVRvRGlzY29yZEZvcm1hdChvcHRpb25zLmJvZHkpKVxuICAgICAgICAgIGhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddID0gYGFwcGxpY2F0aW9uL2pzb25gXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU09NRVRJTUVTIFNQRUNJQUwgSEVBREVSUyAoRS5HLiBDVVNUT00gQVVUSE9SSVpBVElPTikgTkVFRCBUTyBCRSBVU0VEXG4gICAgICBpZiAob3B0aW9ucz8uaGVhZGVycykge1xuICAgICAgICBPYmplY3QuYXNzaWduKGhlYWRlcnMsIG9wdGlvbnMuaGVhZGVycylcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYm9keSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgbWV0aG9kLFxuICAgICAgfVxuICAgIH0sXG5cbiAgICBwcm9jZXNzUmF0ZUxpbWl0ZWRQYXRocygpIHtcbiAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KClcblxuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgcmVzdC5yYXRlTGltaXRlZFBhdGhzLmVudHJpZXMoKSkge1xuICAgICAgICAvLyAgIHJlc3QuZGVidWcoXG4gICAgICAgIC8vIGBbUkVTVCAtIHByb2Nlc3NSYXRlTGltaXRlZFBhdGhzXSBSdW5uaW5nIGZvciBvZiBsb29wLiAke1xuICAgICAgICAvLyAgIHZhbHVlLnJlc2V0VGltZXN0YW1wIC0gbm93XG4gICAgICAgIC8vIH1gXG4gICAgICAgIC8vICAgKVxuICAgICAgICAvLyBJZiB0aGUgdGltZSBoYXMgbm90IHJlYWNoZWQgY2FuY2VsXG4gICAgICAgIGlmICh2YWx1ZS5yZXNldFRpbWVzdGFtcCA+IG5vdykgY29udGludWVcblxuICAgICAgICAvLyBSYXRlIGxpbWl0IGlzIG92ZXIsIGRlbGV0ZSB0aGUgcmF0ZSBsaW1pdGVyXG4gICAgICAgIHJlc3QucmF0ZUxpbWl0ZWRQYXRocy5kZWxldGUoa2V5KVxuICAgICAgICAvLyBJZiBpdCB3YXMgZ2xvYmFsLCBhbHNvIG1hcmsgdGhlIGdsb2JhbCB2YWx1ZSBhcyBmYWxzZVxuICAgICAgICBpZiAoa2V5ID09PSAnZ2xvYmFsJykgcmVzdC5nbG9iYWxseVJhdGVMaW1pdGVkID0gZmFsc2VcbiAgICAgIH1cblxuICAgICAgLy8gQUxMIFBBVEhTIEFSRSBDTEVBUkVEIENBTiBDQU5DRUwgT1VUIVxuICAgICAgaWYgKHJlc3QucmF0ZUxpbWl0ZWRQYXRocy5zaXplID09PSAwKSB7XG4gICAgICAgIHJlc3QucHJvY2Vzc2luZ1JhdGVMaW1pdGVkUGF0aHMgPSBmYWxzZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdC5wcm9jZXNzaW5nUmF0ZUxpbWl0ZWRQYXRocyA9IHRydWVcbiAgICAgICAgLy8gUkVDSEVDSyBJTiAxIFNFQ09ORFxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyByZXN0LmRlYnVnKCdbUkVTVCAtIHByb2Nlc3NSYXRlTGltaXRlZFBhdGhzXSBSdW5uaW5nIHNldFRpbWVvdXQuJylcbiAgICAgICAgICByZXN0LnByb2Nlc3NSYXRlTGltaXRlZFBhdGhzKClcbiAgICAgICAgfSwgMTAwMClcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqIFByb2Nlc3NlcyB0aGUgcmF0ZSBsaW1pdCBoZWFkZXJzIGFuZCBkZXRlcm1pbmVzIGlmIGl0IG5lZWRzIHRvIGJlIHJhdGUgbGltaXRlZCBhbmQgcmV0dXJucyB0aGUgYnVja2V0IGlkIGlmIGF2YWlsYWJsZSAqL1xuICAgIHByb2Nlc3NIZWFkZXJzKHVybCwgaGVhZGVycywgaWRlbnRpZmllcikge1xuICAgICAgbGV0IHJhdGVMaW1pdGVkID0gZmFsc2VcblxuICAgICAgLy8gR0VUIEFMTCBORUNFU1NBUlkgSEVBREVSU1xuICAgICAgY29uc3QgcmVtYWluaW5nID0gaGVhZGVycy5nZXQoUkFURV9MSU1JVF9SRU1BSU5JTkdfSEVBREVSKVxuICAgICAgY29uc3QgcmV0cnlBZnRlciA9IGhlYWRlcnMuZ2V0KFJBVEVfTElNSVRfUkVTRVRfQUZURVJfSEVBREVSKVxuICAgICAgY29uc3QgcmVzZXQgPSBEYXRlLm5vdygpICsgTnVtYmVyKHJldHJ5QWZ0ZXIpICogMTAwMFxuICAgICAgY29uc3QgZ2xvYmFsID0gaGVhZGVycy5nZXQoUkFURV9MSU1JVF9HTE9CQUxfSEVBREVSKVxuICAgICAgLy8gdW5kZWZpbmVkIG92ZXJyaWRlIG51bGwgbmVlZGVkIGZvciB0eXBpbmdzXG4gICAgICBjb25zdCBidWNrZXRJZCA9IGhlYWRlcnMuZ2V0KFJBVEVfTElNSVRfQlVDS0VUX0hFQURFUikgPz8gdW5kZWZpbmVkXG4gICAgICBjb25zdCBsaW1pdCA9IGhlYWRlcnMuZ2V0KFJBVEVfTElNSVRfTElNSVRfSEVBREVSKVxuXG4gICAgICAvLyBJZiB3ZSBkaWRuJ3QgcmVjZWl2ZWQgdGhlIGlkZW50aWZpZXIsIGZhbGxiYWNrIHRvIHRoZSBib3QgdG9rZW5cbiAgICAgIGlkZW50aWZpZXIgPz89IGBCb3QgJHtyZXN0LnRva2VufWBcblxuICAgICAgcmVzdC5xdWV1ZXMuZ2V0KGAke2lkZW50aWZpZXJ9JHt1cmx9YCk/LmhhbmRsZUNvbXBsZXRlZFJlcXVlc3Qoe1xuICAgICAgICByZW1haW5pbmc6IHJlbWFpbmluZyA/IE51bWJlcihyZW1haW5pbmcpIDogdW5kZWZpbmVkLFxuICAgICAgICBpbnRlcnZhbDogcmV0cnlBZnRlciA/IE51bWJlcihyZXRyeUFmdGVyKSAqIDEwMDAgOiB1bmRlZmluZWQsXG4gICAgICAgIG1heDogbGltaXQgPyBOdW1iZXIobGltaXQpIDogdW5kZWZpbmVkLFxuICAgICAgfSlcblxuICAgICAgLy8gSUYgVEhFUkUgSVMgTk8gUkVNQUlOSU5HIFJBVEUgTElNSVQsIE1BUksgSVQgQVMgUkFURSBMSU1JVEVEXG4gICAgICBpZiAocmVtYWluaW5nID09PSAnMCcpIHtcbiAgICAgICAgcmF0ZUxpbWl0ZWQgPSB0cnVlXG5cbiAgICAgICAgLy8gU0FWRSBUSEUgVVJMIEFTIExJTUlURUQsIElNUE9SVEFOVCBGT1IgTkVXIFJFUVVFU1RTIEJZIFVTRVIgV0lUSE9VVCBCVUNLRVRcbiAgICAgICAgcmVzdC5yYXRlTGltaXRlZFBhdGhzLnNldChgJHtpZGVudGlmaWVyfSR7dXJsfWAsIHtcbiAgICAgICAgICB1cmwsXG4gICAgICAgICAgcmVzZXRUaW1lc3RhbXA6IHJlc2V0LFxuICAgICAgICAgIGJ1Y2tldElkLFxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIFNBVkUgVEhFIEJVQ0tFVCBBUyBMSU1JVEVEIFNJTkNFIERJRkZFUkVOVCBVUkxTIE1BWSBTSEFSRSBBIEJVQ0tFVFxuICAgICAgICBpZiAoYnVja2V0SWQpIHtcbiAgICAgICAgICByZXN0LnJhdGVMaW1pdGVkUGF0aHMuc2V0KGAke2lkZW50aWZpZXJ9JHtidWNrZXRJZH1gLCB7XG4gICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICByZXNldFRpbWVzdGFtcDogcmVzZXQsXG4gICAgICAgICAgICBidWNrZXRJZCxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElGIFRIRVJFIElTIE5PIFJFTUFJTklORyBHTE9CQUwgTElNSVQsIE1BUksgSVQgUkFURSBMSU1JVEVEIEdMT0JBTExZXG4gICAgICBpZiAoZ2xvYmFsKSB7XG4gICAgICAgIGNvbnN0IHJldHJ5QWZ0ZXIgPSBOdW1iZXIoaGVhZGVycy5nZXQoJ3JldHJ5LWFmdGVyJykpICogMTAwMFxuICAgICAgICBjb25zdCBnbG9iYWxSZXNldCA9IERhdGUubm93KCkgKyByZXRyeUFmdGVyXG4gICAgICAgIC8vICAgcmVzdC5kZWJ1ZyhcbiAgICAgICAgLy8gYFtSRVNUID0gR2xvYmFsbHkgUmF0ZSBMaW1pdGVkXSBVUkw6ICR7dXJsfSB8IEdsb2JhbCBSZXN0OiAke2dsb2JhbFJlc2V0fWBcbiAgICAgICAgLy8gICApXG4gICAgICAgIHJlc3QuZ2xvYmFsbHlSYXRlTGltaXRlZCA9IHRydWVcbiAgICAgICAgcmF0ZUxpbWl0ZWQgPSB0cnVlXG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgcmVzdC5nbG9iYWxseVJhdGVMaW1pdGVkID0gZmFsc2VcbiAgICAgICAgfSwgcmV0cnlBZnRlcilcblxuICAgICAgICByZXN0LnJhdGVMaW1pdGVkUGF0aHMuc2V0KCdnbG9iYWwnLCB7XG4gICAgICAgICAgdXJsOiAnZ2xvYmFsJyxcbiAgICAgICAgICByZXNldFRpbWVzdGFtcDogZ2xvYmFsUmVzZXQsXG4gICAgICAgICAgYnVja2V0SWQsXG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKGJ1Y2tldElkKSB7XG4gICAgICAgICAgcmVzdC5yYXRlTGltaXRlZFBhdGhzLnNldChpZGVudGlmaWVyLCB7XG4gICAgICAgICAgICB1cmw6ICdnbG9iYWwnLFxuICAgICAgICAgICAgcmVzZXRUaW1lc3RhbXA6IGdsb2JhbFJlc2V0LFxuICAgICAgICAgICAgYnVja2V0SWQsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocmF0ZUxpbWl0ZWQgJiYgIXJlc3QucHJvY2Vzc2luZ1JhdGVMaW1pdGVkUGF0aHMpIHtcbiAgICAgICAgcmVzdC5wcm9jZXNzUmF0ZUxpbWl0ZWRQYXRocygpXG4gICAgICB9XG4gICAgICByZXR1cm4gcmF0ZUxpbWl0ZWQgPyBidWNrZXRJZCA6IHVuZGVmaW5lZFxuICAgIH0sXG5cbiAgICBhc3luYyBzZW5kUmVxdWVzdChvcHRpb25zKSB7XG4gICAgICBjb25zdCB1cmwgPSBgJHtyZXN0LmJhc2VVcmx9L3Yke3Jlc3QudmVyc2lvbn0ke29wdGlvbnMucm91dGV9YFxuICAgICAgY29uc3QgcGF5bG9hZCA9IHJlc3QuY3JlYXRlUmVxdWVzdEJvZHkob3B0aW9ucy5tZXRob2QsIG9wdGlvbnMucmVxdWVzdEJvZHlPcHRpb25zKVxuXG4gICAgICBjb25zdCBsb2dnaW5nSGVhZGVycyA9IHsgLi4ucGF5bG9hZC5oZWFkZXJzIH1cblxuICAgICAgaWYgKHBheWxvYWQuaGVhZGVycy5hdXRob3JpemF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGF1dGhvcml6YXRpb25TY2hlbWUgPSBwYXlsb2FkLmhlYWRlcnMuYXV0aG9yaXphdGlvbj8uc3BsaXQoJyAnKVswXVxuICAgICAgICBsb2dnaW5nSGVhZGVycy5hdXRob3JpemF0aW9uID0gYCR7YXV0aG9yaXphdGlvblNjaGVtZX0gdG9rZW5oZXJlYFxuICAgICAgfVxuXG4gICAgICBjb25zdCByZXF1ZXN0ID0gbmV3IFJlcXVlc3QodXJsLCBwYXlsb2FkKVxuICAgICAgcmVzdC5ldmVudHMucmVxdWVzdChyZXF1ZXN0LCB7XG4gICAgICAgIGJvZHk6IG9wdGlvbnMucmVxdWVzdEJvZHlPcHRpb25zPy5ib2R5LFxuICAgICAgfSlcblxuICAgICAgcmVzdC5sb2dnZXIuZGVidWcoYHNlbmRpbmcgcmVxdWVzdCB0byAke3VybH1gLCAnd2l0aCBwYXlsb2FkOicsIHsgLi4ucGF5bG9hZCwgaGVhZGVyczogbG9nZ2luZ0hlYWRlcnMgfSlcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2gocmVxdWVzdCkuY2F0Y2goYXN5bmMgKGVycm9yKSA9PiB7XG4gICAgICAgIHJlc3QubG9nZ2VyLmVycm9yKGVycm9yKVxuICAgICAgICByZXN0LmV2ZW50cy5yZXF1ZXN0RXJyb3IocmVxdWVzdCwgZXJyb3IsIHsgYm9keTogb3B0aW9ucy5yZXF1ZXN0Qm9keU9wdGlvbnM/LmJvZHkgfSlcbiAgICAgICAgLy8gTWFyayByZXF1ZXN0IGFzIGNvbXBsZXRlZFxuICAgICAgICByZXN0LmludmFsaWRCdWNrZXQuaGFuZGxlQ29tcGxldGVkUmVxdWVzdCg5OTksIGZhbHNlKVxuICAgICAgICBvcHRpb25zLnJlamVjdCh7XG4gICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgIHN0YXR1czogOTk5LFxuICAgICAgICAgIGVycm9yOiAnUG9zc2libGUgbmV0d29yayBvciByZXF1ZXN0IHNoYXBlIGlzc3VlIG9jY3VycmVkLiBJZiB0aGlzIGlzIHJhcmUsIGl0cyBhIG5ldHdvcmsgZ2xpdGNoLiBJZiBpdCBvY2N1cnMgYSBsb3Qgc29tZXRoaW5nIGlzIHdyb25nLicsXG4gICAgICAgIH0pXG4gICAgICAgIHRocm93IGVycm9yXG4gICAgICB9KVxuICAgICAgcmVzdC5sb2dnZXIuZGVidWcoYHJlcXVlc3QgZmV0Y2hlZCBmcm9tICR7dXJsfSB3aXRoIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c30gJiAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YClcblxuICAgICAgLy8gU29tZXRpbWVzIHRoZSBDb250ZW50LVR5cGUgbWF5IGJlIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLCBmb3IgdGhpcyByZWFzb24sIHdlIG5lZWQgdG8gY2hlY2sgdGhlIHN0YXJ0IG9mIHRoZSBoZWFkZXJcbiAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCAocmVzcG9uc2UuaGVhZGVycy5nZXQoJ0NvbnRlbnQtVHlwZScpPy5zdGFydHNXaXRoKCdhcHBsaWNhdGlvbi9qc29uJykgPyByZXNwb25zZS5qc29uKCkgOiByZXNwb25zZS50ZXh0KCkpLmNhdGNoKCgpID0+IG51bGwpXG5cbiAgICAgIHJlc3QuZXZlbnRzLnJlc3BvbnNlKHJlcXVlc3QsIHJlc3BvbnNlLCB7XG4gICAgICAgIHJlcXVlc3RCb2R5OiBvcHRpb25zLnJlcXVlc3RCb2R5T3B0aW9ucz8uYm9keSxcbiAgICAgICAgcmVzcG9uc2VCb2R5OiBib2R5LFxuICAgICAgfSlcblxuICAgICAgLy8gTWFyayByZXF1ZXN0IGFzIGNvbXBsZXRlZFxuICAgICAgcmVzdC5pbnZhbGlkQnVja2V0LmhhbmRsZUNvbXBsZXRlZFJlcXVlc3QocmVzcG9uc2Uuc3RhdHVzLCByZXNwb25zZS5oZWFkZXJzLmdldChSQVRFX0xJTUlUX1NDT1BFX0hFQURFUikgPT09ICdzaGFyZWQnKVxuXG4gICAgICAvLyBTZXQgdGhlIGJ1Y2tldCBpZCBpZiBpdCB3YXMgYXZhaWxhYmxlIG9uIHRoZSBoZWFkZXJzXG4gICAgICBjb25zdCBidWNrZXRJZCA9IHJlc3QucHJvY2Vzc0hlYWRlcnMocmVzdC5zaW1wbGlmeVVybChvcHRpb25zLnJvdXRlLCBvcHRpb25zLm1ldGhvZCksIHJlc3BvbnNlLmhlYWRlcnMsIHBheWxvYWQuaGVhZGVycy5hdXRob3JpemF0aW9uKVxuXG4gICAgICBpZiAoYnVja2V0SWQpIG9wdGlvbnMuYnVja2V0SWQgPSBidWNrZXRJZFxuXG4gICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzIDwgSHR0cFJlc3BvbnNlQ29kZS5TdWNjZXNzIHx8IHJlc3BvbnNlLnN0YXR1cyA+PSBIdHRwUmVzcG9uc2VDb2RlLkVycm9yKSB7XG4gICAgICAgIHJlc3QubG9nZ2VyLmRlYnVnKGBSZXF1ZXN0IHRvICR7dXJsfSBmYWlsZWQuYClcblxuICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzICE9PSBIdHRwUmVzcG9uc2VDb2RlLlRvb01hbnlSZXF1ZXN0cykge1xuICAgICAgICAgIG9wdGlvbnMucmVqZWN0KHsgb2s6IGZhbHNlLCBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1cywgc3RhdHVzVGV4dDogcmVzcG9uc2Uuc3RhdHVzVGV4dCwgYm9keSB9KVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgcmVzdC5sb2dnZXIuZGVidWcoYFJlcXVlc3QgdG8gJHt1cmx9IHdhcyByYXRlbGltaXRlZC5gKVxuICAgICAgICAvLyBUb28gbWFueSBhdHRlbXB0cywgZ2V0IHJpZCBvZiByZXF1ZXN0IGZyb20gcXVldWUuXG4gICAgICAgIGlmIChvcHRpb25zLnJldHJ5Q291bnQgPj0gcmVzdC5tYXhSZXRyeUNvdW50KSB7XG4gICAgICAgICAgcmVzdC5sb2dnZXIuZGVidWcoYFJlcXVlc3QgdG8gJHt1cmx9IGV4Y2VlZGVkIHRoZSBtYXhpbXVtIGFsbG93ZWQgcmV0cmllcy5gLCAnd2l0aCBwYXlsb2FkOicsIHBheWxvYWQpXG4gICAgICAgICAgLy8gcmVzdC5kZWJ1ZyhgW1JFU1QgLSBSZXRyaWVzTWF4ZWRdICR7SlNPTi5zdHJpbmdpZnkob3B0aW9ucyl9YClcbiAgICAgICAgICBvcHRpb25zLnJlamVjdCh7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1cyxcbiAgICAgICAgICAgIHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXG4gICAgICAgICAgICBlcnJvcjogJ1RoZSByZXF1ZXN0IHdhcyByYXRlIGxpbWl0ZWQgYW5kIGl0IG1heGVkIG91dCB0aGUgcmV0cmllcyBsaW1pdC4nLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIG9wdGlvbnMucmV0cnlDb3VudCArPSAxXG5cbiAgICAgICAgY29uc3QgcmVzZXRBZnRlciA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KFJBVEVfTElNSVRfUkVTRVRfQUZURVJfSEVBREVSKVxuICAgICAgICBpZiAocmVzZXRBZnRlcikgYXdhaXQgZGVsYXkoTnVtYmVyKHJlc2V0QWZ0ZXIpICogMTAwMClcblxuICAgICAgICByZXR1cm4gYXdhaXQgb3B0aW9ucy5yZXRyeVJlcXVlc3Q/LihvcHRpb25zKVxuICAgICAgfVxuXG4gICAgICAvLyBEaXNjb3JkIHNvbWV0aW1lcyBzZW5kcyBhIHJlc3BvbnNlIHdpdGggbm8gY29udGVudFxuICAgICAgb3B0aW9ucy5yZXNvbHZlKHsgb2s6IHRydWUsIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLCBib2R5OiByZXNwb25zZS5zdGF0dXMgPT09IEh0dHBSZXNwb25zZUNvZGUuTm9Db250ZW50ID8gdW5kZWZpbmVkIDogYm9keSB9KVxuICAgIH0sXG5cbiAgICBzaW1wbGlmeVVybCh1cmwsIG1ldGhvZCkge1xuICAgICAgY29uc3Qgcm91dGVJbmZvcm1hdGlvbktleTogc3RyaW5nW10gPSBbbWV0aG9kXVxuXG4gICAgICBjb25zdCBxdWVyeVBhcmFtSW5kZXggPSB1cmwuaW5kZXhPZignPycpXG4gICAgICBjb25zdCByb3V0ZSA9IHF1ZXJ5UGFyYW1JbmRleCAhPT0gLTEgPyB1cmwuc2xpY2UoMCwgcXVlcnlQYXJhbUluZGV4KSA6IHVybFxuXG4gICAgICAvLyBTaW5jZSB0aGUgdXJscyBzdGFydCB3aXRoIC8gdGhlIGZpcnN0IHBhcnQgd2lsbCBhbHdheXMgYmUgZW1wdHlcbiAgICAgIGNvbnN0IHNwbGl0dGVkUm91dGUgPSByb3V0ZS5zcGxpdCgnLycpXG5cbiAgICAgIC8vIDEpIFN0cmlwIHRoZSBtaW5vciBwYXJhbXNcbiAgICAgIC8vICAgIFRoZSBvbmx5IG1ham9ycyBhcmUgY2hhbm5lbHMsIGd1aWxkcywgd2ViaG9va3MgYW5kIHdlYmhvb2tzIHdpdGggdGhlaXIgdG9rZW5cblxuICAgICAgY29uc3Qgc3RyaXBwZWRSb3V0ZSA9IHNwbGl0dGVkUm91dGVcbiAgICAgICAgLm1hcCgocGFydCwgaW5kZXgsIGFycmF5KSA9PiB7XG4gICAgICAgICAgLy8gV2hpbGUgcGFyc2VJbnQgd2lsbCB0cnVuY2F0ZSB0aGUgc25vd2ZsYWtlIGlkLCBpdCB3aWxsIHN0aWxsIHRlbGwgdXMgaWYgaXQgaXMgYSBudW1iZXJcbiAgICAgICAgICBjb25zdCBpc051bWJlciA9IE51bWJlci5pc0Zpbml0ZShwYXJzZUludChwYXJ0LCAxMCkpXG5cbiAgICAgICAgICBpZiAoIWlzTnVtYmVyKSB7XG4gICAgICAgICAgICAvLyBSZWFjdGlvbnMgZW1vamkgbmVlZCB0byBiZSBzdHJpcHBlZCBhcyBpdCBpcyBhIG1pbm9yIHBhcmFtZXRlclxuICAgICAgICAgICAgaWYgKGluZGV4ID49IDEgJiYgYXJyYXlbaW5kZXggLSAxXSA9PT0gJ3JlYWN0aW9ucycpIHJldHVybiAneCdcbiAgICAgICAgICAgIC8vIElmIHdlIGFyZSBvbiBhIHdlYmhvb2sgb3IgaWYgaXQgaXMgcGFydCBvZiB0aGUgcm91dGUsIGtlZXAgaXQgYXMgaXQgaXMgYSBtYWpvciBwYXJhbWV0ZXJcbiAgICAgICAgICAgIHJldHVybiBwYXJ0XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgd2UgYXJlIG9uIGEgY2hhbm5lbCBpZCwgYSBndWlsZCBpZCBvciBhIHdlYmhvb2sgaWRcbiAgICAgICAgICBjb25zdCBpc01ham9yID0gaW5kZXggPj0gMSAmJiAoYXJyYXlbaW5kZXggLSAxXSA9PT0gJ2NoYW5uZWxzJyB8fCBhcnJheVtpbmRleCAtIDFdID09PSAnZ3VpbGRzJyB8fCBhcnJheVtpbmRleCAtIDFdID09PSAnd2ViaG9va3MnKVxuXG4gICAgICAgICAgaWYgKGlzTWFqb3IpIHJldHVybiBwYXJ0XG5cbiAgICAgICAgICByZXR1cm4gJ3gnXG4gICAgICAgIH0pXG4gICAgICAgIC5qb2luKCcvJylcblxuICAgICAgcm91dGVJbmZvcm1hdGlvbktleS5wdXNoKHN0cmlwcGVkUm91dGUpXG5cbiAgICAgIC8vIDIpIEFjY291bnQgZm9yIGV4Y2VwdGlvbnNcbiAgICAgIC8vICAgIC0gaHR0cHM6Ly9naXRodWIuY29tL2Rpc2NvcmQvZGlzY29yZC1hcGktZG9jcy9pc3N1ZXMvMTA5MlxuICAgICAgLy8gICAgLSBodHRwczovL2dpdGh1Yi5jb20vZGlzY29yZC9kaXNjb3JkLWFwaS1kb2NzL2lzc3Vlcy8xMjk1XG5cbiAgICAgIC8vIFRoZSAyIGV4Y2VwdGlvbnMgYXJlIGZvciBtZXNzYWdlIGRlbGV0ZSwgc28gd2UgbmVlZCB0byBjaGVjayBpZiB3ZSBhcmUgaW4gdGhhdCByb3V0ZVxuICAgICAgaWYgKG1ldGhvZCA9PT0gJ0RFTEVURScgJiYgc3BsaXR0ZWRSb3V0ZS5sZW5ndGggPT09IDUgJiYgc3BsaXR0ZWRSb3V0ZVsxXSA9PT0gJ2NoYW5uZWxzJyAmJiBzdHJpcHBlZFJvdXRlLmVuZHNXaXRoKCcvbWVzc2FnZXMveCcpKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2VJZCA9IHNwbGl0dGVkUm91dGVbNF1cbiAgICAgICAgY29uc3QgdGltZXN0YW1wID0gc25vd2ZsYWtlVG9UaW1lc3RhbXAobWVzc2FnZUlkKVxuICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpXG5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rpc2NvcmQvZGlzY29yZC1hcGktZG9jcy9pc3N1ZXMvMTA5MlxuICAgICAgICBpZiAobm93IC0gdGltZXN0YW1wIDwgMTBfMDAwKSB7XG4gICAgICAgICAgcm91dGVJbmZvcm1hdGlvbktleS5wdXNoKCdtZXNzYWdlLWRlbGV0ZS0xMHMnKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rpc2NvcmQvZGlzY29yZC1hcGktZG9jcy9pc3N1ZXMvMTI5NVxuICAgICAgICAvLyAyIHdlZWtzID0gMiAqIDcgKiAyNCAqIDYwICogNjAgKiAxMDAwID0gMTIwOTYwMDAwMFxuICAgICAgICBpZiAobm93IC0gdGltZXN0YW1wID4gMTIwOTYwMDAwMCkge1xuICAgICAgICAgIHJvdXRlSW5mb3JtYXRpb25LZXkucHVzaCgnbWVzc2FnZS1kZWxldGUtMncnKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByb3V0ZUluZm9ybWF0aW9uS2V5LmpvaW4oJzonKVxuICAgIH0sXG5cbiAgICBhc3luYyBwcm9jZXNzUmVxdWVzdChyZXF1ZXN0OiBTZW5kUmVxdWVzdE9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IHVybCA9IHJlc3Quc2ltcGxpZnlVcmwocmVxdWVzdC5yb3V0ZSwgcmVxdWVzdC5tZXRob2QpXG5cbiAgICAgIGlmIChyZXF1ZXN0LnJ1blRocm91Z2hRdWV1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgYXdhaXQgcmVzdC5zZW5kUmVxdWVzdChyZXF1ZXN0KVxuXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICAvLyBJZiB3ZSB0aGUgcmVxdWVzdCBoYXMgYSB0b2tlbiwgdXNlIGl0XG4gICAgICAvLyBFbHNlIGZhbGxiYWNrIHRvIHByZWZpeCB3aXRoIHRoZSBib3QgdG9rZW5cbiAgICAgIGNvbnN0IHF1ZXVlSWRlbnRpZmllciA9IHJlcXVlc3QucmVxdWVzdEJvZHlPcHRpb25zPy5oZWFkZXJzPy5hdXRob3JpemF0aW9uID8/IGBCb3QgJHtyZXN0LnRva2VufWBcblxuICAgICAgY29uc3QgcXVldWUgPSByZXN0LnF1ZXVlcy5nZXQoYCR7cXVldWVJZGVudGlmaWVyfSR7dXJsfWApXG5cbiAgICAgIGlmIChxdWV1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHF1ZXVlLm1ha2VSZXF1ZXN0KHJlcXVlc3QpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDUkVBVEVTIEEgTkVXIFFVRVVFXG4gICAgICAgIGNvbnN0IGJ1Y2tldFF1ZXVlID0gbmV3IFF1ZXVlKHJlc3QsIHsgdXJsLCBkZWxldGVRdWV1ZURlbGF5OiByZXN0LmRlbGV0ZVF1ZXVlRGVsYXksIGlkZW50aWZpZXI6IHF1ZXVlSWRlbnRpZmllciB9KVxuXG4gICAgICAgIC8vIFNhdmUgcXVldWVcbiAgICAgICAgcmVzdC5xdWV1ZXMuc2V0KGAke3F1ZXVlSWRlbnRpZmllcn0ke3VybH1gLCBidWNrZXRRdWV1ZSlcblxuICAgICAgICAvLyBBZGQgcmVxdWVzdCB0byBxdWV1ZVxuICAgICAgICBidWNrZXRRdWV1ZS5tYWtlUmVxdWVzdChyZXF1ZXN0KVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBtYWtlUmVxdWVzdChtZXRob2QsIHJvdXRlLCBvcHRpb25zKSB7XG4gICAgICAvLyBUaGlzIGVycm9yIG5lZWRzIHRvIGJlIGNyZWF0ZWQgaGVyZSBiZWNhdXNlIG9mIGhvdyBzdGFjayB0cmFjZXMgZ2V0IGNhbGN1bGF0ZWRcbiAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKClcblxuICAgICAgaWYgKHJlc3QuaXNQcm94aWVkKSB7XG4gICAgICAgIGlmIChyZXN0LmF1dGhvcml6YXRpb24pIHtcbiAgICAgICAgICBvcHRpb25zID8/PSB7fVxuICAgICAgICAgIG9wdGlvbnMuaGVhZGVycyA/Pz0ge31cbiAgICAgICAgICBvcHRpb25zLmhlYWRlcnNbcmVzdC5hdXRob3JpemF0aW9uSGVhZGVyXSA9IHJlc3QuYXV0aG9yaXphdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGAke3Jlc3QuYmFzZVVybH0vdiR7cmVzdC52ZXJzaW9ufSR7cm91dGV9YCwgcmVzdC5jcmVhdGVSZXF1ZXN0Qm9keShtZXRob2QsIG9wdGlvbnMpKVxuICAgICAgICByZXN0LmV2ZW50cy5yZXF1ZXN0KHJlcXVlc3QsIHtcbiAgICAgICAgICBib2R5OiBvcHRpb25zPy5ib2R5LFxuICAgICAgICB9KVxuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZldGNoKHJlcXVlc3QpXG5cbiAgICAgICAgLy8gU29tZXRpbWVzIHRoZSBDb250ZW50LVR5cGUgbWF5IGJlIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLCBmb3IgdGhpcyByZWFzb24sIHdlIG5lZWQgdG8gY2hlY2sgdGhlIHN0YXJ0IG9mIHRoZSBoZWFkZXJcbiAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IChyZXN1bHQuaGVhZGVycy5nZXQoJ0NvbnRlbnQtVHlwZScpPy5zdGFydHNXaXRoKCdhcHBsaWNhdGlvbi9qc29uJykgPyByZXN1bHQuanNvbigpIDogcmVzdWx0LnRleHQoKSkuY2F0Y2goKCkgPT4gbnVsbClcblxuICAgICAgICByZXN0LmV2ZW50cy5yZXNwb25zZShyZXF1ZXN0LCByZXN1bHQsIHtcbiAgICAgICAgICByZXF1ZXN0Qm9keTogb3B0aW9ucz8uYm9keSxcbiAgICAgICAgICByZXNwb25zZUJvZHk6IGJvZHksXG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgICAgICBlcnJvci5jYXVzZSA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShiYXNlRXJyb3JQcm90b3R5cGUpLCB7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBzdGF0dXM6IHJlc3VsdC5zdGF0dXMsXG4gICAgICAgICAgICBib2R5LFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICB0aHJvdyBlcnJvclxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdC5zdGF0dXMgIT09IDIwNCA/ICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKGJvZHkpIDogYm9keSkgOiB1bmRlZmluZWRcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgcGF5bG9hZDogU2VuZFJlcXVlc3RPcHRpb25zID0ge1xuICAgICAgICAgIHJvdXRlLFxuICAgICAgICAgIG1ldGhvZCxcbiAgICAgICAgICByZXF1ZXN0Qm9keU9wdGlvbnM6IG9wdGlvbnMsXG4gICAgICAgICAgcmV0cnlDb3VudDogMCxcbiAgICAgICAgICByZXRyeVJlcXVlc3Q6IGFzeW5jIChwYXlsb2FkOiBTZW5kUmVxdWVzdE9wdGlvbnMpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHJlc3QucHJvY2Vzc1JlcXVlc3QocGF5bG9hZClcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc29sdmU6IChkYXRhKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKGRhdGEuc3RhdHVzICE9PSAyMDQgPyAodHlwZW9mIGRhdGEuYm9keSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKGRhdGEuYm9keSkgOiBkYXRhLmJvZHkpIDogdW5kZWZpbmVkKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVqZWN0OiAocmVhc29uKSA9PiB7XG4gICAgICAgICAgICBsZXQgZXJyb3JUZXh0OiBzdHJpbmdcblxuICAgICAgICAgICAgc3dpdGNoIChyZWFzb24uc3RhdHVzKSB7XG4gICAgICAgICAgICAgIGNhc2UgNDAwOlxuICAgICAgICAgICAgICAgIGVycm9yVGV4dCA9IFwiVGhlIG9wdGlvbnMgd2FzIGltcHJvcGVybHkgZm9ybWF0dGVkLCBvciB0aGUgc2VydmVyIGNvdWxkbid0IHVuZGVyc3RhbmQgaXQuXCJcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlIDQwMTpcbiAgICAgICAgICAgICAgICBlcnJvclRleHQgPSAnVGhlIEF1dGhvcml6YXRpb24gaGVhZGVyIHdhcyBtaXNzaW5nIG9yIGludmFsaWQuJ1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgNDAzOlxuICAgICAgICAgICAgICAgIGVycm9yVGV4dCA9ICdUaGUgQXV0aG9yaXphdGlvbiB0b2tlbiB5b3UgcGFzc2VkIGRpZCBub3QgaGF2ZSBwZXJtaXNzaW9uIHRvIHRoZSByZXNvdXJjZS4nXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSA0MDQ6XG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0ID0gXCJUaGUgcmVzb3VyY2UgYXQgdGhlIGxvY2F0aW9uIHNwZWNpZmllZCBkb2Vzbid0IGV4aXN0LlwiXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSA0MDU6XG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0ID0gJ1RoZSBIVFRQIG1ldGhvZCB1c2VkIGlzIG5vdCB2YWxpZCBmb3IgdGhlIGxvY2F0aW9uIHNwZWNpZmllZC4nXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSA0Mjk6XG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0ID0gXCJZb3UncmUgYmVpbmcgcmF0ZWxpbWl0ZWQuXCJcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlIDUwMjpcbiAgICAgICAgICAgICAgICBlcnJvclRleHQgPSAnVGhlcmUgd2FzIG5vdCBhIGdhdGV3YXkgYXZhaWxhYmxlIHRvIHByb2Nlc3MgeW91ciBvcHRpb25zLiBXYWl0IGEgYml0IGFuZCByZXRyeS4nXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBlcnJvclRleHQgPSByZWFzb24uc3RhdHVzVGV4dCA/PyAnVW5rbm93biBlcnJvcidcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXJyb3IubWVzc2FnZSA9IGBbJHtyZWFzb24uc3RhdHVzfV0gJHtlcnJvclRleHR9YFxuXG4gICAgICAgICAgICAvLyBJZiBkaXNjb3JkIHNlbnQgdXMgSlNPTiwgaXQgaXMgcHJvYmFibHkgZ29pbmcgdG8gYmUgYW4gZXJyb3IgbWVzc2FnZSBmcm9tIHdoaWNoIHdlIGNhbiBnZXQgYW5kIGFkZCBzb21lIGluZm9ybWF0aW9uIGFib3V0IHRoZSBlcnJvciB0byB0aGUgZXJyb3IgbWVzc2FnZSwgdGhlIGZ1bGwgYm9keSB3aWxsIGJlIGluIHRoZSBlcnJvci5jYXVzZVxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kaXNjb3JkLmNvbS9kZXZlbG9wZXJzL2RvY3MvcmVmZXJlbmNlI2Vycm9yLW1lc3NhZ2VzXG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlYXNvbi5ib2R5ID09PSAnb2JqZWN0JyAmJiBoYXNQcm9wZXJ0eShyZWFzb24uYm9keSwgJ2NvZGUnKSAmJiBoYXNQcm9wZXJ0eShyZWFzb24uYm9keSwgJ21lc3NhZ2UnKSkge1xuICAgICAgICAgICAgICBlcnJvci5tZXNzYWdlICs9IGBcXG5EaXNjb3JkIGVycm9yOiBbJHtyZWFzb24uYm9keS5jb2RlfV0gJHtyZWFzb24uYm9keS5tZXNzYWdlfWBcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXJyb3IuY2F1c2UgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUoYmFzZUVycm9yUHJvdG90eXBlKSwgcmVhc29uKVxuICAgICAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgcnVuVGhyb3VnaFF1ZXVlOiBvcHRpb25zPy5ydW5UaHJvdWdoUXVldWUsXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCByZXN0LnByb2Nlc3NSZXF1ZXN0KHBheWxvYWQpXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXQ8VCA9IFJlY29yZDxzdHJpbmcsIHVua25vd24+Pih1cmw6IHN0cmluZywgb3B0aW9ucz86IE9taXQ8Q3JlYXRlUmVxdWVzdEJvZHlPcHRpb25zLCAnYm9keScgfCAnbWV0aG9kJz4pIHtcbiAgICAgIHJldHVybiBjYW1lbGl6ZShhd2FpdCByZXN0Lm1ha2VSZXF1ZXN0KCdHRVQnLCB1cmwsIG9wdGlvbnMpKSBhcyBDYW1lbGl6ZTxUPlxuICAgIH0sXG5cbiAgICBhc3luYyBwb3N0PFQgPSBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4odXJsOiBzdHJpbmcsIG9wdGlvbnM/OiBPbWl0PENyZWF0ZVJlcXVlc3RCb2R5T3B0aW9ucywgJ2JvZHknIHwgJ21ldGhvZCc+KSB7XG4gICAgICByZXR1cm4gY2FtZWxpemUoYXdhaXQgcmVzdC5tYWtlUmVxdWVzdCgnUE9TVCcsIHVybCwgb3B0aW9ucykpIGFzIENhbWVsaXplPFQ+XG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZSh1cmw6IHN0cmluZywgb3B0aW9ucz86IE9taXQ8Q3JlYXRlUmVxdWVzdEJvZHlPcHRpb25zLCAnYm9keScgfCAnbWV0aG9kJz4pIHtcbiAgICAgIGNhbWVsaXplKGF3YWl0IHJlc3QubWFrZVJlcXVlc3QoJ0RFTEVURScsIHVybCwgb3B0aW9ucykpXG4gICAgfSxcblxuICAgIGFzeW5jIHBhdGNoPFQgPSBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4odXJsOiBzdHJpbmcsIG9wdGlvbnM/OiBPbWl0PENyZWF0ZVJlcXVlc3RCb2R5T3B0aW9ucywgJ2JvZHknIHwgJ21ldGhvZCc+KSB7XG4gICAgICByZXR1cm4gY2FtZWxpemUoYXdhaXQgcmVzdC5tYWtlUmVxdWVzdCgnUEFUQ0gnLCB1cmwsIG9wdGlvbnMpKSBhcyBDYW1lbGl6ZTxUPlxuICAgIH0sXG5cbiAgICBhc3luYyBwdXQ8VCA9IHZvaWQ+KHVybDogc3RyaW5nLCBvcHRpb25zPzogT21pdDxDcmVhdGVSZXF1ZXN0Qm9keU9wdGlvbnMsICdib2R5JyB8ICdtZXRob2QnPikge1xuICAgICAgcmV0dXJuIGNhbWVsaXplKGF3YWl0IHJlc3QubWFrZVJlcXVlc3QoJ1BVVCcsIHVybCwgb3B0aW9ucykpIGFzIENhbWVsaXplPFQ+XG4gICAgfSxcblxuICAgIGFzeW5jIGFkZFJlYWN0aW9uKGNoYW5uZWxJZCwgbWVzc2FnZUlkLCByZWFjdGlvbikge1xuICAgICAgcmVhY3Rpb24gPSBwcm9jZXNzUmVhY3Rpb25TdHJpbmcocmVhY3Rpb24pXG5cbiAgICAgIGF3YWl0IHJlc3QucHV0KHJlc3Qucm91dGVzLmNoYW5uZWxzLnJlYWN0aW9ucy5ib3QoY2hhbm5lbElkLCBtZXNzYWdlSWQsIHJlYWN0aW9uKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgYWRkUmVhY3Rpb25zKGNoYW5uZWxJZCwgbWVzc2FnZUlkLCByZWFjdGlvbnMsIG9yZGVyZWQgPSBmYWxzZSkge1xuICAgICAgaWYgKCFvcmRlcmVkKSB7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgIHJlYWN0aW9ucy5tYXAoYXN5bmMgKHJlYWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCByZXN0LmFkZFJlYWN0aW9uKGNoYW5uZWxJZCwgbWVzc2FnZUlkLCByZWFjdGlvbilcbiAgICAgICAgICB9KSxcbiAgICAgICAgKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCByZWFjdGlvbiBvZiByZWFjdGlvbnMpIHtcbiAgICAgICAgYXdhaXQgcmVzdC5hZGRSZWFjdGlvbihjaGFubmVsSWQsIG1lc3NhZ2VJZCwgcmVhY3Rpb24pXG4gICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIGFkZFJvbGUoZ3VpbGRJZCwgdXNlcklkLCByb2xlSWQsIHJlYXNvbikge1xuICAgICAgYXdhaXQgcmVzdC5wdXQocmVzdC5yb3V0ZXMuZ3VpbGRzLnJvbGVzLm1lbWJlcihndWlsZElkLCB1c2VySWQsIHJvbGVJZCksIHsgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGFkZFRocmVhZE1lbWJlcihjaGFubmVsSWQsIHVzZXJJZCkge1xuICAgICAgYXdhaXQgcmVzdC5wdXQocmVzdC5yb3V0ZXMuY2hhbm5lbHMudGhyZWFkcy51c2VyKGNoYW5uZWxJZCwgdXNlcklkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgYWRkRG1SZWNpcGllbnQoY2hhbm5lbElkLCB1c2VySWQsIGJvZHkpIHtcbiAgICAgIGF3YWl0IHJlc3QucHV0KHJlc3Qucm91dGVzLmNoYW5uZWxzLmRtUmVjaXBpZW50KGNoYW5uZWxJZCwgdXNlcklkKSwgeyBib2R5IH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGNyZWF0ZUF1dG9tb2RSdWxlKGd1aWxkSWQsIGJvZHksIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucG9zdDxEaXNjb3JkQXV0b01vZGVyYXRpb25SdWxlPihyZXN0LnJvdXRlcy5ndWlsZHMuYXV0b21vZC5ydWxlcyhndWlsZElkKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgY3JlYXRlQ2hhbm5lbChndWlsZElkLCBib2R5LCByZWFzb24pIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8RGlzY29yZENoYW5uZWw+KHJlc3Qucm91dGVzLmd1aWxkcy5jaGFubmVscyhndWlsZElkKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgY3JlYXRlRW1vamkoZ3VpbGRJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PERpc2NvcmRFbW9qaT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLmVtb2ppcyhndWlsZElkKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgY3JlYXRlQXBwbGljYXRpb25FbW9qaShib2R5KSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PERpc2NvcmRFbW9qaT4ocmVzdC5yb3V0ZXMuYXBwbGljYXRpb25FbW9qaXMocmVzdC5hcHBsaWNhdGlvbklkKSwgeyBib2R5IH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGNyZWF0ZUdsb2JhbEFwcGxpY2F0aW9uQ29tbWFuZChib2R5LCBvcHRpb25zKSB7XG4gICAgICBjb25zdCByZXN0T3B0aW9uczogTWFrZVJlcXVlc3RPcHRpb25zID0geyBib2R5IH1cblxuICAgICAgaWYgKG9wdGlvbnM/LmJlYXJlclRva2VuKSB7XG4gICAgICAgIHJlc3RPcHRpb25zLnVuYXV0aG9yaXplZCA9IHRydWVcbiAgICAgICAgcmVzdE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uOiBgQmVhcmVyICR7b3B0aW9ucy5iZWFyZXJUb2tlbn1gLFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8RGlzY29yZEFwcGxpY2F0aW9uQ29tbWFuZD4ocmVzdC5yb3V0ZXMuaW50ZXJhY3Rpb25zLmNvbW1hbmRzLmNvbW1hbmRzKHJlc3QuYXBwbGljYXRpb25JZCksIHJlc3RPcHRpb25zKVxuICAgIH0sXG5cbiAgICBhc3luYyBjcmVhdGVHdWlsZEFwcGxpY2F0aW9uQ29tbWFuZChib2R5LCBndWlsZElkLCBvcHRpb25zKSB7XG4gICAgICBjb25zdCByZXN0T3B0aW9uczogTWFrZVJlcXVlc3RPcHRpb25zID0geyBib2R5IH1cblxuICAgICAgaWYgKG9wdGlvbnM/LmJlYXJlclRva2VuKSB7XG4gICAgICAgIHJlc3RPcHRpb25zLnVuYXV0aG9yaXplZCA9IHRydWVcbiAgICAgICAgcmVzdE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uOiBgQmVhcmVyICR7b3B0aW9ucy5iZWFyZXJUb2tlbn1gLFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8RGlzY29yZEFwcGxpY2F0aW9uQ29tbWFuZD4ocmVzdC5yb3V0ZXMuaW50ZXJhY3Rpb25zLmNvbW1hbmRzLmd1aWxkcy5hbGwocmVzdC5hcHBsaWNhdGlvbklkLCBndWlsZElkKSwgcmVzdE9wdGlvbnMpXG4gICAgfSxcblxuICAgIGFzeW5jIGNyZWF0ZUd1aWxkU3RpY2tlcihndWlsZElkLCBvcHRpb25zLCByZWFzb24pIHtcbiAgICAgIGNvbnN0IGZvcm0gPSBuZXcgRm9ybURhdGEoKVxuICAgICAgZm9ybS5hcHBlbmQoJ2ZpbGUnLCBvcHRpb25zLmZpbGUuYmxvYiwgb3B0aW9ucy5maWxlLm5hbWUpXG4gICAgICBmb3JtLmFwcGVuZCgnbmFtZScsIG9wdGlvbnMubmFtZSlcbiAgICAgIGZvcm0uYXBwZW5kKCdkZXNjcmlwdGlvbicsIG9wdGlvbnMuZGVzY3JpcHRpb24pXG4gICAgICBmb3JtLmFwcGVuZCgndGFncycsIG9wdGlvbnMudGFncylcblxuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucG9zdDxEaXNjb3JkU3RpY2tlcj4ocmVzdC5yb3V0ZXMuZ3VpbGRzLnN0aWNrZXJzKGd1aWxkSWQpLCB7IGJvZHk6IGZvcm0sIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBjcmVhdGVHdWlsZFRlbXBsYXRlKGd1aWxkSWQsIGJvZHkpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8RGlzY29yZFRlbXBsYXRlPihyZXN0LnJvdXRlcy5ndWlsZHMudGVtcGxhdGVzLmFsbChndWlsZElkKSwgeyBib2R5IH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGNyZWF0ZUZvcnVtVGhyZWFkKGNoYW5uZWxJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PERpc2NvcmRDaGFubmVsPihyZXN0LnJvdXRlcy5jaGFubmVscy5mb3J1bShjaGFubmVsSWQpLCB7IGJvZHksIGZpbGVzOiBib2R5LmZpbGVzLCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgY3JlYXRlSW52aXRlKGNoYW5uZWxJZCwgYm9keSA9IHt9LCByZWFzb24pIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8RGlzY29yZEludml0ZT4ocmVzdC5yb3V0ZXMuY2hhbm5lbHMuaW52aXRlcyhjaGFubmVsSWQpLCB7IGJvZHksIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBjcmVhdGVSb2xlKGd1aWxkSWQsIGJvZHksIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucG9zdDxEaXNjb3JkUm9sZT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLnJvbGVzLmFsbChndWlsZElkKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgY3JlYXRlU2NoZWR1bGVkRXZlbnQoZ3VpbGRJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PERpc2NvcmRTY2hlZHVsZWRFdmVudD4ocmVzdC5yb3V0ZXMuZ3VpbGRzLmV2ZW50cy5ldmVudHMoZ3VpbGRJZCksIHsgYm9keSwgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGNyZWF0ZVN0YWdlSW5zdGFuY2UoYm9keSwgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PERpc2NvcmRTdGFnZUluc3RhbmNlPihyZXN0LnJvdXRlcy5jaGFubmVscy5zdGFnZXMoKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgY3JlYXRlV2ViaG9vayhjaGFubmVsSWQsIG9wdGlvbnMsIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucG9zdDxEaXNjb3JkV2ViaG9vaz4ocmVzdC5yb3V0ZXMuY2hhbm5lbHMud2ViaG9va3MoY2hhbm5lbElkKSwge1xuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuICAgICAgICAgIGF2YXRhcjogb3B0aW9ucy5hdmF0YXIgPyBhd2FpdCB1cmxUb0Jhc2U2NChvcHRpb25zLmF2YXRhcikgOiB1bmRlZmluZWQsXG4gICAgICAgIH0sXG4gICAgICAgIHJlYXNvbixcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZUF1dG9tb2RSdWxlKGd1aWxkSWQsIHJ1bGVJZCwgcmVhc29uKSB7XG4gICAgICBhd2FpdCByZXN0LmRlbGV0ZShyZXN0LnJvdXRlcy5ndWlsZHMuYXV0b21vZC5ydWxlKGd1aWxkSWQsIHJ1bGVJZCksIHsgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZUNoYW5uZWwoY2hhbm5lbElkLCByZWFzb24pIHtcbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLmNoYW5uZWxzLmNoYW5uZWwoY2hhbm5lbElkKSwge1xuICAgICAgICByZWFzb24sXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWxldGVDaGFubmVsUGVybWlzc2lvbk92ZXJyaWRlKGNoYW5uZWxJZCwgb3ZlcndyaXRlSWQsIHJlYXNvbikge1xuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuY2hhbm5lbHMub3ZlcndyaXRlKGNoYW5uZWxJZCwgb3ZlcndyaXRlSWQpLCB7IHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWxldGVFbW9qaShndWlsZElkLCBpZCwgcmVhc29uKSB7XG4gICAgICBhd2FpdCByZXN0LmRlbGV0ZShyZXN0LnJvdXRlcy5ndWlsZHMuZW1vamkoZ3VpbGRJZCwgaWQpLCB7IHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWxldGVBcHBsaWNhdGlvbkVtb2ppKGlkKSB7XG4gICAgICBhd2FpdCByZXN0LmRlbGV0ZShyZXN0LnJvdXRlcy5hcHBsaWNhdGlvbkVtb2ppKHJlc3QuYXBwbGljYXRpb25JZCwgaWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWxldGVGb2xsb3d1cE1lc3NhZ2UodG9rZW4sIG1lc3NhZ2VJZCkge1xuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuaW50ZXJhY3Rpb25zLnJlc3BvbnNlcy5tZXNzYWdlKHJlc3QuYXBwbGljYXRpb25JZCwgdG9rZW4sIG1lc3NhZ2VJZCksIHsgdW5hdXRob3JpemVkOiB0cnVlIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZUdsb2JhbEFwcGxpY2F0aW9uQ29tbWFuZChjb21tYW5kSWQpIHtcbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLmludGVyYWN0aW9ucy5jb21tYW5kcy5jb21tYW5kKHJlc3QuYXBwbGljYXRpb25JZCwgY29tbWFuZElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZGVsZXRlR3VpbGRBcHBsaWNhdGlvbkNvbW1hbmQoY29tbWFuZElkLCBndWlsZElkKSB7XG4gICAgICBhd2FpdCByZXN0LmRlbGV0ZShyZXN0LnJvdXRlcy5pbnRlcmFjdGlvbnMuY29tbWFuZHMuZ3VpbGRzLm9uZShyZXN0LmFwcGxpY2F0aW9uSWQsIGd1aWxkSWQsIGNvbW1hbmRJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZUd1aWxkU3RpY2tlcihndWlsZElkLCBzdGlja2VySWQsIHJlYXNvbikge1xuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuZ3VpbGRzLnN0aWNrZXIoZ3VpbGRJZCwgc3RpY2tlcklkKSwgeyByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZGVsZXRlR3VpbGRUZW1wbGF0ZShndWlsZElkLCB0ZW1wbGF0ZUNvZGUpIHtcbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLmd1aWxkcy50ZW1wbGF0ZXMuZ3VpbGQoZ3VpbGRJZCwgdGVtcGxhdGVDb2RlKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZGVsZXRlSW50ZWdyYXRpb24oZ3VpbGRJZCwgaW50ZWdyYXRpb25JZCwgcmVhc29uKSB7XG4gICAgICBhd2FpdCByZXN0LmRlbGV0ZShyZXN0LnJvdXRlcy5ndWlsZHMuaW50ZWdyYXRpb24oZ3VpbGRJZCwgaW50ZWdyYXRpb25JZCksIHsgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZUludml0ZShpbnZpdGVDb2RlLCByZWFzb24pIHtcbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLmd1aWxkcy5pbnZpdGUoaW52aXRlQ29kZSksIHsgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZU1lc3NhZ2UoY2hhbm5lbElkLCBtZXNzYWdlSWQsIHJlYXNvbikge1xuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuY2hhbm5lbHMubWVzc2FnZShjaGFubmVsSWQsIG1lc3NhZ2VJZCksIHsgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZU1lc3NhZ2VzKGNoYW5uZWxJZCwgbWVzc2FnZUlkcywgcmVhc29uKSB7XG4gICAgICBhd2FpdCByZXN0LnBvc3QocmVzdC5yb3V0ZXMuY2hhbm5lbHMuYnVsayhjaGFubmVsSWQpLCB7XG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBtZXNzYWdlczogbWVzc2FnZUlkcy5zbGljZSgwLCAxMDApLm1hcCgoaWQpID0+IGlkLnRvU3RyaW5nKCkpLFxuICAgICAgICB9LFxuICAgICAgICByZWFzb24sXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWxldGVPcmlnaW5hbEludGVyYWN0aW9uUmVzcG9uc2UodG9rZW4pIHtcbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLmludGVyYWN0aW9ucy5yZXNwb25zZXMub3JpZ2luYWwocmVzdC5hcHBsaWNhdGlvbklkLCB0b2tlbiksIHsgdW5hdXRob3JpemVkOiB0cnVlIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZU93blJlYWN0aW9uKGNoYW5uZWxJZCwgbWVzc2FnZUlkLCByZWFjdGlvbikge1xuICAgICAgcmVhY3Rpb24gPSBwcm9jZXNzUmVhY3Rpb25TdHJpbmcocmVhY3Rpb24pXG5cbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLmNoYW5uZWxzLnJlYWN0aW9ucy5ib3QoY2hhbm5lbElkLCBtZXNzYWdlSWQsIHJlYWN0aW9uKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZGVsZXRlUmVhY3Rpb25zQWxsKGNoYW5uZWxJZCwgbWVzc2FnZUlkKSB7XG4gICAgICBhd2FpdCByZXN0LmRlbGV0ZShyZXN0LnJvdXRlcy5jaGFubmVscy5yZWFjdGlvbnMuYWxsKGNoYW5uZWxJZCwgbWVzc2FnZUlkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZGVsZXRlUmVhY3Rpb25zRW1vamkoY2hhbm5lbElkLCBtZXNzYWdlSWQsIHJlYWN0aW9uKSB7XG4gICAgICByZWFjdGlvbiA9IHByb2Nlc3NSZWFjdGlvblN0cmluZyhyZWFjdGlvbilcblxuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuY2hhbm5lbHMucmVhY3Rpb25zLmVtb2ppKGNoYW5uZWxJZCwgbWVzc2FnZUlkLCByZWFjdGlvbikpXG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZVJvbGUoZ3VpbGRJZCwgcm9sZUlkLCByZWFzb24pIHtcbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLmd1aWxkcy5yb2xlcy5vbmUoZ3VpbGRJZCwgcm9sZUlkKSwgeyByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZGVsZXRlU2NoZWR1bGVkRXZlbnQoZ3VpbGRJZCwgZXZlbnRJZCkge1xuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuZ3VpbGRzLmV2ZW50cy5ldmVudChndWlsZElkLCBldmVudElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZGVsZXRlU3RhZ2VJbnN0YW5jZShjaGFubmVsSWQsIHJlYXNvbikge1xuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuY2hhbm5lbHMuc3RhZ2UoY2hhbm5lbElkKSwgeyByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZGVsZXRlVXNlclJlYWN0aW9uKGNoYW5uZWxJZCwgbWVzc2FnZUlkLCB1c2VySWQsIHJlYWN0aW9uKSB7XG4gICAgICByZWFjdGlvbiA9IHByb2Nlc3NSZWFjdGlvblN0cmluZyhyZWFjdGlvbilcblxuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuY2hhbm5lbHMucmVhY3Rpb25zLnVzZXIoY2hhbm5lbElkLCBtZXNzYWdlSWQsIHJlYWN0aW9uLCB1c2VySWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWxldGVXZWJob29rKHdlYmhvb2tJZCwgcmVhc29uKSB7XG4gICAgICBhd2FpdCByZXN0LmRlbGV0ZShyZXN0LnJvdXRlcy53ZWJob29rcy5pZCh3ZWJob29rSWQpLCB7IHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWxldGVXZWJob29rTWVzc2FnZSh3ZWJob29rSWQsIHRva2VuLCBtZXNzYWdlSWQsIG9wdGlvbnMpIHtcbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLndlYmhvb2tzLm1lc3NhZ2Uod2ViaG9va0lkLCB0b2tlbiwgbWVzc2FnZUlkLCBvcHRpb25zKSwgeyB1bmF1dGhvcml6ZWQ6IHRydWUgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZGVsZXRlV2ViaG9va1dpdGhUb2tlbih3ZWJob29rSWQsIHRva2VuKSB7XG4gICAgICBhd2FpdCByZXN0LmRlbGV0ZShyZXN0LnJvdXRlcy53ZWJob29rcy53ZWJob29rKHdlYmhvb2tJZCwgdG9rZW4pLCB7XG4gICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGVkaXRBcHBsaWNhdGlvbkNvbW1hbmRQZXJtaXNzaW9ucyhndWlsZElkLCBjb21tYW5kSWQsIGJlYXJlclRva2VuLCBwZXJtaXNzaW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucHV0PERpc2NvcmRHdWlsZEFwcGxpY2F0aW9uQ29tbWFuZFBlcm1pc3Npb25zPihcbiAgICAgICAgcmVzdC5yb3V0ZXMuaW50ZXJhY3Rpb25zLmNvbW1hbmRzLnBlcm1pc3Npb24ocmVzdC5hcHBsaWNhdGlvbklkLCBndWlsZElkLCBjb21tYW5kSWQpLFxuICAgICAgICB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgcGVybWlzc2lvbnMsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBoZWFkZXJzOiB7IGF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtiZWFyZXJUb2tlbn1gIH0sXG4gICAgICAgIH0sXG4gICAgICApXG4gICAgfSxcblxuICAgIGFzeW5jIGVkaXRBdXRvbW9kUnVsZShndWlsZElkLCBydWxlSWQsIGJvZHksIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucGF0Y2g8RGlzY29yZEF1dG9Nb2RlcmF0aW9uUnVsZT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLmF1dG9tb2QucnVsZShndWlsZElkLCBydWxlSWQpLCB7IGJvZHksIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0Qm90UHJvZmlsZShvcHRpb25zKSB7XG4gICAgICBjb25zdCBhdmF0YXIgPSBvcHRpb25zPy5ib3RBdmF0YXJVUkwgPyBhd2FpdCB1cmxUb0Jhc2U2NChvcHRpb25zPy5ib3RBdmF0YXJVUkwpIDogb3B0aW9ucz8uYm90QXZhdGFyVVJMXG4gICAgICBjb25zdCBiYW5uZXIgPSBvcHRpb25zPy5ib3RCYW5uZXJVUkwgPyBhd2FpdCB1cmxUb0Jhc2U2NChvcHRpb25zPy5ib3RCYW5uZXJVUkwpIDogb3B0aW9ucz8uYm90QmFubmVyVVJMXG5cbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBhdGNoPERpc2NvcmRVc2VyPihyZXN0LnJvdXRlcy5jdXJyZW50VXNlcigpLCB7XG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICB1c2VybmFtZTogb3B0aW9ucy51c2VybmFtZT8udHJpbSgpLFxuICAgICAgICAgIGF2YXRhcixcbiAgICAgICAgICBiYW5uZXIsXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0Q2hhbm5lbChjaGFubmVsSWQsIGJvZHksIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucGF0Y2g8RGlzY29yZENoYW5uZWw+KHJlc3Qucm91dGVzLmNoYW5uZWxzLmNoYW5uZWwoY2hhbm5lbElkKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZWRpdENoYW5uZWxQZXJtaXNzaW9uT3ZlcnJpZGVzKGNoYW5uZWxJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICBhd2FpdCByZXN0LnB1dChyZXN0LnJvdXRlcy5jaGFubmVscy5vdmVyd3JpdGUoY2hhbm5lbElkLCBib2R5LmlkKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZWRpdENoYW5uZWxQb3NpdGlvbnMoZ3VpbGRJZCwgYm9keSkge1xuICAgICAgYXdhaXQgcmVzdC5wYXRjaChyZXN0LnJvdXRlcy5ndWlsZHMuY2hhbm5lbHMoZ3VpbGRJZCksIHsgYm9keSB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0RW1vamkoZ3VpbGRJZCwgaWQsIGJvZHksIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucGF0Y2g8RGlzY29yZEVtb2ppPihyZXN0LnJvdXRlcy5ndWlsZHMuZW1vamkoZ3VpbGRJZCwgaWQpLCB7IGJvZHksIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0QXBwbGljYXRpb25FbW9qaShpZCwgYm9keSkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucGF0Y2g8RGlzY29yZEVtb2ppPihyZXN0LnJvdXRlcy5hcHBsaWNhdGlvbkVtb2ppKHJlc3QuYXBwbGljYXRpb25JZCwgaWQpLCB7IGJvZHkgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZWRpdEZvbGxvd3VwTWVzc2FnZSh0b2tlbiwgbWVzc2FnZUlkLCBib2R5KSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wYXRjaDxEaXNjb3JkTWVzc2FnZT4ocmVzdC5yb3V0ZXMuaW50ZXJhY3Rpb25zLnJlc3BvbnNlcy5tZXNzYWdlKHJlc3QuYXBwbGljYXRpb25JZCwgdG9rZW4sIG1lc3NhZ2VJZCksIHtcbiAgICAgICAgYm9keSxcbiAgICAgICAgZmlsZXM6IGJvZHkuZmlsZXMsXG4gICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGVkaXRHbG9iYWxBcHBsaWNhdGlvbkNvbW1hbmQoY29tbWFuZElkLCBib2R5KSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wYXRjaDxEaXNjb3JkQXBwbGljYXRpb25Db21tYW5kPihyZXN0LnJvdXRlcy5pbnRlcmFjdGlvbnMuY29tbWFuZHMuY29tbWFuZChyZXN0LmFwcGxpY2F0aW9uSWQsIGNvbW1hbmRJZCksIHsgYm9keSB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0R3VpbGQoZ3VpbGRJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wYXRjaDxEaXNjb3JkR3VpbGQ+KHJlc3Qucm91dGVzLmd1aWxkcy5ndWlsZChndWlsZElkKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZWRpdEd1aWxkQXBwbGljYXRpb25Db21tYW5kKGNvbW1hbmRJZCwgZ3VpbGRJZCwgYm9keSkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucGF0Y2g8RGlzY29yZEFwcGxpY2F0aW9uQ29tbWFuZD4ocmVzdC5yb3V0ZXMuaW50ZXJhY3Rpb25zLmNvbW1hbmRzLmd1aWxkcy5vbmUocmVzdC5hcHBsaWNhdGlvbklkLCBndWlsZElkLCBjb21tYW5kSWQpLCB7XG4gICAgICAgIGJvZHksXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0R3VpbGRTdGlja2VyKGd1aWxkSWQsIHN0aWNrZXJJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wYXRjaDxEaXNjb3JkU3RpY2tlcj4ocmVzdC5yb3V0ZXMuZ3VpbGRzLnN0aWNrZXIoZ3VpbGRJZCwgc3RpY2tlcklkKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZWRpdEd1aWxkVGVtcGxhdGUoZ3VpbGRJZCwgdGVtcGxhdGVDb2RlOiBzdHJpbmcsIGJvZHk6IE1vZGlmeUd1aWxkVGVtcGxhdGUpOiBQcm9taXNlPENhbWVsaXplPERpc2NvcmRUZW1wbGF0ZT4+IHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBhdGNoPERpc2NvcmRUZW1wbGF0ZT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLnRlbXBsYXRlcy5ndWlsZChndWlsZElkLCB0ZW1wbGF0ZUNvZGUpLCB7IGJvZHkgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZWRpdE1lc3NhZ2UoY2hhbm5lbElkLCBtZXNzYWdlSWQsIGJvZHkpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBhdGNoPERpc2NvcmRNZXNzYWdlPihyZXN0LnJvdXRlcy5jaGFubmVscy5tZXNzYWdlKGNoYW5uZWxJZCwgbWVzc2FnZUlkKSwgeyBib2R5LCBmaWxlczogYm9keS5maWxlcyB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0T3JpZ2luYWxJbnRlcmFjdGlvblJlc3BvbnNlKHRva2VuLCBib2R5KSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wYXRjaDxEaXNjb3JkTWVzc2FnZT4ocmVzdC5yb3V0ZXMuaW50ZXJhY3Rpb25zLnJlc3BvbnNlcy5vcmlnaW5hbChyZXN0LmFwcGxpY2F0aW9uSWQsIHRva2VuKSwge1xuICAgICAgICBib2R5LFxuICAgICAgICBmaWxlczogYm9keS5maWxlcyxcbiAgICAgICAgdW5hdXRob3JpemVkOiB0cnVlLFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZWRpdE93blZvaWNlU3RhdGUoZ3VpbGRJZCwgb3B0aW9ucykge1xuICAgICAgYXdhaXQgcmVzdC5wYXRjaChyZXN0LnJvdXRlcy5ndWlsZHMudm9pY2UoZ3VpbGRJZCksIHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgcmVxdWVzdFRvU3BlYWtUaW1lc3RhbXA6IG9wdGlvbnMucmVxdWVzdFRvU3BlYWtUaW1lc3RhbXBcbiAgICAgICAgICAgID8gbmV3IERhdGUob3B0aW9ucy5yZXF1ZXN0VG9TcGVha1RpbWVzdGFtcCkudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgOiBvcHRpb25zLnJlcXVlc3RUb1NwZWFrVGltZXN0YW1wLFxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZWRpdFNjaGVkdWxlZEV2ZW50KGd1aWxkSWQsIGV2ZW50SWQsIGJvZHksIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucGF0Y2g8RGlzY29yZFNjaGVkdWxlZEV2ZW50PihyZXN0LnJvdXRlcy5ndWlsZHMuZXZlbnRzLmV2ZW50KGd1aWxkSWQsIGV2ZW50SWQpLCB7IGJvZHksIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0Um9sZShndWlsZElkLCByb2xlSWQsIGJvZHksIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucGF0Y2g8RGlzY29yZFJvbGU+KHJlc3Qucm91dGVzLmd1aWxkcy5yb2xlcy5vbmUoZ3VpbGRJZCwgcm9sZUlkKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZWRpdFJvbGVQb3NpdGlvbnMoZ3VpbGRJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wYXRjaDxEaXNjb3JkUm9sZVtdPihyZXN0LnJvdXRlcy5ndWlsZHMucm9sZXMuYWxsKGd1aWxkSWQpLCB7IGJvZHksIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0U3RhZ2VJbnN0YW5jZShjaGFubmVsSWQsIHRvcGljLCByZWFzb24/OiBzdHJpbmcpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBhdGNoPERpc2NvcmRTdGFnZUluc3RhbmNlPihyZXN0LnJvdXRlcy5jaGFubmVscy5zdGFnZShjaGFubmVsSWQpLCB7IGJvZHk6IHsgdG9waWMgfSwgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGVkaXRVc2VyVm9pY2VTdGF0ZShndWlsZElkLCBvcHRpb25zKSB7XG4gICAgICBhd2FpdCByZXN0LnBhdGNoKHJlc3Qucm91dGVzLmd1aWxkcy52b2ljZShndWlsZElkLCBvcHRpb25zLnVzZXJJZCksIHsgYm9keTogb3B0aW9ucyB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0V2ViaG9vayh3ZWJob29rSWQsIGJvZHksIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucGF0Y2g8RGlzY29yZFdlYmhvb2s+KHJlc3Qucm91dGVzLndlYmhvb2tzLmlkKHdlYmhvb2tJZCksIHsgYm9keSwgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGVkaXRXZWJob29rTWVzc2FnZSh3ZWJob29rSWQsIHRva2VuLCBtZXNzYWdlSWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBhdGNoPERpc2NvcmRNZXNzYWdlPihyZXN0LnJvdXRlcy53ZWJob29rcy5tZXNzYWdlKHdlYmhvb2tJZCwgdG9rZW4sIG1lc3NhZ2VJZCwgb3B0aW9ucyksIHtcbiAgICAgICAgYm9keTogb3B0aW9ucyxcbiAgICAgICAgZmlsZXM6IG9wdGlvbnMuZmlsZXMsXG4gICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGVkaXRXZWJob29rV2l0aFRva2VuKHdlYmhvb2tJZCwgdG9rZW4sIGJvZHkpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBhdGNoPERpc2NvcmRXZWJob29rPihyZXN0LnJvdXRlcy53ZWJob29rcy53ZWJob29rKHdlYmhvb2tJZCwgdG9rZW4pLCB7XG4gICAgICAgIGJvZHksXG4gICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGVkaXRXZWxjb21lU2NyZWVuKGd1aWxkSWQsIGJvZHksIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucGF0Y2g8RGlzY29yZFdlbGNvbWVTY3JlZW4+KHJlc3Qucm91dGVzLmd1aWxkcy53ZWxjb21lKGd1aWxkSWQpLCB7IGJvZHksIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0V2lkZ2V0U2V0dGluZ3MoZ3VpbGRJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wYXRjaDxEaXNjb3JkR3VpbGRXaWRnZXRTZXR0aW5ncz4ocmVzdC5yb3V0ZXMuZ3VpbGRzLndpZGdldChndWlsZElkKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZXhlY3V0ZVdlYmhvb2sod2ViaG9va0lkLCB0b2tlbiwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucG9zdDxEaXNjb3JkTWVzc2FnZT4ocmVzdC5yb3V0ZXMud2ViaG9va3Mud2ViaG9vayh3ZWJob29rSWQsIHRva2VuLCBvcHRpb25zKSwge1xuICAgICAgICBib2R5OiBvcHRpb25zLFxuICAgICAgICB1bmF1dGhvcml6ZWQ6IHRydWUsXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBmb2xsb3dBbm5vdW5jZW1lbnQoc291cmNlQ2hhbm5lbElkLCB0YXJnZXRDaGFubmVsSWQsIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucG9zdDxEaXNjb3JkRm9sbG93ZWRDaGFubmVsPihyZXN0LnJvdXRlcy5jaGFubmVscy5mb2xsb3coc291cmNlQ2hhbm5lbElkKSwge1xuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgd2ViaG9va0NoYW5uZWxJZDogdGFyZ2V0Q2hhbm5lbElkLFxuICAgICAgICB9LFxuICAgICAgICByZWFzb24sXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRBY3RpdmVUaHJlYWRzKGd1aWxkSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkTGlzdEFjdGl2ZVRocmVhZHM+KHJlc3Qucm91dGVzLmNoYW5uZWxzLnRocmVhZHMuYWN0aXZlKGd1aWxkSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRBcHBsaWNhdGlvbkNvbW1hbmRQZXJtaXNzaW9uKGd1aWxkSWQsIGNvbW1hbmRJZCwgb3B0aW9ucykge1xuICAgICAgY29uc3QgcmVzdE9wdGlvbnM6IE9taXQ8TWFrZVJlcXVlc3RPcHRpb25zLCAnYm9keSc+ID0ge31cblxuICAgICAgaWYgKG9wdGlvbnM/LmFjY2Vzc1Rva2VuKSB7XG4gICAgICAgIHJlc3RPcHRpb25zLnVuYXV0aG9yaXplZCA9IHRydWVcbiAgICAgICAgcmVzdE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uOiBgQmVhcmVyICR7b3B0aW9ucy5hY2Nlc3NUb2tlbn1gLFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkR3VpbGRBcHBsaWNhdGlvbkNvbW1hbmRQZXJtaXNzaW9ucz4oXG4gICAgICAgIHJlc3Qucm91dGVzLmludGVyYWN0aW9ucy5jb21tYW5kcy5wZXJtaXNzaW9uKG9wdGlvbnM/LmFwcGxpY2F0aW9uSWQgPz8gcmVzdC5hcHBsaWNhdGlvbklkLCBndWlsZElkLCBjb21tYW5kSWQpLFxuICAgICAgICByZXN0T3B0aW9ucyxcbiAgICAgIClcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0QXBwbGljYXRpb25Db21tYW5kUGVybWlzc2lvbnMoZ3VpbGRJZCwgb3B0aW9ucykge1xuICAgICAgY29uc3QgcmVzdE9wdGlvbnM6IE9taXQ8TWFrZVJlcXVlc3RPcHRpb25zLCAnYm9keSc+ID0ge31cblxuICAgICAgaWYgKG9wdGlvbnM/LmFjY2Vzc1Rva2VuKSB7XG4gICAgICAgIHJlc3RPcHRpb25zLnVuYXV0aG9yaXplZCA9IHRydWVcbiAgICAgICAgcmVzdE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uOiBgQmVhcmVyICR7b3B0aW9ucy5hY2Nlc3NUb2tlbn1gLFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkR3VpbGRBcHBsaWNhdGlvbkNvbW1hbmRQZXJtaXNzaW9uc1tdPihcbiAgICAgICAgcmVzdC5yb3V0ZXMuaW50ZXJhY3Rpb25zLmNvbW1hbmRzLnBlcm1pc3Npb25zKG9wdGlvbnM/LmFwcGxpY2F0aW9uSWQgPz8gcmVzdC5hcHBsaWNhdGlvbklkLCBndWlsZElkKSxcbiAgICAgICAgcmVzdE9wdGlvbnMsXG4gICAgICApXG4gICAgfSxcblxuICAgIGFzeW5jIGdldEFwcGxpY2F0aW9uSW5mbygpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkQXBwbGljYXRpb24+KHJlc3Qucm91dGVzLm9hdXRoMi5hcHBsaWNhdGlvbigpKVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0QXBwbGljYXRpb25JbmZvKGJvZHkpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBhdGNoPERpc2NvcmRBcHBsaWNhdGlvbj4ocmVzdC5yb3V0ZXMuYXBwbGljYXRpb24oKSwge1xuICAgICAgICBib2R5LFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0Q3VycmVudEF1dGhlbnRpY2F0aW9uSW5mbyh0b2tlbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRDdXJyZW50QXV0aG9yaXphdGlvbj4ocmVzdC5yb3V0ZXMub2F1dGgyLmN1cnJlbnRBdXRob3JpemF0aW9uKCksIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIGF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0b2tlbn1gLFxuICAgICAgICB9LFxuICAgICAgICB1bmF1dGhvcml6ZWQ6IHRydWUsXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBleGNoYW5nZVRva2VuKGNsaWVudElkLCBjbGllbnRTZWNyZXQsIGJvZHkpIHtcbiAgICAgIGNvbnN0IGJhc2ljQ3JlZGVudGlhbHMgPSBCdWZmZXIuZnJvbShgJHtjbGllbnRJZH06JHtjbGllbnRTZWNyZXR9YClcblxuICAgICAgY29uc3QgcmVzdE9wdGlvbnM6IE1ha2VSZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICAgICAgYm9keSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcbiAgICAgICAgICBhdXRob3JpemF0aW9uOiBgQmFzaWMgJHtiYXNpY0NyZWRlbnRpYWxzLnRvU3RyaW5nKCdiYXNlNjQnKX1gLFxuICAgICAgICB9LFxuICAgICAgICBydW5UaHJvdWdoUXVldWU6IGZhbHNlLFxuICAgICAgICB1bmF1dGhvcml6ZWQ6IHRydWUsXG4gICAgICB9XG5cbiAgICAgIGlmIChib2R5LmdyYW50VHlwZSA9PT0gJ2NsaWVudF9jcmVkZW50aWFscycpIHtcbiAgICAgICAgcmVzdE9wdGlvbnMuYm9keS5zY29wZSA9IGJvZHkuc2NvcGUuam9pbignICcpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8RGlzY29yZEFjY2Vzc1Rva2VuUmVzcG9uc2U+KHJlc3Qucm91dGVzLm9hdXRoMi50b2tlbkV4Y2hhbmdlKCksIHJlc3RPcHRpb25zKVxuICAgIH0sXG5cbiAgICBhc3luYyByZXZva2VUb2tlbihjbGllbnRJZCwgY2xpZW50U2VjcmV0LCBib2R5KSB7XG4gICAgICBjb25zdCBiYXNpY0NyZWRlbnRpYWxzID0gQnVmZmVyLmZyb20oYCR7Y2xpZW50SWR9OiR7Y2xpZW50U2VjcmV0fWApXG5cbiAgICAgIGF3YWl0IHJlc3QucG9zdChyZXN0LnJvdXRlcy5vYXV0aDIudG9rZW5SZXZva2UoKSwge1xuICAgICAgICBib2R5LFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnLFxuICAgICAgICAgIGF1dGhvcml6YXRpb246IGBCYXNpYyAke2Jhc2ljQ3JlZGVudGlhbHMudG9TdHJpbmcoJ2Jhc2U2NCcpfWAsXG4gICAgICAgIH0sXG4gICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGdldEF1ZGl0TG9nKGd1aWxkSWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkQXVkaXRMb2c+KHJlc3Qucm91dGVzLmd1aWxkcy5hdWRpdGxvZ3MoZ3VpbGRJZCwgb3B0aW9ucykpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldEF1dG9tb2RSdWxlKGd1aWxkSWQsIHJ1bGVJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRBdXRvTW9kZXJhdGlvblJ1bGU+KHJlc3Qucm91dGVzLmd1aWxkcy5hdXRvbW9kLnJ1bGUoZ3VpbGRJZCwgcnVsZUlkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0QXV0b21vZFJ1bGVzKGd1aWxkSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkQXV0b01vZGVyYXRpb25SdWxlW10+KHJlc3Qucm91dGVzLmd1aWxkcy5hdXRvbW9kLnJ1bGVzKGd1aWxkSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRBdmFpbGFibGVWb2ljZVJlZ2lvbnMoKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFZvaWNlUmVnaW9uW10+KHJlc3Qucm91dGVzLnJlZ2lvbnMoKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0QmFuKGd1aWxkSWQsIHVzZXJJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRCYW4+KHJlc3Qucm91dGVzLmd1aWxkcy5tZW1iZXJzLmJhbihndWlsZElkLCB1c2VySWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRCYW5zKGd1aWxkSWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkQmFuW10+KHJlc3Qucm91dGVzLmd1aWxkcy5tZW1iZXJzLmJhbnMoZ3VpbGRJZCwgb3B0aW9ucykpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldENoYW5uZWwoaWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkQ2hhbm5lbD4ocmVzdC5yb3V0ZXMuY2hhbm5lbHMuY2hhbm5lbChpZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldENoYW5uZWxJbnZpdGVzKGNoYW5uZWxJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRJbnZpdGVNZXRhZGF0YVtdPihyZXN0LnJvdXRlcy5jaGFubmVscy5pbnZpdGVzKGNoYW5uZWxJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldENoYW5uZWxzKGd1aWxkSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkQ2hhbm5lbFtdPihyZXN0LnJvdXRlcy5ndWlsZHMuY2hhbm5lbHMoZ3VpbGRJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldENoYW5uZWxXZWJob29rcyhjaGFubmVsSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkV2ViaG9va1tdPihyZXN0LnJvdXRlcy5jaGFubmVscy53ZWJob29rcyhjaGFubmVsSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXREbUNoYW5uZWwodXNlcklkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PERpc2NvcmRDaGFubmVsPihyZXN0LnJvdXRlcy5jaGFubmVscy5kbSgpLCB7XG4gICAgICAgIGJvZHk6IHsgcmVjaXBpZW50SWQ6IHVzZXJJZCB9LFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0R3JvdXBEbUNoYW5uZWwoYm9keSkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucG9zdDxEaXNjb3JkQ2hhbm5lbD4ocmVzdC5yb3V0ZXMuY2hhbm5lbHMuZG0oKSwge1xuICAgICAgICBib2R5LFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0RW1vamkoZ3VpbGRJZCwgZW1vamlJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRFbW9qaT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLmVtb2ppKGd1aWxkSWQsIGVtb2ppSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRBcHBsaWNhdGlvbkVtb2ppKGVtb2ppSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkRW1vamk+KHJlc3Qucm91dGVzLmFwcGxpY2F0aW9uRW1vamkocmVzdC5hcHBsaWNhdGlvbklkLCBlbW9qaUlkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0RW1vamlzKGd1aWxkSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkRW1vamlbXT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLmVtb2ppcyhndWlsZElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0QXBwbGljYXRpb25FbW9qaXMoKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8eyBpdGVtczogRGlzY29yZEVtb2ppW10gfT4ocmVzdC5yb3V0ZXMuYXBwbGljYXRpb25FbW9qaXMocmVzdC5hcHBsaWNhdGlvbklkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0Rm9sbG93dXBNZXNzYWdlKHRva2VuLCBtZXNzYWdlSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkTWVzc2FnZT4ocmVzdC5yb3V0ZXMuaW50ZXJhY3Rpb25zLnJlc3BvbnNlcy5tZXNzYWdlKHJlc3QuYXBwbGljYXRpb25JZCwgdG9rZW4sIG1lc3NhZ2VJZCksIHsgdW5hdXRob3JpemVkOiB0cnVlIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGdldEdhdGV3YXlCb3QoKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZEdldEdhdGV3YXlCb3Q+KHJlc3Qucm91dGVzLmdhdGV3YXlCb3QoKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0R2xvYmFsQXBwbGljYXRpb25Db21tYW5kKGNvbW1hbmRJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRBcHBsaWNhdGlvbkNvbW1hbmQ+KHJlc3Qucm91dGVzLmludGVyYWN0aW9ucy5jb21tYW5kcy5jb21tYW5kKHJlc3QuYXBwbGljYXRpb25JZCwgY29tbWFuZElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0R2xvYmFsQXBwbGljYXRpb25Db21tYW5kcyhvcHRpb25zKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZEFwcGxpY2F0aW9uQ29tbWFuZFtdPihyZXN0LnJvdXRlcy5pbnRlcmFjdGlvbnMuY29tbWFuZHMuY29tbWFuZHMocmVzdC5hcHBsaWNhdGlvbklkLCBvcHRpb25zPy53aXRoTG9jYWxpemF0aW9ucykpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldEd1aWxkKGd1aWxkSWQsIG9wdGlvbnMgPSB7IGNvdW50czogdHJ1ZSB9KSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZEd1aWxkPihyZXN0LnJvdXRlcy5ndWlsZHMuZ3VpbGQoZ3VpbGRJZCwgb3B0aW9ucy5jb3VudHMpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRHdWlsZHModG9rZW4sIG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IG1ha2VSZXF1ZXN0T3B0aW9uczogTWFrZVJlcXVlc3RPcHRpb25zIHwgdW5kZWZpbmVkID0gdG9rZW5cbiAgICAgICAgPyB7XG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgIGF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0b2tlbn1gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgICAgICB9XG4gICAgICAgIDogdW5kZWZpbmVkXG5cbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxQYXJ0aWFsPERpc2NvcmRHdWlsZD5bXT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLnVzZXJHdWlsZHMob3B0aW9ucyksIG1ha2VSZXF1ZXN0T3B0aW9ucylcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0R3VpbGRBcHBsaWNhdGlvbkNvbW1hbmQoY29tbWFuZElkLCBndWlsZElkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZEFwcGxpY2F0aW9uQ29tbWFuZD4ocmVzdC5yb3V0ZXMuaW50ZXJhY3Rpb25zLmNvbW1hbmRzLmd1aWxkcy5vbmUocmVzdC5hcHBsaWNhdGlvbklkLCBndWlsZElkLCBjb21tYW5kSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRHdWlsZEFwcGxpY2F0aW9uQ29tbWFuZHMoZ3VpbGRJZCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRBcHBsaWNhdGlvbkNvbW1hbmRbXT4oXG4gICAgICAgIHJlc3Qucm91dGVzLmludGVyYWN0aW9ucy5jb21tYW5kcy5ndWlsZHMuYWxsKHJlc3QuYXBwbGljYXRpb25JZCwgZ3VpbGRJZCwgb3B0aW9ucz8ud2l0aExvY2FsaXphdGlvbnMpLFxuICAgICAgKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRHdWlsZFByZXZpZXcoZ3VpbGRJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRHdWlsZFByZXZpZXc+KHJlc3Qucm91dGVzLmd1aWxkcy5wcmV2aWV3KGd1aWxkSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRHdWlsZFRlbXBsYXRlKHRlbXBsYXRlQ29kZSkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRUZW1wbGF0ZT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLnRlbXBsYXRlcy5jb2RlKHRlbXBsYXRlQ29kZSkpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldEd1aWxkVGVtcGxhdGVzKGd1aWxkSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkVGVtcGxhdGVbXT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLnRlbXBsYXRlcy5hbGwoZ3VpbGRJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldEd1aWxkV2ViaG9va3MoZ3VpbGRJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRXZWJob29rW10+KHJlc3Qucm91dGVzLmd1aWxkcy53ZWJob29rcyhndWlsZElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0SW50ZWdyYXRpb25zKGd1aWxkSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkSW50ZWdyYXRpb25bXT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLmludGVncmF0aW9ucyhndWlsZElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0SW52aXRlKGludml0ZUNvZGUsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkSW52aXRlTWV0YWRhdGE+KHJlc3Qucm91dGVzLmd1aWxkcy5pbnZpdGUoaW52aXRlQ29kZSwgb3B0aW9ucykpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldEludml0ZXMoZ3VpbGRJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRJbnZpdGVNZXRhZGF0YVtdPihyZXN0LnJvdXRlcy5ndWlsZHMuaW52aXRlcyhndWlsZElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0TWVzc2FnZShjaGFubmVsSWQsIG1lc3NhZ2VJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRNZXNzYWdlPihyZXN0LnJvdXRlcy5jaGFubmVscy5tZXNzYWdlKGNoYW5uZWxJZCwgbWVzc2FnZUlkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0TWVzc2FnZXMoY2hhbm5lbElkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZE1lc3NhZ2VbXT4ocmVzdC5yb3V0ZXMuY2hhbm5lbHMubWVzc2FnZXMoY2hhbm5lbElkLCBvcHRpb25zKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0U3RpY2tlclBhY2soc3RpY2tlclBhY2tJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRTdGlja2VyUGFjaz4ocmVzdC5yb3V0ZXMuc3RpY2tlclBhY2soc3RpY2tlclBhY2tJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldFN0aWNrZXJQYWNrcygpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkU3RpY2tlclBhY2tbXT4ocmVzdC5yb3V0ZXMuc3RpY2tlclBhY2tzKCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldE9yaWdpbmFsSW50ZXJhY3Rpb25SZXNwb25zZSh0b2tlbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRNZXNzYWdlPihyZXN0LnJvdXRlcy5pbnRlcmFjdGlvbnMucmVzcG9uc2VzLm9yaWdpbmFsKHJlc3QuYXBwbGljYXRpb25JZCwgdG9rZW4pLCB7IHVuYXV0aG9yaXplZDogdHJ1ZSB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRDaGFubmVsUGlucyhjaGFubmVsSWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldChyZXN0LnJvdXRlcy5jaGFubmVscy5tZXNzYWdlUGlucyhjaGFubmVsSWQsIG9wdGlvbnMpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRQaW5uZWRNZXNzYWdlcyhjaGFubmVsSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkTWVzc2FnZVtdPihyZXN0LnJvdXRlcy5jaGFubmVscy5waW5zKGNoYW5uZWxJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldFByaXZhdGVBcmNoaXZlZFRocmVhZHMoY2hhbm5lbElkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZExpc3RBcmNoaXZlZFRocmVhZHM+KHJlc3Qucm91dGVzLmNoYW5uZWxzLnRocmVhZHMucHJpdmF0ZShjaGFubmVsSWQsIG9wdGlvbnMpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRQcml2YXRlSm9pbmVkQXJjaGl2ZWRUaHJlYWRzKGNoYW5uZWxJZCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRMaXN0QXJjaGl2ZWRUaHJlYWRzPihyZXN0LnJvdXRlcy5jaGFubmVscy50aHJlYWRzLmpvaW5lZChjaGFubmVsSWQsIG9wdGlvbnMpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRQcnVuZUNvdW50KGd1aWxkSWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkUHJ1bmVkQ291bnQ+KHJlc3Qucm91dGVzLmd1aWxkcy5wcnVuZShndWlsZElkLCBvcHRpb25zKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0UHVibGljQXJjaGl2ZWRUaHJlYWRzKGNoYW5uZWxJZCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRMaXN0QXJjaGl2ZWRUaHJlYWRzPihyZXN0LnJvdXRlcy5jaGFubmVscy50aHJlYWRzLnB1YmxpYyhjaGFubmVsSWQsIG9wdGlvbnMpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRSb2xlcyhndWlsZElkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFJvbGVbXT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLnJvbGVzLmFsbChndWlsZElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0Um9sZShndWlsZElkLCByb2xlSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkUm9sZT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLnJvbGVzLm9uZShndWlsZElkLCByb2xlSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRTY2hlZHVsZWRFdmVudChndWlsZElkLCBldmVudElkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFNjaGVkdWxlZEV2ZW50PihyZXN0LnJvdXRlcy5ndWlsZHMuZXZlbnRzLmV2ZW50KGd1aWxkSWQsIGV2ZW50SWQsIG9wdGlvbnM/LndpdGhVc2VyQ291bnQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRTY2hlZHVsZWRFdmVudHMoZ3VpbGRJZCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRTY2hlZHVsZWRFdmVudFtdPihyZXN0LnJvdXRlcy5ndWlsZHMuZXZlbnRzLmV2ZW50cyhndWlsZElkLCBvcHRpb25zPy53aXRoVXNlckNvdW50KSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0U2NoZWR1bGVkRXZlbnRVc2VycyhndWlsZElkLCBldmVudElkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8QXJyYXk8eyB1c2VyOiBEaXNjb3JkVXNlcjsgbWVtYmVyPzogRGlzY29yZE1lbWJlciB9Pj4ocmVzdC5yb3V0ZXMuZ3VpbGRzLmV2ZW50cy51c2VycyhndWlsZElkLCBldmVudElkLCBvcHRpb25zKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0U2Vzc2lvbkluZm8oKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXRHYXRld2F5Qm90KClcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0U3RhZ2VJbnN0YW5jZShjaGFubmVsSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkU3RhZ2VJbnN0YW5jZT4ocmVzdC5yb3V0ZXMuY2hhbm5lbHMuc3RhZ2UoY2hhbm5lbElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0T3duVm9pY2VTdGF0ZShndWlsZElkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFZvaWNlU3RhdGU+KHJlc3Qucm91dGVzLmd1aWxkcy52b2ljZShndWlsZElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0VXNlclZvaWNlU3RhdGUoZ3VpbGRJZCwgdXNlcklkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFZvaWNlU3RhdGU+KHJlc3Qucm91dGVzLmd1aWxkcy52b2ljZShndWlsZElkLCB1c2VySWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRTdGlja2VyKHN0aWNrZXJJZDogQmlnU3RyaW5nKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFN0aWNrZXI+KHJlc3Qucm91dGVzLnN0aWNrZXIoc3RpY2tlcklkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0R3VpbGRTdGlja2VyKGd1aWxkSWQsIHN0aWNrZXJJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRTdGlja2VyPihyZXN0LnJvdXRlcy5ndWlsZHMuc3RpY2tlcihndWlsZElkLCBzdGlja2VySWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRHdWlsZFN0aWNrZXJzKGd1aWxkSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkU3RpY2tlcltdPihyZXN0LnJvdXRlcy5ndWlsZHMuc3RpY2tlcnMoZ3VpbGRJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldFRocmVhZE1lbWJlcihjaGFubmVsSWQsIHVzZXJJZCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRUaHJlYWRNZW1iZXI+KHJlc3Qucm91dGVzLmNoYW5uZWxzLnRocmVhZHMuZ2V0VXNlcihjaGFubmVsSWQsIHVzZXJJZCwgb3B0aW9ucykpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldFRocmVhZE1lbWJlcnMoY2hhbm5lbElkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFRocmVhZE1lbWJlcltdPihyZXN0LnJvdXRlcy5jaGFubmVscy50aHJlYWRzLm1lbWJlcnMoY2hhbm5lbElkLCBvcHRpb25zKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0UmVhY3Rpb25zKGNoYW5uZWxJZCwgbWVzc2FnZUlkLCByZWFjdGlvbiwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRVc2VyW10+KHJlc3Qucm91dGVzLmNoYW5uZWxzLnJlYWN0aW9ucy5tZXNzYWdlKGNoYW5uZWxJZCwgbWVzc2FnZUlkLCByZWFjdGlvbiwgb3B0aW9ucykpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldFVzZXIoaWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkVXNlcj4ocmVzdC5yb3V0ZXMudXNlcihpZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldEN1cnJlbnRVc2VyKHRva2VuKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFVzZXI+KHJlc3Qucm91dGVzLmN1cnJlbnRVc2VyKCksIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIGF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0b2tlbn1gLFxuICAgICAgICB9LFxuICAgICAgICB1bmF1dGhvcml6ZWQ6IHRydWUsXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRVc2VyQ29ubmVjdGlvbnModG9rZW4pIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkQ29ubmVjdGlvbltdPihyZXN0LnJvdXRlcy5vYXV0aDIuY29ubmVjdGlvbnMoKSwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgYXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rva2VufWAsXG4gICAgICAgIH0sXG4gICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGdldFVzZXJBcHBsaWNhdGlvblJvbGVDb25uZWN0aW9uKHRva2VuLCBhcHBsaWNhdGlvbklkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZEFwcGxpY2F0aW9uUm9sZUNvbm5lY3Rpb24+KHJlc3Qucm91dGVzLm9hdXRoMi5yb2xlQ29ubmVjdGlvbnMoYXBwbGljYXRpb25JZCksIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIGF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0b2tlbn1gLFxuICAgICAgICB9LFxuICAgICAgICB1bmF1dGhvcml6ZWQ6IHRydWUsXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRWYW5pdHlVcmwoZ3VpbGRJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRWYW5pdHlVcmw+KHJlc3Qucm91dGVzLmd1aWxkcy52YW5pdHkoZ3VpbGRJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldFZvaWNlUmVnaW9ucyhndWlsZElkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFZvaWNlUmVnaW9uW10+KHJlc3Qucm91dGVzLmd1aWxkcy5yZWdpb25zKGd1aWxkSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRXZWJob29rKHdlYmhvb2tJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRXZWJob29rPihyZXN0LnJvdXRlcy53ZWJob29rcy5pZCh3ZWJob29rSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRXZWJob29rTWVzc2FnZSh3ZWJob29rSWQsIHRva2VuLCBtZXNzYWdlSWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkTWVzc2FnZT4ocmVzdC5yb3V0ZXMud2ViaG9va3MubWVzc2FnZSh3ZWJob29rSWQsIHRva2VuLCBtZXNzYWdlSWQsIG9wdGlvbnMpLCB7XG4gICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGdldFdlYmhvb2tXaXRoVG9rZW4od2ViaG9va0lkLCB0b2tlbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRXZWJob29rPihyZXN0LnJvdXRlcy53ZWJob29rcy53ZWJob29rKHdlYmhvb2tJZCwgdG9rZW4pLCB7XG4gICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGdldFdlbGNvbWVTY3JlZW4oZ3VpbGRJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRXZWxjb21lU2NyZWVuPihyZXN0LnJvdXRlcy5ndWlsZHMud2VsY29tZShndWlsZElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0V2lkZ2V0KGd1aWxkSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkR3VpbGRXaWRnZXQ+KHJlc3Qucm91dGVzLmd1aWxkcy53aWRnZXRKc29uKGd1aWxkSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRXaWRnZXRTZXR0aW5ncyhndWlsZElkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZEd1aWxkV2lkZ2V0U2V0dGluZ3M+KHJlc3Qucm91dGVzLmd1aWxkcy53aWRnZXQoZ3VpbGRJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGpvaW5UaHJlYWQoY2hhbm5lbElkKSB7XG4gICAgICBhd2FpdCByZXN0LnB1dChyZXN0LnJvdXRlcy5jaGFubmVscy50aHJlYWRzLm1lKGNoYW5uZWxJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGxlYXZlR3VpbGQoZ3VpbGRJZCkge1xuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuZ3VpbGRzLmxlYXZlKGd1aWxkSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBsZWF2ZVRocmVhZChjaGFubmVsSWQpIHtcbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLmNoYW5uZWxzLnRocmVhZHMubWUoY2hhbm5lbElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgcHVibGlzaE1lc3NhZ2UoY2hhbm5lbElkLCBtZXNzYWdlSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8RGlzY29yZE1lc3NhZ2U+KHJlc3Qucm91dGVzLmNoYW5uZWxzLmNyb3NzcG9zdChjaGFubmVsSWQsIG1lc3NhZ2VJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIHJlbW92ZVJvbGUoZ3VpbGRJZCwgdXNlcklkLCByb2xlSWQsIHJlYXNvbikge1xuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuZ3VpbGRzLnJvbGVzLm1lbWJlcihndWlsZElkLCB1c2VySWQsIHJvbGVJZCksIHsgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIHJlbW92ZVRocmVhZE1lbWJlcihjaGFubmVsSWQsIHVzZXJJZCkge1xuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuY2hhbm5lbHMudGhyZWFkcy51c2VyKGNoYW5uZWxJZCwgdXNlcklkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgcmVtb3ZlRG1SZWNpcGllbnQoY2hhbm5lbElkLCB1c2VySWQpIHtcbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLmNoYW5uZWxzLmRtUmVjaXBpZW50KGNoYW5uZWxJZCwgdXNlcklkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgc2VuZEZvbGxvd3VwTWVzc2FnZSh0b2tlbiwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucG9zdChyZXN0LnJvdXRlcy53ZWJob29rcy53ZWJob29rKHJlc3QuYXBwbGljYXRpb25JZCwgdG9rZW4pLCB7XG4gICAgICAgIGJvZHk6IG9wdGlvbnMsXG4gICAgICAgIGZpbGVzOiBvcHRpb25zLmZpbGVzLFxuICAgICAgICB1bmF1dGhvcml6ZWQ6IHRydWUsXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBzZW5kSW50ZXJhY3Rpb25SZXNwb25zZShpbnRlcmFjdGlvbklkLCB0b2tlbiwgb3B0aW9ucywgcGFyYW1zKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PHZvaWQgfCBEaXNjb3JkSW50ZXJhY3Rpb25DYWxsYmFja1Jlc3BvbnNlPihyZXN0LnJvdXRlcy5pbnRlcmFjdGlvbnMucmVzcG9uc2VzLmNhbGxiYWNrKGludGVyYWN0aW9uSWQsIHRva2VuLCBwYXJhbXMpLCB7XG4gICAgICAgIGJvZHk6IG9wdGlvbnMsXG4gICAgICAgIGZpbGVzOiBvcHRpb25zLmRhdGE/LmZpbGVzLFxuICAgICAgICBydW5UaHJvdWdoUXVldWU6IGZhbHNlLFxuICAgICAgICB1bmF1dGhvcml6ZWQ6IHRydWUsXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBzZW5kTWVzc2FnZShjaGFubmVsSWQsIGJvZHkpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8RGlzY29yZE1lc3NhZ2U+KHJlc3Qucm91dGVzLmNoYW5uZWxzLm1lc3NhZ2VzKGNoYW5uZWxJZCksIHsgYm9keSwgZmlsZXM6IGJvZHkuZmlsZXMgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgc3RhcnRUaHJlYWRXaXRoTWVzc2FnZShjaGFubmVsSWQsIG1lc3NhZ2VJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PERpc2NvcmRDaGFubmVsPihyZXN0LnJvdXRlcy5jaGFubmVscy50aHJlYWRzLm1lc3NhZ2UoY2hhbm5lbElkLCBtZXNzYWdlSWQpLCB7IGJvZHksIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBzdGFydFRocmVhZFdpdGhvdXRNZXNzYWdlKGNoYW5uZWxJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PERpc2NvcmRDaGFubmVsPihyZXN0LnJvdXRlcy5jaGFubmVscy50aHJlYWRzLmFsbChjaGFubmVsSWQpLCB7IGJvZHksIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRQb2xsQW5zd2VyVm90ZXJzKGNoYW5uZWxJZCwgbWVzc2FnZUlkLCBhbnN3ZXJJZCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRHZXRBbnN3ZXJWb3Rlc1Jlc3BvbnNlPihyZXN0LnJvdXRlcy5jaGFubmVscy5wb2xscy52b3RlcyhjaGFubmVsSWQsIG1lc3NhZ2VJZCwgYW5zd2VySWQsIG9wdGlvbnMpKVxuICAgIH0sXG5cbiAgICBhc3luYyBlbmRQb2xsKGNoYW5uZWxJZCwgbWVzc2FnZUlkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PERpc2NvcmRNZXNzYWdlPihyZXN0LnJvdXRlcy5jaGFubmVscy5wb2xscy5leHBpcmUoY2hhbm5lbElkLCBtZXNzYWdlSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBzeW5jR3VpbGRUZW1wbGF0ZShndWlsZElkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wdXQ8RGlzY29yZFRlbXBsYXRlPihyZXN0LnJvdXRlcy5ndWlsZHMudGVtcGxhdGVzLmFsbChndWlsZElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgYmFuTWVtYmVyKGd1aWxkSWQsIHVzZXJJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICBhd2FpdCByZXN0LnB1dDx2b2lkPihyZXN0LnJvdXRlcy5ndWlsZHMubWVtYmVycy5iYW4oZ3VpbGRJZCwgdXNlcklkKSwgeyBib2R5LCByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgYnVsa0Jhbk1lbWJlcnMoZ3VpbGRJZCwgb3B0aW9ucywgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PERpc2NvcmRCdWxrQmFuPihyZXN0LnJvdXRlcy5ndWlsZHMubWVtYmVycy5idWxrQmFuKGd1aWxkSWQpLCB7IGJvZHk6IG9wdGlvbnMsIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0Qm90TWVtYmVyKGd1aWxkSWQsIGJvZHksIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucGF0Y2g8RGlzY29yZE1lbWJlcj4ocmVzdC5yb3V0ZXMuZ3VpbGRzLm1lbWJlcnMuYm90KGd1aWxkSWQpLCB7IGJvZHksIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0TWVtYmVyKGd1aWxkSWQsIHVzZXJJZCwgYm9keSwgcmVhc29uKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wYXRjaDxEaXNjb3JkTWVtYmVyV2l0aFVzZXI+KHJlc3Qucm91dGVzLmd1aWxkcy5tZW1iZXJzLm1lbWJlcihndWlsZElkLCB1c2VySWQpLCB7IGJvZHksIHJlYXNvbiB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRNZW1iZXIoZ3VpbGRJZCwgdXNlcklkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZE1lbWJlcldpdGhVc2VyPihyZXN0LnJvdXRlcy5ndWlsZHMubWVtYmVycy5tZW1iZXIoZ3VpbGRJZCwgdXNlcklkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0Q3VycmVudE1lbWJlcihndWlsZElkLCB0b2tlbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRNZW1iZXJXaXRoVXNlcj4ocmVzdC5yb3V0ZXMuZ3VpbGRzLm1lbWJlcnMuY3VycmVudE1lbWJlcihndWlsZElkKSwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgYXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rva2VufWAsXG4gICAgICAgIH0sXG4gICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGdldE1lbWJlcnMoZ3VpbGRJZCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRNZW1iZXJXaXRoVXNlcltdPihyZXN0LnJvdXRlcy5ndWlsZHMubWVtYmVycy5tZW1iZXJzKGd1aWxkSWQsIG9wdGlvbnMpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRBcHBsaWNhdGlvbkFjdGl2aXR5SW5zdGFuY2UoYXBwbGljYXRpb25JZCwgaW5zdGFuY2VJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRBY3Rpdml0eUluc3RhbmNlPihyZXN0LnJvdXRlcy5hcHBsaWNhdGlvbkFjdGl2aXR5SW5zdGFuY2UoYXBwbGljYXRpb25JZCwgaW5zdGFuY2VJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGtpY2tNZW1iZXIoZ3VpbGRJZCwgdXNlcklkLCByZWFzb24pIHtcbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLmd1aWxkcy5tZW1iZXJzLm1lbWJlcihndWlsZElkLCB1c2VySWQpLCB7XG4gICAgICAgIHJlYXNvbixcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIHBpbk1lc3NhZ2UoY2hhbm5lbElkLCBtZXNzYWdlSWQsIHJlYXNvbikge1xuICAgICAgYXdhaXQgcmVzdC5wdXQocmVzdC5yb3V0ZXMuY2hhbm5lbHMubWVzc2FnZVBpbihjaGFubmVsSWQsIG1lc3NhZ2VJZCksIHsgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIHBydW5lTWVtYmVycyhndWlsZElkLCBib2R5LCByZWFzb24pIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8eyBwcnVuZWQ6IG51bWJlciB8IG51bGwgfT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLm1lbWJlcnMucHJ1bmUoZ3VpbGRJZCksIHsgYm9keSwgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIHNlYXJjaE1lbWJlcnMoZ3VpbGRJZCwgcXVlcnksIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkTWVtYmVyV2l0aFVzZXJbXT4ocmVzdC5yb3V0ZXMuZ3VpbGRzLm1lbWJlcnMuc2VhcmNoKGd1aWxkSWQsIHF1ZXJ5LCBvcHRpb25zKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0R3VpbGRPbmJvYXJkaW5nKGd1aWxkSWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkR3VpbGRPbmJvYXJkaW5nPihyZXN0LnJvdXRlcy5ndWlsZHMub25ib2FyZGluZyhndWlsZElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZWRpdEd1aWxkT25ib2FyZGluZyhndWlsZElkLCBvcHRpb25zLCByZWFzb24pIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnB1dDxEaXNjb3JkR3VpbGRPbmJvYXJkaW5nPihyZXN0LnJvdXRlcy5ndWlsZHMub25ib2FyZGluZyhndWlsZElkKSwge1xuICAgICAgICBib2R5OiBvcHRpb25zLFxuICAgICAgICByZWFzb24sXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBtb2RpZnlHdWlsZEluY2lkZW50QWN0aW9ucyhndWlsZElkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wdXQ8RGlzY29yZEluY2lkZW50c0RhdGE+KHJlc3Qucm91dGVzLmd1aWxkcy5pbmNpZGVudEFjdGlvbnMoZ3VpbGRJZCksIHsgYm9keTogb3B0aW9ucyB9KVxuICAgIH0sXG5cbiAgICBhc3luYyB1bmJhbk1lbWJlcihndWlsZElkLCB1c2VySWQsIHJlYXNvbikge1xuICAgICAgYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMuZ3VpbGRzLm1lbWJlcnMuYmFuKGd1aWxkSWQsIHVzZXJJZCksIHsgcmVhc29uIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIHVucGluTWVzc2FnZShjaGFubmVsSWQsIG1lc3NhZ2VJZCwgcmVhc29uKSB7XG4gICAgICBhd2FpdCByZXN0LmRlbGV0ZShyZXN0LnJvdXRlcy5jaGFubmVscy5tZXNzYWdlUGluKGNoYW5uZWxJZCwgbWVzc2FnZUlkKSwgeyByZWFzb24gfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgdHJpZ2dlclR5cGluZ0luZGljYXRvcihjaGFubmVsSWQpIHtcbiAgICAgIGF3YWl0IHJlc3QucG9zdChyZXN0LnJvdXRlcy5jaGFubmVscy50eXBpbmcoY2hhbm5lbElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgdXBzZXJ0R2xvYmFsQXBwbGljYXRpb25Db21tYW5kcyhib2R5LCBvcHRpb25zKSB7XG4gICAgICBjb25zdCByZXN0T3B0aW9uczogTWFrZVJlcXVlc3RPcHRpb25zID0geyBib2R5IH1cblxuICAgICAgaWYgKG9wdGlvbnM/LmJlYXJlclRva2VuKSB7XG4gICAgICAgIHJlc3RPcHRpb25zLnVuYXV0aG9yaXplZCA9IHRydWVcbiAgICAgICAgcmVzdE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uOiBgQmVhcmVyICR7b3B0aW9ucy5iZWFyZXJUb2tlbn1gLFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnB1dDxEaXNjb3JkQXBwbGljYXRpb25Db21tYW5kW10+KHJlc3Qucm91dGVzLmludGVyYWN0aW9ucy5jb21tYW5kcy5jb21tYW5kcyhyZXN0LmFwcGxpY2F0aW9uSWQpLCByZXN0T3B0aW9ucylcbiAgICB9LFxuXG4gICAgYXN5bmMgdXBzZXJ0R3VpbGRBcHBsaWNhdGlvbkNvbW1hbmRzKGd1aWxkSWQsIGJvZHksIG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IHJlc3RPcHRpb25zOiBNYWtlUmVxdWVzdE9wdGlvbnMgPSB7IGJvZHkgfVxuXG4gICAgICBpZiAob3B0aW9ucz8uYmVhcmVyVG9rZW4pIHtcbiAgICAgICAgcmVzdE9wdGlvbnMudW5hdXRob3JpemVkID0gdHJ1ZVxuICAgICAgICByZXN0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgIGF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtvcHRpb25zLmJlYXJlclRva2VufWAsXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucHV0PERpc2NvcmRBcHBsaWNhdGlvbkNvbW1hbmRbXT4ocmVzdC5yb3V0ZXMuaW50ZXJhY3Rpb25zLmNvbW1hbmRzLmd1aWxkcy5hbGwocmVzdC5hcHBsaWNhdGlvbklkLCBndWlsZElkKSwgcmVzdE9wdGlvbnMpXG4gICAgfSxcblxuICAgIGFzeW5jIGVkaXRVc2VyQXBwbGljYXRpb25Sb2xlQ29ubmVjdGlvbih0b2tlbiwgYXBwbGljYXRpb25JZCwgYm9keSkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucHV0PERpc2NvcmRBcHBsaWNhdGlvblJvbGVDb25uZWN0aW9uPihyZXN0LnJvdXRlcy5vYXV0aDIucm9sZUNvbm5lY3Rpb25zKGFwcGxpY2F0aW9uSWQpLCB7XG4gICAgICAgIGJvZHksXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dG9rZW59YCxcbiAgICAgICAgfSxcbiAgICAgICAgdW5hdXRob3JpemVkOiB0cnVlLFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgYWRkR3VpbGRNZW1iZXIoZ3VpbGRJZCwgdXNlcklkLCBib2R5KSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wdXQocmVzdC5yb3V0ZXMuZ3VpbGRzLm1lbWJlcnMubWVtYmVyKGd1aWxkSWQsIHVzZXJJZCksIHtcbiAgICAgICAgYm9keSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGNyZWF0ZVRlc3RFbnRpdGxlbWVudChhcHBsaWNhdGlvbklkLCBib2R5KSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wb3N0PERpc2NvcmRFbnRpdGxlbWVudD4ocmVzdC5yb3V0ZXMubW9uZXRpemF0aW9uLmVudGl0bGVtZW50cyhhcHBsaWNhdGlvbklkKSwge1xuICAgICAgICBib2R5LFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgbGlzdEVudGl0bGVtZW50cyhhcHBsaWNhdGlvbklkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZEVudGl0bGVtZW50W10+KHJlc3Qucm91dGVzLm1vbmV0aXphdGlvbi5lbnRpdGxlbWVudHMoYXBwbGljYXRpb25JZCwgb3B0aW9ucykpXG4gICAgfSxcblxuICAgIGFzeW5jIGdldEVudGl0bGVtZW50KGFwcGxpY2F0aW9uSWQsIGVudGl0bGVtZW50SWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkRW50aXRsZW1lbnQ+KHJlc3Qucm91dGVzLm1vbmV0aXphdGlvbi5lbnRpdGxlbWVudChhcHBsaWNhdGlvbklkLCBlbnRpdGxlbWVudElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZGVsZXRlVGVzdEVudGl0bGVtZW50KGFwcGxpY2F0aW9uSWQsIGVudGl0bGVtZW50SWQpIHtcbiAgICAgIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLm1vbmV0aXphdGlvbi5lbnRpdGxlbWVudChhcHBsaWNhdGlvbklkLCBlbnRpdGxlbWVudElkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgY29uc3VtZUVudGl0bGVtZW50KGFwcGxpY2F0aW9uSWQsIGVudGl0bGVtZW50SWQpIHtcbiAgICAgIGF3YWl0IHJlc3QucG9zdChyZXN0LnJvdXRlcy5tb25ldGl6YXRpb24uY29uc3VtZUVudGl0bGVtZW50KGFwcGxpY2F0aW9uSWQsIGVudGl0bGVtZW50SWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBsaXN0U2t1cyhhcHBsaWNhdGlvbklkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFNrdVtdPihyZXN0LnJvdXRlcy5tb25ldGl6YXRpb24uc2t1cyhhcHBsaWNhdGlvbklkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgbGlzdFN1YnNjcmlwdGlvbnMoc2t1SWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmdldDxEaXNjb3JkU3Vic2NyaXB0aW9uW10+KHJlc3Qucm91dGVzLm1vbmV0aXphdGlvbi5zdWJzY3JpcHRpb25zKHNrdUlkLCBvcHRpb25zKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0U3Vic2NyaXB0aW9uKHNrdUlkLCBzdWJzY3JpcHRpb25JZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRTdWJzY3JpcHRpb24+KHJlc3Qucm91dGVzLm1vbmV0aXphdGlvbi5zdWJzY3JpcHRpb24oc2t1SWQsIHN1YnNjcmlwdGlvbklkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgc2VuZFNvdW5kYm9hcmRTb3VuZChjaGFubmVsSWQsIG9wdGlvbnMpIHtcbiAgICAgIGF3YWl0IHJlc3QucG9zdChyZXN0LnJvdXRlcy5zb3VuZGJvYXJkLnNlbmRTb3VuZChjaGFubmVsSWQpLCB7XG4gICAgICAgIGJvZHk6IG9wdGlvbnMsXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBsaXN0RGVmYXVsdFNvdW5kYm9hcmRTb3VuZHMoKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFNvdW5kYm9hcmRTb3VuZFtdPihyZXN0LnJvdXRlcy5zb3VuZGJvYXJkLmxpc3REZWZhdWx0KCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGxpc3RHdWlsZFNvdW5kYm9hcmRTb3VuZHMoZ3VpbGRJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PHsgaXRlbXM6IERpc2NvcmRTb3VuZGJvYXJkU291bmRbXSB9PihyZXN0LnJvdXRlcy5zb3VuZGJvYXJkLmd1aWxkU291bmRzKGd1aWxkSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRHdWlsZFNvdW5kYm9hcmRTb3VuZChndWlsZElkLCBzb3VuZElkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5nZXQ8RGlzY29yZFNvdW5kYm9hcmRTb3VuZD4ocmVzdC5yb3V0ZXMuc291bmRib2FyZC5ndWlsZFNvdW5kKGd1aWxkSWQsIHNvdW5kSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyBjcmVhdGVHdWlsZFNvdW5kYm9hcmRTb3VuZChndWlsZElkLCBvcHRpb25zLCByZWFzb24pIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8RGlzY29yZFNvdW5kYm9hcmRTb3VuZD4ocmVzdC5yb3V0ZXMuc291bmRib2FyZC5ndWlsZFNvdW5kcyhndWlsZElkKSwge1xuICAgICAgICBib2R5OiBvcHRpb25zLFxuICAgICAgICByZWFzb24sXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBtb2RpZnlHdWlsZFNvdW5kYm9hcmRTb3VuZChndWlsZElkLCBzb3VuZElkLCBvcHRpb25zLCByZWFzb24pIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8RGlzY29yZFNvdW5kYm9hcmRTb3VuZD4ocmVzdC5yb3V0ZXMuc291bmRib2FyZC5ndWlsZFNvdW5kKGd1aWxkSWQsIHNvdW5kSWQpLCB7XG4gICAgICAgIGJvZHk6IG9wdGlvbnMsXG4gICAgICAgIHJlYXNvbixcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZUd1aWxkU291bmRib2FyZFNvdW5kKGd1aWxkSWQsIHNvdW5kSWQsIHJlYXNvbikge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZGVsZXRlKHJlc3Qucm91dGVzLnNvdW5kYm9hcmQuZ3VpbGRTb3VuZChndWlsZElkLCBzb3VuZElkKSwge1xuICAgICAgICByZWFzb24sXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyBsaXN0QXBwbGljYXRpb25Sb2xlQ29ubmVjdGlvbnNNZXRhZGF0YVJlY29yZHMoYXBwbGljYXRpb25JZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRBcHBsaWNhdGlvblJvbGVDb25uZWN0aW9uTWV0YWRhdGFbXT4ocmVzdC5yb3V0ZXMuYXBwbGljYXRpb25Sb2xlQ29ubmVjdGlvbk1ldGFkYXRhKGFwcGxpY2F0aW9uSWQpKVxuICAgIH0sXG5cbiAgICBhc3luYyB1cGRhdGVBcHBsaWNhdGlvblJvbGVDb25uZWN0aW9uc01ldGFkYXRhUmVjb3JkcyhhcHBsaWNhdGlvbklkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5wdXQ8RGlzY29yZEFwcGxpY2F0aW9uUm9sZUNvbm5lY3Rpb25NZXRhZGF0YVtdPihyZXN0LnJvdXRlcy5hcHBsaWNhdGlvblJvbGVDb25uZWN0aW9uTWV0YWRhdGEoYXBwbGljYXRpb25JZCksIHtcbiAgICAgICAgYm9keTogb3B0aW9ucyxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGNyZWF0ZUxvYmJ5KG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBvc3Q8RGlzY29yZExvYmJ5PihyZXN0LnJvdXRlcy5sb2JieS5jcmVhdGUoKSwge1xuICAgICAgICBib2R5OiBvcHRpb25zLFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0TG9iYnkobG9iYnlJZCkge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QuZ2V0PERpc2NvcmRMb2JieT4ocmVzdC5yb3V0ZXMubG9iYnkubG9iYnkobG9iYnlJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIG1vZGlmeUxvYmJ5KGxvYmJ5SWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBhdGNoPERpc2NvcmRMb2JieT4ocmVzdC5yb3V0ZXMubG9iYnkubG9iYnkobG9iYnlJZCksIHtcbiAgICAgICAgYm9keTogb3B0aW9ucyxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZUxvYmJ5KGxvYmJ5SWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmRlbGV0ZShyZXN0LnJvdXRlcy5sb2JieS5sb2JieShsb2JieUlkKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgYWRkTWVtYmVyVG9Mb2JieShsb2JieUlkLCB1c2VySWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnB1dDxEaXNjb3JkTG9iYnlNZW1iZXI+KHJlc3Qucm91dGVzLmxvYmJ5Lm1lbWJlcihsb2JieUlkLCB1c2VySWQpLCB7XG4gICAgICAgIGJvZHk6IG9wdGlvbnMsXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBhc3luYyByZW1vdmVNZW1iZXJGcm9tTG9iYnkobG9iYnlJZCwgdXNlcklkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgcmVzdC5kZWxldGUocmVzdC5yb3V0ZXMubG9iYnkubWVtYmVyKGxvYmJ5SWQsIHVzZXJJZCkpXG4gICAgfSxcblxuICAgIGFzeW5jIGxlYXZlTG9iYnkobG9iYnlJZCwgYmVhcmVyVG9rZW4pIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LmRlbGV0ZShyZXN0LnJvdXRlcy5sb2JieS5sZWF2ZShsb2JieUlkKSwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgYXV0aG9yaXphdGlvbjogYEJlYXJlciAke2JlYXJlclRva2VufWAsXG4gICAgICAgIH0sXG4gICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGxpbmtDaGFubmVsVG9Mb2JieShsb2JieUlkLCBiZWFyZXJUb2tlbiwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGF3YWl0IHJlc3QucGF0Y2g8RGlzY29yZExvYmJ5PihyZXN0LnJvdXRlcy5sb2JieS5saW5rKGxvYmJ5SWQpLCB7XG4gICAgICAgIGJvZHk6IG9wdGlvbnMsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YmVhcmVyVG9rZW59YCxcbiAgICAgICAgfSxcbiAgICAgICAgdW5hdXRob3JpemVkOiB0cnVlLFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgdW5saW5rQ2hhbm5lbFRvTG9iYnkobG9iYnlJZCwgYmVhcmVyVG9rZW4pIHtcbiAgICAgIHJldHVybiBhd2FpdCByZXN0LnBhdGNoPERpc2NvcmRMb2JieT4ocmVzdC5yb3V0ZXMubG9iYnkubGluayhsb2JieUlkKSwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgYXV0aG9yaXphdGlvbjogYEJlYXJlciAke2JlYXJlclRva2VufWAsXG4gICAgICAgIH0sXG4gICAgICAgIHVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIHByZWZlclNuYWtlQ2FzZShlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICBjb25zdCBjYW1lbGl6ZXIgPSBlbmFibGVkID8gKHg6IGFueSkgPT4geCA6IGNhbWVsaXplXG5cbiAgICAgIHJlc3QuZ2V0ID0gYXN5bmMgKHVybCwgb3B0aW9ucykgPT4ge1xuICAgICAgICByZXR1cm4gY2FtZWxpemVyKGF3YWl0IHJlc3QubWFrZVJlcXVlc3QoJ0dFVCcsIHVybCwgb3B0aW9ucykpXG4gICAgICB9XG5cbiAgICAgIHJlc3QucG9zdCA9IGFzeW5jICh1cmw6IHN0cmluZywgb3B0aW9ucz86IE9taXQ8Q3JlYXRlUmVxdWVzdEJvZHlPcHRpb25zLCAnYm9keScgfCAnbWV0aG9kJz4pID0+IHtcbiAgICAgICAgcmV0dXJuIGNhbWVsaXplcihhd2FpdCByZXN0Lm1ha2VSZXF1ZXN0KCdQT1NUJywgdXJsLCBvcHRpb25zKSlcbiAgICAgIH1cblxuICAgICAgcmVzdC5kZWxldGUgPSBhc3luYyAodXJsOiBzdHJpbmcsIG9wdGlvbnM/OiBPbWl0PENyZWF0ZVJlcXVlc3RCb2R5T3B0aW9ucywgJ2JvZHknIHwgJ21ldGhvZCc+KSA9PiB7XG4gICAgICAgIGNhbWVsaXplcihhd2FpdCByZXN0Lm1ha2VSZXF1ZXN0KCdERUxFVEUnLCB1cmwsIG9wdGlvbnMpKVxuICAgICAgfVxuXG4gICAgICByZXN0LnBhdGNoID0gYXN5bmMgKHVybDogc3RyaW5nLCBvcHRpb25zPzogT21pdDxDcmVhdGVSZXF1ZXN0Qm9keU9wdGlvbnMsICdib2R5JyB8ICdtZXRob2QnPikgPT4ge1xuICAgICAgICByZXR1cm4gY2FtZWxpemVyKGF3YWl0IHJlc3QubWFrZVJlcXVlc3QoJ1BBVENIJywgdXJsLCBvcHRpb25zKSlcbiAgICAgIH1cblxuICAgICAgcmVzdC5wdXQgPSBhc3luYyAodXJsOiBzdHJpbmcsIG9wdGlvbnM/OiBPbWl0PENyZWF0ZVJlcXVlc3RCb2R5T3B0aW9ucywgJ2JvZHknIHwgJ21ldGhvZCc+KSA9PiB7XG4gICAgICAgIHJldHVybiBjYW1lbGl6ZXIoYXdhaXQgcmVzdC5tYWtlUmVxdWVzdCgnUFVUJywgdXJsLCBvcHRpb25zKSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3RcbiAgICB9LFxuICB9XG5cbiAgcmV0dXJuIHJlc3Rcbn1cblxuZW51bSBIdHRwUmVzcG9uc2VDb2RlIHtcbiAgLyoqIE1pbmltdW0gdmFsdWUgb2YgYSBjb2RlIGluIG9kZXIgdG8gY29uc2lkZXIgdGhhdCBpdCB3YXMgc3VjY2Vzc2Z1bC4gKi9cbiAgU3VjY2VzcyA9IDIwMCxcbiAgLyoqIFJlcXVlc3QgY29tcGxldGVkIHN1Y2Nlc3NmdWxseSwgYnV0IERpc2NvcmQgcmV0dXJuZWQgYW4gZW1wdHkgYm9keS4gKi9cbiAgTm9Db250ZW50ID0gMjA0LFxuICAvKiogTWluaW11bSB2YWx1ZSBvZiBhIGNvZGUgaW4gb3JkZXIgdG8gY29uc2lkZXIgdGhhdCBzb21ldGhpbmcgd2VudCB3cm9uZy4gKi9cbiAgRXJyb3IgPSA0MDAsXG4gIC8qKiBUaGlzIHJlcXVlc3QgZ290IHJhdGUgbGltaXRlZC4gKi9cbiAgVG9vTWFueVJlcXVlc3RzID0gNDI5LFxufVxuIl0sIm5hbWVzIjpbIkJ1ZmZlciIsImluc3BlY3QiLCJjYWxjdWxhdGVCaXRzIiwiY2FtZWxpemUiLCJjYW1lbFRvU25ha2VDYXNlIiwiRElTQ09SREVOT19WRVJTSU9OIiwiZGVsYXkiLCJnZXRCb3RJZEZyb21Ub2tlbiIsImhhc1Byb3BlcnR5IiwibG9nZ2VyIiwicHJvY2Vzc1JlYWN0aW9uU3RyaW5nIiwic25vd2ZsYWtlVG9UaW1lc3RhbXAiLCJ1cmxUb0Jhc2U2NCIsImNyZWF0ZUludmFsaWRSZXF1ZXN0QnVja2V0IiwiUXVldWUiLCJjcmVhdGVSb3V0ZXMiLCJESVNDT1JEX0FQSV9WRVJTSU9OIiwiRElTQ09SRF9BUElfVVJMIiwiQVVESVRfTE9HX1JFQVNPTl9IRUFERVIiLCJSQVRFX0xJTUlUX1JFTUFJTklOR19IRUFERVIiLCJSQVRFX0xJTUlUX1JFU0VUX0FGVEVSX0hFQURFUiIsIlJBVEVfTElNSVRfR0xPQkFMX0hFQURFUiIsIlJBVEVfTElNSVRfQlVDS0VUX0hFQURFUiIsIlJBVEVfTElNSVRfTElNSVRfSEVBREVSIiwiUkFURV9MSU1JVF9TQ09QRV9IRUFERVIiLCJjcmVhdGVSZXN0TWFuYWdlciIsIm9wdGlvbnMiLCJhcHBsaWNhdGlvbklkIiwiQmlnSW50IiwidG9rZW4iLCJiYXNlVXJsIiwicHJveHkiLCJiYXNlRXJyb3JQcm90b3R5cGUiLCJjdXN0b20iLCJfZGVwdGgiLCJfaW5zcGVjdCIsImRlcHRoIiwiSW5maW5pdHkiLCJjdXN0b21JbnNwZWN0IiwicmVzdCIsImF1dGhvcml6YXRpb24iLCJhdXRob3JpemF0aW9uSGVhZGVyIiwiZGVsZXRlUXVldWVEZWxheSIsImdsb2JhbGx5UmF0ZUxpbWl0ZWQiLCJpbnZhbGlkQnVja2V0IiwiaXNQcm94aWVkIiwic3RhcnRzV2l0aCIsInVwZGF0ZUJlYXJlclRva2VuRW5kcG9pbnQiLCJtYXhSZXRyeUNvdW50IiwicHJvY2Vzc2luZ1JhdGVMaW1pdGVkUGF0aHMiLCJxdWV1ZXMiLCJNYXAiLCJyYXRlTGltaXRlZFBhdGhzIiwidmVyc2lvbiIsImV2ZW50cyIsInJlcXVlc3QiLCJyZXNwb25zZSIsInJlcXVlc3RFcnJvciIsInJvdXRlcyIsImNyZWF0ZUJhc2VIZWFkZXJzIiwiY2hlY2tSYXRlTGltaXRzIiwidXJsIiwiaWRlbnRpZmllciIsInJhdGVsaW1pdGVkIiwiZ2V0IiwiZ2xvYmFsIiwibm93IiwiRGF0ZSIsInJlc2V0VGltZXN0YW1wIiwidXBkYXRlVG9rZW5RdWV1ZXMiLCJvbGRUb2tlbiIsIm5ld1Rva2VuIiwiRXJyb3IiLCJoZWFkZXJzIiwidW5kZWZpbmVkIiwiZmV0Y2giLCJtZXRob2QiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsIm5ld0lkZW50aWZpZXIiLCJrZXkiLCJxdWV1ZSIsImVudHJpZXMiLCJkZWxldGUiLCJuZXdLZXkiLCJuZXdRdWV1ZSIsIndhaXRpbmciLCJ1bnNoaWZ0IiwicGVuZGluZyIsImNsZWFudXAiLCJzZXQiLCJyYXRlbGltaXRQYXRoIiwiYnVja2V0SWQiLCJjaGFuZ2VUb0Rpc2NvcmRGb3JtYXQiLCJvYmoiLCJBcnJheSIsImlzQXJyYXkiLCJtYXAiLCJpdGVtIiwibmV3T2JqIiwiT2JqZWN0Iiwia2V5cyIsInZhbHVlIiwiaW5jbHVkZXMiLCJkZWZhdWx0X21lbWJlcl9wZXJtaXNzaW9ucyIsIm5hbWVfbG9jYWxpemF0aW9ucyIsImRlc2NyaXB0aW9uX2xvY2FsaXphdGlvbnMiLCJ0b1N0cmluZyIsImNyZWF0ZVJlcXVlc3RCb2R5IiwidW5hdXRob3JpemVkIiwicmVhc29uIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiZmlsZXMiLCJmb3JtIiwiRm9ybURhdGEiLCJpIiwibGVuZ3RoIiwiYXBwZW5kIiwiYmxvYiIsIm5hbWUiLCJmb3JtQm9keSIsImRpc2NvcmRCb2R5IiwicHJvcCIsInB1c2giLCJqb2luIiwiYXNzaWduIiwicHJvY2Vzc1JhdGVMaW1pdGVkUGF0aHMiLCJzaXplIiwic2V0VGltZW91dCIsInByb2Nlc3NIZWFkZXJzIiwicmF0ZUxpbWl0ZWQiLCJyZW1haW5pbmciLCJyZXRyeUFmdGVyIiwicmVzZXQiLCJOdW1iZXIiLCJsaW1pdCIsImhhbmRsZUNvbXBsZXRlZFJlcXVlc3QiLCJpbnRlcnZhbCIsIm1heCIsImdsb2JhbFJlc2V0Iiwic2VuZFJlcXVlc3QiLCJyb3V0ZSIsInBheWxvYWQiLCJyZXF1ZXN0Qm9keU9wdGlvbnMiLCJsb2dnaW5nSGVhZGVycyIsImF1dGhvcml6YXRpb25TY2hlbWUiLCJzcGxpdCIsIlJlcXVlc3QiLCJkZWJ1ZyIsImNhdGNoIiwiZXJyb3IiLCJyZWplY3QiLCJvayIsInN0YXR1cyIsInN0YXR1c1RleHQiLCJqc29uIiwidGV4dCIsInJlcXVlc3RCb2R5IiwicmVzcG9uc2VCb2R5Iiwic2ltcGxpZnlVcmwiLCJyZXRyeUNvdW50IiwicmVzZXRBZnRlciIsInJldHJ5UmVxdWVzdCIsInJlc29sdmUiLCJyb3V0ZUluZm9ybWF0aW9uS2V5IiwicXVlcnlQYXJhbUluZGV4IiwiaW5kZXhPZiIsInNsaWNlIiwic3BsaXR0ZWRSb3V0ZSIsInN0cmlwcGVkUm91dGUiLCJwYXJ0IiwiaW5kZXgiLCJhcnJheSIsImlzTnVtYmVyIiwiaXNGaW5pdGUiLCJwYXJzZUludCIsImlzTWFqb3IiLCJlbmRzV2l0aCIsIm1lc3NhZ2VJZCIsInRpbWVzdGFtcCIsInByb2Nlc3NSZXF1ZXN0IiwicnVuVGhyb3VnaFF1ZXVlIiwicXVldWVJZGVudGlmaWVyIiwibWFrZVJlcXVlc3QiLCJidWNrZXRRdWV1ZSIsInJlc3VsdCIsImNhdXNlIiwiY3JlYXRlIiwicGFyc2UiLCJQcm9taXNlIiwiZGF0YSIsImVycm9yVGV4dCIsIm1lc3NhZ2UiLCJjb2RlIiwicG9zdCIsInBhdGNoIiwicHV0IiwiYWRkUmVhY3Rpb24iLCJjaGFubmVsSWQiLCJyZWFjdGlvbiIsImNoYW5uZWxzIiwicmVhY3Rpb25zIiwiYm90IiwiYWRkUmVhY3Rpb25zIiwib3JkZXJlZCIsImFsbCIsImFkZFJvbGUiLCJndWlsZElkIiwidXNlcklkIiwicm9sZUlkIiwiZ3VpbGRzIiwicm9sZXMiLCJtZW1iZXIiLCJhZGRUaHJlYWRNZW1iZXIiLCJ0aHJlYWRzIiwidXNlciIsImFkZERtUmVjaXBpZW50IiwiZG1SZWNpcGllbnQiLCJjcmVhdGVBdXRvbW9kUnVsZSIsImF1dG9tb2QiLCJydWxlcyIsImNyZWF0ZUNoYW5uZWwiLCJjcmVhdGVFbW9qaSIsImVtb2ppcyIsImNyZWF0ZUFwcGxpY2F0aW9uRW1vamkiLCJhcHBsaWNhdGlvbkVtb2ppcyIsImNyZWF0ZUdsb2JhbEFwcGxpY2F0aW9uQ29tbWFuZCIsInJlc3RPcHRpb25zIiwiYmVhcmVyVG9rZW4iLCJpbnRlcmFjdGlvbnMiLCJjb21tYW5kcyIsImNyZWF0ZUd1aWxkQXBwbGljYXRpb25Db21tYW5kIiwiY3JlYXRlR3VpbGRTdGlja2VyIiwiZmlsZSIsImRlc2NyaXB0aW9uIiwidGFncyIsInN0aWNrZXJzIiwiY3JlYXRlR3VpbGRUZW1wbGF0ZSIsInRlbXBsYXRlcyIsImNyZWF0ZUZvcnVtVGhyZWFkIiwiZm9ydW0iLCJjcmVhdGVJbnZpdGUiLCJpbnZpdGVzIiwiY3JlYXRlUm9sZSIsImNyZWF0ZVNjaGVkdWxlZEV2ZW50IiwiY3JlYXRlU3RhZ2VJbnN0YW5jZSIsInN0YWdlcyIsImNyZWF0ZVdlYmhvb2siLCJ3ZWJob29rcyIsImF2YXRhciIsImRlbGV0ZUF1dG9tb2RSdWxlIiwicnVsZUlkIiwicnVsZSIsImRlbGV0ZUNoYW5uZWwiLCJjaGFubmVsIiwiZGVsZXRlQ2hhbm5lbFBlcm1pc3Npb25PdmVycmlkZSIsIm92ZXJ3cml0ZUlkIiwib3ZlcndyaXRlIiwiZGVsZXRlRW1vamkiLCJpZCIsImVtb2ppIiwiZGVsZXRlQXBwbGljYXRpb25FbW9qaSIsImFwcGxpY2F0aW9uRW1vamkiLCJkZWxldGVGb2xsb3d1cE1lc3NhZ2UiLCJyZXNwb25zZXMiLCJkZWxldGVHbG9iYWxBcHBsaWNhdGlvbkNvbW1hbmQiLCJjb21tYW5kSWQiLCJjb21tYW5kIiwiZGVsZXRlR3VpbGRBcHBsaWNhdGlvbkNvbW1hbmQiLCJvbmUiLCJkZWxldGVHdWlsZFN0aWNrZXIiLCJzdGlja2VySWQiLCJzdGlja2VyIiwiZGVsZXRlR3VpbGRUZW1wbGF0ZSIsInRlbXBsYXRlQ29kZSIsImd1aWxkIiwiZGVsZXRlSW50ZWdyYXRpb24iLCJpbnRlZ3JhdGlvbklkIiwiaW50ZWdyYXRpb24iLCJkZWxldGVJbnZpdGUiLCJpbnZpdGVDb2RlIiwiaW52aXRlIiwiZGVsZXRlTWVzc2FnZSIsImRlbGV0ZU1lc3NhZ2VzIiwibWVzc2FnZUlkcyIsImJ1bGsiLCJtZXNzYWdlcyIsImRlbGV0ZU9yaWdpbmFsSW50ZXJhY3Rpb25SZXNwb25zZSIsIm9yaWdpbmFsIiwiZGVsZXRlT3duUmVhY3Rpb24iLCJkZWxldGVSZWFjdGlvbnNBbGwiLCJkZWxldGVSZWFjdGlvbnNFbW9qaSIsImRlbGV0ZVJvbGUiLCJkZWxldGVTY2hlZHVsZWRFdmVudCIsImV2ZW50SWQiLCJldmVudCIsImRlbGV0ZVN0YWdlSW5zdGFuY2UiLCJzdGFnZSIsImRlbGV0ZVVzZXJSZWFjdGlvbiIsImRlbGV0ZVdlYmhvb2siLCJ3ZWJob29rSWQiLCJkZWxldGVXZWJob29rTWVzc2FnZSIsImRlbGV0ZVdlYmhvb2tXaXRoVG9rZW4iLCJ3ZWJob29rIiwiZWRpdEFwcGxpY2F0aW9uQ29tbWFuZFBlcm1pc3Npb25zIiwicGVybWlzc2lvbnMiLCJwZXJtaXNzaW9uIiwiZWRpdEF1dG9tb2RSdWxlIiwiZWRpdEJvdFByb2ZpbGUiLCJib3RBdmF0YXJVUkwiLCJiYW5uZXIiLCJib3RCYW5uZXJVUkwiLCJjdXJyZW50VXNlciIsInVzZXJuYW1lIiwidHJpbSIsImVkaXRDaGFubmVsIiwiZWRpdENoYW5uZWxQZXJtaXNzaW9uT3ZlcnJpZGVzIiwiZWRpdENoYW5uZWxQb3NpdGlvbnMiLCJlZGl0RW1vamkiLCJlZGl0QXBwbGljYXRpb25FbW9qaSIsImVkaXRGb2xsb3d1cE1lc3NhZ2UiLCJlZGl0R2xvYmFsQXBwbGljYXRpb25Db21tYW5kIiwiZWRpdEd1aWxkIiwiZWRpdEd1aWxkQXBwbGljYXRpb25Db21tYW5kIiwiZWRpdEd1aWxkU3RpY2tlciIsImVkaXRHdWlsZFRlbXBsYXRlIiwiZWRpdE1lc3NhZ2UiLCJlZGl0T3JpZ2luYWxJbnRlcmFjdGlvblJlc3BvbnNlIiwiZWRpdE93blZvaWNlU3RhdGUiLCJ2b2ljZSIsInJlcXVlc3RUb1NwZWFrVGltZXN0YW1wIiwidG9JU09TdHJpbmciLCJlZGl0U2NoZWR1bGVkRXZlbnQiLCJlZGl0Um9sZSIsImVkaXRSb2xlUG9zaXRpb25zIiwiZWRpdFN0YWdlSW5zdGFuY2UiLCJ0b3BpYyIsImVkaXRVc2VyVm9pY2VTdGF0ZSIsImVkaXRXZWJob29rIiwiZWRpdFdlYmhvb2tNZXNzYWdlIiwiZWRpdFdlYmhvb2tXaXRoVG9rZW4iLCJlZGl0V2VsY29tZVNjcmVlbiIsIndlbGNvbWUiLCJlZGl0V2lkZ2V0U2V0dGluZ3MiLCJ3aWRnZXQiLCJleGVjdXRlV2ViaG9vayIsImZvbGxvd0Fubm91bmNlbWVudCIsInNvdXJjZUNoYW5uZWxJZCIsInRhcmdldENoYW5uZWxJZCIsImZvbGxvdyIsIndlYmhvb2tDaGFubmVsSWQiLCJnZXRBY3RpdmVUaHJlYWRzIiwiYWN0aXZlIiwiZ2V0QXBwbGljYXRpb25Db21tYW5kUGVybWlzc2lvbiIsImFjY2Vzc1Rva2VuIiwiZ2V0QXBwbGljYXRpb25Db21tYW5kUGVybWlzc2lvbnMiLCJnZXRBcHBsaWNhdGlvbkluZm8iLCJvYXV0aDIiLCJhcHBsaWNhdGlvbiIsImVkaXRBcHBsaWNhdGlvbkluZm8iLCJnZXRDdXJyZW50QXV0aGVudGljYXRpb25JbmZvIiwiY3VycmVudEF1dGhvcml6YXRpb24iLCJleGNoYW5nZVRva2VuIiwiY2xpZW50SWQiLCJjbGllbnRTZWNyZXQiLCJiYXNpY0NyZWRlbnRpYWxzIiwiZnJvbSIsImdyYW50VHlwZSIsInNjb3BlIiwidG9rZW5FeGNoYW5nZSIsInJldm9rZVRva2VuIiwidG9rZW5SZXZva2UiLCJnZXRBdWRpdExvZyIsImF1ZGl0bG9ncyIsImdldEF1dG9tb2RSdWxlIiwiZ2V0QXV0b21vZFJ1bGVzIiwiZ2V0QXZhaWxhYmxlVm9pY2VSZWdpb25zIiwicmVnaW9ucyIsImdldEJhbiIsIm1lbWJlcnMiLCJiYW4iLCJnZXRCYW5zIiwiYmFucyIsImdldENoYW5uZWwiLCJnZXRDaGFubmVsSW52aXRlcyIsImdldENoYW5uZWxzIiwiZ2V0Q2hhbm5lbFdlYmhvb2tzIiwiZ2V0RG1DaGFubmVsIiwiZG0iLCJyZWNpcGllbnRJZCIsImdldEdyb3VwRG1DaGFubmVsIiwiZ2V0RW1vamkiLCJlbW9qaUlkIiwiZ2V0QXBwbGljYXRpb25FbW9qaSIsImdldEVtb2ppcyIsImdldEFwcGxpY2F0aW9uRW1vamlzIiwiZ2V0Rm9sbG93dXBNZXNzYWdlIiwiZ2V0R2F0ZXdheUJvdCIsImdhdGV3YXlCb3QiLCJnZXRHbG9iYWxBcHBsaWNhdGlvbkNvbW1hbmQiLCJnZXRHbG9iYWxBcHBsaWNhdGlvbkNvbW1hbmRzIiwid2l0aExvY2FsaXphdGlvbnMiLCJnZXRHdWlsZCIsImNvdW50cyIsImdldEd1aWxkcyIsIm1ha2VSZXF1ZXN0T3B0aW9ucyIsInVzZXJHdWlsZHMiLCJnZXRHdWlsZEFwcGxpY2F0aW9uQ29tbWFuZCIsImdldEd1aWxkQXBwbGljYXRpb25Db21tYW5kcyIsImdldEd1aWxkUHJldmlldyIsInByZXZpZXciLCJnZXRHdWlsZFRlbXBsYXRlIiwiZ2V0R3VpbGRUZW1wbGF0ZXMiLCJnZXRHdWlsZFdlYmhvb2tzIiwiZ2V0SW50ZWdyYXRpb25zIiwiaW50ZWdyYXRpb25zIiwiZ2V0SW52aXRlIiwiZ2V0SW52aXRlcyIsImdldE1lc3NhZ2UiLCJnZXRNZXNzYWdlcyIsImdldFN0aWNrZXJQYWNrIiwic3RpY2tlclBhY2tJZCIsInN0aWNrZXJQYWNrIiwiZ2V0U3RpY2tlclBhY2tzIiwic3RpY2tlclBhY2tzIiwiZ2V0T3JpZ2luYWxJbnRlcmFjdGlvblJlc3BvbnNlIiwiZ2V0Q2hhbm5lbFBpbnMiLCJtZXNzYWdlUGlucyIsImdldFBpbm5lZE1lc3NhZ2VzIiwicGlucyIsImdldFByaXZhdGVBcmNoaXZlZFRocmVhZHMiLCJwcml2YXRlIiwiZ2V0UHJpdmF0ZUpvaW5lZEFyY2hpdmVkVGhyZWFkcyIsImpvaW5lZCIsImdldFBydW5lQ291bnQiLCJwcnVuZSIsImdldFB1YmxpY0FyY2hpdmVkVGhyZWFkcyIsInB1YmxpYyIsImdldFJvbGVzIiwiZ2V0Um9sZSIsImdldFNjaGVkdWxlZEV2ZW50Iiwid2l0aFVzZXJDb3VudCIsImdldFNjaGVkdWxlZEV2ZW50cyIsImdldFNjaGVkdWxlZEV2ZW50VXNlcnMiLCJ1c2VycyIsImdldFNlc3Npb25JbmZvIiwiZ2V0U3RhZ2VJbnN0YW5jZSIsImdldE93blZvaWNlU3RhdGUiLCJnZXRVc2VyVm9pY2VTdGF0ZSIsImdldFN0aWNrZXIiLCJnZXRHdWlsZFN0aWNrZXIiLCJnZXRHdWlsZFN0aWNrZXJzIiwiZ2V0VGhyZWFkTWVtYmVyIiwiZ2V0VXNlciIsImdldFRocmVhZE1lbWJlcnMiLCJnZXRSZWFjdGlvbnMiLCJnZXRDdXJyZW50VXNlciIsImdldFVzZXJDb25uZWN0aW9ucyIsImNvbm5lY3Rpb25zIiwiZ2V0VXNlckFwcGxpY2F0aW9uUm9sZUNvbm5lY3Rpb24iLCJyb2xlQ29ubmVjdGlvbnMiLCJnZXRWYW5pdHlVcmwiLCJ2YW5pdHkiLCJnZXRWb2ljZVJlZ2lvbnMiLCJnZXRXZWJob29rIiwiZ2V0V2ViaG9va01lc3NhZ2UiLCJnZXRXZWJob29rV2l0aFRva2VuIiwiZ2V0V2VsY29tZVNjcmVlbiIsImdldFdpZGdldCIsIndpZGdldEpzb24iLCJnZXRXaWRnZXRTZXR0aW5ncyIsImpvaW5UaHJlYWQiLCJtZSIsImxlYXZlR3VpbGQiLCJsZWF2ZSIsImxlYXZlVGhyZWFkIiwicHVibGlzaE1lc3NhZ2UiLCJjcm9zc3Bvc3QiLCJyZW1vdmVSb2xlIiwicmVtb3ZlVGhyZWFkTWVtYmVyIiwicmVtb3ZlRG1SZWNpcGllbnQiLCJzZW5kRm9sbG93dXBNZXNzYWdlIiwic2VuZEludGVyYWN0aW9uUmVzcG9uc2UiLCJpbnRlcmFjdGlvbklkIiwicGFyYW1zIiwiY2FsbGJhY2siLCJzZW5kTWVzc2FnZSIsInN0YXJ0VGhyZWFkV2l0aE1lc3NhZ2UiLCJzdGFydFRocmVhZFdpdGhvdXRNZXNzYWdlIiwiZ2V0UG9sbEFuc3dlclZvdGVycyIsImFuc3dlcklkIiwicG9sbHMiLCJ2b3RlcyIsImVuZFBvbGwiLCJleHBpcmUiLCJzeW5jR3VpbGRUZW1wbGF0ZSIsImJhbk1lbWJlciIsImJ1bGtCYW5NZW1iZXJzIiwiYnVsa0JhbiIsImVkaXRCb3RNZW1iZXIiLCJlZGl0TWVtYmVyIiwiZ2V0TWVtYmVyIiwiZ2V0Q3VycmVudE1lbWJlciIsImN1cnJlbnRNZW1iZXIiLCJnZXRNZW1iZXJzIiwiZ2V0QXBwbGljYXRpb25BY3Rpdml0eUluc3RhbmNlIiwiaW5zdGFuY2VJZCIsImFwcGxpY2F0aW9uQWN0aXZpdHlJbnN0YW5jZSIsImtpY2tNZW1iZXIiLCJwaW5NZXNzYWdlIiwibWVzc2FnZVBpbiIsInBydW5lTWVtYmVycyIsInNlYXJjaE1lbWJlcnMiLCJxdWVyeSIsInNlYXJjaCIsImdldEd1aWxkT25ib2FyZGluZyIsIm9uYm9hcmRpbmciLCJlZGl0R3VpbGRPbmJvYXJkaW5nIiwibW9kaWZ5R3VpbGRJbmNpZGVudEFjdGlvbnMiLCJpbmNpZGVudEFjdGlvbnMiLCJ1bmJhbk1lbWJlciIsInVucGluTWVzc2FnZSIsInRyaWdnZXJUeXBpbmdJbmRpY2F0b3IiLCJ0eXBpbmciLCJ1cHNlcnRHbG9iYWxBcHBsaWNhdGlvbkNvbW1hbmRzIiwidXBzZXJ0R3VpbGRBcHBsaWNhdGlvbkNvbW1hbmRzIiwiZWRpdFVzZXJBcHBsaWNhdGlvblJvbGVDb25uZWN0aW9uIiwiYWRkR3VpbGRNZW1iZXIiLCJjcmVhdGVUZXN0RW50aXRsZW1lbnQiLCJtb25ldGl6YXRpb24iLCJlbnRpdGxlbWVudHMiLCJsaXN0RW50aXRsZW1lbnRzIiwiZ2V0RW50aXRsZW1lbnQiLCJlbnRpdGxlbWVudElkIiwiZW50aXRsZW1lbnQiLCJkZWxldGVUZXN0RW50aXRsZW1lbnQiLCJjb25zdW1lRW50aXRsZW1lbnQiLCJsaXN0U2t1cyIsInNrdXMiLCJsaXN0U3Vic2NyaXB0aW9ucyIsInNrdUlkIiwic3Vic2NyaXB0aW9ucyIsImdldFN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvbklkIiwic3Vic2NyaXB0aW9uIiwic2VuZFNvdW5kYm9hcmRTb3VuZCIsInNvdW5kYm9hcmQiLCJzZW5kU291bmQiLCJsaXN0RGVmYXVsdFNvdW5kYm9hcmRTb3VuZHMiLCJsaXN0RGVmYXVsdCIsImxpc3RHdWlsZFNvdW5kYm9hcmRTb3VuZHMiLCJndWlsZFNvdW5kcyIsImdldEd1aWxkU291bmRib2FyZFNvdW5kIiwic291bmRJZCIsImd1aWxkU291bmQiLCJjcmVhdGVHdWlsZFNvdW5kYm9hcmRTb3VuZCIsIm1vZGlmeUd1aWxkU291bmRib2FyZFNvdW5kIiwiZGVsZXRlR3VpbGRTb3VuZGJvYXJkU291bmQiLCJsaXN0QXBwbGljYXRpb25Sb2xlQ29ubmVjdGlvbnNNZXRhZGF0YVJlY29yZHMiLCJhcHBsaWNhdGlvblJvbGVDb25uZWN0aW9uTWV0YWRhdGEiLCJ1cGRhdGVBcHBsaWNhdGlvblJvbGVDb25uZWN0aW9uc01ldGFkYXRhUmVjb3JkcyIsImNyZWF0ZUxvYmJ5IiwibG9iYnkiLCJnZXRMb2JieSIsImxvYmJ5SWQiLCJtb2RpZnlMb2JieSIsImRlbGV0ZUxvYmJ5IiwiYWRkTWVtYmVyVG9Mb2JieSIsInJlbW92ZU1lbWJlckZyb21Mb2JieSIsImxlYXZlTG9iYnkiLCJsaW5rQ2hhbm5lbFRvTG9iYnkiLCJsaW5rIiwidW5saW5rQ2hhbm5lbFRvTG9iYnkiLCJwcmVmZXJTbmFrZUNhc2UiLCJlbmFibGVkIiwiY2FtZWxpemVyIiwieCIsIkh0dHBSZXNwb25zZUNvZGUiXSwibWFwcGluZ3MiOiJBQUFBLFNBQVNBLE1BQU0sUUFBUSxjQUFhO0FBQ3BDLFNBQThCQyxPQUFPLFFBQVEs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