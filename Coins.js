import React from "react";
import Svg, { Defs, FeBlend, FeColorMatrix, FeComposite, FeFlood, FeGaussianBlur, FeOffset, Filter, LinearGradient, RadialGradient, Path, Rect, G, Stop, TSpan, Text, Image } from "react-native-svg";

const Coins = ({ 
  value = 10000, 
  width = 108, 
  height = 43,
  // Individual element size controls
  outerContainerRadius = 20, // border radius of outer container
  innerContainerRadius = 15, // border radius of inner gradient container
  innerContainerMargin = 6, // margin of inner container from outer
  textContainerRadius = 10, // border radius of text container
  textContainerPadding = 8, // padding inside text container
  charWidth = 9, // character width for text sizing
  containerRightMargin = 5, // distance from right edge
  iconTextGap = 0, // additional gap between icon and text container
  // Text properties
  fontSize = 18,
  textYOffset = 24.728, // vertical position of text
  // Coin icon scaling
  coinScale = 1, // scale factor for the coin icon (1 = original size)
  coinXOffset = 0, // horizontal offset for coin position
  coinYOffset = 0 // vertical offset for coin position
}) => {
  // Calculate dynamic width based on text length if needed
  const textLength = value.toString().length;
  const minWidth = 108;
  const dynamicWidth = Math.max(minWidth, width + (textLength > 4 ? (textLength - 4) * 8 : 0));
  
  // Calculate text container width based on actual text needs
  const textContainerWidth = (textLength + 2) * charWidth + (textContainerPadding * 2); // +2 for "00"
  const textContainerX = dynamicWidth - textContainerWidth - containerRightMargin - iconTextGap;
  
  // Calculate inner container dimensions
  const innerContainerWidth = dynamicWidth - (innerContainerMargin * 2);
  const innerContainerHeight = height - 10; // 5px margin top/bottom
  
  return (
    <Svg width={dynamicWidth} height={height} viewBox={`0 0 ${dynamicWidth} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <G filter="url(#filter0_i_1115_282)">
        <Rect width={dynamicWidth} height={height - 3} rx={outerContainerRadius} fill="#64544B"/>
      </G>
      <G filter="url(#filter1_d_1115_282)">
        <Rect x={innerContainerMargin} y="5" width={innerContainerWidth} height={innerContainerHeight} rx={innerContainerRadius} fill="url(#paint0_linear_1115_282)"/>
      </G>
      <G filter="url(#filter2_i_1115_282)">
        <Path d={`M${textContainerX} 20C${textContainerX} ${20 - textContainerRadius} ${textContainerX + textContainerRadius} 10 ${textContainerX + textContainerRadius} 10H${textContainerX + textContainerWidth - textContainerRadius}C${textContainerX + textContainerWidth - textContainerRadius/2} 10 ${textContainerX + textContainerWidth} ${20 - textContainerRadius} ${textContainerX + textContainerWidth} 20V20C${textContainerX + textContainerWidth} ${20 + textContainerRadius} ${textContainerX + textContainerWidth - textContainerRadius/2} 30 ${textContainerX + textContainerWidth - textContainerRadius} 30H${textContainerX + textContainerRadius}C${textContainerX + textContainerRadius} 30 ${textContainerX} ${20 + textContainerRadius} ${textContainerX} 20V20Z`} fill="#48360F"/>
      </G>
      
      {/* Coin graphic - with scaling and positioning controls */}
      <G transform={`scale(${coinScale}) translate(${coinXOffset}, ${coinYOffset})`}>
        <Path d="M30.2162 25.747C34.3865 21.42 34.8921 15.8031 32.7942 13.3661C32.4397 12.9544 30.5167 10.6884 30.303 10.4679C27.0595 7.12303 22.4842 10.2532 18.5678 14.3167C14.3976 18.6436 12.4217 23.2502 15.4986 26.2235C15.9005 26.6118 18.1826 28.6536 18.7173 28.9635C22.276 31.0264 26.5907 29.5088 30.2162 25.747Z" fill="url(#paint1_linear_1115_282)"/>
        <Path d="M30.4289 15.6998C30.4289 15.6998 33.5203 17.5665 33.6129 16.5734C33.8164 14.3907 30.2974 10.7072 30.2974 10.7072C30.2974 10.7072 31.1349 12.7693 30.4289 15.6998Z" fill="url(#paint2_linear_1115_282)"/>
        <Path d="M30.2162 25.747C31.2795 24.6439 32.1744 23.2941 32.7995 22.0593C29.1729 18.3723 26.1999 24.4707 24.2487 23.6988C20.342 22.1532 22.8286 9.72749 18.6584 14.0544C15.0668 17.7809 12.9407 22.2726 15.0101 25.5871C15.3436 26.1212 17.8056 28.3659 18.421 28.775C21.9626 31.1294 26.046 30.074 30.2162 25.747Z" fill="url(#paint3_linear_1115_282)"/>
        <Path d="M26.4825 21.7347C30.4812 17.3929 31.8705 12.1699 29.5857 10.0689C27.3008 7.96791 22.6939 9.18274 18.2084 14.1262C14.2405 18.4994 12.8205 23.691 15.1052 25.792C17.3901 27.893 22.4839 26.0766 26.4825 21.7347Z" fill="url(#paint4_linear_1115_282)"/>
        <Path d="M20.1677 15.966C22.6772 13.2349 25.7062 11.9072 27.0243 12.933C26.9483 12.8264 26.8628 12.7273 26.7663 12.6376C25.314 11.2899 22.0633 12.4651 19.5056 15.2625C16.9478 18.06 16.0517 21.4205 17.504 22.7682C17.5352 22.7972 17.5683 22.8234 17.6012 22.85C16.7011 21.5294 17.7742 18.5708 20.1677 15.966Z" fill="#B43303"/>
        <Path d="M24.7649 20.1436C27.3291 17.3531 28.3787 14.1556 27.1092 13.002C25.8397 11.8484 22.7319 13.1754 20.1677 15.9661C17.6035 18.7567 16.5539 21.9542 17.8233 23.1077C19.0928 24.2613 22.2006 22.9342 24.7649 20.1436Z" fill="url(#paint5_linear_1115_282)"/>
        <Path d="M20.88 16.7228C23.3511 14.0465 26.1892 12.5812 27.3746 13.3286C27.3011 13.2072 27.2137 13.0971 27.1092 13.002C25.8397 11.8484 22.7319 13.1754 20.1677 15.9661C17.6035 18.7567 16.5539 21.9542 17.8233 23.1077C17.8724 23.1524 17.9252 23.1919 17.9797 23.2293C17.3189 22.0451 18.5213 19.2773 20.88 16.7228Z" fill="url(#paint6_linear_1115_282)"/>
        <Path d="M16.4058 20.9456C16.5213 21.6592 16.7784 22.3704 17.3898 23.0041C18.456 24.1095 19.4416 23.8402 21.0057 23.7366C21.5112 23.7031 25.2138 23.2954 22.4111 24.8613C19.4332 26.525 16.5803 26.8888 15.0462 25.2983C13.9381 24.1496 13.8088 22.2965 14.5646 20.3163C15.4462 18.0068 16.286 20.2063 16.4058 20.9456Z" fill="url(#paint7_linear_1115_282)"/>
        <Path d="M29.2932 9.54971C30.0973 10.061 30.9394 11.4659 30.8446 13.253C30.645 17.0173 28.5222 19.8717 26.517 22.0491C25.2656 23.4079 23.0375 25.2196 20.3735 26.0974C22.1445 25.4179 24.5328 23.6106 25.9217 22.2135C27.6837 20.4409 30.0206 17.3677 30.5576 14.3473C30.5531 14.3609 30.5494 14.3744 30.5448 14.388C30.6474 13.8501 30.6857 13.3294 30.6669 12.8392C30.6647 12.7883 30.6629 12.7374 30.6594 12.6868C30.6563 12.639 30.6523 12.5919 30.6481 12.5448C30.604 12.075 30.5008 11.6173 30.3295 11.1779C30.1483 10.7357 29.8995 10.3575 29.5858 10.069C28.1072 8.70938 25.4522 8.99038 22.6788 10.5347C26.2808 8.48695 28.1994 8.8541 29.2932 9.54971Z" fill="url(#paint8_linear_1115_282)"/>
        <Path d="M25.3009 25.5184C27.3378 25.3835 28.639 26.54 27.5965 27.6732C27.4726 27.8079 25.057 29.4157 22.6769 29.6704C19.6289 29.9965 16.8189 27.1961 16.8944 27.1312C17.0438 27.0026 18.6593 27.1707 20.1119 26.8671C23.1456 26.2331 24.0053 25.6042 25.3009 25.5184Z" fill="#DD3D84" fillOpacity="0.36"/>
        <Path d="M16.5544 18.1416C16.2945 18.684 16.4544 19.9144 16.6849 19.918C16.9155 19.9215 16.9584 19.3097 17.3518 18.4861C17.7514 17.6493 18.633 16.3796 18.4964 16.2325C18.3436 16.068 17.0914 17.0208 16.5544 18.1416Z" fill="white" fillOpacity="0.5"/>
        <Path d="M30.2801 15.4359C30.621 14.9126 30.8504 13.1271 30.6978 12.1265C30.469 10.6254 28.7955 8.83925 28.1649 9.60077C26.871 11.1632 29.538 16.575 30.2801 15.4359Z" fill="white" fillOpacity="0.47"/>
        <Path d="M26.3008 17.4434C27.6187 15.9887 27.9251 14.0835 26.9852 13.1881C26.0453 12.2926 24.215 12.746 22.8971 14.2007C21.5792 15.6554 21.2728 17.5605 22.2127 18.456C23.1526 19.3515 24.983 18.8981 26.3008 17.4434Z" fill="url(#paint9_linear_1115_282)"/>
      </G>
      
      {/* Dynamic text positioning - centered in the text container */}
      <Text fill="white" fontFamily="RacingSansOne-Regular" fontSize={fontSize} letterSpacing="0em">
        <TSpan x={textContainerX + textContainerWidth/2} y={textYOffset} textAnchor="middle">{value}00</TSpan>
      </Text>
      
      <Defs>
        <Filter id="filter0_i_1115_282" x="0" y="0" width={dynamicWidth} height="43.3" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
          <FeBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <FeOffset dy="4"/>
          <FeGaussianBlur stdDeviation="1.65"/>
          <FeComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.45 0"/>
          <FeBlend mode="normal" in2="shape" result="effect1_innerShadow_1115_282"/>
        </Filter>
        <Filter id="filter1_d_1115_282" x={innerContainerMargin - 4} y="5" width={innerContainerWidth + 8} height="38" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
          <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <FeOffset dy="4"/>
          <FeGaussianBlur stdDeviation="2"/>
          <FeComposite in2="hardAlpha" operator="out"/>
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1115_282"/>
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_282" result="shape"/>
        </Filter>
        <Filter id="filter2_i_1115_282" x={textContainerX} y="10" width={textContainerWidth} height="20.8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
          <FeBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <FeOffset dy="3"/>
          <FeGaussianBlur stdDeviation="0.4"/>
          <FeComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.44 0"/>
          <FeBlend mode="normal" in2="shape" result="effect1_innerShadow_1115_282"/>
        </Filter>
        <LinearGradient id="paint0_linear_1115_282" x1={dynamicWidth/2.2} y1="5" x2={dynamicWidth/2.2} y2="35" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FFFBF3"/>
          <Stop offset="0.221154" stopColor="#FFE7B3"/>
          <Stop offset="0.884615" stopColor="#FFF1D2"/>
          <Stop offset="1" stopColor="#DD792C"/>
        </LinearGradient>
        <LinearGradient id="paint1_linear_1115_282" x1="17.8507" y1="27.716" x2="32.7688" y2="12.2536" gradientUnits="userSpaceOnUse">
          <Stop offset="0.2352" stopColor="#E45F12"/>
          <Stop offset="0.3764" stopColor="#E56213"/>
          <Stop offset="0.4919" stopColor="#E66C15"/>
          <Stop offset="0.5983" stopColor="#EA7E19"/>
          <Stop offset="0.6993" stopColor="#EE961E"/>
          <Stop offset="0.7956" stopColor="#F4B425"/>
          <Stop offset="0.8135" stopColor="#F5BB27"/>
          <Stop offset="1" stopColor="#FA9911"/>
        </LinearGradient>
        <LinearGradient id="paint2_linear_1115_282" x1="10.8388" y1="15.2334" x2="23.1242" y2="37.1046" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FAC999"/>
          <Stop offset="0.1097" stopColor="#F8BF88"/>
          <Stop offset="1" stopColor="#E87400"/>
        </LinearGradient>
        <LinearGradient id="paint3_linear_1115_282" x1="20.0312" y1="23.7307" x2="33.3585" y2="12.4176" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#DD3D84" stopOpacity="0.52"/>
          <Stop offset="0.3736" stopColor="#EB8BB5"/>
          <Stop offset="0.7995" stopColor="#F9DEEA"/>
          <Stop offset="0.9944" stopColor="white"/>
        </LinearGradient>
        <LinearGradient id="paint4_linear_1115_282" x1="33.2668" y1="9.92974" x2="13.903" y2="28.1561" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#F5EF3C"/>
          <Stop offset="0.6257" stopColor="#EBBB1F"/>
          <Stop offset="0.933" stopColor="#EB6E46"/>
        </LinearGradient>
        <LinearGradient id="paint5_linear_1115_282" x1="33.4771" y1="13.2456" x2="13.5484" y2="24.4406" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#F79E10"/>
          <Stop offset="0.9944" stopColor="#F48A0B"/>
        </LinearGradient>
        <LinearGradient id="paint6_linear_1115_282" x1="17.6712" y1="17.22" x2="29.5437" y2="21.3388" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#F79E10"/>
          <Stop offset="0.9944" stopColor="#F48A0B"/>
        </LinearGradient>
        <LinearGradient id="paint7_linear_1115_282" x1="29.9279" y1="30.0448" x2="10.6614" y2="18.4183" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FAEE39"/>
          <Stop offset="0.6511" stopColor="#FAB12F"/>
          <Stop offset="1" stopColor="#FA952B"/>
        </LinearGradient>
        <LinearGradient id="paint8_linear_1115_282" x1="32.8483" y1="9.82489" x2="19.0742" y2="32.4112" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FAC999"/>
          <Stop offset="0.1097" stopColor="#F8BF88"/>
          <Stop offset="1" stopColor="#E87400"/>
        </LinearGradient>
        <LinearGradient id="paint9_linear_1115_282" x1="27.0214" y1="13.0334" x2="21.6531" y2="18.5841" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FA831D" stopOpacity="0.5"/>
          <Stop offset="0.4504" stopColor="#FCBF8A" stopOpacity="0.5"/>
          <Stop offset="0.8249" stopColor="#FEEDDE" stopOpacity="0.5"/>
          <Stop offset="0.9944" stopColor="white" stopOpacity="0.5"/>
        </LinearGradient>
      </Defs>
    </Svg>
  );
};

export default Coins;