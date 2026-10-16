/**
 * The domain shown for a tab URL: its host (hostname plus any non-default
 * port), or `null` when the URL isn't a web page (chrome://, file://,
 * about:blank, the new tab page, a missing URL).
 */
export function domainFromUrl(url: string | undefined): string | null {
  if (!url) {
    return null
  }
  try {
    const { protocol, host } = new URL(url)
    return protocol === 'http:' || protocol === 'https:' ? host : null
  } catch {
    return null
  }
}
