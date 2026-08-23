import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, Share } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { t } from "../lib/i18n";
import { api } from "../lib/api";
import { useApp } from "../lib/AppContext";

const TABS = [
  { id: "history", label: t.historyTab, icon: "time-outline" },
  { id: "saved", label: t.savedTab, icon: "bookmark-outline" },
  { id: "templates", label: t.templatesTab, icon: "albums-outline" },
  { id: "voice", label: t.brandVoiceTab, icon: "mic-outline" },
];

export default function LibraryScreen({ navigation }) {
  const { user } = useApp();
  const [tab, setTab] = useState("history");

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons name="library-outline" size={48} color={theme.amber} />
        <Text style={styles.emptyTitle}>{t.library}</Text>
        <Text style={styles.emptyText}>{t.loginRequired}</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.getParent()?.navigate("Login")}>
          <Text style={styles.btnPrimaryText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.scr}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
        {TABS.map((tb) => (
          <TouchableOpacity key={tb.id} onPress={() => setTab(tb.id)} style={[styles.tabChip, tab === tb.id && styles.tabChipActive]}>
            <Ionicons name={tb.icon} size={15} color={tab === tb.id ? theme.amber : theme.textMuted} />
            <Text style={[styles.tabText, tab === tb.id && styles.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {tab === "history" && <HistoryTab />}
      {tab === "saved" && <SavedTab />}
      {tab === "templates" && <TemplatesTab navigation={navigation} />}
      {tab === "voice" && <VoiceTab />}
    </View>
  );
}

const shareText = async (text) => {
  try { await Share.share({ message: text }); } catch {}
};
const copyText = async (text) => { await Clipboard.setStringAsync(text); Alert.alert("", t.copied); };

function Actions({ text, onDelete }) {
  return (
    <View style={styles.actions}>
      <TouchableOpacity onPress={() => copyText(text)} style={styles.iconBtn}><Ionicons name="copy-outline" size={16} color={theme.textSecondary} /></TouchableOpacity>
      <TouchableOpacity onPress={() => shareText(text)} style={styles.iconBtn}><Ionicons name="share-social-outline" size={16} color={theme.cyan} /></TouchableOpacity>
      {onDelete && <TouchableOpacity onPress={onDelete} style={styles.iconBtn}><Ionicons name="trash-outline" size={16} color={theme.danger} /></TouchableOpacity>}
    </View>
  );
}

function useList(loader) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await loader()); } catch {} finally { setLoading(false); }
  }, [loader]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return { items, setItems, loading, reload: load };
}

