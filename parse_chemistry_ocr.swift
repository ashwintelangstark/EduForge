import Foundation
import Vision
import AppKit

struct TextBlock {
    let text: String
    let box: CGRect
}

func parseImage(imagePath: String, fileIndex: Int) {
    guard let image = NSImage(contentsOfFile: imagePath),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        return
    }

    var blocks: [TextBlock] = []

    let request = VNRecognizeTextRequest { (req, err) in
        guard let observations = req.results as? [VNRecognizedTextObservation] else { return }
        for obs in observations {
            guard let topCandidate = obs.topCandidates(1).first else { continue }
            blocks.append(TextBlock(text: topCandidate.string, box: obs.boundingBox))
        }
    }
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try? handler.perform([request])

    let leftBlocks = blocks.filter { $0.box.origin.x < 0.51 }.sorted(by: { $0.box.origin.y > $1.box.origin.y })
    let rightBlocks = blocks.filter { $0.box.origin.x >= 0.51 }.sorted(by: { $0.box.origin.y > $1.box.origin.y })

    print("=== PAGE \(fileIndex): \(URL(fileURLWithPath: imagePath).lastPathComponent) ===")
    print("--- LEFT COLUMN ---")
    for b in leftBlocks {
        print(b.text)
    }
    print("--- RIGHT COLUMN ---")
    for b in rightBlocks {
        print(b.text)
    }
    print("\n")
}

let files = FileManager.default.enumerator(atPath: "raw_chemistry_questions")?.allObjects as? [String] ?? []
let imageFiles = files.filter { $0.hasSuffix(".jpeg") || $0.hasSuffix(".jpg") || $0.hasSuffix(".png") }.sorted()

for (idx, file) in imageFiles.enumerated() {
    parseImage(imagePath: "raw_chemistry_questions/\(file)", fileIndex: idx + 1)
}
