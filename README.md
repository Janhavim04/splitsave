# 💸 SplitSave — Smart Money Management for Students

A production-ready dApp built on Stellar blockchain. Students can split expenses with friends, settle instantly with XLM, and save towards personal goals — all on-chain.

🌐 **Live Demo:** https://splitsave.netlify.app

---

## 🎥 Demo Video

https://github.com/user-attachments/assets/8d24322e-4894-4b21-a576-16a2f32717c5

---

## ✨ Features

- **Expense Splitting** — create groups, add expenses, track who owes whom
- **Instant Settlement** — settle debts with real XLM on Stellar blockchain
- **Savings Goals** — set goals with emoji, deposit XLM, track progress
- **Gasless Transactions** — fee sponsorship via Fee Bump (users pay 0 fees)
- **Multi-wallet Support** — Freighter, xBull, LOBSTR, Hana
- **Activity Feed** — track all your recent actions
- **Metrics Dashboard** — live DAU, transactions, retention tracking
- **Production Monitoring** — error logging, performance tracking
- **Data Indexing** — on-chain transaction indexing via Horizon API
- **Mobile Responsive** — works on all screen sizes
- **22 passing tests** across 4 test suites
- **CI/CD Pipeline** — GitHub Actions on every push

---

## 🛠️ Tech Stack

- React + Vite
- Stellar SDK (@stellar/stellar-sdk)
- StellarWalletsKit (@creit.tech/stellar-wallets-kit)
- Soroban Smart Contract (Rust)
- localStorage for data persistence
- Vitest for testing
- GitHub Actions for CI/CD
- Netlify for deployment

---

## 📋 Setup Instructions

```bash
# 1. Clone the repo
git clone https://github.com/Janhavim04/splitsave.git
cd splitsave

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Add your VITE_SPONSOR_PUBLIC_KEY and VITE_SPONSOR_SECRET_KEY

# 4. Run locally
npm run dev

# 5. Run tests
npm test
```

- Install Freighter from https://freighter.app and switch to **Testnet**
- Get free testnet XLM at https://friendbot.stellar.org
- Open http://localhost:5173

---

## ⚡ Advanced Feature — Fee Sponsorship (Gasless Transactions)

SplitSave implements **Fee Bump Transactions** (Stellar SEP-0017).

Users pay **zero XLM in fees** when settling expenses. The SplitSave sponsor account wraps each settlement in a `FeeBumpTransaction` and covers the network fee on behalf of the user.

**How it works:**
1. User clicks Settle — inner transaction is built with their wallet as source
2. User signs the inner transaction via Freighter
3. Sponsor wraps it in a `FeeBumpTransaction` and pays the fee
4. Transaction submitted — user paid 0 fees

**Implementation:**
- `src/utils/stellar.js` → `buildSponsoredPaymentTx()` and `submitSponsoredTx()`
- `src/hooks/useWallet.js` → `sendPayment()` automatically uses sponsored path
- `src/components/GaslessBadge.jsx` → pulsing ⚡ badge shown on Settle button

**Sponsor account:** `GBLUMAX4IIPS54AIGD5WXRRAXISG4HLV3BE3YR3SQAD3GZSXRTVJY5GI`

---

## 📊 Metrics Dashboard

Live dashboard available at **Metrics** tab in the app.

**Tracks:**
- Daily Active Users (DAU proxy via activity feed)
- On-chain transaction count (live from Horizon API)
- Total groups, expenses, settlements
- XLM transacted and saved
- 7-day activity, expense, and deposit charts
- Retention rate from savings goal deposits

**Screenshot:** 
<img width="1701" height="908" alt="Screenshot 2026-04-30 164718" src="https://github.com/user-attachments/assets/2bb3f40f-f56f-47bc-8f9c-731907f69a15" />


---

## 🔍 Monitoring

Production monitoring available at **Metrics → Monitoring** tab.

