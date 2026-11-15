import type { SavedSite } from "./types";

const KEY = "sites";

export async function getSites(): Promise<SavedSite[]> {
  const result = await chrome.storage.local.get(KEY);
  return (result[KEY] as SavedSite[] | undefined) ?? [];
}

async function saveSites(sites: SavedSite[]): Promise<void> {
  await chrome.storage.local.set({ [KEY]: sites });
}

export async function addSite(site: SavedSite): Promise<void> {
  const sites = await getSites();
  await saveSites([site, ...sites]);
}

export async function updateSite(updated: SavedSite): Promise<void> {
  const sites = await getSites();
  await saveSites(sites.map((s) => (s.id === updated.id ? updated : s)));
}

export async function deleteSite(id: string): Promise<void> {
  const sites = await getSites();
  await saveSites(sites.filter((s) => s.id !== id));
}
const CATEGORIES_KEY = "categories";
const THEME_KEY = "theme";

export const DEFAULT_CATEGORIES = [
  "Design",
  "Development",
  "Tools",
  "Learning",
  "Inspiration",
  "News",
  "Entertainment",
  "Shopping",
  "Other",
];

export async function getCategories(): Promise<string[]> {
  const result = await chrome.storage.local.get(CATEGORIES_KEY);
  return (result[CATEGORIES_KEY] as string[] | undefined) ?? DEFAULT_CATEGORIES;
}

export async function addCategory(name: string): Promise<string[]> {
  const categories = await getCategories();
  if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
    return categories;
  }
  const updated = [...categories, name];
  await chrome.storage.local.set({ [CATEGORIES_KEY]: updated });
  return updated;
}

export async function deleteCategory(name: string): Promise<string[]> {
  const categories = await getCategories();
  const updated = categories.filter(
    (c) => c.toLowerCase() !== name.toLowerCase(),
  );
  await chrome.storage.local.set({ [CATEGORIES_KEY]: updated });
  return updated;
}

export type Theme = "system" | "light" | "dark";

export async function getTheme(): Promise<Theme> {
  const result = await chrome.storage.local.get(THEME_KEY);
  return (result[THEME_KEY] as Theme | undefined) ?? "system";
}

export async function setTheme(theme: Theme): Promise<void> {
  await chrome.storage.local.set({ [THEME_KEY]: theme });
}
