import { HandlerContext, Handlers } from "$fresh/server.ts";
import { MiddlewareState } from "./_middleware.ts";

export const handler: Handlers = {
  GET(_, ctx: HandlerContext<unknown, MiddlewareState>) {
    const pb = ctx.state.pb;
    pb.authStore.clear();
    return new Response(undefined, {
      status: 307,
      headers: { Location: "/" },
    });
  },
};

