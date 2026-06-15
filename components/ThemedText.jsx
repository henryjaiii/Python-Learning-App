import { Text, StyleSheet } from "react-native";
import { useThemeColor } from "../hooks/useThemeColor";

const ThemedText = ({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}) => {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "default" && styles.default,
        type === "title" && styles.title,
        type === "defaultSemiBold" && styles.defaultSemiBold,
        type === "subtitle" && styles.subtitle,
        type === "link" && styles.link,
        style,
      ]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: "Lato_400Regular",
  },
  defaultSemiBold: {
    fontSize: 16,
    fontFamily: "InknutAntiqua_700Bold",
  },
  title: {
    fontSize: 24,
    fontFamily: "InknutAntiqua_700Bold",
  },
  subtitle: {
    fontSize: 20,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});

export default ThemedText;
