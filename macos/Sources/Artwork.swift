import SwiftUI
import AppKit

final class Artwork {
    static let shared = Artwork()
    private var files: [String: String] = [:]
    private let cache = NSCache<NSString, NSImage>()
    init() {
        if let url = Bundle.main.url(forResource: "artwork", withExtension: "json"), let data = try? Data(contentsOf: url) {
            files = (try? JSONDecoder().decode([String: String].self, from: data)) ?? [:]
        }
        cache.totalCostLimit = 96 * 1024 * 1024
    }
    func image(_ key: String, detailed: Bool = false) -> NSImage? {
        let resolvedKey = detailed && files["zoom:\(key)"] != nil ? "zoom:\(key)" : key
        if let image = cache.object(forKey: resolvedKey as NSString) { return image }
        guard let file = files[resolvedKey], let url = Bundle.main.resourceURL?.appendingPathComponent(file), let image = NSImage(contentsOf: url) else { return nil }
        cache.setObject(image, forKey: resolvedKey as NSString, cost: Int(image.size.width * image.size.height * 4))
        return image
    }
    func key(_ card: PlayCard) -> String {
        if card.kind == "salvo" { return "play:salvo:\(card.gunCaliber ?? ""):\(card.hits ?? 0)" }
        if ["additional_damage", "minefield"].contains(card.kind) { return "play:\(card.kind):\(card.hits ?? 0)" }
        return "play:\(card.kind)"
    }
}
struct CardArt: View {
    let key: String
    var detailed = false
    var body: some View {
        Group {
            if let image = Artwork.shared.image(key, detailed: detailed) { Image(nsImage: image).resizable().aspectRatio(contentMode: .fit) }
            else { RoundedRectangle(cornerRadius: 8).fill(Color.gray.opacity(0.2)).overlay(Image(systemName: "rectangle.on.rectangle")) }
        }.clipShape(RoundedRectangle(cornerRadius: 7))
    }
}
