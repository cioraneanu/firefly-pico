# Firefly Pico Ramble Shortcut

`Firefly Pico Ramble.shortcut.plist` is a readable Siri Shortcut source plist for quickly saving spoken rambles into Firefly Pico.

iOS does not import unsigned generated `.shortcut` files directly. If you see "Importing unsigned shortcut file is not supported", build the shortcut manually in the Shortcuts app or recreate it on a Mac and share it through Shortcuts/iCloud.

When run, it:

1. Dictates text until you tap to stop.
2. POSTs the dictated text as `text/plain` to `{Firefly Pico URL}/api/assistant/rambles`.
3. Sends these headers:
   - `Authorization: {Authorization Header}`
   - `Content-Type: text/plain`
   - `Accept: application/json`

Use these values in the first two Text actions:

- Firefly Pico URL, without a trailing slash.
- Authorization header value, for example `Bearer your-token`.

## Manual iPhone Setup

Create a new shortcut in Shortcuts with these actions:

1. Text: your Firefly Pico URL, for example `https://your-domain.com`.
2. Text: your full authorization header, for example `Bearer your-token`.
3. Dictate Text: stop listening `On Tap`.
4. URL: use the first Text action and append `/api/assistant/rambles`.
5. Get Contents of URL:
   - URL: the URL action above.
   - Method: `POST`.
   - Headers:
     - `Accept`: `application/json`
     - `Authorization`: the second Text action
     - `Content-Type`: `text/plain`
   - Request Body: `File`
   - File: Dictated Text
6. Optional: Show Result with the response.

## Voice recordings

Instead of dictated text, the endpoint also accepts an audio recording as a `multipart/form-data` upload in a `voice` field (`Record Audio` action + `Get Contents of URL` with Request Body `Form`, add a `File` field named `voice`). Accepted formats include m4a, mp3, wav, ogg/opus, webm and flac (max 25 MB). When the backend has `ASSISTANT_TRANSCRIPTION_ENDPOINT`/`ASSISTANT_TRANSCRIPTION_API_KEY` configured, the recording is transcribed automatically the first time the rambles are loaded, and the app shows a play button next to rambles that carry a recording. A single request can include both `text` and `voice`.

The readable source lives in `Firefly Pico Ramble.shortcut.plist`; regenerate the unsigned binary plist with:

```sh
cp 'docs/shortcuts/Firefly Pico Ramble.shortcut.plist' 'docs/shortcuts/Firefly Pico Ramble.shortcut'
plutil -convert binary1 'docs/shortcuts/Firefly Pico Ramble.shortcut'
```


Signing the shortcut:
```sh
shortcuts sign --mode anyone --input "pico.shortcut" --output "pico-signed.shortcut"
```