import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import InputComponent from "../../components/InputComponent/InputComponent";
import { useRouter } from "expo-router";
import CustomButton from "../../components/CustomButton/CustomButton";

const ForgotPasswordPage = () => {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    // Add logic for submitting the username to reset password
    Alert.alert(
      "Password Reset",
      "Instructions to reset your password have been sent to your email.",
      [
        {
          text: "OK",
          onPress: () => router.push("Otp"),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.heading}>Forgot Password</Text>
        </View>
        <Text style={styles.description}>
          Enter your username to receive instructions on how to reset your
          password.
        </Text>
        <InputComponent
          label="Username"
          placeholder="Enter your username"
          value={username}
          onChangeText={setUsername}
        />
      </ScrollView>
      <View style={styles.footer}>
        <CustomButton
          text="Submit"
          onPress={handleSubmit}
          accessibilityLabel="Submit button"
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 40,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 80, // Adjust bottom padding to prevent overlap with button
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  heading: {
    flex: 1,
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    fontFamily: "StardosStencil_700Bold",
  },
  description: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
    fontFamily: "StardosStencil_400Regular",
  },
  footer: {
    padding: 20,
    backgroundColor: "#000",
  },
});
