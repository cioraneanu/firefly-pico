import AVFoundation

/// Wraps AVAudioRecorder and the audio session. Keeps recording in the background
/// (UIBackgroundModes: audio) and resumes after interruptions such as phone calls.
@MainActor
final class AudioRecorder: NSObject {
    /// Called when recording ends without stop() being called, e.g. at the maximum duration.
    var onUnexpectedFinish: (() -> Void)?

    private var recorder: AVAudioRecorder?
    private var interruptionObserver: NSObjectProtocol?

    /// Small AAC files: voice only needs mono, and 30 minutes stay far below the server's 25 MB limit.
    /// SilenceTrimmer re-encodes with the same settings.
    nonisolated static var settings: [String: Any] {
        [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: 22_050,
            AVNumberOfChannelsKey: 1,
            AVEncoderBitRateKey: 32_000,
            AVEncoderAudioQualityKey: AVAudioQuality.medium.rawValue,
        ]
    }

    func start(writingTo url: URL, maxDuration: TimeInterval) throws {
        let session = AVAudioSession.sharedInstance()
        // Mixing lets the bank app (or anything else) keep its audio, and lets us start from the background.
        try session.setCategory(.playAndRecord, mode: .default, options: [.mixWithOthers, .defaultToSpeaker])
        try session.setActive(true)

        let recorder = try AVAudioRecorder(url: url, settings: Self.settings)
        recorder.delegate = self
        recorder.isMeteringEnabled = true
        guard recorder.record(forDuration: maxDuration) else {
            try? session.setActive(false)
            throw RecordingError.couldNotStart
        }
        self.recorder = recorder
        observeInterruptions()
    }

    /// Stops and returns the recorded duration.
    @discardableResult
    func stop() -> TimeInterval {
        guard let recorder else { return 0 }
        let duration = recorder.currentTime
        self.recorder = nil
        recorder.stop()
        if let interruptionObserver {
            NotificationCenter.default.removeObserver(interruptionObserver)
        }
        interruptionObserver = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        return duration
    }

    /// Current loudness from 0 (silence) to 1, for the live waveform.
    func level() -> Float {
        guard let recorder, recorder.isRecording else { return 0 }
        recorder.updateMeters()
        // -50 dBFS and below reads as silence.
        return max(0, min(1, (recorder.averagePower(forChannel: 0) + 50) / 50))
    }

    private func observeInterruptions() {
        interruptionObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] notification in
            let rawType = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt
            guard rawType.flatMap(AVAudioSession.InterruptionType.init) == .ended else { return }
            MainActor.assumeIsolated {
                // The recorder pauses itself when the interruption begins; pick up where it left off.
                guard let recorder = self?.recorder, !recorder.isRecording else { return }
                try? AVAudioSession.sharedInstance().setActive(true)
                recorder.record()
            }
        }
    }
}

extension AudioRecorder: AVAudioRecorderDelegate {
    nonisolated func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        MainActor.assumeIsolated {
            // stop() clears `recorder` first, so a match here means the recorder ended on its own.
            guard recorder === self.recorder else { return }
            onUnexpectedFinish?()
        }
    }
}
