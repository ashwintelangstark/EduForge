import os
import glob
import json
import subprocess

ocr_swift_script = '''
import Foundation
import Vision
import AppKit

func processImage(imagePath: String) {
    guard let img = NSImage(contentsOfFile: imagePath),
          let cgImg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        print("Failed to load image: \(imagePath)")
        return
    }
    
    let requestHandler = VNImageRequestHandler(cgImage: cgImg, options: [:])
    let request = VNRecognizeTextRequest { request, error in
        guard let observations = request.results as? [VNRecognizedTextObservation], error == nil else {
            return
        }
        
        var results: [[String: Any]] = []
        for obs in observations {
            guard let topCandidate = obs.topCandidates(1).first else { continue }
            let bbox = obs.boundingBox
            results.append([
                "text": topCandidate.string,
                "confidence": topCandidate.confidence,
                "x": bbox.origin.x,
                "y": bbox.origin.y,
                "w": bbox.size.width,
                "h": bbox.size.height
            ])
        }
        
        if let jsonData = try? JSONSerialization.data(withJSONObject: results, options: .prettyPrinted),
           let jsonStr = String(data: jsonData, encoding: .utf8) {
            print(jsonStr)
        }
    }
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    
    try? requestHandler.perform([request])
}

let args = CommandLine.arguments
if args.count > 1 {
    processImage(imagePath: args[1])
}
'''

with open('ocr_runner.swift', 'w') as f:
    f.write(ocr_swift_script)

print("Created ocr_runner.swift")
