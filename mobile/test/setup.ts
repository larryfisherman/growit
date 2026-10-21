/// <reference types="node" />
import { registerHooks } from 'node:module';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fakeApi, fakeCognito } from './fakeApi.ts';

/// Loaded with `node --import` ahead of every test file, so the app's own modules -
/// createQueryClient, the mutation registry, axios with its interceptors - can run under
/// node unchanged instead of being copied into tests.
///
/// Two things stand between them and node: imports written without an extension (Metro
/// resolves those, node's ESM loader will not), and native modules with nothing behind
/// them outside a phone. The first is resolved here, the second swapped for the
/// in-memory stand-ins in ./stubs.

const stub = (name: string) => new URL(`./stubs/${name}.ts`, import.meta.url).href;

const STUBS: Record<string, string> = {
  'react-native': stub('react-native'),
  'expo-secure-store': stub('expo-secure-store'),
  'expo-constants': stub('expo-constants'),
  'expo-crypto': stub('expo-crypto'),
  '@react-native-async-storage/async-storage': stub('async-storage'),
  '@react-native-community/netinfo': stub('netinfo'),
};

const isFile = (url: URL) => {
  try {
    return statSync(fileURLToPath(url)).isFile();
  } catch {
    return false;
  }
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    const stubbed = STUBS[specifier];
    if (stubbed) return { url: stubbed, shortCircuit: true };

    const relative = specifier.startsWith('./') || specifier.startsWith('../');
    if (relative && context.parentURL?.startsWith('file:')) {
      const target = new URL(specifier, context.parentURL);
      if (!isFile(target)) {
        for (const suffix of ['.ts', '/index.ts']) {
          const candidate = new URL(target.href + suffix);
          if (isFile(candidate)) return nextResolve(candidate.href, context);
        }
      }
    }

    return nextResolve(specifier, context);
  },
});

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

await fakeApi.start();

// Read at import time by baseUrl.ts and cognito.ts, so these have to be in place before
// any test file pulls the app in.
process.env.EXPO_PUBLIC_API_URL = fakeApi.url;
process.env.EXPO_PUBLIC_COGNITO_REGION = 'test-1';
process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID = 'test-client';

const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith('https://cognito-idp.')) return fakeCognito.answer();
  return realFetch(input, init);
};
