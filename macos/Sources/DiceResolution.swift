import SwiftUI

struct DiceResolution: Identifiable {
    let id = UUID()
    let face: Int?
    let title: String
    let detail: String
    let rule: String
    let outcome: String

    init?(event: GameEvent) {
        guard ["carrier_roll", "submarine_roll", "torpedo_boat_roll", "destroyer_squadron_roll"].contains(event.type),
              let range = event.detail.range(of: #"\brolled\s+[1-6]\b"#, options: .regularExpression),
              let number = Int(event.detail[range].split(separator: " ").last ?? "") else { return nil }
        let actual = event.dieRoll.flatMap { (1...6).contains($0) ? $0 : nil } ?? number
        detail = event.detail
        switch event.type {
        case "carrier_roll":
            face = actual; title = "Air strike"; rule = "A 1 sinks the target ship"
            outcome = actual == 1 ? "HIT · Ship sunk" : "MISS · Ship unharmed"
        case "submarine_roll":
            face = actual; title = "Submarine"; rule = "A 5 or 6 sinks the target ship"
            outcome = actual >= 5 ? "HIT · Ship sunk" : "MISS · Ship unharmed"
        case "torpedo_boat_roll":
            face = actual; title = "Torpedo boat"; rule = "A 6 sinks the target ship"
            outcome = actual == 6 ? "HIT · Ship sunk" : "MISS · Ship unharmed"
        default:
            // Older hosts report a capped sink count, not the raw die face. Do not invent a roll.
            face = event.dieRoll.flatMap { (1...6).contains($0) ? $0 : nil }
            title = "Destroyer Squadron"; rule = "Sink the rolled number, up to the fleet's afloat ships"
            outcome = "\(number) ship\(number == 1 ? "" : "s") sunk" + (face == nil ? " · Die face unavailable from this host" : "")
        }
    }
}

struct DiceRollPanel: View {
    let result: DiceResolution
    var rolling = false
    var compact = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        VStack(alignment: compact ? .leading : .center, spacing: 10) {
            Text(result.title.uppercased()).font(.headline).tracking(2)
            HStack(spacing: 16) {
                if rolling {
                    TimelineView(.animation(minimumInterval: 1.0 / 30)) { timeline in
                        Image(systemName: "dice.fill").font(.system(size: 56))
                            .rotationEffect(.degrees(reduceMotion ? 0 : timeline.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 0.65) / 0.65 * 360))
                    }.frame(width: 70, height: 70).accessibilityLabel("Rolling die")
                } else if let face = result.face {
                    Image(systemName: "die.face.\(face).fill").font(.system(size: compact ? 36 : 64)).accessibilityLabel("Die result \(face)")
                }
                Text(rolling ? "Rolling…" : result.face.map { "Rolled \($0)" } ?? "Attack resolved")
                    .font(compact ? .headline : .title.bold())
            }
            Text(result.rule).font(.callout).foregroundStyle(.secondary)
            if !rolling {
                Text(result.outcome).font(.headline).foregroundStyle(.yellow)
                Text(result.detail).font(.caption).foregroundStyle(.secondary)
            }
        }
        .multilineTextAlignment(compact ? .leading : .center)
        .padding(compact ? 12 : 24)
        .frame(maxWidth: .infinity)
        .background(Color(red: 0.025, green: 0.055, blue: 0.075), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(.yellow.opacity(0.5)))
    }
}
