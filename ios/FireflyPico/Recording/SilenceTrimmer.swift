import AVFoundation

/// Shortens long pauses in a finished recording before it is uploaded, because transcription is billed per minute of audio.
///
/// Pauses are shortened rather than removed, so the transcriber still hears where sentences end.
/// Speech is found by loudness relative to the recording's own background noise, which adapts to
/// quiet rooms and noisy streets alike.
enum SilenceTrimmer {
    /// Pauses longer than this are shortened to `keptPause`.
    static let maxPause: TimeInterval = 1.0
    /// What is left of a long pause: half before the cut, half after, so speech keeps its edges.
    static let keptPause: TimeInterval = 0.5
    /// Less savings than this isn't worth re-encoding the file.
    static let minimumSavings: TimeInterval = 2

    private static let frameDuration: TimeInterval = 0.02
    /// A frame counts as speech when it is this much louder than the background noise...
    private static let speechThreshold: Float = 10
    /// ...and stays speech until it drops below this, so soft word endings aren't cut.
    private static let releaseThreshold: Float = 6
    /// Short fades at each cut avoid clicks.
    private static let fadeDuration: TimeInterval = 0.01
    private static let chunkFrames: AVAudioFrameCount = 32_768

    enum Outcome: Equatable {
        /// No speech was found; the file is left as it is.
        case silent
        /// The file is unchanged because there was little to trim.
        case unchanged(duration: TimeInterval)
        /// The file was rewritten without the long pauses.
        case trimmed(from: TimeInterval, to: TimeInterval)
    }

    /// Rewrites the file at `url` in place, encoding with `settings`. Slow for long recordings; call off the main thread.
    static func trim(fileAt url: URL, settings: [String: Any]) throws -> Outcome {
        let source = try AVAudioFile(forReading: url)
        let format = source.processingFormat
        let sampleRate = format.sampleRate
        let totalFrames = AVAudioFramePosition(source.length)
        let originalDuration = Double(totalFrames) / sampleRate

        let levels = try loudness(of: source, samplesPerFrame: max(1, Int(sampleRate * frameDuration)))
        let speech = detectSpeech(levels)
        guard speech.contains(true) else { return .silent }

        let samplesPerFrame = AVAudioFramePosition(max(1, Int(sampleRate * frameDuration)))
        let cuts = cutRanges(speech: speech).map {
            (AVAudioFramePosition($0.lowerBound) * samplesPerFrame)..<min(AVAudioFramePosition($0.upperBound) * samplesPerFrame, totalFrames)
        }
        let removed = cuts.reduce(0) { $0 + $1.count }
        guard Double(removed) / sampleRate >= minimumSavings else { return .unchanged(duration: originalDuration) }

        let kept = complement(of: cuts, in: 0..<totalFrames)
        let trimmedURL = url.deletingPathExtension().appendingPathExtension("trimmed.m4a")
        try? FileManager.default.removeItem(at: trimmedURL)
        do {
            try write(kept, from: source, to: trimmedURL, settings: settings)
            _ = try FileManager.default.replaceItemAt(url, withItemAt: trimmedURL)
        } catch {
            try? FileManager.default.removeItem(at: trimmedURL)
            throw error
        }
        return .trimmed(from: originalDuration, to: Double(totalFrames - AVAudioFramePosition(removed)) / sampleRate)
    }

    /// Loudness of each short frame in dBFS, from the first channel.
    private static func loudness(of file: AVAudioFile, samplesPerFrame: Int) throws -> [Float] {
        guard let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat, frameCapacity: chunkFrames) else { return [] }
        var levels: [Float] = []
        levels.reserveCapacity(Int(file.length) / samplesPerFrame + 1)
        var sumOfSquares: Float = 0
        var count = 0

