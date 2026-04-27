# 👨‍💻 Vil du bidra eller teste appen selv?

## 🧰 Forutsetninger

- Node.js (`brew install node`)
- Expo CLI (`npm install -g expo-cli`)
- Firebase CLI (`npm install -g firebase-tools`)

---

## 📦 1. Installer avhengigheter

```bash
npm install
```

---

## 🔐 2. Setup Firebase

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
firebase deploy --only firestore:rules,storage
```

---

## ▶️ 3. Start prosjektet

```bash
npx expo start
```

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
