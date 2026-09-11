import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Linking,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { SettingsRepository } from '../db/repository';

interface BiometricGuardProps {
  children: React.ReactNode;
}

export const BiometricGuard: React.FC<BiometricGuardProps> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(true);

  const checkAndAuthenticate = useCallback(async () => {
    try {
      const enabled = SettingsRepository.getSetting('biometric_enabled', 'false') === 'true';
      if (!enabled) {
        setIsLocked(false);
        return;
      }

      setIsLocked(true);
      setAuthFailed(false);

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsEnrolled(enrolled);

      if (!enrolled) {
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Expense Tracker',
        fallbackLabel: 'Use Device Pattern / PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
        setAuthFailed(false);
      } else {
        setAuthFailed(true);
      }
    } catch {
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    checkAndAuthenticate();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const enabled = SettingsRepository.getSetting('biometric_enabled', 'false') === 'true';
        if (enabled) {
          checkAndAuthenticate();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkAndAuthenticate]);

  if (isLocked) {
    return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={42} color="#10B981" />
        </View>

        <Text style={styles.title}>Expense Tracker Locked</Text>

        {!isEnrolled ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.subtitle}>
              No lock is set up on this phone. Please configure a fingerprint, pattern, or PIN in your device settings.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => Linking.openSettings()}
              style={[styles.unlockBtn, { backgroundColor: '#0066FF' }]}
            >
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.unlockBtnText}>Open Phone Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.subtitle}>
              {authFailed
                ? 'Authentication failed. Tap below to unlock.'
                : 'Unlock using your fingerprint or device pattern/PIN.'}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={checkAndAuthenticate}
              style={styles.unlockBtn}
            >
              <Ionicons name="lock-open-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.unlockBtnText}>Unlock App</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
    marginBottom: 28,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
