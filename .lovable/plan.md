

# Crypto Trading Platform – Implementation Plan

## 1. Global Theme & Layout
- Set dark background (#030303) with emerald radial gradients
- Install Framer Motion for animations
- Glassmorphism utility styles (backdrop-blur, thin borders, subtle reflections)
- Sticky transparent navbar with logo, nav links, Language dropdown (with "Powered by Google Translate" badge), Login button, and "Get Started" CTA

## 2. Landing Page – Hero Section
- Live scrolling marquee ticker showing BTC, ETH, SOL mock prices
- Split layout: left side has gradient H1 ("Trade the Future of Finance"), subtext, two CTAs (Start Trading + View Markets)
- Right side: floating dashboard preview card with Framer Motion hover animation

## 3. Landing Page – Onboarding Preview Section
- 3-step flow cards (Create Account → Verify Identity → Start Investing)
- Each card uses Shadcn Card with Lucide icons and hover emerald border transition

## 4. Language Selector
- Shadcn DropdownMenu in the navbar listing languages (English, Spanish, French, etc.)
- Visual flag/label change on selection (frontend-only, no actual translation wiring)
- "Powered by Google Translate" badge at bottom of dropdown

## 5. User Dashboard Page
- Summary cards: Balance, Profit, Assets with glassmorphism styling
- Recharts AreaChart for portfolio growth over time
- Mock data for all values

## 6. KYC Submission Page
- Shadcn Form with fields: Full Name, ID Type (select), Document Upload (drag-and-drop zone)
- Form validation with Zod
- Success toast on submission

## 7. Admin Panel Page
- Management tab with a data table (TanStack Table)
- Columns: User, Date Joined, KYC Status (Badge), Actions (Approve/Decline/Suspend)
- Mock user data, action buttons trigger toast notifications

## 8. Routing
- `/` → Landing page (Hero + Onboarding)
- `/dashboard` → User Dashboard
- `/kyc` → KYC Submission
- `/admin` → Admin Panel

