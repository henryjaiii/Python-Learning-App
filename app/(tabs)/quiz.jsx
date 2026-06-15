import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useFonts,
  StardosStencil_700Bold,
} from "@expo-google-fonts/stardos-stencil";

const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3001' 
  : 'http://localhost:3001';

const quiz = () => {
  const [fontsLoaded] = useFonts({
    StardosStencil_700Bold,
  });

  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons`);
      const data = await response.json();
      
      if (data.data) {
        console.log('Lessons data:', data.data[0]); // Log first lesson to see structure
        setLessons(data.data);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLesson = (lesson) => {
    console.log('Quiz selected for lesson:', lesson.name);
    router.push({
      pathname: '/quiz-detail',
      params: {
        lessonId: lesson.id,
        lessonName: lesson.name,
      },
    });
  };

  const renderLessonCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.lessonCard}
      onPress={() => handleSelectLesson(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>
            {item.title || item.name || 'Untitled'}
          </Text>
          <Text style={styles.lessonLevel}>
            {item.level ? item.level.charAt(0).toUpperCase() + item.level.slice(1) : 'N/A'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={28} color="#D5FF5F" />
      </View>
    </TouchableOpacity>
  );

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Quiz</Text>
        <ActivityIndicator size="large" color="#D5FF5F" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quiz</Text>
      <Text style={styles.subtitle}>Select a course to take the quiz</Text>
      
      <FlatList
        data={lessons}
        renderItem={renderLessonCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

export default quiz;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#222222",
    padding: 20,
    paddingTop: 50,
  },
  heading: {
    fontSize: 28,
    color: "#fff",
    marginBottom: 8,
    fontFamily: "StardosStencil_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#AAAAAA",
    marginBottom: 20,
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  lessonCard: {
    backgroundColor: "#333333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#D5FF5F",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lessonInfo: {
    flex: 1,
    marginRight: 12,
  },
  lessonTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "StardosStencil_700Bold",
    marginBottom: 6,
  },
  lessonLevel: {
    fontSize: 12,
    color: "#D5FF5F",
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
