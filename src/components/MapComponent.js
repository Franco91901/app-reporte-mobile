import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  ScrollView,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import api from "../services/api";
import { votarIncidente } from "../services/incidenteService";

export default function MapComponent({ onOpenModal }) {
  const [location, setLocation] = useState(null);
  const [incidentes, setIncidentes] = useState([]);
  const [selectedIncidentes, setSelectedIncidentes] = useState([]);
  const [panelVisible, setPanelVisible] = useState(false);
  const [detalleIncidente, setDetalleIncidente] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);

  // Cargar ubicación inicial
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);

  // Cargar incidentes del servidor
  useFocusEffect(
    useCallback(() => {
      const fetchMarkers = async () => {
        try {
          const res = await api.get("/incidentes");
          setIncidentes(res.data);
        } catch (e) {
          console.error("Error cargando marcadores", e);
        }
      };
      fetchMarkers();
    }, []),
  );

  // Lógica para detectar incidentes cercanos al tocar uno
  const handleMarkerPress = (lat, lng) => {
    const cercanos = incidentes.filter((i) => {
      const dist = Math.sqrt(
        Math.pow(i.latitud - lat, 2) + Math.pow(i.longitud - lng, 2),
      );
      return dist < 0.000001;
    });
    setDetalleIncidente(null);
    setSelectedIncidentes(cercanos);
    setPanelVisible(true);
  };

  // Lógica para votar un incidente
  const handleVotar = async (incidenteId) => {
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
        if (detalleIncidente && detalleIncidente.id === incidenteId) {
          setDetalleIncidente((prev) => ({
            ...prev,
            cantidadVotos: result.totalVotos,
          }));
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

  if (!location) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsIndoors={false}
      >
        {incidentes.map((inc) => (
          <Marker
            key={inc.id.toString()}
            coordinate={{ latitude: inc.latitud, longitude: inc.longitud }}
            onPress={() => handleMarkerPress(inc.latitud, inc.longitud)}
          >
            <View style={styles.markerContainer}>
              <Ionicons
                name={
                  inc.tipo === "TRANSITO"
                    ? "car"
                    : inc.tipo === "LIMPIEZA"
                      ? "trash"
                      : "business"
                }
                size={20}
                color="white"
              />
            </View>
          </Marker>
        ))}
      </MapView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={panelVisible}
        onRequestClose={() => setPanelVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.handle} />

            {/* VISTA 1: LISTA DE INCIDENTES */}
            {!detalleIncidente ? (
              <>
                <Text style={styles.modalTitle}>Incidentes en esta zona</Text>
                <FlatList
                  data={selectedIncidentes}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.incidentCard}
                      onPress={() => setDetalleIncidente(item)}
                    >
                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor:
                              item.tipo === "TRANSITO" ? "#FFF3E0" : "#E8F5E9",
                          },
                        ]}
                      >
                        <Ionicons
                          name={item.tipo === "TRANSITO" ? "car" : "trash"}
                          size={18}
                          color="#666"
                        />
                      </View>
                      <View style={styles.itemContent}>
                        <Text style={styles.itemTitle}>{item.titulo}</Text>
                        <Text style={styles.itemType}>{item.tipo}</Text>
                        {item.fecha && (
                          <Text style={styles.itemDate}>
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
                  )}
                />
              </>
            ) : (
              /* VISTA 2: DETALLE DEL INCIDENTE */
              <ScrollView
                style={styles.detailScroll}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => {
                    setDetalleIncidente(null);
                    setImageLoading(false);
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#007AFF" />
                  <Text style={styles.backBtnText}>Volver a la lista</Text>
                </TouchableOpacity>

                <Text style={styles.detailTitle}>
                  {detalleIncidente.titulo}
                </Text>

                <View style={styles.detailRow}>
                  <View style={styles.badgeSmall}>
                    <Text style={styles.badgeText}>
                      {detalleIncidente.tipo}
                    </Text>
                  </View>
                  {detalleIncidente.fecha && (
                    <Text style={styles.detailDate}>
                      {new Date(detalleIncidente.fecha).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.voteButton}
                  onPress={() => handleVotar(detalleIncidente.id)}
                  disabled={votingLoading}
                >
                  {votingLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="thumbs-up" size={20} color="white" />
                      <Text style={styles.voteButtonText}>
                        Yo también veo esto ({detalleIncidente.cantidadVotos || 0})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.detailDescription}>
                  {detalleIncidente.descripcion}
                </Text>

                <View style={styles.imageContainer}>
                  {detalleIncidente.fotoUrl ? (
                    <>
                      {imageLoading && (
                        <ActivityIndicator
                          style={styles.loader}
                          size="large"
                          color="#007AFF"
                        />
                      )}
                      <Image
                        key={detalleIncidente.id}
                        source={{
                          uri: `http://192.168.18.9:8080/uploads/${detalleIncidente.fotoUrl.trim()}`,
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
                      <Text style={{ color: "#aaa" }}>
                        Sin imagen disponible
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setPanelVisible(false)}
            >
              <Text style={styles.closeBtnText}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BOTÓN FLOTANTE DE AGREGAR REPORTE*/}
      <TouchableOpacity
        style={styles.fab}
        onPress={onOpenModal}
      >
        <Ionicons name="add" size={35} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  map: { width: "100%", height: "100%" },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007AFF",
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    height: "66%",
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handle: {
    width: 50,
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1A1A1A",
  },
  incidentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeBadge: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  itemType: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 10,
    color: "#999",
  },
  closeBtn: {
    backgroundColor: "#F1F3F5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  closeBtnText: {
    color: "#495057",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  backBtnText: {
    color: "#007AFF",
    marginLeft: 5,
    fontWeight: "600",
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  detailDate: {
    fontSize: 11,
    color: "#999",
  },
  badgeSmall: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  detailDescription: {
    fontSize: 16,
    color: "#444",
    lineHeight: 22,
    marginBottom: 15,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
    position: "relative",
  },
  detailImage: {
    width: "100%",
    height: "100%",
  },
  loader: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  noImage: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  detailScroll: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    borderRadius: 20,
    padding: 8,
    position: "relative",
  },
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
});
