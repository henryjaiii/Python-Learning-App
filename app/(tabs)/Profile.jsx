import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from "react-native";
import {
  useFonts,
  StardosStencil_700Bold,
} from "@expo-google-fonts/stardos-stencil";
import {
  AntDesign,
  FontAwesome5,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import CustomButton from "../../components/CustomButton/CustomButton";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLevel } from '../../context/LevelContext';
import { ProgressBar } from 'react-native-paper';

// API base URL
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3001' 
  : 'http://localhost:3001';
const ProfileItems = [
  {
    id: 1,
    name: "Profile",
    icon: <FontAwesome5 name="user-circle" size={24} color="#D5FF5F" />,
  },
  {
    id: 2,
    name: "Language",
    icon: <Ionicons name="earth" size={24} color="#D5FF5F" />,
  },
  {
    id: 3,
    name: "Appointment",
    icon: (
      <MaterialCommunityIcons name="book-outline" size={24} color="#D5FF5F" />
    ),
  },
  {
    id: 4,
    name: "Cancellation Policy",
    icon: (
      <MaterialCommunityIcons
        name="file-excel-outline"
        size={24}
        color="#D5FF5F"
      />
    ),
  },
  {
    id: 5,
    name: "Terms and Conditions",
    icon: <Foundation name="clipboard-notes" size={24} color="#D5FF5F" />,
  },
  {
    id: 6,
    name: "Help & Support",
    icon: <AntDesign name="infocirlceo" size={24} color="#D5FF5F" />,
  },
  {
    id: 7,
    name: "Privacy Policy",
    icon: (
      <MaterialCommunityIcons
        name="pencil-circle-outline"
        size={24}
        color="#D5FF5F"
      />
    ),
  },
];

const Profile = () => {
  const [fontsLoaded] = useFonts({
    StardosStencil_700Bold,
  });

  const { currentLevel, currentLevelConfig } = useLevel();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [levelProgress, setLevelProgress] = useState({
    beginner: { completed: 0, total: 0, percentage: 0 },
    intermediate: { completed: 0, total: 0, percentage: 0 },
    advanced: { completed: 0, total: 0, percentage: 0 },
  });

  useEffect(() => {
    fetchUserData();
    fetchProgress();
  }, []);

  const fetchUserData = async () => {
    try {
      // 從 AsyncStorage 獲取已登入用戶信息
      const userEmail = await AsyncStorage.getItem('userEmail');
      const userUID = await AsyncStorage.getItem('userUID');

      if (!userEmail || !userUID) {
        // 用戶未登入，重定向到登入頁面
        console.log('No user logged in');
        setIsLoading(false);
        return;
      }

      // 從服務器獲取完整的用戶信息
      const response = await fetch(`${API_BASE_URL}/auth/user/${userUID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUserData(data.user);
      } else {
        console.error('Failed to fetch user data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const uid = await AsyncStorage.getItem('userUID');
      if (!uid) return;

      // Fetch user progress
      const progressResponse = await fetch(`${API_BASE_URL}/progress/${uid}`);
      const progressJson = await progressResponse.json();

      // Fetch all lessons
      const lessonsResponse = await fetch(`${API_BASE_URL}/lessons`);
      const lessonsJson = await lessonsResponse.json();
      
      // Extract lessons array from response
      const lessonsData = lessonsJson.data || lessonsJson;

      const newLevelProgress = {};
      const levels = ['beginner', 'intermediate', 'advanced'];

      // Calculate progress for each level
      levels.forEach(level => {
        const levelLessons = lessonsData.filter(lesson => lesson.level === level);
        const totalCount = levelLessons.length;

        let completedCount = 0;
        if (progressJson.progress) {
          const progressObj = progressJson.progress;
          completedCount = Object.values(progressObj).filter(p => p.level === level && p.completed).length;
        }

        const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        newLevelProgress[level] = {
          completed: completedCount,
          total: totalCount,
          percentage: percentage,
        };
      });

      setLevelProgress(newLevelProgress);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel'),
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            // 清除 AsyncStorage 中的用戶信息
            await AsyncStorage.removeItem('userEmail');
            await AsyncStorage.removeItem('userUID');
            await AsyncStorage.removeItem('userDisplayName');
            router.push('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Profile</Text>
      {!fontsLoaded || isLoading ? (
        <ActivityIndicator size="large" color="#D5FF5F" style={{ marginTop: 20 }} />
      ) : !userData ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.loadingText}>Please log in to view your profile</Text>
          <CustomButton text="Go to Login" onPress={() => router.push('/login')} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.userInfoContainer}>
            <FontAwesome5 name="user-circle" size={60} color="#D5FF5F" />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userData.username || userData.displayName || 'User'}</Text>
              <Text style={styles.userEmail}>{userData.email}</Text>
            </View>
          </View>

          {/* Beginner Level Card */}
          <View style={styles.progressCard}>
            <Text style={styles.progressCardLabel}>Beginner Level</Text>
            <ProgressBar 
              progress={levelProgress.beginner.percentage / 100} 
              color="#D5FF5F" 
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {levelProgress.beginner.completed} / {levelProgress.beginner.total} lessons ({Math.round(levelProgress.beginner.percentage)}%)
            </Text>
          </View>

          {/* Intermediate Level Card */}
          <View style={styles.progressCard}>
            <Text style={styles.progressCardLabel}>Intermediate Level</Text>
            <ProgressBar 
              progress={levelProgress.intermediate.percentage / 100} 
              color="#D5FF5F" 
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {levelProgress.intermediate.completed} / {levelProgress.intermediate.total} lessons ({Math.round(levelProgress.intermediate.percentage)}%)
            </Text>
          </View>

          {/* Advanced Level Card */}
          <View style={styles.progressCard}>
            <Text style={styles.progressCardLabel}>Advanced Level</Text>
            <ProgressBar 
              progress={levelProgress.advanced.percentage / 100} 
              color="#D5FF5F" 
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {levelProgress.advanced.completed} / {levelProgress.advanced.total} lessons ({Math.round(levelProgress.advanced.percentage)}%)
            </Text>
          </View>

          <View style={styles.profileItemsContainer}>
            {ProfileItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.profileItem}
                onPress={() => handleItemPress(item.id)}
              >
                <View style={styles.itemContent}>
                  {item.icon}
                  <Text style={styles.itemText}>{item.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <CustomButton text="Logout" onPress={handleLogout} />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const handleItemPress = (id) => {
  console.log(`Item with id ${id} pressed`); // Replace with actual navigation or action
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#222222",
    padding: 20,
    paddingTop: 40,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heading: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 20,
    fontFamily: "StardosStencil_700Bold",
    textAlign: "center",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  userDetails: {
    flexDirection: "column",
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 4,
    fontFamily: "StardosStencil_700Bold",
  },
  userEmail: {
    fontSize: 14,
    color: "#D5FF5F",
  },
  progressCard: {
    backgroundColor: "#333333",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#D5FF5F",
  },
  progressCardLabel: {
    fontSize: 16,
    color: "#D5FF5F",
    marginBottom: 10,
    fontFamily: "StardosStencil_700Bold",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#555555",
    marginBottom: 10,
  },
  progressText: {
    fontSize: 12,
    color: "#AAAAAA",
    textAlign: "center",
  },
  profileItemsContainer: {
    marginTop: 20,
  },
  profileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginLeft: 10,
    fontFamily: "StardosStencil_700Bold",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
});
