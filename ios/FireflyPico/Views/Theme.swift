import SwiftUI

/// The app's colors, taken from the icon: indigo ground, gold coin, white ramble.
enum Theme {
    static let indigo = Color(hex: 0x4B3FD6)
    static let gold = Color(hex: 0xFDD20E)
    /// Icons and text on gold.
    static let ink = Color(hex: 0x2A2170)
    /// Secondary text on indigo.
    static let onIndigoSecondary = Color(hex: 0xD9D6FA)
    static let recordingDot = Color(hex: 0xFF8A7A)

    static let background = Color(light: 0xF4F3FA, dark: 0x0F0E17)
    static let card = Color(light: 0xFFFFFF, dark: 0x1C1B27)
    static let divider = Color(light: 0xEEEDF5, dark: 0x2A2938)
    static let text = Color(light: 0x17152E, dark: 0xF2F1F8)
    static let secondaryText = Color(light: 0x5D5A78, dark: 0xA4A2B8)
    static let accent = Color(light: 0x4B3FD6, dark: 0x9D96FF)

    struct StatusStyle {
        let label: String
        let foreground: Color
        let background: Color
        let symbol: String
    }

    static func style(for status: HistoryEntry.Status) -> StatusStyle {
        switch status {
        case .sent:
            StatusStyle(label: "Sent", foreground: Color(light: 0x17773F, dark: 0x5BD08A),
                        background: Color(light: 0xE2F4E8, dark: 0x173324), symbol: "checkmark")
        case .sending:
            StatusStyle(label: "Sending", foreground: accent,
                        background: Color(light: 0xECEAFF, dark: 0x27244A), symbol: "arrow.up")
        case .waiting:
            StatusStyle(label: "Waiting", foreground: Color(light: 0x8A5300, dark: 0xF5B841),
                        background: Color(light: 0xFFF0D2, dark: 0x3A2C10), symbol: "clock")
        case .failed:
            StatusStyle(label: "Failed", foreground: Color(light: 0xB42318, dark: 0xFF7A70),
                        background: Color(light: 0xFDE8E6, dark: 0x3D1B19), symbol: "exclamationmark")
        case .discarded:
            StatusStyle(label: "Discarded", foreground: secondaryText,
                        background: Color(light: 0xEFEEF4, dark: 0x26252F), symbol: "minus")
        }
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double(hex >> 16 & 0xFF) / 255,
            green: Double(hex >> 8 & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }

    init(light: UInt32, dark: UInt32) {
        self.init(UIColor { traits in
            UIColor(Color(hex: traits.userInterfaceStyle == .dark ? dark : light))
        })
    }
}
