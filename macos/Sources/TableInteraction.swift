import Foundation

struct TableDrag: Codable {
    let session: UUID
    let kind: String
    let id: String
}
enum TableTarget: Hashable {
    case fleet(String)
    case ship(player: String, ship: String)
    case squadron(player: String, squadron: String)
    case discard
}

@MainActor extension GameModel {
    func isPlayable(_ card: PlayCard) -> Bool {
        guard canInteract, let view, !view.isBotTurn,
              view.gameState.phase == "normal", view.gameState.currentPlayerId == view.humanPlayerId,
              readySquadrons.isEmpty else { return false }
        return view.actions.contains {
            $0.command.actorId == view.humanPlayerId && $0.command.cardId == card.id && $0.command.type.hasPrefix("play_")
        }
    }

    func dragCard(_ card: PlayCard) -> String {
        choose(card)
        selectedCard = card.id
        return dragPayload(kind: "card", id: card.id)
    }
    func dragSquadron(_ squadron: Squadron) -> String {
        clearSelection(); selectedSquadron = squadron.id
        return dragPayload(kind: "destroyer", id: squadron.id)
    }
    func dragPayload(kind: String, id: String) -> String {
        String(decoding: try! JSONEncoder().encode(TableDrag(session: tableDragSession, kind: kind, id: id)), as: UTF8.self)
    }
    /// Resolve against current authoritative legal options, never against stale selection or drag text.
    func dropOption(_ payload: String, onto target: TableTarget) -> ActionOption? {
        guard canInteract, let view, !view.isBotTurn,
              let data = payload.data(using: .utf8), let drag = try? JSONDecoder().decode(TableDrag.self, from: data),
              drag.session == tableDragSession else { return nil }
        let options: [ActionOption]
        switch drag.kind {
        case "card":
            guard view.human.hand.contains(where: { $0.id == drag.id }) else { return nil }
            options = view.actions.filter { $0.command.cardId == drag.id }
        case "destroyer":
            options = view.actions.filter { $0.command.destroyerId == drag.id && ["resolve_destroyer_squadron_roll", "discard_destroyer_squadron"].contains($0.command.type) }
        default: return nil
        }
        return tableOption(options, target: target)
    }
    func tableOption(_ options: [ActionOption], target: TableTarget) -> ActionOption? {
        guard let view else { return nil }
        func fleet(_ id: String) -> ActionOption? {
            options.first { option in
                let c = option.command
                if c.targetShipId != nil || c.targetDestroyerId != nil || c.strikes != nil { return false }
                if c.targetPlayerId == id { return true }
                return id == view.humanPlayerId && ["play_smoke", "play_destroyer_squadron", "play_additional_ship"].contains(c.type)
            }
        }
        switch target {
        case .fleet(let player): return fleet(player)
        case .ship(let player, let ship):
            guard let actual = view.gameState.players.first(where: { $0.id == player })?.ships.first(where: { $0.id == ship }), !actual.sunk else { return nil }
            return options.first { $0.command.targetShipId == ship && ($0.command.targetPlayerId == nil || $0.command.targetPlayerId == player) } ?? fleet(player)
        case .squadron(let player, let squadron):
            guard view.gameState.destroyerSquadrons.contains(where: { $0.id == squadron && $0.ownerId == player }) else { return nil }
            return options.first { $0.command.targetDestroyerId == squadron } ?? fleet(player)
        case .discard:
            return options.first { ["discard_play_card", "discard_destroyer_squadron", "play_additional_ship"].contains($0.command.type) }
        }
    }
    @discardableResult func drop(_ payloads: [String], onto target: TableTarget) -> Bool {
        guard payloads.count == 1, let option = dropOption(payloads[0], onto: target) else { return false }
        perform(option); return true
    }
    func squadronAction(_ squadron: Squadron) -> ActionOption? {
        guard canInteract else { return nil }
        return actions.first { $0.command.targetDestroyerId == squadron.id }
    }
    func aimSquadron(_ squadron: Squadron) {
        guard canInteract else { return }
        clearSelection(); selectedSquadron = squadron.id
    }
    var readySquadrons: [Squadron] {
        guard let view else { return [] }
        return view.gameState.destroyerSquadrons.filter { squadron in
            squadron.ownerId == view.humanPlayerId && view.actions.contains { $0.command.destroyerId == squadron.id }
        }
    }
    var activeCarrierID: String? {
        selectedCarrier ?? view?.actions.first(where: { $0.command.type == "use_carrier_strike" })?.command.strikes?.first?.carrierShipId
    }
    func beginAirStrikes() { clearSelection(); showAirStrikes = true }
    func shipAction(_ ship: Ship, player: Player) -> ActionOption? {
        actions.first { option in
            if let strike = option.command.strikes?.first {
                return strike.targetShipId == ship.id && strike.targetPlayerId == player.id && strike.carrierShipId == activeCarrierID
            }
            return option.command.targetShipId == ship.id && (option.command.targetPlayerId == nil || option.command.targetPlayerId == player.id)
        }
    }
}
