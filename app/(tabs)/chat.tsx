import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import axios from 'axios';
import { useLanguageStore } from '../../store/languageStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Message {
  id: string;
  message: string;
  response?: string;
  timestamp: string;
  isUser: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);
  const [speaking, setSpeaking] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { language, setLanguage } = useLanguageStore();

  const translations = {
    en: {
      title: 'AI Assistant',
      subtitle: 'Ask me anything about farming',
      placeholder: 'Type your question...',
      send: 'Send',
      speak: 'Speak',
      changeLanguage: 'Change Language',
      examples: [
        'What is the ideal pH for rice?',
        'How to improve soil moisture?',
        'Best crops for this season?',
      ],
    },
    te: {
      title: 'AI సహాయకం',
      subtitle: 'వ్యవసాయం గురించి ఏదైనా అడగండి',
      placeholder: 'మీ ప్రశ్న టైప్ చేయండి...',
      send: 'పంపు',
      speak: 'మాట్లాడు',
      changeLanguage: 'భాష మార్చు',
      examples: [
        'వరికి అనువైన pH ఏమిటి?',
        'మట్టి తేమను ఎలా మెరుగుపరచాలి?',
        'ఈ కాలానికి ఉత్తమ పంటలు ఏవి?',
      ],
    },
    hi: {
      title: 'AI सहायक',
      subtitle: 'खेती के बारे में कुछ भी पूछें',
      placeholder: 'अपना प्रश्न टाइप करें...',
      send: 'भेजें',
      speak: 'बोलें',
      changeLanguage: 'भाषा बदलें',
      examples: [
        'चावल के लिए आदर्श pH क्या है?',
        'मिट्टी की नमी कैसे सुधारें?',
        'इस मौसम के लिए सबसे अच्छी फसलें?',
      ],
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    // Add welcome message
    addWelcomeMessage();
  }, [language]);

  const addWelcomeMessage = () => {
    const welcomeMessages = {
      en: "Hello! I'm KrishiMitra, your AI farming assistant. I can help you with soil health, crop selection, weather insights, and farming best practices. How can I assist you today?",
      te: "హలో! నేను కృషి మిత్ర, మీ AI వ్యవసాయ సహాయకం. నేల ఆరోగ్యం, పంట ఎంపిక, వాతావరణ సమాచారం మరియు వ్యవసాయ ఉత్తమ పద్ధతులతో నేను మీకు సహాయం చేయగలను. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
      hi: "नमस्ते! मैं कृषि मित्र हूं, आपका AI कृषि सहायक। मैं मिट्टी के स्वास्थ्य, फसल चयन, मौसम की जानकारी और खेती की सर्वोत्तम प्रथाओं में आपकी सहायता कर सकता हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?",
    };

    const welcomeMsg: Message = {
      id: 'welcome',
      message: '',
      response: welcomeMessages[language as keyof typeof welcomeMessages] || welcomeMessages.en,
      timestamp: new Date().toISOString(),
      isUser: false,
    };

    setMessages([welcomeMsg]);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      message: inputText,
      timestamp: new Date().toISOString(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        session_id: sessionId,
        message: inputText,
        language: language,
      });

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        message: inputText,
        response: response.data.response,
        timestamp: new Date().toISOString(),
        isUser: false,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string) => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      const languageCode = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
      
      Speech.speak(text, {
        language: languageCode,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => {
          setSpeaking(false);
          Alert.alert('Error', 'Text-to-speech failed');
        },
      });
    }
  };

  const handleExamplePress = (example: string) => {
    setInputText(example);
  };

  const cycleLanguage = () => {
    const languages: ('en' | 'te' | 'hi')[] = ['en', 'te', 'hi'];
    const currentIndex = languages.indexOf(language as any);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.languageButton} onPress={cycleLanguage}>
            <Ionicons name="language" size={24} color="#2D7A3E" />
            <Text style={styles.languageCode}>{language.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Example Questions */}
        {messages.length <= 1 && (
          <View style={styles.examplesContainer}>
            <Text style={styles.examplesTitle}>Try asking:</Text>
            {t.examples.map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleChip}
                onPress={() => handleExamplePress(example)}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View key={msg.id}>
              {msg.isUser ? (
                <View style={styles.userMessageContainer}>
                  <View style={styles.userMessage}>
                    <Text style={styles.userMessageText}>{msg.message}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.aiMessageContainer}>
                  <View style={styles.aiAvatar}>
                    <Text style={styles.aiAvatarText}>🌾</Text>
                  </View>
                  <View style={styles.aiMessage}>
                    <Text style={styles.aiMessageText}>{msg.response}</Text>
                    {msg.response && (
                      <TouchableOpacity
                        style={styles.speakButton}
                        onPress={() => speakText(msg.response!)}
                      >
                        <Ionicons
                          name={speaking ? 'stop-circle' : 'volume-high'}
                          size={20}
                          color="#2D7A3E"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2D7A3E" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons
              name="send"
              size={24}
              color={inputText.trim() ? '#FFFFFF' : '#CCCCCC'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D7A3E10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  languageCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D7A3E',
    marginLeft: 4,
  },
  examplesContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  exampleChip: {
    backgroundColor: '#F4A30010',
    borderWidth: 1,
    borderColor: '#F4A300',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#C44536',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userMessage: {
    backgroundColor: '#2D7A3E',
    borderRadius: 16,
    borderTopRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  userMessageText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  aiMessageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4A30020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiAvatarText: {
    fontSize: 20,
  },
  aiMessage: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  aiMessageText: {
    fontSize: 16,
    color: '#2C2C2C',
    lineHeight: 22,
  },
  speakButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2D7A3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
});