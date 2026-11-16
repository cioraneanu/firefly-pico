import SwiftUI

/// Every ramble grouped by day, with where its upload stands.
struct HistoryView: View {
    @EnvironmentObject private var history: RecordingHistory
    @EnvironmentObject private var store: RecordingStore
    let isConfigured: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
                .padding(.horizontal, 20)

            List {
                if !isConfigured {
                    Section {
                        Label("Sign in to Pico", systemImage: "exclamationmark.circle")
                            .font(.subheadline.weight(.semibold))
                            .listRowBackground(Theme.style(for: .waiting).background)
                            .foregroundStyle(Theme.style(for: .waiting).foreground)
                    } footer: {
                        Text("Recordings are kept on the phone until you enter the backend URL and token in Pico’s Settings → Setup.")
                    }
                }

                if history.entries.isEmpty {
                    Section {
                        EmptyHistory()
                            .listRowBackground(Color.clear)
                    }
                }

                ForEach(days, id: \.date) { day in
                    Section {
                        ForEach(day.entries) { entry in
                            HistoryRow(entry: entry, progress: history.progress[entry.id])
                                .listRowBackground(Theme.card)
                                .listRowSeparatorTint(Theme.divider)
                                .swipeActions {
                                    Button("Delete", systemImage: "trash", role: .destructive) {
                                        delete(entry)
                                    }
                                }
                        }
                    } header: {
                        Text(dayTitle(day.date))
                            .font(.caption.weight(.heavy))
                            .tracking(0.8)
                            .foregroundStyle(Theme.secondaryText)
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .listSectionSpacing(14)
            .contentMargins(.top, 0, for: .scrollContent)
        }
        .padding(.top, 18)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text("History")
                    .font(.system(size: 22, weight: .heavy, design: .rounded))
                    .foregroundStyle(Theme.text)
                Spacer()
                if count(.waiting) + count(.failed) > 0 {
                    Button("Retry all") {
                        UploadService.shared.flush()
                    }
                    .font(.subheadline.weight(.bold))
                    .tint(Theme.accent)
                }
            }
            let chips = [HistoryEntry.Status.waiting, .failed, .sending].filter { count($0) > 0 }
            if !chips.isEmpty {
                HStack(spacing: 8) {
                    ForEach(chips, id: \.self) { status in
                        let style = Theme.style(for: status)
                        Text("\(count(status)) \(style.label.lowercased())")
                            .font(.footnote.weight(.bold))
                            .foregroundStyle(style.foreground)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(style.background, in: RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
        }
    }

    private var days: [(date: Date, entries: [HistoryEntry])] {
        let calendar = Calendar.current
        let grouped = Dictionary(grouping: history.entries) { calendar.startOfDay(for: $0.createdAt) }
        return grouped
            .map { (date: $0.key, entries: $0.value.sorted { $0.createdAt > $1.createdAt }) }
            .sorted { $0.date > $1.date }
    }

    private func count(_ status: HistoryEntry.Status) -> Int {
        history.entries.count { $0.status == status }
    }

    private func dayTitle(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Today" }
        if calendar.isDateInYesterday(date) { return "Yesterday" }
        return date.formatted(.dateTime.weekday(.abbreviated).day().month(.abbreviated))
    }

    /// Deleting an unsent ramble also throws its audio away.
    private func delete(_ entry: HistoryEntry) {
        store.remove(entry.id)
        history.remove(entry.id)
        Notifier.clear(recordingID: entry.id)
    }
}

private struct HistoryRow: View {
    let entry: HistoryEntry
    let progress: Double?

    var body: some View {
        let style = Theme.style(for: entry.status)
        HStack(spacing: 12) {
            Image(systemName: style.symbol)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(style.foreground)
                .frame(width: 38, height: 38)
                .background(style.background, in: RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 3) {
                (Text(entry.createdAt, format: .dateTime.hour().minute())
                    + Text(subtitle).fontWeight(.medium).foregroundStyle(Theme.secondaryText))
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.text)
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(entry.status == .failed ? style.foreground : Theme.secondaryText)
                    .lineLimit(entry.status == .failed ? 2 : 1)
                if entry.status == .sending, let progress {
                    ProgressView(value: progress)
                        .tint(Theme.accent)
                        .padding(.top, 3)
                }
            }

            Spacer(minLength: 0)

            if entry.status == .failed {
                Button("Retry") {
                    UploadService.shared.flush()
                }
                .buttonStyle(.bordered)
                .buttonBorderShape(.capsule)
                .controlSize(.small)
                .font(.footnote.weight(.bold))
                .tint(Theme.accent)
            } else {
                Text(style.label)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(style.foreground)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(style.background, in: RoundedRectangle(cornerRadius: 10))
            }
        }
        .padding(.vertical, 3)
        .accessibilityElement(children: .combine)
    }

    private var subtitle: String {
        var parts = [formatDuration(entry.duration)]
        if let language = entry.language {
            parts.append(language.uppercased())
        }
        return " · " + parts.joined(separator: " · ")
    }

    private var detail: String {
        switch entry.status {
        case .sending:
            progress.map { "Uploading · \(Int($0 * 100))%" } ?? "Sending…"
        case .waiting:
            "Offline · sends automatically"
        case .failed:
            entry.message ?? "Couldn't send"
        case .sent:
            entry.originalDuration.map { "Pauses trimmed from \(formatDuration($0))" } ?? "Sent to Pico"
        case .discarded:
            entry.message ?? "No speech detected"
        }
    }
}

private struct EmptyHistory: View {
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "waveform")
                .font(.system(size: 28, weight: .semibold))
                .foregroundStyle(Theme.accent)
            Text("No rambles yet")
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.text)
            Text("Add the **Record Ramble** control to the Action Button (Settings → Action Button → Controls), Control Center or the lock screen. Press it to start, press it again or tap Stop in the Dynamic Island to send.")
                .font(.footnote)
                .foregroundStyle(Theme.secondaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
    }
}

private func formatDuration(_ seconds: TimeInterval) -> String {
    Duration.seconds(seconds).formatted(.time(pattern: .minuteSecond))
}
