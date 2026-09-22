---
name: Wise Owl
description: A one-person web design studio, set as the biggest display ad in the local directory's WEB DESIGN category.
colors:
  accent: "#1f3fd1"
  royal: "#1730a8"
  accent-fg: "#ffffff"
  bg: "#f4f7fe"
  surface: "#ffffff"
  fg: "#0f1f5c"
  muted: "#3d4f8f"
  subtle: "#5d6da4"
typography:
  display:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "3.05rem"
    fontWeight: 900
    lineHeight: 1.04
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 75"
  title:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "2.4rem"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 125"
  body:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  agate:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "normal"
    fontVariation: "'wdth' 87.5"
  label:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 900
    lineHeight: 1.33
    letterSpacing: "0.1em"
    fontVariation: "'wdth' 75"
  action:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.43
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 87.5"
rounded:
  square: "0px"
  portrait: "9999px"
spacing:
  gutter: "16px"
  gutter-md: "24px"
  gutter-lg: "32px"
  section: "48px"
  container: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    typography: "{typography.action}"
    rounded: "{rounded.square}"
    padding: "0 32px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.royal}"
    textColor: "{colors.accent-fg}"
  button-header:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    typography: "{typography.action}"
    rounded: "{rounded.square}"
    padding: "0 16px"
    height: "40px"
  category-band:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    typography: "{typography.headline}"
    rounded: "{rounded.square}"
    padding: "12px 32px"
  display-ad:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.square}"
    padding: "20px"
  coupon:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.square}"
    padding: "40px"
  input-underline:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.square}"
    padding: "0 2px"
    height: "44px"
  nav-link:
    textColor: "{colors.muted}"
    typography: "{typography.action}"
  nav-link-hover:
    textColor: "{colors.accent}"
---

# Design System: Wise Owl

## Overview

**Creative North Star: "The Local Directory"**

The public site is printed like a page from a local business directory. Two inks carry everything: royal blue on ice-white, with deep navy (a double pass of the blue) for reading text. Structure comes from rules instead of surfaces: full-width reversed category bands open every section, square ruled boxes hold the display ads, dotted leaders tie a name to its detail, and a dashed coupon holds the call request. The only curve in the world is the portrait circle.

Archivo's width axis sets the voice. Expanded black (wdth 125) is for names and promises, like the display ads. Condensed black (wdth 75) is for category bands, step verbs and field labels. Slightly condensed (wdth 87.5) is for action labels and the agate detail lines. Body text sits at normal width. The page is dense the way a directory is dense, with tight bands and listings, but body text keeps generous leading and a short measure.

Motion is a single load moment. The first category band wipes in from left to right, then the display ad's double rule draws, and its inner hairline prints. After that, hover feedback is short and mechanical. Reduced motion shows everything at rest. There are no drop shadows, gradients or paper texture, and the site is never dark.

**Key Characteristics:**
- Two inks: royal blue and navy on ice-white.
- Every section opens with a full-width reversed blue band in condensed white caps, plus an optional "see also" line.
- Square ruled boxes: a 3px outer rule, 2px structural rules and 1px hairlines.
- Dotted leaders join each listing to its detail.
- The width axis carries hierarchy: expanded for names, condensed for bands and labels.
- One load moment (wipe, draw, print); otherwise static.

**Operational surfaces.** The private Studio (`/studio`) inherits the same color tokens and Archivo. It speaks in a quieter operational register: rounded panels (the `--radius-*` scale, 8 to 24px), a sidebar, tables, and the `raised` / `line` / `line-strong` tokens. That register belongs to Studio only and is not part of the directory grammar described here.

## Colors

This is a two-ink print palette. Blue does the shouting, navy does the reading, and ice-white is the paper tone without any paper texture.

### Primary
- **Royal Directory Blue** (accent): the single ink for category bands, ad rules, leaders, labels, links, the call button and the focus outline. Text selection is reversed into it.
- **Pressed Royal** (royal): the hover state of every filled blue action. It is a darker pass of the same ink, never a new hue.
- **Reversed White** (accent-fg): text knocked out of blue bands and buttons.

### Neutral
- **Ice White** (bg): the page ground behind everything, including ad boxes, the header and the footer.
- **Coupon White** (surface): pure white, used only inside the dashed coupon and behind screenshots so the coupon reads as a cut-out slip.
- **Double-Pass Navy** (fg): headlines, listing names and the primary reading color.
- **Directory Navy** (muted): body copy, agate detail lines and inactive nav (7.2:1 on bg).
- **Faded Navy** (subtle): placeholders and the copyright line only (4.7:1 on bg). Use it at small sizes only where it still passes AA.

