import React, { useState, useCallback } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Share } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { t } from "../lib/i18n";
import { api } from "../lib/api";
import { useApp } from "../lib/AppContext";
import AdBanner from "../components/AdBanner";

const PLATFORMS = [
  { id: "instagram", icon: "logo-instagram", color: "#E1306C" },
  { id: "tiktok", icon: "logo-tiktok", color: "#fff" },
  { id: "shorts", icon: "logo-youtube", color: "#FF0000" },
];
const HOOK_TYPES = ["mixed", "shocking", "question", "secret", "challenge", "opinion", "story", "statistic", "contradiction"];
const DIALECTS = ["fusha", "gulf", "egyptian", "levantine"];

export default function HookScreen({ route, navigation }) {
  const { user } = useApp();
  const [platform, setPlatform] = useState("instagram");
  const [hookType, setHookType] = useState("mixed");
  const [dialect, setDialect] = useState("fusha");
  const [topic, setTopic] = useState("");
  const [hooks, setHooks] = useState("");
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceId, setVoiceId] = useState("");
  const [tplName, setTplName] = useState("");
  const [showTpl, setShowTpl] = useState(false);
  const isPremium = !!user?.is_premium;

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      if (!user) { setVoices([]); return; }
      try { const v = await api.listVoices(); if (active) setVoices(v); } catch {}
    })();
    const tpl = route.params?.template;
    if (tpl) {
      if (tpl.platform) setPlatform(tpl.platform);
      if (tpl.hook_type) setHookType(tpl.hook_type);
      if (tpl.dialect) setDialect(tpl.dialect);
      navigation.setParams({ template: undefined });
    }
    return () => { active = false; };
  }, [user, route.params?.template]));

  const generate = async () => {
    if (!topic.trim()) return Alert.alert("تنبيه", "اكتب موضوع");
    setLoading(true);
    try {
      const r = await api.generateHook({ platform, topic, hook_type: hookType, dialect, language: "ar", brand_voice_id: voiceId || undefined });
      setHooks(r.hooks);
    } catch { Alert.alert("خطأ", t.error); }
    finally { setLoading(false); }
  };

  const saveTemplate = async () => {
    if (!tplName.trim()) return;
    try {
      await api.createTemplate({ name: tplName.trim(), kind: "hook", platform, hook_type: hookType, dialect });
      Alert.alert("", t.templateSaved);
      setTplName(""); setShowTpl(false);
    } catch (e) { Alert.alert("خطأ", e?.response?.data?.detail || t.error); }
  };

  return (
    <ScrollView style={styles.scr}>
      <AdBanner />
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="flash" size={20} color={theme.cyan} />
          <Text style={styles.title}>{t.hooks}</Text>
          <View style={[styles.badge, isPremium && styles.badgePremium]}>
            <Text style={[styles.badgeText, isPremium && styles.badgeTextPremium]}>{isPremium ? t.premiumHookLimit : t.freeHookLimit}</Text>
          </View>
        </View>

        <Text style={styles.label}>{t.platform}</Text>
        <View style={styles.row}>
          {PLATFORMS.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => setPlatform(p.id)} style={[styles.platBtn, platform === p.id && styles.platBtnActive]}>
              <Ionicons name={p.icon} size={24} color={platform === p.id ? p.color : theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t.hookType}</Text>
        <View style={styles.row}>
          {HOOK_TYPES.map((h) => (
            <TouchableOpacity key={h} onPress={() => setHookType(h)} style={[styles.chip, hookType === h && styles.chipActive]}>
              <Text style={[styles.chipText, hookType === h && styles.chipTextActive]}>{t[h] || h}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t.dialect}</Text>
        <View style={styles.row}>
          {DIALECTS.map((d) => (
            <TouchableOpacity key={d} onPress={() => setDialect(d)} style={[styles.chip, dialect === d && styles.chipActive]}>
              <Text style={[styles.chipText, dialect === d && styles.chipTextActive]}>{t[d] || d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {voices.length > 0 && (
          <>
            <Text style={styles.label}>{t.useBrandVoice}</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setVoiceId("")} style={[styles.chip, !voiceId && styles.chipActive]}><Text style={[styles.chipText, !voiceId && styles.chipTextActive]}>{t.noVoiceOption}</Text></TouchableOpacity>
              {voices.map((v) => (
                <TouchableOpacity key={v.voice_id} onPress={() => setVoiceId(v.voice_id)} style={[styles.chip, voiceId === v.voice_id && styles.chipActive]}><Text style={[styles.chipText, voiceId === v.voice_id && styles.chipTextActive]}>{v.name}</Text></TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>{t.topic}</Text>
        <TextInput value={topic} onChangeText={setTopic} multiline placeholder="موضوع الفيديو..." placeholderTextColor={theme.textMuted} style={styles.input} />

        {user && (
          showTpl ? (
            <View style={styles.tplRow}>
              <TextInput value={tplName} onChangeText={setTplName} placeholder={t.templateName} placeholderTextColor={theme.textMuted} style={[styles.input, { flex: 1, minHeight: 0, paddingVertical: 8 }]} />
              <TouchableOpacity style={styles.amberBtn} onPress={saveTemplate}><Text style={styles.amberBtnText}>{t.save}</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowTpl(true)} style={styles.tplToggle}><Text style={styles.tplToggleText}>{t.saveAsTemplate}</Text></TouchableOpacity>
          )
        )}

        <TouchableOpacity style={styles.cyanBtn} onPress={generate} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.cyanBtnText}>{t.generateHooks}</Text>}
        </TouchableOpacity>
      </View>

      {hooks ? (
        <View style={styles.outputCard}>
          <Text style={styles.outputLabel}>Hooks</Text>
          <Text style={styles.outputText}>{hooks}</Text>
          <View style={styles.outputRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={async () => { try { await Share.share({ message: hooks }); } catch {} }}><Text style={styles.secondaryBtnText}>{t.share}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.amberBtn} onPress={async () => { await Clipboard.setStringAsync(hooks); Alert.alert("", t.copied); }}><Text style={styles.amberBtnText}>{t.copy}</Text></TouchableOpacity>
          </View>
        </View>
      ) : null}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scr: { flex: 1, backgroundColor: theme.bg },
  card: { backgroundColor: theme.surface, margin: 12, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.borderSubtle },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  title: { color: theme.text, fontSize: 17, fontWeight: "800", flex: 1, marginStart: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "rgba(0,229,255,0.1)", borderWidth: 1, borderColor: "rgba(0,229,255,0.3)" },
  badgePremium: { backgroundColor: "rgba(255,184,0,0.1)", borderColor: "rgba(255,184,0,0.3)" },
  badgeText: { color: theme.cyan, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  badgeTextPremium: { color: theme.amber },
  label: { color: theme.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 12, marginBottom: 8, textTransform: "uppercase" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  platBtn: { width: 56, height: 48, borderRadius: 12, borderWidth: 1, borderColor: theme.borderSubtle, alignItems: "center", justifyContent: "center", marginEnd: 8 },
  platBtnActive: { borderColor: theme.cyan, backgroundColor: "rgba(0,229,255,0.1)" },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceHover, marginEnd: 6, marginBottom: 6 },
  chipActive: { borderColor: theme.cyan, backgroundColor: "rgba(0,229,255,0.15)" },
  chipText: { color: theme.textSecondary, fontSize: 13 },
  chipTextActive: { color: theme.cyan, fontWeight: "700" },
  input: { backgroundColor: theme.surfaceHover, borderRadius: 12, borderWidth: 1, borderColor: theme.borderSubtle, color: theme.text, padding: 14, minHeight: 60, textAlignVertical: "top", fontSize: 15 },
  tplRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  tplToggle: { marginTop: 12, alignItems: "flex-end" },
  tplToggleText: { color: theme.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  cyanBtn: { backgroundColor: theme.cyan, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 14 },
  cyanBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },
  outputCard: { backgroundColor: "#000", marginHorizontal: 12, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(0,229,255,0.3)" },
  outputLabel: { color: theme.cyan, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  outputText: { color: theme.text, fontSize: 15, lineHeight: 24 },
  outputRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  secondaryBtn: { flex: 1, backgroundColor: theme.surfaceHover, borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: theme.borderSubtle },
  secondaryBtnText: { color: theme.text, fontWeight: "600" },
  amberBtn: { flex: 1, backgroundColor: "rgba(255,184,0,0.15)", borderWidth: 1, borderColor: "rgba(255,184,0,0.3)", borderRadius: 10, padding: 12, alignItems: "center" },
  amberBtnText: { color: theme.amber, fontWeight: "700" },
});
