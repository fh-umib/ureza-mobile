
import { Pressable, StyleSheet, Text, View } from "react-native";

export type TaskStatus = "pending" | "completed";

type Props = {
  title: string;
  location: string;
  status: TaskStatus;
  onToggle: () => void;
};

export default function TaskCard({
  title,
  location,
  status,
  onToggle,
}: Props) {
  const isCompleted = status === "completed";

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.location}>
        {location}
      </Text>

      <Text
        style={[
          styles.status,
          isCompleted ? styles.completed : styles.pending,
        ]}
      >
        {isCompleted ? "E përfunduar" : "Në pritje"}
      </Text>

      <Pressable
        style={styles.button}
        onPress={onToggle}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>
          Ndrysho statusin
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#164E63",
  },
  location: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
  },
  status: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  pending: {
    color: "#D97706",
  },
  completed: {
    color: "#15803D",
  },
  button: {
    backgroundColor: "#164E63",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
