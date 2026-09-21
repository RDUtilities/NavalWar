import SwiftUI

struct OnlineSetupView: View {
    @EnvironmentObject var game: GameModel
    @State private var name = "Admiral"
    @State private var server = ProcessInfo.processInfo.environment["NAVAL_WAR_TEST_SERVER"] ?? "https://naval-war.onrender.com"
    @State private var joinCode = ""
    @State private var players = 2
    @State private var mode = "skirmish"
    @State private var joining = false
    var body: some View {
        VStack(alignment: .leading, spacing: 13) {
            TextField("Online name", text: $name).textFieldStyle(.roundedBorder)
            Picker("Lobby action", selection: $joining) { Text("Host").tag(false); Text("Join").tag(true) }.pickerStyle(.segmented)
            if joining {
                TextField("Six-character lobby code", text: $joinCode).textFieldStyle(.roundedBorder)
                Button("Join lobby") { game.connectOnline(server: server, name: name, players: players, mode: mode, code: joinCode) }
                    .buttonStyle(.borderedProminent).disabled(game.busy || joinCode.trimmingCharacters(in: .whitespaces).count != 6)
            } else {
                Picker("Total seats", selection: $players) { ForEach(2...4, id: \.self) { Text("\($0) players").tag($0) } }
                Picker("Online game mode", selection: $mode) { Text("Skirmish").tag("skirmish"); Text("Campaign").tag("campaign") }.pickerStyle(.segmented)
                Button("Host lobby") { game.connectOnline(server: server, name: name, players: players, mode: mode) }.buttonStyle(.borderedProminent).disabled(game.busy)
                Text("Invite friends with your lobby code. Empty seats become bots when you start.").font(.caption).foregroundStyle(.secondary)
            }
            DisclosureGroup("Game server") { TextField("Server address", text: $server).textFieldStyle(.roundedBorder).font(.caption) }
            if game.hasSavedOnline {
                Button("Resume online session") { game.resumeOnline() }.disabled(game.busy)
            }
            Text("Online games need a connection. Your reconnect credential is stored in Mac Keychain.").font(.caption).foregroundStyle(.secondary)
        }
    }
}

struct OnlineLobbyView: View {
    @EnvironmentObject var game: GameModel
    @State private var copied = false
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            HStack { Text("ONLINE LOBBY").font(.title2.bold()); Spacer(); Button("Menu") { game.returnToMenu() }.disabled(game.busy) }
            if let snapshot = game.onlineSnapshot {
                HStack {
                    Text(snapshot.lobby.joinCode).font(.system(size: 36, weight: .bold, design: .monospaced)).textSelection(.enabled)
                    Button(copied ? "Copied" : "Copy code") { NSPasteboard.general.clearContents(); NSPasteboard.general.setString(snapshot.lobby.joinCode, forType: .string); copied = true }
                    Spacer()
                    Text(snapshot.lobby.matchMode.capitalized)
                }
                ForEach(snapshot.lobby.players) { player in
                    HStack {
                        Image(systemName: player.role == "bot" ? "cpu" : "person.fill")
                        Text(player.playerName)
                        if player.isHost { Text("HOST").font(.caption).foregroundStyle(.secondary) }
                        Spacer()
                        Label(player.isReady ? "Ready" : "Not ready", systemImage: player.isReady ? "checkmark.circle.fill" : "circle").foregroundStyle(player.isReady ? .green : .secondary)
                    }
                }
                Text("\(snapshot.lobby.playerCount - snapshot.lobby.players.count) open seat(s) will be filled by bots at start.").font(.caption).foregroundStyle(.secondary)
                HStack {
                    let ready = snapshot.lobby.players.first { $0.playerId == snapshot.viewerPlayerId }?.isReady ?? false
                    Button(ready ? "Not ready" : "I'm ready") { game.setOnlineReady(!ready) }.disabled(game.busy || !game.onlineConnected)
                    if snapshot.isHost {
                        Button("Start match") { game.startOnlineMatch() }.buttonStyle(.borderedProminent)
                            .disabled(game.busy || !game.onlineConnected || !snapshot.lobby.players.filter { $0.role == "human" }.allSatisfy(\.isReady))
                    } else { Text("The host starts when everyone is ready.").font(.caption).foregroundStyle(.secondary) }
                }
            }
            if game.busy { ProgressView() }
            if let error = game.error { Text(error).foregroundStyle(.orange).textSelection(.enabled) }
            if !game.onlineConnected { Button("Reconnect") { game.reconnectOnline() }.disabled(game.busy) }
            Text("Closing the app preserves your reconnect credential. Server restarts may end an in-memory match.").font(.caption).foregroundStyle(.secondary)
        }.padding(32).frame(width: 650).background(Color.black.opacity(0.7), in: RoundedRectangle(cornerRadius: 20))
    }
}
