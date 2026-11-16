import SwiftUI
import WidgetKit

@main
struct FireflyPicoWidgetsBundle: WidgetBundle {
    var body: some Widget {
        RecordingLiveActivity()
        RecordControl()
    }
}
