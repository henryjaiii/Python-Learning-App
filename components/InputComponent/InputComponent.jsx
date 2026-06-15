import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const InputComponent = ({
  label,
  placeholder,
  value,
  onChangeText,
  isPassword,
}) => {
  const [isSecureEntry, setIsSecureEntry] = useState(isPassword);

  const toggleSecureEntry = () => {
    setIsSecureEntry((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#bababa"
          secureTextEntry={isSecureEntry}
          value={value}
          onChangeText={onChangeText}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={toggleSecureEntry}
            style={styles.iconContainer}
          >
            <Ionicons
              name={isSecureEntry ? "eye-off" : "eye"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default InputComponent;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    marginBottom: 10,
    fontSize: 16,
    color: "#fff",
    fontFamily: "StardosStencil_700Bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(186, 186, 186, 0.4)", // Background color with 40% opacity
    borderRadius: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    color: "white", // Text color for input
    fontFamily: "StardosStencil_400Regular",
  },
  iconContainer: {
    padding: 10,
  },
});
