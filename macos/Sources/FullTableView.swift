import SwiftUI

private let tableGold = Color(red: 0.86, green: 0.70, blue: 0.40)

struct WarTableView: View {
    @EnvironmentObject var game: GameModel
    @State private var orders = false
    var body: some View {
        ZStack {
            if let view = game.view {
                VStack(spacing: 10) {
                    HStack {
                        Text("NAVAL WAR").font(.title2.bold()).foregroundStyle(tableGold)
                        Text("Round \(view.gameState.roundNumber) · Turn \(view.gameState.turnNumber)").foregroundStyle(.secondary)
                        Spacer()
                        if game.isOnline { Text(game.onlineConnected ? "Online" : "Disconnected") }
                        Toggle("Sound", isOn: $game.sound).toggleStyle(.switch).fixedSize()
                        Button("Orders & Log") { orders.toggle() }.popover(isPresented: $orders) { CommandPanel().frame(width: 360, height: 600) }
                        Button("Menu") { game.returnToMenu() }.disabled(game.busy)
                    }
                    ScrollView(.vertical) {
                        HStack(alignment: .top, spacing: 10) {
                            let enemies = view.gameState.players.filter { $0.id != view.humanPlayerId }
                            ForEach(enemies) { player in
                                TableFleet(player: player, columns: enemies.count == 1 ? 5 : enemies.count == 2 ? 3 : 2, own: false)
                                    .frame(maxWidth: .infinity, alignment: .top)
                            }
                        }
                    }.frame(maxHeight: .infinity)
                    commandStrip(view)
                    TableFleet(player: view.human, columns: max(5, min(7, view.human.afloat)), own: true)
                    hand(view)
                }.padding(14)
            }
            if game.activeTableDrag != nil {
                Image(systemName: "rectangle.on.rectangle.fill").font(.largeTitle).foregroundStyle(tableGold)
                    .padding(12).background(.black.opacity(0.8), in: RoundedRectangle(cornerRadius: 10))
                    .position(game.tableDragPoint).allowsHitTesting(false)
            }
            if game.presentingDice, let result = game.diceResult {
                Color.black.opacity(0.5).ignoresSafeArea()
                DiceRollPanel(result: result, rolling: game.diceRolling).padding(28)
                    .background(.ultraThickMaterial, in: RoundedRectangle(cornerRadius: 20)).frame(maxWidth: 520)
            }
        }.coordinateSpace(name: "warTable").onPreferenceChange(TableZonePreference.self) { game.tableDropZones = $0 }
    }
    private func commandStrip(_ view: GameView) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack {
                Text(game.instruction).font(.headline).lineLimit(2)
                Spacer()
                if game.busy { ProgressView().controlSize(.small) }
                if let roll = game.recentRolls.last {
                    Text("Last roll: \(roll.face.map(String.init) ?? "—") · \(roll.outcome)").font(.caption).lineLimit(2).frame(maxWidth: 290)
                }
            }
            if let error = game.error { Text(error).font(.callout).foregroundStyle(.orange) }
            HStack(spacing: 12) {
                if view.legalCommands.contains("draw_card") { Button("Draw card (\(view.gameState.playDeckCount))") { game.simple("draw_card") }.buttonStyle(.borderedProminent).disabled(!game.canInteract) }
                if view.actions.contains(where: { $0.command.type == "use_carrier_strike" }) {
                    Button("Carrier air strikes") { game.beginAirStrikes() }.disabled(!game.canInteract)
                }
                if game.showAirStrikes {
                    Picker("Carrier", selection: Binding(get: { game.activeCarrierID ?? "" }, set: { game.selectedCarrier = $0 })) {
                        ForEach(view.human.ships.filter { $0.card.isCarrier && !$0.sunk }) { ship in Text(ship.card.name).tag(ship.id) }
                    }.frame(maxWidth: 230)
                    Button("Launch \(game.strikes.count) strike(s)") { game.launch() }.disabled(!game.canInteract || game.strikes.isEmpty)
                }
                if view.legalCommands.contains("end_turn") { Button("End turn") { game.simple("end_turn") }.buttonStyle(.borderedProminent).disabled(!game.canInteract) }
                if view.isBotTurn && !game.busy { Button("Continue") { game.run(["type": "view"]) } }
                if let pending = view.gameState.pendingDestroyerAttack, pending.ownerId == view.humanPlayerId {
                    Button("Confirm \(game.destroyerTargets.count) targets") { game.confirmDestroyer() }.disabled(!game.canInteract || game.destroyerTargets.count != pending.shipsToSink)
                }
                if view.gameState.phase == "round_complete" { Button("Battle results") { orders = true }.buttonStyle(.borderedProminent) }
                if game.isOnline && !game.onlineConnected { Button("Reconnect") { game.reconnectOnline() }.disabled(game.busy) }
                Spacer()
                if game.selectedCard != nil || game.selectedSquadron != nil || game.showAirStrikes { Button("Clear selection") { game.clearSelection() } }
                Button {
                    if let option = game.tableOption(game.actions, target: .discard), game.canInteract { game.perform(option) }
                } label: { Label("Discard", systemImage: "tray.and.arrow.down").padding(7) }
                    .background(game.tableOption(game.actions, target: .discard) != nil ? tableGold.opacity(0.25) : Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 8))
                    .tableDropZone(.discard)
            }
        }.padding(12).background(.black.opacity(0.45), in: RoundedRectangle(cornerRadius: 12))
    }
    private func hand(_ view: GameView) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("YOUR HAND · Green outline = playable · Drag or click a card, then its target · Right-click to inspect").font(.caption).foregroundStyle(.secondary)
            ScrollView(.horizontal) {
                HStack(spacing: 10) {
                    ForEach(view.human.hand) { card in
                        VStack(spacing: 3) {
                                CardArt(key: Artwork.shared.key(card)).frame(width: 172, height: 115)
                                Text(card.title).font(.caption.weight(.semibold)).lineLimit(1)
                            }.padding(5).background(game.selectedCard == card.id ? tableGold.opacity(0.28) : Color.black.opacity(0.3), in: RoundedRectangle(cornerRadius: 9))
                                .overlay(RoundedRectangle(cornerRadius: 9).stroke(game.isPlayable(card) ? Color.green : .clear, lineWidth: 3))
                                .overlay(RoundedRectangle(cornerRadius: 7).inset(by: 4).stroke(game.selectedCard == card.id ? tableGold : .clear, lineWidth: 2))
                            .accessibilityValue(game.isPlayable(card) ? "Playable now" : "Not playable now")
                            .onTapGesture { if game.canInteract && !view.isBotTurn { game.choose(card) } }
                            .accessibilityAddTraits(.isButton)
                            .disabled(!game.canInteract || view.isBotTurn || !game.readySquadrons.isEmpty)
                            .modifier(TableDragSource { game.dragCard(card) })
                            .contextMenu { Button("Inspect \(card.title)") { game.inspectedCard = card } }
                    }
                }
            }.frame(height: 149)
        }
    }
}

