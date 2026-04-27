import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authService } from '../services/firebase/authService';
import { globalStyles } from '../styles/globalStyles';
import { INPUT_LIMITS, normalizeSingleLineText } from '../utils/inputValidation';
import { showAlert } from '../utils/platformAlert';

type GuestUpgradePromptProps = {
  backToGroupButtonLabel?: string;
  backToGroupRoute?: string;
  description: string;
  showBackToGroupButton?: boolean;
  title: string;
};

export const GuestUpgradePrompt: React.FC<GuestUpgradePromptProps> = ({
  title,
  description,
  showBackToGroupButton = false,
  backToGroupButtonLabel = 'Tilbake til gruppe',
  backToGroupRoute = '/groups',
}) => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const canSubmit = useMemo(() => {
    const name = normalizeSingleLineText(formData.name);
    const email = formData.email.trim();
    const password = formData.password;
    return (
      name.length > 0 &&
      name.length <= INPUT_LIMITS.profileNameMax &&
      email.length > 0 &&
      email.length <= INPUT_LIMITS.emailMax &&
      password.length >= INPUT_LIMITS.passwordMin &&
      password.length <= INPUT_LIMITS.passwordMax &&
      password === formData.confirmPassword
    );
  }, [formData]);

  const handleUpgrade = async () => {
    const name = normalizeSingleLineText(formData.name);
    const email = formData.email.trim();
    const password = formData.password;

    if (!canSubmit) {
      showAlert('Feil', 'Fyll ut alle felter korrekt før du oppretter bruker');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Feil', 'Ugyldig e-postadresse');
      return;
    }

    setSaving(true);
    try {
      await authService.upgradeGuestAccount({
        name,
        email,
        password,
      });
      setModalVisible(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      showAlert('Feil', 'Kunne ikke opprette bruker');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[globalStyles.section, { justifyContent: 'center', flex: 1 }]}>
        <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
          <Text style={globalStyles.sectionTitle}>{title}</Text>
          <Text style={globalStyles.sectionDescription}>{description}</Text>
          {showBackToGroupButton && (
            <TouchableOpacity style={[globalStyles.outlineButtonGold, { marginBottom: 10 }]} onPress={() => router.replace(backToGroupRoute as any)}>
              <Text style={globalStyles.outlineButtonGoldText}>{backToGroupButtonLabel}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={globalStyles.primaryButton} onPress={() => setModalVisible(true)}>
            <Text style={globalStyles.primaryButtonText}>Opprett bruker</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <ScrollView contentContainerStyle={globalStyles.fullWidthScrollContent} keyboardShouldPersistTaps="handled">
              <Text style={globalStyles.modalTitle}>Opprett bruker</Text>
              <Text style={globalStyles.secondaryText}>Fullfør kontoen for å låse opp alle funksjoner.</Text>

              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Navn</Text>
                <View style={globalStyles.inputShellDark}>
                  <TextInput
                    style={globalStyles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text.slice(0, INPUT_LIMITS.profileNameMax) }))}
                    placeholder="Navn"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>E-post</Text>
                <View style={globalStyles.inputShellDark}>
                  <TextInput
                    style={globalStyles.input}
                    value={formData.email}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text.slice(0, INPUT_LIMITS.emailMax) }))}
                    placeholder="E-postadresse"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Passord</Text>
                <View style={globalStyles.inputShellDark}>
                  <TextInput
                    style={globalStyles.input}
                    value={formData.password}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text.slice(0, INPUT_LIMITS.passwordMax) }))}
                    placeholder="Passord"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Bekreft passord</Text>
                <View style={globalStyles.inputShellDark}>
                  <TextInput
                    style={globalStyles.input}
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text.slice(0, INPUT_LIMITS.passwordMax) }))}
                    placeholder="Bekreft passord"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => setModalVisible(false)} disabled={saving}>
                <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpgrade} disabled={saving || !canSubmit}>
                <Text style={globalStyles.saveButtonText}>
                  {saving ? 'Oppretter...' : 'Opprett bruker'}
                </Text>
              </TouchableOpacity>
            </View>
            {saving && <ActivityIndicator style={{ marginTop: 10 }} />}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};
