import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";

// Default styles for the button
const defaultStyles = {
  backgroundColor: "#D5FF5F",
  borderColor: "#D5FF5F",
  textColor: "#000",
};

const CustomButton = ({
  borderColor = defaultStyles.borderColor,
  textColor = defaultStyles.textColor,
  backgroundColor = defaultStyles.backgroundColor,
  text,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, { borderColor, backgroundColor }]}
      onPress={onPress}
    >
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 15,
  },
  text: {
    fontSize: 18,
    fontFamily: "StardosStencil_700Bold",
  },
});

export default CustomButton;
