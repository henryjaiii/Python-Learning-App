import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const AUTHLAYOUT = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
};

export default AUTHLAYOUT;

const styles = StyleSheet.create({});
