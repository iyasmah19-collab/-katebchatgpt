import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useApp } from "../lib/AppContext";
import { theme } from "../lib/theme";
import { Ionicons } from "@expo/vector-icons";

// Lazy import so the component renders even if module fails (e.g., in Expo Go)
let BannerAd, BannerAdSize, TestIds, mobileAds;
try {
  const ads = require("react-native-google-mobile-ads");
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
  mobileAds = ads.default;
} catch (e) {
  // Expo Go fallback — ads module not available
}

// Real Android Banner ID configured. iOS still uses test ID until iOS unit is created.
// In __DEV__ builds (Expo Go), TestIds are used to avoid serving real ads during development.
const BANNER_AD_UNIT_ID =
  Platform.OS === "android"
    ? (__DEV__ ? TestIds?.BANNER : "ca-app-pub-1908291820966789/1326136094")
    : (__DEV__ ? TestIds?.BANNER : "ca-app-pub-3940256099942544/2934735716");

let initialized = false;
async function initAdMob() {
  if (initialized || !mobileAds) return;
  initialized = true;
  try { await mobileAds().initialize(); } catch {}
}

export default function AdBanner() {
  const { user } = useApp();
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    initAdMob().then(() => setReady(true));
  }, []);

  if (user?.is_premium || hidden) return null;
  if (!BannerAd) {
    // Fallback placeholder if AdMob module unavailable (Expo Go)
    return (
      <View style={styles.fallback}>
        <Ionicons name="megaphone-outline" size={16} color={theme.amber} />
        <Text style={styles.fallbackText}>إعلان • ترقّى لـ Premium لإخفاء الإعلانات</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>إعلان</Text>
      {ready && (
        <BannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={() => setHidden(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 6,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  label: {
    color: theme.textMuted,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  fallback: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  fallbackText: {
    color: theme.textSecondary,
    fontSize: 12,
  },
});
