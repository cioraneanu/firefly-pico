import ActivityKit
import SwiftUI

/// The Live Activity shown while recording (required by iOS for background recording) and while the ramble uploads.
struct RecordingActivityAttributes: ActivityAttributes {
    enum Phase: String, Codable, Hashable {
        case recording
        case sending
        case sent
        /// Saved on the phone; it will be sent when the connection comes back.
        case queued
        case failed
    }

    struct ContentState: Codable, Hashable {
        var phase: Phase
        var endedAt: Date?
    }

    var recordingID: UUID
    var startedAt: Date
}

extension RecordingActivityAttributes.Phase {
    var title: String {
        switch self {
        case .recording: "Recording ramble"
        case .sending: "Sending to Pico…"
        case .sent: "Sent to Pico"
        case .queued: "Saved, will send later"
        case .failed: "Couldn't send"
        }
    }

    var systemImage: String {
        switch self {
        case .recording: "mic.fill"
        case .sending: "arrow.up.circle"
        case .sent: "checkmark.circle.fill"
        case .queued: "tray.and.arrow.up"
        case .failed: "exclamationmark.triangle.fill"
        }
    }

    var tint: Color {
        switch self {
        case .recording: .red
        case .sending, .queued: .orange
        case .sent: .green
        case .failed: .yellow
        }
    }
}
