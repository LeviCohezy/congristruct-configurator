

## Problem

The "Prijzen verborgen voor bezoekers" toggle in the editor sets `localStorage("bloq-hide-prices") = "true"`, but:
1. The **sticky total price button** at the bottom still shows (it only checks `pricesHidden` for the wrapper, but the `BlurredPrice` inside returns `null` leaving an empty button visible)
2. The **price gate modal** can still open via `onPriceClick` callbacks
3. The **bouncing mouse icon** and **floating euro animations** still render
4. **`RelativePrice`** still shows "geselecteerd" / "inbegrepen" text labels
5. The **ContactForm** still shows the total price section

The root issue: `localStorage` is set by the editor but the configurator only partially respects it. The live site (different origin/tab) won't share the same localStorage as the editor preview.

**Wait** — both editor and configurator are on the same domain, so localStorage IS shared. The real issue is that the hiding logic is incomplete.

## Plan

### 1. Make `BlurredPrice` export the hidden check
Add an exported `arePricesHidden()` function (already exists, just needs exporting).

### 2. Hide the entire sticky price bar + modal + animations
In `ConfiguratorLayout.tsx`, the `pricesHidden` variable already exists at line 44. Changes:
- The sticky bar wrapper (line 140) already has `!pricesHidden &&` — but also hide the `MousePointerClick` icon and euro animations inside it. Actually the whole block is already gated. Good.
- **Hide the price gate modal**: line 200 already has `!pricesHidden` check. Good.
- **Disable `onPriceClick` callbacks**: When `pricesHidden`, don't pass `onPriceClick` to child components so clicking doesn't trigger the modal.

### 3. Hide `RelativePrice` when prices hidden
In `RelativePrice.tsx`, add the same `arePricesHidden()` check — return `null` when hidden (including the "geselecteerd"/"inbegrepen" labels).

### 4. Hide prices in `ContactForm`
Check the ContactForm to ensure total price display respects the flag.

### 5. Use React state instead of reading localStorage on every render
Convert `pricesHidden` to a proper state value (read once on mount) to avoid stale reads and ensure consistency. Pass it down as a prop or use the existing check.

### Files to modify
- **`src/components/configurator/BlurredPrice.tsx`** — export `arePricesHidden`
- **`src/components/configurator/RelativePrice.tsx`** — return `null` when prices hidden
- **`src/components/configurator/ConfiguratorLayout.tsx`** — when `pricesHidden`, don't pass `onPriceClick` to steps (prevents modal from opening)
- **`src/components/configurator/steps/ContactForm.tsx`** — hide the price display when prices hidden
- **`src/components/configurator/PriceSummary.tsx`** — hide price when hidden (if used)