**Covers:**
- Global error handler for uncaught JS errors
- Unhandled promise rejection tracking
- Transaction event logging
- Performance timing (page load, tx submission time)
- Auto-refreshing log feed with ERROR/WARN/TX/INFO/PERF filters

**Implementation:** `src/utils/monitoring.js` — initialized in `main.jsx`

**Screenshot:** 
<img width="1542" height="920" alt="Screenshot 2026-04-30 164828" src="https://github.com/user-attachments/assets/155c149e-8d2e-43cb-8c54-909128b3478b" />


---

## ⛓ Data Indexing

Live index available at **Metrics → Index** tab.

**Approach:**
- Queries `GET /accounts/{wallet}/transactions` and `/payments` from Horizon API
- Parses and enriches each transaction with payment metadata
- Filters SplitSave transactions by memo prefix (`splitsave:`)
- Stores up to 500 indexed transactions in localStorage for fast querying
- Supports filtering by: SplitSave tag, date range, wallet address

**Endpoint:** `https://horizon-testnet.stellar.org`  
**Implementation:** `src/utils/indexer.js`

---

## 🔐 Security

[Security Checklist](./SECURITY_CHECKLIST.md) — **30/31 checks passed**
https://github.com/Janhavim04/splitsave/blob/main/SECURITY_CHECKLIST.md

Key measures:
- Input sanitization on all user inputs (`src/utils/security.js`)
- Rate limiting on payments — prevents double-settlement
- Address validation before every transaction
- Transaction timeout set to prevent replay attacks
- Security headers via `netlify.toml` (X-Frame-Options, CSP, etc.)
- No private keys ever stored in app state or localStorage
- `npm audit` — **0 vulnerabilities**

---

## 📦 Smart Contract

**Contract Address:** `CC544SVOAW3FWMAOHYZZJWL24WTYCN5MOCLVUMAH5Y7BLTSZKJ5JFRHI`

**View on Stellar Expert:**
https://stellar.expert/explorer/testnet/contract/CC544SVOAW3FWMAOHYZZJWL24WTYCN5MOCLVUMAH5Y7BLTSZKJ5JFRHI

**Functions:**
- `initialize(admin)` — set up the contract
- `create_group(creator, group_id, name)` — record a group on-chain
- `record_settlement(from, to, amount, group_id)` — record a settlement on-chain
- `get_group(group_id)` — fetch group info
- `get_group_count()` — total groups created
- `group_exists(group_id)` — check if group exists

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

GitHub Actions runs on every push — installs dependencies, runs all 22 tests, builds the project.

<img width="1420" height="902" alt="Screenshot 2026-04-20 154829" src="https://github.com/user-attachments/assets/bab27f32-82ac-476b-849a-2feee754da82" />

---

## 📱 Mobile Responsive

<img width="1097" height="809" alt="image" src="https://github.com/user-attachments/assets/d615b4b5-5db7-48a2-9e13-969cac114a8b" />

---

## 👥 User Onboarding

**Feedback Form:** https://docs.google.com/forms/d/e/1FAIpQLSeDHk2r2KZwy0tQA9i0YV7GgAfmD-RmsEPHLzp4Bu23kQRPUw/viewform?usp=dialog

