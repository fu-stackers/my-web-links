import { useState, useEffect } from "react";
import type { SavedSite } from "../types";
import { getSites } from "../storage";
import SiteCard from "./SiteCard";
function Dashboard() {
  const [sites, setSites] = useState<SavedSite[]>([]);
  useEffect(() => {
    getSites().then(setSites);
  }, []);
  return (
    <div>
      <h1>My Websites</h1>
      {sites.map((site) => (
        <SiteCard key={site.id} site={site} />
      ))}
    </div>
  );
}

export default Dashboard;
