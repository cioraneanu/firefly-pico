import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

struct RecordingLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RecordingActivityAttributes.self) { context in
            LockScreenView(context: context)
                .padding()
                .activityBackgroundTint(Color.black.opacity(0.6))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            let phase = context.state.phase
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label(phase == .recording ? "Pico" : phase.title, systemImage: phase.systemImage)
                        .foregroundStyle(phase.tint)
                        .font(.headline)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    ElapsedText(context: context)
                        .font(.headline.monospacedDigit())
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if phase == .recording {
                        RecordingButtons()
                    }
                }
            } compactLeading: {
                Image(systemName: phase.systemImage)
                    .foregroundStyle(phase.tint)
            } compactTrailing: {
                ElapsedText(context: context)
                    .monospacedDigit()
                    .frame(maxWidth: 48)
            } minimal: {
                Image(systemName: phase.systemImage)
                    .foregroundStyle(phase.tint)
            }
        }
    }
}

private struct LockScreenView: View {
    let context: ActivityViewContext<RecordingActivityAttributes>

    var body: some View {
        let phase = context.state.phase
        HStack(spacing: 12) {
            Image(systemName: phase.systemImage)
                .font(.title2)
                .foregroundStyle(phase.tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(phase.title)
                    .font(.headline)
                ElapsedText(context: context)
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            Spacer()
            if phase == .recording {
                RecordingButtons()
                    .fixedSize()
            }
        }
        .foregroundStyle(.white)
    }
}

private struct RecordingButtons: View {
    var body: some View {
        HStack {
            Button(intent: CancelRecordingIntent()) {
                Label("Discard", systemImage: "xmark")
            }
            .tint(.gray)
            Button(intent: StopRecordingIntent()) {
                Label("Stop & send", systemImage: "stop.fill")
            }
            .tint(.red)
        }
        .buttonStyle(.borderedProminent)
    }
}

/// Counts up while recording; afterwards shows the final length.
private struct ElapsedText: View {
    let context: ActivityViewContext<RecordingActivityAttributes>

    var body: some View {
        if let endedAt = context.state.endedAt {
            Text(Duration.seconds(endedAt.timeIntervalSince(context.attributes.startedAt)), format: .time(pattern: .minuteSecond))
        } else {
            Text(context.attributes.startedAt, style: .timer)
        }
    }
}
