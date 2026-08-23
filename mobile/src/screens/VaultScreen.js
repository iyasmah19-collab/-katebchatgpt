import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { t } from "../lib/i18n";
import { useApp } from "../lib/AppContext";
import { SECRETS, getISOWeek, seededShuffle } from "../lib/secrets-data";
import AdBanner from "../components/AdBanner";

const PLATFORMS = [
  { id: "instagram", icon: "logo-instagram", color: "#E1306C", label: "Instagram" },
  { id: "tiktok", icon: "logo-tiktok", color: "#fff", label: "TikTok" },
  { id: "shorts", icon: "logo-youtube", color: "#FF0000", label: "YT Shorts" },
];

export default function VaultScreen({ navigation }) {
  const { user } = useApp();
  const [active, setActive] = useState("instagram");
  const isPremium = !!user?.is_premium;
  const weekNum = getISOWeek();
  const data = SECRETS[active];
  const rotated = useMemo(() => seededShuffle(data.premium, weekNum + active.length), [active, weekNum]);

  return (
    <ScrollView style={styles.scr}>
      <AdBanner />
      <View style={styles.tabs}>
        {PLATFORMS.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => setActive(p.id)}
            style={[styles.tab, active === p.id && styles.tabActive]}>
            <Ionicons name={p.icon} size={20} color={active === p.id ? p.color : theme.textMuted} />
            <Text style={[styles.tabText, active === p.id && { color: theme.amber }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.weekBadge}>
        <Ionicons name="refresh" size={12} color={theme.amber} />
        <Text style={styles.weekText}>يُحدَّث أسبوعياً • الأسبوع {weekNum}</Text>
      </View>

      <Text style={styles.section}>{t.secretsFree}</Text>
      {data.free.map((sec, i) => <SecretCard key={i} secret={sec.ar} idx={i + 1} locked={false} />)}

      <View style={styles.premiumHeader}>
        <Text style={styles.section}>{t.secretsPremium}</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{data.premium.length} Premium</Text></View>
      </View>
      {rotated.map((sec, i) => (
        <SecretCard key={i} secret={sec.ar} idx={data.free.length + i + 1} locked={!isPremium} />
      ))}

      {!isPremium && (
        <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate("Premium")}>
          <Ionicons name="diamond" size={16} color="#000" />
          <Text style={styles.upgradeBtnText}>{t.unlockPremium}</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SecretCard({ secret, idx, locked }) {
  return (
    <View style={[styles.card, locked && styles.cardLocked]}>
      <Text style={styles.idx}>#{String(idx).padStart(2, "0")}</Text>
      <Text style={[styles.cardTitle, locked && styles.locked]}>
        {locked ? "🔒 ••••••••" : secret.title}
      </Text>
      <Text style={[styles.cardBody, locked && styles.lockedBody]}>
        {locked ? "Lorem ipsum dolor sit amet consectetur adipiscing." : secret.body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scr: { flex: 1, backgroundColor: theme.bg },
  tabs: { flexDirection: "row", margin: 12, backgroundColor: theme.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: theme.borderSubtle },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: "rgba(255,184,0,0.1)", borderWidth: 1, borderColor: "rgba(255,184,0,0.3)" },
  tabText: { color: theme.textMuted, fontSize: 12, fontWeight: "700", marginStart: 4 },
  weekBadge: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 12, marginBottom: 12, borderRadius: 999, backgroundColor: "rgba(255,184,0,0.1)", borderWidth: 1, borderColor: "rgba(255,184,0,0.3)" },
  weekText: { color: theme.amber, fontSize: 11, fontWeight: "700", marginStart: 4 },
  section: { color: theme.text, fontSize: 18, fontWeight: "800", marginHorizontal: 12, marginTop: 10, marginBottom: 8 },
  premiumHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 12, marginTop: 14 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "rgba(255,184,0,0.1)", borderWidth: 1, borderColor: "rgba(255,184,0,0.3)" },
  countText: { color: theme.amber, fontSize: 11, fontWeight: "700" },
  card: { backgroundColor: theme.surface, marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,184,0,0.18)" },
  cardLocked: { backgroundColor: "#0a0a0d", borderColor: theme.borderSubtle },
  idx: { color: theme.amber, fontSize: 11, fontWeight: "700", marginBottom: 4 },
  cardTitle: { color: theme.text, fontSize: 15, fontWeight: "800", marginBottom: 6 },
  locked: { color: theme.textMuted },
  cardBody: { color: theme.textSecondary, fontSize: 13, lineHeight: 20 },
  lockedBody: { color: "#27272a" },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.amber, marginHorizontal: 12, marginTop: 16, padding: 14, borderRadius: 12 },
  upgradeBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },
});
