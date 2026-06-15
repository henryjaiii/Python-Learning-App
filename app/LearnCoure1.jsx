import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, TextInput, Platform } from 'react-native';
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { ProgressBar } from 'react-native-paper';
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLevel } from '../context/LevelContext';
import AIChatBot from '../components/AIChatBot/AIChatBot';

const API_URL = 'http://192.168.1.210:3000/execute';
const FIREBASE_API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3001' 
  : 'http://localhost:3001';

// Update lessonData - now with 4 pages
const lessonData = {
  1: {
    title: "Python Output / Print",
    pages: [
      // Page 1 - NEW: Concept explanation page
      {
        content: "Welcome to Python Print Function!\n\n📚 What is Print?\nThe print() function is used to display information on the screen. It's one of the first things you'll learn in Python.\n\n💡 Key Concepts:\n• Print displays text and values\n• Use quotation marks for text (strings)\n• You can print multiple items\n• Each print creates a new line\n\n🎯 Why is it important?\nPrint helps you see what your program is doing, making it essential for learning and debugging.\n\nLet's start learning!",
        type: 'concept',
        icon: '💡'
      },
      // Page 2 - (was Page 1)
      {
        content: "Print is a function that displays text or values on the screen. It's one of the most basic and essential functions in Python.",
        examples: ['print("Hello World!")', 'print("Second line")'],
        type: 'normal'
      },
      // Page 3 - (was Page 2) new sequence game
      {
        content: "Let's create a print statement by arranging the parts in the correct order.\n\nArrange the snippets to create: print('Hello World!')",
        type: 'sequence',
        fullSentence: "print('Hello World!')",
        snippets: ["World!')", "print('", "Hello"],
        correctSequence: [1, 2, 0] // Correct order indices
      },
      // Page 4 - (was Page 3) new symbol choice question
      {
        content: "Add the right symbols to create the snake case variable.",
        type: 'symbolChoice',
        question: 'total_cash+amount',
        options: ['-', '_', '+'],
        correctAnswer: '_',
        answerPosition: 10, // Position where the symbol should go
      },
      // Page 5 - Interactive code input with examples
      {
        content: "Try running some Python code yourself!\n\n💡 Try these examples:\n• print('Hello World!')\n• print(2 + 3)\n• print('Your Name')\n\n✍️ You can write multiple lines of code!\nPress Enter to create a new line.",
        type: 'interactive',
        exampleInputs: [
          "print('Hello World!')",
          "print(2 + 3)",
          "print('Python is fun!')"
        ]
      }
    ],
    totalPages: 5,
  },
};

