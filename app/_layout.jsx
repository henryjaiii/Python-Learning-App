import { StyleSheet, LogBox } from "react-native";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import {
  StardosStencil_400Regular,
  StardosStencil_700Bold,
} from "@expo-google-fonts/stardos-stencil";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { LevelProvider } from '../context/LevelContext';

// Disable all LogBox notifications (for demo purposes)
LogBox.ignoreAllLogs(true);

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const ROOTLAYOUT = () => {
  const [fontsLoaded, fontsError] = useFonts({
    StardosStencil_400Regular,
    StardosStencil_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) {
    return null; // Render nothing while fonts are loading
  }

  return (
    <LevelProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </LevelProvider>
  );
};

export default ROOTLAYOUT;
