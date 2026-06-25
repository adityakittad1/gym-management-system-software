# TTZ Gym Management Dashboard — Design Guidelines

## Aesthetic Stance: Kinetic Luxury

This dashboard follows a **kinetic** aesthetic inspired by premium fitness branding and cinematic motion design. Dark backgrounds with bold yellow highlights create drama and energy while maintaining professional clarity.

## Typography

**Display:** Rajdhani (Bold, 700) — angular geometric sans with athletic energy  
**Body:** Inter (Regular 400, Medium 500, Semibold 600) — clean, readable, modern  
**Data/Labels:** JetBrains Mono (Medium 500) — for tables, stats, and structured data

## Color Palette

**Ground:** Matte black (#0a0a0a) with dark gray surfaces (#171717, #262626)  
**Accent:** Rich yellow (#fbbf24 / amber-400) for CTAs, highlights, and active states  
**Neutrals:** Zinc scale for borders, muted text, and subtle surfaces  
**Status colors:**
- Green (#22c55e) — Active, Paid, Present
- Orange (#f97316) — Expiring soon, Warning
- Red (#ef4444) — Expired, Pending, Absent

## Layout Principles

1. **Dark canvas dominance** — Deep black backgrounds with elevated cards in dark gray
2. **Yellow sparingly** — Use for primary actions, active states, and key metrics only
3. **Information density** — Dashboard should feel data-rich but not cluttered
4. **Card elevation** — Subtle borders and slight background lift for panels
5. **Cinematic spacing** — Generous whitespace around major sections

## Component Style

- **Buttons:** Yellow primary, dark secondary, rounded corners (0.5rem)
- **Cards:** Dark gray bg (#171717), thin zinc borders, 0.75rem radius
- **Tables:** Dense rows, alternating subtle backgrounds, mono fonts for data
- **Stats:** Large numbers with yellow highlights, icon + label pattern
- **Charts:** Dark theme with yellow primary line/bars
- **Forms:** Dark inputs with yellow focus rings

## Interactive States

- Hover: Subtle yellow glow or background shift
- Active: Full yellow for primary, yellow border for secondary
- Focus: Yellow ring (2px)
- Disabled: 40% opacity

## Content Guidelines

Use realistic gym data:
- Real member names and phone numbers (Indian style)
- Actual membership plans (Monthly, Quarterly, Annual)
- Real payment amounts (₹ symbol)
- Authentic gym activities and trainer names
