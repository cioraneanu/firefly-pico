import Foundation
import os

private let log = Logger(subsystem: "FireflyPico", category: "upload")

/// Sends finished recordings to POST /api/assistant/rambles through a background URLSession,
/// so uploads finish even after the app is suspended and wait out lost connectivity.
///
/// The background session does not retry HTTP errors; failed recordings stay in the store
/// and `flush()` sends them again (on launch, on return to the foreground, after each recording).
@MainActor
final class UploadService: NSObject {
    static let shared = UploadService()

    /// Set by the app delegate when iOS relaunches the app to deliver background session events.
    var backgroundCompletionHandler: (() -> Void)?

    private lazy var session: URLSession = {
        let identifier = (Bundle.main.bundleIdentifier ?? "FireflyPico") + ".uploads"
        let configuration = URLSessionConfiguration.background(withIdentifier: identifier)
        configuration.isDiscretionary = false
        configuration.sessionSendsLaunchEvents = true
        return URLSession(configuration: configuration, delegate: self, delegateQueue: .main)
    }()

    private var responseBodies: [Int: Data] = [:]

    /// Recordings with an upload task, so overlapping flushes never send one twice.
    private var sending: Set<UUID> = []
    /// Adopts the tasks a previous launch left in the session, once, before the first send.
    private lazy var adoptTasks = Task {
        sending.formUnion(await session.allTasks.compactMap { $0.taskDescription.flatMap(UUID.init(uuidString:)) })
    }
    /// A flush requested while iOS was still delivering finished uploads; runs once they are in.
    private var flushAfterEvents = false

    private static let bodiesDirectory = URL.applicationSupportDirectory.appending(path: "UploadBodies", directoryHint: .isDirectory)

    private static func bodyURL(for id: UUID) -> URL {
        bodiesDirectory.appending(path: "\(id.uuidString).multipart")
    }

    /// Recreates the session after a relaunch so pending task events are delivered.
    func activate() {
        _ = session
    }

    /// Starts an upload for every stored recording that doesn't already have one in flight.
    func flush() {
        log.info("flush: \(RecordingStore.shared.pending.count) pending")
        // Finished uploads may not be removed from the store yet; sending now would duplicate them.
        guard backgroundCompletionHandler == nil else {
            flushAfterEvents = true
            return
        }
        Task {
            await adoptTasks.value
            // No await from here on, so concurrent flushes see each other's sends.
            for recording in RecordingStore.shared.pending where !sending.contains(recording.id) {
                send(recording)
            }
        }
    }

    private func send(_ recording: PendingRecording) {
        do {
            let api = try PicoAPI.current()
            let bodyURL = Self.bodyURL(for: recording.id)
            let contentType = try MultipartBody.write(
                audioAt: RecordingStore.audioURL(for: recording.id),
                language: recording.language,
                to: bodyURL
            )
            var request = api.request(PicoAPI.rambleUploadPath, method: "POST")
            request.setValue(contentType, forHTTPHeaderField: "Content-Type")

            let task = session.uploadTask(with: request, fromFile: bodyURL)
            task.taskDescription = recording.id.uuidString
            task.resume()
            sending.insert(recording.id)
            RecordingHistory.shared.update(recording.id, status: .sending)
            log.info("upload started for \(recording.id, privacy: .public)")
        } catch {
            log.error("upload not started for \(recording.id, privacy: .public): \(error, privacy: .public)")
            fail(recording.id, error: error, notify: true)
        }
    }

    private func finish(_ id: UUID, status: Int?, body: Data?, error: Error?) {
        sending.remove(id)
        try? FileManager.default.removeItem(at: Self.bodyURL(for: id))
        log.info("upload finished for \(id, privacy: .public): status \(status ?? -1), error \(String(describing: error), privacy: .public)")

        if let error {
            // Connectivity problems: the recording stays queued and goes out on the next flush.
            fail(id, error: error, notify: false)
        } else if let status, (200..<300).contains(status) {
            RecordingStore.shared.remove(id)
            RecordingHistory.shared.update(id, status: .sent)
            Notifier.clear(recordingID: id)
            Task { await RecordingActivity.end(id: id, phase: .sent) }
        } else {
            fail(id, error: PicoError.from(status: status ?? 0, body: body), notify: true)
        }
    }

    private func fail(_ id: UUID, error: Error, notify: Bool) {
        let message = (error as? URLError).map { "Couldn't reach Pico (\($0.localizedDescription)). It will be sent later." }
            ?? error.localizedDescription
        RecordingStore.shared.markFailed(id, message: message)
        // Connectivity problems aren't reported (notify is false) and fix themselves; anything else needs the user.
        RecordingHistory.shared.update(id, status: notify ? .failed : .waiting, message: message)
        if notify {
            Notifier.uploadFailed(recordingID: id, message: message)
        }
        Task { await RecordingActivity.end(id: id, phase: notify ? .failed : .queued) }
    }
}

extension UploadService: URLSessionDataDelegate {
    nonisolated func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        MainActor.assumeIsolated {
            responseBodies[dataTask.taskIdentifier, default: Data()].append(data)
        }
    }

    nonisolated func urlSession(_ session: URLSession, task: URLSessionTask, didSendBodyData bytesSent: Int64, totalBytesSent: Int64, totalBytesExpectedToSend: Int64) {
        MainActor.assumeIsolated {
            guard let id = task.taskDescription.flatMap(UUID.init(uuidString:)), totalBytesExpectedToSend > 0 else { return }
            RecordingHistory.shared.setProgress(Double(totalBytesSent) / Double(totalBytesExpectedToSend), for: id)
        }
    }

    nonisolated func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        MainActor.assumeIsolated {
            let body = responseBodies.removeValue(forKey: task.taskIdentifier)
            guard let id = task.taskDescription.flatMap(UUID.init(uuidString:)) else { return }
            let status = (task.response as? HTTPURLResponse)?.statusCode
            finish(id, status: status, body: body, error: error)
        }
    }

    nonisolated func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
        MainActor.assumeIsolated {
            backgroundCompletionHandler?()
            backgroundCompletionHandler = nil
            if flushAfterEvents {
                flushAfterEvents = false
                flush()
            }
        }
    }
}
