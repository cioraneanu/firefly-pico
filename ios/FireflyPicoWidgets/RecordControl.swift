import AppIntents
import SwiftUI
import WidgetKit

/// The control for Control Center, the lock screen and the Action Button.
/// Press once to start recording, press again to stop and send.
struct RecordControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: SharedState.recordControlKind, provider: Provider()) { isRecording in
            ControlWidgetToggle("Pico Ramble", isOn: isRecording, action: ToggleRecordingIntent()) { isOn in
                Label(isOn ? "Recording" : "Record", systemImage: isOn ? "stop.circle.fill" : "mic.fill")
            }
            .tint(.red)
        }
        .displayName("Record Ramble")
        .description("Record a voice ramble for Firefly Pico. Press again to stop and send it.")
    }

    struct Provider: ControlValueProvider {
        var previewValue: Bool { false }

        func currentValue() async throws -> Bool {
            SharedState.isRecording
        }
    }
}
