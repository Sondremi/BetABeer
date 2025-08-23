import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { globalStyles } from '../globalStyles';

export const loginStyles = StyleSheet.create({
  appName: {
    ...globalStyles.titleText,
  },
  welcomeText: {
    fontSize: theme.fonts.lg,
    color: theme.colors.text,
    textAlign: 'center',
  },
  toggleContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
  },
  toggleText: {
    fontSize: theme.fonts.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  toggleLink: {
    fontSize: theme.fonts.sm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});