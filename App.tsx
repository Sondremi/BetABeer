import { Slot } from 'expo-router';
import { AuthProvider } from './app/context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}