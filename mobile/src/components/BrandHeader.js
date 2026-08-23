import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../lib/AppContext";
import { theme } from "../lib/theme";
import ShineText from "./ShineText";

/**
 * BrandHeader
 * -----------
 * Mirrors the web Header.jsx layout for the mobile app:
 *   • Visual LEFT  → Gold gradient logo tile (Sparkles) + Shine "كاتب" wordmark
 *   • Visual RIGHT → Login button (logged-out) or Avatar pill (logged-in)
 *
 * Layout direction is FORCED to LTR even when the device is in RTL mode so
 * the logo always sits on the visual left, matching the web spec:
 *   "الشعار عاليار من فوق وجنبه من اليمين اسم التطبيق".
 *
 * Used as the custom navigation header for every Tab screen via
 * `screenOptions.header` in App.js.
 */
export default function BrandHeader({ rightAction }) {
  const { user } = useApp();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // When RTL is on, `flexDirection: 'row'` lays children right-to-left. We
  // counteract that with 'row-reverse' so the visual order is always:
  // [Logo + Wordmark] ........ [Login / Avatar].
  const rowDir = I18nManager.isRTL ? "row-reverse" : "row";

  const initial = (user?.username || user?.name || "?").charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 4 },
      ]}
      testID="brand-header"
    >
      <View style={[styles.bar, { flexDirection: rowDir }]}>
        {/* LEFT — Brand mark (logo + shine wordmark) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Generator")}
          style={[styles.brand, { flexDirection: rowDir }]}
          testID="brand-link"
        >
          <LinearGradient
            colors={["#ffd34a", "#ffb800", "#d68f00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoTile}
          >
            <Ionicons name="sparkles" size={16} color="#000" />
          </LinearGradient>
          <ShineText size={22} style={styles.wordmark}>
            كاتب
          </ShineText>
        </TouchableOpacity>

        {/* RIGHT — Auth action (login button OR avatar pill) */}
        <View style={styles.rightSlot}>
          {rightAction ? (
            rightAction
          ) : user ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.avatarPill}
              onPress={() => navigation.navigate("Settings")}
              testID="header-avatar"
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              {user.is_premium && (
                <View style={styles.premiumDot}>
                  <Ionicons name="diamond" size={9} color="#000" />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                navigation
                  .getParent()
                  ?.navigate("Login")
              }
              style={styles.loginBtn}
              testID="header-login-btn"
            >
              <Ionicons name="log-in-outline" size={16} color="#000" />
              <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "rgba(5,5,5,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  bar: {
    height: 56,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  logoTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    // gold glow
    shadowColor: "#ffb800",
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  wordmark: {
    marginHorizontal: 4,
  },
  rightSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: theme.amber,
    shadowColor: "#ffb800",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  loginBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 13,
  },
  avatarPill: {
    position: "relative",
    padding: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,184,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,184,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: theme.amber,
    fontWeight: "900",
    fontSize: 14,
  },
  premiumDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ffd700",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: theme.bg,
  },
});
