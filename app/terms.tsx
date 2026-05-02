import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { legalStyles } from './styles/components/legalStyles';

const LAST_UPDATED = '1. april 2026';

export default function TermsScreen() {
  return (
    <ScrollView style={legalStyles.screen} contentContainerStyle={legalStyles.content}>
      <Text style={legalStyles.title}>Terms of Service</Text>
      <Text style={legalStyles.meta}>Sist oppdatert: {LAST_UPDATED}</Text>

      <Section title="1. Om tjenesten">
        BetABeer er en sosial app for venner og grupper. Ved å bruke appen godtar du disse vilkarene.
      </Section>

      <Section title="2. Konto og sikkerhet">
        Du er ansvarlig for informasjonen du registrerer og for å holde kontoen din sikker. Del aldri passordet ditt med andre.
      </Section>

      <Section title="3. Akseptabel bruk">
        Du skal ikke bruke appen til ulovlig aktivitet, trakassering eller misbruk av andre brukere. Vi kan fjerne innhold eller kontoer som bryter disse vilkårene.
      </Section>

      <Section title="4. Brukerinnhold">
        Du eier eget innhold du legger inn i appen, men gir BetABeer en begrenset rett til å vise innholdet som en del av tjenesten.
      </Section>

      <Section title="5. Tilgjengelighet og endringer">
        Vi kan oppdatere, endre eller stoppe deler av tjenesten. Vi kan også oppdatere disse vilkårene ved behov.
      </Section>

      <Section title="6. Ansvarsbegrensning">
        Tjenesten leveres som den er. Vi er ikke ansvarlige for indirekte tap, datatap eller avbrudd som oppstår ved bruk av appen.
      </Section>

      <Section title="7. Oppsigelse">
        Du kan slutte å bruke appen når som helst. Vi kan suspendere eller avslutte kontoer ved brudd på vilkarene.
      </Section>

      <Section title="8. Kontakt">
        Hvis du har spørsmål om vilkarene, kontakt oss via tilgjengelig supportkanal i appen eller via nettsiden.
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
