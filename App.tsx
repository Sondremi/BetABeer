import React, { JSX } from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import ProfileScreen from './src/screens/ProfileScreen';

function App(): JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <ProfileScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
