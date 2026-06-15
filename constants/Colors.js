/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    icon: "#757575",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    placeholder: "#757575",
    inputBg: "#F6F6F6",
    icon: "black",
    tabBg: "#fff",
    logoutBtnIcon: "black",
    fillIcon: "transparent",
    itemCountBg: "#F6F6F6",
    shipingAddressBg: "#F6F6F6",
  },
  dark: {
    text: "#fff",
    background: "#000",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    placeholder: "#BABABA",
    inputBg: "rgba(238,238,238,0.2)",
    icon: "white",
    tabBg: "#000",
    logoutBtnIcon: "red",
    fillIcon: "#CB9E36",
    itemCountBg: "#333333",
  },
};
