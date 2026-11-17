import AppIntents
import os

private let log = Logger(subsystem: "FireflyPico", category: "intents")

// These intents compile into the widget extension too, so the control and the Live Activity
// buttons can reference them. Because they are Live Activity / audio recording intents that
// also live in the app target, iOS runs perform() in the app process, where the recorder is.
// They must stay public: when they were internal, iOS ran the extension's no-op copy instead.
// The log line in each perform() shows which process actually ran it.

/// Starts a ramble, or stops and sends it when one is already recording.
/// This is what Siri, Shortcuts and the Action Button's "Shortcut" option run.
public struct RecordRambleIntent: AudioRecordingIntent, LiveActivityIntent {
    public static let title: LocalizedStringResource = "Record Ramble"
    public static let description = IntentDescription("Starts recording a voice ramble for Firefly Pico, or stops and sends it if one is already recording.")

    public init() {}

    public func perform() async throws -> some IntentResult {
        log.info("RecordRambleIntent performing in \(Bundle.main.bundleIdentifier ?? "?", privacy: .public)")
#if !WIDGET_EXTENSION
        try await RecordingController.shared.toggle()
#endif
        return .result()
    }
}

/// Backs the Control Center / lock screen / Action Button control.
public struct ToggleRecordingIntent: SetValueIntent, AudioRecordingIntent, LiveActivityIntent {
    public static let title: LocalizedStringResource = "Toggle Ramble Recording"
    public static let isDiscoverable = false

    @Parameter(title: "Recording")
    public var value: Bool

    public init() {}

    public func perform() async throws -> some IntentResult {
        log.info("ToggleRecordingIntent performing in \(Bundle.main.bundleIdentifier ?? "?", privacy: .public)")
#if !WIDGET_EXTENSION
        if value {
            try await RecordingController.shared.start()
        } else {
            await RecordingController.shared.stop()
        }
#endif
        return .result()
    }
}

public struct StopRecordingIntent: LiveActivityIntent {
    public static let title: LocalizedStringResource = "Stop Ramble"
    public static let description = IntentDescription("Stops the current ramble and sends it to Firefly Pico.")

    public init() {}

    public func perform() async throws -> some IntentResult {
        log.info("StopRecordingIntent performing in \(Bundle.main.bundleIdentifier ?? "?", privacy: .public)")
#if !WIDGET_EXTENSION
        await RecordingController.shared.stop()
#endif
        return .result()
    }
}

public struct CancelRecordingIntent: LiveActivityIntent {
    public static let title: LocalizedStringResource = "Discard Ramble"
    public static let isDiscoverable = false

    public init() {}

    public func perform() async throws -> some IntentResult {
        log.info("CancelRecordingIntent performing in \(Bundle.main.bundleIdentifier ?? "?", privacy: .public)")
#if !WIDGET_EXTENSION
        await RecordingController.shared.cancel()
#endif
        return .result()
    }
}
