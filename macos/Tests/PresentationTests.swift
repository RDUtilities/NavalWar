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
        print("PASS: native mine fleet targets, salvo attachments, hit/sinking effects with sound off, and no duplicate/reconnect animations.")
    }
}
