# 💸 SplitSave — Smart Money Management for Students

A real-world MVP dApp built on Stellar blockchain for the Green Belt (Level 5) of the Stellar Dev Workshop. Students can split expenses with friends and settle instantly with XLM, plus save towards personal goals.

🌐 **Live Demo:** https://splitsave.netlify.app

---

## 🎥 Demo Video
<!-- Add your demo video link here -->

---

## ✨ Features

- **Expense Splitting** — create groups, add expenses, track who owes whom
- **Instant Settlement** — settle debts with real XLM on Stellar blockchain
- **Savings Goals** — set goals with emoji, deposit XLM, track progress
- **Multi-wallet Support** — Freighter, xBull, LOBSTR, Hana
- **Activity Feed** — track all your recent actions
- **Mobile Responsive** — works on all screen sizes
- **22 passing tests** across 4 test suites
- **CI/CD Pipeline** — GitHub Actions on every push

---

## 🛠️ Tech Stack

- React + Vite
- Stellar SDK (@stellar/stellar-sdk)
- StellarWalletsKit (@creit.tech/stellar-wallets-kit)
- localStorage for data persistence
- Vitest for testing
- GitHub Actions for CI/CD
- Netlify for deployment

---

## 📋 Setup Instructions

1. Clone the repo:
git clone https://github.com/Janhavim04/splitsave.git
cd splitsave

2. Install dependencies:
npm install

3. Run locally:
npm run dev

4. Run tests:
npm test

5. Install Freighter from https://freighter.app and switch to Testnet

6. Get free testnet XLM at https://friendbot.stellar.org

7. Open http://localhost:5173 and start splitting!

---

## 🧪 Tests

22 tests passing across 4 suites:

- **Expense Splitting** (6 tests) — balance computation, equal splitting
- **Savings Goals** (6 tests) — progress calculation, goal completion
- **Stellar Address Validation** (5 tests) — address format checks
- **Data Caching** (5 tests) — localStorage cache logic

### Test Output
![Tests](screenshots/tests.png)

---

## 🔁 CI/CD Pipeline

GitHub Actions runs on every push:
- Installs dependencies
- Runs all 22 tests
- Builds the project

![CI/CD](screenshots/cicd.png)

---

## 📱 Mobile Responsive

![Mobile](screenshots/mobile.png)

---

## 👥 User Feedback

**Feedback Form:** https://docs.google.com/forms/d/e/1FAIpQLSeDHk2r2KZwy0tQA9i0YV7GgAfmD-RmsEPHLzp4Bu23kQRPUw/viewform

**User Responses:** [feedback.xlsx](feedback/feedback.xlsx)

### Testnet Users

| Name | Wallet Address |
|------|---------------|
| User 1 | <!-- add wallet address --> |
| User 2 | <!-- add wallet address --> |
| User 3 | <!-- add wallet address --> |
| User 4 | <!-- add wallet address --> |
| User 5 | <!-- add wallet address --> |

---

## 🏗️ Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details.

### Data Flow
User connects wallet
↓
Creates group with members
↓
Adds expenses (who paid, split among whom)
↓
App computes balances automatically
↓
User settles debt with XLM payment
↓
Transaction recorded on Stellar blockchain

---

## 🔄 Improvements Based on User Feedback

<!-- Fill this section after collecting feedback -->
Based on user feedback we will:
1. <!-- improvement 1 -->
2. <!-- improvement 2 -->
3. <!-- improvement 3 -->

**Improvement commit:** <!-- add git commit link here -->

---

## 🔗 Links

- 🌐 Live App: https://splitsave.netlify.app
- 📝 Feedback Form: https://docs.google.com/forms/d/e/1FAIpQLSeDHk2r2KZwy0tQA9i0YV7GgAfmD-RmsEPHLzp4Bu23kQRPUw/viewform
- 💧 Testnet Faucet: https://friendbot.stellar.org
- 🔍 Stellar Explorer: https://stellar.expert/explorer/testnet
