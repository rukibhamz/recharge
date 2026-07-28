---
name: Recharge Design System
version: '1.0'
source: recharge-design-system.html
colors:
  ink: '#16231C'
  ink-soft: '#4A554D'
  ink-faint: '#8B9289'
  canopy: '#1F4D3A'
  canopy-600: '#2D6A4F'
  fern: '#4E9271'
  fern-tint: '#DCEBE1'
  linen: '#F6F2E9'
  linen-raised: '#FFFFFF'
  linen-sunken: '#EDE7D9'
  ember: '#C97A3D'
  ember-tint: '#FBEBDD'
  signal-red: '#B54339'
  signal-red-tint: '#FBE9E6'
  signal-amber: '#B8863D'
  signal-amber-tint: '#FBF2E0'
  # Semantic aliases used in Tailwind
  primary: '#2D6A4F'
  warm: '#F6F2E9'
  on-surface: '#16231C'
  on-surface-variant: '#4A554D'
  status-healthy: '#4E9271'
  status-mild: '#B8863D'
  status-warning: '#C97A3D'
  status-severe: '#B54339'
typography:
  display: Fraunces 300/400/500 — headlines ≥20px
  body: Public Sans 400/600 — UI and body
  mono: IBM Plex Mono 500 — scores, counters, timestamps
rounded:
  sm: 8px
  md: 14px
  pill: 999px
spacing:
  base: 8px
  scale: [4, 8, 12, 16, 24, 32, 48, 64]
elevation:
  0: flat border linen-sunken
  1: '0 1px 3px rgba(22,35,28,0.08)'
  2: '0 4px 16px rgba(22,35,28,0.10)'
  3: '0 12px 32px rgba(22,35,28,0.14)'
motion:
  instant: 100ms ease-out
  base: 250ms cubic-bezier(.4,0,.2,1)
  score: 1200ms cubic-bezier(.4,0,.2,1)
  loading: 1400ms ease-in-out loop
---

## Brand & Style

Warm, not clinical. Signature motif: **the Arc** — an incomplete circle (vessel filling/emptying), never a full ring.

- **Canopy green** carries brand and CTAs
- **Ember / Signal Red** reserved for burnout severity only — never decorative CTAs (except Share uses Ember sparingly per component spec)
- **Linen** page background; flat linen-raised cards over glassmorphism
- Copy is plain, never diagnostic language

## Components

Buttons: primary (canopy-600), secondary (border), ember (share), ghost  
Options: rounded 10px, fern-tint when selected  
Score: arc ring with mono percentage  
Recommendation cards: demo-card with corner arc decoration  
Badges: healthy / mild / moderate / severe semantic scale
