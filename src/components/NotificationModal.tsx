import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification } from '../db/schema';
import { useTheme } from '../theme/ThemeContext';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  notifications,
  onMarkAllAsRead,
}) => {
  const { colors } = useTheme();

  const getIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return { name: 'flag', color: '#388BFF' };
      case 'budget':
        return { name: 'alert-circle', color: '#F59E0B' };
      case 'statement':
        return { name: 'document-text', color: '#10B981' };
      case 'upi':
        return { name: 'flash', color: '#A855F7' };
      default:
        return { name: 'notifications', color: colors.primary };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="notifications-outline" size={22} color={colors.text} style={{ marginRight: 8 }} />
              <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
            </View>

            <View style={styles.headerRight}>
              {notifications.length > 0 && (
                <TouchableOpacity activeOpacity={0.8} onPress={onMarkAllAsRead} style={styles.markReadBtn}>
                  <Text style={[styles.markReadText, { color: colors.primary }]}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={{ marginLeft: 12 }}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No notifications yet</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Upcoming goal deadlines, budget alerts, and statements will appear here.
                </Text>
              </View>
            ) : (
              notifications.map((n) => {
                const icon = getIcon(n.type);
                const isUnread = n.read === 0;

                return (
                  <View
                    key={n.id}
                    style={[
                      styles.notifItem,
                      {
                        backgroundColor: isUnread ? colors.surfaceElevated : colors.surface,
                        borderColor: isUnread ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: `${icon.color}22` }]}>
                      <Ionicons name={icon.name as any} size={18} color={icon.color} />
                    </View>

                    <View style={styles.content}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                          {n.title}
                        </Text>
                        <Text style={[styles.dateText, { color: colors.textMuted }]}>{n.date}</Text>
                      </View>
                      <Text style={[styles.messageText, { color: colors.textSecondary }]}>{n.message}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 22,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  markReadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    marginLeft: 6,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
