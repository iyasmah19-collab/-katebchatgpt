import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { t } from "../lib/i18n";
import { api } from "../lib/api";
import { useApp } from "../lib/AppContext";

const CONTACT = {
  email: "accofamd@gmail.com",
  instagramHandle: "amd._.shn",
  instagramUrl: "https://www.instagram.com/amd._.shn/",
  telegramHandle: "@ahmadshamaseen7",
  telegramUrl: "https://t.me/ahmadshamaseen7",
};

const openExternal = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("خطأ", "تعذّر فتح الرابط");
    }
  } catch (e) {
    Alert.alert("خطأ", "تعذّر فتح الرابط");
  }
};

export default function SettingsScreen({ navigation }) {
  const { user, setUser, logout, unlockOwner } = useApp();
  const [unlockToken, setUnlockToken] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const doUnlock = async () => {
    if (!unlockToken.trim()) return;
    setUnlocking(true);
    try {
      await unlockOwner(unlockToken.trim());
      Alert.alert("نجح", "تم تفعيل Premium 🎉");
      setUnlockToken("");
    } catch {
      Alert.alert("خطأ", "Token غير صحيح");
    } finally { setUnlocking(false); }
  };

  if (!user) {
    return (
      <ScrollView style={styles.scr}>
        <View style={styles.section}>
          <Text style={styles.label}>أدخل رابطك السري (Owner)</Text>
          <TextInput value={unlockToken} onChangeText={setUnlockToken} placeholder="الـ Token"
            placeholderTextColor={theme.textMuted} style={styles.input} autoCapitalize="none" />
          <TouchableOpacity style={styles.btnPrimary} onPress={doUnlock} disabled={unlocking}>
            {unlocking ? <ActivityIndicator color="#000" /> : <Text style={styles.btnPrimaryText}>تفعيل Premium</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.getParent()?.navigate("Login")}>
          <Text style={styles.btnOutlineText}>تسجيل الدخول / إنشاء حساب</Text>
        </TouchableOpacity>
        <ContactSection />
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scr}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user.username || user.name || "?").charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{user.username || user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.is_premium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={12} color={theme.amber} />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>الحساب</Text>
        <Row icon="person" label="اسم المستخدم" value={user.username || "—"} />
        <Row icon="mail" label="البريد الإلكتروني" value={user.email} />
        <Row icon="finger-print" label="المعرف" value={user.user_id} />
      </View>

      <TouchableOpacity style={styles.btnDanger} onPress={async () => { await logout(); }}>
        <Ionicons name="log-out" size={18} color={theme.danger} />
        <Text style={styles.btnDangerText}>تسجيل خروج</Text>
      </TouchableOpacity>

      <ContactSection />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const ContactSection = () => (
  <View style={styles.section}>
    <Text style={styles.label}>تواصل معي</Text>

    <TouchableOpacity
      style={styles.contactRow}
      onPress={() => openExternal(`mailto:${CONTACT.email}`)}
      testID="settings-email-link"
    >
      <Ionicons name="mail" size={18} color={theme.textMuted} />
      <Text style={styles.contactText}>{CONTACT.email}</Text>
      <Ionicons name="open-outline" size={14} color={theme.textMuted} />
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.contactRow}
      onPress={() => openExternal(CONTACT.instagramUrl)}
      testID="settings-instagram-link"
    >
      <Ionicons name="logo-instagram" size={18} color="#E1306C" />
      <Text style={styles.contactText}>{CONTACT.instagramHandle}</Text>
      <Ionicons name="open-outline" size={14} color={theme.textMuted} />
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.contactRow, { borderBottomWidth: 0 }]}
      onPress={() => openExternal(CONTACT.telegramUrl)}
      testID="settings-telegram-link"
    >
      <Ionicons name="paper-plane" size={18} color="#29B6F6" />
      <Text style={styles.contactText}>{CONTACT.telegramHandle}</Text>
      <Ionicons name="open-outline" size={14} color={theme.textMuted} />
    </TouchableOpacity>

    <Text style={styles.madeBy}>Made By: Ahmad Al-Shamaseen (amd)</Text>
  </View>
);

const Row = ({ icon, label, value }) => (
  <View style={styles.row}>
    <Ionicons name={icon} size={16} color={theme.textMuted} />
    <View style={{ flex: 1, marginStart: 12 }}>
      <Text style={{ color: theme.textMuted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600" }}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  scr: { flex: 1, backgroundColor: theme.bg },
  profileCard: { backgroundColor: theme.surface, margin: 14, padding: 24, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: theme.borderSubtle },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,184,0,0.15)", borderWidth: 2, borderColor: "rgba(255,184,0,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { color: theme.amber, fontSize: 32, fontWeight: "900" },
  username: { color: theme.text, fontSize: 20, fontWeight: "800" },
  email: { color: theme.textMuted, fontSize: 13, marginTop: 2 },
  premiumBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(255,184,0,0.1)", borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,184,0,0.3)" },
  premiumText: { color: theme.amber, fontSize: 10, fontWeight: "800", marginStart: 4 },
  section: { backgroundColor: theme.surface, marginHorizontal: 14, marginBottom: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.borderSubtle },
  label: { color: theme.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
  input: { backgroundColor: theme.surfaceHover, color: theme.text, borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.borderSubtle },
  btnPrimary: { backgroundColor: theme.amber, padding: 14, borderRadius: 12, alignItems: "center" },
  btnPrimaryText: { color: "#000", fontWeight: "800" },
  btnOutline: { backgroundColor: theme.surface, padding: 14, marginHorizontal: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: theme.borderSubtle },
  btnOutlineText: { color: theme.text, fontWeight: "700" },
  btnDanger: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(255,59,48,0.1)", padding: 14, marginHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,59,48,0.3)" },
  btnDangerText: { color: theme.danger, fontWeight: "700", marginStart: 8 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
  contactText: { flex: 1, color: theme.text, fontSize: 14, fontWeight: "600", marginHorizontal: 12 },
  madeBy: { color: theme.textMuted, fontSize: 11, textAlign: "center", marginTop: 16, opacity: 0.7 },
});
