import Combine
import UIKit
import UniformTypeIdentifiers
import WebKit
import os

private let log = Logger(subsystem: "FireflyPico", category: "web")

/// The Firefly Pico web app (../front), bundled with the app and served from `pico://localhost`.
/// In Debug builds with `PICO_DEV_SERVER` set (Config/Local.xcconfig) it loads `npm run dev` instead, with hot reload.
///
/// The web app is the only place to sign in. It talks to the app through `window.webkit.messageHandlers.pico`
/// (see front/core/composables/useNativeApp.js):
/// - `session` { picoBackendURL, authToken, picoBackendHeaders }: whenever they change, so recordings upload on their own.
/// - `ready`: the page asks for the recording state.
/// - `toggleRecording`, `openRecorder`.
/// The app answers with a `pico-native` event on `window`: { type: 'recording', state: 'idle' | 'recording' | 'saved', startedAt }.
@MainActor
final class PicoWeb: NSObject, ObservableObject {
    static let shared = PicoWeb()

    enum LoadState: Equatable {
        case loading
        case loaded
        case failed(String)
    }

    @Published private(set) var state = LoadState.loading
    /// Set when the web app calls `openRecorder`.
    @Published var showRecorder = false
    @Published var bridgeError: String?

    let webView: WKWebView
    private let startURL: URL
    private var cancellables = Set<AnyCancellable>()

    override private init() {
        // Debug builds only: a release build always runs the web app it shipped with (App Review guideline 2.5.2).
        #if DEBUG
        let devServer = (Bundle.main.object(forInfoDictionaryKey: "PicoDevServer") as? String ?? "").trimmingCharacters(in: .whitespaces)
        #else
        let devServer = ""
        #endif
        startURL = devServer.isEmpty ? URL(string: "\(BundledWebApp.scheme)://localhost/")! : URL(string: "http://\(devServer)/")!

        let configuration = WKWebViewConfiguration()
        configuration.setURLSchemeHandler(BundledWebApp(), forURLScheme: BundledWebApp.scheme)
        configuration.allowsInlineMediaPlayback = true
        // Keeps "Mobile" in the user agent, as Safari has it, and adds the app's name.
        configuration.applicationNameForUserAgent = "Mobile/15E148 FireflyPico"
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()

        configuration.userContentController.add(self, name: "pico")
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = UIColor(Theme.background)
        // The web app pads itself with env(safe-area-inset-*), like the installed PWA.
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        #if DEBUG
        webView.isInspectable = true
        #endif

        RecordingController.shared.$current
            .map { $0?.startedAt }
            .removeDuplicates()
            .sink { [weak self] in self?.sendRecording(state: $0 == nil ? "idle" : "recording", startedAt: $0) }
            .store(in: &cancellables)
        RecordingController.shared.saved
            .sink { [weak self] in self?.sendRecording(state: "saved", startedAt: nil) }
            .store(in: &cancellables)

        reload()
    }

    func reload() {
        state = .loading
        webView.load(URLRequest(url: startURL))
    }

    private func sendRecording(state: String, startedAt: Date?) {
        let detail: [String: Any] = ["type": "recording", "state": state, "startedAt": startedAt.map { $0.timeIntervalSince1970 * 1000 } ?? NSNull()]
        let json = String(decoding: try! JSONSerialization.data(withJSONObject: detail), as: UTF8.self)
        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('pico-native', { detail: \(json) }))")
    }

    // MARK: - Origins

    /// Like `location.origin`: lowercased, without the scheme's default port.
    private static func origin(scheme: String, host: String, port: Int) -> String {
        let scheme = scheme.lowercased()
        let defaultPort = scheme == "https" ? 443 : scheme == "http" ? 80 : 0
        let suffix = port == 0 || port == defaultPort ? "" : ":\(port)"
        return "\(scheme)://\(host.lowercased())\(suffix)"
    }

    private static func origin(of url: URL) -> String {
        origin(scheme: url.scheme ?? "", host: url.host(percentEncoded: false) ?? "", port: url.port ?? 0)
    }

    private func isApp(_ url: URL) -> Bool {
        // Attachment previews and downloads use blob: and data: URLs the page made itself.
        if ["blob", "data", "about"].contains(url.scheme) { return true }
        return Self.origin(of: url) == Self.origin(of: startURL)
    }

    private func isApp(_ origin: WKSecurityOrigin) -> Bool {
        Self.origin(scheme: origin.protocol, host: origin.host, port: origin.port) == Self.origin(of: startURL)
    }
}

