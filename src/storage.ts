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
