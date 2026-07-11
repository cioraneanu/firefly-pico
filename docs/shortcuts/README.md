# Firefly Pico Ramble Shortcut

Save a spoken note to Firefly Pico by saying the shortcut's name to Siri or running it from the Shortcuts app, Action button, Home Screen, or Apple Watch.

The shortcut:

1. Dictates text until you tap to stop.
2. Sends the text to `{Firefly Pico URL}/api/assistant/rambles`.
3. Shows `Ramble saved` after Pico accepts it.

Saved rambles can later be loaded and interpreted from Pico's transaction assistant.

## Install

The best distribution method is an iCloud shortcut link created from a tested copy in Apple's Shortcuts app. Until an iCloud link is published, use one of these options:

- Import `pico-signed.shortcut` on an iPhone, iPad, or Mac, then answer its two setup questions.
- Build it manually using the steps below.

Do not try to import `pico.shortcut`; it is the unsigned developer artifact and current Apple devices reject unsigned generated shortcuts.

During setup, enter:

- Your Firefly Pico base URL, without a trailing slash, such as `https://pico.example.com`.
- Your complete authorization value, such as `Bearer your-token`.

After installation, rename the shortcut to a distinctive spoken phrase such as `Save Firefly ramble`. Siri runs shortcuts by name.

## Security

The shortcut stores its authorization value on the device and uses it to authenticate with Pico. That value currently has the same access as the associated Firefly token.

- Never share or publish a shortcut after configuring it with a real token.
- Prefer a dedicated token rather than your primary Firefly token.
- Revoke the token if the shortcut or device is exposed.
- Inspect imported shortcuts before entering credentials.

The distributable source contains placeholder values. Its setup questions replace those values during installation so credentials are not embedded in the shared template.

## Manual iPhone Setup

Create a shortcut named `Save Firefly ramble` with these actions:

1. **Text:** your Firefly Pico base URL, for example `https://pico.example.com`.
2. **Text:** your full authorization value, for example `Bearer your-token`.
3. **Dictate Text:** set **Stop Listening** to **On Tap**.
4. **URL:** insert the first Text action and append `/api/assistant/rambles`.
5. **Get Contents of URL:**
   - URL: the URL action above.
   - Method: `POST`.
   - Headers:
     - `Accept`: `application/json`
     - `Authorization`: the second Text action.
     - `Content-Type`: `text/plain`
   - Request Body: `File`.
   - File: Dictated Text.
6. **Show Result:** `Ramble saved`.

The request action stops the shortcut and displays an error when Pico cannot be reached or rejects the request, so the success message is only shown after the request completes.

Test the shortcut once from the Shortcuts app before invoking it with Siri. Verify that:

- Pico is reachable from the phone's current network.
- dictation produces non-empty text;
- `Ramble saved` appears;
- the saved item appears under **Load saved** in Pico.

## Source and Distribution

- `pico.shortcut.plist`: readable source of truth.
- `pico.shortcut`: generated unsigned binary plist for development and signing.
- `pico-signed.shortcut`: Apple-signed end-user artifact.

Regenerate the unsigned artifact on macOS:

```sh
cp "docs/shortcuts/pico.shortcut.plist" "docs/shortcuts/pico.shortcut"
plutil -convert binary1 "docs/shortcuts/pico.shortcut"
```

Sign it for distribution:

```sh
shortcuts sign --mode anyone --input "docs/shortcuts/pico.shortcut" --output "docs/shortcuts/pico-signed.shortcut"
```

After signing, import and run the exact signed artifact on a current iPhone before publishing it. For the smoothest installation, open that tested shortcut in Shortcuts, retain the two setup questions, choose **Copy iCloud Link**, and publish the link here.
