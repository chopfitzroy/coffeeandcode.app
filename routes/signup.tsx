import SignupForm from "../islands/SignupForm.tsx";

import { Head } from "$fresh/runtime.ts";

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
