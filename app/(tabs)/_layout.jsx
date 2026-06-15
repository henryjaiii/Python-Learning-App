import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import TabHome from "../../assets/SVGs/Files/TabHome";
import TabProfile from "../../assets/SVGs/Files/TabProfile";


import TabMyAppointments from "../../assets/SVGs/Files/TabMyAppointments";

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBarStyle,
        tabBarIconStyle: styles.tabBarIconStyle,
        tabBarLabelStyle: styles.tabBarLabelStyle,
      }}
    >
      {[
        { name: "Home", Component: TabHome },
        { name: "quiz", Component: TabMyAppointments },
        { name: "Profile", Component: TabProfile },
      ].map(({ name, Component }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: ({ focused }) => (
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.iconContainerFocused,
                ]}
              >
                <Component color={focused ? "black" : "white"} />
              </View>
            ),
          }}
        />
      ))}
    
    </Tabs>
  );
};

export default TabLayout;

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: "#222222",
    height: 80,
    justifyContent: "center",
    paddingBottom: 10,
    borderColor: "#222222",
  },
  tabBarIconStyle: {
    justifyContent: "center",
    alignItems: "center",
  },
  tabBarLabelStyle: {
    display: "none",
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent", // Default background
    borderRadius: 10,
    padding: 20,
  },
  iconContainerFocused: {
    backgroundColor: "#D5FF5F", // Background when focused
  },
});
