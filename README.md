# YakFlow — Freight Logistics ERP

A full-stack freight forwarding and logistics management system built with **Next.js 16**, **Tailwind CSS v4**, **shadcn/ui**, **Prisma (SQLite)**, and **TypeScript**.

> Built by **YAKHSHI**

## Features

- **Shipments** — end-to-end tracking (import/export, sea/air/land), container management, expenses & revenue, profitability analysis
- **Voyages** — ocean voyage management, TEU tracking, route & vessel scheduling, financials
- **Finance** — AR/AP, invoicing (multi-currency), payment tracking, profit/loss per entity
- **Dashboard & Analytics** — real-time KPIs, 6-month trends, expense breakdowns, top customers
- **Documents** — versioned document uploads per shipment/voyage/invoice
- **Settings** — company profile, currencies, exchange rates, user roles
- **Audit Logging** — full change history across all entities
- **Dark/Light Theme** — toggle with next-themes

## Tech Stack

| Layer        | Stack |
|-------------|-------|
| Framework   | Next.js 16 (App Router, standalone) |
| Language    | TypeScript |
| UI          | shadcn/ui + Radix primitives + Tailwind CSS v4 |
| State       | Zustand (client) + TanStack Query (server) |
| Database    | SQLite via Prisma ORM |
| Auth        | NextAuth |
| Charts      | Recharts |
| Forms       | react-hook-form + zod |
| Runtime     | Bun |
| PDF/Excel   | @react-pdf/renderer, jsPDF, xlsx |

## Getting Started

```bash
bun install
bun run db:push
bun run db:seed
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command            | Description          |
|--------------------|----------------------|
| `bun run dev`      | Start dev server     |
| `bun run build`    | Production build     |
| `bun run start`    | Start production     |
| `bun run db:push`  | Push schema to DB    |
| `bun run db:seed`  | Seed sample data     |
| `bun run lint`     | Lint with ESLint     |
