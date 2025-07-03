import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { globalStyles } from '../globalStyles';

export const loginStyles = StyleSheet.create({
  appName: {
    ...globalStyles.titleText,
  },
  welcomeText: {
    fontSize: theme.fonts.lg,
    color: theme.colors.textAlt,
    textAlign: 'center',
  },
  toggleContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
  },
  toggleText: {
    fontSize: theme.fonts.sm,
    color: theme.colors.textAlt,
    marginBottom: theme.spacing.xs,
  },
  toggleLink: {
    fontSize: theme.fonts.sm,
    color: theme.colors.primaryAlt,
    fontWeight: '700',
  },
});