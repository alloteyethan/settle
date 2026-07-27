# SETTLE — Design System

**Product:** Peer-to-peer escrow payment platform for WhatsApp & Instagram sellers
**Core flow:** Create Deal Link → Buyer Pays into Escrow → Confirm & Get Paid
**Design direction:** Calm, trustworthy, professional. Cream/paper background, no gradients, no glossy fintech clichés. Think "a bank you'd trust run by people who understand WhatsApp commerce" — closer to Stripe's restraint and Wise's warmth than PayPal's blue-and-glow.

---

## 1. Brand Principles

- **Trust over hype.** No gradients, no neon, no glassmorphism, no drop-shadowed "3D" buttons. Flat color, clean lines, generous whitespace.
- **Calm confidence.** The product is holding people's money — the UI should feel steady, not exciting. Avoid urgency-red, avoid confetti/emoji-heavy copy.
- **Legible at a glance.** Sellers are often on mid-range Android phones checking this mid-conversation on WhatsApp. Every screen must work at a glance, one-handed, on 3G.
- **Quietly premium.** Cream paper background + a single confident accent color + a lot of negative space reads as "professional" without needing decoration.

---

## 2. Color Palette

No gradients anywhere in the product. Every color below is a flat, single value.

### Base
| Token | Hex | Use |
|---|---|---|
| `--bg-cream` | `#FAF6EE` | Primary app background |
| `--bg-cream-alt` | `#F3EDE0` | Section backgrounds, subtle zebra panels |
| `--surface-card` | `#FFFFFF` | Cards, modals, inputs sitting on cream |
| `--border-hairline` | `#E4DDCB` | Card borders, dividers |

### Ink (text)
| Token | Hex | Use |
|---|---|---|
| `--ink-900` | `#1F1B14` | Headlines, primary text |
| `--ink-700` | `#4A4438` | Body text |
| `--ink-500` | `#8A8271` | Secondary/muted text, placeholders |
| `--ink-300` | `#C7BFAC` | Disabled text, subtle icons |

### Accent — Primary (Trust Green)
Used for primary actions, "money is safe" states, links.
| Token | Hex | Use |
|---|---|---|
| `--accent-900` | `#123C2E` | Hover/active state of primary buttons |
| `--accent-700` | `#1C5A44` | Primary buttons, links, active nav |
| `--accent-100` | `#E1EBE3` | Success backgrounds, badges |

### Status colors (flat, no gradients)
| Token | Hex | Use |
|---|---|---|
| `--status-pending` | `#B7791F` (on `#FBF0DA` bg) | Awaiting payment / awaiting confirmation |
| `--status-success` | `#1C5A44` (on `#E1EBE3` bg) | Funds released / delivered |
| `--status-locked` | `#3E5C76` (on `#E7ECF1` bg) | Funds in escrow |
| `--status-error` | `#A33B2E` (on `#F7E6E2` bg) | Disputes, failed payment |

**Rule:** status color always pairs a dark text tone with a light flat background tone — never a saturated fill with white text (too "app-alert," not "bank statement").

---

## 3. Typography

Single typeface family. No display/script fonts. No mixing more than one family.

- **Primary font:** `Inter` (or `IBM Plex Sans` as an alternative — both are neutral, professional, excellent at small sizes)
- **Monospace (for codes, amounts, IDs):** `IBM Plex Mono` — used specifically for the 4-digit confirmation code, deal amounts, and transaction IDs, so numbers feel precise and unspoofable.

### Scale
| Style | Size | Weight | Line height | Use |
|---|---|---|---|---|
| Display | 40px | 600 | 1.15 | Landing hero only |
| H1 | 28px | 600 | 1.2 | Page titles |
| H2 | 20px | 600 | 1.3 | Section headers, card titles |
| H3 | 16px | 600 | 1.4 | Subsection labels |
| Body | 15px | 400 | 1.6 | Paragraphs, descriptions |
| Body Small | 13px | 400 | 1.5 | Helper text, captions |
| Label | 12px | 500, uppercase, +0.04em tracking | 1.2 | Form labels, table headers, status tags |
| Amount (mono) | 24–32px | 500 | 1.2 | Deal/escrow amounts |
| Code (mono) | 20px | 600, +0.15em tracking | 1.2 | 4-digit confirmation code |

