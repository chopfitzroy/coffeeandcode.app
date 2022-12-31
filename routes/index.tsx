import Header from "../islands/Header.tsx";
import Counter from "../islands/Counter.tsx";
import TrackControls from "../islands/TrackControls.tsx";

import { Head } from "$fresh/runtime.ts";
import { pb } from "../utils/pocketbase.ts";
import { HandlerContext, Handlers, PageProps } from "$fresh/server.ts";

interface Track {
  id: string;
  title: string;
  audio: string;
  published: string;
  description: string;
  collectionId: string;
}

interface HomeProps {
  tracks: Track[];
}

export const handler: Handlers = {
  async GET(_, ctx: HandlerContext<HomeProps>) {
    const tracks = await pb.collection("tracks").getFullList<Track>(50, {
      sort: "-published",
    });
    console.log(tracks);
    return ctx.render({ tracks });
  },
};

export default function Home(props: PageProps<HomeProps>) {
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
        {props.data.tracks.map(track => <a href={`https://api.coffeeandcode.app/api/files/${track.collectionId}/${track.id}/${track.audio}`}>{track.title}</a>)}
        <Counter start={3} />
        <TrackControls start={5} />
      </div>
    </>
  );
}
