import React from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";
import ThemedView from "../components/ThemedView";

const HEADER_HEIGHT = 400;
const ParallaxScrollView = ({
  children,
  headerImage,
  headerBackgroundColor,
  headerOverlayContent,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const scrollRef = useAnimatedRef();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  return (
    <ThemedView style={styles.container}>
      <Animated.ScrollView ref={scrollRef} scrollEventThrottle={16}>
        <View>
          <Animated.View
            style={[
              styles.header,
              { backgroundColor: headerBackgroundColor[colorScheme] },
              headerAnimatedStyle,
            ]}
          >
            {headerImage}
            {headerOverlayContent}
          </Animated.View>
        </View>
        <ThemedView style={styles.content}>{children}</ThemedView>
      </Animated.ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
});

export default ParallaxScrollView;
