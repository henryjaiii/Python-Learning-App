import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import InputComponent from "../../components/InputComponent/InputComponent"; // Import the InputComponent
import CustomButton from "../../components/CustomButton/CustomButton";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    // Validate password match
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    // Handle password reset logic here

    // Show success alert
    Alert.alert("Success", "Your password has been reset.", [
      {
        text: "OK",
        onPress: () => router.push("login"), // Navigate to the login page after pressing OK
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.heading}>Reset Password</Text>
        </View>
        <Text style={styles.description}>
          Enter your current password and your new password. Confirm the new
          password to complete the reset process.
        </Text>
        <InputComponent
          label="New Password"
          placeholder="Enter your new password"
          isPassword
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <InputComponent
          label="Confirm New Password"
          placeholder="Confirm your new password"
          isPassword
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </ScrollView>
      <CustomButton
        text="Submit"
        onPress={handleSubmit}
        accessibilityLabel="Reset Password"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    paddingTop: 40,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    fontSize: 24,
    color: "#fff",
    marginRight: 10,
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
});

export default ResetPasswordPage;
