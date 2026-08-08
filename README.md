# Congristruct - Configurator

Below is a **Lovable-ready master prompt** you can paste directly into Lovable to generate the first version of the modular-unit configurator app.

I’ve written it in the **structured hybrid format** you usually use (clear role, scope, UX logic, tech expectations, and output constraints), so it should produce a clean first build.

---

# LOVABLE MASTER PROMPT

## Project: Modular Unit Configurator

### ROLE

You are a senior product designer, UX architect, and full-stack engineer building a **modern web configurator** for a company that produces **modular living/working units**.

You think in:

* clean SaaS UX
* premium architectural branding
* conversion-focused configurators
* scalable component systems

---

### OBJECTIVE

Create a **step-by-step interactive configurator** where visitors can:

1. Configure a modular unit visually
2. Select materials, layout, and options
3. See a **live price indication**
4. Enter contact details
5. Submit a request or continue to quotation

The configurator must feel:

* minimal
* architectural
* high-end
* calm
* intuitive
* mobile-first

Comparable UX level to:

* modern prefab housing configurators
* premium SaaS onboarding flows
* Apple-like simplicity

---

### CORE USER FLOW

#### Step 1 — Unit selection

* Show a **3D or rendered preview** of the modular unit
* Allow choosing:

  * model / size
  * base layout
* Display **starting price**

---

#### Step 2 — Exterior / façade

User selects façade materials:

Options include:

* Thermowood (black or natural)
* Composite panels (white or black)
* Aluminium cladding (multiple colors)
* Vertical panel layout with visible joints
* Optional rounded corners

Rules:

* Roof edge default = black
* White façade → roof edge in white
* Roof edge height ≈ 7 cm

Update:

* Preview image
* Price

---

#### Step 3 — Windows & plan

Allow:

* Changing window types
* Optional tilt-turn window
* Mirroring the floorplan

Preview must update.

---

#### Step 4 — Interior finish

Choices:

Finish levels:

* Shell (OSB ready)
* Finished without furniture
* Fully finished interior

Floor options:

* Light click vinyl
* Dark click vinyl
* Stone look vinyl

Optional:

* Desk and cabinets included in “fully finished”

---

#### Step 5 — Lighting & electrical

Include:

* Base lighting points
* Prepared cable connections
* Optional full lighting package matched to unit model

---

#### Step 6 — Extra options

Examples:

* Awning or canopy
* Solar panels
* Battery system
* Foundation

Show visually when possible.

---

#### Step 7 — Transport

* Map-based distance calculation
* Transport price depends on:

  * distance
  * accessibility
  * crane requirements

Display **estimated transport cost**.

---

#### Step 8 — Contact & price indication

Form fields:

* First name
* Last name
* Email
* Phone
* Company (optional)
* Installation address

User actions:

* Save configuration link
* Contact support
* Continue to request quotation

Clarification:

> No direct order — only **price indication + lead capture**

---

### UX & DESIGN STYLE

**Visual tone**

* Minimal
* Soft neutral backgrounds
* Architectural typography
* Large whitespace
* Calm micro-animations

**Layout**

* Left: visual preview
* Right: configuration panel
* Sticky price summary

**Components**

* Step progress indicator
* Expandable option groups
* Color/material swatches
* Map module
* Lead form

---

### TECHNICAL EXPECTATIONS

Build as:

* Modern web app
* Component-based architecture
* Easily connectable to:

  * CMS
  * pricing database
  * CRM
  * email automation

Prepare structure for:

* future 3D viewer integration
* dynamic pricing logic
* multilingual support

---

### OUTPUT FORMAT

Generate:

1. Full **UX structure**
2. Page/component hierarchy
3. Clean UI layout
4. Functional step logic
5. Ready-to-build frontend structure

Do **NOT** invent company branding yet.
Keep branding **neutral and premium**.

---

### STOP CONDITION

Stop after producing:

* Complete configurator UX
* All steps wired logically
* Clean scalable structure

Do **not** yet define:

* exact unit models
* real prices
* backend integrations

These will be provided in the **next prompt**.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://my-modular-home.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f525801-9938-4f98-a8d9-92027020c2ac).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
