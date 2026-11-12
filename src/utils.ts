export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes(".")) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function isSavableUrl(url?: string): boolean {
  return !!url && /^https?:\/\//i.test(url);
}

export async function checkDomain(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function readDescription(tabId: number): Promise<string> {
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () =>
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") ??
        document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content") ??
        "",
    });
    return (res?.result as string | undefined) ?? "";
  } catch {
    return "";
  }
}
