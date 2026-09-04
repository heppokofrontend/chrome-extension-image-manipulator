// QAフィクスチャ用のダミー画像をゼロから生成するスクリプト。
// ImageMagick/PillowがローカルにないためNode標準のzlibだけでPNGを自作し、
// JPEG/GIF/WebPはsips(macOS標準)でPNGから変換する。
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const outDir = path.join(import.meta.dirname, 'images');
mkdirSync(outDir, { recursive: true });

// --- CRC32 (PNG chunk用。Node標準zlibにcrc32が無いため自前実装) ---
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// pixelFn(x, y) -> [r,g,b,a] (0-255)。RGBA固定でシンプルにする。
function encodePNG(width, height, pixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const px = rowStart + 1 + x * 4;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = a;
    }
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function solid(r, g, b, a = 255) {
  return () => [r, g, b, a];
}

function checkerboard(size, c1, c2) {
  return (x, y) => ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0 ? c1 : c2);
}

function gradient(w, h) {
  return (x, y) => {
    const r = Math.floor((x / (w - 1)) * 255);
    const g = Math.floor((y / (h - 1)) * 255);
    return [r, g, 180, 255];
  };
}

const files = [];
function save(name, buf) {
  writeFileSync(path.join(outDir, name), buf);
  files.push(name);
}

// 1. 通常のopaque photo風(グラデーション) -> JPEG化のソース (16:9)
save('photo-source.png', encodePNG(960, 540, gradient(960, 540)));

// 2. 4:3比率
save('ratio-4x3.png', encodePNG(800, 600, gradient(800, 600)));

// 3. 正方形 1:1
save('square.png', encodePNG(400, 400, solid(90, 170, 220)));

// 4. 透明PNG(市松のアルファでチェック模様、背景色チェック用)
save(
  'transparent-check.png',
  encodePNG(300, 300, (x, y) => {
    const onTile = (Math.floor(x / 30) + Math.floor(y / 30)) % 2 === 0;
    return onTile ? [230, 60, 90, 255] : [0, 0, 0, 0];
  }),
);

// 5. ピクセルアート風の極小画像(拡大してrender-mode比較用) 8x8
const PALETTE = [
  [237, 28, 36, 255],
  [255, 255, 255, 255],
  [0, 0, 0, 255],
  [255, 201, 14, 255],
];
save(
  'pixelart.png',
  encodePNG(8, 8, (x, y) => PALETTE[(x + y) % PALETTE.length]),
);

// 6. 1x1 極小画像(トラッキングピクセル、透明)
save(
  'tracking-pixel.png',
  encodePNG(1, 1, () => [0, 0, 0, 0]),
);

// 7. 極大画像(>8000px、単色にしてファイルサイズを抑える)
save('huge.png', encodePNG(8200, 40, solid(50, 200, 120)));

// 8. background-image(inline style)用
save(
  'bg-inline.png',
  encodePNG(640, 360, checkerboard(40, [60, 90, 200, 255], [30, 45, 100, 255])),
);

// 9. background-image(外部stylesheet/class経由、非マッチ確認用)
save('bg-class.png', encodePNG(640, 360, checkerboard(40, [200, 90, 60, 255], [100, 45, 30, 255])));

// 10. GIF/WebP/JPEG変換元(シンプルな単色+模様)
save(
  'convert-source.png',
  encodePNG(320, 240, checkerboard(20, [20, 160, 130, 255], [250, 250, 250, 255])),
);

// 11. lazy-load確認用(下にスクロールして読み込ませる)
save('lazy-target.png', encodePNG(500, 300, solid(160, 60, 220)));

console.log('PNG generated:', files.join(', '));

// --- sips で PNG から JPEG/GIF/WebP へ変換 ---
function convert(srcName, destName, format) {
  const src = path.join(outDir, srcName);
  const dest = path.join(outDir, destName);
  execFileSync('sips', ['-s', 'format', format, src, '--out', dest], { stdio: 'pipe' });
  console.log('converted:', destName);
}

convert('photo-source.png', 'photo.jpg', 'jpeg');
convert('convert-source.png', 'photo.gif', 'gif');
try {
  convert('convert-source.png', 'photo.webp', 'webp');
} catch (e) {
  console.warn('WebP conversion failed (sips may not support it on this OS version):', e.message);
}
