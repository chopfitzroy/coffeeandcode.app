# Coffee and code ☕

This is the front end for [coffeeandcode.app](https://coffeeandcode.app) for the API setup please refer this [repo](https://github.com/chopfitzroy/api.coffeeandcode.app).

### Usage 🚀

Start the project:

```
deno task start
```

### Authentication 🗝

All authentication is done in the client (not SSR) originally we used an SSR implementation but the only way to share the auth store between the _server_ and the client was to use [disable `httpOnly`](https://github.com/pocketbase/js-sdk/issues/69).

Given the nature of the app a shared auth store felt like overkill and increased the surface area for security concerns with no real value added.

### Architecture 🎁

Built using the following technologies:

- [fresh](https://fresh.deno.dev/)
- [XState](https://xstate.js.org/)
- [howler.js](https://howlerjs.com/)
- [PocketBase](https://pocketbase.io/)
- [Plausible Analytics](https://plausible.io/)

Deployed using:

- [Litestream](https://litestream.io/)
- [Deno Deploy](https://deno.com/deploy)
- [Digital Ocean](https://www.digitalocean.com/)

Additionally we use [Spaces](https://www.digitalocean.com/products/spaces) for file storage and database backups (with Litestream).

