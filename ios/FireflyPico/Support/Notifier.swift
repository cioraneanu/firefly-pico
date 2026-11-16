import Foundation
import UserNotifications

/// Local notifications for uploads that need the user's attention.
enum Notifier {
    static func requestAuthorization() async {
        _ = try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound])
    }

    static func uploadFailed(recordingID: UUID, message: String) {
        let content = UNMutableNotificationContent()
        content.title = "Ramble not sent"
        content.body = message
        // One notification per recording, replaced on each failed retry.
        let request = UNNotificationRequest(identifier: recordingID.uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }

    static func clear(recordingID: UUID) {
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [recordingID.uuidString])
    }
}
