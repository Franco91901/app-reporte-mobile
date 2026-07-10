import { Stack, useRouter, useSegments } from "expo-router";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect } from "react";
import { getToken } from "@/src/services/tokenService";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      const inTabsGroup = segments[0] === "(tabs)";

      // SIN TOKEN, SE EXPULSA A USUARIO
      if (!token && inTabsGroup) {
        router.replace("/");
      }
    };
    checkAuth();
  }, [segments]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
