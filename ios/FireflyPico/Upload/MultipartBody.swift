import Foundation

/// Writes the multipart body for POST /api/assistant/rambles to a file.
/// Background URLSessions only upload from files, not from in-memory data.
enum MultipartBody {
    /// Returns the Content-Type header value, including the boundary.
    static func write(audioAt audioURL: URL, language: String?, to bodyURL: URL) throws -> String {
        let boundary = "FireflyPico-\(UUID().uuidString)"
        var body = Data()

        if let language {
            body.append("--\(boundary)\r\n")
            body.append("Content-Disposition: form-data; name=\"language\"\r\n\r\n")
            body.append("\(language)\r\n")
        }

        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"voice\"; filename=\"\(audioURL.lastPathComponent)\"\r\n")
        body.append("Content-Type: audio/mp4\r\n\r\n")
        body.append(try Data(contentsOf: audioURL))
        body.append("\r\n--\(boundary)--\r\n")

        try FileManager.default.createDirectory(at: bodyURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try body.write(to: bodyURL, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        return "multipart/form-data; boundary=\(boundary)"
    }
}

private extension Data {
    mutating func append(_ string: String) {
        append(Data(string.utf8))
    }
}
