const fired = new Set<string>();

/** Push an event to the GTM dataLayer. `once` = only fire once per page load. */
export function trackEvent(event: string, data: Record<string, unknown> = {}, once = false) {
  if (once && fired.has(event)) return;
  fired.add(event);
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...data });
}
