import { StyleSheet, View } from "react-native";
import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const TabBookAppointment = ({ color }) => {
  return (
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons name="calendar-check" size={24} color={color} />
    </View>
  );
};

export default TabBookAppointment;

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
