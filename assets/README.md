# Assets

App icon, splash and favicon images referenced from `app.json`.

| File | Size | Used for |
| --- | --- | --- |
| `icon.png` | 1024×1024, opaque RGB (no alpha) | iOS app icon / App Store icon (`expo.icon`) |
| `adaptive-icon.png` | 1024×1024, transparent | Android adaptive icon foreground (`android.adaptiveIcon.foregroundImage`) |
| `splash-icon.png` | 1024×1024, transparent | Splash screen image (`expo-splash-screen` plugin) |
| `favicon.png` | 48×48 | Web favicon (`web.favicon`) |

## Sources

The artwork is original and lives in `source/` as SVG:

- `source/icon.svg` – full icon (rocket over the app's space gradient); also rendered as the favicon
- `source/adaptive-icon.svg` – rocket only, scaled into the Android adaptive icon safe zone
- `source/splash-icon.svg` – rocket with a soft glow, for the splash screen

Keep the icon full-bleed and square: iOS applies the rounded mask itself, and App Store
Connect rejects icons with an alpha channel.

## Regenerating the PNGs

`sharp` is only needed for rendering, so it is not a project dependency:

```bash
npm install --no-save sharp
node assets/source/render.mjs
```

After changing the icon, create a new build (`eas build`) for it to show up on devices.
