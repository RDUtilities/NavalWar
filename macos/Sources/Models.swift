import Foundation

struct PlayCard: Codable, Identifiable, Equatable {
    let id: String
    let kind: String
    let gunCaliber: String?
    let hits: Int?
    var title: String {
        if kind == "salvo" { return "Salvo \(gunCaliber ?? "") · \(hits ?? 0)" }
        return kind.replacingOccurrences(of: "_", with: " ").capitalized
    }
}
struct ShipCard: Codable, Identifiable {
    let id: String
    let name: String
    let hitNumber: Int
    let gunCaliber: String?
    let isCarrier: Bool
    let faction: String
}
struct Damage: Codable { let type: String; let hits: Int }
struct FleetAttachment: Codable { let card: PlayCard; let source: Damage }
struct Ship: Codable, Identifiable {
    let card: ShipCard
    let damage: [Damage]
    let attachments: [FleetAttachment]
    let sunk: Bool
    var id: String { card.id }
    var remaining: Int { max(0, card.hitNumber - damage.reduce(0) { $0 + $1.hits }) }
}
struct FleetEffect: Codable { let kind: String }
struct Player: Codable, Identifiable {
    let id: String
    let name: String
    let ships: [Ship]
    let hand: [PlayCard]
    let handCount: Int
    let victoryPile: [ShipCard]
    let eliminated: Bool
    let fleetEffects: [FleetEffect]
    var afloat: Int { ships.filter { !$0.sunk }.count }
}
struct GameEvent: Codable { let type: String; let detail: String }
struct Squadron: Codable, Identifiable { let id: String; let ownerId: String; let hitsTaken: Int; let deployedTurn: Int }
struct PendingAttack: Codable { let destroyerId: String; let ownerId: String; let targetPlayerId: String; let shipsToSink: Int }
struct Campaign: Codable { let totalScores: [String: Int]; let targetScore: Int }
struct Options: Codable { let matchMode: String }
struct GameState: Codable {
    let phase: String
    let turnNumber: Int
    let roundNumber: Int
    let currentPlayerId: String
    let players: [Player]
    let playDeckCount: Int
    let shipDeckCount: Int
    let discardPile: [PlayCard]
    let events: [GameEvent]
    let winnerIds: [String]
    let matchWinnerIds: [String]
    let openingTurnPendingPlayerIds: [String]
    let pendingDestroyerAttack: PendingAttack?
    let destroyerSquadrons: [Squadron]
    let campaign: Campaign?
    let options: Options
}
struct Strike: Codable, Equatable { let carrierShipId: String; let targetPlayerId: String; let targetShipId: String }
struct Command: Codable {
    var type: String
    var actorId: String
    var cardId: String? = nil
    var targetPlayerId: String? = nil
    var targetShipId: String? = nil
    var targetDestroyerId: String? = nil
    var destroyerId: String? = nil
    var targetShipIds: [String]? = nil
    var strikes: [Strike]? = nil
    var dictionary: [String: Any] { (try? JSONSerialization.jsonObject(with: JSONEncoder().encode(self))) as? [String: Any] ?? [:] }
}
struct ActionOption: Codable, Identifiable { let id: String; let label: String; let command: Command }
struct GameView: Codable {
    let humanPlayerId: String
    let isBotTurn: Bool
    let legalCommands: [String]
    let actions: [ActionOption]
    let gameState: GameState
    var human: Player { gameState.players.first { $0.id == humanPlayerId }! }
}
struct EngineReply: Decodable { let ok: Bool; let view: GameView?; let error: String? }
