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
GhostPost uses the **Inter** font family (or system sans-serif) with the following token scale:
- `text-xs`: 0.75rem (Metadata, Citations)
- `text-sm`: 0.875rem (Standard Labels, Sidebar)
- `text-base`: 1rem (Body Text, Form Inputs)
- `text-xl`: 1.25rem (Card Headers)
- `text-2xl`: 1.5rem (Page Titles)

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
