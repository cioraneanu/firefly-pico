import Foundation

/// The backend URL, token and extra headers come from the web app's Setup page (see `PicoWeb`).
/// The default language and pause trimming are set in the recorder's own settings.
enum PicoSettings {
    static let serverURLKey = "serverURL"
    static let headersKey = "headers"
    static let languageKey = "language"
    static let trimSilenceKey = "trimSilence"
    private static let tokenAccount = "fireflyToken"

    static var serverURL: URL? {
        normalizedURL(from: UserDefaults.standard.string(forKey: serverURLKey) ?? "")
    }

    /// The web app's `picoBackendHeaders`, e.g. for a proxy in front of Pico.
    static var headers: [String: String] {
        UserDefaults.standard.dictionary(forKey: headersKey) as? [String: String] ?? [:]
    }

    /// ISO-639-1 code, or nil to let the server use ASSISTANT_TRANSCRIPTION_LANGUAGE.
    static var language: String? {
        let value = (UserDefaults.standard.string(forKey: languageKey) ?? "").trimmingCharacters(in: .whitespaces)
        return value.isEmpty ? nil : value.lowercased()
    }

    /// Shorten long pauses before uploading. On unless turned off.
    static var trimSilence: Bool {
        UserDefaults.standard.object(forKey: trimSilenceKey) as? Bool ?? true
    }

    static var token: String? {
        Keychain.read(tokenAccount)
    }

    static var isConfigured: Bool {
        serverURL != nil && !(token ?? "").isEmpty
    }

    /// Called with the web app's values every time they change, signed out included.
    static func update(backendURL: String, token: String, headers: [[String: Any]]) {
        UserDefaults.standard.set(backendURL, forKey: serverURLKey)
        let pairs = headers.compactMap { header -> (String, String)? in
            guard let key = (header["key"] as? String)?.trimmingCharacters(in: .whitespaces), !key.isEmpty else { return nil }
            return (key, header["value"] as? String ?? "")
        }
        UserDefaults.standard.set(Dictionary(pairs, uniquingKeysWith: { $1 }), forKey: headersKey)
        if Keychain.read(tokenAccount) != token {
            Keychain.write(token, for: tokenAccount)
        }
    }

    /// Accepts "pico.example.com", "https://pico.example.com/" etc. Defaults to https.
    /// Only http(s): before Setup the web app's backend URL is its own pico://localhost origin.
    static func normalizedURL(from raw: String) -> URL? {
        var value = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { return nil }
        if !value.contains("://") {
            value = "https://" + value
        }
        while value.hasSuffix("/") {
            value.removeLast()
        }
        guard let url = URL(string: value), url.host() != nil, ["http", "https"].contains(url.scheme?.lowercased()) else { return nil }
        return url
    }
}