// MARK: - Navigation

extension PicoWeb: WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction) async -> WKNavigationActionPolicy {
        guard let url = action.request.url else { return .cancel }
        // Links away from the app (Firefly III, mailto:, tel: and the like) open outside it.
        if action.targetFrame?.isMainFrame ?? true, !isApp(url) {
            await UIApplication.shared.open(url)
            return .cancel
        }
        return .allow
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        state = .loaded
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: any Error) {
        failed(error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: any Error) {
        failed(error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        log.error("web content process terminated, reloading")
        webView.reload()
    }

    private func failed(_ error: any Error) {
        let error = error as NSError
        // A newer load replaced this one, or the link opened outside the app.
        if error.domain == NSURLErrorDomain, error.code == NSURLErrorCancelled { return }
        if error.domain == WKError.errorDomain, error.code == 102 { return }
        log.error("load failed: \(error, privacy: .public)")
        state = .failed(error.localizedDescription)
    }
}

extension PicoWeb: WKUIDelegate {
    /// Links that open a new window: app pages stay in the app, anything else goes to Safari.
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url {
            if isApp(url) {
                webView.load(action.request)
            } else {
                UIApplication.shared.open(url)
            }
        }
        return nil
    }

    /// The web app's dictation uses the microphone. iOS already asked for it on behalf of the app.
    func webView(_ webView: WKWebView, decideMediaCapturePermissionsFor origin: WKSecurityOrigin, initiatedBy frame: WKFrameInfo, type: WKMediaCaptureType) async -> WKPermissionDecision {
        isApp(origin) ? .grant : .prompt
    }
}

// MARK: - Bridge

extension PicoWeb: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, isApp(message.frameInfo.securityOrigin),
              let body = message.body as? [String: Any], let action = body["action"] as? String else { return }
        switch action {
        case "session":
            PicoSettings.update(
                backendURL: body["picoBackendURL"] as? String ?? "",
                token: body["authToken"] as? String ?? "",
                headers: body["picoBackendHeaders"] as? [[String: Any]] ?? []
            )
            UploadService.shared.flush()
        case "ready":
            let current = RecordingController.shared.current
            sendRecording(state: current == nil ? "idle" : "recording", startedAt: current?.startedAt)
        case "openRecorder":
            showRecorder = true
        case "toggleRecording":
            Task {
                do {
                    try await RecordingController.shared.toggleFromForeground()
                } catch {
                    bridgeError = error.localizedDescription
                }
            }
        default:
            log.error("unknown bridge action \(action, privacy: .public)")
        }
    }
}

// MARK: - Bundled web app

/// Serves the built web app (WebApp/, from scripts/build-web.sh) at `pico://localhost/…`.
/// Unknown paths get index.html, so the web app's own router handles them.
private final class BundledWebApp: NSObject, WKURLSchemeHandler {
    static let scheme = "pico"
    // Standardized like the requested files below: on a device that drops the bundle path's /private prefix.
    private let root = Bundle.main.resourceURL!.appending(path: "WebApp", directoryHint: .isDirectory).standardizedFileURL

    func webView(_ webView: WKWebView, start task: any WKURLSchemeTask) {
        let path = task.request.url?.path(percentEncoded: false) ?? "/"
        var file = root.appending(path: path).standardizedFileURL
        var isDirectory: ObjCBool = false
        // Prerendered routes (e.g. /settings/setup) exist as folders: those get index.html too.
        if !file.path.hasPrefix(root.path) || !FileManager.default.fileExists(atPath: file.path, isDirectory: &isDirectory) || isDirectory.boolValue {
            if path.contains(".") { log.error("not in WebApp/: \(path, privacy: .public)") }
            file = root.appending(path: "index.html")
        }
        guard let data = try? Data(contentsOf: file) else {
            task.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        task.didReceive(HTTPURLResponse(url: task.request.url!, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: [
            "Content-Type": mime,
            "Cache-Control": "no-cache",
        ])!)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: any WKURLSchemeTask) {}
}
