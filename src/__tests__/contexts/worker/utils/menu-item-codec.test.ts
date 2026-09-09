import { describe, expect, it } from 'vitest';

import {
  formatRotateMenuId,
  formatScaleMenuId,
  parseRotateMenuId,
  parseScaleMenuId,
} from '@/contexts/worker/utils';

describe('scale menu id round-trip', () => {
  it.each([0, 25, 100, 150, 300])('parses back the value formatted for %i', (percent) => {
    expect(parseScaleMenuId(formatScaleMenuId(percent))).toBe(percent);
  });

  it('does not parse a rotate menu id as a scale value', () => {
    expect(parseScaleMenuId(formatRotateMenuId(90))).toBeNull();
  });
});

describe('rotate menu id round-trip', () => {
  it.each([0, 45, 90, 180, 315, 360])('parses back the value formatted for %i', (deg) => {
    expect(parseRotateMenuId(formatRotateMenuId(deg))).toBe(deg);
  });

  it('does not parse a scale menu id as a rotate value', () => {
    expect(parseRotateMenuId(formatScaleMenuId(150))).toBeNull();
  });
});
