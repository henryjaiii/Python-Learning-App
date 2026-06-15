import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import InputComponent from "../../components/InputComponent/InputComponent";
import CustomButton from "../../components/CustomButton/CustomButton";
import SVGImages from "../../assets/SVGs/index";
import { AntDesign, Entypo, FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3001' 
  : 'http://localhost:3001';

const SignUpPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // 驗證輸入
    if (!trimmedUsername || !trimmedEmail || !trimmedPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // 驗證郵箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    // 驗證密碼長度
    if (trimmedPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    // 驗證密碼一致性
    if (trimmedPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // 調用註冊端點
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
          username: trimmedUsername,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 存儲用戶信息到 AsyncStorage
        await AsyncStorage.setItem('userEmail', data.user.email);
        await AsyncStorage.setItem('userUID', data.user.uid);
        await AsyncStorage.setItem('userDisplayName', data.user.displayName || '');

        Alert.alert("Success", "Account created successfully! Please log in.", [
          {
            text: "OK",
            onPress: () => router.push("/login"),
          },
        ]);
      } else {
        Alert.alert("Error", data.error || "Sign up failed");
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert("Error", "Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
  
      <LinearGradient
        colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.8)", "rgba(0, 0, 0, 1)"]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.container}>
         {/* <SVGImages.Images.Logo height={95} width={88} style={styles.logo} />*/}
          <Text style={styles.title}>Sign Up</Text>
       
          <InputComponent
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
          />
          <InputComponent
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputComponent
            label="Create Password"
            placeholder="At least 6 characters"
            isPassword
            value={password}
            onChangeText={setPassword}
          />
          <InputComponent
            label="Confirm Password"
            placeholder="Confirm your password"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {isLoading ? (
            <ActivityIndicator size="large" color="#D5FF5F" style={{ marginVertical: 20 }} />
          ) : (
            <CustomButton
              text="Sign Up"
              onPress={handleSignUp}
              accessibilityLabel="Sign Up button"
              accessibilityRole="button"
            />
          )}

          <View style={styles.bottomContainer}>
            <Text style={styles.text}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("login")}>
              <Text style={[styles.text, styles.linkText]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        {/*  <Text style={[styles.text, styles.orText]}>OR</Text>
          <View style={styles.socialIconContainer}>
            <TouchableOpacity style={styles.socialIcon}>
              <FontAwesome5 name="facebook" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <AntDesign name="google" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Entypo name="instagram" size={24} color="#FFF" />
            </TouchableOpacity>
          </View> */}
        </ScrollView>
      </LinearGradient>
   /// </ImageBackground>
  );
};

export default SignUpPage;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  gradient: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: "center",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: "StardosStencil_700Bold",
    textAlign: "center",
    color: "white",
  },
  text: {
    color: "#fff",
    fontFamily: "StardosStencil_700Bold",
    textAlign: "center",
  },
  linkText: {
    color: "#D5FF5F",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  orText: {
    color: "#BABABA",
    marginVertical: 15,
  },
  socialIconContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  socialIcon: {
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: "#fff",
    padding: 10,
    borderRadius: 15,
  },
  logo: {
    alignSelf: "center",
    marginBottom: 10,
  },
});
