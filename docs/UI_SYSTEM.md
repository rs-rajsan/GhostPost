# UI System - The Visual Universe 🌌

GhostPost uses a specialized **Theme-Reactive Token System**. Instead of hardcoding colors, the entire application responds to a set of core CSS variables defined in each "Universe."

## 🎨 Color Token Architecture

The UI is built on three primary layers:

| Token | Description |
| :--- | :--- |
| `--base` | The foundation layer (Background). |
| `--surface` | The elevation layer (Cards, Sidebar, Headers). |
| `--plasma` | The energy/accent layer (Buttons, Active States, Highlights). |

### Supporting Tokens:
- `--error`: Used for destructive actions and validation failures.
- `--success`: Used for "System Ready" states and successful generations.
- `--text-primary`: High-contrast text for headers.
- `--text-secondary`: Mid-contrast text for body and labels.

## 🌌 The 8 Universes

Every universe is defined in `index.css` under a specific class (e.g., `.theme-void`).

### Core Palettes (Examples):

| Universe | Base | Surface | Plasma |
| :--- | :--- | :--- | :--- |
| **Plasma Void** | `#050509` | `#0b0b1a` | `#6d67e4` |
| **Cyber Emerald** | `#022c22` | `#064e3b` | `#10b981` |
| **Solar Flare** | `#1c0a00` | `#451a03` | `#f97316` |

## 📐 Layout & Typography

### Typography Hierarchy:
GhostPost uses the **Inter** font family (or system sans-serif) with the following token scale (based on a 1.25x modular ratio):
- `text-xs`: 0.75rem (12px) - Metadata, Citations, Tiny Labels
- `text-sm`: 0.875rem (14px) - Sidebar Items, Secondary UI, Buttons
- `text-base`: 1rem (16px) - Primary Body Text, Form Inputs
- `text-md`: 1.25rem (20px) - Section Sub-headers
- `text-lg`: 1.5rem (24px) - Page Section Titles
- `text-xl`: 2rem (32px) - Main Page Titles
- `text-2xl`: 3rem (48px) - Hero / Large Headlines

### Spacing:
We follow a 4px grid system:
- `p-4`: 1rem (Standard padding)
- `gap-2`: 0.5rem (Sub-element spacing)

## 🛠 Developer Guide: Creating a "Conformed" Component

To ensure a new component stays "true" to the selected universe, **NEVER** use hex colors or standard Tailwind colors (e.g., `bg-blue-500`).

**Correct Approach:**
```tsx
const MyComponent = () => (
  <div style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
    <button style={{ backgroundColor: 'var(--plasma)' }}>
      Click Me
    </button>
  </div>
);
```
