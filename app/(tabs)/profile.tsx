import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import api from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { removeToken } from "@/src/services/tokenService";

interface Usuario {
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/usuarios/perfil");
      setUser(res.data);
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      Alert.alert("Error", "No se pudieron cargar tus datos.");
    } finally {
      setLoading(false);
    }
  };

  // CERRAR SESION, BORRAR TOKEN Y VOLVER A LOGIN
  const handleLogout = async () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          try {
            await removeToken();
            setUser(null);
            router.replace("/");
          } catch (e) {
            console.error("Error al cerrar sesión", e);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.nombres.charAt(0)}
            {user?.apellidos.charAt(0)}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user?.nombres} {user?.apellidos}
        </Text>
        <Text style={styles.userRole}>
          {user?.rol === "ROLE_ADMIN" ? "Administrador" : "Ciudadano"}
        </Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={24} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Estado de cuenta</Text>
            <Text style={styles.infoValue}>Activa</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons
          name="log-out-outline"
          size={24}
          color="white"
          style={{ marginRight: 10 }}
        />
        <Text style={styles.logoutBtnText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginTop: 40, marginBottom: 30 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 5,
  },
  avatarText: { color: "white", fontSize: 32, fontWeight: "bold" },
  userName: { fontSize: 22, fontWeight: "bold", color: "#333" },
  userRole: { fontSize: 14, color: "#007AFF", fontWeight: "600", marginTop: 5 },
  infoSection: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    marginBottom: 30,
  },
  infoItem: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  infoTextContainer: { marginLeft: 15 },
  infoLabel: { fontSize: 12, color: "#888", textTransform: "uppercase" },
  infoValue: { fontSize: 16, color: "#333", fontWeight: "500" },
  logoutBtn: {
    backgroundColor: "#FF3B30",
    flexDirection: "row",
    padding: 18,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  logoutBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
