---
name: Recharge Design System
colors:
  surface: '#f9f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f9f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1d'
  on-surface-variant: '#40484b'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#70787c'
  outline-variant: '#c0c8cb'
  surface-tint: '#306576'
  primary: '#003441'
  on-primary: '#ffffff'
  primary-container: '#0f4c5c'
  on-primary-container: '#87bbce'
  inverse-primary: '#9acee1'
  secondary: '#516161'
  on-secondary: '#ffffff'
  secondary-container: '#d4e6e5'
  on-secondary-container: '#576867'
  tertiary: '#482700'
  on-tertiary: '#ffffff'
  tertiary-container: '#623d13'
  on-tertiary-container: '#dda975'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b6ebfe'
  primary-fixed-dim: '#9acee1'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#114d5d'
  secondary-fixed: '#d4e6e5'
  secondary-fixed-dim: '#b8cac9'
  on-secondary-fixed: '#0e1e1e'
  on-secondary-fixed-variant: '#3a4a49'
  tertiary-fixed: '#ffdcbe'
  tertiary-fixed-dim: '#f3bc87'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#643e14'
  background: '#f9f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e2e4'
  status-healthy: '#4ADE80'
  status-warning: '#FBBF24'
  status-severe: '#FB7185'
  background-warm: '#FAF9F6'
  surface-soft: '#F0F2F5'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  ai-badge:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-max: 640px
  gutter: 24px
  margin-mobile: 20px
  stack-gap: 32px
---

## Brand & Style

The design system is built on the philosophy of **Radical Personalization** and **Science-Informed Warmth**. It moves away from the sterile, cold aesthetics of traditional clinical tools, instead embracing a "human-first" approach that feels empathetic and safe. The goal is to provide a sanctuary for users to explore their mental well-being without judgment.

The visual style is a blend of **Soft Minimalism** and **Glassmorphism**. It utilizes generous whitespace (breathability), high-quality typography, and translucent layered surfaces to create a sense of lightness and clarity. The interface should feel like a supportive companion—calm, clear, and focused on the user's journey toward recovery and self-discovery.

**Design Principles:**
- **Zero Friction:** One task at a time to minimize cognitive load.
- **Affirming, Not Diagnostic:** Language and visuals prioritize "Who you are" over "What is wrong."
- **Visual Theatre:** Using purposeful delays and animations to build value in AI-driven insights.

## Colors

The palette is anchored by "Recharge Blue"—a deep teal that evokes stability and depth. This is paired with a warm, off-white background (`#FAF9F6`) to ensure the interface feels "human" rather than "digital white."

**Semantic Logic:**
- **Primary:** Used for key actions and branding.
- **Secondary:** A soft tint of the primary, used for background fills and subtle highlights.
- **Status Colors:** High-saturation but "soft" tones used to communicate burnout severity levels. They must always maintain a 4.5:1 contrast ratio against the warm background when used for text.
- **Backgrounds:** Use the warm neutral for the base page and soft grays for secondary surface containers.

## Typography

This design system uses a dual-font strategy. **Outfit** provides a geometric yet friendly personality for headings, while **Inter** ensures maximum readability for descriptive content and assessments.

**Key Guidelines:**
- **Tracking:** Headings use generous tracking (letter-spacing) to feel modern and airy.
- **Hierarchy:** Use `Display-lg` exclusively for the landing page hero. Use `Headline-lg` for section starts (e.g., "Part 2 — Personality Profile").
- **Readability:** Body text should never drop below 16px to ensure accessibility during periods of high stress or fatigue.

## Layout & Spacing

The system employs a **Centered Fluid Grid** optimized for a 640px max-width container. This ensures that on desktop, the content feels focused and intimate, mimicking a mobile experience to reduce eye scanning effort.

**Layout Model:**
- **Mobile First:** All layouts are designed for single-hand interaction.
- **Vertical Rhythm:** A strict 8px baseline grid.
- **Progressive Disclosure:** Each question is centered vertically and horizontally in the viewport, removing all other distractions except the progress bar.
- **Breakpoints:**
  - **Mobile:** < 480px (20px margins)
  - **Tablet/Desktop:** > 480px (Centered 640px container)

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Glassmorphism**, avoiding heavy, dark shadows that can feel oppressive.

- **The Base:** The `background-warm` layer.
- **Surface Layer:** Cards use a white background with a very subtle 1px border (`rgba(0,0,0,0.05)`) and a diffused, low-opacity shadow (Blur: 20px, Y: 10, Opacity: 4% of Primary Color).
- **Glassmorphism:** For overlays, AI result cards, and the "Moment of Theatre" screens, use a backdrop-blur (12px) with a semi-transparent white tint (80% opacity). This creates a sense of depth and focus without losing the context of the app.

## Shapes

The shape language is defined by **Extreme Rounding** (Pill-shaped/3xl) to project friendliness and safety.

- **Primary Components:** Buttons, input fields, and chips use a 1rem (16px) radius.
- **Cards:** Large containers and personality profile cards use a 2rem to 3rem (32px-48px) radius to create a "soft object" feel.
- **Charts:** Progress rings and bar charts must have rounded caps on all stroke ends to maintain the soft visual theme.

## Components

### Buttons
Primary buttons are pill-shaped, using the `Primary Color` with white text. Secondary buttons use a `Secondary Color` fill with `Primary Color` text. Hover states should include a subtle scale-up (1.02x) rather than a drastic color change.

### The Burnout Ring
A central donut chart for the results page. The stroke weight should be thick (approx 12-16px) with rounded ends. The color of the active segment must dynamically change based on the status (Green, Amber, or Coral).

### Assessment Cards
Question cards should have no borders, relying on a subtle glassmorphism effect or a soft shadow. Options within the assessment should subtly highlight on tap/click with a 200ms ease-in-out transition.

### Personality Chips
Small badges used to categorize traits. These use high-roundness and the `Secondary Color` as a background to keep the UI light.

### AI Badge
A tiny, high-contrast label (Inter Bold, 11px) with a subtle gradient background to distinguish machine-generated recommendations from standard assessments.

### Recommendation Cards
Cards featuring "AI Tips" should include a soft-colored icon on the left and use `body-md` typography. These cards are the primary "identity content" intended for social sharing.