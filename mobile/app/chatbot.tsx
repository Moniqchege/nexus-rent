import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";

type Message = {
  role: "user" | "bot";
  text: string;
};

function getBotResponse(question: string, user: any): string {
  const q = question.toLowerCase();
  const property = user?.userProperties?.[0]?.property;

  if (q.includes("rent") || q.includes("due") || q.includes("payment")) {
    const price = property?.price
      ? `Ksh${property.price.toLocaleString()}/mo`
      : "N/A";
    return `Your rent is ${price}. Next due: Jul 1. On-time rate: 98.4%.`;
  }
  if (q.includes("lease") || q.includes("contract")) {
    const leaseDoc = user?.leaseDocument;
    const link = leaseDoc ? "View lease" : "Upload lease first";
    return `Your lease is active. ${link}.`;
  }
  if (
    q.includes("property") ||
    q.includes("home") ||
    q.includes("apartment")
  ) {
    const p = property;
    if (p) {
      return `${p.title || "Your Property"}, ${p.location || "N/A"}. ${
        p.beds || 0
      } beds, ${p.baths || 0} baths.`;
    }
    return "No property assigned yet.";
  }
  if (q.includes("score") || q.includes("rating")) {
    return "Your tenant score is 94/100. Great job!";
  }
  return "I can help with rent, lease, property, payments, or scores. Ask something simple!";
}

// ── suggested FAQs shown as quick-tap chips ───────────────────
const FAQ_CHIPS = [
  "When is my rent due?",
  "What's my tenant score?",
  "Tell me about my lease",
  "What property am I in?",
  "How's my payment history?",
];

// ── component ─────────────────────────────────────────────────
export default function ChatBotScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hi! 👋 Ask me anything about your rent, lease, property, payments, or tenant score. You can also tap a question below to get started.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const scrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  const handleSend = (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInputText("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: getBotResponse(msg, user) },
      ]);
    }, 700);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Image
            source={require('../assets/back_icon.png')}
            style={styles.backIcon}
        />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            source={require("../assets/bot_icon.png")}
            style={styles.headerIcon}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>Nexus Orion</Text>
            <Text style={styles.headerSubtitle}>Tenant Assistant</Text>
          </View>
        </View>

        {/* status pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Online</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* ── Message list ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === "user" ? styles.userBubble : styles.botBubble,
              ]}
            >
              {item.role === "bot" && (
                <Image
                  source={require("../assets/bot_icon.png")}
                  style={styles.avatarIcon}
                  resizeMode="contain"
                />
              )}
              <Text
                style={[
                  styles.bubbleText,
                  item.role === "user"
                    ? styles.userText
                    : styles.botText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          )}
          ListFooterComponent={
            /* FAQ chips — only shown when conversation is fresh */
            messages.length <= 1 ? (
              <View style={styles.chipsWrap}>
                {FAQ_CHIPS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={styles.chip}
                    onPress={() => handleSend(q)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
        />

        {/* ── Input bar ── */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about rent, lease, property…"
            placeholderTextColor="#555"
            multiline
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            activeOpacity={0.7}
            disabled={!inputText.trim()}
          >
            <Image
              source={require("../assets/send_icon.png")}
              style={styles.sendIcon}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#060A14",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
    backgroundColor: "#060A14",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backIcon: {
  width: 22,
  height: 22,
  tintColor: '#00FFFF', 
},
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    tintColor: "#00F0FF",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Orbitron",
  },
  headerSubtitle: {
    color: "#555",
    fontSize: 11,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,255,163,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,255,163,0.25)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00FFA3",
  },
  statusText: {
    color: "#00FFA3",
    fontSize: 10,
    fontFamily: "Orbitron",
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
    gap: 10,
  },

  // Bubbles
  bubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "82%",
    gap: 8,
  },
  botBubble: {
    alignSelf: "flex-start",
  },
  userBubble: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  avatarIcon: {
    width: 22,
    height: 22,
    tintColor: "#00F0FF",
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 20,
    borderRadius: 14,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexShrink: 1,
  },
  botText: {
    backgroundColor: "#111827",
    color: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderBottomLeftRadius: 4,
  },
  userText: {
    backgroundColor: "rgba(0,240,255,0.12)",
    color: "#00F0FF",
    borderWidth: 1,
    borderColor: "rgba(0,240,255,0.25)",
    borderBottomRightRadius: 4,
    fontWeight: "500",
  },

  // FAQ chips
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.4)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    color: "#A78BFA",
    fontSize: 11,
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    backgroundColor: "#060A14",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#111827",
    color: "#fff",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,240,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(0,240,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: "#00F0FF",
  },
});