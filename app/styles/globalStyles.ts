import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  containerAlt: {
    flex: 1,
    backgroundColor: theme.colors.backgroundAlt,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 0,
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  centeredSection: {
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
  dangerSection: {
    marginTop: theme.spacing.xxxl,
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
    color: theme.colors.danger,
    marginBottom: theme.spacing.lg,
  },

  // Form elements
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.small,
  },
  formContainerAlt: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.small,
  },
  inputGroup: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.fonts.md,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    fontSize: theme.fonts.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  inputAlt: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    fontSize: theme.fonts.md,
    backgroundColor: theme.colors.backgroundAlt,
    color: theme.colors.textAlt,
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  outlineButtonText: {
    fontSize: theme.fonts.md,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  outlineButtonGold: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  outlineButtonGoldText: {
    fontSize: theme.fonts.md,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: '#2D2D2D',
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
    borderColor: theme.colors.danger,
  },
  dangerButtonText: {
    fontSize: theme.fonts.md,
    color: theme.colors.danger,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  deleteButtonText: {
    fontSize: theme.fonts.md,
    color: theme.colors.danger,
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
  mutedText: {
    fontSize: theme.fonts.xs,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  largeBoldText: {
    fontSize: theme.fonts.xxxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  titleText: {
    fontSize: theme.fonts.title,
    fontWeight: 'bold',
    color: theme.colors.primaryAlt,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
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
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: theme.spacing.xl,
  },

  // Icons
  pencilIcon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
  },
  settingsIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.dangerLight,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    backgroundColor: theme.colors.danger,
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

  // Bottom bar styles
  tabBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 30,
    height: 30,
    tintColor: theme.colors.primary,
  },
});