private struct TableFleet: View {
    @EnvironmentObject var game: GameModel
    let player: Player
    let columns: Int
    let own: Bool
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(own ? "YOUR FLEET · \(player.name)" : player.name).font(.headline).lineLimit(1)
                Spacer(minLength: 3)
                Text("\(player.afloat) afloat").font(.caption)
                Menu {
                    ForEach(player.ships.filter(\.sunk)) { ship in Button(ship.card.name) { game.inspectedShip = ship } }
                } label: { Text("Sunk \(player.ships.filter(\.sunk).count)") }.fixedSize()
            }
            if !player.fleetEffects.isEmpty { Text(player.fleetEffects.map { $0.kind.capitalized }.joined(separator: " · ")).font(.caption.bold()).foregroundStyle(.orange) }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: columns), spacing: 6) {
                ForEach(player.ships.filter { !$0.sunk || game.combatEffects[$0.id] != nil }) { ship in
                    Button { game.target(ship, player: player) } label: {
                        HStack(spacing: 6) {
                            CombatShipArt(ship: ship, effect: game.combatEffects[ship.id], width: 64).frame(width: 64, height: 63)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(ship.card.name).font(.system(size: 12, weight: .semibold)).lineLimit(2)
                                Text("\(ship.remaining)/\(ship.card.hitNumber) HP").font(.system(size: 13, weight: .bold)).foregroundStyle(ship.remaining < ship.card.hitNumber ? .orange : .white)
                                Text(ship.card.isCarrier ? "Carrier" : "Guns \(ship.card.gunCaliber ?? "—")").font(.caption2).foregroundStyle(.secondary)
                                if !ship.attachments.isEmpty { Text("\(ship.attachments.count) attached").font(.caption2).foregroundStyle(.orange) }
                            }.frame(maxWidth: .infinity, alignment: .leading)
                        }.padding(6).frame(height: 78).background(.black.opacity(0.35), in: RoundedRectangle(cornerRadius: 7))
                            .overlay(RoundedRectangle(cornerRadius: 7).stroke(game.isTarget(ship, player: player) ? tableGold : .white.opacity(0.08), lineWidth: game.isTarget(ship, player: player) ? 2 : 1))
                    }.buttonStyle(.plain).contextMenu { Button("Inspect \(ship.card.name)") { game.inspectedShip = ship } }
                        .tableDropZone(.ship(player: player.id, ship: ship.id))
                }
            }
            if let view = game.view {
                ForEach(view.gameState.destroyerSquadrons.filter { $0.ownerId == player.id }) { squadron in
                    if own && game.readySquadrons.contains(where: { $0.id == squadron.id }) {
                        squadronTile(squadron).modifier(TableDragSource { game.dragSquadron(squadron) })
                    } else { squadronTile(squadron) }
                }
            }
            if let option = game.fleetAction(player) {
                Button { game.perform(option) } label: { Text(game.fleetTargetLabel(player)).font(.caption.bold()).frame(maxWidth: .infinity).padding(5) }.buttonStyle(.borderedProminent)
            }
        }.padding(10).frame(maxWidth: .infinity, alignment: .topLeading)
            .background(.black.opacity(0.42), in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(game.fleetAction(player) != nil ? tableGold : .white.opacity(0.16), lineWidth: game.fleetAction(player) != nil ? 3 : 1))
            .tableDropZone(.fleet(player.id))
    }
    private func squadronTile(_ squadron: Squadron) -> some View {
        let ready = game.readySquadrons.contains { $0.id == squadron.id }
        return Button {
            if let option = game.squadronAction(squadron) { game.perform(option) }
            else if own && ready { game.aimSquadron(squadron) }
            else if let option = game.fleetAction(player) { game.perform(option) }
        } label: {
            HStack {
                CardArt(key: "play:destroyer_squadron").frame(width: 60, height: 40)
                VStack(alignment: .leading) {
                    Text("Destroyer Squadron · \(max(0, 4 - squadron.hitsTaken))/4 HP").font(.caption.bold())
                    Text(ready ? "Ready · Drag to an enemy fleet" : "Waiting to strike · Can be attacked").font(.caption2)
                }
                Spacer(minLength: 0)
            }.padding(6).background(tableGold.opacity(0.1), in: RoundedRectangle(cornerRadius: 7))
                .overlay(RoundedRectangle(cornerRadius: 7).stroke(game.squadronAction(squadron) != nil || game.selectedSquadron == squadron.id ? tableGold : .clear, lineWidth: 2))
        }.buttonStyle(.plain).tableDropZone(.squadron(player: player.id, squadron: squadron.id))
    }
}

