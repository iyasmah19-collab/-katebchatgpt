import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { setSessionToken } from "../lib/api";
import client from "../lib/api";
import { useApp } from "../lib/AppContext";
import { useGoogleSignIn } from "../lib/google-auth";

export default function LoginScreen({ navigation }) {
  const { setUser } = useApp();
  const [mode, setMode] = useState("login"); // login or signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signIn: googleSignIn, ready: googleReady } = useGoogleSignIn({
    onSuccess: (user) => {
      setGoogleLoading(false);
      setUser(user);
      navigation.goBack();
    },
    onError: (err) => {
      setGoogleLoading(false);
      Alert.alert("Google", err.message || "فشل تسجيل الدخول بـ Google");
    },
  });

  const submit = async () => {
    if (!email || !password) return Alert.alert("تنبيه", "أكمل الحقول");
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { email, password } : { email, password, username, name: username };
      const r = await client.post(path, body);
      // Backend returns a JWT in the body for mobile (in addition to a cookie for web).
      if (r.data?.token) {
        await setSessionToken(r.data.token);
      }
      setUser(r.data.user);
      navigation.goBack();
    } catch (e) {
      Alert.alert("خطأ", e.response?.data?.detail || "فشلت العملية");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    if (!googleReady) {
      Alert.alert("لحظة", "Google Sign-In ما زال يحمّل…");
      return;
    }
    setGoogleLoading(true);
    googleSignIn();
  };

  return (
    <ScrollView style={styles.scr} contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <View style={styles.card}>
        <Text style={styles.title}>مرحباً بك في كاتب</Text>
        <Text style={styles.subtitle}>سجّل دخول لحفظ توليداتك والوصول لميزات Premium</Text>

        {/* Google Sign-In button (primary CTA) */}
        <TouchableOpacity
          style={[styles.googleBtn, !googleReady && styles.googleBtnDisabled]}
          onPress={handleGoogle}
          disabled={googleLoading || !googleReady}
          activeOpacity={0.85}
        >
          {googleLoading ? (
            <ActivityIndicator color="#444" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.googleBtnText}>تسجيل الدخول بـ Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>أو</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setMode("login")} style={[styles.tab, mode === "login" && styles.tabActive]}>
            <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>دخول</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode("signup")} style={[styles.tab, mode === "signup" && styles.tabActive]}>
            <Text style={[styles.tabText, mode === "signup" && styles.tabTextActive]}>حساب جديد</Text>
          </TouchableOpacity>
        </View>

        {mode === "signup" && (
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="اسم المستخدم"
            placeholderTextColor={theme.textMuted}
            style={styles.input}
            autoCapitalize="none"
          />
        )}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="البريد الإلكتروني"
          placeholderTextColor={theme.textMuted}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="كلمة السر"
          placeholderTextColor={theme.textMuted}
          style={styles.input}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.btnText}>{mode === "login" ? "تسجيل دخول" : "إنشاء حساب"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scr: { flex: 1, backgroundColor: theme.bg },
  card: {
    backgroundColor: theme.surface,
    margin: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  title: { color: theme.gold, fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  subtitle: { color: theme.textMuted, fontSize: 13, textAlign: "center", marginBottom: 20, lineHeight: 20 },

  googleBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#DADCE0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  googleBtnDisabled: { opacity: 0.6 },
  googleBtnText: { color: "#202124", fontWeight: "700", fontSize: 15 },

  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 18, gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: theme.borderSubtle },
  dividerText: { color: theme.textMuted, fontSize: 12, fontWeight: "600" },

  tabs: { flexDirection: "row", backgroundColor: theme.surfaceHover, borderRadius: 10, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: theme.bg },
  tabText: { color: theme.textMuted, fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: theme.amber },
  input: {
    backgroundColor: theme.surfaceHover,
    color: theme.text,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    fontSize: 15,
    textAlign: "right",
  },
  btn: { backgroundColor: theme.amber, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  btnText: { color: "#000", fontWeight: "800", fontSize: 15 },
});
