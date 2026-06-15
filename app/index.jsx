import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import SplashScreen from "../screens/SplashScreen";
import LoginPage from "./(auth)/login";



const Index = () => {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    // Set a timeout to hide the SplashScreen and show the Onboarding screen after 10 seconds
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 1000); // 10 seconds

    // Cleanup timeout if the component is unmounted
    return () => clearTimeout(timer);
  }, []);

  return (
    // {isSplashVisible ? <SplashScreen /> : <LoginPage />}
    <View style={styles.container}>
     
     {isSplashVisible ? <SplashScreen /> : <LoginPage />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Index;