**Rules:**
- No font weight above 600 anywhere (no black/900 weights — reads as shouting).
- Body copy is never pure black — always `--ink-700` on cream, for a softer, paper-like contrast.
- Numbers/currency always in the mono face, everywhere in the product, for consistency and to prevent digit-swap confusion (1 vs 7, 0 vs O).

---

## 4. Layout & Spacing

- **Base unit:** 4px. All spacing/margins/padding are multiples of 4 (4, 8, 12, 16, 24, 32, 48, 64).
- **Max content width:** 1120px for marketing pages, 640px for app/dashboard screens (single-column focus, not a sprawling dashboard).
- **Card padding:** 24px mobile / 32px desktop.
- **Corner radius:** 12px on cards and buttons, 8px on inputs and small tags, 999px (pill) only for status badges. Consistent radius scale — never mix 4px and 20px in the same view.
- **Borders over shadows.** Default to a 1px `--border-hairline` border for separation. Use shadow only for true overlays (modals, dropdowns), and keep it a single soft flat shadow — no colored/multi-layer shadows.
  - `--shadow-overlay: 0 8px 24px rgba(31, 27, 20, 0.10)`
- **Dividers:** 1px `--border-hairline`, never a gradient fade.

---

## 5. Components

### Buttons
- **Primary:** `--accent-700` fill, white text, 12px radius, no shadow, no gradient. Hover = `--accent-900`. Height 48px on primary CTAs, 40px in-app.
- **Secondary:** transparent fill, 1px `--border-hairline` border, `--ink-900` text. Hover = `--bg-cream-alt` fill.
- **Ghost/Text button:** no border, `--accent-700` text, underline on hover.
- **Destructive:** transparent fill, `--status-error` text + border, solid fill only on final confirmation step.
- No icon-only buttons without a text label in critical flows (payment, confirmation) — always label + optional icon, never icon alone, for trust and accessibility.

### Inputs
- White surface, 1px `--border-hairline`, 8px radius, 44px height (mobile-friendly tap target).
- Focus state: border becomes `--accent-700` at 1.5px, no glow/shadow halo.
- Label always above the field (never inside as placeholder-only), 12px uppercase label style.
- Currency inputs show a fixed prefix (e.g., `GHS`) in `--ink-500`, value in mono.

### Cards
- White surface on cream background, 1px hairline border, 12px radius, 24–32px padding.
- Use **one** card style throughout — resist adding accent-colored top borders or icon badges unless it's a status card.

### Status Badges (pill)
- Flat background + matching dark text (see status color table), 12px label text, uppercase, 4px/10px padding, pill radius.
- Example: `⬤ IN ESCROW` in `--status-locked` — but prefer a small flat dot instead of an emoji circle; use a solid 6px circle SVG.

### Step Indicator (for the 3-step flow)
- Horizontal on desktop, vertical on mobile.
- Each step = numbered circle (outline `--ink-300` if upcoming, filled `--accent-700` if active/complete) + label below/beside.
- Connecting line: 1px `--border-hairline`, turns `--accent-700` as steps complete. No animated gradient progress bars.

### Tables / Transaction Lists
- Row height 56px, 1px hairline row dividers, no zebra striping (keep it quiet — cream background already does the separating).
- Amounts right-aligned, mono font.
- Status column uses the pill badge.

### Confirmation Code Display
- Large mono digits in individual boxed cells (4 separate 48x56px boxes, 1px hairline border, white fill), not a single blurred password-style field — this is a trust-critical element and should look deliberate, like a bank OTP field.

