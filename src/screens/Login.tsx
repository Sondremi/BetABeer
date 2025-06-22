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
    backgroundColor: '#fff',
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
    color: '#007AFF',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  toggleContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  toggleLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default LoginScreen;