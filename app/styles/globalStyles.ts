import { StyleSheet } from 'react-native';
import { theme } from './theme';

const outlineButtonBase = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingVertical: theme.spacing.lg,
  paddingHorizontal: theme.spacing.xl,
  backgroundColor: theme.colors.surface,
  borderRadius: theme.borderRadius.md,
  borderWidth: 2,
  borderColor: theme.colors.primary,
  marginBottom: theme.spacing.md,
};

export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    display: 'flex',
  },
  containerWeb: {
    flex: 1,
    backgroundColor: theme.colors.background,
    display: 'flex',
    alignSelf: 'center',
    width: '100%',
    minHeight: '100%',
    height: '100%',
    maxWidth: 500,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 0,
  },
  fullWidthScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  section: {
    width: '100%',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  centeredSection: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowSpread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: theme.spacing.xxs,
  },
  buttonRowNoGap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: theme.spacing.xs,
  },
  dangerSection: {
    marginTop: theme.spacing.xxl,
    paddingTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  headerContainer: {
    height: 200,
    position: 'relative',
    width: '100%',
  },
  headerInfo: {
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
  },
  contentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginHorizontal: 0,
  },
  premiumSectionCard: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderPremium,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
  },
  warmListPanel: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderWarm,
    backgroundColor: theme.colors.backgroundListCard,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  premiumCard: {
    backgroundColor: theme.colors.backgroundPanel,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderPremium,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  premiumCardInner: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.effects.gold12,
    padding: theme.spacing.xl,
  },
  listContainer: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 0,
  },
  sectionDivider: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 0,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemInfo: {
    flex: 1,
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
  emptyStateSubtext: {
    fontSize: theme.fonts.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },

  // Headers
  header: {
    paddingTop: theme.spacing.massive,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  headerCentered: {
    alignItems: 'center',
    marginBottom: theme.spacing.huge,
  },
  headerTitle: {
    fontSize: theme.fonts.xxxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  headerTitleMedium: {
    fontSize: theme.fonts.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  headerSideSlot: {
    width: 40,
  },
  iconBackButton: {
    width: theme.sizes.iconButton,
    height: theme.sizes.iconButton,
    borderRadius: theme.borderRadius.circle,
    backgroundColor: theme.colors.backgroundCard,
    borderWidth: 1,
    borderColor: theme.colors.borderHeroButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackButtonText: {
    fontSize: theme.fonts.xl,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  sectionToggleIconButton: {
    marginBottom: 0,
    marginTop: 0,
    minHeight: theme.fonts.xxl + theme.spacing.sm,
    minWidth: theme.fonts.xxl + theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  sectionToggleIconButtonText: {
    fontSize: theme.fonts.md,
    fontWeight: '700',
    lineHeight: theme.fonts.lg,
  },

  // Sections
  sectionTitle: {
    fontSize: theme.fonts.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xl,
  },
  sectionTitleLeft: {
    fontSize: theme.fonts.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 0,
    textAlign: 'left',
  },
  sectionDescription: {
    fontSize: theme.fonts.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  dangerSectionTitle: {
    fontSize: theme.fonts.lg,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: theme.spacing.lg,
  },

  // Form elements
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.small,
  },
  inputGroup: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.fonts.md,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  labelOnDark: {
    color: theme.colors.white,
    fontSize: theme.fonts.sm,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    fontSize: theme.fonts.md,
    backgroundColor: 'transparent',
    color: theme.colors.text,
  },
  inputShellDark: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundInput,
    borderWidth: 1,
    borderColor: theme.effects.white10,
  },
  inputShellFocusedGold: {
    borderColor: theme.effects.gold85,
    shadowColor: theme.colors.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    color: theme.colors.primary,
  },
  picker: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fonts.md,
    justifyContent: 'center',
  },
  pickerItem: {
    color: theme.colors.text,
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    fontSize: theme.fonts.md,
  },

  // Buttons
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  primaryButtonShadow: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.button,
  },
  primaryButtonText: {
    fontSize: theme.fonts.md,
    color: theme.colors.background,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  outlineButton: {
    ...outlineButtonBase,
  },
  outlineButtonText: {
    fontSize: theme.fonts.md,
    color: theme.colors.background,
    fontWeight: '600',
  },
  outlineButtonGold: {
    ...outlineButtonBase,
  },
  outlineButtonGoldText: {
    fontSize: theme.fonts.md,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.fonts.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: theme.fonts.md,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  saveButtonTextAlt: {
    fontSize: theme.fonts.md,
    color: theme.colors.background,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  dangerButtonText: {
    fontSize: theme.fonts.md,
    color: theme.colors.error,
    fontWeight: '600',
  },
  selectionButton: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectionButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectionButtonText: {
    color: theme.colors.text,
    fontSize: theme.fonts.sm,
    fontWeight: '500',
  },
  selectionButtonTextSelected: {
    color: theme.colors.background,
  },
  addOptionText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: theme.fonts.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  iconActionButtonSm: {
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

  // Items/Cards
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  card: {
    borderRadius: theme.spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },

  // Text styles
  primaryText: {
    fontSize: theme.fonts.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  secondaryText: {
    fontSize: theme.fonts.sm,
    color: theme.colors.textSecondary,
  },
  accentText: {
    fontSize: theme.fonts.sm,
    color: theme.colors.primary,
  },
  primaryColorText: {
    color: theme.colors.primary,
  },
  mutedText: {
    fontSize: theme.fonts.xs,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  validationHelperText: {
    color: theme.colors.errorLight,
    fontSize: theme.fonts.xs,
    marginTop: theme.spacing.xs,
  },
  disabledActionText: {
    color: theme.colors.textMuted,
  },
  largeBoldText: {
    fontSize: theme.fonts.xxxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  titleText: {
    fontSize: theme.fonts.title,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  disabledGoldActionText: {
    color: theme.colors.primarySoft,
    opacity: 0.55,
  },

  // Images
  circularImage: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.circle,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  groupHeaderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.modalBackground,
    padding: theme.spacing.xl,
  },

  // Icons
  primaryIcon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.errorLight,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.modalBackground,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.fonts.lg,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.md,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: theme.fonts.md,
    fontWeight: '600',
  },
  defaultButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonModal: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
  },
  destructiveButtonModal: {
    backgroundColor: theme.colors.error,
  },
  defaultButtonText: {
    color: theme.colors.background,
  },
  cancelButtonTextModal: {
    color: theme.colors.textSecondary,
  },
  destructiveButtonTextModal: {
    color: theme.colors.background,
  },

  compactSection: {
    paddingBottom: theme.spacing.lg,
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
  actionButton: {
    marginBottom: 0,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm + theme.spacing.xxxs,
        alignSelf: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.sm,
  },
  actionButtonText: {
    fontSize: theme.fonts.xs,
        fontWeight: '600',
        lineHeight: theme.fonts.md,
  },
  actionButtonDanger: {
    borderColor: theme.colors.error,
  },
  actionButtonDangerText: {
    color: theme.colors.error,
  },
  friendSpacing: {
    marginBottom: theme.spacing.md,
  },
  searchInputShell: {
    flex: 1,
        marginRight: theme.spacing.sm,
  },
  requestActionRow: {
    flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
  },
  listScrollContent: {
    paddingBottom: theme.spacing.xs,
  },
  groupHeaderActions: {
    flexDirection: 'row',
        alignItems: 'center',
  },
  groupActionIconButton: {
    marginLeft: theme.spacing.sm,
  },
  groupBackControlText: {
    fontSize: theme.fonts.sm,
        fontWeight: '700',
  },
  betSelectionHintText: {
    marginTop: theme.spacing.xs,
  },
  actionGridButtonText: {
    fontSize: theme.fonts.sm,
  },
  distributionChoiceButtonActive: {
    backgroundColor: theme.effects.gold12,
        borderColor: theme.colors.primary,
  },
  distributionChoiceBlock: {
    marginBottom: theme.spacing.sm,
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
  detailedMemberSubtext: {
    fontSize: theme.fonts.xs,
        color: theme.colors.textSecondary,
  },
  betOptionsScrollWrap: {
    maxHeight: theme.sizes.maxListHeightMd,
  },
  modalFooter: {
    marginTop: theme.spacing.md,
  },
  leaderboardListWrap: {
    paddingBottom: theme.spacing.md,
  },
  leaderboardStatsRow: {
    flexDirection: 'row',
        justifyContent: 'space-between',
  },
  leaderboardStatColumn: {
    alignItems: 'center',
        flex: 1,
  },
  podiumCardSecondOffset: {
    marginRight: theme.spacing.sm,
  },
  betSpacing: {
    marginBottom: theme.spacing.lg,
  },
  bacQuickAddButton: {
    marginTop: theme.spacing.sm,
        marginBottom: 0,
  },
  createGroupInput: {
    borderWidth: 0,
        backgroundColor: 'transparent',
  },
  onboardingTextScroll: {
    maxHeight: '100%',
  },
  profileUploadPreviewImage: {
    width: theme.sizes.avatarXl,
        height: theme.sizes.avatarXl,
        borderRadius: theme.sizes.avatarXl / 2,
  },
});
