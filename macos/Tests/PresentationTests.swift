import Foundation

struct PresentationFixture: Decodable { let before: GameView; let after: GameView; let command: Command }
@main struct PresentationTests {
    @MainActor static func main() throws {
        let fixtures = try JSONDecoder().decode([String: PresentationFixture].self, from: Data(contentsOf: URL(fileURLWithPath: "macos/build/presentation-fixtures.json")))
        let game = GameModel(); game.sound = false
        let mine = fixtures["mines"]!
        game.view = mine.before
        game.selectedCard = mine.command.cardId
        let enemy = mine.before.gameState.players.first { $0.id == mine.command.targetPlayerId }!
        precondition(game.fleetAction(enemy)?.command.type == "play_minefield")
        precondition(enemy.ships.filter { !$0.sunk }.allSatisfy { game.isTarget($0, player: enemy) })
        precondition(game.fleetAction(mine.before.human) == nil, "Own fleet must not be a mine target")
        game.clearSelection()
        precondition(game.fleetAction(enemy) == nil, "Clearing selection must remove fleet target")
        for key in ["salvo", "sinking"] {
            let fixture = fixtures[key]!
            game.combatEffects = [:]; game.view = fixture.before; game.selectedCard = fixture.command.cardId
            let target = fixture.before.gameState.players.first { $0.id == fixture.command.targetPlayerId }!
            let ship = target.ships.first { $0.id == fixture.command.targetShipId }!
            precondition(game.isTarget(ship, player: target))
            precondition(game.fleetAction(target) == nil, "Salvos must remain ship-specific")
            game.update(fixture.after)
            let effect = game.combatEffects[ship.id]!
            precondition(effect.sinking == (key == "sinking"))
            if key == "salvo" {
                precondition(effect.salvo?.id == fixture.command.cardId)
                precondition(fixture.after.gameState.players.flatMap(\.ships).first { $0.id == ship.id }!.attachments.contains { $0.card.id == fixture.command.cardId })
            }
            game.combatEffects = [:]
            game.update(fixture.after)
            precondition(game.combatEffects.isEmpty, "Polling unchanged state must not replay explosions")
        }
        game.view = nil; game.update(fixtures["sinking"]!.after)
        precondition(game.combatEffects.isEmpty, "Loading a position must not replay old explosions")
        let destroyer = fixtures["destroyer"]!
        game.view = destroyer.before
        game.selectedCard = destroyer.before.human.hand.first?.id
        let fleet = destroyer.before.gameState.players.first { $0.id == destroyer.command.targetPlayerId }!
        precondition(game.fleetAction(fleet)?.command.type == "resolve_destroyer_squadron_roll", "Hand selection hid ready Destroyer")
        precondition(fleet.ships.filter { !$0.sunk }.allSatisfy { game.isTarget($0, player: fleet) })
        if let card = destroyer.before.human.hand.first { game.choose(card); precondition(game.selectedCard == nil) }
        // Two ready squadrons offer two valid commands for the same fleet.
        var raw = try JSONSerialization.jsonObject(with: JSONEncoder().encode(destroyer.before)) as! [String: Any]
        var options = raw["actions"] as! [[String: Any]]
        var second = options.first { ($0["command"] as? [String: Any])?["type"] as? String == "resolve_destroyer_squadron_roll" && ($0["command"] as? [String: Any])?["targetPlayerId"] as? String == fleet.id }!
        var command = second["command"] as! [String: Any]; command["destroyerId"] = "second-ready-squadron"; second["command"] = command; second["id"] = "second-ready-command"; options.append(second); raw["actions"] = options
        game.view = try JSONDecoder().decode(GameView.self, from: JSONSerialization.data(withJSONObject: raw))
        precondition(game.fleetAction(fleet) != nil, "Multiple ready squadrons removed fleet target")
        game.view = fixtures["deployment"]!.after
        precondition(!game.actions.contains { $0.command.type == "resolve_destroyer_squadron_roll" }, "New Destroyers must wait until the next turn")
        // Drops use the current legal options and validate ownership and source identity.
        game.view = mine.before; game.clearSelection()
        let minePayload = game.dragPayload(kind: "card", id: mine.command.cardId!)
        precondition(game.dropOption(minePayload, onto: .fleet(enemy.id))?.command.type == "play_minefield")
        for ship in enemy.ships.filter({ !$0.sunk }) {
            precondition(game.dropOption(minePayload, onto: .ship(player: enemy.id, ship: ship.id))?.command.type == "play_minefield")
        }
        precondition(game.dropOption(minePayload, onto: .fleet(mine.before.humanPlayerId)) == nil)
        precondition(game.dropOption("untrusted text", onto: .fleet(enemy.id)) == nil)
        let foreign = String(decoding: try JSONEncoder().encode(TableDrag(session: UUID(), kind: "card", id: mine.command.cardId!)), as: UTF8.self)
        precondition(game.dropOption(foreign, onto: .fleet(enemy.id)) == nil)
        game.busy = true
        precondition(game.dropOption(minePayload, onto: .fleet(enemy.id)) == nil)
        game.busy = false
        let salvo = fixtures["salvo"]!
        game.view = salvo.before
        let salvoPayload = game.dragPayload(kind: "card", id: salvo.command.cardId!)
        precondition(game.dropOption(salvoPayload, onto: .fleet(salvo.command.targetPlayerId!)) == nil)
        precondition(game.dropOption(salvoPayload, onto: .ship(player: salvo.command.targetPlayerId!, ship: salvo.command.targetShipId!))?.command.type == "play_salvo")
        precondition(game.dropOption(salvoPayload, onto: .ship(player: salvo.before.humanPlayerId, ship: salvo.command.targetShipId!)) == nil)
        precondition(game.dropOption(minePayload, onto: .fleet(enemy.id)) == nil, "A stale drag must not play a different card")
        var squadronRaw = try JSONSerialization.jsonObject(with: JSONEncoder().encode(salvo.before)) as! [String: Any]
        var squadronState = squadronRaw["gameState"] as! [String: Any]
        squadronState["destroyerSquadrons"] = [["id": "waiting-destroyer", "ownerId": salvo.command.targetPlayerId!, "hitsTaken": 1, "deployedTurn": 1]]
        squadronRaw["gameState"] = squadronState
        var squadronCommand = salvo.command
        squadronCommand.targetShipId = nil; squadronCommand.targetDestroyerId = "waiting-destroyer"
        squadronRaw["actions"] = try JSONSerialization.jsonObject(with: JSONEncoder().encode([ActionOption(id: "salvo-destroyer", label: "Attack Destroyer", command: squadronCommand)]))
        game.view = try JSONDecoder().decode(GameView.self, from: JSONSerialization.data(withJSONObject: squadronRaw))
        precondition(game.dropOption(salvoPayload, onto: .squadron(player: salvo.command.targetPlayerId!, squadron: "waiting-destroyer"))?.command.targetDestroyerId == "waiting-destroyer")
        precondition(game.dropOption(salvoPayload, onto: .fleet(salvo.command.targetPlayerId!)) == nil)
        precondition(game.dropOption(salvoPayload, onto: .squadron(player: salvo.before.humanPlayerId, squadron: "waiting-destroyer")) == nil)

        game.view = destroyer.before
        let destroyerPayload = game.dragPayload(kind: "destroyer", id: destroyer.command.destroyerId!)
        precondition(game.dropOption(destroyerPayload, onto: .fleet(fleet.id))?.command.destroyerId == destroyer.command.destroyerId)
        precondition(game.dropOption(destroyerPayload, onto: .ship(player: fleet.id, ship: fleet.ships.first { !$0.sunk }!.id))?.command.type == "resolve_destroyer_squadron_roll")
        print("PASS: fleet and ship drops, ready Destroyer drops, invalid ownership, foreign/stale payloads and busy-state rejection.")
        let cases: [(String, [String])] = [
            ("submarine_roll", ["submarine", "Dice"]), ("torpedo_boat_roll", ["TorpedoBoat", "Dice"]),
            ("carrier_roll", ["AirStrike", "Dice"]), ("destroyer_squadron_roll", ["Dice"]),
            ("minefield_deployed", ["mines"]), ("minefield_cleared", ["minesweeper"]),
            ("smoke_deployed", ["smoke"]), ("destroyer_squadron_deployed", ["Destroyers"]),
            ("additional_damage_played", ["AdditionalDamnage"]), ("ship_repaired", ["repairCard"]),
            ("card_drawn", ["draw-card"]), ("special_card_drawn", ["draw-card"]),
            ("additional_ship_drawn", ["draw-card"]), ("ship_added", ["draw-card"]),
            ("ship_sunk", ["shipsink"]), ("destroyer_squadron_sunk", ["shipsink"]), ("campaign_won", ["WinnerSound"])
        ]
        for (type, expected) in cases { precondition(GameAudio.cues(for: GameEvent(type:type, detail:"")) == expected) }
        for caliber in ["11", "12.6", "14", "15", "16", "18"] {
            for (type, verb) in [("salvo_fired", "attached"), ("destroyer_squadron_hit", "fired")] {
                precondition(GameAudio.cues(for: GameEvent(type: type, detail: "Admiral \(verb) \(caliber)\" for 2 hit(s)")) == (["11", "12.6"].contains(caliber) ? ["Salvo-small"] : ["Salvo-big"]))
            }
        }
        let batch = [GameEvent(type:"ship_sunk", detail:""), GameEvent(type:"salvo_fired", detail:"Admiral attached 16\" for 4 hit(s)")]
        precondition(GameAudio.cues(events:batch, completedRound:true) == ["Salvo-big", "shipsink", "WinnerSound"])
        print("PASS: all web sound routes, salvo caliber variants, attack/sink/winner batch, ready and multiple Destroyer targeting, deployment timing.")
        print("PASS: native mine fleet targets, salvo attachments, hit/sinking effects with sound off, and no duplicate/reconnect animations.")
    }
}
