import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { globalStyles } from '../globalStyles';

export const profileStyles = StyleSheet.create({
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.lg,
  },
  headerButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.circle,
    backgroundColor: theme.colors.surface,
  },
  profileImageContainer: {
    marginBottom: theme.spacing.xxxl,
    position: 'relative',
  },
  editProfileImageButton: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    padding: 2,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.profileButton,
  },
  groupsSection: {
    ...globalStyles.section,
  },
  groupsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  groupRow: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  groupItem: {
    ...globalStyles.card,
    width: '48%',
    height: 140,
  },
  groupName: {
    fontSize: theme.fonts.md,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: theme.fonts.xs,
    color: theme.colors.text,
    opacity: 0.9,
  },
  invitationBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitationBadgeText: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
});