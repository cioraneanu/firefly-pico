import Foundation

enum PicoError: LocalizedError {
    case notConfigured
    case http(status: Int, message: String?)

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            "Sign in to Pico first: Settings → Setup."
        case .http(401, _):
            "Firefly rejected the token (401). Check it in Settings → Setup."
        case .http(413, _):
            "The recording is too large for the server (413)."
        case let .http(status, message?):
            "Pico returned \(status): \(message)"
        case let .http(status, nil):
            "Pico returned \(status)."
        }
    }

    /// Reads Laravel's `{"message": "..."}` error body, if there is one.
    static func from(status: Int, body: Data?) -> PicoError {
        let json = body.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }
        return .http(status: status, message: json?["message"] as? String)
    }
}

/// The Pico backend endpoints this app uses.
struct PicoAPI {
    let baseURL: URL
    let token: String
    let headers: [String: String]

    static func current() throws -> PicoAPI {
        guard let baseURL = PicoSettings.serverURL, let token = PicoSettings.token, !token.isEmpty else {
            throw PicoError.notConfigured
        }
        return PicoAPI(baseURL: baseURL, token: token, headers: PicoSettings.headers)
    }

    static var rambleUploadPath: String { "api/assistant/rambles" }

    func request(_ path: String, method: String = "GET") -> URLRequest {
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = method
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        // Without this Laravel answers validation errors with a redirect instead of JSON.
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        return request
    }
}
