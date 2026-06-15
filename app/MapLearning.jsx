import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import AIChatBot from '../components/AIChatBot/AIChatBot';
import { useLevel } from '../context/LevelContext';

const FIREBASE_API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3001' 
  : 'http://localhost:3001';

export default function LearningMap() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userUID, setUserUID] = useState(null);
  const [activeLayout, setActiveLayout] = useState('A');
  const router = useRouter();
  
  // Use Level Context
  const { currentLevel, currentLevelConfig } = useLevel();

  // Initialize and get user UID
  useEffect(() => {
    const getUserUID = async () => {
      const uid = await AsyncStorage.getItem('userUID');
      setUserUID(uid);
    };
    getUserUID();
  }, []);

  // Fetch user progress from Firebase
  const fetchUserProgress = async (uid) => {
    try {
      if (!uid) return {};
      
      const response = await fetch(`${FIREBASE_API_URL}/progress/${uid}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Fetched user progress from Firebase');
        return result.progress;
      }
      return {};
    } catch (error) {
      console.error('❌ Error fetching progress:', error);
      return {};
    }
  };

  // Fetch lessons by level from Firebase
  const fetchLessonsByLevel = async (level, uid) => {
    try {
      // Only set loading on initial load, not when switching levels
      if (data.length === 0) {
        setIsLoading(true);
      }
      console.log(`📚 Fetching ${level} lessons from Firebase...`);
      
      const response = await fetch(`${FIREBASE_API_URL}/lessons`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Get user progress
        const userProgress = await fetchUserProgress(uid);
        
        // Filter lessons by level, sort by order
        const lessons = result.data
          .filter(l => l.level === level)
          .sort((a, b) => a.order - b.order)
          .map((lesson, index) => ({
            ...lesson,
            progress: userProgress[lesson.id]?.progress || 0,
            completed: userProgress[lesson.id]?.completed || false,
            locked: index !== 0 && !userProgress[result.data.filter(l => l.level === level).sort((a, b) => a.order - b.order)[index - 1].id + '_completed']
          }));
        
        // Recalculate locked status
        for (let i = 0; i < lessons.length; i++) {
          if (i === 0) {
            lessons[i].locked = false;
          } else {
            lessons[i].locked = !lessons[i - 1].completed;
          }
        }
        
        console.log(`✅ Loaded ${lessons.length} ${level} lessons`);
        return lessons;
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch lessons:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };




  // Check completion status and unlock lessons
  useFocusEffect(
    useCallback(() => {
      const checkCompletions = async () => {
        try {
          // Fetch lessons from Firebase by current level (including user progress)
          const lessons = await fetchLessonsByLevel(currentLevel, userUID);
          
          if (lessons.length === 0) return;
          
          setData(lessons);
        } catch (error) {
          console.error('Error checking completions:', error);
        }
      };

      checkCompletions();
    }, [currentLevel, userUID])  // Reload when currentLevel or userUID changes
  );

  // Save lesson progress to Firebase
  const saveProgressToFirebase = async (lessonId, progress, completed = false) => {
    try {
      if (!userUID) return;
      
      const response = await fetch(`${FIREBASE_API_URL}/progress/${userUID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lessonId,
          progress: progress,
          level: currentLevel,
          completed: completed
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Progress saved for lesson ${lessonId}`);
      }
    } catch (error) {
      console.error('Error saving progress to Firebase:', error);
    }
  };

  const handlePress = (lesson) => {
    if (lesson.locked) return;
    console.log("Navigating to lesson:", lesson.id);
    
    // Navigate to different LearnCoure pages based on lesson id
    // lesson_5 = Python Output (order 1) → LearnCoure1
    // lesson_7 = Python Variables (order 2) → LearnCoure2
    if (lesson.id === 5) {
      router.push(`/LearnCoure1?id=${lesson.id}`);
    } else if (lesson.id === 7) {
      router.push(`/LearnCoure2?id=${lesson.id}`);
    } else {
      router.push(`/LearnCoure1?id=${lesson.id}`); // Default for other lessons
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
      {/* Title */}
      <View style={{ padding: 10, alignItems: 'center', zIndex: 1 }}>
        <Text style={{ color: '#D5FF5F', fontSize: 20, fontWeight: 'bold' }}>
          {currentLevelConfig.emoji} {currentLevelConfig.label}
        </Text>
        <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
          {data.length} lessons
        </Text>
        {/* Layout Switcher */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          {['A', 'B'].map(option => (
            <TouchableOpacity
              key={option}
              onPress={() => setActiveLayout(option)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 26,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: activeLayout === option ? '#D5FF5F' : '#333',
                backgroundColor: activeLayout === option ? '#D5FF5F' : '#111'
              }}
              activeOpacity={0.85}
            >
              <Text style={{
                color: activeLayout === option ? '#000' : '#fff',
                fontWeight: '600'
              }}>
                {option === 'A' ? 'Option 1' : 'Option 2'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D5FF5F" />
          <Text style={{ color: '#D5FF5F', marginTop: 12 }}>Loading lessons...</Text>
        </View>
      ) : (
        activeLayout === 'A' ? (
          <ScrollView
            contentContainerStyle={{
              alignItems: 'center',
              paddingVertical: 30,
              paddingBottom: 120, // Leave space for AI button
            }}
            showsVerticalScrollIndicator
            decelerationRate={0.985}
            scrollEventThrottle={16}
            nestedScrollEnabled={false}
            directionalLockEnabled
          >
            {data.map((lesson, index) => (
              <View key={lesson.id} style={{ alignItems: 'center', marginVertical: 20, width: 140 }}>
                <View
                  style={{
                    borderRadius: 14,
                    padding: 4,
                    borderWidth: 2,
                    borderColor: lesson.locked ? 'rgba(255,255,255,0.25)' : '#ffffff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TouchableOpacity
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: lesson.progress === 100 ? '#4CAF50' : lesson.locked ? '#444' : '#D5FF5F',
                    }}
                    onPress={() => handlePress(lesson)}
                    activeOpacity={lesson.locked ? 1 : 0.7}
                  >
                    <Ionicons
                      name={lesson.progress === 100 ? 'checkmark-circle' : lesson.locked ? 'lock-closed' : 'play'}
                      size={32}
                      color={lesson.progress === 100 ? 'white' : 'black'}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={{ color: 'white', marginTop: 10, textAlign: 'center', fontSize: 12 }}>
                  {lesson.title}
                </Text>
                <Text style={{ color: '#888', fontSize: 10, marginTop: 2 }}>
                  {lesson.estimatedTime} min
                </Text>

                {index < data.length - 1 && (
                  <View
                    style={{
                      top: 10,
                      width: 10,
                      height: 80,
                      backgroundColor: lesson.progress === 100 ? '#4CAF50' : '#6a5acd',
                      marginTop: 12,
                    }}
                  />
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingVertical: 28,
              paddingHorizontal: 18,
              paddingBottom: 120, // Leave space for AI button
              gap: 16,
            }}
            showsVerticalScrollIndicator
          >
            {data.map(lesson => (
              <View
                key={lesson.id}
                style={{
                  backgroundColor: '#111',
                  borderRadius: 18,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: lesson.locked ? '#2a2a2a' : '#D5FF5F40',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{lesson.title}</Text>
                    <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{lesson.estimatedTime} min • Order {lesson.order}</Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: lesson.locked ? '#222' : '#D5FF5F',
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 20,
                    }}
                    onPress={() => handlePress(lesson)}
                    disabled={lesson.locked}
                    activeOpacity={lesson.locked ? 1 : 0.8}
                  >
                    <Text style={{ color: lesson.locked ? '#555' : '#000', fontWeight: '700' }}>
                      {lesson.locked ? 'Locked' : 'Start'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#888', fontSize: 12 }}>Progress</Text>
                    <Text style={{ color: '#fff', fontSize: 12 }}>{lesson.progress}%</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: '#2a2a2a', borderRadius: 3 }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${lesson.progress}%`,
                        backgroundColor: lesson.progress === 100 ? '#4CAF50' : '#D5FF5F',
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </View>

                {lesson.completed && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                    <Ionicons name="ribbon" size={16} color="#4CAF50" />
                    <Text style={{ color: '#4CAF50', marginLeft: 6, fontSize: 12 }}>Completed</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )
      )}
    
    {/* AI ChatBot - Use different modes based on interface selection */}
    {/* Option A interface = with prompt restriction (short responses) */}
    {/* Option B interface = no prompt restriction (detailed responses) */}
    <AIChatBot mode={activeLayout} />
  </View>
  );
}