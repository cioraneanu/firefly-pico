import Foundation
import WidgetKit

/// State the app and the widget extension both read, kept in the App Group's defaults.
enum SharedState {
    static let recordControlKind = "FireflyPico.RecordControl"

    private static let isRecordingKey = "isRecording"

    static var appGroupID: String {
        Bundle.main.object(forInfoDictionaryKey: "PicoAppGroup") as? String ?? ""
    }

    private static var defaults: UserDefaults {
        UserDefaults(suiteName: appGroupID) ?? .standard
    }

    static var isRecording: Bool {
        defaults.bool(forKey: isRecordingKey)
    }

    /// Stores the flag and asks the system to redraw the Control Center / lock screen / Action Button control.
    static func setRecording(_ value: Bool) {
        defaults.set(value, forKey: isRecordingKey)
        ControlCenter.shared.reloadControls(ofKind: recordControlKind)
    }
}
