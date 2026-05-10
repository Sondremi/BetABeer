import React from 'react';
import { Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { profileStyles } from '../../../styles/components/profileStyles';
import { globalStyles } from '../../../styles/globalStyles';

const isStandalone =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(display-mode: standalone)').matches;

type ProfileOnboardingModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onGoToSettings: () => void;
};

const ProfileOnboardingModal = ({
  visible,
  onDismiss,
  onGoToSettings,
}: ProfileOnboardingModalProps) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent
    onRequestClose={onDismiss}
  >
    <View style={globalStyles.modalContainer}>
      <View style={[globalStyles.modalContent, profileStyles.onboardingModalContent]}>
        <Text style={[globalStyles.modalTitle, globalStyles.primaryColorText]}>Velkommen til BetABeer</Text>
        <View style={profileStyles.onboardingTextBox}>
          <ScrollView
            contentContainerStyle={profileStyles.onboardingTextScrollContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            <Text style={[globalStyles.modalText, profileStyles.onboardingBodyText]}>
              BetABeer er en sosial drikkelek-app der du lager bets med venner og betaler med slurker, shots eller chugs.{"\n"}
              {"\n"}
              Slik kommer du i gang:{"\n"}
              1. Legg til venner og bli med i eller lag en gruppe med dem.{"\n"}
              2. Opprett bets på akkurat hva dere vil og bett på det du mener er riktig alternativ 🍺{"\n"}
              3. Følg live resultater og statistikk over hvem som vinner mest og drikker mest.
            </Text>

            {Platform.OS === 'web' && (
              <Text style={[globalStyles.modalText, profileStyles.onboardingBodyText, profileStyles.onboardingHomeScreenSection]}>
                {isStandalone
                  ? '✅ Du bruker allerede BetABeer som app – du er klar for push-varsler!'
                  : 'Legg til på hjemskjermen (iOS):\n1. Åpne BetABeer i Safari.\n2. Trykk Del-ikonet (firkant med pil opp).\n3. Velg «Legg til på Hjem-skjerm».\n4. Trykk «Legg til».\n\nNB: Push-varsler krever at appen er lagt til på hjemskjermen.'
                }
              </Text>
            )}
          </ScrollView>
        </View>
        <Text style={[globalStyles.modalText, profileStyles.onboardingInfoText]}>
          For å bruke promillekalkulatoren må du legge inn vekt og kjønn i innstillinger.
        </Text>
        <View style={globalStyles.buttonRow}>
          <TouchableOpacity style={globalStyles.cancelButton} onPress={onDismiss}>
            <Text style={globalStyles.cancelButtonText}>OK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={globalStyles.saveButton} onPress={onGoToSettings}>
            <Text style={globalStyles.saveButtonTextAlt}>Gå til innstillinger</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default ProfileOnboardingModal;
