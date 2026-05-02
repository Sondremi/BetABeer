import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { settingsStyles } from '../../../styles/components/settingsStyles';
import { globalStyles } from '../../../styles/globalStyles';

type DeleteAccountSectionProps = {
  isLoading: boolean;
  onDeleteAccount: () => void;
};

const DeleteAccountSection = ({ isLoading, onDeleteAccount }: DeleteAccountSectionProps) => {
  return (
    <View style={[globalStyles.premiumCard, globalStyles.sectionCard, globalStyles.betSpacing]}>
      <Text style={globalStyles.dangerSectionTitle}>Slett bruker</Text>
      <Text style={[globalStyles.mutedText, settingsStyles.dangerHelperText]}>
        Sletting av bruker vil permanent fjerne all data knyttet til brukeren din. Dette kan ikke angres.
      </Text>
      <TouchableOpacity
        style={[globalStyles.dangerButton, isLoading && globalStyles.disabledButton]}
        onPress={onDeleteAccount}
        disabled={isLoading}
      >
        <Text style={globalStyles.dangerButtonText}>Slett bruker permanent</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DeleteAccountSection;
