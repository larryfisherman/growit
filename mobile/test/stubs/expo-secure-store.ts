/// The Keychain, in memory. Exposed so a test can see what was stored, or wipe it.
export const store = new Map<string, string>();

export const getItemAsync = async (key: string) => store.get(key) ?? null;
export const setItemAsync = async (key: string, value: string) => {
  store.set(key, value);
};
export const deleteItemAsync = async (key: string) => {
  store.delete(key);
};
