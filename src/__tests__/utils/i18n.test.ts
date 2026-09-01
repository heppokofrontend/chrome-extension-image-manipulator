import { afterEach, describe, expect, it, vi } from 'vitest';

const stubChromeI18n = (getMessage: (key: string, substitutions?: string | string[]) => string) => {
  vi.stubGlobal('chrome', { i18n: { getMessage } });
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('getMessage', () => {
  it('passes substitutions through when called with a string/array second argument', async () => {
    const getMessageMock = vi.fn(() => 'translated');
    stubChromeI18n(getMessageMock);
    const { getMessage } = await import('@/utils/i18n');

    const result = getMessage('greeting', ['World']);

    expect(result).toBe('translated');
    expect(getMessageMock).toHaveBeenCalledWith('greeting', ['World']);
  });

  it('treats an options object passed as the second argument as options, not substitutions', async () => {
    const getMessageMock = vi.fn(() => '');
    stubChromeI18n(getMessageMock);
    const { getMessage } = await import('@/utils/i18n');

    const result = getMessage('optional_message', { isEmptyAllowed: true });

    expect(result).toBe('');
    expect(getMessageMock).toHaveBeenCalledWith('optional_message', undefined);
  });

  it('throws when the resolved message is empty and isEmptyAllowed was not set', async () => {
    stubChromeI18n(() => '');
    const { getMessage } = await import('@/utils/i18n');

    expect(() => {
      getMessage('missing_key');
    }).toThrow('i18n message not found: missing_key');
  });

  it('does not throw when the message is empty and isEmptyAllowed is set', async () => {
    stubChromeI18n(() => '');
    const { getMessage } = await import('@/utils/i18n');

    expect(() => {
      getMessage('missing_key', { isEmptyAllowed: true });
    }).not.toThrow();
  });
});
