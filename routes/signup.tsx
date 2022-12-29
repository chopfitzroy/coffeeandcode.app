import SignupForm from "../islands/SignupForm.tsx";

import { Head } from "$fresh/runtime.ts";
import { HandlerContext, Handlers } from "$fresh/server.ts";
import { MiddlewareState } from "./_middleware.ts";

interface SignupRequest {
  email: string;
  username: string;
  password: string;
  passwordConfirm: string;
}

export const handler: Handlers = {
  async POST(req: Request, ctx: HandlerContext<unknown, MiddlewareState>) {
    const pb = ctx.state.pb;

    const signUp = async (data: SignupRequest) => {
      try {
        await pb.collection("users").create(data);
        await pb.collection("users").authWithPassword(
          data.username,
          data.password,
        );
      } catch (err) {
        return new Response(JSON.stringify({ data: err }), {
          status: 500,
        });
      }
    };

    const formData = await req.formData();
    await signUp(Object.fromEntries(formData) as unknown as SignupRequest);

    return new Response(undefined, {
      status: 307,
      headers: { Location: "/" },
    });
  },
};

export default function Signup() {
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
        <SignupForm />
      </div>
    </>
  );
}
