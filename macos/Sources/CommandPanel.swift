import SwiftUI
private let gold = Color(red: 0.86, green: 0.70, blue: 0.40)
private let navy = Color(red: 0.035, green: 0.065, blue: 0.09)
struct CommandPanel: View {
    @EnvironmentObject var game: GameModel
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("COMMAND").font(.caption).tracking(3).foregroundStyle(gold)
                Text(game.instruction).font(.system(size: 20, weight: .medium, design: .serif)).fixedSize(horizontal: false, vertical: true)
                if let error = game.error { Text(error).foregroundStyle(.orange).font(.callout).textSelection(.enabled) }
                if game.busy { ProgressView().controlSize(.small) }
                if game.isOnline && !game.onlineConnected { Button("Reconnect to match") { game.reconnectOnline() }.disabled(game.busy) }
                if let view = game.view {
                    if view.gameState.phase == "round_complete" { results(view) }
                    else {
                        normalActions(view)
                        if let pending = view.gameState.pendingDestroyerAttack, pending.ownerId == view.humanPlayerId {
                            Text("\(game.destroyerTargets.count) of \(pending.shipsToSink) ships selected").font(.callout)
                            Button("Confirm targets") { game.confirmDestroyer() }.disabled(!game.canInteract || game.destroyerTargets.count != pending.shipsToSink)
                        }
                        ForEach(game.actions) { option in
                            Button { game.perform(option) } label: {
                                HStack {
                                    Text(option.label).multilineTextAlignment(.leading)
                                    Spacer(minLength: 0)
                                    if let strike = option.command.strikes?.first, game.strikes[strike.carrierShipId] == strike { Image(systemName: "checkmark.circle.fill") }
                                }.frame(maxWidth: .infinity, alignment: .leading).padding(.vertical, 4)
                            }.disabled(!game.canInteract)
                        }
                        if game.showAirStrikes {
                            Button("Launch \(game.strikes.count) air strike(s)") { game.launch() }.buttonStyle(.borderedProminent).disabled(!game.canInteract || game.strikes.isEmpty)
                        }
                        if let card = view.human.hand.first(where: { $0.id == game.selectedCard }) {
                            Button("Inspect \(card.title)") { game.inspectedCard = card }.font(.caption)
                            if game.actions.isEmpty { Text("This card cannot be played during this phase. Resolve the required action first.").font(.caption).foregroundStyle(.secondary) }
                        }
                        if game.selectedCard != nil || game.showAirStrikes { Button("Clear selection") { game.clearSelection() }.font(.caption) }
                    }
                    Divider()
                    if let lastRoll = game.recentRolls.last {
                        Text("LAST ROLL").font(.caption).tracking(2).foregroundStyle(gold)
                        DiceRollPanel(result: lastRoll, compact: true)
                        ForEach(game.recentRolls.dropLast().reversed()) { roll in
                            Text("\(roll.title) · \(roll.face.map(String.init) ?? "—") · \(roll.outcome)").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                    Text("CAPTAIN'S LOG").font(.caption).tracking(2).foregroundStyle(gold)
                    ForEach(Array(view.gameState.events.suffix(7).reversed().enumerated()), id: \.offset) { _, event in
                        Text(event.detail).font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                    }
                }
            }.padding(20)
        }.background(navy.opacity(0.88))
    }
    @ViewBuilder private func normalActions(_ view: GameView) -> some View {
        if view.legalCommands.contains("draw_card") {
            Button { game.simple("draw_card") } label: { Label("Draw a card", systemImage: "rectangle.stack.badge.plus").frame(maxWidth: .infinity) }.buttonStyle(.borderedProminent).disabled(!game.canInteract)
        }
        if view.actions.contains(where: { $0.command.type == "use_carrier_strike" }) {
            Button("Carrier air strikes") { game.selectedCard = nil; game.showAirStrikes.toggle() }.disabled(!game.canInteract)
        }
        if view.legalCommands.contains("end_turn") { Button("End turn") { game.simple("end_turn") }.buttonStyle(.borderedProminent).disabled(!game.canInteract) }
        if view.isBotTurn && !game.busy { Button("Continue bot turns") { game.run(["type": "view"]) } }
    }
    private func results(_ view: GameView) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: "flag.checkered").font(.largeTitle).foregroundStyle(gold)
            ForEach(view.gameState.players) { player in
                Text("\(player.name): \(player.victoryPile.count) ships / \(player.victoryPile.reduce(0) { $0 + $1.hitNumber }) points").font(.callout)
            }
            if view.gameState.options.matchMode == "campaign" && view.gameState.matchWinnerIds.isEmpty {
                if !game.isOnline || game.onlineSnapshot?.isHost == true {
                    Button("Next round") { game.run(["type": "next_round"]) }.buttonStyle(.borderedProminent).disabled(game.busy || (game.isOnline && !game.onlineConnected))
                } else { Text("Waiting for the host to start the next round.").font(.caption) }
            } else { Button("Return to menu") { game.returnToMenu() }.buttonStyle(.borderedProminent) }
        }
    }
}
