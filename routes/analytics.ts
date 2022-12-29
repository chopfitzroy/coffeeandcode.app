import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET() {
    return fetch("https://plausible.io/js/script.js");
  },
};
