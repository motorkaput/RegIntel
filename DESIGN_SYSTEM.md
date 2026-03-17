# Dark Street Tech Design System v1.0

## Phase 1 GTM Build Specification

---

## COLOR SYSTEM

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--ds-imperial` | `#001D51` | Primary brand surface, sidebar, headers, CTAs |
| `--ds-deep-navy` | `#0C1B33` | Deep backgrounds, modals, overlays |
| `--ds-gold` | `#D4AF37` | Primary accent, active states, highlights, links |
| `--ds-rose` | `#E4ADB2` | Secondary accent, amigo "go" color, soft highlights |
| `--ds-peach` | `#FFE3A5` | Tertiary accent, warm notifications, badges |
| `--ds-orange` | `#E25038` | Subtle use only: error states, destructive actions, Dark Street logo |

### Surface Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--ds-bg` | `#FAF8F5` | Page background (light mode) |
| `--ds-surface` | `#FFFFFF` | Cards, panels, elevated surfaces |
| `--ds-surface-alt` | `#F3F1ED` | Alternating table rows, secondary surfaces |
| `--ds-border` | `#E8E4E0` | Card borders, dividers, input borders |
| `--ds-border-subtle` | `#F0EDE8` | Very subtle separators |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--ds-text` | `#1A1A1A` | Primary body text on light backgrounds |
| `--ds-text-secondary` | `#555555` | Secondary/supporting text |
| `--ds-text-muted` | `#999999` | Placeholder text, timestamps, captions |
| `--ds-text-on-dark` | `#F0EDE8` | Body text on dark (imperial/navy) backgrounds |
| `--ds-text-on-dark-muted` | `#7A8A9E` | Secondary text on dark backgrounds |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--ds-success` | `#2D8A6E` | Success states, positive sentiment |
| `--ds-success-bg` | `#E8F5F0` | Success background |
| `--ds-warning` | `#D4AF37` | Warning states (uses gold) |
| `--ds-warning-bg` | `#FFF8E8` | Warning background |
| `--ds-error` | `#E25038` | Error states (uses DS orange) |
| `--ds-error-bg` | `#FEF0EB` | Error background |
| `--ds-info` | `#001D51` | Info states (uses imperial) |
| `--ds-info-bg` | `#EEF0F4` | Info background |

### Product Accent Colors (for sidebar icons and data viz primary)

| Product | Accent | Usage |
|---------|--------|-------|
| FetchPatterns | `#D4AF37` (Gold) | Sidebar icon, primary chart color |
| RegIntel | `#001D51` (Imperial) | Sidebar icon, primary chart color |
| amigo | `#E4ADB2` (Rose) | "go" text color, sidebar icon |
| WorkDJ | `#FFE3A5` (Peach) | Sidebar icon, primary chart color |

---

## TYPOGRAPHY

### Font Stack

- **Headings and brand names:** Playfair Display (serif), weights 400, 600, 700
- **Body, UI, data, buttons:** Inter (sans-serif), weights 400, 500, 600

### Type Scale

| Level | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| Display | Playfair Display | 32px | 700 | 1.2 | Hero headings, landing page |
| H1 | Playfair Display | 24px | 700 | 1.3 | Page titles |
| H2 | Playfair Display | 20px | 600 | 1.3 | Section headings |
| H3 | Playfair Display | 16px | 600 | 1.4 | Subsection headings |
| Body | Inter | 15px | 400 | 1.6 | Primary body text |
| Body Small | Inter | 13px | 400 | 1.5 | Secondary text, descriptions |
| Caption | Inter | 11px | 400 | 1.4 | Timestamps, metadata, helper text |
| Button | Inter | 13px | 600 | 1.0 | Button labels |
| Label | Inter | 12px | 500 | 1.0 | Form labels, badges |
| Overline | Inter | 11px | 600 | 1.0 | Section labels (uppercase, letter-spacing: 1.5px) |
| Code/Data | JetBrains Mono or monospace | 13px | 400 | 1.5 | Code blocks, JSON, data values |

### Brand Name Rendering

- **FetchPatterns:** Playfair Display 700, `--ds-imperial` on light, white on dark
- **RegIntel:** Playfair Display 700, `--ds-imperial` on light, white on dark
- **amigo:** Playfair Display 700, "ami" in `--ds-imperial` (light) or white (dark), "go" in `--ds-rose` (light) or `#5A6B80` (dark)
- **WorkDJ:** Playfair Display 700, `--ds-imperial` on light, white on dark

### Rules

- No italics. Ever.
- No colored body text. Text is always `--ds-text` on light or `--ds-text-on-dark` on dark.
- Gold (`--ds-gold`) may be used for links and interactive text only.
- Never reveal the AI model name. Always use "[ProductName] Intelligence" (e.g., "FetchPatterns Intelligence", "amigo intelligence").

---

## SPACING

**Base Grid: 4px**

| Token | Value | Usage |
|-------|-------|-------|
| `--ds-space-1` | 4px | Tight gaps (icon + label) |
| `--ds-space-2` | 8px | Small gaps (between badges) |
| `--ds-space-3` | 12px | Default element gap |
| `--ds-space-4` | 16px | Card internal padding (small) |
| `--ds-space-5` | 20px | Standard section gap |
| `--ds-space-6` | 24px | Card internal padding (standard) |
| `--ds-space-8` | 32px | Section separation |
| `--ds-space-10` | 40px | Page-level padding |
| `--ds-space-12` | 48px | Major section breaks |

