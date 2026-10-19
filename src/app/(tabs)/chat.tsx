import { Colors } from '@/constants/colors';
import { showToast } from '@/context/ToastContext';
import { generateAiText } from '@/services/aiProviders';
import {
  CreateNewThread,
  getThread,
  LoadMessages,
  saveMessage,
} from '@/services/chatHistory';
import { loadLocalProfile } from '@/services/providerStorage';
import { ChatMessage } from '@/types';
import {
  Add01Icon,
  Mic01Icon,
  SentIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [isSending, setIsSending] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const { thread_id } = useLocalSearchParams();

  useEffect(() => {
    if (thread_id) {
      setThreadId(thread_id as string);
    }
  }, [thread_id]);

  const headerOffset = Platform.OS === 'ios' ? insets.top + 98 : 0;

  useEffect(() => {
    (async () => {
      const profile = await loadLocalProfile();
      setUserEmail(profile?.email || null);
    })();
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    if (!userEmail) return;
    if (!threadId) {
      void loadMainThread();
      return;
    }
    void getChatHistory();
  }, [threadId, userEmail]);

  const loadMainThread = async () => {
    let thread = await getThread('', userEmail || '');
    if (!thread) {
      thread = await CreateNewThread(userEmail || '', 'main', 'Main Chat');
    }
    setThreadId(thread.id);
  };

  const getChatHistory = async () => {
    if (!threadId) return;
    const history = await LoadMessages(threadId);
    const mapped = history.map((msg: any) => ({
      id: msg.id,
      sender: msg.role === 'user' ? 'user' : 'agent',
      text: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    })) as ChatMessage[];

    setMessages(mapped);
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => sub.remove();
  }, []);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !threadId) return;

    const currentEmail = userEmail || 'local@muse.ai';
    setIsSending(true);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    await saveMessage(currentEmail, threadId, 'user', text, {});

    const agentMessageId = `msg-${Date.now() + 1}`;

    setMessages((prev) => [
      ...prev,
      {
        id: agentMessageId,
        sender: 'agent',
        text: 'Thinking...',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);

    try {
      const providerMessages = [...messages, userMsg].map((message) => ({
        role: message.sender === 'agent' ? 'assistant' : 'user',
        content: message.text,
      })) as Array<{ role: 'assistant' | 'user'; content: string }>;

      const output = await generateAiText(providerMessages);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMessageId
            ? {
                ...msg,
                text: output || 'No response.',
              }
            : msg
        )
      );

      await saveMessage(
        currentEmail,
        threadId,
        'assistant',
        output || 'No response.',
        {}
      );
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send message';

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMessageId
            ? {
                ...msg,
                text: errorMessage,
              }
            : msg
        )
      );

      showToast(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerOffset}>
      <View style={styles.content}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.scrollInner}>
              <View style={styles.dateBadgeContainer}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>Today</Text>
                </View>
              </View>

              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <TouchableOpacity
                    key={msg.id}
                    activeOpacity={0.9}
                    onPress={() => showToast(msg.text)}
                    style={[
                      styles.messageRow,
                      isUser ? styles.userMessageRow : styles.agentMessageRow,
                    ]}>
                    <View
                      style={[
                        styles.bubble,
                        isUser ? styles.userBubble : styles.agentBubble,
                      ]}>
                      <Text
                        style={[
                          styles.bubbleText,
                          isUser ? styles.userBubbleText : styles.agentBubbleText,
                        ]}>
                        {msg.text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {isSending && (
                <Text
                  style={{
                    fontStyle: 'italic',
                    color: Colors.iconMuted,
                    textAlign: 'left',
                    marginTop: 8,
                  }}>
                  <ActivityIndicator /> AI is typing...
                </Text>
              )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>

        <View style={styles.inputWrapper}>
          <View style={styles.inputBar}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => showToast('Attach file')}
              activeOpacity={0.7}>
              <HugeiconsIcon
                icon={Add01Icon}
                size={20}
                color={Colors.iconDark}
                strokeWidth={2.2}
              />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              placeholder="Ask Cooper anything..."
              placeholderTextColor={Colors.iconMuted}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />

            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                style={[styles.circleBtn, styles.sendBtn]}
                onPress={handleSend}
                activeOpacity={0.8}>
                <HugeiconsIcon
                  icon={SentIcon}
                  size={18}
                  color={Colors.white}
                  strokeWidth={2.4}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => showToast('Voice input')}
                activeOpacity={0.7}>
                <HugeiconsIcon
                  icon={Mic01Icon}
                  size={20}
                  color={Colors.iconDark}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  scrollInner: {
    flexGrow: 1,
  },
  dateBadgeContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  dateBadge: {
    backgroundColor: Colors.dateBadgeBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dateBadgeText,
  },
  messageRow: {
    marginBottom: 12,
    width: '100%',
    flexDirection: 'row',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  agentMessageRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: Colors.chatBubbleUser,
    borderBottomRightRadius: 6,
  },
  agentBubble: {
    backgroundColor: Colors.chatBubbleAi,
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 15.5,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  userBubbleText: {
    color: Colors.chatBubbleUserText,
    fontWeight: '500',
  },
  agentBubbleText: {
    color: Colors.iconDark,
    fontWeight: '400',
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    paddingTop: 6,
    backgroundColor: Colors.white,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBarBg,
    borderRadius: 26,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.inputBarBorder,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    backgroundColor: Colors.iconDark,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: Colors.iconDark,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
});
