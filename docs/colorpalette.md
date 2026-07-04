---
name: Baik Berdampak
colors:
  surface: '#ffffff'
  surface-dim: '#dedce0'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f7fa'
  surface-container: '#f1f1f4'
  surface-container-high: '#ebebef'
  surface-container-highest: '#e5e5e9'
  on-surface: '#1a1c1e'
  on-surface-variant: '#44474e'
  inverse-surface: '#101415'
  inverse-on-surface: '#f1f0f4'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#f56a1f'
  primary: '#f56a1f'
  on-primary: '#ffffff'
  primary-container: '#ffdbc8'
  on-primary-container: '#2d1600'
  inverse-primary: '#ffb596'
  secondary: '#0675ee'
  on-secondary: '#ffffff'
  secondary-container: '#d4e3ff'
  on-secondary-container: '#001b3e'
  tertiary: '#535f70'
  on-tertiary: '#ffffff'
  tertiary-container: '#d7e3f8'
  on-tertiary-container: '#101c2b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#410002'
  primary-fixed: '#ffdbc8'
  primary-fixed-dim: '#ffb596'
  on-primary-fixed: '#2d1600'
  on-primary-fixed-variant: '#6e3000'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a2c9ff'
  on-secondary-fixed: '#001b3e'
  on-secondary-fixed-variant: '#00497d'
  tertiary-fixed: '#d7e3f8'
  tertiary-fixed-dim: '#bbc7db'
  on-tertiary-fixed: '#101c2b'
  on-tertiary-fixed-variant: '#3b4858'
  background: '#ffffff'
  on-background: '#1a1c1e'
  surface-variant: '#e1e2ec'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 68px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 48px
---

## Brand & Style

The brand personality is rooted in "Impactful Benevolence"—combining a professional, institutional foundation with a vibrant, optimistic drive for social change. It aims to evoke trust, clarity, and energy.

The design system utilizes a **Modern Corporate** style with **Tactile / Glassmorphism** accents. It balances a clean, bright, white foundation with high-energy brand accents and subtle depth through soft tonal layers. This approach mirrors the public site at baikberdampak.org, ensuring the platform feels like a high-tech solution for social impact, rather than a traditional, static non-profit site.

## Colors

This design system is built on a clean **light** foundation, aligned with the baikberdampak.org website (pure-white backgrounds, near-black text). The accent palette is extracted directly from the GBB logo:

*   **Primary (Momentum Orange `#F56A1F`):** The vibrant orange taken straight from the logo. It drives primary calls-to-action and buttons, exactly as on the website (e.g. "Ikut patungan GBB", "Download").
*   **Secondary (Impact Blue `#0675EE`):** The logo blue. Used for links, secondary actions, and core brand recognition — following standard web convention.
*   **Surface (Pure White):** The core background is `#ffffff`, matching the website's bright, minimalist aesthetic. The dark navy `inverse-surface` (`#101415`) is reserved for footer-style sections.
*   **Typography:** Primary text is a near-black slate (`#1a1c1e`) for high contrast on white, while secondary text uses a muted slate (`#44474e`) to establish hierarchy.

## Typography

We use **Plus Jakarta Sans** across the entire system. Its geometric yet friendly character aligns perfectly with the brand's contemporary and approachable mission.

*   **Headlines:** Heavy weights (700) with tight letter-spacing are used to create a "locked-in," impactful look for key messaging.
*   **Body:** Medium sizing with generous line height ensures high legibility on dark backgrounds.
*   **Hierarchy:** Use the Bold weight for primary calls to action and navigational links to maintain brand presence even at smaller sizes.

## Layout & Spacing

The design system employs a **Fluid Grid** approach within a centered container.

*   **Grid:** A 12-column layout for desktop with 24px gutters. On mobile, this collapses to a single-column layout with 20px side margins.
*   **Vertical Rhythm:** Spacing is defined in multiples of 8. Sections are typically separated by `stack-lg` to provide ample breathing room, echoing the minimalist, "premium" feel of the brand.
*   **Alignment:** Text is primarily left-aligned to ground the layout, while icons and decorative elements can be used more dynamically to create a sense of movement.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** and **Soft Shadows**:

1.  **Base Layer:** The pure-white page background.
2.  **Floating Layer:** Interactive elements like cards use a slightly off-white surface container (`surface-container-low`/`-high`) with a subtle 1px low-contrast outline to define their edges.
3.  **Active Depth:** Primary buttons and featured cards utilize a soft, colored shadow (using the Primary Orange) to lift them off the surface.
4.  **Glass Effects:** For secondary decorative elements (like background icons), use a backdrop blur of 12px over low-opacity brand-tinted fills to create a sense of glass-like transparency.

## Shapes

The shape language is highly approachable. We utilize a **Pill-shaped (Level 3)** roundedness for buttons and interactive components to soften the "tech" feel of the dark UI.

*   **Buttons:** Always fully pill-shaped (rounded-full).
*   **Cards:** Use `rounded-xl` (1.5rem / 24px) to maintain a friendly, soft aesthetic.
*   **Icons:** Contained within rounded squares or circles with consistent padding.

## Components

### Buttons
Primary buttons are pill-shaped, using the Primary Orange background with white text. They include a subtle soft shadow in the same orange. Secondary buttons use a transparent background with a blue 1.5px border and blue text.

### Cards
Cards are stylized as "Glass Tiles." They should have a surface-container background slightly off the pure-white page, a subtle low-opacity border (`outline-variant`), and a 12px border radius.

### Input Fields
Inputs use the same "Glass Tile" style with a light surface-container fill. On focus, the border transitions to Primary Orange with a soft outer glow.

### Chips/Tags
Used for categories like "Beasiswa" or "Donasi." These should be small, pill-shaped, and use low-opacity versions of the secondary or primary colors (e.g., 10% Orange background with 100% Orange text).

### Lists
Lists are clean and minimal, separated by subtle low-contrast lines (`outline-variant`). Use the primary orange for bullet icons or checkmarks to draw the eye.