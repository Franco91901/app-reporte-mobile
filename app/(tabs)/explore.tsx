import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  FlatList,
} from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import api, { API_URL } from "@/src/services/api";
import { votarIncidente } from "@/src/services/incidenteService";
import { Ionicons } from "@expo/vector-icons";

interface Incidente {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  latitud: number;
  longitud: number;
  fotoUrl?: string;
  usuarioNombres?: string;
  fecha?: string;
}

export default function ExploreSearchScreen() {
  const [loading, setLoading] = useState(false);
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [tipo, setTipo] = useState("TODOS");
  const [radio, setRadio] = useState(0.5);
  const [selectedInci, setSelectedInci] = useState<Incidente | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);

  const [region, setRegion] = useState({
    latitude: -12.0463,
    longitude: -77.0427,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.get("/incidentes/buscar", {
        params: {
          lat: region.latitude,
          lng: region.longitude,
          radio: radio,
          tipo: tipo,
        },
      });
      setIncidentes(res.data);
      setResultsModalVisible(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (tipoInci: string) => {
    switch (tipoInci) {
      case "TRANSITO":
        return "#FF9800";
      case "LIMPIEZA":
        return "#4CAF50";
      case "INFRAESTRUCTURA":
        return "#F44336";
      default:
        return "#007AFF";
    }
  };

  const getTipoIcon = (tipoInci: string) => {
    switch (tipoInci) {
      case "TRANSITO":
        return "car";
      case "LIMPIEZA":
        return "trash";
      case "INFRAESTRUCTURA":
        return "business";
      default:
        return "alert-circle";
    }
  };

  const getTipoColor = (tipoInci: string) => {
    switch (tipoInci) {
      case "TRANSITO":
        return "#FFF3E0";
      case "LIMPIEZA":
        return "#E8F5E9";
      case "INFRAESTRUCTURA":
        return "#FFEBEE";
      default:
        return "#E3F2FD";
    }
  };

  const handleSelectReport = (inci: Incidente) => {
    setResultsModalVisible(false);
    setSelectedInci(inci);
  };

  const handleVotar = async (incidenteId: number) => {
    setVotingLoading(true);
    try {
      const result = await votarIncidente(incidenteId);
      if (result.votado) {
        // Actualizar el incidente en la lista
        setIncidentes((prev) =>
          prev.map((inc) =>
            inc.id === incidenteId
              ? { ...inc, cantidadVotos: result.totalVotos }
              : inc
          )
        );
        // Actualizar el detalle si está abierto
        if (selectedInci && selectedInci.id === incidenteId) {
          setSelectedInci((prev) =>
            prev ? { ...prev, cantidadVotos: result.totalVotos } : prev
          );
        }
      } else {
        alert(result.mensaje || "No puedes votar por este reporte");
      }
    } catch (e) {
      console.error("Error al votar", e);
    } finally {
      setVotingLoading(false);
    }
  };

  const renderReportItem = ({ item }: { item: Incidente }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => handleSelectReport(item)}
    >
      <View style={[styles.reportIcon, { backgroundColor: getTipoColor(item.tipo) }]}>
        <Ionicons name={getTipoIcon(item.tipo)} size={24} color="#666" />
      </View>
      <View style={styles.reportInfo}>
        <Text style={styles.reportTitle} numberOfLines={1}>{item.titulo}</Text>
        <Text style={styles.reportType}>{item.tipo}</Text>
        {item.fecha && (
          <Text style={styles.reportDate}>
            {new Date(item.fecha).toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* FILTROS) */}
      <SafeAreaView edges={["top"]} style={styles.filterArea}>
        <View style={styles.filterCard}>
          <Text style={styles.label}>Filtros de Búsqueda</Text>
          <View style={styles.row}>
            {[
              { key: "TODOS", icon: "apps" },
              { key: "TRANSITO", icon: "car" },
              { key: "INFRAESTRUCTURA", icon: "business" },
              { key: "LIMPIEZA", icon: "trash" },
            ].map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTipo(t.key)}
                style={[styles.chip, tipo === t.key && styles.chipActive]}
              >
                <Ionicons
                  name={t.icon}
                  size={14}
                  color={tipo === t.key ? "white" : "#666"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: tipo === t.key ? "white" : "black" },
                  ]}
                >
                  {t.key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <Text style={styles.radioLabel}>
              Radio:{" "}
              {radio < 1
                ? `${(radio * 1000).toFixed(0)} m`
                : `${radio.toFixed(1)} km`}
            </Text>
            <View style={styles.radioControls}>
              <TouchableOpacity
                onPress={() => setRadio((r) => Math.max(0.1, r - 0.1))}
                style={styles.miniBtn}
              >
                <Text style={styles.btnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setRadio((r) => parseFloat((r + 0.1).toFixed(1)))
                }
                style={styles.miniBtn}
              >
                <Text style={styles.btnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.searchBtnText}>BUSCAR REPORTES AQUÍ</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* MAPA */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={(reg) => setRegion(reg)}
          showsCompass={false}
          showsScale={false}
          showsBuildings={false}
          showsIndoors={false}
        >
          <Circle
            center={{ latitude: region.latitude, longitude: region.longitude }}
            radius={radio * 1000}
            fillColor="rgba(0, 122, 255, 0.1)"
            strokeColor="rgba(0, 122, 255, 0.5)"
          />

          {incidentes.map((inc) => (
            <Marker
              key={inc.id}
              coordinate={{ latitude: inc.latitud, longitude: inc.longitud }}
              onPress={() => setSelectedInci(inc)}
            >
              <View style={styles.markerContainer}>
                <Ionicons
                  name={getTipoIcon(inc.tipo)}
                  size={20}
                  color="white"
                />
              </View>
            </Marker>
          ))}
        </MapView>

        <View style={styles.markerFixed} pointerEvents="none">
          <Ionicons name="location" size={40} color="#007AFF" />
        </View>
      </View>

      {/* MODAL DE RESULTADOS */}
      <Modal
        visible={resultsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setResultsModalVisible(false)}
      >
        <SafeAreaView style={styles.resultsSafeArea}>
          <View style={styles.resultsHeader}>
            <TouchableOpacity
              onPress={() => setResultsModalVisible(false)}
              style={styles.resultsBackBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.resultsHeaderTitle}>
              Reportes encontrados ({incidentes.length})
            </Text>
            <View style={styles.resultsHeaderSpacer} />
          </View>

          {incidentes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>No se encontraron reportes</Text>
              <Text style={styles.emptySubtext}>Intenta con otros filtros</Text>
            </View>
          ) : (
            <FlatList
              data={incidentes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderReportItem}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* MODAL DE DETALLES */}
      <Modal
        visible={!!selectedInci}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedInci(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedInci?.titulo}</Text>
              <TouchableOpacity onPress={() => setSelectedInci(null)}>
                <Ionicons name="close-circle" size={30} color="#ccc" />
              </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
              {selectedInci?.fotoUrl ? (
                <>
                  {imageLoading && (
                    <ActivityIndicator
                      style={styles.loader}
                      size="large"
                      color="#007AFF"
                    />
                  )}
                  <Image
                    key={selectedInci.id}
                    source={{
                      uri: `${API_URL}/uploads/${selectedInci.fotoUrl.trim()}`,
                    }}
                    style={styles.detailImage}
                    resizeMode="cover"
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                  />
                </>
              ) : (
                <View style={[styles.detailImage, styles.noImage]}>
                  <Ionicons name="image-outline" size={40} color="#ccc" />
                  <Text style={{ color: "#aaa" }}>Sin imagen disponible</Text>
                </View>
              )}
            </View>

            <View style={styles.detailTypeContainer}>
              <View style={[styles.detailTypeBadge, { backgroundColor: getTipoColor(selectedInci?.tipo || "") }]}>
                <Ionicons
                  name={getTipoIcon(selectedInci?.tipo || "")}
                  size={16}
                  color="#666"
                />
                <Text style={styles.detailType}>{selectedInci?.tipo}</Text>
              </View>
              {selectedInci?.fecha && (
                <Text style={styles.detailDate}>
                  {new Date(selectedInci.fecha).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              )}
            </View>

            <Text style={styles.detailDesc}>{selectedInci?.descripcion}</Text>

            <TouchableOpacity
              style={styles.voteButton}
              onPress={() => handleVotar(selectedInci?.id || 0)}
              disabled={votingLoading}
            >
              {votingLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="thumbs-up" size={20} color="white" />
                  <Text style={styles.voteButtonText}>
                    Yo también veo esto ({selectedInci?.cantidadVotos || 0})
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedInci(null)}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  filterArea: {
    backgroundColor: "white",
    elevation: 8,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  filterCard: { padding: 15 },
  label: { fontWeight: "bold", marginBottom: 10, fontSize: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 5,
  },
  chipActive: { backgroundColor: "#007AFF" },
  chipText: { fontSize: 12, fontWeight: "600" },
  radioLabel: { flex: 1, fontWeight: "500" },
  radioControls: { flexDirection: "row", alignItems: "center" },
  miniBtn: {
    backgroundColor: "#eee",
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  btnText: { fontSize: 20, fontWeight: "bold", color: "#007AFF" },
  searchBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  searchBtnText: { color: "white", fontWeight: "bold" },
  mapContainer: { flex: 1, marginTop: -5 },
  map: { ...StyleSheet.absoluteFillObject },
  markerFixed: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -20,
    marginTop: -40,
  },
  markerContainer: {
    backgroundColor: "#2196F3",
    padding: 6,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  // Estilos del modal de resultados
  resultsSafeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  resultsBackBtn: {
    padding: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
  },
  resultsHeaderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  resultsHeaderSpacer: {
    width: 40,
  },
  resultsList: {
    padding: 16,
  },
  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  reportType: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  reportDate: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
  // Estilos del modal de detalles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailCard: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", flex: 1 },
  imageContainer: {
    width: "100%",
    height: 180,
    marginBottom: 10,
    position: "relative",
  },
  detailImage: { width: "100%", height: 180, borderRadius: 10 },
  loader: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  noImage: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  detailTypeContainer: {
    marginBottom: 10,
  },
  detailTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
  },
  detailType: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  detailDate: {
    color: "#999",
    fontSize: 11,
    marginLeft: 8,
  },
  detailDesc: { color: "#444", marginBottom: 10, lineHeight: 20 },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
    gap: 8,
  },
  voteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});
