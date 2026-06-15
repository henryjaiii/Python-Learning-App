import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Local proxy server config (Android emulator uses 10.0.2.2 to access localhost)
const PROXY_API_URL = 'http://10.0.2.2:3001/chat';

// Option A - Limited short responses
const SYSTEM_PROMPT_OPTION_A = `You are a friendly and helpful Python programming tutor for beginners. 

⚠️ IMPORTANT: Keep ALL responses SHORT and SIMPLE.

Rules:
- Maximum 2-3 sentences of explanation
- Provide ONLY ONE simple code example (3-5 lines max)
- NO lengthy descriptions or multiple examples
- Use emojis to make it friendly
- If asked about non-Python topics, politely redirect
- DO NOT use markdown code blocks (no \`\`\`python or \`\`\`)
- Write code examples directly without wrapping in code blocks

Format:
[Short explanation] 😊
Example:
[code without \`\`\`]

Be supportive but BRIEF.`;

// Option B - No restrictions, use model's default behavior
const SYSTEM_PROMPT_OPTION_B = ``; // Empty, no restrictions added

const AIChatBot = ({ mode = 'A' }) => {
  // Select corresponding prompt based on mode
  const SYSTEM_PROMPT = mode === 'B' ? SYSTEM_PROMPT_OPTION_B : SYSTEM_PROMPT_OPTION_A;
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: mode === 'B'
        ? '👋 Hi! I\'m your AI Learning Assistant. I\'ll provide comprehensive explanations!'
        : '👋 Hi! I\'m your AI Learning Assistant. Ask me anything about Python!',
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  // Save conversation history for Gemini API
  const [conversationHistory, setConversationHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Clear chat history when mode switches
  useEffect(() => {
    // Reset messages to welcome message
    setMessages([
      {
        id: '1',
        text: mode === 'B'
          ? '👋 Hi! I\'m your AI Learning Assistant. I\'ll provide comprehensive explanations!'
          : '👋 Hi! I\'m your AI Learning Assistant. Ask me anything about Python!',
        isBot: true,
        timestamp: new Date(),
      },
    ]);
    // Clear conversation history
    setConversationHistory([]);
    // Clear input box
    setInputText('');
  }, [mode]); // Trigger when mode changes

  // Pulse animation effect
  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]);
    Animated.loop(pulse).start();
  }, []);

  // Scroll to latest message
  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message to Gemini API
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    Keyboard.dismiss();

    // Update conversation history (Gemini format)
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', parts: [{ text: userMessage.text }] }
    ];

    try {
      // Create AbortController for timeout control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Call local proxy server
      const response = await fetch(PROXY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          contents: updatedHistory,
          // Add systemInstruction only for Option A, no restrictions for Option B
          ...(mode === 'A' && {
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            }
          }),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: mode === 'A' ? 150 : 1000, // Option A: Short, Option B: Detailed
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Gemini API Error');
      }

      const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t process that.';
      
      // Clean up markdown code block markers
      const cleanedMessage = assistantMessage
        .replace(/```python\n?/g, '')  // Remove ```python
        .replace(/```\n?/g, '')         // Remove ```
        .trim();
      
      // Update conversation history (including AI response)
      setConversationHistory([
        ...updatedHistory,
        { role: 'model', parts: [{ text: cleanedMessage }] }
      ]);

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: cleanedMessage,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Gemini API Error:', error);
      // If API fails, provide a simulated response
      const fallbackMessage = {
        id: (Date.now() + 1).toString(),
        text: `⚠️ API Connection Failed: ${error.message}\n\nI'll answer in offline mode:\n\n${getSimulatedResponse(userMessage.text)}`,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate AI response (when API is unavailable)
  const getSimulatedResponse = (userText) => {
    const lowerText = userText.toLowerCase();
    
    if (lowerText.includes('print')) {
      return '📝 The print() function in Python is used to display output.\n\nExample:\nprint("Hello World!")\n\nYou can print strings, numbers, and variables!';
    }
    if (lowerText.includes('variable')) {
      return '📦 Variables in Python store data values.\n\nExample:\nname = "Python"\nage = 30\n\nPython uses dynamic typing, so you don\'t need to declare the type!';
    }
    if (lowerText.includes('loop') || lowerText.includes('for')) {
      return '🔄 Loops in Python let you repeat code.\n\nFor loop example:\nfor i in range(5):\n    print(i)\n\nThis prints numbers 0 to 4!';
    }
    if (lowerText.includes('function') || lowerText.includes('def')) {
      return '⚙️ Functions are reusable blocks of code.\n\nExample:\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))';
    }
    if (lowerText.includes('hello') || lowerText.includes('hi')) {
      return '👋 Hello! I\'m here to help you learn Python. Ask me about:\n• print() statements\n• Variables\n• Loops\n• Functions\n• And more!';
    }
    if (lowerText.includes('help')) {
      return '🆘 I can help you with:\n\n• Python basics (print, variables)\n• Control flow (if/else, loops)\n• Functions and classes\n• Common errors\n• Code examples\n\nJust ask away!';
    }
    
    return '🤔 That\'s a great question! I\'m still learning. Try asking about:\n• print() function\n• Variables in Python\n• Loops (for, while)\n• Functions\n\nOr type "help" for more options!';
  };

  // Render message bubbles
  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.isBot ? styles.botMessage : styles.userMessage
    ]}>
      {item.isBot && (
        <View style={styles.botAvatar}>
          <Ionicons name="sparkles" size={16} color="#D5FF5F" />
        </View>
      )}
      <View style={[
        styles.messageContent,
        item.isBot ? styles.botMessageContent : styles.userMessageContent
      ]}>
        <Text style={[
          styles.messageText,
          item.isBot ? styles.botMessageText : styles.userMessageText
        ]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.typingContainer}>
        <View style={styles.botAvatar}>
          <Ionicons name="sparkles" size={16} color="#D5FF5F" />
        </View>
        <View style={styles.typingDots}>
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'box-none' }}>
      {/* Floating button - Fixed to top right corner */}
      <Animated.View 
        style={[
          styles.floatingButton,
          {
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => setIsVisible(true)}
          activeOpacity={0.8}
          style={[
            styles.floatingButtonInner,
            { backgroundColor: mode === 'B' ? '#FF6B6B' : '#D5FF5F' } // Option B: Red
          ]}
        >
          <Ionicons name="chatbubbles" size={28} color="#000000" />
          <View style={styles.aiIndicator}>
            <Text style={styles.aiIndicatorText}>AI</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.chatContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="sparkles" size={24} color={mode === 'B' ? '#FF6B6B' : '#D5FF5F'} />
                <View>
                  <Text style={styles.headerTitle}>AI Assistant</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Messages List */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              ListFooterComponent={renderTypingIndicator}
              showsVerticalScrollIndicator={false}
            />

            {/* Quick Suggestions */}
            <View style={styles.suggestionsContainer}>
              {['What is print()?', 'Help me', 'Variables'].map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => {
                    setInputText(suggestion);
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything..."
                placeholderTextColor="#888"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons 
                  name={isLoading ? "hourglass" : "send"} 
                  size={24} 
                  color={inputText.trim() && !isLoading ? "#000000" : "#666"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Floating button styles
  floatingButton: {
    position: 'absolute',
    top: 60,  // 60px from top
    right: 20, // 20px from right
    zIndex: 9999, // Ensure above all elements
  },
  floatingButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 15, // Increase Android elevation
  },
  aiIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    marginTop: 50,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#D5FF5F',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },

  // Message styles
  messagesList: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D5FF5F',
  },
  messageContent: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  botMessageContent: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderBottomLeftRadius: 4,
  },
  userMessageContent: {
    backgroundColor: '#D5FF5F',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  botMessageText: {
    color: '#FFFFFF',
  },
  userMessageText: {
    color: '#000000',
  },

  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  typingDots: {
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  typingText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },

  // Quick Suggestions
  suggestionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#0D0D0D',
  },
  suggestionButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5FF5F',
  },
  suggestionText: {
    color: '#D5FF5F',
    fontSize: 12,
  },

  // Input styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2B2B3D',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#444',
  },
  sendButton: {
    backgroundColor: '#D5FF5F',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
});

export default AIChatBot;
