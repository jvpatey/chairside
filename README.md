# Chairside

A mobile-first dental staffing app for Nova Scotia clinics and dental professionals, built to fill permanent roles and last-minute shifts faster with structured profiles, availability matching, and explainable fit scoring.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)
- [Xcode](https://developer.apple.com/xcode/) (for iOS simulator)

## Getting started

```bash
pnpm install
pnpm dev
```

Press `i` in the Expo dev tools to open the iOS simulator.

## Scripts

| Command        | Description                    |
| -------------- | ------------------------------ |
| `pnpm dev`     | Start Expo dev server          |
| `pnpm ios`     | Start Expo and open iOS        |
| `pnpm android` | Start Expo and open Android    |
| `pnpm web`     | Start Expo web (future target) |
| `pnpm lint`    | Run ESLint                     |

## Project structure

```
chairside/
├── apps/mobile/     # Expo app (iOS/Android now, web later)
└── packages/        # Shared packages (config, core, api, ui)
```

## Web (later)

This project is mobile-first. Expo Router supports web out of the box — run `pnpm web` when you're ready to start on the web target. Web UI polish and a clinic dashboard are planned for post-MVP.

## What's not included yet

- Supabase auth and database
- Push notifications
- Job posts, profiles, and matching features

Add these incrementally as you build out the MVP.
