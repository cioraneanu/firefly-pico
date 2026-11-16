import AVFoundation
import Combine
import UIKit
import os

private let log = Logger(subsystem: "FireflyPico", category: "recording")

enum RecordingError: LocalizedError {
    case microphonePermission
    case couldNotStart

    var errorDescription: String? {
        switch self {
        case .microphonePermission:
            "Open Firefly Pico once and allow microphone access."
        case .couldNotStart:
            "The microphone couldn't start. Another app may be using it."
        }
    }
}

/// The one place that starts and stops rambles, whether from the app, a control, Siri or the Live Activity.
@MainActor
final class RecordingController: ObservableObject {
    static let shared = RecordingController()

    static let maxDuration: TimeInterval = 30 * 60
    /// Shorter recordings are treated as accidental taps and discarded.
    static let minimumDuration: TimeInterval = 1

    struct ActiveRecording {
        let id: UUID
        let startedAt: Date
        let language: String?
    }

    @Published private(set) var current: ActiveRecording?
    /// Language for the next recordings, chosen in the app. Nil uses the default from Settings.
    @Published var languageOverride: String?
    /// A recording was stopped and queued for upload (not discarded).
    let saved = PassthroughSubject<Void, Never>()

    var isRecording: Bool { current != nil }

    /// Microphone loudness from 0 to 1 while recording.
    func level() -> Float {
        recorder.level()
    }

    private let recorder = AudioRecorder()
    private var backgroundTasks: [UUID: UIBackgroundTaskIdentifier] = [:]

    private init() {
        recorder.onUnexpectedFinish = { [weak self] in
            Task { await self?.stop() }
        }
    }

    func toggle() async throws {
        if isRecording {
            await stop()
        } else {
            try await start()
        }
    }

    /// Toggles from inside the app, where the microphone prompt can still appear.
    func toggleFromForeground() async throws {
        if !isRecording, AVAudioApplication.shared.recordPermission == .undetermined {
            guard await AVAudioApplication.requestRecordPermission() else {
                throw RecordingError.microphonePermission
            }
        }
        try await toggle()
    }

    func start() async throws {
        guard current == nil else { return }
        // The permission prompt can only appear in the foreground, so the app asks for it up front.
        guard AVAudioApplication.shared.recordPermission == .granted else {
            throw RecordingError.microphonePermission
        }

        let recording = ActiveRecording(id: UUID(), startedAt: .now, language: languageOverride ?? PicoSettings.language)
        try recorder.start(writingTo: RecordingStore.audioURL(for: recording.id), maxDuration: Self.maxDuration)
        current = recording
        // iOS requires a Live Activity for recordings started from the background.
        RecordingActivity.start(id: recording.id, startedAt: recording.startedAt)
        SharedState.setRecording(true)
    }

    /// Stops the current recording and queues it for upload.
    func stop() async {
        guard let recording = current else { return }
        var duration = recorder.stop()
        current = nil
        SharedState.setRecording(false)

        guard duration >= Self.minimumDuration else {
            try? FileManager.default.removeItem(at: RecordingStore.audioURL(for: recording.id))
            await RecordingActivity.end(id: recording.id, phase: .sent, dismissAfter: 0)
            return
        }

        await RecordingActivity.update(id: recording.id, phase: .sending, endedAt: .now)
        var originalDuration: TimeInterval?
        if PicoSettings.trimSilence {
            switch await trimSilence(recording.id) {
            case .silent:
                // Nothing was said, e.g. started by accident in a pocket.
                try? FileManager.default.removeItem(at: RecordingStore.audioURL(for: recording.id))
                RecordingHistory.shared.add(HistoryEntry(
                    id: recording.id,
                    createdAt: recording.startedAt,
                    duration: duration,
                    language: recording.language,
                    status: .discarded,
                    message: "No speech detected"
                ))
                await RecordingActivity.end(id: recording.id, phase: .sent, dismissAfter: 0)
                return
            case let .trimmed(from, to):
                originalDuration = from
                duration = to
            case .unchanged, nil:
                break
            }
        }
        RecordingHistory.shared.add(HistoryEntry(
            id: recording.id,
            createdAt: recording.startedAt,
            duration: duration,
            originalDuration: originalDuration,
            language: recording.language,
            status: .sending
        ))
        RecordingStore.shared.save(PendingRecording(
            id: recording.id,
            createdAt: recording.startedAt,
            duration: duration,
            language: recording.language
        ))
        saved.send()
        UploadService.shared.flush()
        keepAliveWhileSending(recording.id)
    }

    /// Stops and throws the recording away.
    func cancel() async {
        guard let recording = current else { return }
        recorder.stop()
        current = nil
        SharedState.setRecording(false)
        try? FileManager.default.removeItem(at: RecordingStore.audioURL(for: recording.id))
        await RecordingActivity.end(id: recording.id, phase: .sent, dismissAfter: 0)
    }

    /// Shortens long pauses off the main thread. Returns nil if trimming failed; the original file is kept then.
    private func trimSilence(_ id: UUID) async -> SilenceTrimmer.Outcome? {
        // The microphone has stopped, so ask for time to finish before iOS suspends the app.
        let taskID = UIApplication.shared.beginBackgroundTask(withName: "Shorten pauses")
        defer { UIApplication.shared.endBackgroundTask(taskID) }

        let url = RecordingStore.audioURL(for: id)
        do {
            let outcome = try await Task.detached(priority: .userInitiated) {
                try SilenceTrimmer.trim(fileAt: url, settings: AudioRecorder.settings)
            }.value
            log.info("trim \(id, privacy: .public): \(String(describing: outcome), privacy: .public)")
            return outcome
        } catch {
            log.error("trim failed for \(id, privacy: .public): \(error, privacy: .public)")
            return nil
        }
    }

    /// Once the microphone stops, iOS suspends the app within seconds. Ask for a little time so the
    /// Live Activity can show the upload result; if it takes longer, show "will send later" instead
    /// of leaving "Sending…" up. The background session keeps uploading either way.
    private func keepAliveWhileSending(_ id: UUID) {
        backgroundTasks[id] = UIApplication.shared.beginBackgroundTask(withName: "Send ramble") { [weak self] in
            MainActor.assumeIsolated { self?.endBackgroundTask(for: id) }
        }
        Task {
            try? await Task.sleep(for: .seconds(20))
            await RecordingActivity.end(id: id, phase: .queued)
            endBackgroundTask(for: id)
        }
    }

    private func endBackgroundTask(for id: UUID) {
        guard let taskID = backgroundTasks.removeValue(forKey: id) else { return }
        UIApplication.shared.endBackgroundTask(taskID)
    }
}
