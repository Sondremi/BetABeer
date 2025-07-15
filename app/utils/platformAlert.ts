// utils/platformAlert.ts
import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  if (Platform.OS === 'web') {
    // For web, bruk window.alert eller window.confirm
    if (buttons && buttons.length > 1) {
      // Hvis det er flere knapper, bruk confirm
      const confirmText = buttons.find(b => b.style !== 'cancel')?.text || 'OK';
      const cancelText = buttons.find(b => b.style === 'cancel')?.text || 'Avbryt';
      
      const result = window.confirm(`${title}\n\n${message || ''}\n\nTrykk OK for "${confirmText}" eller Avbryt for "${cancelText}"`);
      
      if (result) {
        const confirmButton = buttons.find(b => b.style !== 'cancel');
        if (confirmButton?.onPress) {
          confirmButton.onPress();
        }
      } else {
        const cancelButton = buttons.find(b => b.style === 'cancel');
        if (cancelButton?.onPress) {
          cancelButton.onPress();
        }
      }
    } else {
      // Enkel alert
      window.alert(`${title}\n\n${message || ''}`);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    // For mobile, bruk vanlig Alert
    Alert.alert(title, message, buttons);
  }
};