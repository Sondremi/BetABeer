<a href="https://bet-a-beer.netlify.app" target="_blank">
  <img src="./assets/images/logo/header.png" alt="BetABeer" width="702" />
</a>

**BetABeer** er en sosial drikkelek-app der du og vennene dine kan lage og delta i morsomme bets – og betale med slurker eller shots. Perfekt for vors, fest eller en kveld på byen.

## Prøv appen her
[https://bet-a-beer.netlify.app](https://bet-a-beer.netlify.app)

## ✨ Hvordan fungerer det?

- Logg inn eller opprett en bruker
- Legg til venner
- Opprett eller bli med i en gruppe og inviter vennene dine
- Lag egne betts
- Bett på hva du mener er riktig alternativ med slurker, shot eller chugg av ulike drikketyper
- Se live resultater fra alle bets i gruppen
- Statistikk over hvem som vinner mest – eller drikker mest
- Innebygd promillekalkulator basert på høyde, vekt og kjønn

## 👨‍💻 Vil du bidra eller teste appen selv?

Følg stegene under for å sette opp prosjektet lokalt og bidra til videreutvikling.

### 🧰 Forutsetninger

- Node.js (`brew install node`)
- Expo CLI (`npm install -g expo-cli`)
- Firebase CLI (`npm install -g firebase-tools`)

---

### 📦 1. Installer avhengigheter

```bash
npm install
```

---

### 🔐 2. Setup Firebase

Opprett prosjekt i Firebase, opprett `.env`-fil og legg inn prosjektinformasjonen slik:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
```

Logg inn og deploy regler:

```bash
firebase login
firebase deploy --only firestore:rules
```

---

### ▶️ 3. Start prosjektet

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
