import { describe, expect, it } from 'vitest';

import {
  convertedImgToSVGMap,
  convertedSvgMap,
  convertSVGToImg,
} from '@/contexts/content-scripts/utils/convert-svg-to-img';

describe('convertSVGToImg', () => {
  it('builds a pseudo image encoding the svg markup as a data URL', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svg);

    const pseudo = convertSVGToImg(svg);

    expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    expect(pseudo.src.startsWith('data:image/svg+xml,')).toBe(true);
    expect(convertedSvgMap.get(svg)).toBe(pseudo);
    expect(convertedImgToSVGMap.get(pseudo)).toBe(svg);
  });

  it('reuses the cached pseudo image and refreshes its src on repeated calls for the same svg', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svg);

    const first = convertSVGToImg(svg);
    const beforeAppendSrc = first.src;

    svg.setAttribute('viewBox', '0 0 10 10');
    const second = convertSVGToImg(svg);

    expect(second).toBe(first);
    expect(second.src).not.toBe(beforeAppendSrc);
  });
});
