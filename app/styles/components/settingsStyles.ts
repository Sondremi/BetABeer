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
  editButtonsContainer: {
    width: '100%',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
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
  userInfoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactInput: {
    height: theme.sizes.iconButton,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.sm + theme.spacing.xxxs,
    paddingHorizontal: theme.spacing.md,
  },
  genderSelectRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  genderSelectButton: {
    flex: 1,
    marginRight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastInputGroup: {
    marginBottom: 0,
  },
  dangerHelperText: {
    color: theme.colors.errorLight,
    lineHeight: 20,
  },
  emailNotVerifiedText: {
    color: theme.colors.errorLight,
  },
});
