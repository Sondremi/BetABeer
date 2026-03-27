import { StyleSheet } from 'react-native';
import { globalStyles } from '../globalStyles';
import { theme } from '../theme';

export const settingsScreenTokens = {
  inputPlaceholderTextColor: theme.colors.textMuted,
};

export const settingsStyles = StyleSheet.create({
  pageContainer: {
    padding: 0,
  },
  screenSection: {
    paddingBottom: theme.spacing.huge,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
  },
  deleteSectionCard: {
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    ...globalStyles.iconBackButton,
  },
  backButtonText: {
    ...globalStyles.iconBackButtonText,
  },
  readOnlyText: {
    fontSize: theme.fonts.md,
    color: theme.colors.text,
  },
  loadingText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.md,
  },
  fullWidthButton: {
    ...globalStyles.outlineButtonGold,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  halfWidthCancelButton: {
    ...globalStyles.cancelButton,
    width: '50%',
  },
  halfWidthSaveButton: {
    ...globalStyles.saveButton,
    width: '50%',
  },
  buttonRowNoGap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: theme.spacing.xs,
  },
  compactInput: {
    height: theme.sizes.iconButton,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.sm + theme.spacing.xxxs,
    paddingHorizontal: theme.spacing.md,
  },
  pickerItem: {
    color: theme.colors.text,
  },
  dangerHelperText: {
    color: theme.colors.errorLight,
    lineHeight: 20,
  },
});