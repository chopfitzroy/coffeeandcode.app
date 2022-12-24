import { MiddlewareHandlerContext } from "$fresh/server.ts";
import PocketBase from "https://esm.sh/pocketbase@0.9.0"

export interface MiddlewareState {
  pb: PocketBase
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<MiddlewareState>,
) {
  // @NOTE
  // - Similar to recommended SvelteKit implementation
  // - https://github.com/pocketbase/js-sdk#ssr-integration
  ctx.state.pb = new PocketBase("http://127.0.0.1:8090");
  ctx.state.pb.authStore.loadFromCookie(req.headers.get('cookie') || '');

  try {
    if (ctx.state.pb.authStore.isValid) {
      await ctx.state.pb.collection('users').authRefresh();
    }
  } catch (_) {
    ctx.state.pb.authStore.clear();
  }

  // @NOTE
  // - Cannot mutate headers directly
  // - https://github.com/satyarohith/sift/issues/29
  const resp = await ctx.next();
  const headers = new Headers(resp.headers);

  headers.set('set-cookie', ctx.state.pb.authStore.exportToCookie());

  return new Response(resp.body, { ...resp, headers });
}