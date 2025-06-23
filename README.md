# 🍻 Bet-A-Beer

**Bet-A-Beer** er en sosial drikkelek-app der du kan opprette morsomme bets med venner. Gjør vorspielet eller kvelden på byen enda gøyere ved å kombinere spilling, konkurranse og alkohol.

Opprett grupper, inviter venner og utfordre dem med ulike bets — og betal i slurker, øl eller shots.

---

## 🎯 Hva kan du bruke appen til?

- Opprette og delta i betting-grupper med venner
- Lage egne bets med odds, f.eks. "Hvem kommer ikke inn på byen?"
- Bette med shots, øl, cider eller slurker
- Få statistikk over hvem som vinner mest (eller drikker mest!)
- Måle estimert promille og historikk for drikkeenheter
- Gjør det til en konkurransebasert drikkelek — enkelt og morsomt

---

## ✨ Funksjoner

- 🔐 Logg inn med navn, brukernavn, telefon og e-post
- 👥 Legg til og inviter venner
- 🥇 Opprett og delta i grupper med egne bets
- 🍺 Bett på alternativer og se live odds og resultater
- 📊 Se detaljerte bet-statistikker for deg og gruppene dine
- 🍻 Visuell fordeling av "slurker" etter vinner er kåret
- 🧪 Innebygd promillekalkulator med høyde, vekt og kjønn
- 📱 Moderne React Native UI med mørkt tema og custom ikoner

---

## 🧱 Teknologi

| Lag      | Teknologi                         |
| -------- | --------------------------------- |
| Frontend | React Native (TypeScript)         |
| Backend  | Node.js                           |
| Database | PostgreSQL                        |
| ORM      | Prisma                            |
| Hosting  | Railway, Supabase, Render         |

---

## 🚀 Kom i gang

### 🧰 Forutsetninger

- Xcode (via App Store)
- Xcode CLI tools (`xcode-select --install`)
- Node.js (`nvm install --lts`)
- CocoaPods (`sudo gem install cocoapods`)

---

### 📥 1. Klon prosjektet

```bash
git clone https://github.com/sondremi/BetABeer.git
cd BetABeer
```

---

### 📦 2. Installer avhengigheter

```bash
npm install
```

---

### 🍎 3. Installer iOS-avhengigheter

```bash
cd ios && pod install && cd ..
```

---

### 🧠 4. Åpne i Xcode

```bash
open ios/BetABeer.xcworkspace
```

- Velg simulator eller enhet
- Gå til `Signing & Capabilities`
- Sett Apple ID som "Team"

---

### ▶️ 5. Kjør appen

#### Via Xcode:
`Cmd + R` eller klikk ▶️

#### Via terminal:

```bash
npx react-native run-ios
```

For fysisk enhet:
```bash
npx react-native run-ios --device
```

---

## 🛠 Nyttige kommandoer

Start Metro bundler:
```bash
npx react-native start
```

Resett cache:
```bash
npx react-native start --reset-cache
```
