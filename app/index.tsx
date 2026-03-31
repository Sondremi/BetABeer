import { Link, Stack } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from './styles/theme';

const features = [
  'Logg inn eller opprett bruker',
  'Legg til venner og bygg grupper',
  'Lag bets med slurker, shots eller chugg',
  'Se live resultater i gruppa',
  'Følg statistikk på vinnere og drikkere',
  'Bruk innebygd promillekalkulator',
];

export default function Index() {
  return (
    <>
      <Stack.Screen options={{ title: 'BetABeer' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Sosial drikkelek-app</Text>
          <Text style={styles.title}>BetABeer</Text>
          <Text style={styles.subtitle}>
            En sosial app der du og vennene dine kan lage morsomme bets og følge resultatene live.
            Denne siden er offentlig og krever ikke innlogging.
          </Text>

          <View style={styles.links}>
            <Link href="/login" style={styles.primaryLink}>
              Gå til innlogging
            </Link>
            <Link href="/privacy" style={styles.secondaryLink}>
              Les Privacy Policy
            </Link>
            <Link href="/terms" style={styles.secondaryLink}>
              Les Terms of Service
            </Link>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Hvordan fungerer det?</Text>
          {features.map((feature) => (
            <Text key={feature} style={styles.featureItem}>
              • {feature}
            </Text>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Om appen</Text>
          <Text style={styles.sectionText}>
            BetABeer er laget for vors, fest og kveld på byen. Du kan opprette grupper, invitere venner,
            konkurrere i bets og få en rask oversikt over hvem som vinner mest.
          </Text>
          <Text style={styles.sectionText}>
            For personvern og vilkår, bruk lenkene over: Privacy Policy og Terms of Service.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDeep,
  },
  content: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.massive,
  },
  heroCard: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: theme.colors.backgroundPanel,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  eyebrow: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.smPlus,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.5,
  },
  title: {
    color: theme.colors.primary,
    fontSize: theme.fonts.xxxl,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.md,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  sectionCard: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: theme.colors.backgroundPanel,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fonts.xl,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  sectionText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.md,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.md,
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
  },
  links: {
    gap: theme.spacing.md,
  },
  primaryLink: {
    color: theme.colors.textOnGold,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    textAlign: 'center',
    fontSize: theme.fonts.md,
    fontWeight: '700',
  },
  secondaryLink: {
    color: theme.colors.text,
    backgroundColor: theme.colors.backgroundCard,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    textAlign: 'center',
    fontSize: theme.fonts.md,
    fontWeight: '600',
  },
});
