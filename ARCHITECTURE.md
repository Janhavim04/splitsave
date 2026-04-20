# SplitSave Architecture

## Overview
SplitSave is a React frontend dApp that uses Stellar for payments.

## Tech Stack
- React + Vite (frontend)
- Stellar SDK (XLM payments)
- StellarWalletsKit (multi-wallet)
- localStorage (data persistence)
- Vitest (testing)
- GitHub Actions (CI/CD)
- Netlify (hosting)

## Data Flow
User connects wallet → Creates group → Adds expenses →
App computes balances → User settles with XLM → Payment recorded on Stellar

## Components
- AppContext — global state management
- useWallet — wallet connection hook
- stellar.js — Stellar SDK utilities
- Dashboard — overview page
- Groups — expense splitting page
- Savings — savings goals page