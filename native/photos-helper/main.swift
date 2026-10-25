import Foundation

private let maxMessageBytes = 512 * 1024
private let maxImageBytes = 84 * 1024 * 1024
private let input = FileHandle.standardInput
private let output = FileHandle.standardOutput

private func readExactly(_ count: Int) throws -> Data? {
    var result = Data()
    while result.count < count {
        guard let part = try input.read(upToCount: count - result.count), !part.isEmpty else {
            if result.isEmpty { return nil }
            throw HelperError("Incomplete native message")
        }
        result.append(part)
    }
    return result
}

private func readMessage() throws -> [String: Any]? {
    guard let header = try readExactly(4) else { return nil }
    let length = header.enumerated().reduce(UInt32(0)) { value, byte in
        value | (UInt32(byte.element) << (8 * byte.offset))
    }
    guard length > 0, length <= maxMessageBytes else { throw HelperError("Invalid message size") }
    guard let body = try readExactly(Int(length)),
          let object = try JSONSerialization.jsonObject(with: body) as? [String: Any] else {
        throw HelperError("Invalid message")
    }
    return object
}

private func send(_ object: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: object) else { return }
    var length = UInt32(data.count).littleEndian
    do {
        try withUnsafeBytes(of: &length) { try output.write(contentsOf: $0) }
        try output.write(contentsOf: data)
    } catch {
        // Chrome closed the port.
    }
}

private struct HelperError: LocalizedError {
    let message: String
    init(_ message: String) { self.message = message }
    var errorDescription: String? { message }
}

private final class ImportSession {
    private var format: String?
    private var stagingURL: URL?
    private var file: FileHandle?
    private var nextIndex = 0
    private var byteCount = 0

    func receive(_ message: [String: Any]) throws -> [String: Any] {
        switch message["type"] as? String {
        case "start":
            guard format == nil, let requested = message["format"] as? String,
                  requested == "png" || requested == "jpeg" else {
                throw HelperError("Invalid image format")
            }
            let directory = FileManager.default.homeDirectoryForCurrentUser
                .appendingPathComponent("Pictures/M.Card Imports", isDirectory: true)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let url = directory.appendingPathComponent(".incoming-\(UUID().uuidString)")
            guard FileManager.default.createFile(atPath: url.path, contents: nil) else {
                throw HelperError("Cannot create image file")
            }
            file = try FileHandle(forWritingTo: url)
            stagingURL = url
            format = requested
            return ["type": "ready"]

        case "chunk":
            guard let file, let encoded = message["data"] as? String,
                  let index = message["index"] as? Int, index == nextIndex,
                  encoded.count <= 256 * 1024,
                  let bytes = Data(base64Encoded: encoded), !bytes.isEmpty,
                  byteCount + bytes.count <= maxImageBytes else {
                throw HelperError("Invalid or oversized image chunk")
            }
            try file.write(contentsOf: bytes)
            byteCount += bytes.count
            nextIndex += 1
            return ["type": "chunk", "index": index]

        case "end":
            guard let stagingURL, let format, byteCount > 0 else {
                throw HelperError("No image to import")
            }
            try file?.close()
            file = nil
            let header = try Data(contentsOf: stagingURL, options: .mappedIfSafe).prefix(8)
            let pngHeader: [UInt8] = [137, 80, 78, 71, 13, 10, 26, 10]
            let jpegHeader: [UInt8] = [255, 216, 255]
            guard (format == "png" && header.elementsEqual(pngHeader)) ||
                  (format == "jpeg" && header.prefix(3).elementsEqual(jpegHeader)) else {
                throw HelperError("Generated data is not a valid \(format.uppercased()) image")
            }
            let destination = stagingURL.deletingLastPathComponent()
                .appendingPathComponent("m-card-\(UUID().uuidString).\(format == "png" ? "png" : "jpg")")
            try FileManager.default.moveItem(at: stagingURL, to: destination)
            self.stagingURL = nil
            try importToPhotos(destination)
            return ["type": "result", "message": "Saved to the M.Card album in Photos"]

        default:
            throw HelperError("Unknown Photos request")
        }
    }

    private func importToPhotos(_ imageURL: URL) throws {
        let scriptURL = URL(fileURLWithPath: CommandLine.arguments[0])
            .deletingLastPathComponent().appendingPathComponent("PhotosImport.applescript")
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
        process.arguments = [scriptURL.path, imageURL.path]
        let errorPipe = Pipe()
        // Native Messaging owns stdout; AppleScript output would corrupt its framed replies.
        process.standardOutput = FileHandle.nullDevice
        process.standardError = errorPipe
        try process.run()
        process.waitUntilExit()
        if process.terminationStatus != 0 {
            let detail = String(data: errorPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8)?
                .trimmingCharacters(in: .whitespacesAndNewlines) ?? "Photos import failed"
            throw HelperError("\(detail). Image retained at \(imageURL.path)")
        }
    }

    func cancel() {
        try? file?.close()
        file = nil
        if let stagingURL { try? FileManager.default.removeItem(at: stagingURL) }
        stagingURL = nil
    }

    deinit { cancel() }
}

private let session = ImportSession()
while true {
    do {
        guard let message = try readMessage() else { break }
        send(try session.receive(message))
    } catch {
        send(["type": "error", "message": error.localizedDescription])
        break
    }
}
session.cancel()
