import AppKit
import Foundation
import PDFKit

struct RendererError: Error, CustomStringConvertible {
  let description: String
}

func fail(_ message: String) throws -> Never {
  throw RendererError(description: message)
}

let arguments = CommandLine.arguments
guard arguments.count >= 3 else {
  fputs("Usage: swift scripts/render_pdf_pages.swift <input.pdf> <output-dir> [max-dimension]\n", stderr)
  exit(1)
}

let inputPath = arguments[1]
let outputDirectory = arguments[2]
let maxDimension = arguments.count >= 4 ? Int(arguments[3]) ?? 2200 : 2200

let inputURL = URL(fileURLWithPath: inputPath)
let outputURL = URL(fileURLWithPath: outputDirectory, isDirectory: true)
let fileManager = FileManager.default

guard fileManager.fileExists(atPath: inputURL.path) else {
  try fail("Input PDF not found at \(inputURL.path)")
}

try fileManager.createDirectory(at: outputURL, withIntermediateDirectories: true)

guard let document = PDFDocument(url: inputURL) else {
  try fail("Could not open PDF document.")
}

let pageCount = document.pageCount
guard pageCount > 0 else {
  try fail("PDF contains no pages.")
}

for index in 0..<pageCount {
  guard let page = document.page(at: index) else {
    continue
  }

  let mediaBox = page.bounds(for: .mediaBox)
  let scale = min(
    CGFloat(maxDimension) / max(mediaBox.width, 1),
    CGFloat(maxDimension) / max(mediaBox.height, 1)
  )

  let renderSize = NSSize(
    width: max(1, floor(mediaBox.width * scale)),
    height: max(1, floor(mediaBox.height * scale))
  )

  guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: Int(renderSize.width),
    pixelsHigh: Int(renderSize.height),
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 32
  ) else {
    try fail("Unable to create bitmap image for page \(index + 1).")
  }

  guard let context = NSGraphicsContext(bitmapImageRep: bitmap)?.cgContext else {
    try fail("Unable to create drawing context for page \(index + 1).")
  }

  context.interpolationQuality = .high
  context.setFillColor(NSColor.white.cgColor)
  context.fill(CGRect(origin: .zero, size: renderSize))
  context.saveGState()
  context.translateBy(x: 0, y: renderSize.height)
  context.scaleBy(x: scale, y: -scale)
  page.draw(with: .mediaBox, to: context)
  context.restoreGState()

  guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
    try fail("Could not encode rendered page \(index + 1) as PNG.")
  }

  let filename = String(format: "rules-page-%02d.png", index + 1)
  let destination = outputURL.appendingPathComponent(filename)
  try pngData.write(to: destination)
  print("Rendered \(filename)")
}
