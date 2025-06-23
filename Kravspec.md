## Krav
* Logge inn med bruker - navn, brukernavn, telefon, mail
* Legge til og invitere venner - forslag til venner av venner
* Opprette og bli med i grupper man er invitert til
* Opprette et bett - tittel og odds
* Bette på opprettet betts i en gruppe
* Statistikk over betts for gruppen
* Statistikk over betts for bruker
* Statistikk over hvem som har blitt tildelt flest drinker
* Statistikk over hvem som har drukket flest enheter
* Kunne være i flere grupper
* Kunne varlse om at et bett er vunnet (alle i gruppen vil bli varslet)
** Vinner av et bet får da opp hvor mange slurker som kan deles ut, og en visning av profilen til alle i gruppen
** vinner kan da fordele slurkene ved å trykke på hvert medlem
* Hente data fra en alkometer tester 
** Lage funksjonalitet som oppdaterer måleren med hver enhet en bruker drikker (enkel knapp)
** Ha en visning som oppdaterer seg automatisk med et anslag på nåværende promille og maksimal promille neste timene
** Kan legge til høyde, vekt og kjønn i profilen slik at promilleanslaget blir så nøyaktig som mulig og samtidig slippe å måtte skrive det inn før hvert spill

## Design
### Login-skjerm
* Logge inn med brukernavn og passord
* Opprette ny bruker

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
* De som har opprettet et bett
* * Kan endre Tittel
* * Kan endre alternativer og odds
* * Kan legge inn riktig alternativ

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
* Har en type det bettes om (slurker øl/cider, hele enheter eller shots)
* Har betting alternativer med odds
* Riktig svar blir registrert av den som opprettet 
* Tilhører en gruppe
