import Foundation

/// One ramble as the history shows it, kept after its audio has been sent and deleted.
struct HistoryEntry: Codable, Identifiable, Hashable {
    enum Status: String, Codable {
        /// Upload in flight.
        case sending
        /// Couldn't reach Pico; goes out on the next flush.
        case waiting
        /// Pico or the setup rejected it; needs the user's attention.
        case failed
        case sent
        /// No speech was found, so nothing was sent.
        case discarded
    }

    let id: UUID
    let createdAt: Date
    var duration: TimeInterval
    /// Length before pauses were shortened, when they were.
    var originalDuration: TimeInterval?
    var language: String?
    var status: Status
    var message: String?
}

/// Every recording's outcome, newest first, in a small JSON file next to the recordings.
/// The audio lives in RecordingStore only until it uploads; this is what's left to look back on.
@MainActor
final class RecordingHistory: ObservableObject {
    static let shared = RecordingHistory()

    /// Older entries are dropped so the file stays small.
    static let maxEntries = 300

    nonisolated private static let fileURL = URL.applicationSupportDirectory.appending(path: "History.json")

    @Published private(set) var entries: [HistoryEntry] = []
    /// Upload progress from 0 to 1 for entries being sent. Not saved.
    @Published private(set) var progress: [UUID: Double] = [:]

    private init() {
        if let data = try? Data(contentsOf: Self.fileURL) {
            entries = (try? JSONDecoder().decode([HistoryEntry].self, from: data)) ?? []
        }
    }

    func entry(_ id: UUID) -> HistoryEntry? {
        entries.first { $0.id == id }
    }

    func add(_ entry: HistoryEntry) {
        entries.removeAll { $0.id == entry.id }
        entries.insert(entry, at: 0)
        entries.sort { $0.createdAt > $1.createdAt }
        if entries.count > Self.maxEntries {
            entries.removeLast(entries.count - Self.maxEntries)
        }
        save()
    }

    func update(_ id: UUID, status: HistoryEntry.Status, message: String? = nil) {
        guard let index = entries.firstIndex(where: { $0.id == id }) else { return }
        entries[index].status = status
        entries[index].message = message
        if status != .sending {
            progress[id] = nil
        }
        save()
    }

    func setProgress(_ value: Double, for id: UUID) {
        progress[id] = value
    }

    func remove(_ id: UUID) {
        entries.removeAll { $0.id == id }
        progress[id] = nil
        save()
    }

    /// Adds entries for queued recordings that have none, e.g. ones recorded before the history existed.
    func backfill(from pending: [PendingRecording]) {
        let known = Set(entries.map(\.id))
        let missing = pending.filter { !known.contains($0.id) }
        guard !missing.isEmpty else { return }
        for recording in missing {
            add(HistoryEntry(
                id: recording.id,
                createdAt: recording.createdAt,
                duration: recording.duration,
                language: recording.language,
                status: recording.lastError == nil ? .sending : .waiting,
                message: recording.lastError
            ))
        }
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(entries) else { return }
        try? FileManager.default.createDirectory(at: .applicationSupportDirectory, withIntermediateDirectories: true)
        try? data.write(to: Self.fileURL, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }
}
