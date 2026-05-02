import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { legalStyles } from './styles/components/legalStyles';

const LAST_UPDATED = '1. april 2026';

export default function PrivacyScreen() {
  return (
    <ScrollView style={legalStyles.screen} contentContainerStyle={legalStyles.content}>
      <Text style={legalStyles.title}>Privacy Policy</Text>
      <Text style={legalStyles.meta}>Sist oppdatert: {LAST_UPDATED}</Text>

      <Section title="1. Hvilke data vi samler inn">
        Vi samler inn kontoopplysninger du oppgir, slik som brukernavn, navn, e-post og valgfritt profilbilde. Vi lagrer også data knyttet til grupper og venneforhold i appen.
      </Section>

      <Section title="2. Hvordan data brukes">
        Data brukes for å levere kjernefunksjoner i BetABeer, inkludert innlogging, gruppefunksjoner, invitasjoner og profilvisning.
      </Section>

      <Section title="3. Lagring og sikkerhet">
        Vi bruker tekniske og organisatoriske tiltak for å beskytte data mot uautorisert tilgang. Ingen metode for lagring eller overføring er 100 prosent sikker.
      </Section>

      <Section title="4. Deling av data">
        Vi selger ikke personopplysninger. Data deles kun med underleverandoerer som trengs for drift av tjenesten, eller der loven krever det.
      </Section>

      <Section title="5. Dine rettigheter">
        Du kan be om innsyn, retting eller sletting av data knyttet til kontoen din, i tråd med gjeldende personvernlovgivning.
      </Section>

      <Section title="6. Lagringstid">
        Data lagres så lenge kontoen er aktiv eller så lenge det er nødvendig for tjenesteleveranse og rettslige forpliktelser.
      </Section>

      <Section title="7. Barn og unge">
        Tjenesten er ikke ment for barn under gjeldende aldersgrense i relevante markeder. Dersom vi blir kjent med feilregistrert data, vil vi slette den.
      </Section>

      <Section title="8. Endringer i policyen">
        Vi kan oppdatere denne personvernerklæringen. Vesentlige endringer publiseres på denne siden med oppdatert dato.
      </Section>

      <Section title="9. Kontakt">
        For personvernspørsmål, kontakt oss via tilgjengelig supportkanal i appen eller via nettsiden.
      </Section>
    </ScrollView>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View style={legalStyles.section}>
      <Text style={legalStyles.sectionTitle}>{title}</Text>
      <Text style={legalStyles.paragraph}>{children}</Text>
    </View>
  );
}
