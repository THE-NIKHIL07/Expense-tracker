import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '../db/schema';
import { useTheme } from '../theme/ThemeContext';
import { useExpenses } from '../context/ExpenseContext';
import { askFinancialChatbot } from '../utils/chatbotEngine';
import { ChatRepository } from '../db/repository';

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  isAiEnabled: boolean;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  text: 'Hi! I am FinBot, your personal finance assistant. Ask me anything about your expenses, budgets, or savings goals.',
  sender: 'bot',
  timestamp: Date.now(),
  isAi: false,
};

export const ChatbotModal: React.FC<ChatbotModalProps> = ({
  visible,
  onClose,
  onOpenSettings,
  isAiEnabled,
}) => {
  const { currency, colors } = useTheme();
  const { refreshData } = useExpenses();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleCopyMessage = async (msgId: string, textToCopy: string) => {
    try {
      const clean = textToCopy.replace(new RegExp('\\*\\*', 'g'), '').trim();
      await Clipboard.setStringAsync(clean);
      setCopiedId(msgId);
      setTimeout(() => {
        setCopiedId((prev) => (prev === msgId ? null : prev));
      }, 2000);
    } catch {}
  };

  const handleClearChat = () => {
    ChatRepository.clearChat();
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: `welcome_${Date.now()}`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleCloseModal = () => {
    onClose();
  };

  useEffect(() => {
    if (visible) {
      try {
        const saved = ChatRepository.getRecentMessages(10);
        if (saved && saved.length > 0) {
          setMessages([INITIAL_MESSAGE, ...saved]);
        } else {
          setMessages([INITIAL_MESSAGE]);
        }
      } catch {
        setMessages([INITIAL_MESSAGE]);
      }
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      text,
      sender: 'user',
      timestamp: Date.now(),
    };

    ChatRepository.addMessage(userMsg);
    setMessages((prev) => {
      const list = [...prev, userMsg];
      const conv = list.filter((m) => m.id !== 'welcome' && !m.id.startsWith('welcome_'));
      return [INITIAL_MESSAGE, ...conv.slice(-10)];
    });
    setInput('');
    setLoading(true);

    const botMsgId = `bot_${Date.now()}`;
    let botCreated = false;

    const historyForContext = [...messages, userMsg].slice(-10);

    try {
      const response = await askFinancialChatbot(
        text,
        currency.symbol,
        (_token, fullText) => {
          if (!botCreated) {
            botCreated = true;
            setLoading(false);
            setMessages((prev) => {
              const streamMsg: ChatMessage = {
                id: botMsgId,
                text: fullText,
                sender: 'bot',
                timestamp: Date.now(),
                isAi: true,
              };
              const list = [...prev, streamMsg];
              const conv = list.filter((m) => m.id !== 'welcome' && !m.id.startsWith('welcome_'));
              return [INITIAL_MESSAGE, ...conv.slice(-10)];
            });
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, text: fullText } : m))
            );
          }
        },
        historyForContext
      );

      const botFinalMsg: ChatMessage = {
        id: botMsgId,
        text: response.text,
        sender: 'bot',
        timestamp: Date.now(),
        isAi: response.isAi,
      };

      ChatRepository.addMessage(botFinalMsg);

      setMessages((prev) => {
        const mapped = !botCreated
          ? [...prev, botFinalMsg]
          : prev.map((m) => (m.id === botMsgId ? botFinalMsg : m));
        const conv = mapped.filter((m) => m.id !== 'welcome' && !m.id.startsWith('welcome_'));
        return [INITIAL_MESSAGE, ...conv.slice(-10)];
      });

      if (response.actionExecuted) {
        refreshData();
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        text: `Error: ${err?.message || 'Could not contact AI service. Check API key and internet.'}`,
        sender: 'bot',
        timestamp: Date.now(),
        isAi: false,
      };
      ChatRepository.addMessage(errMsg);
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTIONS = [
    'How much did I spend this week?',
    'Am I over budget?',
    'Give me tips to save money',
    'Roast my expenses',
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleCloseModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={styles.botAvatar}>
                <Ionicons name="sparkles" size={18} color="#A855F7" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>FinBot AI</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {!isAiEnabled && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onOpenSettings}
              style={[styles.aiNoticeCard, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}
            >
              <Ionicons name="key-outline" size={18} color="#F59E0B" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.aiNoticeText}>
                  FinBot is disabled. Tap here to enter your API key in Settings.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
            </TouchableOpacity>
          )}

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <View
                  key={m.id}
                  style={[
                    styles.bubbleWrapper,
                    isUser ? styles.userBubbleWrapper : styles.botBubbleWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    {(() => {
                      const textColor = isUser ? '#FFFFFF' : colors.text;
                      const lines = m.text.split('\n');
                      return lines.map((line, lineIdx) => {
                        let cleanLine = line.trim();
                        if (cleanLine.startsWith('#')) {
                          cleanLine = cleanLine.replace(new RegExp('^#+\\s*'), '');
                        } else if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ')) {
                          cleanLine = '• ' + cleanLine.slice(2);
                        }

                        const parts = cleanLine.split(new RegExp('(\\*{2}.*?\\*{2})', 'g'));
                        return (
                          <Text key={`line-${lineIdx}`} style={[styles.bubbleText, { color: textColor }]}>
                            {parts.map((part, partIdx) => {
                              if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                                return (
                                   <Text
                                    key={`part-${partIdx}`}
                                    style={{
                                      fontWeight: '800',
                                      color: isUser ? '#FFFFFF' : '#38BDF8',
                                    }}
                                  >
                                    {part.slice(2, -2)}
                                  </Text>
                                );
                              }
                              if (part.startsWith('**')) {
                                return (
                                  <Text
                                    key={`part-${partIdx}`}
                                    style={{
                                      fontWeight: '800',
                                      color: isUser ? '#FFFFFF' : '#38BDF8',
                                    }}
                                  >
                                    {part.slice(2)}
                                  </Text>
                                );
                              }
                              return part;
                            })}
                            {lineIdx < lines.length - 1 ? '\n' : ''}
                          </Text>
                        );
                      });
                    })()}
                    {!isUser && (
                      <View style={styles.botBubbleFooter}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleCopyMessage(m.id, m.text)}
                          style={[
                            styles.copyBtn,
                            {
                              backgroundColor: copiedId === m.id ? 'rgba(16, 185, 129, 0.15)' : colors.surfaceElevated,
                              borderColor: copiedId === m.id ? 'rgba(16, 185, 129, 0.3)' : colors.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name={copiedId === m.id ? 'checkmark' : 'copy-outline'}
                            size={12}
                            color={copiedId === m.id ? '#10B981' : colors.textMuted}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={[
                              styles.copyBtnText,
                              { color: copiedId === m.id ? '#10B981' : colors.textMuted },
                            ]}
                          >
                            {copiedId === m.id ? 'Copied' : 'Copy'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {loading && (
              <View style={[styles.bubbleWrapper, styles.botBubbleWrapper]}>
                <View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.suggestionsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {SUGGESTIONS.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => handleSend(s)}
                  style={[styles.chip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder="Ask FinBot anything..."
              placeholderTextColor={colors.textMuted}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSend()}
              disabled={!input.trim() || loading}
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() && !loading ? colors.primary : colors.surfaceElevated },
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={input.trim() && !loading ? '#FFFFFF' : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 6,
  },
  aiNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  aiNoticeText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 10,
  },
  bubbleWrapper: {
    marginVertical: 6,
    maxWidth: '82%',
  },
  userBubbleWrapper: {
    alignSelf: 'flex-end',
  },
  botBubbleWrapper: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botBubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  suggestionsRow: {
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    marginBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 15,
    paddingHorizontal: 12,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
