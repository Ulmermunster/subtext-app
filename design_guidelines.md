# Design Guidelines: React + Vite Starter Application

## Design Approach
**Selected Approach:** Design System - Material Design inspired with modern web aesthetics
**Rationale:** This is a demo/starter application showcasing React and Vite capabilities. A clean, component-focused design system approach ensures reusability, demonstrates best practices, and provides a professional foundation for developers to build upon.

**Key Principles:**
- Clean, minimal aesthetics that let functionality shine
- Component showcase - each section demonstrates different React patterns
- Modern spacing and hierarchy for visual clarity
- Professional polish suitable for portfolio use

## Typography

**Font Families:**
- Primary: 'Inter' (Google Fonts) - Clean, modern sans-serif for UI and body text
- Accent: 'Space Grotesk' (Google Fonts) - Bold, distinctive for headings

**Hierarchy:**
- Hero Headline: 3.5rem (56px), bold, Space Grotesk
- Section Headings: 2.25rem (36px), semibold, Space Grotesk
- Subsection Headings: 1.5rem (24px), semibold, Inter
- Body Text: 1rem (16px), regular, Inter
- Small Text/Labels: 0.875rem (14px), medium, Inter

## Layout System

**Spacing Primitives:** Tailwind units of 4, 8, 12, 16, 20 (p-4, gap-8, my-12, py-16, mb-20)
- Use consistently throughout for visual rhythm
- Component padding: p-6 or p-8
- Section spacing: py-16 (desktop), py-12 (mobile)
- Element gaps: gap-6 or gap-8

**Grid System:**
- Container: max-w-7xl mx-auto px-6
- Content sections: max-w-5xl for text-heavy areas
- Multi-column: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for feature cards

## Component Library

**Landing Page Structure:**
1. **Hero Section** (80vh)
   - Large hero image (tech/coding themed - modern workspace, code on screens, clean minimalist setup)
   - Centered headline + subheadline overlay
   - Primary CTA button with blurred background (no hover states)
   - Subtle gradient overlay on image for text readability

2. **Features Grid** (3 columns desktop, 1 mobile)
   - Icon + title + description cards
   - Use Heroicons for icons
   - Card styling: subtle border, generous padding (p-8)
   - Hover: subtle lift effect (transform translateY)

3. **Demo Components Section**
   - Interactive counter demonstrating state
   - Sample form with validation
   - Tabbed interface showing routing
   - 2-column layout (component + code snippet reference)

4. **Technology Stack** (4-column grid)
   - Logo/icon cards for React, Vite, Tailwind, React Router
   - Equal height cards with icon, name, brief description

5. **Call-to-Action Section**
   - Centered content, max-w-3xl
   - Bold headline, supporting text
   - Primary button (Get Started) + Secondary link (View Docs)

6. **Footer**
   - 3-column layout: About/Quick Links/Resources
   - Social links, copyright
   - Clean, organized structure

**Navigation:**
- Sticky header with blur backdrop
- Logo left, nav links center, CTA button right
- Mobile: hamburger menu
- Links: Home, Features, Components, Docs

**Forms:**
- Input fields: rounded-lg border with focus ring
- Labels: semibold, mb-2
- Button: rounded-lg, px-6 py-3
- Form container: max-w-md

**Buttons:**
- Primary: rounded-lg px-6 py-3 font-medium
- Secondary: outlined variant
- Icon buttons: rounded-full p-2

**Cards:**
- Border style with rounded-xl
- Shadow on hover for interactivity
- Consistent padding (p-6 or p-8)

## Images

**Hero Section:**
- **Image Type:** Full-width hero image (1920x1080 minimum)
- **Subject:** Modern developer workspace - clean desk with multiple monitors showing code, natural lighting, plants, minimalist aesthetic
- **Treatment:** Subtle dark gradient overlay (top-to-bottom or radial) for text contrast
- **Placement:** Background of hero section spanning full width

**Technology Cards:**
- Official logos for React, Vite, Tailwind CSS, React Router
- Use SVG format from official sources or CDN
- Consistent sizing (h-12 or h-16)

## Animations

**Minimal, purposeful animations only:**
- Hero section: Subtle fade-in on load (0.6s ease)
- Cards: Hover lift (translateY(-4px), 0.2s ease)
- Page transitions: Smooth fade between routes (0.3s)
- NO scroll-triggered animations, parallax, or complex motion

## Accessibility

- Maintain WCAG AA contrast ratios throughout
- Semantic HTML with proper heading hierarchy
- Focus states visible on all interactive elements
- Form labels properly associated with inputs
- Alt text for all images including hero
- Keyboard navigation fully supported

## Responsive Behavior

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Hero: 60vh mobile, 80vh desktop
- Grid columns: Stack to single column below md breakpoint
- Navigation: Collapse to hamburger below md
- Typography: Scale down 20% on mobile (text-3xl becomes text-2xl, etc.)

This design creates a polished, professional starter application that demonstrates modern React development while maintaining clean, accessible, and reusable code patterns.