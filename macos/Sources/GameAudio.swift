import AppKit

/// Matches the web game's event sounds; keep attack and sinking cues from the same update.
enum GameAudio {
    static let webSounds = ["Salvo-small", "Salvo-big", "shipsink", "submarine", "AirStrike", "draw-card", "smoke", "Destroyers", "AdditionalDamnage", "repairCard", "TorpedoBoat", "invalidcard", "minesweeper", "mines", "Dice", "WinnerSound"]
    static func cues(for event: GameEvent) -> [String] {
        switch event.type {
        case "salvo_fired", "destroyer_squadron_hit":
            let small = event.detail.range(of: #"(?:attached|fired)\s+(?:11|12\.6)\""#, options: .regularExpression) != nil
            return [small ? "Salvo-small" : "Salvo-big"]
        case "ship_sunk", "destroyer_squadron_sunk": return ["shipsink"]
        case "submarine_roll": return ["submarine", "Dice"]
        case "torpedo_boat_roll": return ["TorpedoBoat", "Dice"]
        case "carrier_roll": return ["AirStrike", "Dice"]
        case "destroyer_squadron_roll": return ["Dice"]
        case "minefield_deployed": return ["mines"]
        case "minefield_cleared": return ["minesweeper"]
        case "smoke_deployed": return ["smoke"]
        case "destroyer_squadron_deployed": return ["Destroyers"]
        case "additional_damage_played": return ["AdditionalDamnage"]
        case "ship_repaired": return ["repairCard"]
        case "card_drawn", "special_card_drawn", "additional_ship_drawn", "ship_added": return ["draw-card"]
        case "campaign_won": return ["WinnerSound"]
        default: return []
        }
    }
    static func cues(events: [GameEvent], completedRound: Bool) -> [String] {
        var cues = events.flatMap { Self.cues(for: $0) }
        // The engine may record the sinking before the attack that caused it.
        let sinks = cues.filter { $0 == "shipsink" }
        cues.removeAll { $0 == "shipsink" }
        let winners = cues.filter { $0 == "WinnerSound" }
        cues.removeAll { $0 == "WinnerSound" }
        return cues + sinks + ((completedRound || !winners.isEmpty) ? ["WinnerSound"] : [])
    }
}
