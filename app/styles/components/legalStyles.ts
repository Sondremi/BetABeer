import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const legalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDeep,
  },
  content: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.massive,
  },
  title: {
    color: theme.colors.primary,
    fontSize: theme.fonts.xxl,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sm,
    marginBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundPanel,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fonts.md,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  paragraph: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.smPlus,
    lineHeight: 22,
  },
});
