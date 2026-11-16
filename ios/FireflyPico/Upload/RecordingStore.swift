import Foundation

/// A finished recording that hasn't reached Pico yet.
struct PendingRecording: Codable, Identifiable, Hashable {
    let id: UUID
    let createdAt: Date
    var duration: TimeInterval
    var language: String?
    /// Last failure, shown in the list. Nil while the first attempt is in flight.
    var lastError: String?
}

/// Keeps finished recordings on disk until they upload, so nothing is lost offline or if the app is killed.
/// Each recording is `<id>.m4a` plus a `<id>.json` sidecar with its metadata.
@MainActor
final class RecordingStore: ObservableObject {
    static let shared = RecordingStore()

    nonisolated static let directory: URL = {
        let directory = URL.applicationSupportDirectory.appending(path: "Recordings", directoryHint: .isDirectory)
        // Recording and uploading happen while the phone is locked, so files must stay readable after the first unlock.
        try? FileManager.default.createDirectory(
            at: directory,
            withIntermediateDirectories: true,
            attributes: [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication]
        )
        return directory
    }()

    nonisolated static func audioURL(for id: UUID) -> URL {
        directory.appending(path: "\(id.uuidString).m4a")
    }

    nonisolated private static func metadataURL(for id: UUID) -> URL {
        directory.appending(path: "\(id.uuidString).json")
    }

    @Published private(set) var pending: [PendingRecording] = []

    private init() {
        reload()
    }

    func reload() {
        let files = (try? FileManager.default.contentsOfDirectory(at: Self.directory, includingPropertiesForKeys: nil)) ?? []
        pending = files
            .filter { $0.pathExtension == "json" }
            .compactMap { try? JSONDecoder().decode(PendingRecording.self, from: Data(contentsOf: $0)) }
            .filter { FileManager.default.fileExists(atPath: Self.audioURL(for: $0.id).path(percentEncoded: false)) }
            .sorted { $0.createdAt < $1.createdAt }
    }

    func recording(_ id: UUID) -> PendingRecording? {
        pending.first { $0.id == id }
    }

    func save(_ recording: PendingRecording) {
        if let data = try? JSONEncoder().encode(recording) {
            try? data.write(to: Self.metadataURL(for: recording.id), options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        }
        reload()
    }

    func markFailed(_ id: UUID, message: String) {
        guard var recording = recording(id) else { return }
        recording.lastError = message
        save(recording)
    }

    func remove(_ id: UUID) {
        try? FileManager.default.removeItem(at: Self.audioURL(for: id))
        try? FileManager.default.removeItem(at: Self.metadataURL(for: id))
        reload()
    }
}
