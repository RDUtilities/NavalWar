import SwiftUI

struct CombatEffect: Identifiable {
    let id = UUID()
    let started = Date()
    let sinking: Bool
    let salvo: PlayCard?
}

/// Presentation follows confirmed state changes, including bot turns and online updates.
struct CombatShipArt: View {
    let ship: Ship
    let effect: CombatEffect?
    let width: Double
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        if let effect {
            TimelineView(.animation(minimumInterval: 1.0 / 30)) { timeline in
                let elapsed = max(0, timeline.date.timeIntervalSince(effect.started))
                artwork(elapsed: elapsed, effect: effect)
            }
        } else { artwork(elapsed: 2, effect: nil) }
    }

    private func artwork(elapsed: Double, effect: CombatEffect?) -> some View {
        let sinking = effect?.sinking == true && elapsed < 1.65 && !reduceMotion
        let sink = sinking ? min(1, max(0, (elapsed - 0.4) / 1.2)) : 0
        let shake = effect != nil && elapsed < 0.55 && !reduceMotion ? sin(elapsed * 65) * 5 * (1 - elapsed / 0.55) : 0
        return ZStack(alignment: .bottomTrailing) {
            CardArt(key: ship.sunk && !sinking ? "shipBack" : ship.card.id)
                .opacity(ship.sunk && !sinking ? 0.38 : 1 - sink * 0.9)
                .rotationEffect(.degrees(sink * 17))
                .offset(x: shake, y: sink * width * 0.35)
            if !ship.sunk && !ship.attachments.isEmpty {
                HStack(spacing: -34) {
                    ForEach(ship.attachments.suffix(3), id: \.card.id) { attachment in
                        CardArt(key: Artwork.shared.key(attachment.card))
                            .frame(width: width * 0.44, height: width * 0.44 / 1.5)
                            .overlay(RoundedRectangle(cornerRadius: 5).stroke(.orange, lineWidth: 1.5))
                            .shadow(color: .black.opacity(0.7), radius: 3, y: 2)
                    }
                }.padding(5)
                .accessibilityLabel("\(ship.attachments.count) attached damage cards. Inspect ship to read them.")
            }
            if ship.sunk && !sinking {
                Text("SUNK").font(.title3.bold()).tracking(3).frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            if let effect, elapsed < 1.65 {
                if let card = effect.salvo, elapsed < 0.35 && !reduceMotion {
                    let progress = min(1, elapsed / 0.35)
                    CardArt(key: Artwork.shared.key(card))
                        .frame(width: width * 0.44, height: width * 0.44 / 1.5)
                        .offset(x: -width * 0.55 * (1 - progress), y: width * 0.3 * (1 - progress))
                }
                Canvas { context, size in
                    let progress = min(1, max(0, (elapsed - 0.12) / 1.25))
                    let center = CGPoint(x: size.width * 0.5, y: size.height * 0.48)
                    if reduceMotion {
                        context.opacity = max(0, 0.4 * (1 - elapsed / 1.65))
                        context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(.orange))
                    } else {
                        // Expanding fireball, sparks and a fading smoke ring at the struck ship.
                        let radius = CGFloat(12 + progress * 52)
                        context.opacity = max(0, 1 - progress)
                        context.fill(Path(ellipseIn: CGRect(x: center.x-radius, y: center.y-radius, width: radius*2, height: radius*2)), with: .radialGradient(Gradient(colors: [.white, .yellow, .orange, .red.opacity(0)]), center: center, startRadius: 0, endRadius: radius))
                        for index in 0..<18 {
                            let angle = Double(index) * .pi * 2 / 18
                            let distance = 12 + progress * (index.isMultiple(of: 2) ? 90 : 65)
                            let point = CGPoint(x: center.x + cos(angle) * distance, y: center.y + sin(angle) * distance)
                            context.fill(Path(ellipseIn: CGRect(x: point.x, y: point.y, width: 5 * (1-progress) + 1, height: 5 * (1-progress) + 1)), with: .color(index.isMultiple(of: 3) ? .white : .orange))
                        }
                        context.stroke(Path(ellipseIn: CGRect(x: center.x-radius*1.2, y: center.y-radius*0.7, width: radius*2.4, height: radius*1.4)), with: .color(.gray.opacity(0.5)), lineWidth: 8 * (1-progress))
                    }
                }.allowsHitTesting(false)
                Text(effect.sinking ? "SHIP SUNK" : "HIT")
                    .font(.headline.bold()).foregroundStyle(.white)
                    .padding(6).background(.black.opacity(0.75), in: Capsule())
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    .opacity(min(1, max(0, (1.65 - elapsed) * 3)))
            }
        }
        .frame(width: width, height: width / 1.5)
        .clipped()
    }
}
