type OriginPredicate = (origin: string) => boolean;

const TRAILING_SLASH_REGEX = /\/+$/;
const SPECIAL_CHARS_REGEX = /[.*+?^${}()|[\]\\]/g;

/**
 * Builds reusable predicate functions for validating an origin against an allow-list.
 * Supports exact matches as well as wildcard patterns such as https://*.vercel.app.
 */
export function createOriginMatchers(rawOrigins: string[]): OriginPredicate[] {
  const sanitizedOrigins = rawOrigins
    .map((origin) => origin.trim())
    .filter(Boolean);

  const matchers: OriginPredicate[] = [];
  for (const origin of sanitizedOrigins) {
    if (origin === '*') {
      matchers.push(() => true);
      continue;
    }

    const hasWildcard = origin.includes('*');
    if (hasWildcard) {
      const normalizedPattern = trimTrailingSlash(origin.toLowerCase());
      const regexPattern = escapeRegExp(normalizedPattern).replace(/\\\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      matchers.push((candidate) => regex.test(normalizeOrigin(candidate)));
      continue;
    }

    const normalized = normalizeOrigin(origin);
    if (!normalized) {
      continue;
    }
    matchers.push((candidate) => normalizeOrigin(candidate) === normalized);
  }

  return matchers;
}

/**
 * Normalizes origins and removes trailing slashes so string equality checks are reliable.
 */
export function normalizeOrigin(origin?: string) {
  if (!origin) {
    return '';
  }
  const trimmed = origin.trim();
  if (!trimmed) {
    return '';
  }
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return trimTrailingSlash(trimmed.toLowerCase());
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(TRAILING_SLASH_REGEX, '');
}

function escapeRegExp(value: string) {
  return value.replace(SPECIAL_CHARS_REGEX, '\\$&');
}
