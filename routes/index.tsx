import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Counter from "../islands/Counter.tsx";
import PocketBase from "https://esm.sh/pocketbase@0.9.0"

export const handler: Handlers<unknown> = {
  async GET(_, ctx) {
    const pb = new PocketBase('http://127.0.0.1:8090');
    const adminData = await pb.admins.authWithPassword('', '')
    return ctx.render(adminData);
  },
};

export default function Home({ data }: PageProps<unknown>) {
  console.log(data);
  return (
    <>
      <Head>
        <title>Fresh App</title>
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
      </div>
    </>
  );
}
