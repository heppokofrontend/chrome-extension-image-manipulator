// 画像リストは8列グリッド(IMAGE_LIST_COLS)なので、
// 列数の境界(丁度8の倍数/前後)をまたぐ枚数のページをまとめて生成する。
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const POOL = ['photo.jpg', 'square.png', 'ratio-4x3.png', 'transparent-check.png', 'pixelart.png'];

function page(count) {
  const imgs = Array.from({ length: count }, (_, i) => {
    const src = POOL[i % POOL.length];
    // 画像リストは src の一致で重複排除されるため、プールを使い回すだけだと
    // 全ページが常に POOL.length 件に収束し境界テストが成立しない。
    // クエリを付けて src を一意化し、実際に count 件のエントリになるようにする。
    return `  <img src="images/${src}?i=${i + 1}" alt="grid item ${i + 1}" width="120" />`;
  }).join('\n');

  const boundary =
    count % 8 === 0
      ? 'exactly a multiple of 8'
      : count % 8 === 1
        ? 'one over a multiple, wraps'
        : count < 8
          ? 'under 8'
          : 'a partial row';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>QA: grid-${count}</title>
<style>
  body { font-family: sans-serif; max-width: 900px; margin: 2rem auto; }
  .grid img { margin: 4px; }
</style>
</head>
<body>
<p><a href="index.html">&larr; index</a></p>
<h1>QA: ${count} images (8-column grid boundary check)</h1>
<p>README.md §10: ${count} images against IMAGE_LIST_COLS=8 (${boundary}). Confirm the image list wraps correctly.</p>
<div class="grid">
${imgs}
</div>
</body>
</html>
`;
}

const outDir = import.meta.dirname;
for (const count of [7, 8, 9, 16]) {
  writeFileSync(path.join(outDir, `grid-${count}.html`), page(count));
  console.log(`grid-${count}.html`);
}
