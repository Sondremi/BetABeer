## Dev stack-oversikt
| Lag      | Teknologi                              |
| -------- | -------------------------------------- |
| Frontend | React Native (TypeScript)              |
| Backend  | Node.js (Express el. Nest.js)          |
| Database | PostgreSQL                             |
| ORM      | Prisma                                 |
| Hosting  | Railway, Supabase eller Render for dev |

## Krav
* Logge inn med bruker - navn, brukernavn, telefon, mail
* Legge til og invitere venner - forslag til venner av venner
* Opprette og bli med i grupper man er invitert til
* Opprette et bett - tittel og odds
* Bette på opprettet betts i en gruppe
* Statistikk over betts for gruppen
* Statistikk over betts for bruker
* Kunne være i flere grupper

## Design
### Profil-skjerm
* Se navn, brukernavn og profilbilde
* Se grupper man er lagt til i
* Knapp til innstillinger
* Knapp for å gå til venner-skjerm

### Gruppe-skjerm
* For de som har opprettet gruppen
* * Mulighet til å endre navn og bilde
* * Fjerne medlemmer fra gruppen
* * Slette gruppen
* Legge til medlemmer
* Opprette betts
* Slette betts

### Venner-skjerm
* Invitere til appen via link
* Se venners profiler
* Legge til venner via brukernavn eller tlfnr

### Innstillinger-skjerm
* Endre navn og profilbilde
* Endre telefonnr og epost
* Slette bruker

## Database
### Profil
* Har et navn, brukernavn, telefonnr og epost
* Har et passord
* Kan ha et profilbilde
* Er med i null eller mange grupper
* Statistikk

### Gruppe
* Tilhører en eller mange profiler
* Har en oppretter-profil
* Har null eller mange betts
* Statistikk

### Bet
* Har en tittel
* Har betting alternativer med odds
* Tilhører en gruppe
