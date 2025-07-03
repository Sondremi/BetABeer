import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const friendsStyles = StyleSheet.create({
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: theme.fonts.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.huge,
  },
  emptyStateText: {
    fontSize: theme.fonts.lg,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
});