Rules and dividers are the accent at reduced strength rather than separate tokens: dividers at 20%, screenshot frames at 40%, leaders at 45%, and the ad's inner hairline at 60%.

### Named Rules
**The Two Inks Rule.** Blue and navy on ice-white only. A new color is a new ink, and the directory does not print one.

**The Pressed Ink Rule.** Hover darkens blue to royal. It never lightens, glows or changes hue.

## Typography

**Display Font:** Archivo, expanded (wdth 125), falling back to Arial Narrow and system-ui.
**Body Font:** Archivo, normal width (with Segoe UI and system-ui).
**Label Font:** Archivo, condensed (wdth 75 and 87.5).

**Character:** One variable family (wdth 62–125, wght 300–900) does every job a directory typesetter would need several faces for. The width axis supplies the contrast.

### Hierarchy
- **Display** (900, wdth 125, 1.85rem, then 2.6rem at sm, then 3.05rem at lg, line-height 1.04, -0.015em): the display ad's promise. Measure is 18ch at most. One per page.
- **Headline** (900, wdth 75, uppercase, 1.65rem, then 2rem at sm, line-height 1, 0.02em): the category band title, in reversed white.
- **Title** (900, wdth 125, uppercase, line-height 0.95, 0.01em): names in ads and listings. 2.4rem for a feature ad, 1.45–1.65rem for smaller ads. The about name runs at 2–2.6rem, wdth 112.5.
- **Step verb** (900, wdth 75, uppercase, 2.6rem, in accent): the one-word step headings in the process row, and the coupon's headline at 2.4–3rem.
- **Body** (400, 0.95–1.125rem, line-height 1.625): reading text in muted navy, with a 40–52ch measure.
- **Agate** (400, wdth 87.5, 0.875rem): trade and place lines, listing details, and the band's "see also" line (500 weight, 0.8rem).
- **Label** (900, wdth 75, uppercase, 0.75rem, 0.1em): field labels, definition terms, and the agate column's heading, in accent.
- **Action** (700, wdth 87.5, uppercase, 0.8–0.875rem, 0.06–0.08em): nav links, "Visit" and secondary action lines. The primary call button steps up to 800 weight at 1.125rem.

### Named Rules
**The Width Is Voice Rule.** Expanded is for names and promises, and condensed is for bands, labels and verbs. Change width before you reach for a new size or weight.

**The Tabular Number Rule.** Phone numbers use tabular figures, both in the field and in the printed listing.

## Layout

The page is a stack of category sections. Each one is a full-width blue band followed by a 1280px container, with gutters of 16px, then 24px at sm, then 32px at lg. Section bodies are padded 32px, rising to 48px at lg. Grid gaps are 24px, rising to 32px at lg.

- The first viewport is a three-column directory. The display ad spans two columns, and an agate listing column sits in the third, divided by a 2px blue rule. On phones the ad stacks above the agate column, and the rule moves to the top. The call action stays above the fold on both.
- The work grid has six columns at lg. The feature ad spans 4 with a narrow ad at 2, then two strip ads share the row at 3 and 3. Below lg, everything stacks to one column.
- The process row is five columns at lg, split by vertical 2px rules. It becomes two columns at sm and one on phones, with top rules instead.
- About sets the portrait beside the text column (max 48rem), with facts in a two-column definition list (10rem term).
- The header is sticky, 64px tall, and ruled 2px underneath. The footer is centered.

**The Band Opens Every Section Rule.** A new section starts with a category band that has a title and an optional "see also" line. Sections have no other kind of header.

## Elevation & Depth

The system is flat and printed. Depth comes from ink weight and nesting. A double rule reads as more important than a single rule, and the white coupon inside a dashed border reads as a separate slip. Nothing floats.

### Named Rules
**The Ink Not Shadow Rule.** No drop shadows, glows or gradients. The one box-shadow in the system is a flat 2px blue line under a focused field. It works as a thicker rule and never as a lift.

## Shapes

Every box, band, button, field and screenshot has square corners. Form comes from rules at three weights: a 3px outer frame (the display ad and the coupon's dashed border), 2px structural rules (ad boxes, band edges, dividers between listing groups, header and footer), and 1px hairlines (the ad's inner frame, screenshot frames and list dividers). Dotted 2px leaders run between a listing's name and its detail. The only circle is the portrait: a round crop with a 2px blue outline offset from the photo, kept modest (48–64px in the ad, 128–176px in About).

