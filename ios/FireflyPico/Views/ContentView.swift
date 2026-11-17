import AVFoundation
import Combine
import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var controller: RecordingController
    @EnvironmentObject private var store: RecordingStore
    @EnvironmentObject private var history: RecordingHistory

    @State private var showSettings = false
    @State private var isConfigured = PicoSettings.isConfigured
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            StageView(showSettings: $showSettings) {
                Task { await toggleRecording() }
            }
            HistoryView(isConfigured: isConfigured)
        }
        .background(Theme.background.ignoresSafeArea())
        .sheet(isPresented: $showSettings, onDismiss: {
            isConfigured = PicoSettings.isConfigured
            UploadService.shared.flush()
        }) {
            SettingsView()
        }
        .alert("Couldn't record", isPresented: .constant(errorMessage != nil)) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
        .task {
            history.backfill(from: store.pending)
            await Notifier.requestAuthorization()
        }
    }

    private func toggleRecording() async {
        do {
            try await controller.toggleFromForeground()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Stage

/// The indigo top of the screen: the record button, or the timer and controls while recording.
private struct StageView: View {
    @EnvironmentObject private var controller: RecordingController
    @Binding var showSettings: Bool
    let toggle: () -> Void

    var body: some View {
        VStack(spacing: 18) {
            HStack {
                HStack(spacing: 10) {
                    RambleMark()
                        .frame(width: 40, height: 16)
                    Text("Firefly Pico")
                        .font(.system(size: 18, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                }
                Spacer()
                Button {
                    showSettings = true
                } label: {
                    Image(systemName: "slider.horizontal.3")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                        .background(.white.opacity(0.14), in: RoundedRectangle(cornerRadius: 14))
                }
                .accessibilityLabel("Settings")
            }

            Group {
                if let current = controller.current {
                    RecordingPanel(recording: current, stop: toggle)
                } else {
                    IdlePanel(record: toggle)
                }
            }
            .frame(height: 290)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
        .background {
            UnevenRoundedRectangle(bottomLeadingRadius: 36, bottomTrailingRadius: 36)
                .fill(Theme.indigo)
                .ignoresSafeArea(edges: .top)
        }
        .animation(.snappy, value: controller.isRecording)
    }
}

private struct IdlePanel: View {
    @EnvironmentObject private var controller: RecordingController
    @AppStorage(PicoSettings.languageKey) private var defaultLanguage = ""
    let record: () -> Void

    private static let languages = ["en", "ro", "de", "fr", "es", "it"]

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 22)
            Button(action: record) {
                Image(systemName: "mic.fill")
                    .font(.system(size: 48, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 128, height: 128)
                    .background(Theme.gold, in: Circle())
                    .background {
                        Circle().fill(Theme.gold.opacity(0.08)).padding(-22)
                        Circle().fill(Theme.gold.opacity(0.20)).padding(-10)
                    }
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Record")

            VStack(spacing: 4) {
                Text("Tap to start a ramble")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text("Keeps going while you use other apps")
                    .font(.subheadline)
                    .foregroundStyle(Theme.onIndigoSecondary)
            }
            .padding(.top, 34)
            Spacer(minLength: 18)

            Menu {
                Picker("Language", selection: $controller.languageOverride) {
                    Text(defaultLanguage.isEmpty ? "Default" : "Default (\(defaultLanguage))").tag(String?.none)
                    ForEach(Self.languages, id: \.self) { code in
                        Text(languageName(code)).tag(Optional(code))
                    }
                }
            } label: {
                HStack(spacing: 6) {
                    Text("Language: \(selectedLanguage)")
                    Image(systemName: "chevron.down")
                        .font(.caption.weight(.bold))
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .frame(height: 40)
                .background(.white.opacity(0.14), in: Capsule())
            }
        }
    }

    private var selectedLanguage: String {
        if let code = controller.languageOverride {
            return languageName(code)
        }
        return defaultLanguage.isEmpty ? "Default" : languageName(defaultLanguage)
    }
}

private struct RecordingPanel: View {
    @EnvironmentObject private var controller: RecordingController
    let recording: RecordingController.ActiveRecording
    let stop: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Spacer(minLength: 0)
            HStack(spacing: 8) {
                Circle()
                    .fill(Theme.recordingDot)
                    .frame(width: 9, height: 9)
                Text(recording.language.map { "Recording · \(languageName($0))" } ?? "Recording")
            }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.white)

            Text(recording.startedAt, style: .timer)
                .font(.system(size: 64, weight: .heavy, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(.white)

            LiveWaveform()
                .frame(height: 48)
            Spacer(minLength: 0)

            HStack(spacing: 12) {
                Button {
                    Task { await controller.cancel() }
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 56, height: 56)
                        .background(.white.opacity(0.14), in: Circle())
                }
                .accessibilityLabel("Discard recording")

                Button(action: stop) {
                    HStack(spacing: 10) {
                        RoundedRectangle(cornerRadius: 4)
                            .frame(width: 16, height: 16)
                        Text("Stop & send")
                            .font(.system(size: 17, weight: .heavy, design: .rounded))
                    }
                    .foregroundStyle(Theme.ink)
                    .padding(.leading, 20)
                    .padding(.trailing, 26)
                    .frame(height: 56)
                    .background(Theme.gold, in: Capsule())
                }
            }
        }
    }
}

/// Bars that scroll left with the microphone's loudness.
private struct LiveWaveform: View {
    @EnvironmentObject private var controller: RecordingController
    @State private var levels = Array(repeating: CGFloat(0), count: 24)

    private let timer = Timer.publish(every: 0.08, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(spacing: 4) {
            ForEach(levels.indices, id: \.self) { index in
                Capsule()
                    .fill(.white.opacity(0.9))
                    .frame(width: 5, height: 6 + levels[index] * 42)
            }
        }
        .animation(.linear(duration: 0.08), value: levels)
        .onReceive(timer) { _ in
            levels.removeFirst()
            levels.append(CGFloat(controller.level()))
        }
        .accessibilityHidden(true)
    }
}

/// The icon's squiggle running into the coin.
private struct RambleMark: View {
    var body: some View {
        Canvas { context, size in
            let scale = size.width / 800
            let transform = CGAffineTransform(scaleX: scale, y: scale).translatedBy(x: -110, y: -350)

            var ramble = Path()
            ramble.move(to: CGPoint(x: 140, y: 580))
            ramble.addCurve(to: CGPoint(x: 230, y: 450), control1: CGPoint(x: 160, y: 510), control2: CGPoint(x: 190, y: 450))
            ramble.addCurve(to: CGPoint(x: 330, y: 620), control1: CGPoint(x: 280, y: 450), control2: CGPoint(x: 280, y: 620))
            ramble.addCurve(to: CGPoint(x: 440, y: 380), control1: CGPoint(x: 385, y: 620), control2: CGPoint(x: 385, y: 380))
            ramble.addCurve(to: CGPoint(x: 540, y: 640), control1: CGPoint(x: 490, y: 380), control2: CGPoint(x: 490, y: 640))
            ramble.addCurve(to: CGPoint(x: 610, y: 545), control1: CGPoint(x: 565, y: 640), control2: CGPoint(x: 565, y: 563))
            context.stroke(ramble.applying(transform), with: .color(.white),
                           style: StrokeStyle(lineWidth: 54 * scale, lineCap: .round, lineJoin: .round))

            context.fill(Path(ellipseIn: CGRect(x: 650, y: 380, width: 240, height: 240).applying(transform)),
                         with: .color(Theme.gold))
            context.stroke(Path(ellipseIn: CGRect(x: 698, y: 428, width: 144, height: 144).applying(transform)),
                           with: .color(Color(hex: 0xF7941D)), lineWidth: 24 * scale)
        }
        .accessibilityHidden(true)
    }
}

func languageName(_ code: String) -> String {
    Locale.current.localizedString(forLanguageCode: code) ?? code
}