---

## 6. Iconography & Imagery

- Line icons only, 1.5px stroke, no filled/duotone icon sets, no emoji in UI chrome (emoji is fine only in optional chat/share-message copy, never in buttons/status/nav).
- No stock photography of people shaking hands / smiling at phones. If imagery is used at all, prefer simple flat-line illustrations of the escrow concept (link → lock → checkmark) in `--ink-900` / `--accent-700` on cream, single-color line art — not full-color illustration packs.
- Logo mark: simple geometric lock or handshake-knot glyph, single color, works at 16px favicon size.

---

## 7. Core Flow — Screen Specs

### Landing / Marketing Page
- Cream background throughout, white cards only for feature callouts.
- Hero: H1 + one-line subhead + single primary CTA ("Create Free Seller Account") + secondary ghost CTA ("Seller Login"). No hero image gradient background — flat cream, optionally one flat-line illustration right-aligned.
- Trust strip below hero: 4 short flat badges (e.g., "Zero Buyer Sign-up," "MoMo & Card Payments," "48h Escrow Guarantee," "1-Tap WhatsApp Share") — icon + label, no borders, just spaced evenly.
- **3-step explainer** (the core value prop) rendered as three equal-width cards in a row (stack on mobile), each with: numbered circle, H3 title, 1–2 line body copy. This is the most important section on the page — give it the most vertical breathing room (64px+ top/bottom padding).

### 1. Create Deal Link
- Single-column form, max-width 480px, centered.
- Fields: Item name (text input), Price (currency input, mono), auto-computed platform fee shown as read-only line below ("Platform fee (2%): GHS X — you receive GHS Y"), delivery/escrow window note.
- Primary button: "Generate Deal Link."
- Result state: link shown in a copyable field + prominent "Share on WhatsApp" secondary button (WhatsApp icon in outline style, not brand-green filled, to stay consistent with the flat palette).

### 2. Buyer Pays into Escrow
- Buyer-facing page — must feel *extra* trustworthy since buyer has no account.
- Top: item name, price (large mono), seller name/handle.
- Status badge: "Awaiting Payment" (`--status-pending`).
- Payment method toggle: MoMo / Card — segmented control, flat, 1px border, active segment filled `--accent-700`.
- Escrow explainer directly beneath the pay button in small `--ink-500` text: "Your money is held securely by SETTLE and only released to the seller after you confirm delivery." This line is a recurring trust anchor — repeat similar copy near every payment/release action.
- After payment: status badge changes to "In Escrow" (`--status-locked`), with the 48h window shown as plain text countdown, not a graphic timer.

### 3. Confirm & Get Paid
- Buyer view: delivery confirmation screen with the 4-digit code entry (boxed mono cells as specified above), single primary button "Confirm Delivery."
- Seller view: shows deal status live — "Buyer paid," "Awaiting confirmation," then "Funds released to your MoMo wallet" with amount in mono and a receipt/download link.
- On release: status badge flips to "Released" (`--status-success`), no confetti/animation — a simple, quiet checkmark icon inline with the text is enough.

---

## 8. Voice & Microcopy

- Plain, short, declarative sentences. No exclamation points in transactional copy (fine sparingly in marketing).
- Always name what's happening to the money: "held," "locked," "released" — never vague terms like "processing."
- Errors are specific and calm: "This deal link has expired. Ask the seller to create a new one." — not "Oops! Something went wrong."

---

## 9. Do / Don't Summary

**Do**
- Flat colors, 1px hairline borders, generous whitespace, mono numerals, cream base.
- One accent color (trust green) used sparingly and consistently.
- Plain-language trust copy near every money action.

**Don't**
- Gradients, glassmorphism, glow/neon shadows.
- Multiple accent colors competing for attention.
- Emoji or filled icon badges in transactional UI.
- Dashboard-style dense tables — keep the app feeling like a calm, linear flow, not a fintech admin panel.