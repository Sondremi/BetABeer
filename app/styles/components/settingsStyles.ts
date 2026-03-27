import { StyleSheet } from 'react-native';
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
    padding: theme.spacing.sm,
    borderRadius: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    minWidth: 40,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: theme.spacing.xl,
    color: theme.colors.background,
    fontWeight: 'bold',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  halfWidthCancelButton: {
    width: '50%',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  halfWidthSaveButton: {
    width: '50%',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    alignItems: 'center',
  },
  buttonRowNoGap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: theme.spacing.xs,
  },
  compactInput: {
    height: 40,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pickerItem: {
    color: theme.colors.text,
  },
  dangerHelperText: {
    color: theme.colors.errorLight,
    lineHeight: 20,
  },
});