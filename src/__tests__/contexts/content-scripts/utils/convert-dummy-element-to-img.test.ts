import { describe, expect, it } from 'vitest';

import {
  convertDummyElementToImg,
  convertedDummyMap,
  convertedImgToDummyMap,
} from '@/contexts/content-scripts/utils/convert-dummy-element-to-img';

const nonNullable = <T>(value: T | null | undefined) =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- テストが直前に生成した値を参照するだけなので、null/undefined なら例外でテスト失敗すれば十分
  value!;

describe('convertDummyElementToImg', () => {
  it('returns null when the element has no background image', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    expect(convertDummyElementToImg(div)).toBeNull();
  });

  it('builds and caches a pseudo image sourced from the background image', () => {
    const div = document.createElement('div');
    div.style.backgroundImage = 'url("https://example.com/foo.png")';
    document.body.appendChild(div);

    const pseudo = convertDummyElementToImg(div);

    expect(pseudo).not.toBeNull();
    expect(pseudo?.src).toBe('https://example.com/foo.png');
    expect(convertedDummyMap.get(div)).toBe(pseudo);
    expect(convertedImgToDummyMap.get(nonNullable(pseudo))).toBe(div);
  });

  it('returns the cached pseudo image on subsequent calls for the same element', () => {
    const div = document.createElement('div');
    div.style.backgroundImage = 'url("https://example.com/bar.png")';
    document.body.appendChild(div);

    const first = convertDummyElementToImg(div);
    const second = convertDummyElementToImg(div);

    expect(second).toBe(first);
  });
});
