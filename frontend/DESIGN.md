---
name: Aureate Forest Boutique
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#404944'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#242f41'
  on-tertiary: '#ffffff'
  tertiary-container: '#3a4558'
  on-tertiary-container: '#a7b2c9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  surface-cream: '#FAF9F6'
  border-subtle: '#E2E8F0'
  gold-muted: '#B45309'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
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
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  section-gap: 8rem
  grid-gutter: 2rem
  container-margin: clamp(1rem, 5vw, 4rem)
  stack-sm: 0.5rem
  stack-md: 1.5rem
---

## Brand & Style

This design system is curated for a high-end musical instrument boutique, specifically focusing on the artistry and precision of the saxophone. The brand personality is **distinguished, authoritative, and soulful**, aiming to evoke the same emotional response as a premium woodwind instrument: a blend of heritage craftsmanship and modern performance.

The visual direction follows a **Modern Minimalist** approach with **Luxurious Editorial** influences. It utilizes expansive whitespace to allow the product photography to breathe, paired with a high-contrast palette of deep forest tones and metallic accents. The aesthetic moves away from standard e-commerce patterns toward a "gallery" feel, reinforcing the idea that these instruments are investments and works of art rather than mere commodities.

Targeting professional musicians, educators, and serious students, the UI prioritizes trust through structured layouts, sophisticated typography, and a refined "boutique" atmosphere that distinguishes it from mass-market retailers.

## Colors

The palette is anchored by **Deep Forest Green**, providing a grounded, prestigious foundation that feels more sophisticated than standard blacks or blues. **Premium Gold** is used sparingly as a "high-note" accent—reserved for primary calls to action, price highlights, and key brand markers.

- **Primary (#064E3B):** Used for navigation backgrounds, footers, and heavy-weight headings. It represents the "Forest" part of the narrative.
- **Secondary (#D97706):** The "Aureate" accent. Used for high-priority interactive elements and specialized trust badges.
- **Neutral (#F8FAFC/White):** Provides the clinical, clean background required for readability and product focus. 
- **Surface Cream (#FAF9F6):** Used for section backgrounds to subtly differentiate content blocks without the harshness of pure white, adding a tactile, paper-like quality.

## Typography

This system uses a traditional high-contrast pairing to establish an editorial feel. **Playfair Display** (Serif) is the voice of the brand, used for headings to convey elegance and history. **Inter** (Sans-Serif) handles the technical and functional data, ensuring that price points, specifications, and descriptions remain clear and modern.

Large display type should be set with tight letter spacing and used sparingly for hero sections. Product names on cards should use `headline-md` to maintain a sense of importance. Labels and categories utilize a wide letter-spaced `label-sm` in uppercase to create a "metadata" aesthetic common in luxury catalogs.

## Layout & Spacing

The layout philosophy is based on a **Fixed Grid** with generous, intentional whitespace (the "Luxury Gap"). On desktop, a 12-column grid is used with a maximum container width of 1280px. 

- **Vertical Rhythm:** Large gaps (8rem) between major sections prevent the store from feeling cluttered.
- **Product Grids:** A 3 or 4-column layout on desktop, moving to a 2-column layout on tablet, and a single-column featured layout on mobile.
- **Micro-spacing:** Content within cards follows a strict "stack" logic—using `stack-sm` for related items (label + title) and `stack-md` for distinct groups (title + price).

Mobile reflow focuses on maintaining the Serif typography size for impact while reducing container margins to maximize product image visibility.

## Elevation & Depth

This design system avoids heavy drop shadows in favor of **Tonal Layering** and **Low-Contrast Outlines**. Depth is created through surface color shifts rather than physical metaphors.

- **Primary Surfaces:** Use pure white (#FFFFFF) for the main background.
- **Secondary Surfaces:** Use the Neutral/Cream tone for section backgrounds to create a "layered" effect.
- **Cards:** No shadows. Instead, cards use a `1px` solid border in `border-subtle` (#E2E8F0). On hover, the border color shifts to the Gold accent or the card gains a very soft, high-diffusion ambient shadow (0px 20px 40px rgba(6, 78, 59, 0.05)).
- **Interactive Elements:** Use the Primary green for solid depth, with the Gold accent providing the highest level of visual "pop" for the most critical actions.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding removes the aggressive sharpness of a brutalist design while remaining far more professional and "buttoned-up" than a fully rounded or pill-shaped system. It reflects the precision of instrument engineering—defined edges with just enough refinement to feel comfortable and modern.

Buttons and input fields should strictly adhere to the `rounded-sm` (0.25rem) standard. Product images may remain sharp (0px) to mimic high-end photography prints.

## Components

### Buttons
- **Primary:** Solid `Primary Green` background, white text, `label-sm` typography. 
- **Secondary:** Transparent background, `Primary Green` 1px border, or solid `Gold` for high-conversion areas like "Purchase."
- **Tertiary/Ghost:** No border, `Primary Green` text with a 1px underline that appears on hover.

### Product Cards
Cards are the heart of the boutique. They feature a generous image area at the top, followed by a center-aligned or left-aligned stack:
1. `label-sm` (Category in Primary Green)
2. `headline-md` (Instrument Name)
3. `body-md` (Price in Gold-Muted)
4. A refined, low-profile "View Details" button.

### Input Fields & Search
Search bars should be minimalist, using a subtle bottom-border only or a very light gray stroke. Typography inside inputs should be `body-md` in `Inter`.

### Trust Markers
Stats (e.g., "500+ Customers") should use `headline-lg` in Gold paired with `label-sm` in White/Neutral, typically placed against a `Primary Green` background section to create a "premium seal" effect.