export default function LearnCoure() {
  const { id } = useLocalSearchParams();
  const { currentLevel } = useLevel();
  const [lesson, setLesson] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [code, setCode] = useState('');  // Add this line
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add new state variables
  const [userSequence, setUserSequence] = useState([]);
  const [isSequenceCorrect, setIsSequenceCorrect] = useState(false);
  const [blinkAnim] = useState(new Animated.Value(0)); // Add new state for blinking animation
  const [selectedSymbol, setSelectedSymbol] = useState(''); // State for symbol choice
  const [userInput, setUserInput] = useState(''); // State for user input on page 5
  const [isRunning, setIsRunning] = useState(false); // State for running animation

  useEffect(() => {
    setLesson(lessonData[1]);
  }, []);

  // Add animation effect
  useEffect(() => {
    const blink = Animated.sequence([
      Animated.timing(blinkAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(blinkAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(blink).start();
  }, []);

  const handleExamplePress = async (exampleCode) => {
    try {
      setIsLoading(true);
      setCode(exampleCode);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: exampleCode }),
      });

      const data = await response.json();
      if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput(data.output || 'No output');
      }
    } catch (error) {
      console.error('API Error:', error);
      setOutput('Failed to execute code');
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleSequencePress function
  const handleSequencePress = (index) => {
    const newSequence = [...userSequence, index];
    setUserSequence(newSequence);
    
    // Update current code display
    const currentPageData = lesson.pages[currentPage];
    const selectedSnippets = newSequence.map(i => currentPageData.snippets[i]);
    setCode(selectedSnippets.join(''));

    // Check if sequence is complete
    if (newSequence.length === currentPageData.snippets.length) {
      const correct = newSequence.every(
        (num, idx) => num === currentPageData.correctSequence[idx]
      );
      setIsSequenceCorrect(correct);
      
      if (correct) {
        setOutput("Correct! ✅");
      } else {
        setOutput("Incorrect! Try again ❌");
        setUserSequence([]);
        setCode('');
      }
    }
  };

  // Add symbol choice handler
  const handleSymbolChoice = (symbol) => {
    const currentPageData = lesson.pages[currentPage];
    setSelectedSymbol(symbol);
    if (symbol === currentPageData.correctAnswer) {
      setOutput("Correct! ✅");
    } else {
      setOutput("Incorrect! Try again ❌");
      // Reset after 1 second to allow retry
      setTimeout(() => {
        setSelectedSymbol('');
        setOutput('');
      }, 1500);
    }
  };

  // Add handler for running user input code
  const handleRunCode = async () => {
    if (!userInput.trim()) {
      setOutput('Please enter some code first!');
      return;
    }

    try {
      setIsRunning(true);
      setOutput('Running...');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: userInput }),
      });

      const data = await response.json();
      if (data.error) {
        // Error is already logged on backend CMD, no need to log again here
        let errorMessage = '';

        if (typeof data.error === 'object') {
          errorMessage = (data.error.message || data.error.raw || 'Execution error').trim();
        } else if (typeof data.error === 'string') {
          errorMessage = data.error.trim();
        } else {
          errorMessage = 'Execution error';
        }

        // Extract only the last line (e.g., "SyntaxError: '(' was never closed")
        const lines = errorMessage.split('\n').filter((line) => line.trim() !== '');
        const lastLine = lines[lines.length - 1] || errorMessage;
        
        // Remove file path and line number prefix if present
        const simplifiedMessage = lastLine
          .replace(/^File\s+"[^"]+",\s*line\s*\d+\s*/i, '')
          .replace(/\s*\(detected at line \d+\)/i, '')
          .trim();

        setOutput(`❌ ${simplifiedMessage || 'Execution error'}`);
      } else {
        // Success is already logged on backend CMD
        setOutput(`✅ Output:\n${data.output || 'No output'}`);
      }
    } catch (error) {
      // Only show user-friendly message, backend has full error details
      setOutput('❌ Failed to execute code. Please check your connection.');
    } finally {
      setIsRunning(false);
    }
  };

  // Add handler for inserting example code
  const handleInsertExample = (exampleCode) => {
    setUserInput(exampleCode);
    setOutput('');
  };

  // Reset sequence when changing pages
  useEffect(() => {
    setUserSequence([]);
    setIsSequenceCorrect(false);
    setOutput('');
    setCode('');
    setSelectedSymbol('');
    setUserInput('');
    setIsRunning(false);
  }, [currentPage]);

  // Update the handleNextPage and handlePrevPage functions
  const handleNextPage = () => {
    if (currentPage < lesson.totalPages - 1) {
      setCurrentPage(currentPage + 1);
      // Reset states when changing page
      setOutput('');
      setCode('');
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      // Reset states when changing page
      setOutput('');
      setCode('');
    }
  };

  const handleCompletion = async () => {
    try {
      // Save completion status locally
      await AsyncStorage.setItem(`lesson_${id}_completed`, 'true');
      console.log(`Lesson ${id} marked as completed`);
      
      // Save progress to Firebase
      const userUID = await AsyncStorage.getItem('userUID');
      if (userUID) {
        try {
          const response = await fetch(`${FIREBASE_API_URL}/progress/${userUID}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lessonId: parseInt(id),
              progress: 100,
              level: currentLevel,
              completed: true
            }),
          });
          
          const result = await response.json();
          if (result.success) {
            console.log(`✅ Progress saved to Firebase for lesson ${id}`);
          }
        } catch (error) {
          console.error('Error saving to Firebase:', error);
        }
      }
    } catch (error) {
      console.error('Error saving completion:', error);
    }
    router.push('/Home');  // Changed from '/MapLearning' to '/Home'
  };

  if (!lesson) return null;

  // Modify the render method for page 2
  const renderPageContent = () => {
    const currentPageData = lesson.pages[currentPage];
    
    // Handle concept page (Page 1) - content is already shown above, just show icon
    if (currentPageData.type === 'concept') {
      return (
        <View style={styles.conceptContainer}>
          <View style={styles.conceptIconContainer}>
            <Text style={styles.conceptIcon}>{currentPageData.icon}</Text>
          </View>
          <Text style={styles.conceptSubtitle}>Push Next to begin learning!</Text>
        </View>
      );
    }
    
    if (currentPageData.type === 'sequence') {
      return (
        <>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>script.py</Text>
            <Text style={styles.codeContent}>
              {code || 'Type your code here...'}
            </Text>
          </View>
          
          <View style={styles.snippetsContainer}>
            {currentPageData.snippets.map((snippet, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.snippetButton,
                  userSequence.includes(index) && styles.snippetButtonPressed
                ]}
                onPress={() => handleSequencePress(index)}
                disabled={userSequence.includes(index)}
              >
                <Text style={styles.snippetButtonText}>{snippet}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {output && (
            <Text style={styles.resultText}>{output}</Text>
          )}
        </>
      );
    }

    if (currentPageData.type === 'symbolChoice') {
      const question = currentPageData.question;
      const position = currentPageData.answerPosition;
      const beforeText = question.slice(0, position);
      const afterText = question.slice(position + 1);

      return (
        <>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>script.py</Text>
            <View style={styles.codeContentContainer}>
              <Text style={styles.codeContent}>{beforeText}</Text>
              {selectedSymbol ? (
                <View style={styles.selectedSymbolContainer}>
                  <Text style={[styles.codeContent, styles.selectedSymbol]}>{selectedSymbol}</Text>
                </View>
              ) : (
                <Animated.View style={[
                  styles.cursorContainer,
                  {
                    opacity: blinkAnim
                  }
                ]}>
                  <Text style={[styles.codeContent, styles.cursor]}>|</Text>
                </Animated.View>
              )}
              <Text style={styles.codeContent}>{afterText}</Text>
            </View>
          </View>
          
          <View style={styles.symbolsContainer}>
            {currentPageData.options.map((symbol, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.symbolButton,
                  selectedSymbol === symbol && styles.symbolButtonSelected
                ]}
                onPress={() => handleSymbolChoice(symbol)}
                disabled={selectedSymbol !== ''}
              >
                <Text style={styles.symbolButtonText}>{symbol}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {output && (
            <Text style={styles.resultText}>{output}</Text>
          )}
        </>
      );
    }

    // Handle interactive code input page (Page 5)
    if (currentPageData.type === 'interactive') {
      return (
        <>
          {/* Example buttons - display only, not clickable */}
          <View style={styles.examplesContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="bulb" size={24} color="#D5FF5F" />
              <Text style={styles.examplesLabel}> Examples (Type them yourself):</Text>
            </View>
            {currentPageData.exampleInputs.map((example, index) => (
              <View
                key={index}
                style={styles.exampleButtonDisabled}
              >
                <Text style={styles.exampleButtonText}>{example}</Text>
              </View>
            ))}
          </View>

          {/* Code input area */}
          <View style={styles.interactiveContainer}>
            <Text style={styles.interactiveLabel}>
              <Ionicons name="code-slash" size={20} color="#D5FF5F" />
              {' '}Your Code:
            </Text>
            <TextInput
              style={styles.codeInput}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Type your Python code here...\nYou can write multiple lines!"
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.runButton,
                isRunning && styles.runButtonDisabled
              ]}
              onPress={handleRunCode}
              disabled={isRunning}
            >
              <Ionicons 
                name={isRunning ? "hourglass" : "play-circle"} 
                size={24} 
                color="#000000" 
              />
              <Text style={styles.runButtonText}>
                {isRunning ? 'Running...' : 'Run Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Output area */}
          {output && (
            <View style={styles.interactiveOutputContainer}>
              <Text style={styles.outputLabel}>
                <Ionicons name="terminal" size={20} color="#D5FF5F" />
                {' '}Result:
              </Text>
              <Text style={styles.output}>{output}</Text>
            </View>
          )}
        </>
      );
    }

    return (
      <View style={styles.examplesContainer}>
        <View style={styles.labelContainer}>
          <Ionicons name="information-circle" size={24} color="#D5FF5F" />
          <Text style={styles.examplesLabel}> Tap the template below</Text>
        </View>
        {lesson.pages[currentPage].examples.map((example, index) => (
          <TouchableOpacity
            key={index}
            style={styles.exampleButton}
            onPress={() => handleExamplePress(example)}
          >
            <Text style={styles.exampleButtonText}>{example}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Page {currentPage + 1} of {lesson.totalPages}
        </Text>
        <ProgressBar 
          progress={(currentPage + 1) / lesson.totalPages} 
          color="#D5FF5F"
          style={styles.progressBar}
        />
      </View>

      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.content}>{lesson.pages[currentPage].content}</Text>
      {renderPageContent()}

      {/* Only show output container for normal type pages */}
      {lesson.pages[currentPage].type === 'normal' && (
        <View style={styles.outputContainer}>
          <Text style={styles.outputLabel}>Output Result:</Text>
          <Text style={styles.output}>{output}</Text>
        </View>
      )}

      <View style={styles.navigationContainer}>
        {currentPage === lesson.totalPages - 1 ? (
          // Show completion button on last page
          <TouchableOpacity 
            style={styles.completionButton}
            onPress={handleCompletion}
          >
            <Ionicons name="checkmark-circle" size={24} color="#000000" />
            <Text style={styles.completionButtonText}>Complete Lesson</Text>
          </TouchableOpacity>
        ) : (
          // Show regular navigation on other pages
          <>
            <TouchableOpacity 
              style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
              onPress={handlePrevPage}
              disabled={currentPage === 0}
            >
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={handleNextPage}
            >
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <AIChatBot />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#000000ff',  // Changed to black background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#D5FF5F',  // Theme color
  },
  content: {
    marginBottom: 24,
    lineHeight: 24,
    color: '#FFFFFF',  // White text for readability
  },
  examplesContainer: {
    marginBottom: 20,
  },
  examplesLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#ffffffc4',  // Theme color
  },
  exampleButton: {
    backgroundColor: '#1A1A1A',  // Dark gray background
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',  // Theme color border
  },
  exampleButtonDisabled: {
    backgroundColor: '#1A1A1A',  // Dark gray background
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#666666',  // Gray border for disabled state
    opacity: 0.7,
  },
  exampleButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#FFFFFF',  // Theme color text
  },
  outputContainer: {
    backgroundColor: '#1A1A1A',  // Dark gray background
    padding: 16,
    borderRadius: 8,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#D5FF5F',  // Theme color border
  },
  outputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#D5FF5F',  // Theme color
  },
  output: {
    fontFamily: 'monospace',
    fontSize: 16,
    color: '#FFFFFF',  // White text for output
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  examplesLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D5FF5F',
    marginLeft: 8,  // Add some space between icon and text
  },
  progressContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  progressText: {
    color: '#D5FF5F',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  navButton: {
    backgroundColor: '#D5FF5F',
    padding: 12,
    borderRadius: 8,
    width: '45%',
  },
  navButtonDisabled: {
    backgroundColor: '#333333',
  },
  navButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  completionButton: {
    backgroundColor: '#D5FF5F',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  completionButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  conceptContainer: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#D5FF5F',
    alignItems: 'center',
  },
  conceptIconContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#2B2B3D',
    borderRadius: 50,
  },
  conceptIcon: {
    fontSize: 60,
  },
  conceptSubtitle: {
    fontSize: 16,
    color: '#D5FF5F',
    marginTop: 16,
    fontWeight: '600',
  },
  sequenceContainer: {
    gap: 12,
  },
  snippetButton: {
    backgroundColor: '#2b3d38ff',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D5FF5F',
  },
  snippetButtonPressed: {
    backgroundColor: '#1b1bdeff',
    opacity: 0.7,
  },
  snippetButtonText: {
    color: '#D5FF5F',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  codeContainer: {
    backgroundColor: '#2B2B3D',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    maxHeight: 120,  // Add maximum height
  },
  codeText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  codeContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',  // Center the content
    paddingVertical: 10,      // Add vertical padding
  },
  codeContent: {
    color: '#FFFFFF',
    fontSize: 18,            // Reduce font size
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  cursorContainer: {
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 8,  // Increased padding
    backgroundColor: '#3B3B4D',  // Light background
    borderRadius: 4,  // Rounded corners
    marginHorizontal: 4,  // Add spacing
    borderWidth: 1,  // Add border
    borderColor: '#D5FF5F33',  // Semi-transparent theme color border
  },
  cursor: {
    color: '#D5FF5F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedSymbolContainer: {
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#2B2B3D',
    borderRadius: 4,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#D5FF5F',
  },
  selectedSymbol: {
    color: '#D5FF5F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  snippetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginTop: 20,
  },
  symbolsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginTop: 20,
  },
  symbolButton: {
    backgroundColor: '#2B2B3D',
    padding: 16,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFEB3B', // Yellow border
  },
  symbolButtonSelected: {
    backgroundColor: '#1A1A1A',
    borderColor: '#D5FF5F',
    opacity: 0.7,
  },
  symbolButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'monospace',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  successText: {
    color: '#e4e416ff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  resultText: {
    color: '#D5FF5F',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  // Styles for page 5 - interactive code input
  interactiveContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#D5FF5F',
  },
  interactiveLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D5FF5F',
    marginBottom: 12,
  },
  codeInput: {
    backgroundColor: '#2B2B3D',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    minHeight: 150,
    maxHeight: 300,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#444',
  },
  runButton: {
    backgroundColor: '#D5FF5F',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  runButtonDisabled: {
    backgroundColor: '#999999',
    opacity: 0.6,
  },
  runButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  interactiveOutputContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    minHeight: 80,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
});