import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authService } from '../services/firebase/authService';

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    email: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = async () => {
    if (isLoginMode) {
      if (!formData.email.trim()) {
        Alert.alert('Feil', 'E-postadresse er påkrevd');
        return false;
      }
      if (!formData.password.trim()) {
        Alert.alert('Feil', 'Passord er påkrevd');
        return false;
      }
      return true;
    }

    if (!formData.username.trim()) {
      Alert.alert('Feil', 'Brukernavn er påkrevd');
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('Feil', 'Passord er påkrevd');
      return false;
    }

    if (!formData.name.trim()) {
      Alert.alert('Feil', 'Navn er påkrevd');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert('Feil', 'E-postadresse er påkrevd');
      return false;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Feil', 'Telefonnummer er påkrevd');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Feil', 'Passordene stemmer ikke overens');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Feil', 'Passordet må være minst 6 tegn');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Feil', 'Ugyldig e-postadresse');
      return false;
    }

    try {
      const usernameExists = await authService.checkUsernameExists(formData.username);
      if (usernameExists) {
        Alert.alert('Feil', 'Brukernavnet er allerede tatt');
        return false;
      }
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke validere brukernavn');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!formData.email.trim()) {
      Alert.alert('Feil', 'E-postadresse er påkrevd');
      return;
    }

    if (!formData.password.trim()) {
      Alert.alert('Feil', 'Passord er påkrevd');
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
      Alert.alert('Innlogging feilet', errorMessage);
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
      Alert.alert('Registrering feilet', errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      phone: '',
      email: '',
      confirmPassword: '',
    });
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    resetForm();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          !isLoginMode && { paddingTop: 80 }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>BetABeer</Text>
          <Text style={styles.welcomeText}>
            {isLoginMode ? 'Velkommen tilbake!' : 'Opprett ny bruker'}
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          {isLoginMode ? (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-postadresse</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Skriv inn e-postadresse"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Brukernavn</Text>
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text })}
                  placeholder="Skriv inn brukernavn"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Navn</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Skriv inn fullt navn"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-postadresse</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Skriv inn e-postadresse"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefonnummer</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Skriv inn telefonnummer"
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Passord</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Skriv inn passord"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="oneTimeCode"
            />
          </View>

          {!isLoginMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bekreft passord</Text>
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholder="Bekreft passord"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
              />
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.actionButton, isLoading && styles.disabledButton]}
            onPress={isLoginMode ? handleLogin : handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>
              {isLoading
                ? 'Venter...'
                : isLoginMode
                  ? 'Logg inn'
                  : 'Opprett bruker'
              }
            </Text>
          </TouchableOpacity>

          {/* Toggle Mode */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLoginMode
                ? 'Har du ikke en bruker?'
                : 'Har du allerede en bruker?'
              }
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleLink}>
                {isLoginMode ? 'Opprett ny bruker' : 'Logg inn her'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818', // Dark background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFC857', // Gold/amber
    marginBottom: 10,
    letterSpacing: 1,
  },
  welcomeText: {
    fontSize: 18,
    color: '#F3F3F3', // Light text
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#232323', // Slightly lighter dark
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFC857', // Gold/amber
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FFC857', // Gold border
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#181818', // Match background
    color: '#F3F3F3', // Light text
  },
  actionButton: {
    backgroundColor: '#FFC857', // Gold/amber
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#FFC857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#181818', // Dark text on gold
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  toggleText: {
    fontSize: 14,
    color: '#F3F3F3', // Light text
    marginBottom: 5,
  },
  toggleLink: {
    fontSize: 14,
    color: '#FFC857', // Gold/amber
    fontWeight: '700',
  },
});

export default LoginScreen;