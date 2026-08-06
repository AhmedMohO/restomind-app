<p align="center">
  <img src="https://nextjs.org/static/favicon/favicon-32x32.png" width="80" alt="Next.js Logo" />
</p>

<h1 align="center">RestoMind Web Application</h1>

<p align="center">
  <b>AI-Powered Multi-Tenant Restaurant Management & E-Commerce Web Client</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-v16.2-000000?style=flat-square&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-v19.2-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-v5.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/i18n-Arabic%20%26%20English-FF9900?style=flat-square" alt="Bilingual i18n" />
  <img src="https://img.shields.io/badge/State-React%20Query%20%26%20Zustand-4433FF?style=flat-square" alt="React Query" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License" />
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Ecosystem Repositories](#-ecosystem-repositories)
- [Key Features](#-key-features)
- [System Architecture & Tech Stack](#-system-architecture--tech-stack)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Internationalization (i18n)](#-internationalization-i18n)
- [Dashboard & Portals Overview](#-dashboard--portals-overview)
- [License & Project Info](#-license--project-info)

---

## 🚀 Overview

**RestoMind Web Application** is a modern, high-performance web platform built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **TypeScript**. It serves as the frontend client for the **RestoMind Ecosystem**, providing a seamless experience for both end consumers ordering food and restaurant managers operating multi-tenant kitchens.

The application features **AI-driven analytics dashboards**, **bilingual localization (Arabic RTL 🇸🇦 & English LTR 🇬🇧)**, **multi-restaurant checkout groups**, **inventory & supply chain management**, and **automated production planning visualizers**.

---

## 🌐 Ecosystem Repositories

The **RestoMind Ecosystem** consists of three interconnected repositories:

| Component | Repository Link | Tech Stack | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | [restumint-app](https://github.com/AhmedMohO/restumint-app) | Next.js 16, React 19, Tailwind CSS v4, i18n | E-commerce storefront & multi-tenant management dashboard. |
| **Backend REST API** | [RestoMindAPI](https://github.com/KhaledAlmorse/RestoMindAPI) | NestJS 11, MongoDB, TypeScript, JWT | Core business logic, RBAC, orders, inventory, & DB services. |
| **AI Prediction Model** | [prediction-model](https://github.com/AmiraElsa3id/prediction-model) | Python, FastAPI, Machine Learning | AI demand forecasting, production planning, & recommendation engine. |

---

## ✨ Key Features

### 🌐 Full Bilingual Support (Arabic RTL & English LTR)
* Native localization powered by **`next-intl`**.
* Complete RTL (Right-to-Left) layout support for Arabic 🇸🇦 and LTR for English 🇬🇧.
* Dynamic locale switching without state loss.

### 🛒 Consumer E-Commerce Storefront
* **Interactive Catalog & Filtering**: Browse products by category, rating, price, tags, and restaurant.
* **Smart Shopping Cart**: Persistent cart supporting items across multiple restaurants.
* **Multi-Restaurant Checkout (`OrderGroup`)**: Customer single-checkout experience that automatically splits orders across target restaurants.
* **Address Book & Favorites**: Saved delivery locations and favorite food item bookmarks.

### 📊 AI-Driven Management Dashboard
* **Weekly Sales & Demand Forecasting**: Recharts visualization of ML-predicted sales volume and ingredient consumption.
* **AI Production Plan**: Recommended daily prep/baking schedules to optimize raw ingredient usage and reduce waste.
* **Smart Recommendations**: Interactive alerts for price adjustments, menu best-sellers, and low-stock replenishment.

### 📦 Inventory, Supply Chain & Operations
* **Batch Inventory Tracking**: FIFO stock batch monitoring with expiration dates and automated threshold alerts.
* **Purchase Orders & Suppliers**: Vendor profiles, lead-time management, purchase order workflow (draft, approved, received).
* **Waste Audit Logs**: Record ingredient spoilage/damage events with financial loss metrics.
* **POS Sales Logging**: POS sales transaction sync and manual revenue entry.

### 🔐 Security & Auth Infrastructure
* Encrypted server-side session management via **`iron-session`**.
* Middleware proxy handler (`proxy.ts`) for secure API token passing.
* Role-protected routes for `admin`, `manager`, `staff`, and `customer`.

---

## 🛠 System Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Server-Rendered & Client Application Framework |
| **UI Library** | [React 19](https://react.dev/) | Component-based User Interface library |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Shadcn UI | Utility-first CSS framework with Radix primitives |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight global client state management |
| **Data Fetching** | [@tanstack/react-query v5](https://tanstack.com/query) | Async state, caching, & backend API sync |
| **Internationalization**| [next-intl](https://next-intl-docs.vercel.app/) | Server & Client internationalization (AR / EN) |
| **Session Security** | [iron-session](https://github.com/vvo/iron-session) | Stateless, encrypted cookie session handler |
| **Form Handling** | React Hook Form + Zod | Schema-validated reactive form inputs |
| **Data Visualization** | [Recharts](https://recharts.org/) | Responsive charts for sales & prediction analytics |
| **Animations** | Framer Motion & Lenis | Smooth scrolling and page transitions |

---

## 📂 Directory Structure

```text
restumint-app/
├── app/
│   ├── [locale]/                     # Localized route pages (Arabic & English)
│   │   ├── (auth)/                   # Authentication pages (login, signup, reset password)
│   │   ├── (public)/                 # Storefront pages (landing, about, offers, partner application)
│   │   │   └── (protected)/          # Customer authenticated routes (checkout, favorites, profile, orders)
│   │   └── dashboard/                # Management Dashboard (Multi-tenant Admin/Manager/Staff)
│   │       ├── categories/           # Menu categories management
│   │       ├── ingredients/          # Raw ingredients & stock metrics
│   │       ├── inventory/            # Inventory batches & stock movement
│   │       ├── offers/               # Promotional discounts & deal campaigns
│   │       ├── orders/               # Restaurant order processing pipeline
│   │       ├── predictions/          # AI Weekly Sales Forecast charts
│   │       ├── production-plan/      # AI Daily Production Schedules
│   │       ├── products/             # Catalog management & Recipe editor
│   │       ├── purchase-orders/      # Supplier purchase order lifecycle
│   │       ├── recommendations/      # AI business recommendations engine
│   │       ├── restaurants/          # Tenant restaurant entity management
│   │       ├── sales/                # POS Sales logging & revenue tracking
│   │       ├── suppliers/            # Vendor directory
│   │       ├── users/                # Staff & user account management
│   │       └── waste/                # Waste event tracking & cost reporting
│   ├── api/                          # Next.js API route handlers & session endpoints
│   ├── globals.css                   # Global styles & Tailwind CSS v4 directives
│   └── layout.tsx                    # Root HTML layout & fonts
├── features/                         # Feature-based modular UI components & hooks
│   ├── analytics/                    # Sales & demand charts
│   ├── auth/                         # Login/signup forms & OTP modal
│   ├── cart/                         # Cart drawer & items list
│   ├── checkout/                     # Multi-restaurant checkout wizard
│   ├── inventory/                    # Stock batch tables & adjustment forms
│   ├── predictions/                  # Forecast widgets & AI plan controls
│   └── ...                           # Other domain features
├── components/                       # Shared UI components (shadcn/ui primitives)
├── hooks/                            # Custom React hooks
├── i18n/                             # next-intl configuration & request handler
├── lib/                              # Utility functions & API client instances
├── messages/                         # Translation dictionaries
│   ├── ar.json                       # Arabic translations (مترجم بالعربية)
│   └── en.json                       # English translations
├── providers/                        # React Query, Theme, & i18n context providers
├── proxy.ts                          # Next.js API proxy handler
├── .env                              # Environment variables configuration
└── package.json                      # Dependencies & scripts
```

---

## ⚡ Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
* **Node.js**: `v18.x` or `v20.x`+
* **pnpm** (Recommended) or **npm**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AhmedMohO/restumint-app.git
   cd restumint-app
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   # or
   npm install
   ```

### Environment Variables

Create a `.env` file in the project root directory:

```env
# Session secret (must be at least 32 characters long)
SESSION_SECRET=AvL1SB67+DrTmYdr0L4O+oem1oD+qc7ptsEq+ssWmAw=

# External RestoMind Backend API URL
API_URL=http://localhost:4000

# Next.js Application Public URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running the Application

```bash
# Start Development Server (Runs on http://localhost:3000)
pnpm dev

# Build for Production
pnpm build

# Start Production Server
pnpm start

# Run Typecheck & Linter
pnpm typecheck
pnpm lint
```

---

## 🌐 Internationalization (i18n)

RestoMind Web Application natively supports dual-language navigation:

* **Arabic (`/ar`)**: Default RTL direction with localized typography and terminology.
* **English (`/en`)**: LTR layout for international users.

Translation strings are structured cleanly under `messages/ar.json` and `messages/en.json`.

---

## 🖥 Dashboard & Portals Overview

| Portal | Audience | Features |
| :--- | :--- | :--- |
| **Consumer Storefront** | Public / Customers | Browse menus, add items to cart across restaurants, place orders, track order status, save delivery addresses. |
| **Manager Dashboard** | Restaurant Managers | Complete management of products, recipes, ingredients, inventory batches, suppliers, purchase orders, sales, and waste. |
| **Staff Portal** | Kitchen & Staff | Order status updates, stock movement entries, purchase order receiving, and waste event logging. |
| **Admin Control Center** | System Administrators | Restaurant tenant creation, user role management, partnership application approvals. |

---

## 📄 License & Project Info

This application is created as part of the **RestoMind Graduation Project Ecosystem**.

* **Frontend Lead**: RestoMind Team
* **Backend API Repo**: [RestoMindAPI](https://github.com/KhaledAlmorse/RestoMindAPI)
* **AI Model Repo**: [prediction-model](https://github.com/AmiraElsa3id/prediction-model)
* **License**: MIT / Graduation Project Repository

---

<p align="center">
  Made with ❤️ by the RestoMind Team
</p>
