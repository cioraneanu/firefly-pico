import SwiftUI
import WidgetKit

@main
struct PicoVoiceWidgetsBundle: WidgetBundle {
    var body: some Widget {
        RecordingLiveActivity()
        RecordControl()
    }
}
