import type { SavedSite } from "../types";
type Props = { site: SavedSite };

export default function SiteCard({ site }: Props) {
  return (
    <div>
      <h3>{site.title}</h3>
      <p>{site.url}</p>
      <p>{site.category}</p>
      <a href={site.url} target="_blank" rel="noreferrer">
        Visit
      </a>
    </div>
  );
}
