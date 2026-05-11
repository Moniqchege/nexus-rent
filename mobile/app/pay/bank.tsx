import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Building2, Copy, CheckCircle2 } from "lucide-react-native";
import { useState } from "react";
import * as Clipboard from "expo-clipboard";

const colorMap = {
  neon: "#00FFFF",
  purple: "#7C3AED",
  success: "#00FFA3",
  warn: "#FFB84D",
  muted: "#888",
  border: "rgba(255,255,255,0.05)",
};

export default function PaymentBankPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const amount = params.amount ? parseFloat(params.amount as string) : 0;
  const scheduleId = params.scheduleId ? parseInt(params.scheduleId as string) : 0;
  const propertyTitle = params.propertyTitle as string || "Property";

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bankDetails = {
    bankName: "Equity Bank",
    accountName: "Nexus Rent Management",
    accountNumber: "0123456789",
    branch: "Westlands Branch",
    swiftCode: "EQBLKENA",
    reference: `RENT-${scheduleId}`,
  };

  const copyToClipboard = async (text: string, field: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDone = () => {
    Alert.alert(
      "Payment Submitted",
      "Your bank transfer details have been noted. Please complete the transfer and we'll verify it within 24 hours. You'll receive a confirmation email once verified.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/payments"),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.ambientGlow} />

      <ScrollView contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.side}>
            <Image
              source={require('../../assets/back_icon.png')}
              style={styles.backIcon}
            />
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={styles.headerLabel}>BANK TRANSFER</Text>
            <Text style={styles.headerTitle}>Direct Bank Payment</Text>
          </View>

          <View style={styles.side} />
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <View style={styles.amountGlow} />
          <Building2 size={32} color={colorMap.warn} />
          <Text style={styles.amountLabel}>AMOUNT TO PAY</Text>
          <Text style={styles.amountValue}>KES {amount.toLocaleString()}</Text>
          <Text style={styles.amountSub}>{propertyTitle}</Text>
        </View>

        {/* Bank Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>BANK ACCOUNT DETAILS</Text>

          <DetailRow
            label="Bank Name"
            value={bankDetails.bankName}
            onCopy={() => copyToClipboard(bankDetails.bankName, "bankName")}
            copied={copiedField === "bankName"}
          />
          <DetailRow
            label="Account Name"
            value={bankDetails.accountName}
            onCopy={() => copyToClipboard(bankDetails.accountName, "accountName")}
            copied={copiedField === "accountName"}
          />
          <DetailRow
            label="Account Number"
            value={bankDetails.accountNumber}
            onCopy={() => copyToClipboard(bankDetails.accountNumber, "accountNumber")}
            copied={copiedField === "accountNumber"}
          />
          <DetailRow
            label="Branch"
            value={bankDetails.branch}
            onCopy={() => copyToClipboard(bankDetails.branch, "branch")}
            copied={copiedField === "branch"}
          />
          <DetailRow
            label="SWIFT Code"
            value={bankDetails.swiftCode}
            onCopy={() => copyToClipboard(bankDetails.swiftCode, "swiftCode")}
            copied={copiedField === "swiftCode"}
          />
          <DetailRow
            label="Payment Reference"
            value={bankDetails.reference}
            onCopy={() => copyToClipboard(bankDetails.reference, "reference")}
            copied={copiedField === "reference"}
            highlight
          />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Important Instructions:</Text>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              Transfer <Text style={{ color: colorMap.warn, fontWeight: "700" }}>KES {amount.toLocaleString()}</Text> to the account above
            </Text>
          </View>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              Use reference: <Text style={{ color: colorMap.warn, fontWeight: "700" }}>{bankDetails.reference}</Text>
            </Text>
          </View>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Payment will be verified within 24 hours</Text>
          </View>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}>You'll receive a confirmation email once verified</Text>
          </View>
        </View>

        {/* Done Button */}
        <TouchableOpacity
          onPress={handleDone}
          style={styles.doneButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colorMap.warn, "#FFC870"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneButtonGradient}
          >
            <Text style={styles.doneButtonText}>I'VE COMPLETED THE TRANSFER</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  onCopy,
  copied,
  highlight,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.detailRow, highlight && styles.detailRowHighlight]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, highlight && { color: colorMap.warn }]}>{value}</Text>
      </View>
      <TouchableOpacity onPress={onCopy} style={styles.copyBtn}>
        {copied ? (
          <CheckCircle2 size={18} color={colorMap.success} />
        ) : (
          <Copy size={18} color="#888" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060A14" },
  ambientGlow: {
    position: "absolute",
    top: 100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255,184,77,0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 50,
  },
  side: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 65,
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: colorMap.warn,
  },
  headerLabel: {
    fontSize: 10,
    fontFamily: "Orbitron",
    letterSpacing: 2,
    color: "#888",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Orbitron",
    fontWeight: "700",
    color: "#fff",
  },
  amountCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 22,
    padding: 28,
    backgroundColor: "rgba(255,184,77,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,184,77,0.2)",
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
  },
  amountGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,184,77,0.15)",
  },
  amountLabel: {
    fontSize: 10,
    fontFamily: "Orbitron",
    letterSpacing: 2,
    color: "#888",
    marginTop: 12,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontFamily: "JetBrains Mono",
    fontWeight: "700",
    color: colorMap.warn,
    marginBottom: 8,
  },
  amountSub: {
    fontSize: 14,
    color: "#fff",
  },
  detailsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,184,77,0.2)",
  },
  detailsTitle: {
    fontSize: 11,
    fontFamily: "Orbitron",
    letterSpacing: 1.5,
    color: "#888",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  detailRowHighlight: {
    backgroundColor: "rgba(255,184,77,0.08)",
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: "#888",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "JetBrains Mono",
    color: "#fff",
    fontWeight: "600",
  },
  copyBtn: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    backgroundColor: "rgba(0,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.1)",
  },
  instructionsTitle: {
    fontSize: 13,
    fontFamily: "Orbitron",
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: "rgba(255,184,77,0.15)",
    borderRadius: 12,
    fontSize: 12,
    fontFamily: "Orbitron",
    fontWeight: "700",
    color: colorMap.warn,
    textAlign: "center",
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: "#aaa",
    lineHeight: 20,
  },
  doneButton: {
    marginHorizontal: 20,
  },
  doneButtonGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    fontFamily: "Orbitron",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#0B0F19",
  },
});
