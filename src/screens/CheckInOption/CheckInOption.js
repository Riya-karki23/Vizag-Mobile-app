// ===============================
// ✅ CheckInOption.js (FULL)
// ✅ CHANGE REQUEST (FINAL):
// ✅ Screen visible to ALL departments (no auto-redirect)
// ✅ On CONTINUE:
//    - Sales department -> SalesCollectionOfficer
//    - All other departments -> MAP
// ✅ No other UI/validation change
// ===============================

import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { showToast } from "../../constant/toast";
import { setItemToStorage, getItemFromStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import { request } from "../../api/auth/auth";
import { logError } from "../../constant/logger";

const { width } = Dimensions.get("window");
const MODE_KEY = "work_mode_selected";

const COLORS = {
  primary: "#FE1700",
  secondary: "#FF6901",
  background: "#F2F2F2",
  white: "#FFFFFF",
  textDark: "#1A1A1A",
  textLight: "#7F8C8D",
};

const OFFICE_ADDRESS =
  "Plot No. C-13, Part-A, B-Block Auto Nagar, Bhpvpost, Visakhapatnam, Andhra Pradesh";

const OFFICE_COORDS = {
  latitude: 17.6918384,
  longitude: 83.1997948,
};

const OFFICE_GEOFENCE_RADIUS = 500; // meters

const CheckInOption = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // ✅ never undefined
  const imageUrl = String(route?.params?.imageUrl || "");

  const [department, setDepartment] = useState("");
  const [selectedMode, setSelectedMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skipModeScreen, setSkipModeScreen] = useState(false);

  // ✅ NEW: track if user is Sales (controls navigation destination only)
  const [isSalesUser, setIsSalesUser] = useState(false);

  const getActionValue = () =>
    route?.params?.action || route?.params?.type || route?.params?.mode || "checkin";

  // ✅ Sales -> SalesCollectionOfficer
  const goToSalesCollection = async ({ deptValue, actionValue, selectedModeValue }) => {
    try {
      const storedMode = await getItemFromStorage(MODE_KEY);
      const storedOfficeCoord = await getItemFromStorage(Strings.offceCoordinate);
      const storedRadius = await getItemFromStorage(Strings.offceGeoFenceRadius);
      const storedUserName = await getItemFromStorage(Strings.userName);

      const payload = {
        dept: deptValue,
        imageUrl: String(imageUrl || ""),
        action: actionValue,
        selectedMode: selectedModeValue,
        from: "CheckInOption",
        parentRouteParams: route?.params || null,
        storageSnapshot: {
          [Strings.userName]: storedUserName,
          [MODE_KEY]: storedMode,
          [Strings.offceCoordinate]: storedOfficeCoord,
          [Strings.offceGeoFenceRadius]: storedRadius,
        },
      };

      console.log("➡️ NAVIGATE -> SalesCollectionOfficer PAYLOAD:", payload);
      navigation.navigate("SalesCollectionOfficer", payload);
    } catch (e) {
      console.log("❌ goToSalesCollection error:", e);
      navigation.navigate("SalesCollectionOfficer", {
        dept: deptValue,
        imageUrl: String(imageUrl || ""),
        action: actionValue,
        selectedMode: selectedModeValue,
        from: "CheckInOption",
      });
    }
  };

  // ✅ Non-sales -> MAP
  const goToMap = async ({ deptValue, actionValue, selectedModeValue }) => {
    try {
      const storedMode = await getItemFromStorage(MODE_KEY);
      const storedOfficeCoord = await getItemFromStorage(Strings.offceCoordinate);
      const storedRadius = await getItemFromStorage(Strings.offceGeoFenceRadius);
      const storedUserName = await getItemFromStorage(Strings.userName);

      const payload = {
        dept: deptValue,
        imageUrl: String(imageUrl || ""),
        action: actionValue,
        selectedMode: selectedModeValue,
        from: "CheckInOption",
        parentRouteParams: route?.params || null,
        storageSnapshot: {
          [Strings.userName]: storedUserName,
          [MODE_KEY]: storedMode,
          [Strings.offceCoordinate]: storedOfficeCoord,
          [Strings.offceGeoFenceRadius]: storedRadius,
        },
      };

      console.log("➡️ NAVIGATE -> MAP PAYLOAD:", payload);
      navigation.navigate("MAP", payload);
    } catch (e) {
      console.log("❌ goToMap error:", e);
      navigation.navigate("MAP", {
        dept: deptValue,
        imageUrl: String(imageUrl || ""),
        action: actionValue,
        selectedMode: selectedModeValue,
        from: "CheckInOption",
      });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        console.log("🧾 CheckInOption init route.params:", route?.params || null);
        console.log("🧾 CheckInOption received imageUrl:", imageUrl);

        const storedUserName = await getItemFromStorage(Strings.userName);
        console.log("🧾 CheckInOption stored username:", storedUserName);

        // ✅ No auto-redirect now. Still set safe defaults.
        if (!storedUserName) {
          const deptValue = "unknown";
          setDepartment(deptValue);
          setIsSalesUser(false);
          console.log("⚠️ No stored username. Keeping screen visible. Dept:", deptValue);
          return;
        }

        const Employee = await request(
          "GET",
          `/api/resource/Employee?fields=["name","department"]&filters=[["user_id","=","${storedUserName}"]]`
        );

        console.log("📌 Employee API raw response:", Employee?.data || Employee);

        const json = Employee?.data;
        const deptRaw = json?.data?.[0]?.department || "";
        const dept = String(deptRaw).toLowerCase().trim();

        const deptValue = dept || "unknown";
        setDepartment(deptValue);

        console.log("✅ Resolved department:", deptValue);

        const isSales = deptValue.includes("sales");
        setIsSalesUser(isSales);
      } catch (error) {
        logError("Error fetching department:", error);
        console.log("❌ Error fetching department:", error);

        const deptValue = "unknown";
        setDepartment(deptValue);
        setIsSalesUser(false);

        // ✅ keep screen visible (no redirect)
        console.log("➡️ Error state. Keeping screen visible. Dept:", deptValue);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (skipModeScreen) return null;

  // ✅ OPTIONS (unchanged UI)
  const options = [
    { label: "Office", icon: "business", value: "office" },
    { label: "Marketing", icon: "megaphone", value: "marketing" },
  ];

  const onContinue = async () => {
    if (!selectedMode) return;

    try {
      setLoading(true);

      console.log("🟠 Continue pressed. selectedMode:", selectedMode);

      await setItemToStorage(MODE_KEY, selectedMode);

      if (selectedMode === "office") {
        await setItemToStorage(
          Strings.offceCoordinate,
          JSON.stringify({
            latitude: OFFICE_COORDS.latitude,
            longitude: OFFICE_COORDS.longitude,
            address: OFFICE_ADDRESS,
          })
        );

        await setItemToStorage(Strings.offceGeoFenceRadius, String(OFFICE_GEOFENCE_RADIUS));

        console.log("🏢 Office mode saved:", {
          coords: OFFICE_COORDS,
          radius: OFFICE_GEOFENCE_RADIUS,
          address: OFFICE_ADDRESS,
        });
      } else {
        await setItemToStorage(Strings.offceCoordinate, "");
        await setItemToStorage(Strings.offceGeoFenceRadius, "");
        console.log("🌍 Non-office mode => cleared office geofence storage.");
      }

      // ✅ ONLY navigation changes:
      // Sales -> SalesCollectionOfficer
      // Others -> MAP
      if (isSalesUser) {
        await goToSalesCollection({
          deptValue: department || "unknown",
          actionValue: getActionValue(),
          selectedModeValue: selectedMode,
        });
      } else {
        await goToMap({
          deptValue: department || "unknown",
          actionValue: getActionValue(),
          selectedModeValue: selectedMode,
        });
      }
    } catch (e) {
      console.log("❌ onContinue error:", e);
      showToast(`Mode config save nahi hua. (${e?.message || ""})`);
    } finally {
      setLoading(false);
    }
  };

  const SquareCard = ({ item }) => {
    const isSelected = selectedMode === item.value;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1.05 : 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    }, [isSelected]);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          console.log("✅ Mode selected:", item.value);
          setSelectedMode(item.value);
        }}
        style={styles.cardWrapper}
      >
        <Animated.View
          style={[
            styles.squareCard,
            { transform: [{ scale: scaleAnim }] },
            isSelected && styles.squareCardSelected,
          ]}
        >
          {isSelected && (
            <View style={styles.checkIcon}>
              <Icon name="checkmark-circle" size={28} color={COLORS.secondary} />
            </View>
          )}

          <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
            <Icon
              name={`${item.icon}${isSelected ? "" : "-outline"}`}
              size={45}
              color={isSelected ? COLORS.secondary : "#555"}
            />
          </View>

          <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
            {item.label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const selectedModeLabel = options.find((o) => o.value === selectedMode)?.label || "";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Select Mode</Text>
          <Text style={styles.headerSub}>
            {(department || "department").toUpperCase()}
            {selectedModeLabel ? ` • ${selectedModeLabel.toUpperCase()}` : ""} MODE
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.cardList}>
          {options.map((item) => (
            <SquareCard key={item.value} item={item} />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.mainButton, (!selectedMode || loading) && styles.btnDisabled]}
          onPress={onContinue}
          disabled={!selectedMode || loading}
        >
          <Text style={styles.mainButtonText}>{loading ? "SETTING..." : "CONTINUE"}</Text>
          <Icon name="chevron-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CheckInOption;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.primary,
    height: 90,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: Platform.OS === "android" ? 20 : 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
  },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: COLORS.white },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginTop: 2,
  },

  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 40 },
  cardList: { width: "100%", alignItems: "center", gap: 30 },
  cardWrapper: { width: width * 0.44, aspectRatio: 1 },
  squareCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
    ...Platform.select({
      android: { elevation: 10 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  squareCardSelected: { borderColor: COLORS.secondary },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F8F9F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  iconCircleSelected: { backgroundColor: "rgba(255, 105, 1, 0.1)" },
  cardLabel: { fontSize: 18, fontWeight: "800", color: COLORS.textLight },
  cardLabelSelected: { color: COLORS.secondary },

  footer: { padding: 25, backgroundColor: COLORS.background },
  mainButton: {
    backgroundColor: COLORS.primary,
    height: 65,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  btnDisabled: { backgroundColor: "#CCC" },
  mainButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  checkIcon: { position: "absolute", top: 12, right: 12 },
});
