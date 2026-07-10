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
  Modal,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateReportModal({ visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tipo: "TRANSITO",
    latitud: 0,
    longitud: 0,
  });

  useEffect(() => {
    if (visible) {
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
    }
  }, [visible]);

  const pickImage = async () => {
    Alert.alert(
      "Agregar evidencia",
      "¿Cómo deseas agregar la fotografía?",
      [
        {
          text: "Tomar foto",
          onPress: takePhoto,
        },
        {
          text: "Elegir de galería",
          onPress: pickFromGallery,
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Necesitamos acceso a la cámara para tomar fotos",
      );
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
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
    if (!form.titulo) {
      Alert.alert(
        "Campo obligatorio",
        "Por favor, ingresa el asunto del reporte.",
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
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert("Error", "Hubo un problema al enviar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      titulo: "",
      descripcion: "",
      tipo: "TRANSITO",
      latitud: 0,
      longitud: 0,
    });
    setImage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reportar incidente en tu ubicación</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* TÍTULO */}
            <Text style={styles.label}>Asunto del reporte</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Semáforo malogrado"
              placeholderTextColor="#999"
              value={form.titulo}
              onChangeText={(t) => setForm({ ...form, titulo: t })}
            />

            {/* SECCIÓN DE TIPO */}
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.chipRow}>
              {[
                { key: "TRANSITO", icon: "car" },
                { key: "INFRAESTRUCTURA", icon: "business" },
                { key: "LIMPIEZA", icon: "trash" },
              ].map((t) => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setForm({ ...form, tipo: t.key })}
                  style={[styles.chip, form.tipo === t.key && styles.chipActive]}
                >
                  <Ionicons
                    name={t.icon}
                    size={16}
                    color={form.tipo === t.key ? "white" : "#666"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      form.tipo === t.key && styles.chipTextActive,
                    ]}
                  >
                    {t.key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* SECCIÓN DE DESCRIPCIÓN */}
            <Text style={styles.label}>Detalles adicionales (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder="Describe la situación..."
              placeholderTextColor="#999"
              value={form.descripcion}
              onChangeText={(t) => setForm({ ...form, descripcion: t })}
            />

            {/* SECCIÓN DE IMAGEN */}
            <Text style={styles.label}>Evidencia visual (opcional)</Text>
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
                <Text style={styles.submitBtnText}>ENVIAR REPORTE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClose}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backBtn: {
    padding: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
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
    flexDirection: "row",
    alignItems: "center",
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