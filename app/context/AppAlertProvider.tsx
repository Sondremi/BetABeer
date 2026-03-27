import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { theme } from '../styles/theme';
import { AlertButton, registerAlertPresenter } from '../utils/platformAlert';

type AlertItem = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

export const AppAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<AlertItem[]>([]);

  const currentAlert = useMemo(() => queue[0] ?? null, [queue]);

  useEffect(() => {
    registerAlertPresenter((params) => {
      setQueue((prev) => [...prev, params]);
    });

    return () => {
      registerAlertPresenter(null);
    };
  }, []);

  const closeCurrentAlert = () => {
    setQueue((prev) => prev.slice(1));
  };

  const handleButtonPress = (button?: AlertButton) => {
    closeCurrentAlert();

    // Let the closing animation start before running side effects.
    if (button?.onPress) {
      setTimeout(() => {
        button.onPress?.();
      }, 80);
    }
  };

  return (
    <>
      {children}
      <Modal
        visible={Boolean(currentAlert)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          const cancelButton = currentAlert?.buttons.find((button) => button.style === 'cancel');
          handleButtonPress(cancelButton || currentAlert?.buttons[0]);
        }}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.modalBackground,
            padding: theme.spacing.xl,
          }}
          onPress={() => {
            const cancelButton = currentAlert?.buttons.find((button) => button.style === 'cancel');
            if (cancelButton) {
              handleButtonPress(cancelButton);
            }
          }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 400,
              borderRadius: theme.borderRadius.lg,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              padding: theme.spacing.xl,
            }}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontSize: theme.fonts.lg,
                fontWeight: '700',
                marginBottom: theme.spacing.sm,
                textAlign: 'center',
              }}
            >
              {currentAlert?.title}
            </Text>

            {Boolean(currentAlert?.message) && (
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.fonts.md,
                  textAlign: 'center',
                  lineHeight: 22,
                  marginBottom: theme.spacing.lg,
                }}
              >
                {currentAlert?.message}
              </Text>
            )}

            <View style={{ gap: theme.spacing.sm }}>
              {(currentAlert?.buttons || []).map((button, index) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';

                return (
                  <Pressable
                    key={`${button.text}-${index}`}
                    onPress={() => handleButtonPress(button)}
                    style={{
                      borderRadius: theme.borderRadius.sm,
                      paddingVertical: theme.spacing.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDestructive
                        ? theme.colors.error
                        : isCancel
                          ? 'transparent'
                          : theme.colors.primary,
                      borderWidth: isCancel ? 1 : 0,
                      borderColor: isCancel ? theme.colors.textSecondary : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: theme.fonts.md,
                        fontWeight: '700',
                        color: isDestructive || isCancel
                          ? theme.colors.text
                          : theme.colors.background,
                      }}
                    >
                      {button.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
