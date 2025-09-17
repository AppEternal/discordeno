export function transformEmbed(bot, payload) {
  const embed = {
    title: payload.title,
    type: payload.type,
    description: payload.description,
    url: payload.url,
    timestamp: payload.timestamp ? Date.parse(payload.timestamp) : undefined,
    color: payload.color,
    footer: payload.footer
      ? {
          text: payload.footer.text,
          iconUrl: payload.footer.icon_url,
          proxyIconUrl: payload.footer.proxy_icon_url,
        }
      : undefined,
    image: payload.image
      ? {
          url: payload.image.url,
          proxyUrl: payload.image.proxy_url,
          height: payload.image.height,
          width: payload.image.width,
        }
      : undefined,
    thumbnail: payload.thumbnail
      ? {
          url: payload.thumbnail.url,
          proxyUrl: payload.thumbnail.proxy_url,
          height: payload.thumbnail.height,
          width: payload.thumbnail.width,
        }
      : undefined,
    video: payload.video
      ? {
          url: payload.video.url,
          proxyUrl: payload.video.proxy_url,
          height: payload.video.height,
          width: payload.video.width,
        }
      : undefined,
    provider: payload.provider,
    author: payload.author
      ? {
          name: payload.author.name,
          url: payload.author.url,
          iconUrl: payload.author.icon_url,
          proxyIconUrl: payload.author.proxy_icon_url,
        }
      : undefined,
    fields: payload.fields,
  }
  return bot.transformers.customizers.embed(bot, payload, embed)
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvZW1iZWQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBEaXNjb3JkRW1iZWQgfSBmcm9tICdAZGlzY29yZGVuby90eXBlcydcbmltcG9ydCB0eXBlIHsgQm90IH0gZnJvbSAnLi4vYm90LmpzJ1xuaW1wb3J0IHR5cGUgeyBFbWJlZCB9IGZyb20gJy4vdHlwZXMuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1FbWJlZChib3Q6IEJvdCwgcGF5bG9hZDogRGlzY29yZEVtYmVkKTogRW1iZWQge1xuICBjb25zdCBlbWJlZCA9IHtcbiAgICB0aXRsZTogcGF5bG9hZC50aXRsZSxcbiAgICB0eXBlOiBwYXlsb2FkLnR5cGUsXG4gICAgZGVzY3JpcHRpb246IHBheWxvYWQuZGVzY3JpcHRpb24sXG4gICAgdXJsOiBwYXlsb2FkLnVybCxcbiAgICB0aW1lc3RhbXA6IHBheWxvYWQudGltZXN0YW1wID8gRGF0ZS5wYXJzZShwYXlsb2FkLnRpbWVzdGFtcCkgOiB1bmRlZmluZWQsXG4gICAgY29sb3I6IHBheWxvYWQuY29sb3IsXG4gICAgZm9vdGVyOiBwYXlsb2FkLmZvb3RlclxuICAgICAgPyB7XG4gICAgICAgICAgdGV4dDogcGF5bG9hZC5mb290ZXIudGV4dCxcbiAgICAgICAgICBpY29uVXJsOiBwYXlsb2FkLmZvb3Rlci5pY29uX3VybCxcbiAgICAgICAgICBwcm94eUljb25Vcmw6IHBheWxvYWQuZm9vdGVyLnByb3h5X2ljb25fdXJsLFxuICAgICAgICB9XG4gICAgICA6IHVuZGVmaW5lZCxcbiAgICBpbWFnZTogcGF5bG9hZC5pbWFnZVxuICAgICAgPyB7XG4gICAgICAgICAgdXJsOiBwYXlsb2FkLmltYWdlLnVybCxcbiAgICAgICAgICBwcm94eVVybDogcGF5bG9hZC5pbWFnZS5wcm94eV91cmwsXG4gICAgICAgICAgaGVpZ2h0OiBwYXlsb2FkLmltYWdlLmhlaWdodCxcbiAgICAgICAgICB3aWR0aDogcGF5bG9hZC5pbWFnZS53aWR0aCxcbiAgICAgICAgfVxuICAgICAgOiB1bmRlZmluZWQsXG4gICAgdGh1bWJuYWlsOiBwYXlsb2FkLnRodW1ibmFpbFxuICAgICAgPyB7XG4gICAgICAgICAgdXJsOiBwYXlsb2FkLnRodW1ibmFpbC51cmwsXG4gICAgICAgICAgcHJveHlVcmw6IHBheWxvYWQudGh1bWJuYWlsLnByb3h5X3VybCxcbiAgICAgICAgICBoZWlnaHQ6IHBheWxvYWQudGh1bWJuYWlsLmhlaWdodCxcbiAgICAgICAgICB3aWR0aDogcGF5bG9hZC50aHVtYm5haWwud2lkdGgsXG4gICAgICAgIH1cbiAgICAgIDogdW5kZWZpbmVkLFxuICAgIHZpZGVvOiBwYXlsb2FkLnZpZGVvXG4gICAgICA/IHtcbiAgICAgICAgICB1cmw6IHBheWxvYWQudmlkZW8udXJsLFxuICAgICAgICAgIHByb3h5VXJsOiBwYXlsb2FkLnZpZGVvLnByb3h5X3VybCxcbiAgICAgICAgICBoZWlnaHQ6IHBheWxvYWQudmlkZW8uaGVpZ2h0LFxuICAgICAgICAgIHdpZHRoOiBwYXlsb2FkLnZpZGVvLndpZHRoLFxuICAgICAgICB9XG4gICAgICA6IHVuZGVmaW5lZCxcbiAgICBwcm92aWRlcjogcGF5bG9hZC5wcm92aWRlcixcbiAgICBhdXRob3I6IHBheWxvYWQuYXV0aG9yXG4gICAgICA/IHtcbiAgICAgICAgICBuYW1lOiBwYXlsb2FkLmF1dGhvci5uYW1lLFxuICAgICAgICAgIHVybDogcGF5bG9hZC5hdXRob3IudXJsLFxuICAgICAgICAgIGljb25Vcmw6IHBheWxvYWQuYXV0aG9yLmljb25fdXJsLFxuICAgICAgICAgIHByb3h5SWNvblVybDogcGF5bG9hZC5hdXRob3IucHJveHlfaWNvbl91cmwsXG4gICAgICAgIH1cbiAgICAgIDogdW5kZWZpbmVkLFxuICAgIGZpZWxkczogcGF5bG9hZC5maWVsZHMsXG4gIH0gYXMgRW1iZWRcblxuICByZXR1cm4gYm90LnRyYW5zZm9ybWVycy5jdXN0b21pemVycy5lbWJlZChib3QsIHBheWxvYWQsIGVtYmVkKVxufVxuIl0sIm5hbWVzIjpbInRyYW5zZm9ybUVtYmVkIiwiYm90IiwicGF5bG9hZCIsImVtYmVkIiwidGl0bGUiLCJ0eXBlIiwiZGVzY3JpcHRpb24iLCJ1cmwiLCJ0aW1lc3RhbXAiLCJEYXRlIiwicGFyc2UiLCJ1bmRlZmluZWQiLCJjb2xvciIsImZvb3RlciIsInRleHQiLCJpY29uVXJsIiwiaWNvbl91cmwiLCJwcm94eUljb25VcmwiLCJwcm94eV9pY29uX3VybCIsImltYWdlIiwicHJveHlVcmwiLCJwcm94eV91cmwiLCJoZWlnaHQiLCJ3aWR0aCIsInRodW1ibmFpbCIsInZpZGVvIiwicHJvdmlkZXIiLCJhdXRob3IiLCJuYW1lIiwiZmllbGRzIiwidHJhbnNmb3JtZXJzIiwiY3VzdG9taXplcnMiXSwibWFwcGluZ3MiOiJBQUlBLE9BQU8sU0FBU0EsZUFBZUMsR0FBUSxFQUFFQyxPQUFxQjtJQUM1RCxNQUFNQyxRQUFRO1FBQ1pDLE9BQU9GLFFBQVFFLEtBQUs7UUFDcEJDLE1BQU1ILFFBQVFHLElBQUk7UUFDbEJDLGFBQWFKLFFBQVFJLFdBQVc7UUFDaENDLEtBQUtMLFFBQVFLLEdBQUc7UUFDaEJDLFdBQVdOLFFBQVFNLFNBQVMsR0FBR0MsS0FBS0MsS0FBSyxDQUFDUixRQUFRTSxTQUFTLElBQUlHO1FBQy9EQyxPQUFPVixRQUFRVSxLQUFLO1FBQ3BCQyxRQUFRWCxRQUFRVyxNQUFNLEdBQ2xCO1lBQ0VDLE1BQU1aLFFBQVFXLE1BQU0sQ0FBQ0MsSUFBSTtZQUN6QkMsU0FBU2IsUUFBUVcsTUFBTSxDQUFDRyxRQUFRO1lBQ2hDQyxjQUFjZixRQUFRVyxNQUFNLENBQUNLLGNBQWM7UUFDN0MsSUFDQVA7UUFDSlEsT0FBT2pCLFFBQVFpQixLQUFLLEdBQ2hCO1lBQ0VaLEtBQUtMLFFBQVFpQixLQUFLLENBQUNaLEdBQUc7WUFDdEJhLFVBQVVsQixRQUFRaUIsS0FBSyxDQUFDRSxTQUFTO1lBQ2pDQyxRQUFRcEIsUUFBUWlCLEtBQUssQ0FBQ0csTUFBTTtZQUM1QkMsT0FBT3JCLFFBQVFpQixLQUFLLENBQUNJLEtBQUs7UUFDNUIsSUFDQVo7UUFDSmEsV0FBV3RCLFFBQVFzQixTQUFTLEdBQ3hCO1lBQ0VqQixLQUFLTCxRQUFRc0IsU0FBUyxDQUFDakIsR0FBRztZQUMxQmEsVUFBVWxCLFFBQVFzQixTQUFTLENBQUNILFNBQVM7WUFDckNDLFFBQVFwQixRQUFRc0IsU0FBUyxDQUFDRixNQUFNO1lBQ2hDQyxPQUFPckIsUUFBUXNCLFNBQVMsQ0FBQ0QsS0FBSztRQUNoQyxJQUNBWjtRQUNKYyxPQUFPdkIsUUFBUXVCLEtBQUssR0FDaEI7WUFDRWxCLEtBQUtMLFFBQVF1QixLQUFLLENBQUNsQixHQUFHO1lBQ3RCYSxVQUFVbEIsUUFBUXVCLEtBQUssQ0FBQ0osU0FBUztZQUNqQ0MsUUFBUXBCLFFBQVF1QixLQUFLLENBQUNILE1BQU07WUFDNUJDLE9BQU9yQixRQUFRdUIsS0FBSyxDQUFDRixLQUFLO1FBQzVCLElBQ0FaO1FBQ0plLFVBQVV4QixRQUFRd0IsUUFBUTtRQUMxQkMsUUFBUXpCLFFBQVF5QixNQUFNLEdBQ2xCO1lBQ0VDLE1BQU0xQixRQUFReUIsTUFBTSxDQUFDQyxJQUFJO1lBQ3pCckIsS0FBS0wsUUFBUXlCLE1BQU0sQ0FBQ3BCLEdBQUc7WUFDdkJRLFNBQVNiLFFBQVF5QixNQUFNLENBQUNYLFFBQVE7WUFDaENDLGNBQWNmLFFBQVF5QixNQUFNLENBQUNULGNBQWM7UUFDN0MsSUFDQVA7UUFDSmtCLFFBQVEzQixRQUFRMkIsTUFBTTtJQUN4QjtJQUVBLE9BQU81QixJQUFJNkIsWUFBWSxDQUFDQyxXQUFXLENBQUM1QixLQUFLLENBQUNGLEtBQUtDLFNBQVNDO0FBQzFEIn0=
