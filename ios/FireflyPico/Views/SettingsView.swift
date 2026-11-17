import AVFoundation
import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    @AppStorage(PicoSettings.languageKey) private var language = ""
    @AppStorage(PicoSettings.trimSilenceKey) private var trimSilence = true
    @State private var microphone = AVAudioApplication.shared.recordPermission

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("e.g. ro, en", text: $language)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                } header: {
                    Text("Default language")
                } footer: {
                    Text("ISO-639-1 code sent with each recording. Leave empty to use the server's ASSISTANT_TRANSCRIPTION_LANGUAGE.")
                }

                Section {
                    Toggle("Shorten pauses", isOn: $trimSilence)
                } header: {
                    Text("Recording")
                } footer: {
                    Text("Cuts pauses longer than a second down to half a second before sending, so transcription costs less. Recordings with no speech are discarded.")
                }

                Section("Permissions") {
                    microphoneRow
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                Button("Done") { dismiss() }
            }
        }
    }

    @ViewBuilder
    private var microphoneRow: some View {
        switch microphone {
        case .granted:
            Label("Microphone allowed", systemImage: "mic.fill")
        case .denied:
            Button {
                openURL(URL(string: UIApplication.openSettingsURLString)!)
            } label: {
                Label("Microphone denied. Open iOS Settings", systemImage: "mic.slash")
            }
        default:
            Button {
                Task {
                    await AVAudioApplication.requestRecordPermission()
                    microphone = AVAudioApplication.shared.recordPermission
                }
            } label: {
                Label("Allow microphone", systemImage: "mic")
            }
        }
    }
}
