import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useRef } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { type AppNotification } from '../../../services/notificationService';
import { profileStyles } from '../../../styles/components/profileStyles';
import { globalStyles } from '../../../styles/globalStyles';

function relativeTime(timestamp: Timestamp): string {
  const diff = Date.now() - timestamp.toMillis();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Akkurat nå';
  if (min < 60) return `${min} min siden`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} t siden`;
  const days = Math.floor(hours / 24);
  return `${days} dag${days !== 1 ? 'er' : ''} siden`;
}

type NotificationsModalProps = {
  visible: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
};

const NotificationsModal = ({
  visible,
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsModalProps) => {
  const markAllTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      markAllTimerRef.current = setTimeout(onMarkAllAsRead, 1000);
    }
    return () => {
      if (markAllTimerRef.current) clearTimeout(markAllTimerRef.current);
    };
  }, [visible]);

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, profileStyles.notificationsModalContent]}>
          <View style={[globalStyles.rowSpread, { alignItems: 'center', marginBottom: 12 }]}>
            <Text style={globalStyles.modalTitle}>Varsler</Text>
            {hasUnread && (
              <TouchableOpacity onPress={onMarkAllAsRead}>
                <Text style={profileStyles.notificationsMarkAllText}>Merk alle som lest</Text>
              </TouchableOpacity>
            )}
          </View>

          {notifications.length === 0 ? (
            <Text style={[globalStyles.secondaryText, { textAlign: 'center', paddingVertical: 24 }]}>
              Ingen varsler ennå.
            </Text>
          ) : (
            <ScrollView style={profileStyles.notificationsScroll} showsVerticalScrollIndicator>
              {notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[profileStyles.notificationRow, !n.read && profileStyles.notificationRowUnread]}
                  onPress={() => { if (!n.read) onMarkAsRead(n.id); }}
                  activeOpacity={n.read ? 1 : 0.7}
                >
                  {!n.read && <View style={profileStyles.notificationUnreadDot} />}
                  <View style={{ flex: 1 }}>
                    <Text style={profileStyles.notificationMessage}>{n.message}</Text>
                    <Text style={profileStyles.notificationMeta}>
                      {n.groupName}
                      {n.createdAt ? ` • ${relativeTime(n.createdAt)}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={[globalStyles.cancelButton, { marginTop: 12 }]} onPress={onClose}>
            <Text style={globalStyles.cancelButtonText}>Lukk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default NotificationsModal;
