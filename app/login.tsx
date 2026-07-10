import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { getToken, removeToken } from "../src/services/tokenService";
import LoginScreen from "../src/screens/LoginScreen";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkToken() {
      const token = await getToken();
      if (token) {
        router.replace("/(tabs)");
      }
      setIsLoading(false);
    }
    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <LoginScreen />;
}
