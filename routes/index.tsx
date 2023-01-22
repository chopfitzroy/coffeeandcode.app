import Header from "../islands/Header.tsx";
import Playables from "../islands/Playables.tsx";
import PlayableControls from "../islands/PlayableControls.tsx";

import { Head } from "$fresh/runtime.ts";

// @TODO
// - Explore disabling the render until the FSM is ready
export default function Home() {
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
        <Header />
        <img
          src="/logo.svg"
          class="w-32 h-32"
          alt="the fresh logo: a sliced lemon dripping with juice"
        />
        <p class="my-6">
          Welcome to `fresh`. Try updating this message in the
          ./routes/index.tsx file, and refresh.
        </p>
        <Playables />
        <PlayableControls />
      </div>
    </>
  );
}
