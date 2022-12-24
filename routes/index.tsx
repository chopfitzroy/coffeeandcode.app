import Counter from "../islands/Counter.tsx";
import TrackControls from '../islands/TrackControls.tsx';

import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <>
      <Head>
        <title>Fresh App</title>
        <script
          defer
          src="/analytics"
          data-domain="coffeeandcode.app"
        ></script>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <img
          src="/logo.svg"
          class="w-32 h-32"
          alt="the fresh logo: a sliced lemon dripping with juice"
        />
        <p class="my-6">
          Welcome to `fresh`. Try updating this message in the ./routes/index.tsx
          file, and refresh.
        </p>
        <Counter start={3} />
        <TrackControls start={5} />
      </div>
    </>
  );
}
