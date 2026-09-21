import SpriteKit

final class TableScene: SKScene {
    override func didMove(to view: SKView) {
        backgroundColor = NSColor(red: 0.025, green: 0.055, blue: 0.075, alpha: 1)
        rebuild()
    }
    override func didChangeSize(_ oldSize: CGSize) { rebuild() }
    private func rebuild() {
        removeAllChildren()
        if let image = Artwork.shared.image("table") {
            let background = SKSpriteNode(texture: SKTexture(image: image))
            background.position = CGPoint(x: size.width / 2, y: size.height / 2)
            background.size = size; background.alpha = 0.13
            addChild(background)
        }
        let center = CGPoint(x: size.width * 0.72, y: size.height * 0.5)
        for radius in stride(from: 110.0, through: 550.0, by: 110.0) {
            let ring = SKShapeNode(circleOfRadius: radius)
            ring.position = center; ring.strokeColor = NSColor(white: 0.8, alpha: 0.035); ring.lineWidth = 1
            addChild(ring)
        }
    }
}
