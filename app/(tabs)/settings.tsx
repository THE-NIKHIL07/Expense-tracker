import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../../src/theme/ThemeContext';
import { useExpenses } from '../../src/context/ExpenseContext';
import { SettingsRepository } from '../../src/db/repository';
import { CurrencyPickerModal } from '../../src/components/settings/CurrencyPickerModal';
import { AiPreferencesModal } from '../../src/components/settings/AiPreferencesModal';

export default function ProfileScreen() {
  const { isDark, setThemeMode, currency, setCurrency, colors } = useTheme();
  const {
    userName,
    userHandle,
    userPhoto,
    updateUserProfile,
    clearPreviousMonthsData,
    resetAllData,
    vacuumDatabase,
    isBiometricEnabled,
    setBiometricEnabled,
    isAiEnabled,
    setAiEnabled,
  } = useExpenses();

  const [editProfileModal, setEditProfileModal] = useState(false);
  const [currencyModal, setCurrencyModal] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [handleInput, setHandleInput] = useState(userHandle);

  const handleSaveAiSettings = async (keyToSave: string) => {
    try {
      const clean = keyToSave.trim();
      if (clean) {
        try {
          await SecureStore.setItemAsync('grok_api_key', clean);
        } catch {}
        SettingsRepository.setSetting('ai_api_key_backup', clean);
      } else {
        try {
          await SecureStore.deleteItemAsync('grok_api_key');
        } catch {}
        SettingsRepository.setSetting('ai_api_key_backup', '');
      }
      Alert.alert('Saved', 'FinBot preferences updated.');
    } catch {
      Alert.alert('Error', 'Failed to save API key securely.');
    }
  };

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



  const handleToggleBiometric = async (value: boolean) => {
    if (!value) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to Disable Lock',
          fallbackLabel: 'Use Device Pattern / PIN',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });
        if (result.success) {
          setBiometricEnabled(false);
          Alert.alert('Disabled', 'App lock disabled.');
        } else {
          Alert.alert('Verification Failed', 'Could not verify identity. Lock remains active.');
        }
      } catch {
        setBiometricEnabled(false);
      }
      return;
    }

    try {
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isEnrolled) {
        Alert.alert(
          'No Screen Lock Found',
          'Your smartphone does not have any lock enabled (no fingerprint, pattern, design lock, or PIN). Please set up a fingerprint or pattern lock in your phone settings first.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Phone Settings',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to Enable Lock',
        fallbackLabel: 'Use Device Pattern / PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setBiometricEnabled(true);
        Alert.alert('Lock Enabled', 'App is now secured with your device lock.');
      } else {
        Alert.alert('Verification Failed', 'Could not verify identity. Lock was not enabled.');
      }
    } catch {
      Alert.alert('Error', 'Failed to authenticate device lock.');
    }
  };

  const handleVacuumDatabase = () => {
    Alert.alert(
      'Optimize Database',
      'This executes SQLite WAL truncation and VACUUM to reclaim disk space on your phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Optimize Now',
          onPress: () => {
            vacuumDatabase();
            Alert.alert('Optimization Complete', 'Database defragmented and free storage reclaimed.');
          },
        },
      ]
    );
  };

  const handleClearPrevious = () => {
    Alert.alert(
      'Clear Previous Months',
      'This will permanently delete all transactions before the current month and clean old notifications to reclaim storage space.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            const count = clearPreviousMonthsData();
            Alert.alert('Success', `Cleaned ${count} transaction(s) and reclaimed storage space.`);
          },
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete EVERYTHING: all transactions, budgets, goals, payment dues, and notifications. Database storage will be completely cleaned and reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            resetAllData();
            Alert.alert('Reset Complete', 'All data has been wiped and storage cleaned.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Profile</Text>
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

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>PREFERENCES</Text>

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

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>SECURITY & INTELLIGENCE</Text>

        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isBiometricEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)' }]}>
                <Ionicons
                  name="finger-print"
                  size={20}
                  color={isBiometricEnabled ? '#10B981' : colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Biometric</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
                  {isBiometricEnabled ? 'Enabled' : 'Require biometric to open app'}
                </Text>
              </View>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: colors.border, true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setAiModal(true)}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Ionicons name="sparkles" size={20} color="#A855F7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>FinBot</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
                  {isAiEnabled ? 'Enabled' : 'Disabled (Requires API Key)'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>STORAGE & DATA MANAGEMENT</Text>

        <View
          style={[
            styles.storageCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.storageCardHeader}>
            <View style={[styles.storageIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="server-outline" size={24} color="#38BDF8" />
            </View>
            <View style={styles.storageInfoCol}>
              <Text style={[styles.storageTitle, { color: colors.text }]}>Database Optimization</Text>
              <Text style={[styles.storageHint, { color: colors.textSecondary }]}>
                Stored locally on your device. Never synced to cloud.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleVacuumDatabase}
              style={[styles.optimizeBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              <Ionicons name="sparkles" size={13} color="#38BDF8" style={{ marginRight: 5 }} />
              <Text style={[styles.optimizeBtnText, { color: '#38BDF8' }]}>Optimize</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 },
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
                  Keep only current month's data
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
                  Clear all transactions, budgets, goals & dues
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
        statusBarTranslucent
        onRequestClose={() => setEditProfileModal(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setEditProfileModal(false)}
          />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CurrencyPickerModal
        visible={currencyModal}
        onClose={() => setCurrencyModal(false)}
      />

      <AiPreferencesModal
        visible={aiModal}
        onClose={() => setAiModal(false)}
        isAiEnabled={isAiEnabled}
        setAiEnabled={setAiEnabled}
        onSave={handleSaveAiSettings}
      />
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
  storageCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  storageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  storageIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageInfoCol: {
    flex: 1,
  },
  storageTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  storageSizeText: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  offlineChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  storageDivider: {
    height: 1,
    marginVertical: 14,
  },
  storageActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  storageHint: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  optimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  optimizeBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
});
