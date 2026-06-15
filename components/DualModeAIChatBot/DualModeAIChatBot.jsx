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
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// API Configuration
const PROXY_API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3001/chat'
  : 'http://localhost:3001/chat';

// Option A - Limited system prompt (short responses)
const OPTION_A_PROMPT = `You are a concise and efficient AI tutor.

STRICT RULES:
- Keep responses SHORT (maximum 3-4 sentences)
- Provide ONLY ONE simple code example if needed (max 5 lines)
- NO lengthy explanations
- Use bullet points for clarity
- Focus on the most important information only

Be helpful but BRIEF. ⚡`;

// Option B - Unlimited system prompt (detailed responses)
const OPTION_B_PROMPT = `You are a comprehensive and detailed AI tutor.

Your approach:
- Provide thorough, in-depth explanations
- Include multiple examples when helpful
- Explain concepts from different angles
- Add background context and theory
- Share best practices and common pitfalls
- Use analogies and real-world examples
- Be patient and educational

Take the time to explain things fully and comprehensively. 📚`;

const DualModeAIChatBot = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [chatMode, setChatMode] = useState(null); // 'A' or 'B'
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Drag position state
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 80, y: 60 })).current;

  // Pulse animation effect
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Select chat mode
  const selectMode = (mode) => {
    setChatMode(mode);
    const welcomeMessage = mode === 'A' 
      ? {
          id: '1',
          text: '⚡ Option A - Concise Mode\nI\'ll give you short, direct answers!',
          isBot: true,
          timestamp: new Date(),
        }
      : {
          id: '1',
          text: '📚 Option B - Detailed Mode\nI\'ll provide complete, in-depth explanations with multiple examples!',
          isBot: true,
          timestamp: new Date(),
        };
    
    setMessages([welcomeMessage]);
    setConversationHistory([]);
  };

  // Reset chat
  const resetChat = () => {
    setChatMode(null);
    setMessages([]);
    setConversationHistory([]);
    setInputText('');
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Select corresponding system prompt
      const systemPrompt = chatMode === 'A' ? OPTION_A_PROMPT : OPTION_B_PROMPT;

      // Prepare conversation history
      const history = [
        ...conversationHistory,
        { role: 'user', parts: [{ text: userMessage.text }] }
      ];

      // Send request to proxy server
      const response = await fetch(PROXY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          conversationHistory: history,
          systemPrompt: systemPrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      // Get AI response
      const aiText = data.reply || 'Sorry, I cannot respond.';

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update conversation history
      setConversationHistory([
        ...history,
        { role: 'model', parts: [{ text: aiText }] }
      ]);

      // Auto scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('AI Error:', error);
      
      // Error handling - Provide simulated response
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: `⚠️ Connection failed: ${error.message}\n\nPlease check your network connection or try again later.`,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render message item
  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isBot ? styles.botMessage : styles.userMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isBot ? styles.botBubble : styles.userBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isBot ? styles.botText : styles.userText
        ]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString('zh-TW', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  );

  // Mode selection screen
  const renderModeSelection = () => (
    <View style={styles.modeSelectionContainer}>
      <Text style={styles.modeTitle}>🤖 Select AI Assistant Mode</Text>
      <Text style={styles.modeSubtitle}>Choose your preferred chat style</Text>
      
      {/* Option A */}
      <TouchableOpacity
        style={[styles.modeCard, styles.modeCardA]}
        onPress={() => selectMode('A')}
      >
        <View style={styles.modeHeader}>
          <Ionicons name="flash" size={32} color="#FF6B6B" />
          <Text style={styles.modeCardTitle}>Option A - Concise Mode</Text>
        </View>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>Limited Prompt</Text>
        </View>
        <Text style={styles.modeDescription}>
          ✓ Short, direct answers{'\n'}
          ✓ Clear focus{'\n'}
          ✓ Time-saving{'\n'}
          ✓ Ideal for quick queries
        </Text>
        <View style={styles.exampleBox}>
          <Text style={styles.exampleLabel}>Response Example:</Text>
          <Text style={styles.exampleText}>
            "List comprehension is a concise way to create lists.{'\n'}
            Example: [x*2 for x in range(5)]"
          </Text>
        </View>
      </TouchableOpacity>

      {/* Option B */}
      <TouchableOpacity
        style={[styles.modeCard, styles.modeCardB]}
        onPress={() => selectMode('B')}
      >
        <View style={styles.modeHeader}>
          <Ionicons name="book" size={32} color="#FF6B6B" />
          <Text style={styles.modeCardTitle}>Option B - Detailed Mode</Text>
        </View>
        <View style={[styles.modeBadge, styles.modeBadgeB]}>
          <Text style={styles.modeBadgeText}>Unlimited Prompt</Text>
        </View>
        <Text style={styles.modeDescription}>
          ✓ Complete, in-depth explanations{'\n'}
          ✓ Multiple examples{'\n'}
          ✓ Theory and practice combined{'\n'}
          ✓ Ideal for deep learning
        </Text>
        <View style={[styles.exampleBox, styles.exampleBoxB]}>
          <Text style={styles.exampleLabel}>Response Example:</Text>
          <Text style={styles.exampleText}>
            "List comprehension is a powerful Python feature that provides an elegant and efficient way to create lists...{'\n'}
            [Detailed explanation, multiple examples, best practices, etc.]"
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Chat interface
  const renderChatInterface = () => (
    <View style={styles.chatContainer}>
      {/* Top bar */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={resetChat} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.chatHeaderTitle}>
            {chatMode === 'A' ? '⚡ Concise Mode' : '📚 Detailed Mode'}
          </Text>
          <Text style={styles.chatHeaderSubtitle}>
            {chatMode === 'A' ? 'Quick, short answers' : 'Complete, in-depth explanations'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Message list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
        </View>
      )}

      {/* Input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Enter your question..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? '#fff' : '#ccc'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <>
      {/* Floating button */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: pulseAnim }
            ]
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => setIsVisible(true)}
          style={styles.buttonTouchable}
        >
          <Ionicons name="chatbubbles" size={28} color="#fff" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AI</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>
          {chatMode === null ? renderModeSelection() : renderChatInterface()}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Floating button styles
  floatingButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  buttonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Mode selection screen
  modeSelectionContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  modeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
    color: '#333',
  },
  modeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  modeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 3,
  },
  modeCardA: {
    borderColor: '#FF6B6B',
  },
  modeCardB: {
    borderColor: '#4ECDC4',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
  },
  modeBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  modeBadgeB: {
    backgroundColor: '#4ECDC4',
  },
  modeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modeDescription: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    marginBottom: 16,
  },
  exampleBox: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  exampleBoxB: {
    backgroundColor: '#f0fffe',
    borderLeftColor: '#4ECDC4',
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 13,
    color: '#444',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Chat interface
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 15,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: '#e0e0e0',
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginHorizontal: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});

export default DualModeAIChatBot;
