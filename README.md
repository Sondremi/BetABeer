# 🍻 BetABeer

**BetABeer** er en sosial drikkelek-app der du og vennene dine kan lage og delta i morsomme bets – og betale med slurker eller shots. Perfekt for vors, fest og en kveld på byen.

---

## ✨ Hvordan fungerer det?

- Opprett eller bli med i grupper med egne bets
- Legg til venner og inviter dem til en gruppe
- Opprett betts og sett odds og alternativer i hvert bet
- Bett med slurker, shot eller chugg
- Se live resultater og odds
- Statistikk over hvem som vinner mest – eller drikker mest
- Innebygd promillekalkulator basert på høyde, vekt og kjønn

---

## 🧱 Teknologi

| Lag      | Teknologi                  |
| -------- | -------------------------- |
| Frontend | React Native + Expo (TS)   |
| Backend  | Node.js                    |
| Database | Firebase                   |

---

## 🚀 Kom i gang

### 🧰 Forutsetninger

- Node.js (`brew install node`)
- Expo CLI (`npm install -g expo-cli`)
- Firebase CLI (`npm install -g firebase-tools`)
- Expo Go (last ned til Android/iOS for testing)

---

### 📥 1. Klon prosjektet

```bash
git clone https://github.com/sondremi/BetABeer.git && cd BetABeer
```

---

### 📦 2. Installer avhengigheter

```bash
npm install
```

---

### 🔐 3. Setup Firebase

```bash
firebase login
```

```bash
firebase deploy --only firestore:rules
```

---

### ▶️ 4. Start prosjektet

```bash
npx expo start
```

- Skann QR-koden med **Expo Go**
- Eller trykk `i` for iOS-simulator, `a` for Android

---

## 🛠 Nyttige kommandoer

Resett cache:

```bash
npx expo start --clear
```

Eject fra Expo (hvis du trenger native moduler):

```bash
npx expo prebuild
```
