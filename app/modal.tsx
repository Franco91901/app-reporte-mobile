import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../src/services/api";

export default function CreateReportModal() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tipo: "TRANSITO",
    latitud: 0,
    longitud: 0,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos tu ubicación para el reporte",
        );
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setForm((prev) => ({
        ...prev,
        latitud: loc.coords.latitude,
        longitud: loc.coords.longitude,
      }));
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!form.titulo || !form.descripcion) {
      Alert.alert(
        "Campos incompletos",
        "Por favor, cuéntanos qué está pasando.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/incidentes", form);
      const incidenteId = res.data.id;

      if (image && incidenteId) {
        const formData = new FormData();
        const uri =
          Platform.OS === "android" ? image : image.replace("file://", "");

        // @ts-ignore
        formData.append("file", {
          uri: uri,
          type: "image/jpeg",
          name: `reporte_${incidenteId}.jpg`,
        });

        await api.post(`/incidentes/${incidenteId}/foto`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          transformRequest: (data) => data,
        });
      }

      Alert.alert("¡Listo!", "Tu reporte ha sido enviado con éxito.");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", "Hubo un problema al enviar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.mainContainer}
    >
      <Stack.Screen
        options={{
          title: "Reportar incidente en tu ubicación",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#000000" },
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* TÍTULO */}
          <Text style={styles.label}>¿Qué está sucediendo?</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Semáforo malogrado"
            placeholderTextColor="#999"
            onChangeText={(t) => setForm({ ...form, titulo: t })}
          />

          {/* SECCIÓN DE TIPO */}
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.chipRow}>
            {["TRANSITO", "INFRAESTRUCTURA", "LIMPIEZA"].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setForm({ ...form, tipo: t })}
                style={[styles.chip, form.tipo === t && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    form.tipo === t && styles.chipTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SECCIÓN DE DESCRIPCIÓN */}
          <Text style={styles.label}>Detalles adicionales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            placeholder="Describe la situación para ayudar a las autoridades..."
            placeholderTextColor="#999"
            onChangeText={(t) => setForm({ ...form, descripcion: t })}
          />

          {/* SECCIÓN DE IMAGEN */}
          <Text style={styles.label}>Evidencia visual</Text>
          <TouchableOpacity
            style={[
              styles.imageCard,
              image && { borderStyle: "solid", borderColor: "#007AFF" },
            ]}
            onPress={pickImage}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color="#007AFF" />
                <Text style={styles.imageText}>Adjuntar una fotografía</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* BOTÓN DE ACCIÓN */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitBtnText}>ENVIAR REPORTE CIUDADANO</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  backBtn: {
    padding: 5,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#444",
    marginBottom: 8,
    marginTop: 15,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: "#007AFF",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  chipTextActive: {
    color: "white",
  },
  imageCard: {
    width: "100%",
    height: 180,
    borderRadius: 15,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#007AFF22",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginTop: 5,
  },
  imagePlaceholder: {
    alignItems: "center",
  },
  imageText: {
    marginTop: 8,
    color: "#007AFF",
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  submitBtn: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  submitBtnDisabled: {
    backgroundColor: "#A0CFFF",
  },
  submitBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 1,
  },
  cancelBtn: {
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  cancelBtnText: {
    color: "#FF3B30",
    fontWeight: "600",
  },
});
