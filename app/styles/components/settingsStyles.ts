import { StyleSheet } from 'react-native';
import { globalStyles } from '../globalStyles';
import { theme } from '../theme';

export const settingsScreenTokens = {
  inputPlaceholderTextColor: theme.colors.textMuted,
};

export const settingsStyles = StyleSheet.create({
  screenSection: {
    paddingBottom: theme.spacing.huge,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
  },
  deleteSectionCard: {
    ...globalStyles.commonBetSpacing,
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
  compactInput: {
    height: theme.sizes.iconButton,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.sm + theme.spacing.xxxs,
    paddingHorizontal: theme.spacing.md,
  },
  dangerHelperText: {
    color: theme.colors.errorLight,
    lineHeight: 20,
  },
  neutralHelperText: {
    ...globalStyles.cancelButtonTextModal,
  },
  emailVerificationStatus: {
    ...globalStyles.commonBetSelectionHintText,
  },
  emailVerifiedText: {
    ...globalStyles.primaryColorText,
  },
  emailNotVerifiedText: {
    color: theme.colors.errorLight,
  },
  emailVerificationButton: {
    ...globalStyles.commonBacQuickAddButton,
  },
});