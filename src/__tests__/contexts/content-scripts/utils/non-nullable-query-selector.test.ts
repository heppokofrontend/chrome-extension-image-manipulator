import { afterEach, describe, expect, it } from 'vitest';

import { nonNullableQuerySelector } from '@/contexts/content-scripts/utils/non-nullable-query-selector';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('nonNullableQuerySelector', () => {
  it('returns the matched element when the selector finds one', () => {
    const div = document.createElement('div');
    div.id = 'target';
    document.body.appendChild(div);

    expect(nonNullableQuerySelector<HTMLDivElement>('#target')).toBe(div);
  });

  it('searches within the given root when one is provided', () => {
    const root = document.createElement('div');
    const child = document.createElement('span');
    child.id = 'target';
    root.appendChild(child);
    document.body.appendChild(root);

    expect(nonNullableQuerySelector<HTMLSpanElement>('#target', root)).toBe(child);
  });

  it('throws when no element matches the selector', () => {
    expect(() => {
      nonNullableQuerySelector('#does-not-exist');
    }).toThrow('Required element not found for selector: #does-not-exist');
  });
});
