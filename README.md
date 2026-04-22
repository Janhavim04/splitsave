# 💸 SplitSave — Smart Money Management for Students

A real-world MVP dApp built on Stellar blockchain for the Green Belt (Level 5) of the Stellar Dev Workshop. Students can split expenses with friends and settle instantly with XLM, plus save towards personal goals.

🌐 **Live Demo:** https://splitsave.netlify.app

---

## 🎥 Demo Video

https://github.com/user-attachments/assets/4fe78415-2b65-48e0-b2cf-70c509e288e7

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
<img width="1118" height="914" alt="Screenshot 2026-04-20 143501" src="https://github.com/user-attachments/assets/dd18edfd-ad44-4b78-add5-a56208d7dc7c" />


---

## 🔁 CI/CD Pipeline

GitHub Actions runs on every push:
- Installs dependencies
- Runs all 22 tests
- Builds the project

<img width="1420" height="902" alt="Screenshot 2026-04-20 154829" src="https://github.com/user-attachments/assets/bab27f32-82ac-476b-849a-2feee754da82" />


---

## 📱 Mobile Responsive

<img width="1177" height="1022" alt="Screenshot 2026-04-20 154938" src="https://github.com/user-attachments/assets/66211065-83fa-4c7d-bf8b-83a160e5693f" />


---

## 👥 User Feedback

**Feedback Form:** https://docs.google.com/forms/d/e/1FAIpQLSeDHk2r2KZwy0tQA9i0YV7GgAfmD-RmsEPHLzp4Bu23kQRPUw/viewform?usp=dialog

**User Responses:** [Splitsave_feedback.xlsx](https://github.com/user-attachments/files/26975958/Splitsave_feedback.xlsx)


### Testnet Users

| Name | Wallet Address |
|------|---------------|
| Janhavi lipare | GBLUMAX4IIPS54AIGD5WXRRAXISG4HLV3BE3YR3SQAD3GZSXRTVJY5GI |
| Nayan Palande | GB23T7JFBYK7URKZCRL5ZUYPA5W7JNJ5WYIGLJNWI6Y3YAFPYHJ65UPR |
| Poorva Mulimani | GBNOBRJ73DRVVHE4MJPDRIOVP3MZ7BHOO2ISZDMPJWDNHPCPVRZLRILT |
| Jadhav Vaibhavi Ajay | GDBIJAOFPMGQWDUUQTJ3YFHI44MWHQHPALJQG7ZDA7D5WWEDKJYA4OHA |
| Aditi Mhaske | GAWOCI3JKKRFYYUJGOR7I3LZM6BMFCLUBN3EXBNLRISO6XWW3YDSTHDU |
| Gayatri Deshmukh | GBQQRG45YXIOLM7UR2W7DN2XP7SZVIDY4D5NWCUMRX7CEXJVVFGU26PB |

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
1. Add a "Copy Wallet Address" button


**Improvement commit:** https://github.com/Janhavim04/splitsave/commit/7e32d2972cfd6ba2154bf360054b2feffcd44d23

---

## 🔗 Links

- 🌐 Live App: https://splitsave.netlify.app
- 📝 Feedback Form: https://docs.google.com/forms/d/e/1FAIpQLSeDHk2r2KZwy0tQA9i0YV7GgAfmD-RmsEPHLzp4Bu23kQRPUw/viewform?usp=dialog
- 💧 Testnet Faucet: https://friendbot.stellar.org
- 🔍 Stellar Explorer: https://stellar.expert/explorer/testnet