        file.framePosition = 0
        while file.framePosition < file.length {
            try file.read(into: buffer)
            guard buffer.frameLength > 0, let samples = buffer.floatChannelData?[0] else { break }
            for index in 0..<Int(buffer.frameLength) {
                sumOfSquares += samples[index] * samples[index]
                count += 1
                if count == samplesPerFrame {
                    levels.append(decibels(sumOfSquares / Float(count)))
                    sumOfSquares = 0
                    count = 0
                }
            }
        }
        if count > 0 {
            levels.append(decibels(sumOfSquares / Float(count)))
        }
        return levels
    }

    private static func decibels(_ meanSquare: Float) -> Float {
        10 * log10(max(meanSquare, 1e-10))
    }

    /// Marks each frame as speech or not, measured against the background noise.
    private static func detectSpeech(_ levels: [Float]) -> [Bool] {
        guard !levels.isEmpty else { return [] }
        // The quietest tenth of a ramble is almost always pauses, so it gives the noise level.
        let noiseFloor = levels.sorted()[levels.count / 10]
        var isSpeech = false
        return levels.map { level in
            isSpeech = level >= noiseFloor + (isSpeech ? releaseThreshold : speechThreshold)
            return isSpeech
        }
    }

    /// Frame ranges to remove: the middle of every pause longer than `maxPause`, and all but
    /// half a kept pause at the very start and end.
    private static func cutRanges(speech: [Bool]) -> [Range<Int>] {
        let maxPauseFrames = Int(maxPause / frameDuration)
        let edgeFrames = Int(keptPause / 2 / frameDuration)
        var cuts: [Range<Int>] = []
        var index = 0
        while index < speech.count {
            guard !speech[index] else {
                index += 1
                continue
            }
            let start = index
            while index < speech.count, !speech[index] {
                index += 1
            }
            let isLeading = start == 0
            let isTrailing = index == speech.count
            let cutStart = isLeading ? 0 : start + edgeFrames
            let cutEnd = isTrailing ? speech.count : index - edgeFrames
            if isLeading || isTrailing || index - start > maxPauseFrames, cutStart < cutEnd {
                cuts.append(cutStart..<cutEnd)
            }
        }
        return cuts
    }

    private static func complement(of cuts: [Range<AVAudioFramePosition>], in whole: Range<AVAudioFramePosition>) -> [Range<AVAudioFramePosition>] {
        var kept: [Range<AVAudioFramePosition>] = []
        var position = whole.lowerBound
        for cut in cuts {
            if cut.lowerBound > position {
                kept.append(position..<cut.lowerBound)
            }
            position = max(position, cut.upperBound)
        }
        if position < whole.upperBound {
            kept.append(position..<whole.upperBound)
        }
        return kept
    }

    private static func write(_ ranges: [Range<AVAudioFramePosition>], from source: AVAudioFile, to url: URL, settings: [String: Any]) throws {
        let format = source.processingFormat
        let output = try AVAudioFile(forWriting: url, settings: settings, commonFormat: format.commonFormat, interleaved: format.isInterleaved)
        defer { output.close() }
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: chunkFrames) else { return }
        let fadeFrames = Int(format.sampleRate * fadeDuration)

        for range in ranges {
            source.framePosition = range.lowerBound
            var remaining = range.count
            var isFirstChunk = true
            while remaining > 0 {
                try source.read(into: buffer, frameCount: AVAudioFrameCount(min(remaining, Int(chunkFrames))))
                guard buffer.frameLength > 0 else { break }
                remaining -= Int(buffer.frameLength)
                fade(buffer, fadeIn: isFirstChunk && range.lowerBound > 0, fadeOut: remaining <= 0 && range.upperBound < source.length, frames: fadeFrames)
                try output.write(from: buffer)
                isFirstChunk = false
            }
        }
    }

    private static func fade(_ buffer: AVAudioPCMBuffer, fadeIn: Bool, fadeOut: Bool, frames: Int) {
        guard let channels = buffer.floatChannelData else { return }
        let length = Int(buffer.frameLength)
        let frames = min(frames, length / 2)
        guard frames > 0 else { return }
        for channel in 0..<Int(buffer.format.channelCount) {
            let samples = channels[channel]
            for index in 0..<frames {
                let gain = Float(index) / Float(frames)
                if fadeIn { samples[index] *= gain }
                if fadeOut { samples[length - 1 - index] *= gain }
            }
        }
    }
}
