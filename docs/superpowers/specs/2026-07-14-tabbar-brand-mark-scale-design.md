# TabBar Brand Mark Scale Design

## Goal

Reduce the visual weight of the top-left Jsonita brand mark while keeping it
recognisable and aligned with the existing toolbar controls.

## Decision

The selected A variant changes only the brand-mark wrapper in
`src/shell/TabBar.tsx`:

| Property | Current | Selected |
| --- | ---: | ---: |
| Mask box | 30 × 30px | 22 × 22px |
| Space before the tab list | 8px | 6px |

No other toolbar height, tab size, action spacing, icon asset, colours, or
interactions change.

## Behaviour and Accessibility

The mark remains decorative (`aria-hidden`) and non-interactive. The existing
mask, colour token, opacity, and centre alignment remain unchanged. The 44px
toolbar continues to provide the layout constraint; reducing the mark does not
change any control hit target.

## Verification

Run TypeScript checking and a production build. Inspect the top bar in the
desktop application to confirm the 22px mark is vertically centred, visually
subordinate to the active tab, and leaves a consistent 6px gap before Format.
