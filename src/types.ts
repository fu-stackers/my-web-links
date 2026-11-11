export type SavedSite = {
  id: string;
  url: string;
  title: string;
  description?: string;
  category: string;
  favicon?: string;
  note?: string;
  savedAt: number;
};