**The Square Corner Rule.** On directory surfaces the radius is 0. Only the portrait is round.

## Components

### Buttons
Tactile blue slabs, set like a bold phone listing.
- **Shape:** square (0px).
- **Primary call:** accent fill, reversed white, 800 weight, wdth 87.5, uppercase, 56px tall, with a leading phone icon.
- **Header call:** the same slab at 40px (36px compact on phones), 700 weight, 0.875rem.
- **Hover / Active:** fill darkens to royal over 150ms, and the button scales to 0.97–0.98 on press. Disabled drops to 60% opacity.
- **Focus:** a 2px accent outline with a 2px offset (global).
- **Text links:** accent with a 2px underline offset 4px. On hover the underline fades to 40%. Action-style links (all caps, wdth 87.5) show the underline only on hover.

### Category Band
A full-bleed accent strip with a condensed black uppercase title in white on the left and a "see also" line at 85% white on the right (stacked on phones). The page's first band wipes in on load.

### Display Ad (signature)
- **Hero ad:** a 3px double-ruled frame (four drawn rules plus an inner 1px hairline inset 7px at 60%). It holds the owl mark with the expanded WISE OWL wordmark, the portrait, the display promise, body copy and a full-width reversed call line with a light dotted leader.
- **Client ads:** a 2px accent box on ice-white, padded 16px (20px at sm). Each has an expanded name, an agate trade line, a 16:10 screenshot framed in a 1px hairline (uncropped, top-aligned), a short description, and a **listing line**: a 2px top rule, then "Visit", a dotted leader, the host in black wdth 112.5, and an arrow.
- **Hover:** the screenshot lifts 4px (the phone inset lifts 8px) over 300ms ease-out. The arrow nudges up and to the right.

### Listing Row
Name in bold navy, a dotted leader that fills the gap, and the detail in agate muted navy. Rows are split by 20% accent hairlines, with rules above and below the group. The same row is used in the agate column, the About facts and the printed call request.

### Coupon and Inputs
- **Coupon:** a 3px dashed accent border with a 6px gap, then a white slip inside, padded 20px (40px at lg).
- **Fields:** fill-in underlines, not boxes. They are transparent and square, 44px tall, with 1.125rem text and a 2px bottom rule at 75% accent. On hover the rule goes to full accent. On focus it thickens to 4px with the flat under-line. Labels use the condensed label style, and optional markers are sentence-case muted.
- **Signature interaction:** after a successful send, the request prints back into the coupon as a new listing row (business, leader, phone in tabular accent) using the print motion.

### Navigation
The running head is sticky on ice-white with a 2px accent rule underneath. It has the wordmark on the left and uppercase links (0.8rem, wdth 87.5, muted) that turn accent on hover, then the header call button. On phones, the call button and a 44px menu toggle open a full-width list of 48px rows with 15% accent dividers.

### Motion
- **Wipe:** the band clips in from left to right over 700ms with cubic-bezier(0.16, 1, 0.3, 1).
- **Draw:** the ad's rules scale in over 800ms with a 250ms delay.
- **Print:** fade, 6px rise and 3px blur clearing, over 600ms with a 350ms delay.

All three run only under `prefers-reduced-motion: no-preference`, and content is visible by default.

## Do's and Don'ts

### Do:
- **Do** open every public section with a category band: a condensed black uppercase title on accent, plus a "see also" line.
- **Do** build containers from rules at three weights (3px frame, 2px structure, 1px hairline) with square corners.
- **Do** join names to details with dotted leaders, and set phone numbers in tabular figures.
- **Do** use Archivo's width axis for hierarchy: wdth 125 for names and promises, 75 for bands, verbs and labels, 87.5 for actions and agate.
- **Do** show client screenshots whole at 16:10, top-aligned, in a 1px hairline frame.
- **Do** keep the portrait a modest circle with a 2px offset blue outline.
- **Do** darken filled actions to royal on hover. Keep hover transitions at 150–300ms and limit load motion to the wipe, draw and print sequence.

### Don't:
- **Don't** add drop shadows, glows, gradients or paper texture. Depth is ink weight.
- **Don't** round boxes, buttons, fields or screenshots on directory surfaces. The Studio's rounded panels stay in the Studio.
- **Don't** introduce a third ink or a dark theme.
- **Don't** show the headshot full-bleed or as anything other than a small circle.
- **Don't** replace the fill-in underline fields with boxed inputs on the public site.
