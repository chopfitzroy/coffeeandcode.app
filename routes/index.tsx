import Header from "../islands/Header.tsx";
import Counter from "../islands/Counter.tsx";
import TrackControls from "../islands/TrackControls.tsx";

import { Head } from "$fresh/runtime.ts";
import { HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import { Admin, Record } from "https://esm.sh/pocketbase@0.9.0";
import { MiddlewareState } from "./_middleware.ts";

interface HomeProps {
  loggedIn: boolean;
}

export const handler: Handlers = {
  GET(_, ctx: HandlerContext<HomeProps, MiddlewareState>) {
    const pb = ctx.state.pb;
    const loggedIn = pb.authStore.model instanceof Record ||
      pb.authStore.model instanceof Admin;
    return ctx.render({ loggedIn });
  },
};

export default function Home(props: PageProps<HomeProps>) {
  const { loggedIn } = props.data;
  return (
    <>
      <Head>
        <title>Fresh App</title>
        <script
          defer
          src="/analytics"
          data-domain="coffeeandcode.app"
        >
        </script>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <Header loggedIn={loggedIn} />
        <img
          src="/logo.svg"
          class="w-32 h-32"
          alt="the fresh logo: a sliced lemon dripping with juice"
        />
        <p class="my-6">
          Welcome to `fresh`. Try updating this message in the
          ./routes/index.tsx file, and refresh.
          {loggedIn ? '🎉' : '🛑'}
        </p>
        <Counter start={3} />
        <TrackControls start={5} />
      </div>
    </>
  );
}