**User Responses (Excel):** [Splitsave_feedback (2).xlsx](https://github.com/user-attachments/files/27241172/Splitsave_feedback.2.xlsx)


### Verified Testnet Users (31/30)

| # | Name | Wallet Address |
|---|------|---------------|
| 1 | Janhavi Lipare | GBLUMAX4IIPS54AIGD5WXRRAXISG4HLV3BE3YR3SQAD3GZSXRTVJY5GI |
| 2 | Nayan Palande | GB23T7JFBYK7URKZCRL5ZUYPA5W7JNJ5WYIGLJNWI6Y3YAFPYHJ65UPR |
| 3 | Poorva Mulimani | GBNOBRJ73DRVVHE4MJPDRIOVP3MZ7BHOO2ISZDMPJWDNHPCPVRZLRILT |
| 4 | Jadhav Vaibhavi Ajay | GDBIJAOFPMGQWDUUQTJ3YFHI44MWHQHPALJQG7ZDA7D5WWEDKJYA4OHA |
| 5 | Aditi Mhaske | GAWOCI3JKKRFYYUJGOR7I3LZM6BMFCLUBN3EXBNLRISO6XWW3YDSTHDU |
| 6 | Gayatri Deshmukh | GBQQRG45YXIOLM7UR2W7DN2XP7SZVIDY4D5NWCUMRX7CEXJVVFGU26PB |
| 7 | Prachi sawant | GAEXD3KCFE3CBWDGSNQ5A624AMH74B4ONAEEF2QRUWHX6SOTTAVUGKRV |
| 8 | Aniket uday Bhilare  | GDRTJRMXK43GQL5EE25QGULXYRVLJ646E5SCXRX376VMSLSSKSLWONM7 |
| 9 | Digvijay khese | GAALPBO5ZA7JWNIR66F6CTJVC4MPEWOP7H7YUMRPMXNGZCMR4TPUAVGL |
| 10 | Sarthak Dhere | GCRYPAQB3TFLQE727TA3R723QIEPTP5KCMP7OMH4HVXNLCEUKPD4AZJP |
| 11 | Shubham Golekar  | GA3PMUXWSCWLT2FMQ76PODPODHLJHOWAHTD7JGOWHGGE5FZ3WWF6EJBO |
| 12 | Saiprasad Shastre | GB6WPRQKU5SWASEIZQYV3JEBKTUN4LPKGLNJOPKGRDCLYXCVQUNT3GLK |
| 13 | Harshal Jagdale | GCATAASNFHODIKA4VTIEZHONZB3BGZJL42FXHHZ3VS6YKX2PCDIJ3LDY |
| 14 | Mansi Baban Sandbhor  | GBW4FMYCQRUPKKQDJKQWPEUNHV3V6MCDYI3AWHXPHTCX4VOKAUM6L655 |
| 15 | Payal Shrikant Babar  | GA7IXJAO4NMPRXMQD4MTOZICZCSVK5KWWFGFR3GVQHGC4FNRLHHZMHKG |
| 16 | Nishit Bhalerao  | GBLSGNNNFFIHR2745JID5AW42TAKULJ7VJWCQBHGUWQKCMCQWLGZ7PVN |
| 17 | Vedang Bahirat  | GAYMWU2VTZC6646FV4M5753ZZUBIXZHSBLBOLTHBHCVFQIOBZH6D5W4H |
| 18 | Shubhankar Bhenki  | GAAYHC2S4IY5V5DDS2TE5LPGWA5U3F6BGBETT5IIF2F6PY3RKZMUFJPK |
| 19 | Dnyaneshwari Sable | GBGNYF44BFQRWS6GSF4Z4PPHCTGC7OUWWTSC2CJQL54BRFXAJGAKCE22 |
| 20 | DIVYANSHU SINGH | GBM7TKBAHVUDY5UKS3VTJ55BYKUBGLGPT75FYUA2I2TQDHNNGUMVU4SL |
| 21 | Samruddhi Nevse | GCWHSFPEKYG5OYYQT2M5VRRVM3LSCXACMBNKSZUTH7XCIUGQTGFDAYWD |
| 22 | Soundarya Shastre | GCNIP42DW5CU5CHU26S77F2N7ZZBJ5FXKO7U3U7A5RWUFCWV6T3HJIK5 |
| 23 | Shubham Shastre | GC7ZLZNLJA2DXKYOM7GDLUD5VGSZGY5ERKWAC53CJSKPGZCHQTX3U7TD |
| 24 | Sarika Mane | GA7QLXBAQMIDBBJRSV3ONNDTCYNWFWXE3FMHFHMR66KT2NGBXB4JCHLN |
| 25 | Ishani Pawar | GAIUMKCN72QK4TWISNYJURRMFPOT3PZT4G34NH6GCV7MJCG4TZT3TZZG |
| 26 | Parth Pravin Padir | GD3AM7UTGZT6I5MAITKOOJTZGAVLECGY5P57ENXLRZ4NMZS3ELLECIYN |
| 27 | Pooja Kohinkar  | GBA6423K3LTPDS2BOBQ7YKJYVTPPJQ52DWXMNUPT36EOGF257NITPNTL |
| 28 | Samruddhi Bhagwat | GASSYYMLPMDX2WU5CMLZYFUUY5AYD7DTRLM7FHOGF7MFTY6SCT3C3TZ4 |
| 29 | Shravani Tavhare | GBOECBQT3HY6NDB34QTDMN4G3HZNY4DEDWELDPVGIILIH4IO7KC4NNOX |
| 30 | shwetta shindde | GAX4ZSLAEJ37HJFWBWZWV2PLN7MPYU4S7LWRPAFLXHDMSVSEJIQJVQIW |
| 31 | Aarya Farke | GBWA66JFVGMC4KUVVL667D2XB2IG6NWVNYNLAFEMYESRBQCRUUJTUPOK |

> All wallet addresses are verifiable on [Stellar Expert Testnet](https://stellar.expert/explorer/testnet)

---

## 🔄 Improvements Based on User Feedback

Based on user feedback we have implemented:

1. **Copy Wallet Address button** — users requested easier address sharing
2. **Gasless transactions** — users found gas fees confusing, now sponsored
3. **Metrics dashboard** — added transparency into app usage

**Improvement commit:** https://github.com/Janhavim04/splitsave/commit/7e32d2972cfd6ba2154bf360054b2feffcd44d23

---

## 🏗️ Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details.

```
User connects wallet
↓
Creates group with members (recorded on Soroban contract)
↓
Adds expenses (who paid, split among whom)
↓
App computes balances automatically
↓
User settles debt — sponsor pays fee via Fee Bump
↓
Transaction recorded on Stellar blockchain
↓
Indexer updates local transaction index from Horizon
```

---

## 🐦 Community Contribution

https://x.com/JanhaviMane_04/status/2049688304766128232?s=20

Post about SplitSave on Twitter tagging @StellarOrg

---

## ✅ Level 6 Submission Checklist

- [x] Public GitHub repository
- [x] Live demo on Netlify
- [x] 30+ user wallet addresses 
- [x] Advanced feature — Fee Sponsorship (gasless transactions)
- [x] Metrics dashboard live
- [x] Security checklist completed (30/31, 0 vulnerabilities)
- [x] Monitoring active
- [x] Data indexing implemented
- [x] Full documentation
- [x] Smart contract deployed on testnet
- [x] Feedback form + Excel sheet
- [x] Community contribution (Twitter post)
- [x] 31/30 users onboarded
- [x] Minimum 15+ meaningful commits

---

## 🔗 Links

- 🌐 Live App: https://splitsave.netlify.app
- 📝 Feedback Form: https://docs.google.com/forms/d/e/1FAIpQLSeDHk2r2KZwy0tQA9i0YV7GgAfmD-RmsEPHLzp4Bu23kQRPUw/viewform?usp=dialog
- 🔐 Security Checklist: [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)
- 📊 Metrics Dashboard: https://splitsave.netlify.app (Metrics tab)
- 🔍 Stellar Explorer: https://stellar.expert/explorer/testnet
- 💧 Testnet Faucet: https://friendbot.stellar.org
- 📦 Smart Contract: https://stellar.expert/explorer/testnet/contract/CC544SVOAW3FWMAOHYZZJWL24WTYCN5MOCLVUMAH5Y7BLTSZKJ5JFRHI
