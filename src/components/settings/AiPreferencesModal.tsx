import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { SettingsRepository } from '../../db/repository';
import { useTheme } from '../../theme/ThemeContext';

interface AiPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  isAiEnabled: boolean;
  setAiEnabled: (val: boolean) => void;
  onSave: (apiKey: string) => void;
}

export const AiPreferencesModal: React.FC<AiPreferencesModalProps> = ({
  visible,
  onClose,
  isAiEnabled,
  setAiEnabled,
  onSave,
}) => {
  const { colors } = useTheme();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  useEffect(() => {
    async function loadKey() {
      try {
        let storedKey: string | null = null;
        try {
          storedKey = await SecureStore.getItemAsync('grok_api_key');
        } catch {}
        if (!storedKey) {
          storedKey = SettingsRepository.getSetting('ai_api_key_backup', '');
        }
        if (storedKey) {
          setApiKeyInput(storedKey);
        }
      } catch {}
    }
    if (visible) {
      loadKey();
    }
  }, [visible]);

  const handleSave = () => {
    onSave(apiKeyInput);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="sparkles" size={20} color="#A855F7" style={{ marginRight: 8 }} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>FinBot Preferences</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.aiToggleRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Enable FinBot</Text>
              <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
                Activates smart financial assistant
              </Text>
            </View>
            <Switch
              value={isAiEnabled}
              onValueChange={setAiEnabled}
              trackColor={{ false: colors.border, true: '#A855F7' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 16 }]}>
            API Key (Encrypted via SecureStore)
          </Text>
          <View style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}>
            <TextInput
              style={[styles.modalInput, { color: colors.text, flex: 1 }]}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="Enter your API key"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!isKeyVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setIsKeyVisible(!isKeyVisible)}>
              <Ionicons
                name={isKeyVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.aiHelperText, { color: colors.textMuted }]}>
            Your API key is stored encrypted exclusively on your device.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Linking.openURL('https://console.groq.com/keys')}
            style={styles.apiKeyLinkBtn}
          >
            <Ionicons name="open-outline" size={16} color="#A855F7" style={{ marginRight: 6 }} />
            <Text style={styles.apiKeyLinkText}>Get your free API key &gt;</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: '#A855F7' }]}
          >
            <Text style={styles.saveBtnText}>Save Preferences</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  aiToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuSub: {
    fontSize: 12,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputBox: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  modalInput: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiHelperText: {
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },
  apiKeyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  apiKeyLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A855F7',
  },
  saveBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
