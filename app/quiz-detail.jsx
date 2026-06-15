import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  StardosStencil_700Bold,
} from "@expo-google-fonts/stardos-stencil";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3001' 
  : 'http://localhost:3001';

const QuizDetail = () => {
  const [fontsLoaded] = useFonts({
    StardosStencil_700Bold,
  });

  const { lessonId, lessonName } = useLocalSearchParams();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isLoadingScore, setIsLoadingScore] = useState(true);

  useEffect(() => {
    loadBestScore();
  }, [lessonId]);

  const loadBestScore = async () => {
    try {
      const uid = await AsyncStorage.getItem('userUID');
      if (!uid || !lessonId) return;

      const response = await fetch(`${API_BASE_URL}/progress/${uid}`);
      const data = await response.json();

      if (data.progress) {
        // Find quiz score for this lesson
        const lessonQuiz = Object.values(data.progress).find(
          (item) => item.lessonId === lessonId && item.type === 'quiz'
        );
        if (lessonQuiz && lessonQuiz.score) {
          setBestScore(lessonQuiz.score);
        }
      }
    } catch (error) {
      console.error('Error loading best score:', error);
    } finally {
      setIsLoadingScore(false);
    }
  };

  const saveQuizScore = async (finalScore) => {
    try {
      const uid = await AsyncStorage.getItem('userUID');
      if (!uid) return;

      // Save quiz score to Firebase
      await fetch(`${API_BASE_URL}/progress/${uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lessonId,
          lessonName: lessonName,
          type: 'quiz',
          score: finalScore,
          timestamp: new Date().toISOString(),
          completed: true,
        }),
      });
    } catch (error) {
      console.error('Error saving quiz score:', error);
    }
  };

  // Quick Quiz Data - 5 questions with diverse types
  const quickQuizzes = [
    {
      id: 1,
      type: 'mcq', // Multiple Choice Question
      question: "Which of the following is a mutable data type in Python?",
      options: ["int", "tuple", "list", "str"],
      correct: 2,
    },
    {
      id: 2,
      type: 'true-false',
      question: "Strings in Python are immutable.",
      options: ["True", "False"],
      correct: 0,
    },
    {
      id: 3,
      type: 'fill-blank',
      question: "The default data type for numbers with decimals in Python is ____.",
      answer: "float",
      placeholder: "Enter answer (e.g., float)",
    },
    {
      id: 4,
      type: 'mcq',
      question: "What is the data type of the expression: 10 > 5?",
      options: ["int", "str", "bool", "None"],
      correct: 2,
    },
    {
      id: 5,
      type: 'true-false',
      question: "Lists and tuples can be used interchangeably in all situations.",
      options: ["True", "False"],
      correct: 1,
    },
  ];

  // Advanced Challenge Data - 3 code-based questions
  const advancedChallenges = [
    {
      id: 6,
      type: 'code',
      question: "What will be the data type of x after this code?\nx = 5 + 2.5",
      options: ["int", "float", "str", "bool"],
      correct: 1,
    },
    {
      id: 7,
      type: 'mcq',
      question: "Which collection data type is ordered, changeable, and allows duplicates?",
      options: ["Set", "Dictionary", "List", "Tuple"],
      correct: 2,
    },
    {
      id: 8,
      type: 'code',
      question: "What data type is created by: x = {1, 2, 3}?",
      options: ["Tuple", "Set", "List", "Dictionary"],
      correct: 1,
    },
  ];

  const handleSelectAnswer = (questionId, optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionIndex,
    });
  };

  const handleFillBlankAnswer = (questionId, text) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: text,
    });
  };

  const checkAnswer = (question) => {
    const answer = selectedAnswers[question.id];
    if (question.type === 'fill-blank') {
      return answer && answer.toLowerCase().trim() === question.answer.toLowerCase();
    }
    return answer === question.correct;
  };

  const renderQuestion = (question) => {
    const { id, type, question: questionText, options, answer, placeholder } = question;
    const selectedAnswer = selectedAnswers[id];

    if (type === 'mcq' || type === 'true-false' || type === 'code') {
      return (
        <View key={id} style={styles.questionCard}>
          <Text style={styles.questionNumber}>
            Q{id}
          </Text>
          <Text style={styles.questionText}>{questionText}</Text>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.selectedOption,
              ]}
              onPress={() => handleSelectAnswer(id, index)}
            >
              <View
                style={[
                  styles.radioButton,
                  selectedAnswer === index && styles.radioSelected,
                ]}
              />
              <Text style={[
                styles.optionText,
                selectedAnswer === index && styles.selectedOptionText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    } else if (type === 'fill-blank') {
      return (
        <View key={id} style={styles.questionCard}>
          <Text style={styles.questionNumber}>Q{id}: [Fill in the Blank]</Text>
          <Text style={styles.questionText}>{questionText}</Text>
          <View style={styles.fillBlankContainer}>
            <TextInput
              style={styles.fillBlankInput}
              placeholder={placeholder}
              placeholderTextColor="#777"
              value={selectedAnswer || ''}
              onChangeText={(text) => handleFillBlankAnswer(id, text)}
            />
          </View>
        </View>
      );
    }
  };

  const handleSubmitQuiz = async () => {
    let correctCount = 0;
    const allQuestions = [...quickQuizzes, ...advancedChallenges];

    allQuestions.forEach((question) => {
      if (checkAnswer(question)) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / allQuestions.length) * 100);
    
    // Save score if it's better than the best score
    if (!bestScore || finalScore > bestScore) {
      await saveQuizScore(finalScore);
      setBestScore(finalScore);
    }

    setScore(finalScore);
    setShowResults(true);

    Alert.alert("Quiz Complete!", `Your Score: ${finalScore}%\n${correctCount}/${allQuestions.length} Correct`);
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#D5FF5F" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#D5FF5F" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.lessonTitle}>{lessonName || "Data Types"}</Text>
      <Text style={styles.subtitle}>Test Your Knowledge</Text>

      {!showResults ? (
        <>
          {/* Quick Quiz Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={24} color="#D5FF5F" />
              <Text style={styles.sectionTitle}>Quick Quiz (5 Questions)</Text>
            </View>
            {quickQuizzes.map((question) => renderQuestion(question))}
          </View>

          {/* Advanced Challenge Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="code-slash" size={24} color="#FFD700" />
              <Text style={styles.sectionTitle}>Advanced Challenge (3 Questions)</Text>
            </View>
            {advancedChallenges.map((question) => renderQuestion(question))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitQuiz}>
            <Text style={styles.submitButtonText}>Submit Quiz</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Ionicons 
            name={score >= 70 ? "checkmark-circle" : "close-circle"} 
            size={80} 
            color={score >= 70 ? "#D5FF5F" : "#FF6B6B"} 
          />
          <Text style={styles.resultTitle}>{score >= 70 ? "Great Job!" : "Try Again"}</Text>
          <Text style={styles.resultScore}>{score}%</Text>
          
          {/* Best Score Display */}
          {bestScore > 0 && (
            <View style={styles.bestScoreContainer}>
              <Text style={styles.bestScoreLabel}>Best Score:</Text>
              <Text style={styles.bestScoreValue}>{bestScore}%</Text>
              {score > bestScore && (
                <Text style={styles.newBestText}>🎉 New Personal Best! 🎉</Text>
              )}
            </View>
          )}
          
          <TouchableOpacity style={styles.retakeButton} onPress={() => {
            setSelectedAnswers({});
            setShowResults(false);
          }}>
            <Text style={styles.retakeButtonText}>Retake Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backToQuizButton} onPress={() => router.back()}>
            <Text style={styles.backToQuizButtonText}>Back to Courses</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default QuizDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#222222",
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backText: {
    color: "#D5FF5F",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  lessonTitle: {
    fontSize: 28,
    color: "#fff",
    fontFamily: "StardosStencil_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#AAAAAA",
    marginBottom: 25,
  },
  section: {
    backgroundColor: "#333333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#D5FF5F",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#D5FF5F",
    fontFamily: "StardosStencil_700Bold",
    marginLeft: 10,
  },
  questionCard: {
    backgroundColor: "#222222",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 8,
  },
  questionText: {
    fontSize: 14,
    color: "#D5FF5F",
    marginBottom: 12,
    fontWeight: "500",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#555555",
  },
  selectedOption: {
    backgroundColor: "#D5FF5F",
    borderColor: "#D5FF5F",
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#D5FF5F",
    marginRight: 10,
  },
  radioSelected: {
    backgroundColor: "#222222",
  },
  optionText: {
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
  },
  selectedOptionText: {
    color: "#222222",
    fontWeight: "600",
  },
  fillBlankContainer: {
    marginTop: 12,
  },
  fillBlankInput: {
    backgroundColor: "#222222",
    borderWidth: 1,
    borderColor: "#D5FF5F",
    borderRadius: 6,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#D5FF5F",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#222222",
    fontSize: 18,
    fontWeight: "bold",
  },
  resultContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  resultTitle: {
    fontSize: 28,
    color: "#D5FF5F",
    fontFamily: "StardosStencil_700Bold",
    marginTop: 20,
    marginBottom: 10,
  },
  resultScore: {
    fontSize: 48,
    color: "#FFFFFF",
    fontFamily: "StardosStencil_700Bold",
    marginBottom: 30,
  },
  bestScoreContainer: {
    backgroundColor: "#333333",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#FFD700",
    alignSelf: "stretch",
    marginHorizontal: 20,
  },
  bestScoreLabel: {
    fontSize: 14,
    color: "#AAAAAA",
    marginBottom: 8,
  },
  bestScoreValue: {
    fontSize: 32,
    color: "#FFD700",
    fontFamily: "StardosStencil_700Bold",
    marginBottom: 8,
  },
  newBestText: {
    fontSize: 14,
    color: "#D5FF5F",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  retakeButton: {
    backgroundColor: "#D5FF5F",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginBottom: 12,
  },
  retakeButtonText: {
    color: "#222222",
    fontSize: 16,
    fontWeight: "bold",
  },
  backToQuizButton: {
    backgroundColor: "#555555",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  backToQuizButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
