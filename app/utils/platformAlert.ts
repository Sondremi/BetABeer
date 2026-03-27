import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

type AlertPresenter = (params: {
  title: string;
  message?: string;
  buttons: AlertButton[];
}) => void;

let customAlertPresenter: AlertPresenter | null = null;

export const registerAlertPresenter = (presenter: AlertPresenter | null) => {
  customAlertPresenter = presenter;
};

export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  const resolvedButtons = buttons && buttons.length > 0
    ? buttons
    : [{ text: 'OK' }];

  if (customAlertPresenter) {
    customAlertPresenter({
      title,
      message,
      buttons: resolvedButtons,
    });
    return;
  }

  if (Platform.OS === 'web') {
    if (resolvedButtons.length > 1) {
      const confirmText = resolvedButtons.find((b) => b.style !== 'cancel')?.text || 'OK';
      const cancelText = resolvedButtons.find((b) => b.style === 'cancel')?.text || 'Avbryt';
      
      const result = window.confirm(`${title}\n\n${message || ''}\n\nTrykk OK for "${confirmText}" eller Avbryt for "${cancelText}"`);
      
      if (result) {
        const confirmButton = resolvedButtons.find((b) => b.style !== 'cancel');
        if (confirmButton?.onPress) {
          confirmButton.onPress();
        }
      } else {
        const cancelButton = resolvedButtons.find((b) => b.style === 'cancel');
        if (cancelButton?.onPress) {
          cancelButton.onPress();
        }
      }
    } else {
      window.alert(`${title}\n\n${message || ''}`);
      if (resolvedButtons[0]?.onPress) {
        resolvedButtons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, resolvedButtons);
  }
};