import AppKit
import Foundation

struct SheetConfig {
  let inputName: String
  let outputPrefix: String
  let outputFolder: String
  let columns: Int
  let rows: Int
  let rowBoundaries: [Int]?
}

struct CropOverride: Decodable {
  let sourceSheet: String
  let x: Int
  let y: Int
  let width: Int
  let height: Int
}

typealias NameOverrides = [String: String]

let fileManager = FileManager.default
let rootURL = URL(fileURLWithPath: fileManager.currentDirectoryPath)
let cropOverridesURL = rootURL.appendingPathComponent("assets/cards/play/crop-overrides.json")
let nameOverridesURL = rootURL.appendingPathComponent("assets/cards/play/card-name-overrides.json")

let playRowBoundaries = [0, 130, 260, 390, 530, 660, 800]

let configs: [SheetConfig] = [
  SheetConfig(inputName: "Playcards1.webp", outputPrefix: "playcards1", outputFolder: "assets/cards/play", columns: 3, rows: 6, rowBoundaries: playRowBoundaries),
  SheetConfig(inputName: "Playcards2.webp", outputPrefix: "playcards2", outputFolder: "assets/cards/play", columns: 3, rows: 6, rowBoundaries: playRowBoundaries),
  SheetConfig(inputName: "Playcards3.webp", outputPrefix: "playcards3", outputFolder: "assets/cards/play", columns: 3, rows: 6, rowBoundaries: playRowBoundaries),
  SheetConfig(inputName: "Playcards4.webp", outputPrefix: "playcards4", outputFolder: "assets/cards/play", columns: 3, rows: 6, rowBoundaries: playRowBoundaries),
  SheetConfig(inputName: "Playcards5.webp", outputPrefix: "playcards5", outputFolder: "assets/cards/play", columns: 3, rows: 6, rowBoundaries: playRowBoundaries),
  SheetConfig(inputName: "PLaycards6.webp", outputPrefix: "playcards6", outputFolder: "assets/cards/play", columns: 3, rows: 6, rowBoundaries: playRowBoundaries),
  SheetConfig(inputName: "ships1.webp", outputPrefix: "ships1", outputFolder: "assets/cards/ships", columns: 3, rows: 6, rowBoundaries: nil),
  SheetConfig(inputName: "Ships2.webp", outputPrefix: "ships2", outputFolder: "assets/cards/ships", columns: 3, rows: 6, rowBoundaries: nil),
  SheetConfig(inputName: "SHips3.webp", outputPrefix: "ships3", outputFolder: "assets/cards/ships", columns: 3, rows: 6, rowBoundaries: nil)
]

enum SliceError: Error {
  case imageLoadFailed(String)
  case cgImageUnavailable(String)
  case cropFailed(String)
  case pngEncodeFailed(String)
}

func roundedBoundary(_ index: Int, total: Int, limit: Int) -> Int {
  Int((Double(index) / Double(total) * Double(limit)).rounded())
}

func writePNG(_ image: CGImage, to url: URL) throws {
  let representation = NSBitmapImageRep(cgImage: image)
  guard let data = representation.representation(using: .png, properties: [:]) else {
    throw SliceError.pngEncodeFailed(url.path)
  }
  try data.write(to: url)
}

func loadCropOverrides() throws -> [String: CropOverride] {
  guard fileManager.fileExists(atPath: cropOverridesURL.path) else {
    return [:]
  }

  let data = try Data(contentsOf: cropOverridesURL)
  return try JSONDecoder().decode([String: CropOverride].self, from: data)
}

func loadNameOverrides() throws -> NameOverrides {
  guard fileManager.fileExists(atPath: nameOverridesURL.path) else {
    return [:]
  }

  let data = try Data(contentsOf: nameOverridesURL)
  return try JSONDecoder().decode(NameOverrides.self, from: data)
}

func rowBounds(for config: SheetConfig, imageHeight: Int) -> [Int] {
  if let boundaries = config.rowBoundaries {
    return boundaries
  }

  return (0...config.rows).map { roundedBoundary($0, total: config.rows, limit: imageHeight) }
}

func sliceSheet(
  _ config: SheetConfig,
  overrides: [String: CropOverride],
  nameOverrides: NameOverrides
) throws {
  let inputURL = rootURL.appendingPathComponent(config.inputName)
  guard let image = NSImage(contentsOf: inputURL) else {
    throw SliceError.imageLoadFailed(config.inputName)
  }

  guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    throw SliceError.cgImageUnavailable(config.inputName)
  }

  let width = cgImage.width
  let height = cgImage.height
  let yBounds = rowBounds(for: config, imageHeight: height)
  let outputURL = rootURL.appendingPathComponent(config.outputFolder, isDirectory: true)
  try fileManager.createDirectory(at: outputURL, withIntermediateDirectories: true)

  for row in 0..<config.rows {
    for column in 0..<config.columns {
      let x0 = roundedBoundary(column, total: config.columns, limit: width)
      let x1 = roundedBoundary(column + 1, total: config.columns, limit: width)
      let yTop = yBounds[row]
      let yBottom = yBounds[row + 1]
      let cropRect = CGRect(
        x: x0,
        y: yTop,
        width: x1 - x0,
        height: yBottom - yTop
      )

      guard let cropped = cgImage.cropping(to: cropRect) else {
        throw SliceError.cropFailed("\(config.inputName) row \(row + 1) column \(column + 1)")
      }

      let filename = "\(config.outputPrefix)_r\(row + 1)_c\(column + 1).png"
      let finalImage: CGImage

      if let override = overrides[filename], override.sourceSheet == config.inputName {
        let overrideRect = CGRect(
          x: override.x,
          y: override.y,
          width: override.width,
          height: override.height
        )
        guard let overrideCrop = cgImage.cropping(to: overrideRect) else {
          throw SliceError.cropFailed("\(config.inputName) override for \(filename)")
        }
        finalImage = overrideCrop
      } else {
        finalImage = cropped
      }

      let defaultOutputURL = outputURL.appendingPathComponent(filename)
      try writePNG(finalImage, to: defaultOutputURL)

      if config.outputFolder == "assets/cards/play", let semanticName = nameOverrides[filename] {
        let namedFolderURL = outputURL.appendingPathComponent("named", isDirectory: true)
        try fileManager.createDirectory(at: namedFolderURL, withIntermediateDirectories: true)
        try writePNG(finalImage, to: namedFolderURL.appendingPathComponent(semanticName))
      }
    }
  }
}

do {
  let overrides = try loadCropOverrides()
  let nameOverrides = try loadNameOverrides()
  for config in configs {
    try sliceSheet(config, overrides: overrides, nameOverrides: nameOverrides)
    print("Sliced \(config.inputName) into \(config.rows * config.columns) cards.")
  }
  print("Done.")
} catch {
  fputs("Error: \(error)\n", stderr)
  exit(1)
}
