import { View, StyleSheet } from "react-native";
import { useThemeColor } from "../hooks/useThemeColor";

const ThemedView = ({
  style,
  lightBackgroundColor,
  darkBackgroundColor,
  ...rest
}) => {
  const backgroundColor = useThemeColor(
    { light: lightBackgroundColor, dark: darkBackgroundColor },
    "background"
  );

  return <View style={[{ backgroundColor }, style]} {...rest} />;
};

export default ThemedView;
