import { useEffect, useState } from "react";
import { addSite } from "../storage";
import type { SavedSite } from "../types";

export default function Popup() {
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  const [category, setCategory] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(([t]) => setTab(t));
  }, []);

  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  };

  async function handleSave() {
    if (!tab?.url) return;

    const site: SavedSite = {
      id: crypto.randomUUID(),
      url: tab.url,
      title: tab.title || tab.url,
      category: category.trim() || "Uncategorized",
      favicon: tab.favIconUrl,
      savedAt: Date.now(),
    };

    await addSite(site);
    setSaved(true);
    console.log(category);
  }
  return (
    <div>
      <h2>Save website</h2>

      <p>{tab?.title}</p>
      <p>{tab?.url}</p>
      <button onClick={openDashboard}>Open My Websites</button>

      <input
        value={category}
        placeholder="Category (e.g. Design)"
        onChange={(e) => setCategory(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
      {saved && <p className="text-green-400">Saved!</p>}
    </div>
  );
}
