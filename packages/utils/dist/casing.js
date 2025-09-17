export function camelize(object) {
    if (Array.isArray(object)) {
        return object.map((element)=>camelize(element));
    }
    if (typeof object === 'object' && object !== null) {
        const obj = {};
        Object.keys(object).forEach((key)=>{
            // @ts-expect-error js hack
            ;
            obj[snakeToCamelCase(key)] = camelize(object[key]);
        });
        return obj;
    }
    return object;
}
export function snakelize(object) {
    if (Array.isArray(object)) {
        return object.map((element)=>snakelize(element));
    }
    if (typeof object === 'object' && object !== null) {
        const obj = {};
        Object.keys(object).forEach((key)=>{
            // @ts-expect-error js hack
            ;
            obj[camelToSnakeCase(key)] = snakelize(object[key]);
        });
        return obj;
    }
    return object;
}
export function snakeToCamelCase(str) {
    if (!str.includes('_')) return str;
    let result = '';
    for(let i = 0, len = str.length; i < len; ++i){
        if (str[i] === '_') {
            result += str[++i].toUpperCase();
            continue;
        }
        result += str[i];
    }
    return result;
}
export function camelToSnakeCase(str) {
    let result = '';
    for(let i = 0, len = str.length; i < len; ++i){
        if (str[i] >= 'A' && str[i] <= 'Z') {
            result += `_${str[i].toLowerCase()}`;
            continue;
        }
        result += str[i];
    }
    return result;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jYXNpbmcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBDYW1lbGl6ZSwgU25ha2VsaXplIH0gZnJvbSAnQGRpc2NvcmRlbm8vdHlwZXMnXG5cbmV4cG9ydCBmdW5jdGlvbiBjYW1lbGl6ZTxUPihvYmplY3Q6IFQpOiBDYW1lbGl6ZTxUPiB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9iamVjdCkpIHtcbiAgICByZXR1cm4gb2JqZWN0Lm1hcCgoZWxlbWVudCkgPT4gY2FtZWxpemUoZWxlbWVudCkpIGFzIENhbWVsaXplPFQ+XG4gIH1cblxuICBpZiAodHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgb2JqZWN0ICE9PSBudWxsKSB7XG4gICAgY29uc3Qgb2JqID0ge30gYXMgQ2FtZWxpemU8VD5cbiAgICA7KE9iamVjdC5rZXlzKG9iamVjdCkgYXMgQXJyYXk8a2V5b2YgVD4pLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBqcyBoYWNrXG4gICAgICA7KG9ialtzbmFrZVRvQ2FtZWxDYXNlKGtleSldIGFzIENhbWVsaXplPChUICYgb2JqZWN0KVtrZXlvZiBUXT4pID0gY2FtZWxpemUob2JqZWN0W2tleV0pXG4gICAgfSlcbiAgICByZXR1cm4gb2JqXG4gIH1cbiAgcmV0dXJuIG9iamVjdCBhcyBDYW1lbGl6ZTxUPlxufVxuXG5leHBvcnQgZnVuY3Rpb24gc25ha2VsaXplPFQ+KG9iamVjdDogVCk6IFNuYWtlbGl6ZTxUPiB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9iamVjdCkpIHtcbiAgICByZXR1cm4gb2JqZWN0Lm1hcCgoZWxlbWVudCkgPT4gc25ha2VsaXplKGVsZW1lbnQpKSBhcyBTbmFrZWxpemU8VD5cbiAgfVxuXG4gIGlmICh0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JyAmJiBvYmplY3QgIT09IG51bGwpIHtcbiAgICBjb25zdCBvYmogPSB7fSBhcyBTbmFrZWxpemU8VD5cbiAgICA7KE9iamVjdC5rZXlzKG9iamVjdCkgYXMgQXJyYXk8a2V5b2YgVD4pLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBqcyBoYWNrXG4gICAgICA7KG9ialtjYW1lbFRvU25ha2VDYXNlKGtleSldIGFzIFNuYWtlbGl6ZTwoVCAmIG9iamVjdClba2V5b2YgVF0+KSA9IHNuYWtlbGl6ZShvYmplY3Rba2V5XSlcbiAgICB9KVxuICAgIHJldHVybiBvYmpcbiAgfVxuICByZXR1cm4gb2JqZWN0IGFzIFNuYWtlbGl6ZTxUPlxufVxuXG5leHBvcnQgZnVuY3Rpb24gc25ha2VUb0NhbWVsQ2FzZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghc3RyLmluY2x1ZGVzKCdfJykpIHJldHVybiBzdHJcblxuICBsZXQgcmVzdWx0ID0gJydcbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHN0ci5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChzdHJbaV0gPT09ICdfJykge1xuICAgICAgcmVzdWx0ICs9IHN0clsrK2ldLnRvVXBwZXJDYXNlKClcblxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICByZXN1bHQgKz0gc3RyW2ldXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW1lbFRvU25ha2VDYXNlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IHJlc3VsdCA9ICcnXG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSBzdHIubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoc3RyW2ldID49ICdBJyAmJiBzdHJbaV0gPD0gJ1onKSB7XG4gICAgICByZXN1bHQgKz0gYF8ke3N0cltpXS50b0xvd2VyQ2FzZSgpfWBcblxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICByZXN1bHQgKz0gc3RyW2ldXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG4iXSwibmFtZXMiOlsiY2FtZWxpemUiLCJvYmplY3QiLCJBcnJheSIsImlzQXJyYXkiLCJtYXAiLCJlbGVtZW50Iiwib2JqIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJzbmFrZVRvQ2FtZWxDYXNlIiwic25ha2VsaXplIiwiY2FtZWxUb1NuYWtlQ2FzZSIsInN0ciIsImluY2x1ZGVzIiwicmVzdWx0IiwiaSIsImxlbiIsImxlbmd0aCIsInRvVXBwZXJDYXNlIiwidG9Mb3dlckNhc2UiXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sU0FBU0EsU0FBWUMsTUFBUztJQUNuQyxJQUFJQyxNQUFNQyxPQUFPLENBQUNGLFNBQVM7UUFDekIsT0FBT0EsT0FBT0csR0FBRyxDQUFDLENBQUNDLFVBQVlMLFNBQVNLO0lBQzFDO0lBRUEsSUFBSSxPQUFPSixXQUFXLFlBQVlBLFdBQVcsTUFBTTtRQUNqRCxNQUFNSyxNQUFNLENBQUM7UUFDWEMsT0FBT0MsSUFBSSxDQUFDUCxRQUEyQlEsT0FBTyxDQUFDLENBQUNDO1lBQ2hELDJCQUEyQjs7WUFDekJKLEdBQUcsQ0FBQ0ssaUJBQWlCRCxLQUFLLEdBQXVDVixTQUFTQyxNQUFNLENBQUNTLElBQUk7UUFDekY7UUFDQSxPQUFPSjtJQUNUO0lBQ0EsT0FBT0w7QUFDVDtBQUVBLE9BQU8sU0FBU1csVUFBYVgsTUFBUztJQUNwQyxJQUFJQyxNQUFNQyxPQUFPLENBQUNGLFNBQVM7UUFDekIsT0FBT0EsT0FBT0csR0FBRyxDQUFDLENBQUNDLFVBQVlPLFVBQVVQO0lBQzNDO0lBRUEsSUFBSSxPQUFPSixXQUFXLFlBQVlBLFdBQVcsTUFBTTtRQUNqRCxNQUFNSyxNQUFNLENBQUM7UUFDWEMsT0FBT0MsSUFBSSxDQUFDUCxRQUEyQlEsT0FBTyxDQUFDLENBQUNDO1lBQ2hELDJCQUEyQjs7WUFDekJKLEdBQUcsQ0FBQ08saUJBQWlCSCxLQUFLLEdBQXdDRSxVQUFVWCxNQUFNLENBQUNTLElBQUk7UUFDM0Y7UUFDQSxPQUFPSjtJQUNUO0lBQ0EsT0FBT0w7QUFDVDtBQUVBLE9BQU8sU0FBU1UsaUJBQWlCRyxHQUFXO0lBQzFDLElBQUksQ0FBQ0EsSUFBSUMsUUFBUSxDQUFDLE1BQU0sT0FBT0Q7SUFFL0IsSUFBSUUsU0FBUztJQUNiLElBQUssSUFBSUMsSUFBSSxHQUFHQyxNQUFNSixJQUFJSyxNQUFNLEVBQUVGLElBQUlDLEtBQUssRUFBRUQsRUFBRztRQUM5QyxJQUFJSCxHQUFHLENBQUNHLEVBQUUsS0FBSyxLQUFLO1lBQ2xCRCxVQUFVRixHQUFHLENBQUMsRUFBRUcsRUFBRSxDQUFDRyxXQUFXO1lBRTlCO1FBQ0Y7UUFFQUosVUFBVUYsR0FBRyxDQUFDRyxFQUFFO0lBQ2xCO0lBRUEsT0FBT0Q7QUFDVDtBQUVBLE9BQU8sU0FBU0gsaUJBQWlCQyxHQUFXO0lBQzFDLElBQUlFLFNBQVM7SUFDYixJQUFLLElBQUlDLElBQUksR0FBR0MsTUFBTUosSUFBSUssTUFBTSxFQUFFRixJQUFJQyxLQUFLLEVBQUVELEVBQUc7UUFDOUMsSUFBSUgsR0FBRyxDQUFDRyxFQUFFLElBQUksT0FBT0gsR0FBRyxDQUFDRyxFQUFFLElBQUksS0FBSztZQUNsQ0QsVUFBVSxDQUFDLENBQUMsRUFBRUYsR0FBRyxDQUFDRyxFQUFFLENBQUNJLFdBQVcsSUFBSTtZQUVwQztRQUNGO1FBRUFMLFVBQVVGLEdBQUcsQ0FBQ0csRUFBRTtJQUNsQjtJQUVBLE9BQU9EO0FBQ1QifQ==