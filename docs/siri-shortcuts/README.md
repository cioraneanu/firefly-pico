# Firefly Pico Siri Shortcuts

Two ready-made, signed shortcut templates for sending rambles to Firefly Pico from your iPhone. Tap the file to import it into the Shortcuts app.

| File | What it does |
| --- | --- |
| `pico-text-template-signed.shortcut` | Dictates text, then POSTs it as `text/plain` to `{Pico URL}/api/assistant/rambles`. |
| `pico-voice-template-signed.shortcut` | Records audio, then uploads it as `multipart/form-data` in a `voice` field to the same endpoint. The backend transcribes it. |

## What to configure

After importing, open the shortcut and edit the first two `Text` actions:

1. **Firefly Pico URL** — e.g. `https://your-domain.com`, no trailing slash.
2. **Authorization header** — replace the `<ADD FIREFLY PERSONAL TOKEN HERE>` placeholder with your Firefly III personal access token. Keep the `Bearer ` prefix.

Nothing else needs changing.

Optional, voice shortcut only: a `language` form field (ISO-639-1, e.g. `ro`, `en`) overrides the server's `ASSISTANT_TRANSCRIPTION_LANGUAGE` for that request. Useful if you record in a different language than your default.

## Notes on voice

- Accepted formats: m4a, mp3, wav, ogg/opus, webm, flac (max 25 MB).
- Transcription requires `ASSISTANT_TRANSCRIPTION_ENDPOINT` and `ASSISTANT_TRANSCRIPTION_API_KEY` on the backend; recordings are transcribed the first time rambles are loaded.
- Short utterances ("farmacie 23") give the model too little to detect the language — set `ASSISTANT_TRANSCRIPTION_LANGUAGE` to avoid gibberish.
- Recordings that transcribe to nothing (silence) are deleted; failed requests are retried on the next load.

## Building your own

iOS refuses unsigned `.shortcut` files ("Importing unsigned shortcut file is not supported"). Sign them on a Mac:

```sh
shortcuts sign --mode anyone --input "pico.shortcut" --output "pico-signed.shortcut"
```
