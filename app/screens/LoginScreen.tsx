import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authService } from '../services/firebase/authService';
import { loginStyles } from '../styles/components/loginStyles';
import { globalStyles } from '../styles/globalStyles';
import { showAlert } from '../utils/platformAlert';
import { Gender } from '../types/userTypes';

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    phone: undefined as string | undefined,
    email: '',
    weight: undefined as number | undefined,
    gender: undefined as Gender | undefined,
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = async () => {
    if (isLoginMode) {
      if (!formData.email.trim()) {
        showAlert('Feil', 'E-postadresse er påkrevd');
        return false;
      }
      if (!formData.password.trim()) {
        showAlert('Feil', 'Passord er påkrevd');
        return false;
      }
      return true;
    }

    if (!formData.username.trim()) {
      showAlert('Feil', 'Brukernavn er påkrevd');
      return false;
    }

    if (!formData.password.trim()) {
      showAlert('Feil', 'Passord er påkrevd');
      return false;
    }

    if (!formData.name.trim()) {
      showAlert('Feil', 'Navn er påkrevd');
      return false;
    }

    if (!formData.email.trim()) {
      showAlert('Feil', 'E-postadresse er påkrevd');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlert('Feil', 'Passordene stemmer ikke overens');
      return false;
    }

    if (formData.password.length < 6) {
      showAlert('Feil', 'Passordet må være minst 6 tegn');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert('Feil', 'Ugyldig e-postadresse');
      return false;
    }

    if (formData.weight !== undefined && (isNaN(formData.weight) || formData.weight <= 0)) {
      showAlert('Feil', 'Vekt må være et positivt tall');
      return false;
    }

    try {
      const usernameExists = await authService.checkUsernameExists(formData.username);
      if (usernameExists) {
        showAlert('Feil', 'Brukernavnet er allerede tatt');
        return false;
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke opprette bruker. Prøv igjen senere.');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!formData.email.trim()) {
      showAlert('Feil', 'E-postadresse er påkrevd');
      return;
    }

    if (!formData.password.trim()) {
      showAlert('Feil', 'Passord er påkrevd');
      return;
    }

    setIsLoading(true);

    try {
      const user = await authService.loginUser(formData.email, formData.password);
      setIsLoading(false);
      router.replace('/(tabs)/profile');
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Noe gikk galt under innlogging.';
      showAlert('Innlogging feilet', errorMessage);
    }
  };

  const handleRegister = async () => {
    if (!(await validateForm())) return;

    setIsLoading(true);

    try {
      const user = await authService.createUser(formData);
      setIsLoading(false);
      router.replace('/(tabs)/profile');
    } catch (error) {
      setIsLoading(false);
      let errorMessage = 'Noe gikk galt under registrering.';
      if (error instanceof Error) {
        if (error.message.includes('email-already-in-use')) {
          errorMessage = 'E-postadressen er allerede i bruk';
        } else if (error.message.includes('weak-password')) {
          errorMessage = 'Passordet er for svakt';
        } else if (error.message.includes('invalid-email')) {
          errorMessage = 'Ugyldig e-postadresse';
        } else {
          errorMessage = error.message;
        }
      }
      showAlert('Registrering feilet', errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      phone: '',
      email: '',
      weight: undefined,
      gender: undefined,
      confirmPassword: '',
    });
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    resetForm();
  };

  return (
    <KeyboardAvoidingView
      style={[
        Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container,
        { padding: 0 }
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          globalStyles.scrollContent,
          !isLoginMode && { paddingTop: 80 }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Header */}
        <View style={globalStyles.headerCentered}>
          <Text style={loginStyles.appName}>BetABeer</Text>
          <Text style={loginStyles.welcomeText}>
            {isLoginMode ? 'Velkommen tilbake!' : 'Opprett ny bruker'}
          </Text>
        </View>

        {/* Login Form */}
        <View style={globalStyles.formContainer}>
          {isLoginMode ? (
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>E-postadresse</Text>
              <TextInput
                style={globalStyles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Skriv inn e-postadresse"
                placeholderTextColor="#E0E0E0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : (
            <>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Brukernavn</Text>
                <TextInput
                  style={globalStyles.input}
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text })}
                  placeholder="Skriv inn brukernavn"
                  placeholderTextColor="#E0E0E0"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Navn</Text>
                <TextInput
                  style={globalStyles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Skriv inn fullt navn"
                  placeholderTextColor="#E0E0E0"
                />
              </View>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>E-postadresse</Text>
                <TextInput
                  style={globalStyles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Skriv inn e-postadresse"
                  placeholderTextColor="#E0E0E0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Telefonnummer</Text>
                <TextInput
                  style={globalStyles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Skriv inn telefonnummer"
                  placeholderTextColor="#E0E0E0"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Vekt (kg)</Text>
                <TextInput
                  style={globalStyles.input}
                  value={formData.weight ? formData.weight.toString() : ''}
                  onChangeText={(text) => {
                    const value = text ? parseInt(text) : undefined;
                    if (value === undefined || !isNaN(value)) {
                      setFormData({ ...formData, weight: value });
                    }
                  }}
                  placeholder="Skriv inn vekt (valgfritt)"
                  placeholderTextColor="#E0E0E0"
                  keyboardType="numeric"
                />
              </View>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Kjønn</Text>
                <View style={[globalStyles.input, { paddingVertical: 0, justifyContent: 'center', height: 60 }]}>
                  <Picker
                    style={globalStyles.input}
                    selectedValue={formData.gender || ''}
                    onValueChange={(value: Gender | '') => setFormData({ ...formData, gender: value || undefined })}
                  >
                    <Picker.Item label="Velg kjønn (valgfritt)" value="" />
                    <Picker.Item label="Mann" value="male" />
                    <Picker.Item label="Kvinne" value="female" />
                  </Picker>
                </View>
              </View>
            </>
          )}

          <View style={globalStyles.inputGroup}>
            <Text style={globalStyles.label}>Passord</Text>
            <TextInput
              style={globalStyles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Skriv inn passord"
              placeholderTextColor="#E0E0E0"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="oneTimeCode"
            />
          </View>

          {!isLoginMode && (
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Bekreft passord</Text>
              <TextInput
                style={globalStyles.input}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholder="Bekreft passord"
                placeholderTextColor="#E0E0E0"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
              />
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={[globalStyles.primaryButtonShadow, isLoading && globalStyles.disabledButton]}
            onPress={isLoginMode ? handleLogin : handleRegister}
            disabled={isLoading}
          >
            <Text style={globalStyles.primaryButtonText}>
              {isLoading
                ? 'Venter...'
                : isLoginMode
                  ? 'Logg inn'
                  : 'Opprett bruker'
              }
            </Text>
          </TouchableOpacity>

          {/* Toggle Mode */}
          <View style={loginStyles.toggleContainer}>
            <Text style={loginStyles.toggleText}>
              {isLoginMode
                ? 'Har du ikke en bruker?'
                : 'Har du allerede en bruker?'
              }
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={loginStyles.toggleLink}>
                {isLoginMode ? 'Opprett ny bruker' : 'Logg inn her'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;