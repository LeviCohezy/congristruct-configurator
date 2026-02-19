
# Full Configurator Overhaul — BLOQ Models, Materials & Steps

This is a large restructuring of the configurator to match the real BLOQ product line. Here is everything that changes and how.

---

## Scope Overview

```text
Step 1 — Unit Selection     → 4 real BLOQ models + corner style
Step 2 — Exterior Material  → 5 material families + color sub-options + roof rule
Step 3 — Windows & Plan     → Floorplan image selector per model + mirror toggle
Step 4 — Interior & Finish  → 3 finish levels + 3 floor options (same as now)
Step 5 — Lighting           → 2 toggle options (same as now, simplified)
Steps 6–8                   → Extras, Transport, Contact (unchanged)
```

---

## Step 1 — Unit Selection (`UnitSelection.tsx` + `useConfigurator.ts`)

Replace the 3 generic models (compact/standard/large) with the 4 real BLOQ models:

| ID | Name | Area | People | Price |
|----|------|------|--------|-------|
| `start` | BLOQ START | 14 m² | 1 pers. | €29.500 |
| `flow` | BLOQ FLOW | 21–28 m² | 1–2 pers. | €42.000 |
| `hub` | BLOQ HUB | 35 m² | 4–6 pers. | €58.500 |
| `base` | BLOQ BASE | 50 m² | 6 pers. | €79.000 |

- Remove the "Base layout" (office/studio/living) sub-selector — the floorplan choices move to Step 3
- Keep the Rounded/Straight corner selector at bottom of Step 1
- Update `ConfigState.model` type to `"start" | "flow" | "hub" | "base"`
- Update `ModularUnit3D` dimensions:
  - start: width 3.5m, depth 4m
  - flow: width 6.0m, depth 4m
  - hub: width 8.75m, depth 4m
  - base: width 12.5m, depth 4m

---

## Step 2 — Exterior Material (`ExteriorFacade.tsx` + `useConfigurator.ts`)

Replace the current flat list with a **2-level system**: material family → color variant.

**Material families and their options:**

| Family | Colors / Variants |
|--------|-----------------|
| Thermowood Zwart Den | Single option (dark charred black wood) |
| Thermowood Ayous | Single option (natural pale wood) |
| Composiet gevelplaten | White or Black (flat panels, 1.22m wide, vertical seams) |
| Aluminium gevelbekleding | Anthracite, Bronze, White, Custom (seam lines every ±1.5m) |
| Gevelsteen strips | Grey brick look |

**State changes in `ConfigState`:**
- `facade` type expands to include `"brick-grey"` and rename variants for clarity:
  - `"thermowood-black"`, `"thermowood-natural"`, `"composite-white"`, `"composite-black"`, `"aluminium-anthracite"`, `"aluminium-bronze"`, `"aluminium-white"`, `"brick-grey"`

**Roof rule:**
- Default: always black roof + black 7cm border
- Exception: if `composite-white` or `aluminium-white` → white roof + white border
- Remove the manual "Roof edge" picker — it becomes automatic
- Remove the "Rounded corners" toggle from this step (it's in Step 1 now)

**UI pattern:** Two-column grid of material family cards. When a family has sub-colors, show a row of small color swatches inline below the selected card.

**3D material update in `ModularUnit3D.tsx`:**
- Add `"brick-grey"` case: medium grey, high roughness, `isWood: false`, procedural brick bump
- Add `"aluminium-white"` case
- Update roof color logic: auto-derive from facade (no `roofEdge` state needed for display)

---

## Step 3 — Windows & Plan (`WindowsPlan.tsx`)

Replace the current "window type" dropdown with **floorplan image cards** that show the actual architectural plans from the uploaded images.

Since we don't have real SVGs, we'll render **schematic SVG floor plan diagrams** in code for each model, showing:
- Wall outlines
- Window positions (blue lines on front wall)
- Door position
- Optional toilet/partition wall

**Floorplan options per model:**

- **START**: 2 variants — open plan (no toilet) / with toilet (shown as 4 layouts in image — we'll show 2 base options: with or without toilet, mirror handled separately)
- **FLOW**: 2 variants — 21m² single open space / 28m² with separate entry + second room
- **HUB**: 2 variants — open (no divider) / with partition wall
- **BASE**: 2 variants — shell only / fully furnished layout

**State changes:**
- Rename `layout` from `"office" | "studio" | "living"` → `"a" | "b"` (plan A or plan B per model)
- Keep `mirrorPlan: boolean` toggle
- Keep `tiltTurnWindow: boolean` toggle

**UI:** 2 side-by-side plan cards with inline SVG diagrams, then mirror toggle below.

---

## Step 4 — Interior & Finish (unchanged structure, updated labels to Dutch)

- Shell (Casco OSB) → "included"
- Instapklaar (finished, no furniture) → "+€8.500"
- Volledig ingericht (fully finished + furniture) → "+€16.500"
- Floor: light hout / donker hout / steenlook (same IDs, updated labels)

---

## Step 5 — Lighting (simplified to toggle)

Two radio options:
- Verlichtingspunten (aansluitpunten only) — "base"
- Verlichtingspakket (complete LED plan) — "full" → "+€1.800"

---

## Technical Changes Summary

### Files to modify:

1. **`src/hooks/useConfigurator.ts`**
   - Update `ConfigState.model` → `"start" | "flow" | "hub" | "base"`
   - Update `ConfigState.facade` → add `"aluminium-white"` and `"brick-grey"`
   - Remove `roofEdge` from state (auto-derived)
   - Rename `layout` → `floorPlan: "a" | "b"`
   - Update `defaultConfig`, `basePrices`, `facadePrices`

2. **`src/components/configurator/steps/UnitSelection.tsx`**
   - Replace 3 models with 4 BLOQ models
   - Remove layout sub-selector
   - Keep corner style at bottom

3. **`src/components/configurator/steps/ExteriorFacade.tsx`**
   - New 2-level material picker UI
   - Auto-roof logic (remove manual roof edge picker)
   - Remove rounded corners toggle (already in step 1)

4. **`src/components/configurator/steps/WindowsPlan.tsx`**
   - Replace window type cards with floorplan SVG cards
   - Keep mirror toggle + tilt-turn toggle

5. **`src/components/configurator/ModularUnit3D.tsx`**
   - Update dimension mapping for 4 models
   - Add `"brick-grey"` and `"aluminium-white"` material cases
   - Update roof color to auto-derive (remove `roofEdge` prop usage)
   - Remove `layout` references, keep simple open/split based on `floorPlan`

6. **`src/components/configurator/steps/InteriorFinish.tsx`**
   - Update labels to Dutch/brand language

7. **`src/components/configurator/steps/LightingElectrical.tsx`**
   - Simplify to 2 toggle options with updated Dutch labels
