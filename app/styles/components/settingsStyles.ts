import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const settingsStyles = StyleSheet.create({
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
  headerPlaceholder: {
    width: 40,
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
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: '#2D2D2D',
    borderRadius: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  halfWidthSaveButton: {
    flex: 1,
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
});