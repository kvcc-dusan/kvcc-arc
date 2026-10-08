# Review checklist

Run before finishing any UI task. Fix every failure or state why one cannot be fixed.

## 1. Sweeps

Run over changed files (adjust paths). Each hit is a fix unless inside user-supplied content.

```bash
grep -rn "$(printf '\342\200\224')" app components                                  # em dashes
grep -rniE "uppercase|eyebrow|overline|kicker" app components                       # uppercase / eyebrows
grep -rnE "outline:|:focus-visible|(^|[^a-z])ring-[0-9]" app components             # focus rings
grep -rnE --include="*.css" "#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(" app components        # raw colors
grep -rnE "font-weight: *(600|700|800|bold)" app components                         # bold weights
grep -rnE --include="*.css" "linear-gradient|radial-gradient" app components        # gradients (marketing backdrop only)
grep -rn --include="*.css" "100vw" app components                                    # 100vw
```

Then run the project's type check and lint.

## 2. Review

Type and copy
- Sentence case, no uppercase, no eyebrow, no em dash, no trailing heading period.
- Weights 400 and 500 only; sizes from `--text-*`; tabular numerals on changing numbers.
- Buttons verb plus object; errors say how to fix; claims true.

Color and surfaces
- Semantic tokens only. Accent only on active, selected, progress, emphasized data. Status colors paired with a label.
- No decorative gradients, glows, colored shadows. Shadows only on floating layers; cards rest on a 1px border.
- No icons in rounded tiles. No nested decorative cards.

Layout
- One page container; no double gutter; shared left edge; sibling cards aligned with a real gap.
- Concentric radii (inner = outer minus padding). 4px grid spacing: 16 in group, 24 between regions, 32 to 48 between long-form sections, 24 to 32 page padding, 64 to 120 marketing.
- Wide tables scroll inside their card.

Components
- Existing item used wherever one fits; choice matches its "when to use". Documented props only. No restyled internals. One primary button per surface.

States
- Loading, empty, error, success, disabled, long content all handled.

Motion
- Tokens from `motion-tokens`; transform and opacity only; no overshoot on state indicators; exits faster than entrances; reduced-motion branch for every animation.

React
- Server-safe first render; stable keys; reserved width for changing values.

Accessibility
- No custom focus rings. Real buttons, links, labels, ordered headings, landmarks. Icon-only controls named. Overlays trap focus and close on Escape. Async status announced.

Responsive
- 390, 768, 1024, 1440px with no sideways scroll. Touch targets at least 44px. Both themes and two accents (neutral plus one hue).

## 3. Report

State: what was built, which items were used, what is simulated or needs real data, and any line that could not be satisfied.
