import { StyleSheet } from 'react-native';
import { globalStyles } from '../globalStyles';
import { theme } from '../theme';

export const profileChartConfigStyle = {
  borderRadius: theme.borderRadius.md,
};

export const profileScreenTokens = {
  nameInputPlaceholderTextColor: theme.colors.textMuted,
  createGroupPlaceholderTextColor: theme.colors.textSecondary,
  customAlcoholPlaceholderTextColor: theme.colors.textMuted,
};

export const profileChartDataset = {
  color: () => theme.colors.primaryChart,
  strokeWidth: 3,
};

export const profileChartConfig = {
  backgroundColor: theme.colors.backgroundChart,
  backgroundGradientFrom: theme.colors.backgroundChart,
  backgroundGradientTo: theme.colors.backgroundChartAlt,
  decimalPlaces: 3,
  color: (opacity = 1) => theme.chart.primaryColor(opacity),
  labelColor: () => theme.colors.textChartLabel,
  style: profileChartConfigStyle,
  propsForDots: { r: '3', strokeWidth: '1', stroke: theme.colors.primaryChart },
  propsForLabels: { fontSize: theme.fonts.xxs },
  propsForBackgroundLines: { stroke: theme.colors.chartGrid, strokeDasharray: '' },
};

export const profileStyles = StyleSheet.create({
  compactSection: {
    ...globalStyles.commonCompactSection,
  },
  compactCenteredSection: {
    ...globalStyles.commonCompactSection,
  },
  heroSection: {
    paddingTop: theme.spacing.xxxl,
  },
  profileImage: {
    width: theme.sizes.avatarHero,
    height: theme.sizes.avatarHero,
  },
  profileImageContainer: {
    marginBottom: theme.spacing.lg,
    position: 'relative',
  },
  profileHeroCard: {
    width: '100%',
    position: 'relative',
    borderRadius: theme.borderRadius.hero,
    borderWidth: 1,
    borderColor: theme.colors.borderHero,
    backgroundColor: theme.colors.backgroundPanel,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  heroButton: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.circle,
    backgroundColor: theme.colors.backgroundCard,
    borderWidth: 1,
    borderColor: theme.colors.borderHeroButton,
  },
  heroButtonRight: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.circle,
    backgroundColor: theme.colors.backgroundCard,
    borderWidth: 1,
    borderColor: theme.colors.borderHeroButton,
  },
  heroFriendsBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: theme.colors.error,
    borderWidth: 1,
    borderColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFriendsBadgeText: {
    color: theme.colors.background,
    fontSize: theme.fonts.xxs,
    fontWeight: '700',
    lineHeight: theme.fonts.xs,
  },
  heroFriendsIcon: {
    ...globalStyles.primaryIcon,
    resizeMode: 'contain',
  },
  profileName: {
    marginTop: theme.spacing.sm,
  },
  profileUsername: {
    ...globalStyles.commonBetSelectionHintText,
  },
  sectionCard: {
    borderRadius: theme.borderRadius.hero,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  sectionCardSpacing: {
    ...globalStyles.commonFriendSpacing,
  },
  bacActionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  bacHeaderRow: {
    ...globalStyles.commonSectionHeaderRow,
  },
  collapsedHeaderRow: {
    ...globalStyles.commonCollapsedHeaderRow,
  },
  bacToggleButton: {
    ...globalStyles.sectionToggleIconButton,
  },
  bacToggleButtonText: {
    ...globalStyles.sectionToggleIconButtonText,
  },
  bacActionButton: {
    flex: 1,
    minHeight: theme.sizes.buttonMinHeight,
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bacActionButtonText: {
    textAlign: 'center',
    width: '100%',
    lineHeight: theme.fonts.lg,
  },
  bacResetButton: {
    flex: 1,
    minHeight: theme.sizes.buttonMinHeight,
    paddingVertical: theme.spacing.sm,
  },
  bacQuickAddButton: {
    ...globalStyles.commonBacQuickAddButton,
  },
  bacQuickAddButtonText: {
    textAlign: 'center',
  },
  editProfileImageButton: {
    position: 'absolute',
    right: theme.spacing.xs,
    bottom: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.xxxs,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.profileButton,
  },
  groupsSection: {
    width: '100%',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  groupsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  groupsHeaderAction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  groupsHeaderActionButton: {
    marginBottom: 0,
    alignSelf: 'flex-start',
    width: '48%',
    minHeight: theme.sizes.iconButton,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  groupsHeaderActionButtonText: {
    fontSize: theme.fonts.sm,
    textAlign: 'center',
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  groupItem: {
    ...globalStyles.card,
    width: '48%',
    height: theme.sizes.profileGroupCardHeight,
  },
  groupName: {
    fontSize: theme.fonts.md,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xxxs,
  },
  groupMembers: {
    fontSize: theme.fonts.xs,
    color: theme.colors.text,
    opacity: 0.9,
  },
  invitationBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxxs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitationBadgeText: {
    color: theme.colors.background,
    fontSize: theme.fonts.xs,
    fontWeight: 'bold',
  },
  invitationItemRow: {
    paddingVertical: theme.spacing.sm + theme.spacing.xxxs,
  },
  invitationInfo: {
    flex: 1,
    paddingBottom: 0,
  },
  invitationActionRow: {
    ...globalStyles.commonGroupHeaderActions,
  },
  invitationAcceptButton: {
    ...globalStyles.commonPodiumCardSecondOffset,
  },
  invitationRejectButton: {
    ...globalStyles.destructiveButtonModal,
  },
  invitationRejectButtonText: {
    ...globalStyles.selectionButtonTextSelected,
  },
  chartCard: {
    marginBottom: 0,
    marginTop: theme.spacing.md,
    borderRadius: theme.fonts.md,
    borderWidth: 1,
    borderColor: theme.colors.borderChartCard,
    backgroundColor: theme.colors.backgroundChartCard,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  chart: {
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'center',
  },
  chartSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  statPill: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    position: 'relative',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderStat,
    backgroundColor: theme.colors.backgroundStat,
    minHeight: theme.spacing.massive + theme.spacing.sm,
    paddingTop: theme.spacing.xxl + theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    justifyContent: 'flex-start',
  },
  statLabel: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: theme.fonts.xs,
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: theme.fonts.md,
    fontWeight: '700',
    lineHeight: theme.spacing.xl,
  },
  statMainSlot: {
    minHeight: theme.spacing.xxl,
    justifyContent: 'center',
  },
  chartInteractiveShell: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  invitationItemSpacing: {
    ...globalStyles.commonDistributionChoiceBlock,
  },
  groupRowSpacer: {
    width: '48%',
  },
  createGroupRow: {
    ...globalStyles.commonRequestActionRow,
  },
  createGroupInputShell: {
    ...globalStyles.itemInfo,
  },
  createGroupInput: {
    ...globalStyles.commonCreateGroupInput,
  },
  createGroupActionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderPrimarySoft,
    minHeight: theme.sizes.buttonMinHeight,
    minWidth: theme.spacing.huge + theme.spacing.huge + theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createGroupActionButtonText: {
    color: theme.colors.background,
    fontSize: theme.fonts.md,
    fontWeight: '700',
  },
  createGroupModalContent: {
    maxHeight: theme.sizes.sheetMaxHeight,
  },
  inviteListBox: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderListCard,
    backgroundColor: theme.colors.backgroundListCardAlt,
    maxHeight: theme.sizes.maxListHeightMd,
    padding: theme.spacing.sm,
  },
  inviteBulkActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  inviteBulkActionText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sm,
    fontWeight: '600',
  },
  inviteListScroll: {
    width: '100%',
  },
  inviteListScrollContent: {
    ...globalStyles.commonListScrollContent,
  },
  inviteListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundCardAlt,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  inviteListRowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.backgroundTabItemFocused,
  },
  inviteListAvatar: {
    width: theme.sizes.avatarSm,
    height: theme.sizes.avatarSm,
    borderRadius: theme.sizes.avatarSm / 2,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  inviteListInfo: {
    ...globalStyles.itemInfo,
  },
  inviteListName: {
    color: theme.colors.text,
    fontSize: theme.fonts.md,
    fontWeight: '600',
    marginBottom: theme.spacing.xxxs,
  },
  inviteStatusText: {
    color: theme.colors.textMuted,
    fontSize: theme.fonts.xs,
    fontWeight: '600',
    textAlign: 'right',
    marginLeft: theme.spacing.sm,
    maxWidth: theme.sizes.maxInlineStatusWidth,
  },
  inviteStatusTextSelected: {
    ...globalStyles.primaryColorText,
  },
  profileModalContent: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    maxHeight: theme.sizes.maxDialogHeight,
  },
  onboardingModalContent: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    maxWidth: theme.sizes.heroCardMaxWidth,
  },
  onboardingTitle: {
    ...globalStyles.primaryColorText,
  },
  onboardingTextBox: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderListCard,
    backgroundColor: theme.colors.backgroundListCardAlt,
    maxHeight: 220,
    paddingHorizontal: theme.spacing.sm,
  },
  onboardingTextScroll: {
    ...globalStyles.commonOnboardingTextScroll,
  },
  onboardingTextScrollContent: {
    paddingVertical: theme.spacing.sm,
  },
  onboardingBodyText: {
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  onboardingInfoText: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  profileModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  profileUploadPreviewWrap: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  profileUploadPreviewImage: {
    ...globalStyles.commonProfileUploadPreviewImage,
  },
  profileUploadButton: {
    ...globalStyles.commonDistributionChoiceBlock,
  },
  profileModalActionButton: {
    marginBottom: 0,
    minWidth: 112,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  profileModalActionButtonText: {
    fontSize: theme.fonts.sm,
    fontWeight: '600',
    lineHeight: theme.fonts.md,
  },
  profileUploadHintText: {
    color: theme.colors.textMuted,
    fontSize: theme.fonts.xs,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  profileImageChoice: {
    margin: theme.spacing.sm,
    borderRadius: theme.sizes.avatarXl,
  },
  profileImageChoiceSelected: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  profileImageChoiceImage: {
    ...globalStyles.commonProfileUploadPreviewImage,
  },
  profileNameGroup: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  profileNameInput: {
    ...globalStyles.commonCreateGroupInput,
  },
  drinkModalContent: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    maxHeight: theme.sizes.sheetMaxHeight,
  },
  drinkFormScrollBox: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderListCard,
    backgroundColor: theme.colors.backgroundListCardAlt,
    padding: theme.spacing.sm,
    maxHeight: theme.sizes.sheetMaxHeight - 180,
  },
  drinkModalScroll: {
    ...globalStyles.commonOnboardingTextScroll,
  },
  drinkModalScrollContent: {
    ...globalStyles.commonLeaderboardListWrap,
  },
  drinkModalActions: {
    ...globalStyles.commonModalFooter,
  },
  drinkModalTitle: {
    ...globalStyles.commonFriendSpacing,
  },
  pickerGroupCompact: {
    ...globalStyles.commonDistributionChoiceBlock,
  },
  customAlcoholInput: {
    height: theme.sizes.avatarSm,
  },
  compactNumberShell: {
    alignSelf: 'flex-start',
    width: '70%',
    minWidth: 180,
    maxWidth: 260,
  },
  compactNumberInput: {
    height: theme.sizes.avatarSm - theme.spacing.xxxs,
  },
  unitInputRow: {
    ...globalStyles.commonRequestActionRow,
  },
  buttonPickerRow: {
    marginBottom: theme.spacing.xs,
  },
  buttonPickerRowCompact: {
    flexGrow: 0,
  },
  unitInputShell: {
    ...globalStyles.itemInfo,
  },
  unitPickerShell: {
    width: 96,
  },
  pickerGlowShell: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.effects.gold78,
    shadowColor: theme.colors.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 3,
    overflow: 'hidden',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  timePickerShell: {
    flex: 1,
    minWidth: 92,
  },
  timeSeparator: {
    color: theme.colors.primary,
    fontSize: theme.fonts.lg,
    fontWeight: '700',
  },
  listContainerCard: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderListCard,
    backgroundColor: theme.colors.backgroundListCardAlt,
    padding: theme.spacing.sm,
  },
});