# 🍻 BetABeer

**BetABeer** er en sosial drikkelek-app der du og vennene dine kan lage og delta i morsomme bets – og betale med slurker eller shots. Perfekt for vors, fest eller en kveld på byen.

[🌐 Prøv appen her!](https://bet-a-beer.netlify.app)

## ✨ Hvordan fungerer det?

- Logg inn eller opprett en bruker
- Legg til venner
- Opprett eller bli med i en gruppe og inviter vennene dine
- Lag egne betts med en tittel, alternativer og odds til hvert alternativ
- Bett på hva du mener er riktig alternativ med slurker, shot eller chugg av ulike drikketyper
- Se live resultater fra alle bets i gruppen
- Statistikk over hvem som vinner mest – eller drikker mest

## 👨‍💻 Vil du bidra eller teste appen selv?

Følg stegene under for å sette opp prosjektet lokalt og bidra til videreutvikling.

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

Opprett prosjekt i Firebase, opprett `.env`-fil og legg inn prosjektinformasjonen slik:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Logg inn og deploy regler:

```bash
firebase login
firebase deploy --only firestore:rules
```

---

### ▶️ 4. Start prosjektet

```bash
npx expo start
```

- Skann QR-koden med **Expo Go**
- Eller trykk `i` for iOS-simulator, `a` for Android, `w` for web

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
