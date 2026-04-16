

# OB/GYN Clinical Reference App

## Overview
A mobile-first, minimalist clinical reference app for OB/GYN professionals with smart search, categorized accordion content, and bilingual (Arabic/English) clinical scripts.

## Design
- **Palette**: Soft medical blues (`#EBF5FB`, `#3B82F6`, `#1E40AF`) with clean whites
- **Dark mode**: Toggle in header, deep navy backgrounds
- **Typography**: Inter for English, system Arabic font for RTL content
- **Border radius**: Rounded, soft corners throughout
- **Animations**: Snappy accordion open/close, smooth tab transitions

## Layout & Components

### Header
- Circular logo placeholder with pulse-line + flower SVG aesthetic
- App title "OB/GYN Reference"
- Light/dark mode toggle button

### Smart Search Bar
- Centered, prominent search input with icon
- Filters accordion items in real-time across all tabs

### Content Area (4 tabs)
Each tab contains accordion groups of clinical scenarios:

1. **Clinic** — outpatient clinical situations (prenatal visits, abnormal pap, etc.)
2. **OR/Labor** — surgical & labor scenarios (C-section prep, shoulder dystocia, etc.)
3. **Behavior** — communication & behavioral scenarios (breaking bad news, consent, etc.)
4. **Q&A Bank** — quick-reference Q&A cards

### Accordion Items
Each item expands to show:
- **Situation** (EN + AR)
- **Clinical Action** (EN + AR)
- **Patient Script** (EN + AR)

Arabic text right-aligned with `dir="rtl"`.

### Bottom Navigation Bar
- Fixed bottom bar with 4 icon tabs: Clinic, OR/Labor, Behavior, Q&A Bank
- Active tab highlighted with blue accent

## Sample Data
~4-5 sample clinical scenarios per tab with realistic bilingual content to demonstrate the app.

## Technical Notes
- All state managed with React useState (no backend needed)
- Tailwind dark mode via class toggle
- Accordion from shadcn/ui
- Fully responsive, optimized for mobile viewports

