import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const friendsScreenTokens = {
  searchPlaceholderTextColor: theme.colors.textSecondary,
};

export const friendsStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  compactSection: {
    paddingBottom: 0,
  },
  headerTitle: {
    color: theme.colors.primary,
    letterSpacing: 0.8,
  },
  friendName: {
    fontSize: theme.fonts.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xxxs,
  },
  pendingText: {
    color: theme.colors.textMuted,
    fontSize: theme.fonts.xs,
    marginTop: theme.spacing.xxxs,
  },
  friendRow: {
    borderRadius: theme.borderRadius.lg,
    borderColor: theme.colors.borderPremiumAlt,
    backgroundColor: theme.colors.backgroundCardAlt,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  friendImage: {
    width: theme.sizes.avatarXl,
    height: theme.sizes.avatarXl,
    borderRadius: theme.sizes.avatarXl / 2,
    marginRight: theme.spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fonts.md,
    color: theme.colors.text,
  },
  listScrollBox: {
    maxHeight: theme.sizes.maxListHeightXxl,
  },
  scrollHint: {
    marginTop: theme.spacing.xs,
    color: theme.colors.textMuted,
    fontSize: theme.fonts.xs,
    textAlign: 'center',
  },
});