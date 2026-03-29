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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  collapsedHeaderRow: {
    marginBottom: 0,
  },
  sectionToggleButton: {
    ...globalStyles.sectionToggleIconButton,
  },
  sectionToggleButtonText: {
    ...globalStyles.sectionToggleIconButtonText,
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
    ...globalStyles.iconActionButtonSm,
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
    ...globalStyles.premiumSectionCard,
  },
  listSectionCard: {
    ...globalStyles.premiumSectionCard,
  },
  inviteDescription: {
    marginBottom: 0,
  },
  searchResultBox: {
    ...globalStyles.warmListPanel,
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
    ...globalStyles.warmListPanel,
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