

## Move "Extra 6-deurs kast" toggle into InteriorFinish

**What**: Move the extra closet option out of `ExtraOptions.tsx` and into `InteriorFinish.tsx`, placing it right after the shelf color picker (inside the `showFurnished` section). Only show it for Hub + Plan B.

**Changes**:

1. **`src/components/configurator/steps/InteriorFinish.tsx`**:
   - Import `Archive` from lucide-react, `BlurredPrice`, and `cn`
   - After the shelf color grid (line ~151), add a conditional block: if `config.model === "hub" && config.floorPlan === "b"`, render the extra closet toggle button (same style as in ExtraOptions) with price "4.000"

2. **`src/components/configurator/steps/ExtraOptions.tsx`**:
   - Remove the `extraCloset` entry from `getExtras` (lines 25-27)
   - Remove the `Archive` import if no longer used

