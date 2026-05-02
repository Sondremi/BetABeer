import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { settingsStyles } from '../../../styles/components/settingsStyles';
import { globalStyles } from '../../../styles/globalStyles';

type PasswordResetSectionProps = {
  isLoading: boolean;
  isSendingPasswordReset: boolean;
  onSendPasswordReset: () => void;
};

const PasswordResetSection = ({
  isLoading,
  isSendingPasswordReset,
  onSendPasswordReset,
}: PasswordResetSectionProps) => {
  return (
    <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
      <Text style={globalStyles.sectionTitle}>Passord</Text>
      <Text style={[globalStyles.mutedText, settingsStyles.dangerHelperText, globalStyles.cancelButtonTextModal]}>
        Send e-post for å tilbakestille passordet ditt.
      </Text>
      <TouchableOpacity
        style={[globalStyles.outlineButton, (isLoading || isSendingPasswordReset) && globalStyles.disabledButton]}
        onPress={onSendPasswordReset}
        disabled={isLoading || isSendingPasswordReset}
      >
        <Text style={globalStyles.outlineButtonGoldText}>
          {isSendingPasswordReset ? 'Sender...' : 'Tilbakestill passord'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PasswordResetSection;