private struct TableZonePreference: PreferenceKey {
    static var defaultValue: [TableTarget: CGRect] = [:]
    static func reduce(value: inout [TableTarget: CGRect], nextValue: () -> [TableTarget: CGRect]) {
        value.merge(nextValue(), uniquingKeysWith: { _, new in new })
    }
}
private extension View {
    func tableDropZone(_ target: TableTarget) -> some View {
        contentShape(Rectangle()).background(GeometryReader { geometry in
            Color.clear.preference(key: TableZonePreference.self, value: [target: geometry.frame(in: .named("warTable"))])
        })
    }
}
private struct TableDragSource: ViewModifier {
    @EnvironmentObject var game: GameModel
    let payload: () -> String
    @GestureState private var dragging = false
    func body(content: Content) -> some View {
        content.highPriorityGesture(DragGesture(minimumDistance: 8, coordinateSpace: .named("warTable"))
            .updating($dragging) { _, state, _ in state = true }
            .onChanged { value in
                guard game.canInteract, game.view?.isBotTurn == false else { return }
                if game.activeTableDrag == nil { game.activeTableDrag = payload() }
                game.tableDragPoint = value.location
            }.onEnded { value in
                defer { game.activeTableDrag = nil }
                guard let payload = game.activeTableDrag else { return }
                // Smaller ship/squadron targets win over their enclosing fleet box.
                let zones = game.tableDropZones.filter { $0.value.contains(value.location) }
                    .sorted { $0.value.width * $0.value.height < $1.value.width * $1.value.height }
                if let target = zones.first?.key { game.drop([payload], onto: target) }
            }).onChange(of: dragging) { _, active in
                if !active { game.activeTableDrag = nil }
            }
    }
}
