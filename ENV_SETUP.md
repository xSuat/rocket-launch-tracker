# Environment variables

The app reads two public environment variables. Neither belongs in `app.json`.

## NASA API key (optional)

Asteroid close approaches and the Astronomy Picture of the Day come from [api.nasa.gov](https://api.nasa.gov/). `getNasaApiKey()` in `services/config.ts` uses the first real value it finds:

1. `process.env.EXPO_PUBLIC_NASA_API_KEY`
2. `expo.extra.nasaApiKey`, if a build still has one
3. `DEMO_KEY`

Empty strings and placeholders such as `<YOUR_NASA_API_KEY_HERE>` are ignored. `DEMO_KEY` allows 30 requests per hour. A key you create at [api.nasa.gov/#signUp](https://api.nasa.gov/#signUp) allows 1,000 requests per hour.

Local development:

```bash
cp .env.example .env
```

Set `EXPO_PUBLIC_NASA_API_KEY` in `.env`, then restart Expo with `npm start`. `.env` is gitignored.

App Store and other EAS builds do not upload `.env`. Create the variable on EAS instead:

```bash
eas env:create --environment production --name EXPO_PUBLIC_NASA_API_KEY --value YOUR_KEY --visibility sensitive --type string
```

`EXPO_PUBLIC_` values are compiled into the app, so treat the key as public. Do not put it in `app.json`.

## Launch Library 2

`EXPO_PUBLIC_LL2_ENV` selects the launch API:

| Value | Host | When to use |
| --- | --- | --- |
| `dev` | `lldev.thespacedevs.com` | Local development |
| `prod` | `ll.thespacedevs.com` | Store and preview builds |

The production free tier is about 15 requests per hour per IP. The app caches responses for 10 minutes, keeps them for 24 hours, and serves the saved copy when the service returns HTTP 429 or the device is offline.

`eas.json` sets `EXPO_PUBLIC_LL2_ENV=prod` on the preview and production profiles. If the variable is unset, debug builds use `dev` and release builds use `prod`. A Settings switch for the endpoint exists only in debug builds, and release builds ignore a value saved by that switch.

## Related

- [.env.example](./.env.example)
- [APP_STORE_RELEASE.md](./APP_STORE_RELEASE.md)
