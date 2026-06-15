import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, PanResponder, TextInput, Platform } from 'react-native';
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { ProgressBar } from 'react-native-paper';
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import AIChatBot from '../components/AIChatBot/AIChatBot';
import { useLevel } from '../context/LevelContext';

const API_URL = 'http://192.168.1.210:3000/execute';
const FIREBASE_API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3001' 
  : 'http://localhost:3001';

// Update lessonData - Variable Names lesson
const lessonData = {
  2: {
    title: "Python Variable Names",
    pages: [
      // Page 1 - Concept explanation page
      {
        content: "Welcome to Python Variable Names!\n\n📚 What is a Variable Name?\nA variable name is a label used to identify stored data in your program. Choosing good names makes your code easier to read and understand.\n\n💡 Key Naming Rules:\n• Must start with a letter or underscore (_)\n• Can contain letters, numbers, and underscores\n• Case-sensitive (age and Age are different)\n• Cannot use Python keywords (like print, if, for)\n\n🎯 Best Practices:\n• Use descriptive names: user_age instead of x\n• Use lowercase with underscores (snake_case)\n• Keep names clear but concise\n\nLet's practice!",
        type: 'concept',
        icon: '🏷️'
      },
      // Page 2 - Drag and drop matching game
      {
        content: "Drag the variable names to the correct category.\n\nSort them into Valid or Invalid:",
        type: 'dragMatch',
        items: [
          { id: 1, name: 'user_name', isValid: true },
          { id: 2, name: '2nd_value', isValid: false },
          { id: 3, name: 'total_count', isValid: true },
          { id: 4, name: 'my-variable', isValid: false },
          { id: 5, name: '_private', isValid: true },
          { id: 6, name: 'class', isValid: false }, // Python keyword
        ]
      },
      // Page 3 - Error correction game
      {
        content: "Fix the invalid variable name by tapping the error part.\n\nMake it a valid Python variable name:",
        type: 'errorFix',
        invalidName: '2user-name',
        parts: ['2', 'user', '-', 'name'],
        errorIndices: [0, 2], // Index 0 (starts with number) and index 2 (hyphen)
        correctFixes: {
          0: '_', // Replace '2' with '_'
          2: '_'  // Replace '-' with '_'
        },
        correctResult: '_user_name'
      },
      // Page 4 - Fill in the blanks (drag and drop)
      {
        content: "Complete the Python code by dragging the correct answers!",
        type: 'fillInBlanks',
        instruction: "Drag the correct blocks to fill in the blanks:",
        codeLines: [
          {
            line: 1,
            parts: [
              { type: 'text', content: '# Define variables' }
            ]
          },
          {
            line: 2,
            parts: [
              { type: 'blank', id: 1, correctAnswer: 'user_name' },
              { type: 'text', content: ' = "Alice"' }
            ]
          },
          {
            line: 3,
            parts: [
              { type: 'text', content: 'age = 25' }
            ]
          },
          {
            line: 4,
            parts: [
              { type: 'text', content: '' }
            ]
          },
          {
            line: 5,
            parts: [
              { type: 'text', content: '# Calculate years until 30' }
            ]
          },
          {
            line: 6,
            parts: [
              { type: 'text', content: 'years_left = 30 - age' }
            ]
          },
          {
            line: 7,
            parts: [
              { type: 'text', content: '' }
            ]
          },
          {
            line: 8,
            parts: [
              { type: 'text', content: '# Display information' }
            ]
          },
          {
            line: 9,
            parts: [
              { type: 'text', content: 'print("Name:", user_name)' }
            ]
          },
          {
            line: 10,
            parts: [
              { type: 'text', content: 'print("Age:", ' },
              { type: 'blank', id: 2, correctAnswer: 'age' },
              { type: 'text', content: ')' }
            ]
          },
         
        ],
        options: [
          { id: 1, text: 'user_name', color: '#FF6B6B' },
          { id: 2, text: 'age', color: '#FF6B6B' },
          { id: 3, text: '2user', color: '#9B59B6' },
          { id: 4, text: 'user-name', color: '#9B59B6' },
          { id: 5, text: 'years_left', color: '#9B59B6' },
          { id: 6, text: 'name', color: '#9B59B6' },
        ],
        hints: [
          "Line 2: Variable names should start with a letter or underscore",
          "Line 10: Which variable stores the age value?",
          "Remember: 'age' was defined on line 3"
        ]
      }
    ],
    totalPages: 4,
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
  const [selectedAnswer, setSelectedAnswer] = useState(''); // State for multiple choice
  
  // Drag match game states
  const [validItems, setValidItems] = useState([]);
  const [invalidItems, setInvalidItems] = useState([]);
  const [remainingItems, setRemainingItems] = useState([]);
  const [validZoneLayout, setValidZoneLayout] = useState(null);
  const [invalidZoneLayout, setInvalidZoneLayout] = useState(null);
  
  // Error fix game states
  const [fixedParts, setFixedParts] = useState([]);
  const [selectedErrorIndex, setSelectedErrorIndex] = useState(null);
  const [errorInputValue, setErrorInputValue] = useState('');
  
  // Block building game states
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [workspaceBlocks, setWorkspaceBlocks] = useState([]);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [workspaceLayout, setWorkspaceLayout] = useState(null);
  
  // Fill in blanks game states
  const [filledBlanks, setFilledBlanks] = useState({});
  const [blankLayouts, setBlankLayouts] = useState({});

  useEffect(() => {
    setLesson(lessonData[2]);
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
    const selectedSnippets = newSequence.map(i => lesson.pages[1].snippets[i]);
    setCode(selectedSnippets.join(''));

    // Check if sequence is complete
    if (newSequence.length === 3) {
      const correct = newSequence.every(
        (num, idx) => num === lesson.pages[1].correctSequence[idx]
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
    if (symbol === currentPageData.correctAnswer) {
      setOutput("Correct! ✅");
    } else {
      setOutput("Incorrect! Try again ❌");
    }
  };

  // Add multiple choice handler
  const handleMultipleChoice = (answer) => {
    const currentPageData = lesson.pages[currentPage];
    setSelectedAnswer(answer);
    if (answer === currentPageData.correctAnswer) {
      setOutput("Correct! ✅");
    } else {
      setOutput("Incorrect! Try again ❌");
      // Reset after 1.5 seconds to allow retry
      setTimeout(() => {
        setSelectedAnswer('');
        setOutput('');
      }, 1500);
    }
  };

  // Block building game handlers
  const handleBlockDrop = (block, dropX, dropY) => {
    if (!workspaceLayout) return;
    
    // Check if dropped in workspace area
    const isInWorkspace = 
      dropX >= workspaceLayout.x &&
      dropX <= workspaceLayout.x + workspaceLayout.width &&
      dropY >= workspaceLayout.y &&
      dropY <= workspaceLayout.y + workspaceLayout.height;
    
    if (isInWorkspace) {
      // Check if block is already in workspace
      const isUsed = workspaceBlocks.some(b => b.id === block.id);
      if (!isUsed) {
        setWorkspaceBlocks(prev => [...prev, block]);
        setOutput('');
      }
    }
  };

  const handleRemoveBlock = (blockId) => {
    setWorkspaceBlocks(prev => prev.filter(b => b.id !== blockId));
    setOutput('');
  };

  const handleCheckBlocks = () => {
    const currentPageData = lesson.pages[currentPage];
    const userSequence = workspaceBlocks.map(b => b.id);
    const correctSequence = currentPageData.correctSequence;
    
    // Check if the sequence is correct
    const isCorrect = userSequence.length === correctSequence.length &&
      userSequence.every((id, index) => id === correctSequence[index]);
    
    if (isCorrect) {
      setOutput("Perfect! You built the code correctly! 🎉✅");
    } else {
      setOutput("Not quite right. Try again! ❌");
      
      // Show next hint if available
      if (currentHintIndex < currentPageData.hints.length - 1) {
        setTimeout(() => {
          setCurrentHintIndex(prev => prev + 1);
          setOutput("Here's another hint...");
        }, 1500);
      }
    }
  };

  // Fill in blanks game handlers
  const handleBlankDrop = (option, blankId, dropX, dropY) => {
    if (!blankLayouts[blankId]) return;
    
    const blankLayout = blankLayouts[blankId];
    
    // Add very large margin for easier drop detection (expand hitbox by 100px on each side)
    const margin = 100;
    
    // Check if dropped in this blank's area (with expanded hitbox)
    const isInBlank = 
      dropX >= blankLayout.x - margin &&
      dropX <= blankLayout.x + blankLayout.width + margin &&
      dropY >= blankLayout.y - margin &&
      dropY <= blankLayout.y + blankLayout.height + margin;
    
    if (isInBlank) {
      setFilledBlanks(prev => ({
        ...prev,
        [blankId]: option
      }));
      setOutput('');
      return true;
    }
    return false;
  };

  const handleRemoveFromBlank = (blankId) => {
    setFilledBlanks(prev => {
      const newBlanks = { ...prev };
      delete newBlanks[blankId];
      return newBlanks;
    });
    setOutput('');
  };

  const handleCheckFillInBlanks = () => {
    const currentPageData = lesson.pages[currentPage];
    
    // Get all blanks from codeLines
    const blanks = [];
    currentPageData.codeLines.forEach(line => {
      line.parts.forEach(part => {
        if (part.type === 'blank') {
          blanks.push(part);
        }
      });
    });
    
    // Check if all blanks are filled
    const allFilled = blanks.every(blank => filledBlanks[blank.id]);
    
    if (!allFilled) {
      setOutput("Please fill in all blanks! ⚠️");
      return;
    }
    
    // Check if all answers are correct
    const allCorrect = blanks.every(blank => 
      filledBlanks[blank.id]?.text === blank.correctAnswer
    );
    
    if (allCorrect) {
      setOutput("Perfect! All correct! 🎉✅");
    } else {
      setOutput("Some answers are incorrect. Try again! ❌");
      
      // Show next hint if available
      if (currentHintIndex < currentPageData.hints.length - 1) {
        setTimeout(() => {
          setCurrentHintIndex(prev => prev + 1);
        }, 1500);
      }
    }
  };

  // Drag match handler
  const handleDragMatch = (item, isValid) => {
    // Remove from remaining
    setRemainingItems(prev => prev.filter(i => i.id !== item.id));
    
    // Add to appropriate category
    if (isValid) {
      setValidItems(prev => [...prev, item]);
    } else {
      setInvalidItems(prev => [...prev, item]);
    }
    
    // Check if correct
    const isCorrect = item.isValid === isValid;
    if (!isCorrect) {
      setOutput("Incorrect! Try again ❌");
      // Reset after 1 second
      setTimeout(() => {
        if (isValid) {
          setValidItems(prev => prev.filter(i => i.id !== item.id));
        } else {
          setInvalidItems(prev => prev.filter(i => i.id !== item.id));
        }
        setRemainingItems(prev => [...prev, item]);
        setOutput('');
      }, 1000);
    } else {
      // Check if all items are placed correctly
      const currentPageData = lesson.pages[currentPage];
      const allValid = validItems.length + (isValid ? 1 : 0);
      const allInvalid = invalidItems.length + (isValid ? 0 : 1);
      const expectedValid = currentPageData.items.filter(i => i.isValid).length;
      const expectedInvalid = currentPageData.items.filter(i => !i.isValid).length;
      
      if (allValid === expectedValid && allInvalid === expectedInvalid) {
        setOutput("Perfect! All correct! ✅");
      }
    }
  };

  // Error fix handler
  const handleErrorFix = (index) => {
    const currentPageData = lesson.pages[currentPage];
    
    // Check if this is an error part
    if (!currentPageData.errorIndices.includes(index)) {
      setOutput("This part is correct! Try another one ℹ️");
      setTimeout(() => setOutput(''), 1000);
      return;
    }
    
    // Open input for this error index
    setSelectedErrorIndex(index);
    setErrorInputValue('');
  };

  // Submit user's error fix
  const handleSubmitErrorFix = () => {
    if (!errorInputValue || selectedErrorIndex === null) return;
    
    const currentPageData = lesson.pages[currentPage];
    const correctFix = currentPageData.correctFixes[selectedErrorIndex];
    
    // Update the fixed parts with user input
    setFixedParts(prev => prev.map((part, idx) => 
      idx === selectedErrorIndex ? { ...part, current: errorInputValue } : part
    ));
    
    // Check if the fix is correct
    const isCorrectFix = errorInputValue === correctFix;
    
    if (!isCorrectFix) {
      setOutput("Not quite right! Try again ❌");
      setTimeout(() => {
        setOutput('');
        setErrorInputValue('');
      }, 1500);
      return;
    }
    
    // Check if all errors are fixed
    setTimeout(() => {
      const result = fixedParts.map((p, idx) => 
        idx === selectedErrorIndex ? errorInputValue : p.current
      ).join('');
      
      if (result === currentPageData.correctResult) {
        setOutput("Excellent! Variable name fixed! ✅");
      } else {
        setOutput("Good! Keep fixing... 👍");
      }
      setSelectedErrorIndex(null);
      setErrorInputValue('');
    }, 500);
  };

  // Reset sequence when changing pages
  useEffect(() => {
    setUserSequence([]);
    setIsSequenceCorrect(false);
    setOutput('');
    setCode('');
    setSelectedSymbol('');
    setSelectedAnswer('');
    setValidItems([]);
    setInvalidItems([]);
    setRemainingItems([]);
    setFixedParts([]);
    setSelectedErrorIndex(null);
    setErrorInputValue('');
    setAvailableBlocks([]);
    setWorkspaceBlocks([]);
    setCurrentHintIndex(0);
    setFilledBlanks({});
    setBlankLayouts({});
    
    // Initialize drag match items
    if (lesson && lesson.pages[currentPage]?.type === 'dragMatch') {
      setRemainingItems(lesson.pages[currentPage].items);
    }
    
    // Initialize error fix parts
    if (lesson && lesson.pages[currentPage]?.type === 'errorFix') {
      setFixedParts(lesson.pages[currentPage].parts.map((part, idx) => ({
        original: part,
        current: part,
        index: idx
      })));
    }
    
    // Initialize block building game
    if (lesson && lesson.pages[currentPage]?.type === 'blockBuild') {
      setAvailableBlocks(lesson.pages[currentPage].availableBlocks);
      setWorkspaceBlocks([]);
      setCurrentHintIndex(0);
    }
  }, [currentPage, lesson]);

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

  // Draggable Item Component
  const DraggableItem = ({ item, onDrop }) => {
    const pan = useState(new Animated.ValueXY())[0];
    const [isDragging, setIsDragging] = useState(false);

    const panResponder = useState(() =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsDragging(true);
          pan.setOffset({
            x: pan.x._value,
            y: pan.y._value,
          });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event(
          [
            null,
            { dx: pan.x, dy: pan.y },
          ],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: (e, gesture) => {
          setIsDragging(false);
          pan.flattenOffset();

          const dropX = gesture.moveX;
          const dropY = gesture.moveY;

          // Check if dropped in valid zone
          if (validZoneLayout &&
              dropX >= validZoneLayout.x &&
              dropX <= validZoneLayout.x + validZoneLayout.width &&
              dropY >= validZoneLayout.y &&
              dropY <= validZoneLayout.y + validZoneLayout.height) {
            onDrop(item, true);
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start();
          }
          // Check if dropped in invalid zone
          else if (invalidZoneLayout &&
                   dropX >= invalidZoneLayout.x &&
                   dropX <= invalidZoneLayout.x + invalidZoneLayout.width &&
                   dropY >= invalidZoneLayout.y &&
                   dropY <= invalidZoneLayout.y + invalidZoneLayout.height) {
            onDrop(item, false);
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start();
          }
          // Return to original position
          else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start();
          }
        },
      })
    )[0];

    return (
      <Animated.View
        style={[
          styles.draggableItemContainer,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
            opacity: isDragging ? 0.9 : 1,
            zIndex: isDragging ? 99999 : 10,
            elevation: isDragging ? 99999 : 10,
            position: isDragging ? 'absolute' : 'relative',
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.draggableItem}>
          <Text style={styles.draggableItemText}>{item.name}</Text>
        </View>
      </Animated.View>
    );
  };

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
          <Text style={styles.conceptSubtitle}>Swipe to begin learning!</Text>
        </View>
      );
    }
    
    // Handle drag match game
    if (currentPageData.type === 'dragMatch') {
      return (
        <>
          <View style={styles.dragMatchContainer}>
            {/* Remaining items to drag */}
            <View style={styles.itemsPool}>
              <Text style={styles.poolTitle}>Drag Variable Names:</Text>
              <View style={styles.poolItems}>
                {remainingItems.map((item) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    onDrop={handleDragMatch}
                  />
                ))}
              </View>
            </View>
            
            {/* Drop zones */}
            <View style={styles.dropZones}>
              <View 
                style={styles.dropZone}
                onLayout={(event) => {
                  event.target.measure((x, y, width, height, pageX, pageY) => {
                    setValidZoneLayout({ x: pageX, y: pageY, width, height });
                  });
                }}
              >
                <View style={styles.dropZoneHeader}>
                  <Text style={styles.dropZoneTitle}>✅ Valid</Text>
                </View>
                <View style={styles.dropZoneContent}>
                  {validItems.map((item) => (
                    <View key={item.id} style={styles.droppedItem}>
                      <Text style={styles.droppedItemText}>{item.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View 
                style={styles.dropZone}
                onLayout={(event) => {
                  event.target.measure((x, y, width, height, pageX, pageY) => {
                    setInvalidZoneLayout({ x: pageX, y: pageY, width, height });
                  });
                }}
              >
                <View style={styles.dropZoneHeader}>
                  <Text style={styles.dropZoneTitle}>❌ Invalid</Text>
                </View>
                <View style={styles.dropZoneContent}>
                  {invalidItems.map((item) => (
                    <View key={item.id} style={styles.droppedItem}>
                      <Text style={styles.droppedItemText}>{item.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {output && (
            <Text style={styles.resultText}>{output}</Text>
          )}
        </>
      );
    }
    
    // Handle error fix game
    if (currentPageData.type === 'errorFix') {
      return (
        <>
          <View style={styles.errorFixContainer}>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>script.py</Text>
              <View style={styles.codeContentContainer}>
                {fixedParts.map((part, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.errorPart,
                      currentPageData.errorIndices.includes(index) && 
                      part.current === part.original && styles.errorPartHighlight,
                      part.current !== part.original && styles.errorPartFixed,
                      selectedErrorIndex === index && styles.errorPartSelected,
                    ]}
                    onPress={() => handleErrorFix(index)}
                    disabled={selectedErrorIndex !== null && selectedErrorIndex !== index}
                  >
                    <Text style={[
                      styles.errorPartText,
                      currentPageData.errorIndices.includes(index) && 
                      part.current === part.original && styles.errorPartTextHighlight
                    ]}>
                      {part.current}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {selectedErrorIndex !== null && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Enter correction:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    value={errorInputValue}
                    onChangeText={setErrorInputValue}
                    placeholder="Type here..."
                    placeholderTextColor="#666"
                    autoFocus={true}
                    onSubmitEditing={handleSubmitErrorFix}
                  />
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmitErrorFix}
                  >
                    <Text style={styles.submitButtonText}>✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <View style={styles.errorHintContainer}>
              <Text style={styles.errorHint}>💡 Tap the error parts to fix them!</Text>
              <Text style={styles.errorHint}>Red = Error | Green = Fixed</Text>
            </View>
          </View>

          {output && (
            <Text style={styles.resultText}>{output}</Text>
          )}
        </>
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
              <Animated.View style={[
                styles.cursorContainer,
                {
                  opacity: blinkAnim
                }
              ]}>
                <Text style={[styles.codeContent, styles.cursor]}>|</Text>
              </Animated.View>
              <Text style={styles.codeContent}>{afterText}</Text>
            </View>
          </View>
          
          <View style={styles.symbolsContainer}>
            {currentPageData.options.map((symbol, index) => (
              <TouchableOpacity
                key={index}
                style={styles.symbolButton}
                onPress={() => handleSymbolChoice(symbol)}
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

    // Handle multiple choice questions
    if (currentPageData.type === 'multipleChoice') {
      return (
        <>
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentPageData.question}</Text>
          </View>
          
          <View style={styles.optionsContainer}>
            {currentPageData.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === option && styles.optionButtonSelected
                ]}
                onPress={() => handleMultipleChoice(option)}
                disabled={selectedAnswer !== ''}
              >
                <Text style={styles.optionButtonText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {output && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.resultText}>{output}</Text>
              {selectedAnswer === currentPageData.correctAnswer && (
                <Text style={styles.explanationText}>{currentPageData.explanation}</Text>
              )}
            </View>
          )}
        </>
      );
    }

    // Handle block building game (Scratch-style)
    if (currentPageData.type === 'blockBuild') {
      // Draggable Block Component
      const DraggableBlock = ({ block, isInWorkspace = false }) => {
        const pan = useState(new Animated.ValueXY())[0];
        const [isDragging, setIsDragging] = useState(false);

        const panResponder = useState(() =>
          PanResponder.create({
            onStartShouldSetPanResponder: () => !isInWorkspace,
            onPanResponderGrant: () => {
              setIsDragging(true);
              pan.setOffset({
                x: pan.x._value,
                y: pan.y._value,
              });
              pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
              [
                null,
                { dx: pan.x, dy: pan.y },
              ],
              { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gesture) => {
              setIsDragging(false);
              pan.flattenOffset();
              
              // Get drop position
              const dropX = e.nativeEvent.pageX;
              const dropY = e.nativeEvent.pageY;
              
              handleBlockDrop(block, dropX, dropY);
              
              // Reset position
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false,
              }).start();
            },
          })
        )[0];

        return (
          <Animated.View
            style={[
              styles.draggableBlockContainer,
              {
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
                opacity: isDragging ? 0.8 : 1,
                zIndex: isDragging ? 99999 : 10,
                elevation: isDragging ? 99999 : 10,
                position: isDragging ? 'absolute' : 'relative',
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={[
              styles.blockItem,
              { backgroundColor: block.color },
              isInWorkspace && styles.blockItemWorkspace,
              isDragging && styles.blockItemDragging,
            ]}>
              <Text style={styles.blockItemText}>{block.text}</Text>
            </View>
          </Animated.View>
        );
      };

      return (
        <>
          <View style={styles.blockBuildContainer}>
            {/* Target display */}
            <View style={styles.targetContainer}>
              <Text style={styles.targetLabel}>🎯 Target:</Text>
              <View style={styles.targetCode}>
                <Text style={styles.targetCodeText}>{currentPageData.targetCode}</Text>
              </View>
            </View>

            {/* Workspace */}
            <View 
              style={styles.workspaceContainer}
              onLayout={(event) => {
                event.target.measure((x, y, width, height, pageX, pageY) => {
                  setWorkspaceLayout({ x: pageX, y: pageY, width, height });
                });
              }}
            >
              <Text style={styles.workspaceLabel}>📝 Your Code:</Text>
              <View style={styles.workspace}>
                {workspaceBlocks.length === 0 ? (
                  <Text style={styles.workspacePlaceholder}>Drag blocks here...</Text>
                ) : (
                  <View style={styles.workspaceBlocks}>
                    {workspaceBlocks.map((block) => (
                      <TouchableOpacity
                        key={block.id}
                        style={styles.workspaceBlockWrapper}
                        onLongPress={() => handleRemoveBlock(block.id)}
                        delayLongPress={500}
                      >
                        <View style={[
                          styles.blockItem,
                          { backgroundColor: block.color },
                          styles.blockItemWorkspace,
                        ]}>
                          <Text style={styles.blockItemText}>{block.text}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              {workspaceBlocks.length > 0 && (
                <TouchableOpacity 
                  style={styles.checkButton}
                  onPress={handleCheckBlocks}
                >
                  <Text style={styles.checkButtonText}>Check Answer ✓</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Available blocks */}
            <View style={styles.blocksPool}>
              <Text style={styles.blocksPoolLabel}>🧩 Drag blocks to workspace:</Text>
              <View style={styles.blocksPoolContent}>
                {availableBlocks.map((block) => (
                  <DraggableBlock 
                    key={block.id} 
                    block={block}
                  />
                ))}
              </View>
            </View>

            {/* Hints */}
            {currentHintIndex < currentPageData.hints.length && (
              <View style={styles.hintContainer}>
                <Text style={styles.hintLabel}>💡 Hint {currentHintIndex + 1}:</Text>
                <Text style={styles.hintText}>{currentPageData.hints[currentHintIndex]}</Text>
              </View>
            )}
          </View>

          {output && (
            <Text style={styles.resultText}>{output}</Text>
          )}
        </>
      );
    }

    // Handle fill in blanks game
    if (currentPageData.type === 'fillInBlanks') {
      // Draggable Option Component
      const DraggableOption = ({ option }) => {
        const pan = useState(new Animated.ValueXY())[0];
        const [isDragging, setIsDragging] = useState(false);
        
        // Check if this option is already used
        const isUsed = Object.values(filledBlanks).some(filled => filled.id === option.id);

        const panResponder = useState(() =>
          PanResponder.create({
            onStartShouldSetPanResponder: () => !isUsed,
            onPanResponderGrant: (e, gesture) => {
              setIsDragging(true);
              // Don't use setOffset, just start from current position
            },
            onPanResponderMove: Animated.event(
              [
                null,
                { dx: pan.x, dy: pan.y },
              ],
              { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gesture) => {
              setIsDragging(false);
              
              // Get drop position
              const dropX = e.nativeEvent.pageX;
              const dropY = e.nativeEvent.pageY;
              
              // Check each blank from all code lines
              const blanks = [];
              currentPageData.codeLines.forEach(line => {
                line.parts.forEach(part => {
                  if (part.type === 'blank') {
                    blanks.push(part);
                  }
                });
              });
              
              // Try to drop on each blank
              let dropped = false;
              for (const blank of blanks) {
                if (handleBlankDrop(option, blank.id, dropX, dropY)) {
                  dropped = true;
                  break;
                }
              }
              
              // If not dropped on any blank, find the closest one
              if (!dropped && blanks.length > 0) {
                let closestBlank = null;
                let minDistance = Infinity;
                
                blanks.forEach(blank => {
                  const layout = blankLayouts[blank.id];
                  if (layout) {
                    const centerX = layout.x + layout.width / 2;
                    const centerY = layout.y + layout.height / 2;
                    const distance = Math.sqrt(
                      Math.pow(dropX - centerX, 2) + Math.pow(dropY - centerY, 2)
                    );
                    
                    // Only consider if within reasonable distance (300px)
                    if (distance < 300 && distance < minDistance) {
                      minDistance = distance;
                      closestBlank = blank;
                    }
                  }
                });
                
                if (closestBlank) {
                  setFilledBlanks(prev => ({
                    ...prev,
                    [closestBlank.id]: option
                  }));
                }
              }
              
              // Reset position
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false,
              }).start();
            },
          })
        )[0];

        return (
          <Animated.View
            style={[
              styles.draggableOptionContainer,
              {
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
                opacity: isDragging ? 0.8 : isUsed ? 0.3 : 1,
                zIndex: isDragging ? 99999 : 10,
                elevation: isDragging ? 99999 : 10,
                position: isDragging ? 'absolute' : 'relative',
              },
            ]}
            {...(isUsed ? {} : panResponder.panHandlers)}
          >
            <View style={[
              styles.optionBlock,
              { backgroundColor: option.color },
              isDragging && styles.optionBlockDragging,
              isUsed && styles.optionBlockUsed,
            ]}>
              <Text style={styles.optionBlockText}>{option.text}</Text>
            </View>
          </Animated.View>
        );
      };

      return (
        <>
          <View style={styles.fillInBlanksContainer}>
            {/* Code display with blanks */}
            <View style={styles.codeDisplayContainer}>
              <Text style={styles.codeDisplayLabel}>script.py</Text>
              <View style={styles.codeBlockContainer}>
                {currentPageData.codeLines.map((codeLine, lineIndex) => (
                  <View key={lineIndex} style={styles.codeLine}>
                    <Text style={styles.lineNumber}>{codeLine.line}</Text>
                    <View style={styles.codeLineContent}>
                      {codeLine.parts.map((part, partIndex) => {
                        if (part.type === 'text') {
                          return (
                            <Text key={partIndex} style={styles.codeText}>
                              {part.content}
                            </Text>
                          );
                        } else if (part.type === 'blank') {
                          return (
                            <View
                              key={partIndex}
                              style={styles.blankContainer}
                              onLayout={(event) => {
                                event.target.measure((x, y, width, height, pageX, pageY) => {
                                  setBlankLayouts(prev => ({
                                    ...prev,
                                    [part.id]: { x: pageX, y: pageY, width, height }
                                  }));
                                });
                              }}
                            >
                              {filledBlanks[part.id] ? (
                                <TouchableOpacity
                                  style={[
                                    styles.filledBlank,
                                    { backgroundColor: filledBlanks[part.id].color },
                                  ]}
                                  onPress={() => handleRemoveFromBlank(part.id)}
                                  activeOpacity={0.7}
                                >
                                  <Text style={styles.filledBlankText}>
                                    {filledBlanks[part.id].text}
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <View style={styles.emptyBlank}>
                                  <Text style={styles.emptyBlankText}>___</Text>
                                </View>
                              )}
                            </View>
                          );
                        }
                        return null;
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Check button */}
            {Object.keys(filledBlanks).length > 0 && (
              <TouchableOpacity 
                style={styles.checkButton}
                onPress={handleCheckFillInBlanks}
              >
                <Text style={styles.checkButtonText}>Check Answer ✓</Text>
              </TouchableOpacity>
            )}

            {/* Options pool */}
            <View style={styles.optionsPool}>
              <Text style={styles.optionsPoolLabel}>🧩 Drag to fill the blanks:</Text>
              <View style={styles.optionsPoolContent}>
                {currentPageData.options.map((option) => (
                  <DraggableOption 
                    key={option.id} 
                    option={option}
                  />
                ))}
              </View>
            </View>

            {/* Hints */}
            {currentHintIndex < currentPageData.hints.length && (
              <View style={styles.hintContainer}>
                <Text style={styles.hintLabel}>💡 Hint {currentHintIndex + 1}:</Text>
                <Text style={styles.hintText}>{currentPageData.hints[currentHintIndex]}</Text>
              </View>
            )}
          </View>

          {output && (
            <Text style={styles.resultText}>{output}</Text>
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
    <View style={{ flex: 1, backgroundColor: '#000000ff' }}>
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
    </ScrollView>
    
    {/* AI ChatBot - 左下角浮動按鈕 */}
    <AIChatBot />
  </View>
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
  questionContainer: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#D5FF5F',
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#2B2B3D',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D5FF5F',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#1A1A1A',
    borderColor: '#D5FF5F',
    borderWidth: 3,
  },
  optionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  feedbackContainer: {
    marginTop: 20,
  },
  explanationText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  // Drag match styles
  dragMatchContainer: {
    gap: 20,
  },
  itemsPool: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D5FF5F',
    zIndex: 100,
    elevation: 100,
  },
  poolTitle: {
    color: '#D5FF5F',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  poolItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    zIndex: 100,
  },
  draggableItemContainer: {
    margin: 5,
    position: 'relative',
  },
  draggableItem: {
    backgroundColor: '#2B2B3D',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D5FF5F',
    minWidth: 100,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  draggableItemActive: {
    backgroundColor: '#3C4D4D',
    borderColor: '#FFEB3B',
    elevation: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  draggableItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  dropZones: {
    flexDirection: 'row',
    gap: 10,
  },
  dropZone: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    minHeight: 150,
    zIndex: 1,
  },
  dropZoneHeader: {
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#666',
    alignItems: 'center',
  },
  dropZoneTitle: {
    color: '#D5FF5F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropZoneContent: {
    padding: 10,
    gap: 8,
    alignItems: 'center',
  },
  droppedItem: {
    backgroundColor: '#2B2B3D',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D5FF5F',
    width: '90%',
    alignItems: 'center',
  },
  droppedItemText: {
    color: '#D5FF5F',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  // Error fix styles
  errorFixContainer: {
    gap: 20,
  },
  errorPart: {
    padding: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: '#2B2B3D',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  errorPartHighlight: {
    backgroundColor: '#4A1A1A',
    borderColor: '#FF6B6B',
  },
  errorPartFixed: {
    backgroundColor: '#1A4A1A',
    borderColor: '#4ECDC4',
  },
  errorPartText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  errorPartTextHighlight: {
    color: '#FF6B6B',
  },
  errorHintContainer: {
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
  },
  errorHint: {
    color: '#D5FF5F',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 2,
  },
  errorPartSelected: {
    backgroundColor: '#3B3B4D',
    borderColor: '#FFEB3B',
    borderWidth: 3,
  },
  inputContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D5FF5F',
  },
  inputLabel: {
    color: '#D5FF5F',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2B2B3D',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D5FF5F',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  submitButton: {
    backgroundColor: '#D5FF5F',
    padding: 12,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Block building game styles
  blockBuildContainer: {
    gap: 20,
  },
  targetContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D5FF5F',
  },
  targetLabel: {
    color: '#D5FF5F',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  targetCode: {
    backgroundColor: '#2B2B3D',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  targetCodeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  workspaceContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    minHeight: 150,
  },
  workspaceLabel: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  workspace: {
    backgroundColor: '#0A0A0A',
    padding: 16,
    borderRadius: 8,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  workspacePlaceholder: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  workspaceBlocks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  workspaceBlockWrapper: {
    marginVertical: 4,
  },
  blocksPool: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
  },
  blocksPoolLabel: {
    color: '#D5FF5F',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  blocksPoolContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    zIndex: 100,
  },
  draggableBlockContainer: {
    margin: 5,
  },
  blockItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  blockItemWorkspace: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    elevation: 8,
  },
  blockItemDragging: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    elevation: 20,
    borderWidth: 3,
    borderColor: '#FFEB3B',
  },
  blockItemText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  checkButton: {
    backgroundColor: '#4ECDC4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  checkButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintContainer: {
    backgroundColor: '#2B2B3D',
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFE66D',
  },
  hintLabel: {
    color: '#FFE66D',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  // Fill in blanks styles
  fillInBlanksContainer: {
    gap: 20,
  },
  codeDisplayContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D5FF5F',
  },
  codeDisplayLabel: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  codeBlockContainer: {
    backgroundColor: '#2B2B3D',
    padding: 12,
    borderRadius: 8,
  },
  codeLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 30,
    marginVertical: 2,
  },
  lineNumber: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'monospace',
    marginRight: 12,
    minWidth: 25,
    textAlign: 'right',
  },
  codeLineContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  codeLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: '#2B2B3D',
    padding: 16,
    borderRadius: 8,
    minHeight: 60,
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'monospace',
    lineHeight: 24,
  },
  blankContainer: {
    marginHorizontal: 4,
    marginVertical: 2,
  },
  emptyBlank: {
    backgroundColor: '#0A0A0A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#4ECDC4',
    borderStyle: 'dashed',
    minWidth: 100,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBlankText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  filledBlank: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 100,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  filledBlankText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  optionsPool: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
  },
  optionsPoolLabel: {
    color: '#D5FF5F',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionsPoolContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    zIndex: 100,
  },
  draggableOptionContainer: {
    margin: 5,
  },
  optionBlock: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  optionBlockDragging: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    elevation: 20,
    borderWidth: 3,
    borderColor: '#FFEB3B',
  },
  optionBlockUsed: {
    opacity: 0.3,
  },
  optionBlockText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});