
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import TaskCard, {
  type TaskStatus,
} from "../components/TaskCard";

export default function HomeScreen() {
  const platforma =
    Platform.OS === "ios"
      ? "iOS (iPhone)"
      : Platform.OS === "android"
        ? "Android"
        : "Web";

  const [houseStatus, setHouseStatus] =
    useState<TaskStatus>("pending");

  const [landStatus, setLandStatus] =
    useState<TaskStatus>("pending");

  const [yardStatus, setYardStatus] =
    useState<TaskStatus>("pending");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.label}>
        CONNECTING DIASPORA WITH KOSOVO
      </Text>

      <Text style={styles.title}>Urëza</Text>

      <Text style={styles.description}>
        Një urë mes diasporës dhe shtëpisë në Kosovë.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Zhvilluar nga</Text>
        <Text style={styles.infoValue}>
          Flutura Hyseni & Tringa
        </Text>

        <Text style={styles.infoLabel}>Platforma</Text>
        <Text style={styles.infoValue}>
          {platforma}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Detyrat e mia
      </Text>

      <TaskCard
        title="Kontrolli i shtëpisë"
        location="Mitrovicë, Kosovë"
        status={houseStatus}
        onToggle={() =>
          setHouseStatus((previous) =>
            previous === "pending"
              ? "completed"
              : "pending"
          )
        }
      />

      <TaskCard
        title="Kontrolli i tokës"
        location="Vushtrri, Kosovë"
        status={landStatus}
        onToggle={() =>
          setLandStatus((previous) =>
            previous === "pending"
              ? "completed"
              : "pending"
          )
        }
      />

      <TaskCard
        title="Mirëmbajtja e oborrit"
        location="Pejë, Kosovë"
        status={yardStatus}
        onToggle={() =>
          setYardStatus((previous) =>
            previous === "pending"
              ? "completed"
              : "pending"
          )
        }
      />

      <Text style={styles.footer}>
        Urëza · Java 2 · React Native & TypeScript
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },
  content: {
    padding: 24,
    paddingTop: 35,
    paddingBottom: 60,
  },
  label: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "bold",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  title: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#164E63",
    textAlign: "center",
    marginTop: 12,
  },
  description: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 26,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#164E63",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#164E63",
    marginBottom: 16,
  },
  footer: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 16,
  },
});
