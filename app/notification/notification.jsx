import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons"; // Importing icons
import { router } from "expo-router";

const notifications = [
  {
    id: 1,
    timeCategory: "Today",
    icon: "calendar-outline", // Ionicons for appointments
    heading: "Tattoo Appointment Reminder",
    description:
      "Your appointment with Artist John is scheduled for today at 4 PM.",
    time: "2:00 PM",
  },
  {
    id: 2,
    timeCategory: "Today",
    icon: "brush", // MaterialIcons for new designs
    heading: "New Tattoo Design Available",
    description: "Check out the latest dragon tattoo design by Artist Sarah!",
    time: "11:30 AM",
  },
  {
    id: 3,
    timeCategory: "Earlier",
    icon: "information", // FontAwesome5 for information/tips
    heading: "Tattoo Care Tips",
    description:
      "Remember to keep your tattoo moisturized. Read more about aftercare tips.",
    time: "Yesterday, 6:00 PM",
  },
  {
    id: 4,
    timeCategory: "Earlier",
    icon: "calendar", // Ionicons for events
    heading: "Tattoo Convention",
    description: "Join us at the annual tattoo convention this weekend!",
    time: "2 days ago",
  },
];

const Notification = () => {
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Notification</Text>
        <View></View>
      </View>

      <ScrollView>
        {/* Today Section */}
        <Text style={styles.subHeading}>Today</Text>
        {notifications
          .filter((n) => n.timeCategory === "Today")
          .map((notification) => (
            <View key={notification.id} style={styles.notificationContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name={notification.icon} size={24} color="#000" />
              </View>
              <View style={styles.notificationTextContainer}>
                <Text style={styles.notificationHeading}>
                  {notification.heading}
                </Text>
                <Text style={styles.notificationDescription}>
                  {notification.description}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </View>
          ))}

        {/* Earlier Section */}
        <Text style={styles.subHeading}>Earlier</Text>
        {notifications
          .filter((n) => n.timeCategory === "Earlier")
          .map((notification) => (
            <View key={notification.id} style={styles.notificationContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name={notification.icon} size={24} color="#000" />
              </View>
              <View style={styles.notificationTextContainer}>
                <Text style={styles.notificationHeading}>
                  {notification.heading}
                </Text>
                <Text style={styles.notificationDescription}>
                  {notification.description}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </View>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#222222",
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  headerText: {
    color: "white",
    fontSize: 24,
    fontFamily: "StardosStencil_700Bold",
    marginLeft: 10,
  },
  subHeading: {
    color: "white",
    fontSize: 20,
    fontFamily: "StardosStencil_700Bold",
    marginTop: 20,
    marginBottom: 10,
  },
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#D5FF5F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationHeading: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  notificationDescription: {
    color: "#bbb",
    fontSize: 14,
    marginVertical: 2,
  },
  notificationTime: {
    color: "#777",
    fontSize: 12,
  },
});
