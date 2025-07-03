import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const friendsStyles = StyleSheet.create({
  friendName: {
    fontSize: theme.fonts.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  inviteSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  friendSpacing: {
    marginBottom: theme.spacing.lg,
  },
  fullWidthScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});