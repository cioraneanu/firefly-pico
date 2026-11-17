# Firefly Pico

A small native iOS app that records voice rambles and sends them to [Firefly Pico](https://github.com/cioraneanu/firefly-pico). The Pico backend transcribes them, and you review and save them in Pico's ramble screen as usual.

It covers two use cases:

1. **Start from anywhere:** the Action Button, Control Center or a lock screen control starts recording, and pressing it again stops and sends.
2. **Keep recording while you use other apps:** start recording, open your bank app and read your transactions out loud, then tap **Stop & send** in the Dynamic Island.

The app is also a full Pico client: its main screen is the Pico web app from `../front`, bundled inside the app. You sign in there, in **Settings → Setup**, exactly as in the browser; the web app hands the backend URL and token to the app, so there is no separate iOS setup screen. In the app, the web app's floating profile tab gets a mic button that starts and stops a native recording, and **Settings → Voice recorder** opens the native recorder (history, language, pause trimming).

The app uses the same endpoint as the Siri shortcut: `POST /api/assistant/rambles`, with a multipart `voice` file (AAC `.m4a`) and an optional `language` field. No backend changes are needed.

## Requirements

- Xcode 26 or newer, and [XcodeGen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`)
- iOS 18 or newer on the phone. The Action Button needs an iPhone 15 Pro or newer.
- An Apple Developer account. The app uses an App Group, so free accounts may not be able to sign it, and their builds expire after 7 days.

## Build and install

```sh
cp Config/Local.xcconfig.example Config/Local.xcconfig   # set DEVELOPMENT_TEAM (and BUNDLE_ID_PREFIX if needed)
scripts/build-web.sh                                     # builds ../front into WebApp/, which the app bundles
xcodegen generate
open FireflyPico.xcodeproj
```

Run `scripts/build-web.sh` again after changing the web app. While working on the web app, set `PICO_DEV_SERVER = localhost:3000` in `Config/Local.xcconfig` instead: Debug builds then load `npm run dev` from `../front`, with hot reload; Release builds always use the bundled web app (on a phone, use the Mac's IP and `npm run dev -- --host`).

Choose your iPhone as the run destination and press Run. With automatic signing, Xcode registers the bundle IDs and the App Group (`group.<prefix>.FireflyPico`).

`FireflyPico.xcodeproj` is generated from `project.yml`. Change targets, files or Info.plist keys in `project.yml`, then run `xcodegen generate` again.

## Set up on the phone

1. Open **Firefly Pico**. Pico opens on its Setup page: enter the Pico backend URL and Firefly personal access token, and Save. Optionally set a default language, e.g. `ro`, in **Settings → Voice recorder** → ⚙︎.
2. Tap the mic in the profile tab once, then allow the microphone and notifications. A recording started from the Action Button can't show the permission prompt, so this step is required.
3. Add the **Record Ramble** control:
   - **Action Button:** Settings → Action Button → Controls → Record Ramble
   - **Control Center:** edit Control Center → Add a Control → Firefly Pico
   - **Lock screen:** customize the lock screen → replace a bottom button → Record Ramble

   **Record Ramble** also appears in Shortcuts and Siri, for example "Record a ramble in Firefly Pico".

## How it works

| Piece | Where |
| --- | --- |
| Background recording (`AVAudioRecorder`, `UIBackgroundModes: audio`, mixes with other apps' audio, resumes after interruptions) | `FireflyPico/Recording/AudioRecorder.swift` |
| Start, stop and discard, from the app, the control, Siri or the Live Activity | `FireflyPico/Recording/RecordingController.swift` |
| Intents: `AudioRecordingIntent` and `LiveActivityIntent` | `Shared/RecordingIntents.swift` |
| Live Activity (lock screen and Dynamic Island, with Stop & send and Discard buttons) | `FireflyPicoWidgets/RecordingLiveActivity.swift` |
| Control for the Action Button, Control Center and lock screen | `FireflyPicoWidgets/RecordControl.swift` |
| Shortens pauses over 1 s to 0.5 s before upload to cut transcription costs; discards recordings with no speech (Settings → Shorten pauses) | `FireflyPico/Recording/SilenceTrimmer.swift` |
| Offline queue: each recording stays on disk until Pico answers 2xx | `FireflyPico/Upload/RecordingStore.swift` |
| History of every ramble and where its upload stands (sending, waiting, failed, sent, discarded), kept after the audio is deleted | `FireflyPico/Upload/RecordingHistory.swift`, `FireflyPico/Views/HistoryView.swift` |
| Upload through a background `URLSession`, retried on launch, on return to the app and after each recording | `FireflyPico/Upload/UploadService.swift` |
| The Pico web app in a `WKWebView`, served from the app bundle at `pico://localhost` (or from `PICO_DEV_SERVER`). Links to other sites open in Safari | `FireflyPico/Web/PicoWeb.swift`, `FireflyPico/Views/PicoScreen.swift` |
| Bridge with the web app. Web → app through `window.webkit.messageHandlers.pico`: `session` (backend URL, token and HTTP headers, sent whenever they change), `ready`, `toggleRecording`, `openRecorder`. App → web: a `pico-native` event on `window` with the recording state (`idle`, `recording`, `saved`). Only the app's own origin can use it | `FireflyPico/Web/PicoWeb.swift`, `../front/core/composables/useNativeApp.js`, `../front/plugins/native-app.client.js` |
| Settings (token in the Keychain, readable after first unlock so locked-phone uploads work) | `FireflyPico/Support/` |

Limits: recordings stop automatically after 30 minutes (about 7 MB, well under the server's 25 MB limit). Recordings shorter than 1 second are treated as accidental taps and discarded.

## Known gaps

- **Test on a real iPhone.** The simulator can't test the Action Button, starting while the phone is locked, or recording through a phone call.
- **Duplicate rambles are possible.** If an upload reaches Pico but the reply is lost, the retry creates a second ramble. The proper fix is an optional `client_id` on the endpoint.
- **Bundled web app.** The app ships the web app it was built with, so rebuild it (`scripts/build-web.sh`, then the app) when you update the Pico server. Attachment downloads (`<a download>`) don't do anything yet; they need a `WKDownloadDelegate`. The PWA service worker doesn't run in the app.
- **Plain-HTTP servers.** iOS only allows plain `http://` for local addresses (`NSAllowsLocalNetworking`). Anything else must use HTTPS.

## Debugging

The intents and the upload service log under the `FireflyPico` subsystem:

```sh
log stream --info --predicate 'subsystem == "FireflyPico"'   # for a device, use Console.app
```

Each intent logs which process ran it (`com.….FireflyPico` or `….Widgets`). If a control or Live Activity button does nothing, check this first.

`scripts/make-icon.swift` regenerates the app icon.
