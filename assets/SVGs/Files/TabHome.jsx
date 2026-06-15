import * as React from "react";
import Svg, { Path } from "react-native-svg";

const TabHome = ({ color }) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path
      d="M2.36392 12.958C1.98392 10.321 1.79392 9.002 2.33492 7.875C2.87492 6.748 4.02592 6.062 6.32692 4.692L7.71192 3.867C9.79992 2.622 10.8459 2 11.9999 2C13.1539 2 14.1989 2.622 16.2879 3.867L17.6729 4.692C19.9729 6.062 21.1239 6.748 21.6649 7.875C22.2049 9.002 22.0149 10.321 21.6349 12.958L21.3569 14.895C20.8699 18.283 20.6259 19.976 19.4509 20.988C18.2759 22 16.5529 22 13.1059 22H10.8939C7.44692 22 5.72392 22 4.54892 20.988C3.37392 19.976 3.12992 18.283 2.64292 14.895L2.36392 12.958Z"
      stroke={color}
      strokeWidth={1.5}
    />
    <Path d="M15 18H9" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

export default TabHome;
