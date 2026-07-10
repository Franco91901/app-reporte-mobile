import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "../src/screens/LoginScreen";
import RegisterScreen from "../src/screens/RegisterScreen";
import { ActivityIndicator, View } from "react-native";
import { getToken } from "@/src/services/tokenService";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getToken();
        if (token) {
          router.replace("/(tabs)/home");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (showRegister) {
    return (
      <RegisterScreen onBackToLogin={() => setShowRegister(false)} />
    );
  }

  return <LoginScreen onGoToRegister={() => setShowRegister(true)} />;
}
