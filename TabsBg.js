import React from "react";
  import Svg, { Defs, FeBlend, FeColorMatrix, FeComposite, FeFlood, FeGaussianBlur, FeOffset, Filter, LinearGradient, RadialGradient, Path, Rect, G, Stop, TSpan, Text, Image } from "react-native-svg";
  
  const TabsBg = () => (
    <Svg width="360" height="56" viewBox="0 0 360 56" fill="none" xmlns="http://www.w3.org/2000/svg">
  <G filter="url(#filter0_d_1055_326)">
  <Path d="M356.829 42H145.829C140.839 41.8704 136.678 41.4402 133.345 40.7061C128.604 39.7764 124.676 37.8592 121.56 34.9551C118.283 32.0536 114.987 27.829 111.674 22.2812L105.609 12.2275C104.589 10.5194 103.553 9.11 102.5 8H356.829V42Z" fill="#271911" fillOpacity="0.9" shape-rendering="crispEdges"/>
  </G>
  <G filter="url(#filter1_d_1055_326)">
  <Path d="M357 54H3V4H81.1514L81.1533 4.0127L81.4863 4.00781C81.6873 4.00432 81.8872 4.00291 82.085 4H87.542C90.2238 4.04715 92.4834 4.1684 94.3203 4.36816C97.2452 4.70655 99.5592 5.4842 101.261 6.7002C102.801 7.91906 104.308 9.76205 105.78 12.2275L111.845 22.2812C115.158 27.829 118.454 32.0536 121.73 34.9551C124.846 37.8592 128.775 39.7764 133.516 40.7061C136.849 41.4402 141.01 41.8704 146 42H357V54Z" fill="#261206" fillOpacity="0.9" shape-rendering="crispEdges"/>
  </G>
  <Defs>
  <Filter id="filter0_d_1055_326" x="99.7" y="4.2" width="259.929" height="39.6" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
  <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
  <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
  <FeOffset dy="-1"/>
  <FeGaussianBlur stdDeviation="1.4"/>
  <FeComposite in2="hardAlpha" operator="out"/>
  <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
  <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1055_326"/>
  <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1055_326" result="shape"/>
  </Filter>
  <Filter id="filter1_d_1055_326" x="0" y="0" width="360" height="56" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
  <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
  <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
  <FeOffset dy="-1"/>
  <FeGaussianBlur stdDeviation="1.5"/>
  <FeComposite in2="hardAlpha" operator="out"/>
  <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
  <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1055_326"/>
  <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1055_326" result="shape"/>
  </Filter>
  </Defs>
  </Svg>
  
  );
  
  export default TabsBg;