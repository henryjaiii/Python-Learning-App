import React, { useCallback } from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import Header from "../../screens/Home/Header";
import MapLearn from "../MapLearning"


// Memoize the Header component to prevent re-renders if the props don't change
const MemoizedHeader = React.memo(Header);

const Home = () => {
  // Combine the data into one array
  const data = [
    {
      id: "1",
      type: "header",
      content: <Header />,
      showHeading: false,
    },
   
    {
      id: "2",
      type: "Level",
      content: <MapLearn />,
      heading: "Level",
      showHeading: false,
    },
 
  ];

  // Memoize the renderItem function to prevent unnecessary re-renders
  const renderItem = useCallback(({ item }) => {
    return (
      <View style={styles.sectionContainer}>
        {item.showHeading && item.heading && (
          <Text style={styles.heading}>{item.heading}</Text>
        )}
        {item.content}
      </View>
    );
  }, []);

  return (
    <View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#000",
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 20, // Add margin between sections
  },
  heading: {
    fontSize: 22,
    color: "#fff",
    fontFamily: "StardosStencil_700Bold",
    marginBottom: 10, // Space between heading and content
  },
});
