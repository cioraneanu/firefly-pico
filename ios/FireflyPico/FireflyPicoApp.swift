import AppIntents
import SwiftUI
import UserNotifications

@main
struct FireflyPicoApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            PicoScreen()
                .environmentObject(RecordingController.shared)
                .environmentObject(RecordingStore.shared)
                .environmentObject(RecordingHistory.shared)
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                RecordingStore.shared.reload()
                RecordingHistory.shared.backfill(from: RecordingStore.shared.pending)
                UploadService.shared.flush()
            }
        }
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        // A fresh launch means no recording is running, whatever the shared flag or old activities say.
        SharedState.setRecording(false)
        Task { await RecordingActivity.endOrphans() }
        UploadService.shared.activate()
        // A background launch delivers finished uploads; flushing before they arrive would resend them.
        if application.applicationState != .background {
            UploadService.shared.flush()
        }
        return true
    }

    func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
        UploadService.shared.backgroundCompletionHandler = completionHandler
        UploadService.shared.activate()
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .list]
    }
}

/// Makes "Record Ramble" available to Siri, Spotlight, Shortcuts and the Action Button without any setup.
struct PicoShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: RecordRambleIntent(),
            phrases: [
                "Record a ramble in \(.applicationName)",
                "Start \(.applicationName)",
            ],
            shortTitle: "Record Ramble",
            systemImageName: "mic.fill"
        )
        AppShortcut(
            intent: StopRecordingIntent(),
            phrases: ["Stop \(.applicationName)"],
            shortTitle: "Stop Ramble",
            systemImageName: "stop.fill"
        )
    }
}
