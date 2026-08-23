import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { I18nManager, View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider, useApp } from "./src/lib/AppContext";
import { theme } from "./src/lib/theme";
import BrandHeader from "./src/components/BrandHeader";
import GeneratorScreen from "./src/screens/GeneratorScreen";
import HookScreen from "./src/screens/HookScreen";
import VaultScreen from "./src/screens/VaultScreen";
import LibraryScreen from "./src/screens/LibraryScreen";
import PremiumScreen from "./src/screens/PremiumScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import LoginScreen from "./src/screens/LoginScreen";

// Force RTL for Arabic
if (!I18nManager.isRTL) {
  try { I18nManager.allowRTL(true); I18nManager.forceRTL(true); } catch {}
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.amber,
    background: theme.bg,
    card: theme.surface,
    text: theme.text,
    border: theme.borderSubtle,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Custom branded header — logo on the LEFT, login/avatar on the RIGHT,
        // matching the web Header (see /app/frontend/src/components/Header.jsx).
        header: () => <BrandHeader />,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.borderSubtle,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.amber,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => {
          const map = {
            Generator: "create-outline",
            Hooks: "flash-outline",
            Vault: "lock-closed-outline",
            Library: "library-outline",
            Premium: "diamond-outline",
            Settings: "settings-outline",
          };
          return <Ionicons name={map[route.name] || "ellipse"} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Generator" component={GeneratorScreen} options={{ title: "المولّد" }} />
      <Tab.Screen name="Hooks" component={HookScreen} options={{ title: "هوكس" }} />
      <Tab.Screen name="Vault" component={VaultScreen} options={{ title: "الخزنة" }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: "مكتبتي" }} />
      <Tab.Screen name="Premium" component={PremiumScreen} options={{ title: "Premium" }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: "الإعدادات" }} />
    </Tab.Navigator>
  );
}

function RootNav() {
  const { loadingUser } = useApp();
  if (loadingUser) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.amber} size="large" />
      </View>
    );
  }
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: "modal" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <RootNav />
      </AppProvider>
    </SafeAreaProvider>
  );
}
