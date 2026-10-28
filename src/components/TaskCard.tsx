
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type TaskStatus = "pending" | "completed";

type Props = {
  title: string;
  location: string;
  status: TaskStatus;
  icon?: string;
  onToggle: () => void;
  onDetails: () => void;
};

export default function TaskCard({
  title,
  location,
  status,
  icon = "🏠",
  onToggle,
  onDetails,
}: Props) {
  const completed = status === "completed";

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{icon}</Text>
        </View>

        <View style={styles.information}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.location}>
            📍 {location}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statusBadge,
          completed
            ? styles.completedBadge
            : styles.pendingBadge,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            completed
              ? styles.completedText
              : styles.pendingText,
          ]}
        >
          {completed ? "✓ E përfunduar" : "● Në pritje"}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <Pressable
          style={styles.secondaryButton}
          onPress={onToggle}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>
            Ndrysho statusin
          </Text>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={onDetails}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>
            Detajet →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E3EAF0",
    shadowColor: "#173C48",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 54,
    height: 54,
    backgroundColor: "#E8F5F3",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 26,
  },
  information: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#173C48",
  },
  location: {
    fontSize: 13,
    color: "#738493",
    marginTop: 5,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 30,
    marginTop: 18,
  },
  pendingBadge: {
    backgroundColor: "#FFF2DE",
  },
  completedBadge: {
    backgroundColor: "#E4F6EB",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pendingText: {
    color: "#A96817",
  },
  completedText: {
    color: "#247A49",
  },
  divider: {
    height: 1,
    backgroundColor: "#EDF1F4",
    marginVertical: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1.3,
    borderWidth: 1,
    borderColor: "#D4E2E7",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: "#315966",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#175568",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
