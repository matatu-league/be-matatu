import React from "react";
  import Svg, { Defs, FeBlend, FeColorMatrix, FeComposite, FeFlood, FeGaussianBlur, FeOffset, Filter, LinearGradient, RadialGradient, Path, Rect, G, Stop, TSpan, Text, Image } from "react-native-svg";
  
  const Stake = () => (
    <Svg width="155" height="30" viewBox="0 0 155 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <G filter="url(#filter0_i_1247_159)">
  <Text fill="#664330" fontFamily="RussoOne-Regular" fontSize="40" letterSpacing="0em"><TSpan x="1" y="28.94">A.G 200</TSpan></Text>
  </G>
  <Defs>
  <Filter id="filter0_i_1247_159" x="0.600098" y="0.599998" width="153.998" height="31.3" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
  <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
  <FeBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
  <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
  <FeOffset dy="4"/>
  <FeGaussianBlur stdDeviation="1.25"/>
  <FeComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
  <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.45 0"/>
  <FeBlend mode="normal" in2="shape" result="effect1_innerShadow_1247_159"/>
  </Filter>
  </Defs>
  </Svg>
  
  );
  
  export default Stake;