# App Store release

Owner steps for the first iOS release. The repo is already configured for Expo SDK 54 and EAS. Do these in order.

App name: **Rocket Launch Tracker**. Bundle identifier in `app.json`: `com.rocketlaunchtracker.app`. Marketing version: `1.0.0` (`app.json`). Production builds take the build number from EAS (`eas.json` `cli.appVersionSource` is `remote`, and the production profile sets `autoIncrement`).

## 1. Apple Developer Program

Enroll the Apple ID that will own the app at [developer.apple.com/programs](https://developer.apple.com/programs/). Membership is required before `eas build` can sign an App Store binary.

## 2. Install and log in to EAS

```bash
npm i -g eas-cli
eas login
```

## 3. Link the Expo project

From the repo root:

```bash
eas init
```

This writes `extra.eas.projectId` into `app.json`. Commit that change. Do not commit `.env`.

## 4. Confirm the bundle identifier

`com.rocketlaunchtracker.app` may already be registered to another Apple Developer account. The identifier cannot be changed after the first successful upload for that App Store record.

If it is taken, pick an identifier you control and change both of these before building:

- `expo.ios.bundleIdentifier` in `app.json`
- `expo.android.package` in `app.json` (keep them the same)

## 5. NASA API key (optional)

Store builds read `EXPO_PUBLIC_NASA_API_KEY`. Empty or placeholder values are ignored and the app uses NASA's `DEMO_KEY` (30 requests per hour). A personal key allows 1,000 requests per hour. The key is embedded in the app binary because it is an `EXPO_PUBLIC_` variable. Do not put it in `app.json`.

Create one at [api.nasa.gov](https://api.nasa.gov/#signUp), then:

```bash
eas env:create --environment production --name EXPO_PUBLIC_NASA_API_KEY --value YOUR_KEY --visibility sensitive --type string
```

Repeat with `--environment preview` if you install preview builds. Skip this step to ship with `DEMO_KEY`.

`EXPO_PUBLIC_LL2_ENV=prod` is already set on the preview and production profiles in `eas.json`. That selects `https://ll.thespacedevs.com/2.3.0`. The free tier is about 15 requests per hour per IP. The app caches responses and shows the cache when it is rate-limited or offline.

## 6. Create the app in App Store Connect

In [App Store Connect](https://appstoreconnect.apple.com/), create an iOS app with the same bundle identifier and the name **Rocket Launch Tracker** (21 characters; the limit is 30).

Listing copy, keywords, categories, and the age-rating answers that EAS Metadata knows about are in `store.config.json`. After the app record exists:

```bash
npx eas-cli@latest metadata:lint
eas metadata:push
```

`metadata:push` does not fill the review contact. In App Store Connect, add the review contact's first name, last name, email, and phone. There is no demo account (`store.config.json` notes say so).

`store.config.json` sets `automaticRelease` to false, so an approved version stays held until you release it.

## 7. Build

```bash
eas build -p ios --profile production
```

The production profile pins the iOS image to `macos-sequoia-15.6-xcode-26.0` (the SDK 54 image). That image includes Xcode 26, which meets Apple's requirement, in effect since April 28, 2026, that new uploads use the iOS 26 SDK.

The first build asks EAS to start the remote build number. Accept the default of 1 unless you already have builds.

## 8. Upload the build

```bash
eas submit -p ios --profile production
```

`submit.production` in `eas.json` is empty on purpose. The command prompts for your Apple ID and the App Store Connect app. You can switch later to an App Store Connect API key.

Export compliance is already answered in the binary (`ITSAppUsesNonExemptEncryption` = false). The app only uses HTTPS.

## 9. Publish the policy pages

The in-app Privacy Policy and Support rows open:

- https://xsuat.github.io/rocket-launch-tracker/privacy-policy.html
- https://xsuat.github.io/rocket-launch-tracker/support.html

On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/docs`**. Wait until those URLs load. They have to be live before you submit for review.

## 10. Screenshots

Apple requires 6.9-inch iPhone screenshots. Do not upload iPad screenshots: `supportsTablet` is false, so the app is iPhone-only.

Capture them from the iOS Simulator (a 6.9-inch device such as iPhone 16 Pro Max or the current 6.9-inch simulator). Suggested screens: upcoming launches, a launch's details, the events calendar, the gallery, and Settings showing the privacy policy row.

## 11. App Privacy

In App Store Connect, answer the nutrition label as **Data Not Collected**.

- Tracking: No
- No data types collected
- This matches `ios.privacyManifests` (`NSPrivacyTracking` false, `NSPrivacyCollectedDataTypes` empty) and the privacy policy

The app does contact Launch Library 2 and NASA to fetch public data. Those requests carry a normal connection IP address and, for NASA, the app's API key. The app does not send location, contacts, or an account identifier, and it does not receive that traffic on a server of its own.

## 12. Age rating

`store.config.json` answers the content questions EAS Metadata supports (all None / false, not a Kids category app, no age override). Apple's 2025 questionnaire also asks about capabilities. Answer those in App Store Connect as follows:

| Question | Answer |
| --- | --- |
| Parental controls | No |
| Age assurance | No |
| Unrestricted web access | No (links open in Safari or Maps, not in an in-app browser) |
| User-generated content | No |
| Social media | No |
| Messaging and chat | No |
| Advertising | No |
| Health or wellness topics | No |
| Medical or treatment information | None |
| Profanity or crude humor | None |
| Horror or fear themes | None |
| Alcohol, tobacco, or drug use | None |
| Mature or suggestive themes | None |
| Sexual content or nudity | None |
| Graphic sexual content and nudity | None |
| Cartoon or fantasy violence | None |
| Realistic violence | None |
| Prolonged graphic or sadistic violence | None |
| Guns or other weapons | No |
| Gambling | No |
| Simulated gambling | None |
| Contests | None |
| Loot boxes | No |
| Age rating override | None |

Expected result: **4+**.

## 13. TestFlight

Install the uploaded build with TestFlight. Check upcoming launches, a launch detail, a reminder (allow notifications), Add to Calendar, the gallery, and the privacy policy link. Confirm the system never asks for location.

## 14. Submit for review

Submit the version in App Store Connect. Paste the review notes from `store.config.json` (`apple.review.notes`) if they are not already on the version. After approval, release the version yourself (`automaticRelease` is false).

## What the project already sets

- Icon, splash, and dark appearance (`userInterfaceStyle`: `dark`)
- iPhone only, portrait, `UIRequiresFullScreen` so the upload does not need every iPad orientation
- No location permission and no ISS pass feature
- Calendar purpose string for adding an event the user taps; no Reminders permission
- Local notifications only. `plugins/withLocalNotificationsOnly.js` removes the `aps-environment` push entitlement that `expo-notifications` would otherwise add during prebuild
- Privacy manifest for UserDefaults (`CA92.1`), file timestamps (`C617.1`), system boot time (`35F9.1`), and disk space (`E174.1`)
