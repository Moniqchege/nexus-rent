import React from "react";
import { TouchableOpacity, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export function FloatingBotButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push("/chatbot")}
      activeOpacity={0.85}
    >
      <Image
        source={require("../assets/bot_icon.png")}
        style={styles.fabIcon}
        resizeMode="contain"
      />

      <Text style={styles.fabText}>FAQ?</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,

    backgroundColor: "#00F0FF",

    shadowColor: "#00F0FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },

  fabIcon: {
    width: 22,
    height: 22,
    tintColor: "#001018", 
    marginRight: 4,
  },

  fabText: {
    color: "#001018",
    fontSize: 10,
    fontFamily: "Orbitron",
    letterSpacing: 0.6,
  },
});