export function transformEmbedToDiscordEmbed(_bot, payload) {
  return {
    title: payload.title,
    type: payload.type,
    description: payload.description,
    url: payload.url,
    timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : undefined,
    color: payload.color,
    footer: payload.footer
      ? {
          text: payload.footer.text,
          icon_url: payload.footer.iconUrl,
          proxy_icon_url: payload.footer.proxyIconUrl,
        }
      : undefined,
    image: payload.image
      ? {
          url: payload.image.url,
          proxy_url: payload.image.proxyUrl,
          height: payload.image.height,
          width: payload.image.width,
        }
      : undefined,
    thumbnail: payload.thumbnail
      ? {
          url: payload.thumbnail.url,
          proxy_url: payload.thumbnail.proxyUrl,
          height: payload.thumbnail.height,
          width: payload.thumbnail.width,
        }
      : undefined,
    video: payload.video
      ? {
          url: payload.video.url,
          proxy_url: payload.video.proxyUrl,
          height: payload.video.height,
          width: payload.video.width,
        }
      : undefined,
    provider: payload.provider,
    author: payload.author
      ? {
          name: payload.author.name,
          url: payload.author.url,
          icon_url: payload.author.iconUrl,
          proxy_icon_url: payload.author.proxyIconUrl,
        }
      : undefined,
    fields: payload.fields,
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvcmV2ZXJzZS9lbWJlZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IERpc2NvcmRFbWJlZCB9IGZyb20gJ0BkaXNjb3JkZW5vL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBCb3QgfSBmcm9tICcuLi8uLi9ib3QuanMnXG5pbXBvcnQgdHlwZSB7IEVtYmVkIH0gZnJvbSAnLi4vdHlwZXMuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1FbWJlZFRvRGlzY29yZEVtYmVkKF9ib3Q6IEJvdCwgcGF5bG9hZDogRW1iZWQpOiBEaXNjb3JkRW1iZWQge1xuICByZXR1cm4ge1xuICAgIHRpdGxlOiBwYXlsb2FkLnRpdGxlLFxuICAgIHR5cGU6IHBheWxvYWQudHlwZSxcbiAgICBkZXNjcmlwdGlvbjogcGF5bG9hZC5kZXNjcmlwdGlvbixcbiAgICB1cmw6IHBheWxvYWQudXJsLFxuICAgIHRpbWVzdGFtcDogcGF5bG9hZC50aW1lc3RhbXAgPyBuZXcgRGF0ZShwYXlsb2FkLnRpbWVzdGFtcCkudG9JU09TdHJpbmcoKSA6IHVuZGVmaW5lZCxcbiAgICBjb2xvcjogcGF5bG9hZC5jb2xvcixcbiAgICBmb290ZXI6IHBheWxvYWQuZm9vdGVyXG4gICAgICA/IHtcbiAgICAgICAgICB0ZXh0OiBwYXlsb2FkLmZvb3Rlci50ZXh0LFxuICAgICAgICAgIGljb25fdXJsOiBwYXlsb2FkLmZvb3Rlci5pY29uVXJsLFxuICAgICAgICAgIHByb3h5X2ljb25fdXJsOiBwYXlsb2FkLmZvb3Rlci5wcm94eUljb25VcmwsXG4gICAgICAgIH1cbiAgICAgIDogdW5kZWZpbmVkLFxuICAgIGltYWdlOiBwYXlsb2FkLmltYWdlXG4gICAgICA/IHtcbiAgICAgICAgICB1cmw6IHBheWxvYWQuaW1hZ2UudXJsLFxuICAgICAgICAgIHByb3h5X3VybDogcGF5bG9hZC5pbWFnZS5wcm94eVVybCxcbiAgICAgICAgICBoZWlnaHQ6IHBheWxvYWQuaW1hZ2UuaGVpZ2h0LFxuICAgICAgICAgIHdpZHRoOiBwYXlsb2FkLmltYWdlLndpZHRoLFxuICAgICAgICB9XG4gICAgICA6IHVuZGVmaW5lZCxcbiAgICB0aHVtYm5haWw6IHBheWxvYWQudGh1bWJuYWlsXG4gICAgICA/IHtcbiAgICAgICAgICB1cmw6IHBheWxvYWQudGh1bWJuYWlsLnVybCxcbiAgICAgICAgICBwcm94eV91cmw6IHBheWxvYWQudGh1bWJuYWlsLnByb3h5VXJsLFxuICAgICAgICAgIGhlaWdodDogcGF5bG9hZC50aHVtYm5haWwuaGVpZ2h0LFxuICAgICAgICAgIHdpZHRoOiBwYXlsb2FkLnRodW1ibmFpbC53aWR0aCxcbiAgICAgICAgfVxuICAgICAgOiB1bmRlZmluZWQsXG4gICAgdmlkZW86IHBheWxvYWQudmlkZW9cbiAgICAgID8ge1xuICAgICAgICAgIHVybDogcGF5bG9hZC52aWRlby51cmwsXG4gICAgICAgICAgcHJveHlfdXJsOiBwYXlsb2FkLnZpZGVvLnByb3h5VXJsLFxuICAgICAgICAgIGhlaWdodDogcGF5bG9hZC52aWRlby5oZWlnaHQsXG4gICAgICAgICAgd2lkdGg6IHBheWxvYWQudmlkZW8ud2lkdGgsXG4gICAgICAgIH1cbiAgICAgIDogdW5kZWZpbmVkLFxuICAgIHByb3ZpZGVyOiBwYXlsb2FkLnByb3ZpZGVyLFxuICAgIGF1dGhvcjogcGF5bG9hZC5hdXRob3JcbiAgICAgID8ge1xuICAgICAgICAgIG5hbWU6IHBheWxvYWQuYXV0aG9yLm5hbWUsXG4gICAgICAgICAgdXJsOiBwYXlsb2FkLmF1dGhvci51cmwsXG4gICAgICAgICAgaWNvbl91cmw6IHBheWxvYWQuYXV0aG9yLmljb25VcmwsXG4gICAgICAgICAgcHJveHlfaWNvbl91cmw6IHBheWxvYWQuYXV0aG9yLnByb3h5SWNvblVybCxcbiAgICAgICAgfVxuICAgICAgOiB1bmRlZmluZWQsXG4gICAgZmllbGRzOiBwYXlsb2FkLmZpZWxkcyxcbiAgfVxufVxuIl0sIm5hbWVzIjpbInRyYW5zZm9ybUVtYmVkVG9EaXNjb3JkRW1iZWQiLCJfYm90IiwicGF5bG9hZCIsInRpdGxlIiwidHlwZSIsImRlc2NyaXB0aW9uIiwidXJsIiwidGltZXN0YW1wIiwiRGF0ZSIsInRvSVNPU3RyaW5nIiwidW5kZWZpbmVkIiwiY29sb3IiLCJmb290ZXIiLCJ0ZXh0IiwiaWNvbl91cmwiLCJpY29uVXJsIiwicHJveHlfaWNvbl91cmwiLCJwcm94eUljb25VcmwiLCJpbWFnZSIsInByb3h5X3VybCIsInByb3h5VXJsIiwiaGVpZ2h0Iiwid2lkdGgiLCJ0aHVtYm5haWwiLCJ2aWRlbyIsInByb3ZpZGVyIiwiYXV0aG9yIiwibmFtZSIsImZpZWxkcyJdLCJtYXBwaW5ncyI6IkFBSUEsT0FBTyxTQUFTQSw2QkFBNkJDLElBQVMsRUFBRUMsT0FBYztJQUNwRSxPQUFPO1FBQ0xDLE9BQU9ELFFBQVFDLEtBQUs7UUFDcEJDLE1BQU1GLFFBQVFFLElBQUk7UUFDbEJDLGFBQWFILFFBQVFHLFdBQVc7UUFDaENDLEtBQUtKLFFBQVFJLEdBQUc7UUFDaEJDLFdBQVdMLFFBQVFLLFNBQVMsR0FBRyxJQUFJQyxLQUFLTixRQUFRSyxTQUFTLEVBQUVFLFdBQVcsS0FBS0M7UUFDM0VDLE9BQU9ULFFBQVFTLEtBQUs7UUFDcEJDLFFBQVFWLFFBQVFVLE1BQU0sR0FDbEI7WUFDRUMsTUFBTVgsUUFBUVUsTUFBTSxDQUFDQyxJQUFJO1lBQ3pCQyxVQUFVWixRQUFRVSxNQUFNLENBQUNHLE9BQU87WUFDaENDLGdCQUFnQmQsUUFBUVUsTUFBTSxDQUFDSyxZQUFZO1FBQzdDLElBQ0FQO1FBQ0pRLE9BQU9oQixRQUFRZ0IsS0FBSyxHQUNoQjtZQUNFWixLQUFLSixRQUFRZ0IsS0FBSyxDQUFDWixHQUFHO1lBQ3RCYSxXQUFXakIsUUFBUWdCLEtBQUssQ0FBQ0UsUUFBUTtZQUNqQ0MsUUFBUW5CLFFBQVFnQixLQUFLLENBQUNHLE1BQU07WUFDNUJDLE9BQU9wQixRQUFRZ0IsS0FBSyxDQUFDSSxLQUFLO1FBQzVCLElBQ0FaO1FBQ0phLFdBQVdyQixRQUFRcUIsU0FBUyxHQUN4QjtZQUNFakIsS0FBS0osUUFBUXFCLFNBQVMsQ0FBQ2pCLEdBQUc7WUFDMUJhLFdBQVdqQixRQUFRcUIsU0FBUyxDQUFDSCxRQUFRO1lBQ3JDQyxRQUFRbkIsUUFBUXFCLFNBQVMsQ0FBQ0YsTUFBTTtZQUNoQ0MsT0FBT3BCLFFBQVFxQixTQUFTLENBQUNELEtBQUs7UUFDaEMsSUFDQVo7UUFDSmMsT0FBT3RCLFFBQVFzQixLQUFLLEdBQ2hCO1lBQ0VsQixLQUFLSixRQUFRc0IsS0FBSyxDQUFDbEIsR0FBRztZQUN0QmEsV0FBV2pCLFFBQVFzQixLQUFLLENBQUNKLFFBQVE7WUFDakNDLFFBQVFuQixRQUFRc0IsS0FBSyxDQUFDSCxNQUFNO1lBQzVCQyxPQUFPcEIsUUFBUXNCLEtBQUssQ0FBQ0YsS0FBSztRQUM1QixJQUNBWjtRQUNKZSxVQUFVdkIsUUFBUXVCLFFBQVE7UUFDMUJDLFFBQVF4QixRQUFRd0IsTUFBTSxHQUNsQjtZQUNFQyxNQUFNekIsUUFBUXdCLE1BQU0sQ0FBQ0MsSUFBSTtZQUN6QnJCLEtBQUtKLFFBQVF3QixNQUFNLENBQUNwQixHQUFHO1lBQ3ZCUSxVQUFVWixRQUFRd0IsTUFBTSxDQUFDWCxPQUFPO1lBQ2hDQyxnQkFBZ0JkLFFBQVF3QixNQUFNLENBQUNULFlBQVk7UUFDN0MsSUFDQVA7UUFDSmtCLFFBQVExQixRQUFRMEIsTUFBTTtJQUN4QjtBQUNGIn0=
