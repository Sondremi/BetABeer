# 🚀 Kom i gang med BetABeer

Denne guiden viser deg hvordan du setter opp og kjører appen på en Mac med iOS-simulator eller fysisk iPhone.

---

## 🔧 Forutsetninger

Før du begynner må du ha installert:

- Xcode (via App Store)
- Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```
- Node.js:
  ```bash
  nvm install --lts
  nvm use --lts
  ```
- CocoaPods:
  ```bash
  sudo gem install cocoapods
  ```

---

## 📥 1. Klon repoet

```bash
git clone https://github.com/sondremi/BetABeer.git
cd BetABeer
```

---

## 📦 2. Installer avhengigheter

```bash
npm install
```

---

## 🍎 3. Installer iOS-avhengigheter

```bash
cd ios && pod install && cd ..
```

---

## 🧠 4. Åpne prosjektet i Xcode

```bash
open ios/BetABeer.xcworkspace
```

### Gjør dette i Xcode:

- Velg simulator eller fysisk enhet
- Gå til `Signing & Capabilities`
- Velg din Apple ID som "Team"

---

## ▶️ 5. Kjør appen

### Fra Xcode:
- Trykk `Cmd + R` eller klikk ▶️

### Fra terminalen:
```bash
npx react-native run-ios
```

> For fysisk enhet:
```bash
npx react-native run-ios --device
```

---

## 💡 Nyttige kommandoer

Start Metro bundler manuelt:
```bash
npx react-native start
```

Resett cache hvis noe henger:
```bash
npx react-native start --reset-cache
```

---

## ✅ Klar!

Appen skal nå kjøre i simulatoren eller på en fysisk iPhone 🎉  
Gi beskjed hvis du støter på feil.
