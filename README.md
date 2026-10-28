<div align="center">

<img src="public/favicon.svg" width="72" alt="DealFinder LK logo" />

# DealFinder LK

**Every offer in Sri Lanka, in one place.** Bank card discounts, supermarket promos, restaurant deals and online sales — checked before they go live, and gone when they end.

[![Live Site](https://img.shields.io/badge/Live%20Site-sri--lanka--deals.vercel.app-0B7A6E?style=for-the-badge&logo=vercel&logoColor=white)](https://sri-lanka-deals.vercel.app/)

<img src="public/og-image.png" alt="DealFinder LK preview" width="100%" />

</div>

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=white)

---

## Features

### For visitors
- **Search** by shop, bank or offer, with filters for category, bank card, city and minimum discount
- **Sort** by newest, ending soon, biggest discount or most viewed
- **Bank card offers** grouped by bank (Sampath, Commercial, HNB, BOC, People's and more)
- **12 categories** — bank cards, supermarkets, dining, food delivery, fashion, electronics, online shopping, travel, mobile data, health & beauty, home, education
- **Offer pages** with promo-code copy button, terms, validity dates, location and a link to the original offer
- **Ending soon** strip with countdown badges; **expired offers hide automatically**
- **Share** to WhatsApp, Facebook or copy link
- **Report a problem** on any offer (ended, wrong details, spam)
- **Light and dark mode**, mobile-first layout, keyboard accessible

### For signed-in users
- **Save offers** to a list that syncs across devices
- **Share a deal** with image upload; follow its review status in **My submissions**
- Password reset and email confirmation

### Admin panel (`/admin`)
- **Overview:** live / pending / expired counts, open reports, users, views and click-through
- **Deals:** review queue, approve, reject with a reason, feature, archive, delete — one by one or in bulk
- **Add and edit** any deal; **export all deals to CSV**
- **Reports** from visitors, with one-click archive
- **Users:** give or remove admin access

### Security
- Row-level security on every table: the public sees only approved, live offers; users see only their own submissions and saved list
- Users can't approve or feature their own deals — the database enforces it
- Image uploads limited to the user's own folder, JPG/PNG/WebP, 5 MB
- Spam limit of 10 submissions per user per day
- Submitters' emails are never exposed publicly

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Data fetching | TanStack Query |
| Routing | React Router 6 |
| Backend | Supabase — PostgreSQL, Auth, Storage, row-level security |
| Hosting | Vercel |

## Getting started

```bash
git clone https://github.com/<your-username>/sri-lanka-deals.git
cd sri-lanka-deals
npm install
cp .env.example .env   # then add your Supabase URL and key
npm run dev
```

The site runs at **http://localhost:8080**.

**First time?** Follow **[SETUP.md](SETUP.md)** to create the database, connect Vercel, make yourself an admin and copy the old deals.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local site |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run test` | Run unit tests |
| `npm run lint` | Check code style |

## Project structure

```
src/
├── components/         Header, Footer, DealCard (ticket), DealForm, Modal, …
├── pages/              Home, Deals (browse), DealDetail, Submit, Login, Account, info pages
│   └── admin/          Dashboard, Deals, Deal editor, Reports, Users
├── hooks/              useAuth, useSaved, usePageMeta, useTheme
├── lib/
│   ├── api.ts          Every database query in one place
│   ├── constants.ts    Categories, banks, cities
│   ├── format.ts       Dates (Sri Lanka time), prices, links
│   └── site.ts         Site name, URL, contact settings
└── integrations/supabase/client.ts

supabase/migrations/    Database tables, security rules, triggers
scripts/                One-time copy of deals from the old database
```

To add a category or bank, edit `src/lib/constants.ts`.

## Disclaimer

All product names, trademarks and registered trademarks belong to their owners and are used only to identify offers. Offers are provided by the businesses listed.

## License

Private and proprietary. All rights reserved.

---

<div align="center">

Built in Sri Lanka

</div>
