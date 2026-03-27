import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const friendsScreenTokens = {
  searchPlaceholderTextColor: theme.colors.textSecondary,
};

export const friendsStyles = StyleSheet.create({
  pageContainer: {
    padding: 0,
  },
  compactSection: {
    paddingBottom: theme.spacing.lg,
  },
  headerTitle: {
    color: theme.colors.primary,
    letterSpacing: 0.8,
  },
  friendName: {
    fontSize: theme.fonts.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  pendingText: {
    color: theme.colors.textMuted,
    fontSize: theme.fonts.xs,
    marginTop: 2,
  },
  button: {
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  friendSpacing: {
    marginBottom: theme.spacing.md,
  },
  friendRow: {
    borderRadius: theme.borderRadius.lg,
    borderColor: theme.colors.borderPremiumAlt,
    backgroundColor: theme.colors.backgroundCardAlt,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  friendImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: theme.spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  searchSectionCard: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderPremium,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  listSectionCard: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderPremium,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  inviteDescription: {
    marginBottom: 0,
  },
  searchResultBox: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderWarm,
    backgroundColor: theme.colors.backgroundListCard,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  searchInputShell: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fonts.md,
    color: theme.colors.text,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 72,
  },
  searchButtonText: {
    fontSize: theme.fonts.md,
    color: theme.colors.background,
    fontWeight: '700',
  },
  requestActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  listScrollBox: {
    maxHeight: 470,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderWarm,
    backgroundColor: theme.colors.backgroundListCard,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  listScrollContent: {
    paddingBottom: theme.spacing.xs,
  },
  scrollHint: {
    marginTop: theme.spacing.xs,
    color: theme.colors.textMuted,
    fontSize: theme.fonts.xs,
    textAlign: 'center',
  },
});