// Renders the 1024×1024 app icon: a white squiggle of speech running into a gold coin, on indigo.
// Usage: swift scripts/make-icon.swift FireflyPico/Assets.xcassets/AppIcon.appiconset/AppIcon.png
import AppKit

let size = 1024
let output = URL(fileURLWithPath: CommandLine.arguments[1])
let space = CGColorSpaceCreateDeviceRGB()
// No alpha channel: App Store icons must be opaque.
let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
                    space: space, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!

func color(_ hex: UInt32) -> CGColor {
    CGColor(red: CGFloat(hex >> 16 & 0xFF) / 255, green: CGFloat(hex >> 8 & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
}

// Draw with y pointing down, so the coordinates below read top to bottom.
ctx.translateBy(x: 0, y: CGFloat(size))
ctx.scaleBy(x: 1, y: -1)

let gradient = CGGradient(colorsSpace: space, colors: [color(0x5A4EE3), color(0x3D31BE)] as CFArray,
                          locations: [0, 1])!
ctx.drawLinearGradient(gradient, start: .zero, end: CGPoint(x: 0, y: size), options: [])

// The ramble: waves of uneven height, with flat tops and bottoms, whose tail points at the coin.
let ramble = CGMutablePath()
ramble.move(to: CGPoint(x: 140, y: 580))
ramble.addCurve(to: CGPoint(x: 230, y: 450), control1: CGPoint(x: 160, y: 510), control2: CGPoint(x: 190, y: 450))
ramble.addCurve(to: CGPoint(x: 330, y: 620), control1: CGPoint(x: 280, y: 450), control2: CGPoint(x: 280, y: 620))
ramble.addCurve(to: CGPoint(x: 440, y: 380), control1: CGPoint(x: 385, y: 620), control2: CGPoint(x: 385, y: 380))
ramble.addCurve(to: CGPoint(x: 540, y: 640), control1: CGPoint(x: 490, y: 380), control2: CGPoint(x: 490, y: 640))
ramble.addCurve(to: CGPoint(x: 610, y: 545), control1: CGPoint(x: 565, y: 640), control2: CGPoint(x: 565, y: 563))
ctx.addPath(ramble)
ctx.setStrokeColor(color(0xFFFFFF))
ctx.setLineWidth(54)
ctx.setLineCap(.round)
ctx.setLineJoin(.round)
ctx.strokePath()

let coin = CGPoint(x: 770, y: 500)
ctx.setFillColor(color(0xFDD20E))
ctx.fillEllipse(in: CGRect(x: coin.x - 120, y: coin.y - 120, width: 240, height: 240))
ctx.setStrokeColor(color(0xF7941D))
ctx.setLineWidth(24)
ctx.strokeEllipse(in: CGRect(x: coin.x - 72, y: coin.y - 72, width: 144, height: 144))

try! NSBitmapImageRep(cgImage: ctx.makeImage()!).representation(using: .png, properties: [:])!.write(to: output)
