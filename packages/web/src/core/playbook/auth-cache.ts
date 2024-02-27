import { Playbook } from "@xliic/scanconf";
import { parseDuration } from "../duration";

type AuthCacheEntry = {
  value: string;
  expiryTime: number;
};

export type AuthCache = Map<string, AuthCacheEntry>;

export function createAuthCache(): AuthCache {
  return new Map<string, AuthCacheEntry>();
}

export function setAuthEntry(
  cache: AuthCache,
  credential: Playbook.Credential,
  valueName: string,
  value: string
) {
  const ttl = credential.ttl !== undefined ? parseDuration(credential.ttl) : undefined;
  if (ttl !== undefined) {
    const name = `${credential.name}/${valueName}`;
    const expiryTime = Date.now() + ttl;
    cache.set(name, { value, expiryTime });
  }
}

export function getAuthEntry(
  cache: AuthCache,
  credential: Playbook.Credential,
  valueName: string
): string | undefined {
  const name = `${credential.name}/${valueName}`;
  const entry = cache.get(name);
  if (entry && Date.now() < entry.expiryTime) {
    return entry.value;
  } else {
    cache.delete(name);
    return undefined;
  }
}