function HistoryTab() {
  const { items, setItems, loading } = useList(api.listHistory);
  const remove = async (id) => { await api.deleteHistory(id); setItems((p) => p.filter((x) => x.hist_id !== id)); };
  const clear = () => Alert.alert("", t.clearHistory + "؟", [
    { text: "إلغاء", style: "cancel" },
    { text: t.clearHistory, style: "destructive", onPress: async () => { await api.clearHistory(); setItems([]); } },
  ]);
  if (loading) return <Loader />;
  return (
    <ScrollView contentContainerStyle={styles.list}>
      {items.length > 0 && (
        <TouchableOpacity onPress={clear} style={styles.clearBtn}><Ionicons name="trash-outline" size={14} color={theme.danger} /><Text style={styles.clearText}>{t.clearHistory}</Text></TouchableOpacity>
      )}
      {items.length === 0 ? <Empty text={t.noHistory} /> : items.map((g) => (
        <View key={g.hist_id} style={styles.card}>
          <Text style={styles.meta}>{t[g.content_type] || g.content_type}{g.dialect ? ` • ${t[g.dialect] || g.dialect}` : ""}</Text>
          <Text style={styles.body} numberOfLines={6}>{g.content}</Text>
          <Actions text={g.content} onDelete={() => remove(g.hist_id)} />
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SavedTab() {
  const { items, setItems, loading } = useList(api.listGen);
  const remove = async (id) => { await api.deleteGen(id); setItems((p) => p.filter((x) => x.gen_id !== id)); };
  if (loading) return <Loader />;
  return (
    <ScrollView contentContainerStyle={styles.list}>
      {items.length === 0 ? <Empty text={t.noSaved} /> : items.map((g) => (
        <View key={g.gen_id} style={styles.card}>
          <Text style={styles.meta}>{t[g.content_type] || g.content_type}</Text>
          <Text style={styles.body} numberOfLines={6}>{g.content}</Text>
          <Actions text={g.content} onDelete={() => remove(g.gen_id)} />
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function TemplatesTab({ navigation }) {
  const { items, setItems, loading } = useList(api.listTemplates);
  const remove = async (id) => { await api.deleteTemplate(id); setItems((p) => p.filter((x) => x.template_id !== id)); };
  const apply = (g) => {
    if (g.kind === "hook") navigation.navigate("Hooks", { template: g });
    else navigation.navigate("Generator", { template: g });
  };
  if (loading) return <Loader />;
  return (
    <ScrollView contentContainerStyle={styles.list}>
      {items.length === 0 ? <Empty text={t.noTemplates} /> : items.map((g) => (
        <View key={g.template_id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle} numberOfLines={1}>{g.name}</Text>
            <TouchableOpacity onPress={() => remove(g.template_id)} style={styles.iconBtn}><Ionicons name="trash-outline" size={16} color={theme.danger} /></TouchableOpacity>
          </View>
          <Text style={styles.meta}>
            {g.kind === "hook" ? `${t[g.platform] || g.platform || ""} • ${t[g.hook_type] || g.hook_type || ""}` : `${t[g.content_type] || ""} • ${t[g.style] || ""} • ${t[g.dialect] || ""}`}
          </Text>
          <TouchableOpacity onPress={() => apply(g)} style={styles.applyBtn}><Text style={styles.applyText}>{t.apply}</Text><Ionicons name="arrow-forward" size={14} color={theme.amber} /></TouchableOpacity>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function VoiceTab() {
  const { items, setItems, loading, reload } = useList(api.listVoices);
  const [name, setName] = useState("");
  const [samples, setSamples] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) return Alert.alert("", t.voiceName);
    if (samples.trim().length < 40) return Alert.alert("", t.pastePosts);
    setSaving(true);
    try {
      await api.createVoice({ name: name.trim(), samples: samples.trim() });
      Alert.alert("", t.voiceCreated);
      setName(""); setSamples(""); reload();
    } catch (e) { Alert.alert("خطأ", e?.response?.data?.detail || t.error); }
    finally { setSaving(false); }
  };
  const activate = async (id) => { await api.activateVoice(id); reload(); };
  const deactivate = async () => { await api.deactivateVoice(); reload(); };
  const remove = async (id) => { await api.deleteVoice(id); reload(); };

  return (
    <ScrollView contentContainerStyle={styles.list}>
      <Text style={styles.desc}>{t.brandVoiceDesc}</Text>
      <View style={styles.card}>
        <TextInput value={name} onChangeText={setName} placeholder={t.voiceName} placeholderTextColor={theme.textMuted} style={styles.input} />
        <TextInput value={samples} onChangeText={setSamples} placeholder={t.pastePosts} placeholderTextColor={theme.textMuted} style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]} multiline />
        <TouchableOpacity onPress={create} disabled={saving} style={styles.btnPrimary}>
          {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.btnPrimaryText}>{t.learnVoice}</Text>}
        </TouchableOpacity>
      </View>
      {loading ? <Loader /> : items.length === 0 ? <Empty text={t.noVoice} /> : items.map((v) => (
        <View key={v.voice_id} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{v.name}</Text>
              {v.is_active && <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>{t.activeVoiceLabel}</Text></View>}
            </View>
            <TouchableOpacity onPress={() => remove(v.voice_id)} style={styles.iconBtn}><Ionicons name="trash-outline" size={16} color={theme.danger} /></TouchableOpacity>
          </View>
          <Text style={styles.body} numberOfLines={4}>{v.profile}</Text>
          {v.is_active ? (
            <TouchableOpacity onPress={deactivate} style={styles.ghostBtn}><Text style={styles.ghostText}>{t.deactivateVoice}</Text></TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => activate(v.voice_id)} style={styles.applyBtn}><Text style={styles.applyText}>{t.activateVoice}</Text></TouchableOpacity>
          )}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const Loader = () => <View style={styles.center}><ActivityIndicator color={theme.amber} size="large" /></View>;
const Empty = ({ text }) => <View style={styles.emptyBox}><Text style={styles.emptyText}>{text}</Text></View>;

const styles = StyleSheet.create({
  scr: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  tabBar: { maxHeight: 56, paddingVertical: 10, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
  tabChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceHover },
  tabChipActive: { borderColor: theme.amber, backgroundColor: "rgba(255,184,0,0.12)" },
  tabText: { color: theme.textSecondary, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: theme.amber, fontWeight: "800" },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: theme.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.borderSubtle, gap: 8 },
  meta: { color: theme.cyan, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  body: { color: theme.text, fontSize: 14, lineHeight: 22 },
  cardTitle: { color: theme.text, fontSize: 15, fontWeight: "800", flex: 1 },
  actions: { flexDirection: "row", gap: 6, justifyContent: "flex-end", marginTop: 4 },
  iconBtn: { padding: 6 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  applyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(255,184,0,0.15)", borderWidth: 1, borderColor: "rgba(255,184,0,0.3)", borderRadius: 10, padding: 10, marginTop: 4 },
  applyText: { color: theme.amber, fontWeight: "700" },
  ghostBtn: { alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.borderSubtle, marginTop: 4 },
  ghostText: { color: theme.textMuted, fontWeight: "600" },
  clearBtn: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6, paddingVertical: 4 },
  clearText: { color: theme.danger, fontSize: 13, fontWeight: "600" },
  input: { backgroundColor: theme.surfaceHover, borderRadius: 10, borderWidth: 1, borderColor: theme.borderSubtle, color: theme.text, padding: 12, fontSize: 14 },
  btnPrimary: { backgroundColor: theme.amber, borderRadius: 12, padding: 13, alignItems: "center" },
  btnPrimaryText: { color: "#000", fontWeight: "800", fontSize: 15 },
  desc: { color: theme.textMuted, fontSize: 13, lineHeight: 20 },
  emptyBox: { padding: 30, alignItems: "center", borderWidth: 1, borderColor: theme.borderSubtle, borderStyle: "dashed", borderRadius: 14 },
  emptyTitle: { color: theme.text, fontSize: 20, fontWeight: "800" },
  emptyText: { color: theme.textMuted, fontSize: 14, fontStyle: "italic", textAlign: "center" },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: "rgba(52,199,89,0.12)", borderWidth: 1, borderColor: "rgba(52,199,89,0.3)" },
  activeBadgeText: { color: "#34C759", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
});
