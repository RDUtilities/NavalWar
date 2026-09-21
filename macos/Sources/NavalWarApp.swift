import SwiftUI
import SpriteKit
import AppKit

@main struct NavalWarApp: App {
    @StateObject private var game = GameModel()
    var body: some Scene {
        WindowGroup("Naval War") {
            ContentView().environmentObject(game)
                .frame(minWidth: 1080, minHeight: 760)
                .preferredColorScheme(.dark)
        }
        .defaultSize(width: 1440, height: 940)
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("Return to Menu") { game.returnToMenu() }.disabled(game.busy)
            }
            CommandGroup(after: .saveItem) {
                Button("Save Game") { game.run(["type": "view"]) }
                    .keyboardShortcut("s").disabled(game.view == nil || game.busy || game.isOnline)
            }
        }
    }
}
private let gold = Color(red: 0.86, green: 0.70, blue: 0.40)
private let navy = Color(red: 0.035, green: 0.065, blue: 0.09)

struct ContentView: View {
    @EnvironmentObject var game: GameModel
    @State private var scene = TableScene(size: CGSize(width: 1340, height: 900))
    var body: some View {
        ZStack {
            SpriteView(scene: scene).ignoresSafeArea().allowsHitTesting(false).onAppear { scene.scaleMode = .resizeFill }
            if game.inMenu { WelcomeView() } else if game.isOnline && game.view == nil { OnlineLobbyView() } else { WarTableView() }
        }
        .tint(gold)
        .sheet(item: $game.inspectedCard) { card in
            VStack(spacing: 16) {
                Text(card.title).font(.title2.bold())
                CardArt(key: Artwork.shared.key(card), detailed: true).frame(width: 720, height: 480)
                Button("Close") { game.inspectedCard = nil }.keyboardShortcut(.cancelAction)
            }.padding(24)
        }
        .sheet(item: $game.inspectedShip) { ship in
            VStack(spacing: 16) {
                Text(ship.card.name).font(.title2.bold())
                CardArt(key: ship.card.id, detailed: true).frame(width: 720, height: 480)
                if !ship.attachments.isEmpty {
                    ScrollView(.horizontal) {
                        HStack { ForEach(ship.attachments, id: \.card.id) { attachment in
                            VStack { CardArt(key: Artwork.shared.key(attachment.card)).frame(width: 150, height: 100); Text(attachment.card.title).font(.caption) }
                        } }
                    }.frame(width: 720, height: 130)
                }
                Text("\(ship.card.faction) · \(ship.sunk ? "Sunk" : "\(ship.remaining) of \(ship.card.hitNumber) hit points remaining")")
                Button("Close") { game.inspectedShip = nil }.keyboardShortcut(.cancelAction)
            }.padding(24)
        }
    }
}
struct WelcomeView: View {
    @EnvironmentObject var game: GameModel
    @State private var name = "Admiral"
    @State private var players = 2
    @State private var mode = "skirmish"
    @State private var confirmNew = false
    @State private var onlineTab = false
    var body: some View {
        HStack(spacing: 70) {
            VStack(alignment: .leading, spacing: 22) {
                Text("THE ADMIRAL'S TABLE").font(.caption.weight(.semibold)).tracking(5).foregroundStyle(gold)
                CardArt(key: "logo").frame(width: 420, height: 235)
                Text("Command your fleet.\nOutplay your rivals.").font(.system(size: 36, weight: .semibold, design: .serif))
                Text("The classic naval card game, at home on your Mac.")
                    .foregroundStyle(.secondary)
                Label("Offline play · All artwork included", systemImage: "checkmark.seal").foregroundStyle(gold)
            }
            VStack(alignment: .leading, spacing: 22) {
                Text("Set sail").font(.largeTitle.weight(.semibold))
                Picker("Play mode", selection: $onlineTab) { Text("Solo").tag(false); Text("Online").tag(true) }.pickerStyle(.segmented).disabled(game.busy)
                if onlineTab { OnlineSetupView() } else {
                Text("SOLO COMMAND").font(.caption).tracking(3).foregroundStyle(gold)
                TextField("Your name", text: $name).textFieldStyle(.roundedBorder)
                Picker("Fleet commanders", selection: $players) {
                    Text("You + 1 bot").tag(2); Text("You + 2 bots").tag(3); Text("You + 3 bots").tag(4)
                }
                Picker("Game mode", selection: $mode) {
                    Text("Skirmish").tag("skirmish"); Text("Campaign").tag("campaign")
                }.pickerStyle(.segmented)
                Text(mode == "skirmish" ? "One decisive battle. Most captured ships wins when the deck runs out." : "Multiple battles. First to 100 captured hit points wins.")
                    .font(.callout).foregroundStyle(.secondary).frame(height: 48, alignment: .topLeading)
                Button {
                    if game.canResume { confirmNew = true } else { game.start(name: name, players: players, mode: mode) }
                } label: { Label("Start a new game", systemImage: "flag.fill").frame(maxWidth: .infinity).padding(9) }
                .buttonStyle(.borderedProminent).disabled(game.busy)
                if game.canResume {
                    Button { game.resume() } label: { Label("Resume saved game", systemImage: "arrow.clockwise").frame(maxWidth: .infinity).padding(7) }
                    .disabled(game.busy)
                }
                }
                if game.busy { ProgressView("Preparing your fleet…") }
                if let error = game.error { Text(error).foregroundStyle(.orange).font(.callout).textSelection(.enabled) }
                Divider()
                Text("Your game saves automatically after every action.").font(.caption).foregroundStyle(.secondary)
            }
            .padding(30).frame(width: 360).background(navy.opacity(0.94), in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(gold.opacity(0.25)))
        }.padding(40)
        .confirmationDialog("Starting a new game replaces the current autosave.", isPresented: $confirmNew) {
            Button("Start New Game", role: .destructive) { game.start(name: name, players: players, mode: mode) }
            Button("Cancel", role: .cancel) {}
        }
    }
}
