import * as React from "react";
import Svg, { Path } from "react-native-svg";

const TabProfile = ({ color = "white" }) => (
  <Svg
    width={25}
    height={24}
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path
      d="M4.73022 18C4.73022 16.9391 5.15165 15.9217 5.9018 15.1716C6.65194 14.4214 7.66936 14 8.73022 14H16.7302C17.7911 14 18.8085 14.4214 19.5587 15.1716C20.3088 15.9217 20.7302 16.9391 20.7302 18C20.7302 18.5304 20.5195 19.0391 20.1444 19.4142C19.7694 19.7893 19.2607 20 18.7302 20H6.73022C6.19979 20 5.69108 19.7893 5.31601 19.4142C4.94094 19.0391 4.73022 18.5304 4.73022 18Z"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <Path
      d="M12.7302 10C14.3871 10 15.7302 8.65685 15.7302 7C15.7302 5.34315 14.3871 4 12.7302 4C11.0734 4 9.73022 5.34315 9.73022 7C9.73022 8.65685 11.0734 10 12.7302 10Z"
      stroke={color}
      strokeWidth={2}
    />
  </Svg>
);

export default TabProfile;
