import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

/**
 * ShineText
 * --------
 * React Native equivalent of the web's `.shine-text` effect.
 * Renders gold-amber text with a soft glow that pulses subtly to feel "alive",
 * matching the visual language of the web header.
 *
 * Implementation notes:
 *  - Native `textShadow*` props produce the gold glow.
 *  - An Animated opacity loop pulses both the text and a thin highlight bar
 *    placed behind/over the text to mimic the moving shine from the web.
 *  - Uses only built-in `Animated` (no extra native deps) so it builds cleanly
 *    on EAS without adding native modules.
 */
export default function ShineText({ children, style, size = 22 }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  const textOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const highlightOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.35, 0],
  });

  return (
    <View style={styles.wrap}>
      <Animated.Text
        numberOfLines={1}
        allowFontScaling={false}
        style={[
          styles.text,
          { fontSize: size, opacity: textOpacity },
          style,
        ]}
      >
        {children}
      </Animated.Text>
      {/* Soft moving highlight overlay — gives a "shimmer" feel */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.highlight,
          { opacity: highlightOpacity },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  text: {
    color: "#ffd700",
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "rgba(255,184,0,0.75)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    includeFontPadding: false,
  },
  highlight: {
    position: "absolute",
    top: -2,
    bottom: -2,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.0)",
    // subtle inner glow approximation via shadow
    shadowColor: "#ffd700",
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
});
