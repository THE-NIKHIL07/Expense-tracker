import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, CURRENCIES, CurrencyOption } from '../../theme/ThemeContext';
import { SettingsRepository } from '../../db/repository';

interface CurrencyPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({
  visible,
  onClose,
}) => {
  const { currency, setCurrency, colors } = useTheme();

  const handleSelect = (c: CurrencyOption) => {
    setCurrency(c);
    SettingsRepository.setSetting('currency', c.code);
    SettingsRepository.setSetting('currency_symbol', c.symbol);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 350 }}>
            {CURRENCIES.map((c) => {
              const isSelected = currency.code === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => handleSelect(c)}
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
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  currencyName: {
    fontSize: 14,
    fontWeight: '700',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '800',
  },
});
