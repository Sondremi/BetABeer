import { StyleSheet } from 'react-native';
import { globalStyles } from '../globalStyles';
import { theme } from '../theme';

export const groupStyles = StyleSheet.create({
  screenContainer: {
    padding: 0,
  },
  pageScrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyStateText: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.textSecondary,
  },
  heroBackButton: {
    ...globalStyles.iconBackButton,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  heroBackButtonText: {
    ...globalStyles.iconBackButtonText,
  },
  heroImageBackButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    zIndex: 3,
    ...globalStyles.iconBackButton,
  },
  groupHeaderOverlayCompact: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  groupHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupActionIconButton: {
    marginLeft: theme.spacing.sm,
  },
  groupActionDangerButton: {
    marginLeft: theme.spacing.sm,
    alignSelf: 'center',
  },
  groupTopControlArea: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: 0,
  },
  groupTopControlRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  groupTopControlBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  groupBackControlButton: {
    marginBottom: 0,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + theme.spacing.xxxs,
    borderRadius: theme.borderRadius.sm,
  },
  groupBackControlText: {
    fontSize: theme.fonts.sm,
    fontWeight: '700',
  },
  groupTopDangerLinkButton: {
    marginBottom: 0,
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.effects.error55,
    backgroundColor: 'transparent',
  },
  groupTopDangerLinkText: {
    fontSize: theme.fonts.xs,
    fontWeight: '600',
    color: theme.colors.error,
  },
  groupBottomExitArea: {
    marginHorizontal: theme.spacing.md,
    marginTop: 0,
    marginBottom: theme.spacing.lg,
    alignItems: 'flex-end',
  },
  groupBottomExitButton: {
    marginBottom: 0,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + theme.spacing.xxxs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.effects.error55,
    backgroundColor: theme.colors.surface,
  },
  groupBottomExitButtonText: {
    fontSize: theme.fonts.sm,
    fontWeight: '700',
    color: theme.colors.error,
  },
  betSelectionHintText: {
    marginTop: theme.spacing.xs,
  },
  actionCard: {
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderPremium,
    backgroundColor: theme.colors.backgroundPanel,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  groupInviteLinkButton: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
  },
  groupInviteLinkButtonText: {
    fontSize: theme.fonts.sm,
    fontWeight: '700',
  },
  actionGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  actionGridButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm + theme.spacing.xxxs,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
  },
  actionGridButtonText: {
    fontSize: theme.fonts.sm,
  },
  betListSection: {
    paddingBottom: theme.spacing.xl,
  },
  modalContentLarge: {
    width: '95%',
    maxHeight: '85%',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  modalContentMedium: {
    width: '92%',
    maxHeight: '85%',
  },
  modalScrollContent: {
    paddingBottom: theme.spacing.sm,
  },
  modalSectionCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  modalSectionTitle: {
    fontSize: theme.fonts.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  modalSectionSubtitle: {
    fontSize: theme.fonts.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalLoadingText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontSize: theme.fonts.sm,
  },
  scrollableListWrap: {
    maxHeight: theme.sizes.maxListHeightXl,
  },
  recipientListWrap: {
    maxHeight: theme.sizes.maxListHeightLg,
    marginBottom: theme.spacing.md,
  },
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  memberGridCell: {
    width: '33.33%',
    padding: theme.spacing.xs,
    alignItems: 'center',
  },
  memberSelectCard: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    minHeight: theme.sizes.buttonWide + theme.spacing.md + theme.spacing.xxs,
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  memberSelectCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.effects.gold12,
  },
  memberSelectAvatar: {
    width: theme.sizes.avatarLg,
    height: theme.sizes.avatarLg,
    marginBottom: theme.spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  memberSelectAvatarActive: {
    borderColor: theme.colors.primary,
  },
  memberSelectName: {
    fontSize: theme.fonts.xs,
    textAlign: 'center',
    fontWeight: '500',
  },
  memberSelectNameActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  memberSelectLabel: {
    fontSize: theme.fonts.xxs,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: theme.spacing.xxxs,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxs,
  },
  memberAvatar: {
    width: theme.sizes.avatarLg + theme.spacing.xxxs,
    height: theme.sizes.avatarLg + theme.spacing.xxxs,
    marginRight: theme.spacing.sm + theme.spacing.xxxs,
  },
  memberMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    marginBottom: 0,
    textAlign: 'left',
    lineHeight: 20,
  },
  memberUsername: {
    marginTop: 0,
    textAlign: 'left',
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },
  anonymousToggleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  anonymousToggleButton: {
    flex: 1,
    marginRight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberActionButton: {
    marginBottom: 0,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm + theme.spacing.xxxs,
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  memberActionText: {
    fontSize: theme.fonts.xs,
    fontWeight: '600',
    lineHeight: theme.fonts.md,
  },
  memberActionButtonWithGap: {
    marginLeft: theme.spacing.sm,
  },
  memberActionDangerBorder: {
    borderColor: theme.colors.error,
  },
  memberActionDangerText: {
    color: theme.colors.error,
  },
  memberDistributionPanel: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  memberDistributionHelperText: {
    fontSize: theme.fonts.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  memberDistributionAddButton: {
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.effects.gold12,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.xs,
    marginBottom: theme.spacing.xs,
  },
  distributionChoiceButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xs,
    marginBottom: theme.spacing.xxs,
    borderWidth: 2,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distributionChoiceButtonActive: {
    backgroundColor: theme.effects.gold12,
    borderColor: theme.colors.primary,
  },
  distributionChoiceText: {
    color: theme.colors.text,
    fontSize: theme.fonts.sm,
    fontWeight: '500',
  },
  distributionChoiceTextActive: {
    color: theme.colors.primary,
  },
  distributionChoiceBlock: {
    marginBottom: theme.spacing.sm,
  },
  distributionAmountBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    minWidth: theme.sizes.minValueBadge,
    backgroundColor: theme.colors.textSecondary,
  },
  distributionAmountPlainText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sm,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: theme.sizes.minAmountText,
  },
  amountChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  amountChip: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xs,
    minWidth: theme.sizes.minAmountChip,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  amountChipSelected: {
    backgroundColor: theme.effects.gold12,
    borderColor: theme.colors.primary,
  },
  amountChipDisabled: {
    borderColor: theme.effects.white10,
    opacity: 0.5,
  },
  amountChipText: {
    color: theme.colors.text,
    fontSize: theme.fonts.md,
    fontWeight: '500',
  },
  amountChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  transactionRow: {
    paddingVertical: theme.spacing.sm + theme.spacing.xxxs,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  transactionTitleText: {
    fontSize: theme.fonts.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  transactionDetailText: {
    fontSize: theme.fonts.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xxxs,
  },
  detailedMemberCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailedMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailedMemberAvatar: {
    width: theme.sizes.avatarMd,
    height: theme.sizes.avatarMd,
    marginRight: theme.spacing.md,
  },
  detailedMemberName: {
    fontSize: theme.fonts.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  detailedMemberSubtext: {
    fontSize: theme.fonts.xs,
    color: theme.colors.textSecondary,
  },
  statChipRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  statChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    backgroundColor: theme.colors.backgroundCard,
  },
  statChipPrimary: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.backgroundCard,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 2,
  },
  statChipLabel: {
    fontSize: theme.fonts.xs,
    color: theme.colors.textSecondary,
  },
  statChipValue: {
    fontSize: theme.fonts.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  statsBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: theme.effects.white08,
  },
  statsBreakdownLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sm,
  },
  statsBreakdownValue: {
    color: theme.colors.text,
    fontSize: theme.fonts.sm,
    fontWeight: '600',
  },
  statsBreakdownActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  consumeActionButton: {
    marginBottom: 0,
    paddingVertical: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.sm,
  },
  consumeActionButtonText: {
    fontSize: theme.fonts.xs,
    fontWeight: '600',
  },
  noConsumeDrinksTitle: {
    fontSize: theme.fonts.sm,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  noConsumeDrinksSubtext: {
    fontSize: theme.fonts.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statsBreakdownScroll: {
    maxHeight: theme.sizes.maxListHeightSm,
  },
  consumeHelperText: {
    marginBottom: theme.spacing.sm,
  },
  inputShell: {
    marginTop: theme.spacing.xs,
  },
  inputInsideShell: {
    borderWidth: 0,
  },
  leaderboardModalContent: {
    width: '95%',
    maxHeight: '85%',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  leaderboardToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  leaderboardToggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
  },
  leaderboardToggleActive: {
    backgroundColor: theme.colors.primary,
  },
  modalFooter: {
    marginTop: theme.spacing.md,
  },
  distributionFooterRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  distributionSubmitButton: {
    marginTop: 0,
    marginBottom: 0,
    flex: 1,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.md,
  },
  distributionSubmitText: {
    fontSize: theme.fonts.md,
    fontWeight: '700',
  },
  modalFooterBordered: {
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  groupHeaderName: {
    fontSize: theme.fonts.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  groupHeaderMembers: {
    fontSize: theme.fonts.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  groupNameInput: {
    ...globalStyles.input,
    fontSize: theme.fonts.xxl,
    fontWeight: 'bold',
    marginRight: theme.spacing.sm,
    minWidth: 120,
  },
  groupNameInputCompact: {
    flexBasis: 140,
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 80,
    maxWidth: 160,
    fontSize: theme.fonts.md,
    paddingVertical: theme.spacing.xxxs + 1,
    paddingHorizontal: theme.spacing.sm,
  },
  inlineIconActionButton: {
    marginLeft: theme.spacing.xxxs + 1,
  },
  leaderboardSectionWrap: {
    marginBottom: theme.spacing.md,
  },
  leaderboardSectionTopGap: {
    marginTop: theme.spacing.lg,
  },
  leaderboardToggleLabel: {
    fontSize: theme.fonts.sm,
  },
  leaderboardListWrap: {
    paddingBottom: theme.spacing.md,
  },
  leaderboardPodiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm + theme.spacing.xxxs,
    paddingHorizontal: theme.spacing.sm + theme.spacing.xxs,
    marginBottom: theme.spacing.xs,
  },
  leaderboardRankBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxxs + 1,
    borderRadius: 999,
    backgroundColor: theme.effects.gold12,
    borderWidth: 1,
    borderColor: theme.effects.gold85,
    marginRight: theme.spacing.sm,
    minWidth: theme.sizes.minValueBadge,
    alignItems: 'center',
  },
  leaderboardRankText: {
    fontSize: theme.fonts.xs,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  leaderboardListAvatar: {
    width: theme.sizes.avatarMd,
    height: theme.sizes.avatarMd,
    marginRight: theme.spacing.sm,
  },
  leaderboardMemberMeta: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  leaderboardMemberName: {
    fontSize: theme.fonts.sm,
    color: theme.colors.text,
  },
  leaderboardMemberSubtext: {
    fontSize: theme.fonts.xs,
    color: theme.colors.textSecondary,
  },
  leaderboardStatsCard: {
    minWidth: 84,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  leaderboardStatsCardWide: {
    minWidth: 104,
  },
  leaderboardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leaderboardStatColumn: {
    alignItems: 'center',
    flex: 1,
  },
  leaderboardStatLabel: {
    fontSize: theme.fonts.xxs + 1,
    color: theme.colors.textSecondary,
    letterSpacing: 0.3,
  },
  leaderboardStatLabelWide: {
    letterSpacing: 0.4,
  },
  leaderboardStatValue: {
    fontSize: theme.fonts.lg,
    color: theme.colors.text,
    fontWeight: '700',
  },
  leaderboardStatValueCompact: {
    fontSize: theme.fonts.lg - 2,
  },
  leaderboardCenterAligned: {
    alignItems: 'center',
  },
  leaderboardEmptyStateText: {
    fontSize: theme.fonts.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  leaderboardCloseButtonText: {
    fontSize: theme.fonts.md,
    color: theme.colors.primary,
  },
  podiumCardBase: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  podiumCardFirst: {
    width: '34%',
    height: 200,
  },
  podiumCardOther: {
    width: '30%',
    height: 170,
  },
  podiumCardSecondOffset: {
    marginRight: theme.spacing.sm,
  },
  podiumCardThirdOffset: {
    marginLeft: theme.spacing.sm,
  },
  podiumAvatarFirst: {
    width: 60,
    height: 60,
  },
  podiumAvatarOther: {
    width: 50,
    height: 50,
  },
  podiumNameWrap: {
    paddingHorizontal: theme.spacing.xs,
    width: '100%',
  },
  podiumNameText: {
    color: theme.colors.text,
    textAlign: 'center',
  },
  podiumNameTextFirst: {
    fontSize: theme.fonts.md,
    fontWeight: '600',
  },
  podiumNameTextOther: {
    fontSize: theme.fonts.sm,
    fontWeight: '500',
  },
  podiumPlacementBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  podiumPlacementBadgeFirst: {
    paddingHorizontal: theme.spacing.md - 2,
    paddingVertical: theme.spacing.xxs,
  },
  podiumPlacementBadgeOther: {
    paddingHorizontal: theme.spacing.sm + theme.spacing.xxxs,
    paddingVertical: theme.spacing.xxxs + 1,
  },
  podiumPlacementText: {
    color: theme.colors.background,
    fontWeight: '700',
  },
  podiumPlacementTextFirst: {
    fontSize: theme.fonts.sm,
  },
  podiumPlacementTextOther: {
    fontSize: theme.fonts.xs,
  },
  podiumStatsCard: {
    width: '100%',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
  },
  podiumStatsCardFirst: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingVertical: theme.spacing.sm,
  },
  podiumStatsCardOther: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: theme.spacing.sm - 2,
  },
  podiumStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  podiumStatsColumn: {
    alignItems: 'center',
    flex: 1,
  },
  podiumStatsLabel: {
    fontSize: theme.fonts.xxs + 2,
    color: theme.colors.background,
    opacity: 0.9,
  },
  podiumStatsValue: {
    color: theme.colors.background,
    fontWeight: '700',
  },
  podiumStatsValueFirst: {
    fontSize: theme.fonts.xxl,
  },
  podiumStatsValueOther: {
    fontSize: theme.fonts.xl,
  },
  createBetSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  betTitle: {
    color: theme.colors.primary,
    fontSize: theme.fonts.lg,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  betMetaText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.xs,
    marginBottom: theme.spacing.sm,
  },
  betSpacing: {
    marginBottom: theme.spacing.lg,
  },
  betContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  userBetSummary: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  userBetSummaryText: {
    color: theme.colors.background,
    fontSize: theme.fonts.sm,
    fontWeight: '600',
  },
  userBetSummaryWin: {
    backgroundColor: theme.colors.success,
  },
  userBetSummaryLose: {
    backgroundColor: theme.colors.error,
  },
  userBetSummaryTextWin: {
    color: theme.colors.text,
  },
  userBetSummaryTextLose: {
    color: theme.colors.text,
  },
  bettingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bettingOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  bettingOptionCorrect: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  bettingOptionIncorrect: {
    backgroundColor: theme.colors.border,
    borderColor: theme.colors.border,
    opacity: 0.7,
  },
  optionName: {
    color: theme.colors.text,
    fontSize: theme.fonts.md,
    fontWeight: '500',
  },
  optionNameSelected: {
    color: theme.colors.background,
  },
  optionNameCorrect: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  optionNameIncorrect: {
    color: theme.colors.textMuted,
  },
  optionOdds: {
    color: theme.colors.primary,
    fontSize: theme.fonts.md,
    fontWeight: 'bold',
  },
  optionOddsSelected: {
    color: theme.colors.background,
  },
  optionOddsCorrect: {
    color: theme.colors.text,
  },
  optionOddsIncorrect: {
    color: theme.colors.textMuted,
  },
  userWagerText: {
    color: theme.colors.background,
    fontSize: theme.fonts.xs,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
  userWagerTextCorrect: {
    color: theme.colors.text,
  },
  wagersSectionTitle: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sm,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  wagerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundCard,
    marginBottom: theme.spacing.xs,
  },
  wagersScrollWrap: {
    maxHeight: theme.sizes.maxListHeightMd,
  },
  wagerUser: {
    color: theme.colors.text,
    fontSize: theme.fonts.sm,
    fontWeight: '500',
    flex: 1,
  },
  wagerDetails: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.xs,
    flex: 2,
    textAlign: 'right',
  },
  betStatusText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.xs,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  disabledGoldActionText: {
    color: theme.colors.primarySoft,
    opacity: 0.55,
  }
});