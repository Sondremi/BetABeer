import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
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

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('Feil', 'Brukernavn er påkrevd');
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('Feil', 'Passord er påkrevd');
      return false;
    }

    if (!isLoginMode) {
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

      // Enkel e-post validering
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        Alert.alert('Feil', 'Ugyldig e-postadresse');
        return false;
      }
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // TODO: Replace with actual database call
      // const user = await loginUser(formData.username, formData.password);

      // Simuler database kall
      setTimeout(() => {
        const mockUser = {
          id: '1',
          username: formData.username,
          name: formData.name || 'Test User',
          email: formData.email || 'test@example.com',
          phone: formData.phone || '+47 123 45 678',
        };

        setIsLoading(false);
        onLoginSuccess(mockUser);
      }, 1000);

    } catch (error) {
      setIsLoading(false);
      Alert.alert('Feil', 'Innlogging feilet. Sjekk brukernavn og passord.');
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // TODO: Replace with actual database call
      // const user = await createUser(formData);

      // Simuler database kall
      setTimeout(() => {
        const newUser = {
          id: Date.now().toString(),
          username: formData.username,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        };

        setIsLoading(false);
        Alert.alert('Suksess', 'Bruker opprettet! Du er nå logget inn.');
        onLoginSuccess(newUser);
      }, 1000);

    } catch (error) {
      setIsLoading(false);
      Alert.alert('Feil', 'Kunne ikke opprette bruker. Prøv igjen.');
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brukernavn</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              placeholder="Skriv inn brukernavn"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#FFD700"
              selectionColor="#FFD700"
            />
          </View>

          {!isLoginMode && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Navn</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Skriv inn fullt navn"
                  placeholderTextColor="#FFD700"
                  selectionColor="#FFD700"
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
                  placeholderTextColor="#FFD700"
                  selectionColor="#FFD700"
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
                  placeholderTextColor="#FFD700"
                  selectionColor="#FFD700"
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
              placeholderTextColor="#FFD700"
              selectionColor="#FFD700"
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
                placeholderTextColor="#FFD700"
                selectionColor="#FFD700"
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