---

## BORDER RADIUS

| Token | Value | Usage |
|-------|-------|-------|
| `--ds-radius-sm` | 4px | Buttons, badges, small inputs |
| `--ds-radius-md` | 8px | Cards, panels, modals |
| `--ds-radius-lg` | 12px | Large cards, feature sections |
| `--ds-radius-full` | 9999px | Avatars, circular elements |

---

## SHADOWS

| Token | Value | Usage |
|-------|-------|-------|
| `--ds-shadow-sm` | `0 1px 2px rgba(0,29,81,0.05)` | Subtle elevation (buttons, inputs) |
| `--ds-shadow-md` | `0 4px 12px rgba(0,29,81,0.08)` | Cards, dropdowns |
| `--ds-shadow-lg` | `0 8px 24px rgba(0,29,81,0.12)` | Modals, floating panels |

---

## COMPONENT PATTERNS

### Buttons

```
Primary:   bg: --ds-imperial, text: white, hover: lighten 5%
Secondary: bg: transparent, border: --ds-border, text: --ds-text, hover: --ds-surface-alt
Accent:    bg: --ds-gold, text: --ds-imperial, hover: darken 5%
Danger:    bg: --ds-error, text: white (use sparingly)
Ghost:     bg: transparent, text: --ds-gold, hover: --ds-surface-alt

All:       radius: --ds-radius-sm, padding: 8px 16px, font: Inter 13px 600
```

### Cards

```
bg: --ds-surface, border: 1px solid --ds-border, radius: --ds-radius-md
padding: --ds-space-6, shadow: --ds-shadow-sm on hover
```

### Inputs

```
bg: --ds-surface, border: 1px solid --ds-border, radius: --ds-radius-sm
padding: 8px 12px, font: Inter 15px 400
focus: border-color: --ds-gold, shadow: 0 0 0 2px rgba(212,175,55,0.15)
```

### Sidebar (all products)

```
bg: --ds-imperial, width: 240px (expanded) / 56px (collapsed)
nav items: Inter 13px 500, color: --ds-text-on-dark-muted
active nav item: bg: rgba(255,255,255,0.08), color: white, left-border: 3px --ds-gold
product icon: 32x32 rounded-md, product accent color bg, white text
bottom: small "Dark Street Tech" text in --ds-text-on-dark-muted
```

### Top Bar

```
bg: --ds-surface, border-bottom: 1px solid --ds-border, height: 56px
left: breadcrumb or page title (Playfair Display 18px)
right: notification bell, user avatar, settings
```

### Tables

```
header: bg --ds-surface-alt, font: Inter 12px 600 uppercase
rows: alternating --ds-surface / --ds-surface-alt
hover: bg rgba(212,175,55,0.04)
border: 1px solid --ds-border-subtle between rows
```

### Toast/Notifications

```
success: left-border 3px --ds-success, bg --ds-success-bg
warning: left-border 3px --ds-gold, bg --ds-warning-bg
error: left-border 3px --ds-error, bg --ds-error-bg
info: left-border 3px --ds-imperial, bg --ds-info-bg
position: top-right, auto-dismiss 5s
```

---

## LOGIN PAGE PATTERN (all products)

```
Layout: Centered card on --ds-bg background
Card: max-width 420px, --ds-surface, --ds-shadow-md, --ds-radius-lg, padding 40px
Top: Product name (Playfair Display 24px) + tagline (Inter 13px --ds-text-secondary)

Auth buttons (in order):
  1. "Continue with Google" -- outlined, Google icon
  2. "Continue with Microsoft" -- outlined, Microsoft icon
  3. Divider: "or"
  4. Email input + Password input + "Sign in" button (--ds-imperial)
  5. "Create account" link below

Bottom of page: Links to Terms, Privacy, Contact
Footer: "Dark Street Tech" in --ds-text-muted
```

No marketing content on the login page. Clean, minimal, confident.

---

## LEGAL PAGES REQUIRED (for Razorpay compliance)

Each product must have these as separate routes:

- `/terms` -- Terms of Service
- `/privacy` -- Privacy Policy
- `/refund` -- Refund and Cancellation Policy
- `/contact` -- Contact page with email and physical address
- `/pricing` -- Pricing page showing all tiers

These pages use the same design system but are standalone (no sidebar, just top nav + footer).

---

## FOOTER (all products)

```
bg: --ds-deep-navy, padding: 40px
Left: "Dark Street Tech" in Inter 12px --ds-text-on-dark-muted
Center: Links to Terms, Privacy, Refund, Contact, Pricing
Right: darkstreet.tech
```

---

## RESPONSIVE BREAKPOINTS

| Name | Width | Behavior |
|------|-------|----------|
| Mobile | < 768px | Sidebar collapses to hamburger, single column |
| Tablet | 768-1024px | Sidebar collapses to icons, content adapts |
| Desktop | 1024-1440px | Full sidebar + content |
| Wide | > 1440px | Content max-width 1400px, centered |

---

## DATA VISUALIZATION COLORS (5-color palette)

1. `#001D51` (Imperial Blue)
2. `#D4AF37` (Gold Leaf)
3. `#E4ADB2` (Tea Rose)
4. `#FFE3A5` (Peach Yellow)
5. `#2D8A6E` (Success Green)

Extended: `#5A6B80`, `#8B6E5A`, `#7A5C8F` (muted tones for 6-8 series)
