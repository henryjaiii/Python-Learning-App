import React, { useState, useRef } from "react";
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
import OtpInput from "../../components/InputComponent/OtpInput";
import CustomButton from "../../components/CustomButton/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const OtpPage = () => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputRefs = useRef([]);
  const router = useRouter();

  const handleChange = (index, text) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move focus to the next input if text is entered
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Move focus to the previous input if backspace is pressed and the field is empty
    if (text === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const otpString = otp.join("");
    if (otpString.length === 6) {
      Alert.alert("OTP Submitted", `Your OTP is ${otpString}`, [
        { text: "OK", onPress: () => router.push("resetpassword") },
      ]);
    } else {
      Alert.alert("Error", "Please enter a valid OTP");
    }
  };

  const setRef = (index, ref) => {
    inputRefs.current[index] = ref;
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
          <Text style={styles.heading}>Otp</Text>
        </View>
        <Text style={styles.description}>
          Please enter the 6-digit OTP sent to your mobile number.
        </Text>
        <View style={styles.otpContainer}>
          {otp.map((value, index) => (
            <OtpInput
              key={index}
              index={index}
              value={value}
              onChange={handleChange}
              setRef={setRef}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <CustomButton
          text="Verify"
          onPress={handleSubmit}
          accessibilityLabel="Submit OTP"
        />
      </View>
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
    alignItems: "center",
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 20,
    width: "100%", // Ensure the button container takes the full width
  },
});

export default OtpPage;
