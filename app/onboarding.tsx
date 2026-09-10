import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext';
import { SettingsRepository } from '../src/db/repository';

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [nameOrId, setNameOrId] = useState('');

  const handleContinue = () => {
    const trimmed = nameOrId.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter your name or user ID to continue.');
      return;
    }

    SettingsRepository.setSetting('user_name', trimmed);
    SettingsRepository.setSetting('user_id', trimmed.toLowerCase().replace(/\s+/g, '_'));
    SettingsRepository.setSetting('onboarding_completed', 'true');

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.topSection}>
          <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="wallet" size={42} color={colors.primaryLight} />
          </View>

          <View style={styles.badge}>
            <View style={styles.pulseDot} />
            <Text style={styles.badgeText}>Offline-First Finance</Text>
          </View>

          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Welcome to Sleek Expense
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track your daily expenses, monthly budgets, and financial habits completely offline. No accounts or cloud sync required.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            What should we call you?
          </Text>
          <Text style={[styles.inputHelper, { color: colors.textMuted }]}>
            Enter your Name or unique User ID
          </Text>

          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={20} color={colors.primaryLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. Nikhil or nikhil_99"
              placeholderTextColor={colors.textMuted}
              value={nameOrId}
              onChangeText={setNameOrId}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          <View style={styles.photoTipRow}>
            <Ionicons name="image-outline" size={16} color={colors.accent} />
            <Text style={[styles.photoTipText, { color: colors.textMuted }]}>
              You can add your profile photo anytime later in Settings.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleContinue}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D2FF',
  },
  badgeText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  inputHelper: {
    fontSize: 13,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  photoTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  photoTipText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
