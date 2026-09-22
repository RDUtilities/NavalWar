import AppKit
import AVFoundation
@main struct AudioAssetTests {
    static func main() throws {
        let root = URL(fileURLWithPath: CommandLine.arguments[1])
        let names = try JSONDecoder().decode([String].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2])))
        precondition(Set(names) == Set(GameAudio.webSounds), "Native catalog differs from web sound catalog")
        for name in names {
            let url = root.appendingPathComponent("Audio/\(name).wav")
            let file = try AVAudioFile(forReading: url)
            precondition(file.length > 0)
            let audio = NSSound(contentsOf: url, byReference:false)!
            precondition(audio.play(), "Playback rejected: \(name)")
            Thread.sleep(forTimeInterval: 0.08)
            precondition(audio.isPlaying, "Playback did not start: \(name)")
            audio.stop()
        }
        print("PASS: all \(names.count) web sounds decode with audio frames and start native playback.")
    }
}
