import React, { useState, useCallback } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Share } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { theme } from "../lib/theme";
import { t } from "../lib/i18n";
import { api } from "../lib/api";
import { useApp } from "../lib/AppContext";
import AdBanner from "../components/AdBanner";

const TYPES = ["caption", "ad", "post", "bio", "tweet", "story"];
const STYLES = ["funny", "professional", "emotional", "motivational", "casual"];
const DIALECTS = ["fusha", "gulf", "egyptian", "levantine"];

export default function GeneratorScreen({ route, navigation }) {
  const { user } = useApp();
  const [type, setType] = useState("caption");
  const [style, setStyle] = useState("casual");
  const [dialect, setDialect] = useState("fusha");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceId, setVoiceId] = useState("");
  const [tplName, setTplName] = useState("");
  const [showTpl, setShowTpl] = useState(false);

  // Load brand voices when screen focuses; apply incoming template params.
  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      if (!user) { setVoices([]); return; }
      try { const v = await api.listVoices(); if (active) setVoices(v); } catch {}
    })();
    const tpl = route.params?.template;
    if (tpl) {
      if (tpl.content_type) setType(tpl.content_type);
      if (tpl.style) setStyle(tpl.style);
      if (tpl.dialect) setDialect(tpl.dialect);
      navigation.setParams({ template: undefined });
    }
    return () => { active = false; };
  }, [user, route.params?.template]));

  const generate = async () => {
    if (!topic.trim()) return Alert.alert("تنبيه", "اكتب موضوع أولاً");
    setLoading(true);
    try {
      const r = await api.generateContent({ content_type: type, style, dialect, topic, language: "ar", brand_voice_id: voiceId || undefined });
      setResult(r.content);
    } catch { Alert.alert("خطأ", t.error); }
    finally { setLoading(false); }
  };

  const copy = async () => { await Clipboard.setStringAsync(result); Alert.alert("", t.copied); };
  const share = async () => { try { await Share.share({ message: result }); } catch {} };

  const saveTemplate = async () => {
    if (!tplName.trim()) return;
    try {
      await api.createTemplate({ name: tplName.trim(), kind: "content", content_type: type, style, dialect });
      Alert.alert("", t.templateSaved);
      setTplName(""); setShowTpl(false);
    } catch (e) { Alert.alert("خطأ", e?.response?.data?.detail || t.error); }
  };

  const Chip = ({ label, active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.scr}>
      <AdBanner />
      <View style={styles.card}>
        <Text style={styles.label}>{t.contentType}</Text>
        <View style={styles.row}>{TYPES.map((k) => <Chip key={k} label={t[k]} active={type === k} onPress={() => setType(k)} />)}</View>
        <Text style={styles.label}>{t.style}</Text>
        <View style={styles.row}>{STYLES.map((k) => <Chip key={k} label={t[k]} active={style === k} onPress={() => setStyle(k)} />)}</View>
        <Text style={styles.label}>{t.dialect}</Text>
        <View style={styles.row}>{DIALECTS.map((k) => <Chip key={k} label={t[k]} active={dialect === k} onPress={() => setDialect(k)} />)}</View>

        {voices.length > 0 && (
          <>
            <Text style={styles.label}>{t.useBrandVoice}</Text>
            <View style={styles.row}>
              <Chip label={t.noVoiceOption} active={!voiceId} onPress={() => setVoiceId("")} />
              {voices.map((v) => <Chip key={v.voice_id} label={v.name} active={voiceId === v.voice_id} onPress={() => setVoiceId(v.voice_id)} />)}
            </View>
          </>
        )}

        <Text style={styles.label}>{t.topic}</Text>
        <TextInput value={topic} onChangeText={setTopic} multiline placeholder={t.placeholder} placeholderTextColor={theme.textMuted} style={styles.input} />

        {user && (
          <View>
            {showTpl ? (
              <View style={styles.tplRow}>
                <TextInput value={tplName} onChangeText={setTplName} placeholder={t.templateName} placeholderTextColor={theme.textMuted} style={[styles.input, { flex: 1, minHeight: 0, paddingVertical: 8 }]} />
                <TouchableOpacity style={styles.amberBtn} onPress={saveTemplate}><Text style={styles.amberBtnText}>{t.save}</Text></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowTpl(true)} style={styles.tplToggle}><Text style={styles.tplToggleText}>{t.saveAsTemplate}</Text></TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={generate} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>{t.generate}</Text>}
        </TouchableOpacity>
      </View>

      {result ? (
        <View style={styles.outputCard}>
          <Text style={styles.outputLabel}>{t.output}</Text>
          <Text style={styles.outputText}>{result}</Text>
          <View style={styles.outputRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={generate}><Text style={styles.secondaryBtnText}>{t.regenerate}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={share}><Text style={styles.secondaryBtnText}>{t.share}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.amberBtn} onPress={copy}><Text style={styles.amberBtnText}>{t.copy}</Text></TouchableOpacity>
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
  label: { color: theme.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 12, marginBottom: 8, textTransform: "uppercase" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceHover, marginEnd: 6, marginBottom: 6 },
  chipActive: { borderColor: theme.amber, backgroundColor: "rgba(255,184,0,0.15)" },
  chipText: { color: theme.textSecondary, fontSize: 13 },
  chipTextActive: { color: theme.amber, fontWeight: "700" },
  input: { backgroundColor: theme.surfaceHover, borderRadius: 12, borderWidth: 1, borderColor: theme.borderSubtle, color: theme.text, padding: 14, minHeight: 80, textAlignVertical: "top", fontSize: 15 },
  tplRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  tplToggle: { marginTop: 12, alignItems: "flex-end" },
  tplToggleText: { color: theme.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  primaryBtn: { backgroundColor: theme.amber, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 14 },
  primaryBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },
  outputCard: { backgroundColor: theme.surface, marginHorizontal: 12, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,184,0,0.3)" },
  outputLabel: { color: theme.amber, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  outputText: { color: theme.text, fontSize: 16, lineHeight: 26 },
  outputRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  secondaryBtn: { flex: 1, backgroundColor: theme.surfaceHover, borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: theme.borderSubtle },
  secondaryBtnText: { color: theme.text, fontWeight: "600" },
  amberBtn: { flex: 1, backgroundColor: "rgba(255,184,0,0.15)", borderWidth: 1, borderColor: "rgba(255,184,0,0.3)", borderRadius: 10, padding: 12, alignItems: "center" },
  amberBtnText: { color: theme.amber, fontWeight: "700" },
});
