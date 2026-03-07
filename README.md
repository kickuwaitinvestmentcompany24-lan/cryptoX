# CryptoX Trading Platform

CryptoX is a premium, institutional-grade investment and trading platform designed for efficiency, security, and elegance. Built with a modern tech stack, it provides users with a seamless experience for managing assets, performing KYC, and tracking investments, while giving admins powerful tools to manage the entire ecosystem.

---

## 1. Project Overview
**Purpose**: To bridge the gap between complex blockchain technology and everyday investors through a user-friendly, high-performance interface.
**Scope**: End-to-end investment management, including real-time notifications, dynamic currency conversions, and rigorous administrative oversight.
**Key Goals**:
- Deliver a "wow" factor with premium UI aesthetics.
- Ensure robust security for user assets and identity data.
- Provide admins with granular control via impersonation and maintenance tools.

---

## 2. Tech Stack
- **Foundation**: [Vite](https://vitejs.dev/) + [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Backend as a Service**: [Supabase](https://supabase.com/) (Auth, Database, Storage, RLS)
- **Tables**: [TanStack Table](https://tanstack.com/table/latest)

---

## 3. Architecture & Design
CryptoX follows a **Client-Side Rendering (CSR)** architecture with a Thick Client pattern:
- **State Management**: Distributed between React Context (`AuthContext`, `LanguageContext`) for global state and TanStack Query for server-state synchronization.
- **Security**: Heavily reliant on Supabase **Row-Level Security (RLS)**. Business logic for access control is enforced at the database layer (see `supabase/migrations`).
- **Design System**: A custom design system built on top of Tailwind tokens, featuring glassmorphism, smooth micro-animations, and a responsive "mobile-first" approach.
- **Trade-offs**: Chose Supabase for rapid development and built-in security, accepting the vendor lock-in for the benefit of a unified Auth/DB experience.

---

## 4. Installation & Environment

### Requirements
- **Node.js**: v18.0 or higher
- **NPM**: v9.0 or higher
- **Supabase Account**: For hosting the backend and storage.

### Setup Steps
1. **Clone the Repo**:
   ```sh
   git clone <repository-url>
   cd emerald-trade-hub
   ```
2. **Install Dependencies**:
   ```sh
   npm install
   ```
3. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Database Setup**:
   Apply migrations found in `supabase/migrations/` to your Supabase project via the SQL Editor.

---

## 5. Quick-Start & Scripts

To run the project locally with hot-reloading:
```sh
npm run dev
```

### Common Scripts
- `npm run build`: Generate a production-ready bundle in the `dist/` folder.
- `npm run lint`: Run ESLint to check for code quality and style issues.
- `npm run test`: Execute the test suite using Vitest.
- `npm run preview`: Locally preview the production build.

---

## 6. Project Structure
```text
/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components (shadcn + custom)
│   ├── contexts/    # React Contexts (Auth, Language)
│   ├── hooks/       # Custom React hooks (Realtime, Notifications)
│   ├── integrations/# Supabase client initialization
│   ├── lib/         # Utility functions and API helpers (storage.ts)
│   ├── pages/       # Page components (Admin, Dashboard, KYC, etc.)
│   ├── App.tsx      # Main application entry and routing
│   └── main.tsx     # React DOM rendering
├── supabase/
│   └── migrations/  # SQL scripts for database schema and RLS
└── package.json     # Project dependencies and scripts
```

---

## 7. Features & Workflows

### Admin Impersonation
Allows admins to view the dashboard exactly as a specific user would.
- **Flow**: Admin Dashboard -> Users Table -> "Login As" -> Automated redirect to User Dashboard.
- **Audit**: Every session is logged in the `impersonation_logs` table.

### Dynamic Currency Management
Admins can define platform-wide currencies and exchange rates.
- **Propagation**: Changes in rates are reflected in user balances and pricing across the app.

### Maintenance Mode
A global kill-switch managed by admins.
- **UX**: Redirects all non-admin traffic to a stylized maintenance page.

---

## 8. Contribution Guidelines
We welcome contributions! Please follow these standards:
- **Code Style**: We use ESLint and Prettier. Run `npm run lint` before committing.
- **Testing**: New features should include unit tests in the `src/test` directory.
- **Branching**: Use descriptive branch names (e.g., `feature/maintenance-mode` or `fix/nav-context`).
- **PRs**: Ensure your PR has a clear description of the changes and passes all CI checks.

---

## 9. Changelog
### v1.1.0 (Current)
- Added **Global Maintenance Mode**.
- Integrated **Dynamic Currency Management**.
- Implemented **Admin Impersonation** with audit logs.
- Refined **Dashboard Navigation** (collapsible sidebar, curvy mobile nav).

### v1.0.0
- Initial release with Core Auth, Investment Plans, and KYC.

---


