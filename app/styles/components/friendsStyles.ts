import { StyleSheet } from 'react-native';
import { globalStyles } from '../globalStyles';
import { theme } from '../theme';

export const friendsScreenTokens = {
  searchPlaceholderTextColor: theme.colors.textSecondary,
};

export const friendsStyles = StyleSheet.create({
  pageContainer: {
    padding: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    ...globalStyles.iconBackButton,
  },
  backButtonText: {
    ...globalStyles.iconBackButtonText,
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
    marginBottom: theme.spacing.xxxs,
  },
  pendingText: {
    color: theme.colors.textMuted,
    fontSize: theme.fonts.xs,
    marginTop: theme.spacing.xxxs,
  },
  button: {
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: theme.sizes.iconButton,
    minHeight: theme.sizes.iconButton,
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
    width: theme.sizes.avatarXl,
    height: theme.sizes.avatarXl,
    borderRadius: theme.sizes.avatarXl / 2,
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
    minWidth: theme.sizes.buttonWide,
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
    maxHeight: theme.sizes.maxListHeightXxl,
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