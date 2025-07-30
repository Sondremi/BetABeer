import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { globalStyles } from '../globalStyles';

export const groupStyles = StyleSheet.create({
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
  createBetSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  betTitle: {
    color: theme.colors.primary,
    fontSize: theme.fonts.lg,
    fontWeight: 'bold',
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
  }
});