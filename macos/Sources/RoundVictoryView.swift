import SwiftUI

/// Uses the authoritative winner lists and captured ships; does not infer combat from log prose.
struct RoundVictoryView: View {
    @EnvironmentObject var game: GameModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false
    let view: GameView
    let reviewTable: () -> Void
    private let gold = Color(red: 0.95, green: 0.78, blue: 0.43)
    private var state: GameState { view.gameState }
    private var winners: [Player] { state.players.filter { state.winnerIds.contains($0.id) } }
    private var names: String { winners.map(\.name).joined(separator: " & ") }
    private var campaignContinues: Bool { state.options.matchMode == "campaign" && state.matchWinnerIds.isEmpty }
    private var canStartRound: Bool { !game.isOnline || game.onlineSnapshot?.isHost == true }
    private var heading: String {
        if winners.isEmpty { return "ROUND COMPLETE" }
        if winners.count > 1 { return "SHARED VICTORY" }
        return state.winnerIds.contains(view.humanPlayerId) ? "VICTORY AT SEA" : "ROUND VICTOR"
    }
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.black.opacity(0.78).ignoresSafeArea().onTapGesture {}
                ScrollView {
                    VStack(spacing: 22) {
                        hero
                        HStack(spacing: 24) {
                            Label("Round \(state.roundNumber)", systemImage: "flag.fill")
                            Label("Turn \(state.turnNumber)", systemImage: "clock")
                            Label("\(state.playDeckCount) cards remaining", systemImage: "rectangle.stack")
                        }.font(.callout).foregroundStyle(.white.opacity(0.8))
                        stats
                        if let campaign = state.campaign {
                            VStack(spacing: 8) {
                                Text("CAMPAIGN · FIRST TO \(campaign.targetScore) POINTS").font(.caption.weight(.bold)).tracking(2).foregroundStyle(gold)
                                HStack(spacing: 24) {
                                    ForEach(state.players) { player in
                                        VStack(spacing: 4) {
                                            Text(player.name).font(.callout).lineLimit(1)
                                            Text("\(campaign.totalScores[player.id, default: 0])").font(.title2.bold()).monospacedDigit()
                                        }.frame(maxWidth: .infinity)
                                    }
                                }
                                if !state.matchWinnerIds.isEmpty {
                                    Text("Campaign won by \(state.players.filter { state.matchWinnerIds.contains($0.id) }.map(\.name).joined(separator: " & "))")
                                        .font(.headline).foregroundStyle(gold)
                                }
                            }.padding(16).background(.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 12))
                        }
                        if let error = game.error { Text(error).foregroundStyle(.orange) }
                        actions
                    }.padding(30)
                        .frame(maxWidth: 920)
                        .background(LinearGradient(colors: [Color(red: 0.07, green: 0.16, blue: 0.22), Color(red: 0.025, green: 0.055, blue: 0.08)], startPoint: .topLeading, endPoint: .bottomTrailing), in: RoundedRectangle(cornerRadius: 24))
                        .overlay(RoundedRectangle(cornerRadius: 24).stroke(gold.opacity(0.8), lineWidth: 2))
                        .shadow(color: gold.opacity(0.15), radius: 35)
                        .scaleEffect(appeared || reduceMotion ? 1 : 0.94)
                        .opacity(appeared ? 1 : 0)
                        .padding(28)
                        .frame(maxWidth: .infinity, minHeight: geometry.size.height)
                }
            }.onAppear { withAnimation(reduceMotion ? nil : .easeOut(duration: 0.5)) { appeared = true } }
        }
    }
    private var hero: some View {
        VStack(spacing: 12) {
            HStack(spacing: 18) {
                Image(systemName: "laurel.leading")
                Image(systemName: "trophy.fill").font(.system(size: 48))
                Image(systemName: "laurel.trailing")
            }.font(.system(size: 64)).foregroundStyle(gold)
            Text(heading).font(.system(size: 15, weight: .bold)).tracking(5).foregroundStyle(gold)
            Text(names.isEmpty ? "Battle concluded" : names).font(.system(size: 42, weight: .bold, design: .serif))
                .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            Text(winners.count > 1 ? "Share the honours for round \(state.roundNumber)" : winners.isEmpty ? "Review the final battle standings" : "Victorious in round \(state.roundNumber)")
                .font(.title3).foregroundStyle(.white.opacity(0.8))
            if view.human.eliminated { Text("Your fleet has been eliminated.").font(.callout).foregroundStyle(.orange) }
        }.frame(maxWidth: .infinity)
    }
    private var stats: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("BATTLE REPORT").font(.caption.bold()).tracking(3).foregroundStyle(gold)
            Grid(alignment: .leading, horizontalSpacing: 24, verticalSpacing: 12) {
                GridRow {
                    Text("Commander").frame(maxWidth: .infinity, alignment: .leading)
                    Text("Captured")
                    Text("Capture HP")
                    Text("Ships lost")
                    Text("Afloat")
                }.font(.caption.bold()).foregroundStyle(.white.opacity(0.65))
                ForEach(state.players) { player in
                    GridRow {
                        HStack(spacing: 7) {
                            Image(systemName: state.winnerIds.contains(player.id) ? "crown.fill" : "person.fill")
                                .foregroundStyle(state.winnerIds.contains(player.id) ? gold : .white.opacity(0.4))
                            Text(player.name + (player.id == view.humanPlayerId ? " (You)" : "")).fontWeight(.semibold)
                        }
                        Text("\(player.victoryPile.count)")
                        Text("\(player.victoryPile.reduce(0) { $0 + $1.hitNumber })")
                        Text("\(player.ships.filter(\.sunk).count)")
                        Text("\(player.afloat)")
                    }.font(.system(size: 16)).monospacedDigit()
                }
            }
            Text("Capture HP is the total hit-point value of ships in each commander's victory pile.")
                .font(.caption).foregroundStyle(.white.opacity(0.6))
        }.padding(20).background(.black.opacity(0.25), in: RoundedRectangle(cornerRadius: 12))
    }
    private var actions: some View {
        VStack(spacing: 12) {
            if campaignContinues && !canStartRound {
                Text("Waiting for the host to start the next round.").foregroundStyle(.secondary)
            }
            HStack(spacing: 16) {
                Button("Review table", action: reviewTable)
                if game.isOnline && !game.onlineConnected { Button("Reconnect") { game.reconnectOnline() }.disabled(game.busy) }
                Button("Return to menu") { game.returnToMenu() }.disabled(game.busy)
                if campaignContinues && canStartRound {
                    Button { game.run(["type": "next_round"]) } label: {
                        Text("Next round").font(.headline).foregroundStyle(.black)
                            .padding(.horizontal, 22).padding(.vertical, 10)
                            .background(gold, in: RoundedRectangle(cornerRadius: 9))
                    }.buttonStyle(.plain)
                        .opacity(game.busy || (game.isOnline && !game.onlineConnected) ? 0.45 : 1)
                        .disabled(game.busy || (game.isOnline && !game.onlineConnected))
                }
            }.controlSize(.large)
        }
    }
}
