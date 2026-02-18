/**
 * generate-icons.js
 * Creates simple PNG icons (16, 48, 128px) using raw PNG encoding.
 * No external dependencies — uses only Node.js built-ins.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size) {
    // We'll draw a dark background with a white "₹" character
    // Since we can't render fonts easily, we'll create a solid colored square
    // with a simple geometric design: dark bg + green circle + white car shape

    const width = size;
    const height = size;

    // Create pixel data (RGBA)
    const pixels = Buffer.alloc(width * height * 4);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const cx = width / 2;
            const cy = height / 2;
            const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            const maxR = width * 0.45;

            // Background: very dark
            let R = 10, G = 10, B = 10, A = 255;

            // Green circle
            if (r < maxR) {
                R = 34; G = 197; B = 94; // #22c55e
            }

            // White inner circle (car body)
            const innerR = width * 0.28;
            if (r < innerR) {
                R = 255; G = 255; B = 255;
            }

            // Dark center dot (₹ symbol approximation)
            const dotR = width * 0.12;
            if (r < dotR) {
                R = 10; G = 10; B = 10;
            }

            pixels[idx] = R;
            pixels[idx + 1] = G;
            pixels[idx + 2] = B;
            pixels[idx + 3] = A;
        }
    }

    return encodePNG(width, height, pixels);
}

function encodePNG(width, height, pixels) {
    // PNG signature
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 2;  // color type: RGB (we'll strip alpha)
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    // Build raw image data with filter bytes
    const raw = Buffer.alloc(height * (1 + width * 3));
    for (let y = 0; y < height; y++) {
        raw[y * (1 + width * 3)] = 0; // filter type: None
        for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const dstIdx = y * (1 + width * 3) + 1 + x * 3;
            raw[dstIdx] = pixels[srcIdx];
            raw[dstIdx + 1] = pixels[srcIdx + 1];
            raw[dstIdx + 2] = pixels[srcIdx + 2];
        }
    }

    const compressed = zlib.deflateSync(raw);

    function makeChunk(type, data) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const typeB = Buffer.from(type, 'ascii');
        const crcData = Buffer.concat([typeB, data]);
        const crc = crc32(crcData);
        const crcB = Buffer.alloc(4);
        crcB.writeUInt32BE(crc >>> 0, 0);
        return Buffer.concat([len, typeB, data, crcB]);
    }

    const ihdrChunk = makeChunk('IHDR', ihdr);
    const idatChunk = makeChunk('IDAT', compressed);
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        t[i] = c;
    }
    return t;
})();

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

[16, 48, 128].forEach(size => {
    const png = createPNG(size);
    const outPath = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(outPath, png);
    console.log(`Created ${outPath} (${png.length} bytes)`);
});

console.log('Icons generated successfully!');
