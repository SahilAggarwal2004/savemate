const getStorageInstance = (local = true) => (local ? localStorage : sessionStorage);

export const removeStorage = (key: string, local = true) => getStorageInstance(local).removeItem(key);

export function getStorage<T>(key: string, fallbackValue?: T, local: boolean = true): T | undefined {
  const value = getStorageInstance(local).getItem(key);
  if (value) {
    try {
      return JSON.parse(value);
    } catch {
      removeStorage(key, local); // Remove corrupted data
    }
  }
  if (fallbackValue !== undefined) setStorage<T>(key, fallbackValue, local);
  return fallbackValue;
}

export function setStorage<T = unknown>(key: string, value: T, local = true) {
  getStorageInstance(local).setItem(key, JSON.stringify(value));
}
