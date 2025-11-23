import { describe, expect, it } from 'vitest';

import { createOriginMatchers, normalizeOrigin } from '../cors';

describe('normalizeOrigin', () => {
  it('removes trailing slashes and lowercases hostnames', () => {
    expect(normalizeOrigin('https://Example.com/')).toBe('https://example.com');
  });

  it('returns empty string for invalid values', () => {
    expect(normalizeOrigin('')).toBe('');
    expect(normalizeOrigin(undefined)).toBe('');
  });

  it('falls back to trimmed string when new URL fails', () => {
    expect(normalizeOrigin('https://*.vercel.app/')).toBe('https://*.vercel.app');
  });
});

describe('createOriginMatchers', () => {
  it('matches exact origins regardless of trailing slash', () => {
    const matchers = createOriginMatchers(['https://india-mf-data-pwa.vercel.app/']);
    expect(matchers).toHaveLength(1);
    expect(matchers[0]('https://india-mf-data-pwa.vercel.app')).toBe(true);
  });

  it('supports wildcard subdomains', () => {
    const matchers = createOriginMatchers(['https://*.vercel.app']);
    expect(matchers[0]('https://foo.vercel.app')).toBe(true);
    expect(matchers[0]('https://bar.vercel.app')).toBe(true);
    expect(matchers[0]('https://example.com')).toBe(false);
  });

  it('ignores empty entries', () => {
    const matchers = createOriginMatchers(['', '   ']);
    expect(matchers).toHaveLength(0);
  });

  it('accepts the catch-all wildcard', () => {
    const matchers = createOriginMatchers(['*']);
    expect(matchers[0]('https://anywhere.dev')).toBe(true);
  });
});
