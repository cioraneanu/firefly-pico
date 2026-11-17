import SwiftUI
import WebKit

/// The app's main screen: the Firefly Pico web app. Its profile tab has the record button, and
/// Settings → Voice recorder opens the native recorder (history, language, pause trimming).
struct PicoScreen: View {
    @EnvironmentObject private var controller: RecordingController
    @EnvironmentObject private var store: RecordingStore
    @EnvironmentObject private var history: RecordingHistory
    @ObservedObject private var web = PicoWeb.shared

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            PicoWebView(webView: web.webView)
                .ignoresSafeArea()
            switch web.state {
            case .loading:
                ProgressView()
            case .loaded:
                EmptyView()
            case let .failed(message):
                LoadFailedView(message: message, retry: web.reload)
            }
        }
        .sheet(isPresented: $web.showRecorder) {
            ContentView()
                .environmentObject(controller)
                .environmentObject(store)
                .environmentObject(history)
                .presentationDragIndicator(.visible)
        }
        .alert("Couldn't record", isPresented: .constant(web.bridgeError != nil)) {
            Button("OK") { web.bridgeError = nil }
        } message: {
            Text(web.bridgeError ?? "")
        }
    }
}

private struct PicoWebView: UIViewRepresentable {
    let webView: WKWebView

    func makeUIView(context: Context) -> WKWebView { webView }
    func updateUIView(_ webView: WKWebView, context: Context) {}
}

/// Only for the dev server (PICO_DEV_SERVER) not running: the bundled web app always loads.
private struct LoadFailedView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 34, weight: .semibold))
                .foregroundStyle(Theme.secondaryText)
            Text("Couldn't open Pico")
                .font(.system(size: 22, weight: .heavy, design: .rounded))
                .foregroundStyle(Theme.text)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Theme.secondaryText)
                .multilineTextAlignment(.center)
            Button("Try again", action: retry)
                .buttonStyle(.borderedProminent)
                .tint(Theme.indigo)
                .padding(.top, 6)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.background.ignoresSafeArea())
    }
}
