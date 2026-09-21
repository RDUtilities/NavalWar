import Foundation
struct DiceFixture: Decodable { let kind: String; let roll: Int; let before: GameView; let after: GameView; let event: GameEvent }
@main struct DiceTests {
    @MainActor static func main() async throws {
        let fixtures = try JSONDecoder().decode([DiceFixture].self, from: Data(contentsOf: URL(fileURLWithPath:"macos/build/dice-fixtures.json")))
        for fixture in fixtures {
            let result = DiceResolution(event: fixture.event)!
            precondition(result.face == fixture.roll)
            if fixture.kind != "destroyer_squadron" {
                let hit = fixture.kind == "carrier" ? fixture.roll == 1 : fixture.kind == "submarine" ? fixture.roll >= 5 : fixture.roll == 6
                precondition(result.outcome.hasPrefix(hit ? "HIT" : "MISS"))
            } else { precondition(result.outcome.hasPrefix("\(min(fixture.roll,2)) ship")) }
        }
        let capped = DiceResolution(event: GameEvent(type:"destroyer_squadron_roll",detail:"Admiral's destroyer squadron rolled 2 ship sink(s) against Opponent.",dieRoll:6))!
        precondition(capped.face == 6 && capped.outcome.hasPrefix("2 ships"))
        let legacy = DiceResolution(event: GameEvent(type:"destroyer_squadron_roll",detail:"Admiral's destroyer squadron rolled 2 ship sink(s) against Opponent."))!
        precondition(legacy.face == nil, "Do not invent the actual roll from the capped count")
        let game = GameModel(); game.sound = false; game.diceRollDelay = 80_000_000; game.diceResultDelay = 150_000_000
        let fixture = fixtures.first { $0.kind == "carrier" && $0.roll == 1 }!
        game.view = fixture.before
        let task = Task { await game.present(fixture.after) }
        try await Task.sleep(nanoseconds: 20_000_000)
        precondition(game.presentingDice && game.diceRolling && !game.canInteract)
        precondition(!game.view!.gameState.players[1].ships[0].sunk, "Impact preceded the roll")
        try await Task.sleep(nanoseconds: 90_000_000)
        precondition(!game.diceRolling && game.diceResult?.face == 1)
        precondition(!game.view!.gameState.players[1].ships[0].sunk, "Impact preceded the result hold")
        await task.value
        precondition(game.view!.gameState.players[1].ships[0].sunk && !game.presentingDice)
        precondition(game.recentRolls.count == 1)
        await game.present(fixture.after)
        precondition(game.recentRolls.count == 1, "Unchanged snapshots replayed dice")
        game.view = nil; game.recentRolls = []
        await game.present(fixture.after)
        precondition(game.recentRolls.isEmpty, "Initial load replayed past rolls")
        // Two rolls arriving together must both survive presentation, in order.
        var object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(fixture.after)) as! [String:Any]
        var state = object["gameState"] as! [String:Any]
        var events = state["events"] as! [[String:Any]]
        events.append(["type":"carrier_roll","detail":"Admiral's second carrier rolled 4 against Opponent.","dieRoll":4]);state["events"]=events;object["gameState"]=state
        let batch = try JSONDecoder().decode(GameView.self,from:JSONSerialization.data(withJSONObject:object))
        game.view = fixture.before; game.diceRollDelay = 1; game.diceResultDelay = 1
        await game.present(batch)
        precondition(game.recentRolls.compactMap(\.face) == [1,4])
        print("PASS: all 24 actual RNG faces/outcomes, capped Destroyer result, legacy fallback, roll/result before impact, batched rolls, and no polling/load replay.")
    }
}
