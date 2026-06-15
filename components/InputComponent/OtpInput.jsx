import React, { useRef, useEffect } from "react";
import { StyleSheet, TextInput, View } from "react-native";

const OtpInput = ({ index, value, onChange, setRef }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    setRef(index, inputRef.current);
  }, [index]);

  const handleChange = (text) => {
    onChange(index, text);
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        maxLength={1}
        keyboardType="number-pad"
        textAlign="center"
        onKeyPress={({ nativeEvent }) => {
          if (nativeEvent.key === "Backspace") {
            onChange(index, "");
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginHorizontal: 5,
  },
  input: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: "#D5FF5F",
    borderRadius: 10,
    backgroundColor: "#333",
    color: "#FFF",
    fontSize: 18,
    textAlign: "center",
  },
});

export default OtpInput;
