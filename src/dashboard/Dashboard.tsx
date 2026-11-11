import { useState, useEffect } from "react";
import type { SavedSite } from "../types";
import { getSites } from "../storage";
function Dashboard() {
  const [sites, setSites] = useState<SavedSite[]>([]);
  useEffect(() => {
    getSites().then(setSites);
  }, []);
  return (
    <div>
      <h1>My Websites</h1>
      {sites.map((site) => (
        <div key={site.id}>
          <h3>{site.title}</h3>
          <p>{site.url}</p>
          <p>{site.category}</p>
          <a href={site.url} target="_blank" rel="noreferrer">
            Visit
          </a>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
