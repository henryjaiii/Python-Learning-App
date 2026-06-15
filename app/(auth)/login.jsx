import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ImageBackground,
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

// API base URL for Firebase Authentication
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3001' 
  : 'http://localhost:3001';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Validate input
    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 存儲用戶信息到 AsyncStorage
        await AsyncStorage.setItem('userEmail', data.user.email);
        await AsyncStorage.setItem('userUID', data.user.uid);
        await AsyncStorage.setItem('userDisplayName', data.user.displayName || '');

        Alert.alert("Success", `Welcome back, ${data.user.displayName || data.user.email}!`, [
          {
            text: "OK",
            onPress: () => router.push("/Home"),
          },
        ]);
      } else {
        Alert.alert("Error", data.error || "Invalid email or password");
      }
    } catch (error) {
      console.error('Login error:', error);
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
        <View style={styles.container}>
          {/*<SVGImages.Images.Logo height={95} width={88} style={styles.logo} />*/}
          <Text style={styles.title}>Sign In</Text>
          <InputComponent
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputComponent
            label="Password"
            placeholder="Enter your password"
            isPassword
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => router.push("/forgotpassword")}>
            <Text style={[styles.forgotPasswordText, styles.linkText]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
          {isLoading ? (
            <ActivityIndicator size="large" color="#D5FF5F" style={{ marginVertical: 20 }} />
          ) : (
            <CustomButton
              text="Login"
              onPress={handleLogin}
              accessibilityLabel="Login button"
              accessibilityRole="button"
            />
          )}

          <View style={styles.bottomContainer}>
            <Text style={styles.text}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={[styles.text, styles.linkText]}>Sign up</Text>
            </TouchableOpacity>
          </View>
    
        </View>
      </LinearGradient>
   
  );
};

export default LoginPage;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
  },
  container: {
    paddingHorizontal: 20,
    justifyContent: "center",
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: "StardosStencil_700Bold",
    marginBottom: 20,
    textAlign: "center",
    color: "white",
  },
  forgotPasswordText: {
    color: "#fff",
    fontFamily: "StardosStencil_700Bold",
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
    marginTop: 10,
  },
  orText: {
    color: "#BABABA",
    marginVertical: 20,
  },
  socialIconContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
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
    marginBottom: 20,
  },
});
