import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, CURRENCIES } from '../../src/theme/ThemeContext';
import { useExpenses } from '../../src/context/ExpenseContext';
import { SettingsRepository } from '../../src/db/repository';

export default function ProfileScreen() {
  const { isDark, setThemeMode, currency, setCurrency, colors } = useTheme();
  const {
    userName,
    userHandle,
    userPhoto,
    updateUserProfile,
    clearPreviousMonthsData,
    resetAllData,
  } = useExpenses();

  const [editProfileModal, setEditProfileModal] = useState(false);
  const [currencyModal, setCurrencyModal] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [handleInput, setHandleInput] = useState(userHandle);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access your gallery is required to upload a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        updateUserProfile(userName, userHandle, selectedUri);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to pick image from gallery.');
    }
  };

  const handleSaveProfile = () => {
    const trimmedName = nameInput.trim();
    const trimmedHandle = handleInput.trim() || 'user';
    if (!trimmedName) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }

    updateUserProfile(trimmedName, trimmedHandle, userPhoto);
    setEditProfileModal(false);
  };

  const handleClearPrevious = () => {
    Alert.alert(
      'Clear Previous Months',
      'This will permanently delete all transactions before the current month. Transactions for this month will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            const count = clearPreviousMonthsData();
            Alert.alert('Success', `Removed ${count} transaction(s) from previous months.`);
          },
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all transactions and budgets. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            resetAllData();
            Alert.alert('Reset Complete', 'All transactions and budgets have been cleared.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePickImage}
            style={styles.avatarContainer}
          >
            {userPhoto ? (
              <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <Ionicons name="person" size={48} color="#388BFF" />
              </View>
            )}

            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.userNameText, { color: colors.text }]}>{userName}</Text>
          <Text style={[styles.userHandleText, { color: colors.textSecondary }]}>
            @{userHandle}
          </Text>
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>SETTINGS</Text>

        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              setNameInput(userName);
              setHandleInput(userHandle);
              setEditProfileModal(true);
            }}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(0, 102, 255, 0.15)' }]}>
                <Ionicons name="person-outline" size={20} color="#388BFF" />
              </View>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Personal Info</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setCurrencyModal(true)}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                <Ionicons name="cash-outline" size={20} color="#EAB308" />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Currency</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
                  {currency.name}
                </Text>
              </View>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.currencySymbolText}>{currency.symbol}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(56, 139, 255, 0.15)' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color="#388BFF" />
              </View>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(val) => setThemeMode(val ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: '#0066FF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>DATA MANAGEMENT</Text>

        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleClearPrevious}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(0, 102, 255, 0.15)' }]}>
                <Ionicons name="calendar-outline" size={20} color="#388BFF" />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Clear Previous Months
                </Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
                  Keep only this month's data
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleResetData}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Reset All Data</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
                  Clear all transactions &amp; budgets
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={editProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditProfileModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickImage}
              style={[styles.modalPhotoBtn, { backgroundColor: colors.primaryGlow }]}
            >
              <Ionicons name="image-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.modalPhotoText, { color: colors.primary }]}>Choose Photo from Gallery</Text>
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Name</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 14 }]}>Handle</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                value={handleInput}
                onChangeText={setHandleInput}
                placeholder="username"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSaveProfile}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={currencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {CURRENCIES.map((c) => {
                const isSelected = currency.code === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => {
                      setCurrency(c);
                      SettingsRepository.setSetting('currency', c.code);
                      SettingsRepository.setSetting('currency_symbol', c.symbol);
                      setCurrencyModal(false);
                    }}
                    style={[
                      styles.currencyItem,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.surfaceElevated : colors.surface,
                      },
                    ]}
                  >
                    <Text style={[styles.currencyName, { color: isSelected ? colors.primary : colors.text }]}>
                      {c.name}
                    </Text>
                    <Text style={[styles.currencySymbol, { color: colors.primary }]}>{c.symbol}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 14,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 36,
    backgroundColor: '#121622',
    borderWidth: 2,
    borderColor: '#1E2536',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0066FF',
    borderWidth: 2,
    borderColor: '#07090E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userHandleText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: '#0F131D',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#192030',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbolText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#388BFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#161C2A',
    marginLeft: 70,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F131D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#1E2536',
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 102, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  modalPhotoText: {
    color: '#388BFF',
    fontSize: 14,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: '#121622',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2536',
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
  },
  modalInput: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: '#0066FF',
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#192030',
  },
  currencyItemActive: {
    backgroundColor: '#121622',
    borderColor: '#0066FF',
  },
  currencyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#388BFF',
  },
});
