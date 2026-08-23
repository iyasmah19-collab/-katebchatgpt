import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as RNIap from "react-native-iap";
import { theme } from "../lib/theme";
import { api } from "../lib/api";
import { useApp } from "../lib/AppContext";

// Subscription product IDs — these MUST exactly match the products created in
// Google Play Console (Monetize > Subscriptions) for package com.kateb.mobile.
const SUBSCRIPTION_SKUS = ["kateb_premium_monthly", "kateb_premium_yearly"];

const PLAN_META = {
  kateb_premium_monthly: { title: "شهري", fallbackPrice: "$5", period: "/شهر", featured: false },
  kateb_premium_yearly: { title: "سنوي", fallbackPrice: "$30", period: "/سنة", featured: true },
};

const FEATURES = [
  "+50 سر خوارزمية لكل منصة",
  "تحديث مع تحديثات المنصات",
  "أداة AI لمطابقة المحتوى",
  "بداية فيديو احترافية",
  "15 هوك بدل 5",
  "حفظ كل المحتوى المولّد",
  "بدون أي إعلانات",
];

export default function PremiumScreen() {
  const { user, refreshUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const listeners = useRef({ update: null, error: null });

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        await RNIap.initConnection();
        if (Platform.OS === "android") {
          try { await RNIap.flushFailedPurchasesCachedAsPendingAndroid(); } catch {}
        }
        const products = await RNIap.getSubscriptions({ skus: SUBSCRIPTION_SKUS });
        if (mounted) setSubs(products || []);

        listeners.current.update = RNIap.purchaseUpdatedListener(async (purchase) => {
          const purchaseToken = purchase.purchaseToken || purchase.transactionReceipt;
          const productId = purchase.productId;
          if (!purchaseToken) return;
          try {
            const result = await api.verifyPurchase(productId, purchaseToken);
            await RNIap.finishTransaction({ purchase, isConsumable: false });
            await refreshUser();
            if (result?.is_premium) {
              Alert.alert("تم التفعيل 🎉", "تم تفعيل اشتراك Premium بنجاح.");
            } else {
              Alert.alert("قيد المعالجة", "تم استلام عملية الشراء، سيتم تفعيل Premium بعد تأكيد Google Play.");
            }
          } catch (e) {
            Alert.alert("خطأ", "تعذّر التحقق من عملية الشراء. حاول مرة أخرى.");
          } finally {
            if (mounted) setPurchasing(false);
          }
        });

        listeners.current.error = RNIap.purchaseErrorListener((err) => {
          if (mounted) setPurchasing(false);
          if (err?.code !== "E_USER_CANCELLED") {
            Alert.alert("خطأ في الشراء", err?.message || "حدث خطأ غير متوقع");
          }
        });
      } catch (e) {
        // Billing unavailable (e.g. running outside Google Play build)
      } finally {
        if (mounted) setLoading(false);
      }
    }

    setup();

    return () => {
      mounted = false;
      listeners.current.update?.remove();
      listeners.current.error?.remove();
      RNIap.endConnection().catch(() => {});
    };
  }, [refreshUser]);

  const subscribe = async (sub) => {
    setPurchasing(true);
    try {
      const sku = sub.productId;
      const offerToken = sub?.subscriptionOfferDetails?.[0]?.offerToken;
      await RNIap.requestSubscription({
        sku,
        ...(Platform.OS === "android" && offerToken
          ? { subscriptionOffers: [{ sku, offerToken }] }
          : {}),
      });
    } catch (e) {
      setPurchasing(false);
      if (e?.code !== "E_USER_CANCELLED") {
        Alert.alert("خطأ", "تعذّر بدء عملية الشراء.");
      }
    }
  };

  if (user?.is_premium) {
    return (
      <View style={styles.center}>
        <Ionicons name="diamond" size={48} color={theme.amber} />
        <Text style={styles.premiumTitle}>أنت مشترك Premium ✓</Text>
        <Text style={styles.sub}>وصول كامل لكل الميزات. شكراً لدعمك!</Text>
      </View>
    );
  }

  // Render either live products from Play, or fallback placeholders.
  const rows = subs.length
    ? subs.map((s) => ({ sub: s, meta: PLAN_META[s.productId] || { title: s.productId, period: "" }, price: s?.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice }))
    : SUBSCRIPTION_SKUS.map((id) => ({ sub: null, meta: PLAN_META[id], price: null, id }));

  return (
    <ScrollView style={styles.scr}>
      <View style={styles.header}>
        <Ionicons name="diamond" size={32} color={theme.amber} />
        <Text style={styles.title}>Premium — افتح كل شيء</Text>
        <Text style={styles.sub}>وصول كامل لخزنة الأسرار + أداة المطابقة الذكية</Text>
        <View style={styles.payInfo}>
          <Text style={styles.payInfoText}>الدفع الآمن عبر Google Play — يُدار اشتراكك من المتجر</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.amber} style={{ marginTop: 30 }} />
      ) : (
        rows.map((row, i) => {
          const meta = row.meta || {};
          const price = row.price || meta.fallbackPrice || "";
          return (
            <View key={i} style={[styles.plan, meta.featured && styles.planFeatured]}>
              {meta.featured && (
                <View style={styles.badge}><Text style={styles.badgeText}>BEST VALUE</Text></View>
              )}
              <Text style={styles.planTitle}>{meta.title}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{price}</Text>
                <Text style={styles.period}>{meta.period}</Text>
              </View>
              {FEATURES.map((f, j) => (
                <View key={j} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.amber} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.btn, meta.featured ? styles.btnAmber : styles.btnWhite, (!row.sub || purchasing) && styles.btnDisabled]}
                disabled={!row.sub || purchasing}
                onPress={() => subscribe(row.sub)}
              >
                {purchasing ? (
                  <ActivityIndicator color={meta.featured ? "#000" : "#000"} />
                ) : (
                  <Text style={meta.featured ? styles.btnAmberText : styles.btnWhiteText}>
                    {row.sub ? "اشترك الآن" : "غير متوفر حالياً"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <Text style={styles.footer}>
        يتجدد الاشتراك تلقائياً عبر Google Play. يمكنك إلغاؤه في أي وقت من إعدادات الاشتراكات في متجر Google Play.
      </Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scr: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  premiumTitle: { color: theme.gold, fontSize: 22, fontWeight: "900", marginTop: 12 },
  header: { padding: 24, alignItems: "center" },
  title: { color: theme.text, fontSize: 24, fontWeight: "900", marginTop: 8, marginBottom: 6 },
  sub: { color: theme.textSecondary, fontSize: 13, textAlign: "center", marginTop: 4 },
  payInfo: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(0,176,80,0.1)", borderColor: "rgba(0,176,80,0.3)", borderWidth: 1, borderRadius: 999 },
  payInfoText: { color: "#7ee2a8", fontSize: 11 },
  plan: { backgroundColor: theme.surface, marginHorizontal: 14, marginBottom: 14, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.borderSubtle },
  planFeatured: { borderColor: "rgba(255,184,0,0.4)", backgroundColor: "rgba(255,184,0,0.05)" },
  badge: { position: "absolute", top: -10, end: 16, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: theme.amber, borderRadius: 999 },
  badgeText: { color: "#000", fontSize: 10, fontWeight: "800" },
  planTitle: { color: theme.text, fontSize: 20, fontWeight: "900", marginBottom: 6 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 16 },
  price: { color: theme.gold, fontSize: 38, fontWeight: "900" },
  period: { color: theme.textMuted, fontSize: 12, marginStart: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  featureText: { color: theme.textSecondary, fontSize: 13, marginStart: 8 },
  btn: { borderRadius: 12, padding: 14, alignItems: "center", marginTop: 14 },
  btnAmber: { backgroundColor: theme.amber },
  btnAmberText: { color: "#000", fontWeight: "800", fontSize: 15 },
  btnWhite: { backgroundColor: "#fff" },
  btnWhiteText: { color: "#000", fontWeight: "800", fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  footer: { color: theme.textMuted, fontSize: 11, textAlign: "center", paddingHorizontal: 24, marginTop: 8, lineHeight: 18 },
});
