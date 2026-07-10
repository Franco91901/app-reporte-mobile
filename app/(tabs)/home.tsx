import { useState } from "react";
import { StyleSheet, View } from "react-native";
import MapComponent from "@/src/components/MapComponent";
import CreateReportModal from "@/src/components/CreateReportModal";

export default function ExploreScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <MapComponent onOpenModal={() => setModalVisible(true)} />
      <CreateReportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
