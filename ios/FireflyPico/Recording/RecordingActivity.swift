import ActivityKit
import Foundation

/// Starts, updates and ends the recording Live Activity, looked up by recording ID.
enum RecordingActivity {
    typealias Attributes = RecordingActivityAttributes

    static func start(id: UUID, startedAt: Date) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        do {
            _ = try Activity.request(
                attributes: Attributes(recordingID: id, startedAt: startedAt),
                content: ActivityContent(state: Attributes.ContentState(phase: .recording), staleDate: nil)
            )
        } catch {
            print("Live Activity failed to start: \(error)")
        }
    }

    static func update(id: UUID, phase: Attributes.Phase, endedAt: Date? = nil) async {
        guard let activity = activity(for: id) else { return }
        let state = Attributes.ContentState(phase: phase, endedAt: endedAt ?? activity.content.state.endedAt)
        await activity.update(ActivityContent(state: state, staleDate: nil))
    }

    /// Does nothing when the activity has already ended, so callers can race safely.
    static func end(id: UUID, phase: Attributes.Phase, dismissAfter seconds: TimeInterval = 4) async {
        guard let activity = activity(for: id) else { return }
        let state = Attributes.ContentState(phase: phase, endedAt: activity.content.state.endedAt ?? .now)
        let policy: ActivityUIDismissalPolicy = seconds > 0 ? .after(.now + seconds) : .immediate
        await activity.end(ActivityContent(state: state, staleDate: nil), dismissalPolicy: policy)
    }

    /// Ends "recording" activities left over from a previous run of the app (killed mid-recording).
    static func endOrphans() async {
        for activity in Activity<Attributes>.activities where activity.content.state.phase == .recording {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }

    private static func activity(for id: UUID) -> Activity<Attributes>? {
        Activity<Attributes>.activities.first {
            $0.attributes.recordingID == id && $0.activityState == .active
        }
    }
}
