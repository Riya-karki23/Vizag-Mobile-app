// ===============================
// ✅ CheckInOption.js (FULL)
// ✅ CHANGE ONLY:
// - Sales dept user presses CONTINUE => ALWAYS navigate to SalesCollectionOfficer
//   (action checkin OR checkout)
// - Non-sales => MAP
// - No popups / no other UI logic change
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

const normalize = (v) => String(v || "").trim().toLowerCase();

// ✅ FIX: strict resolveAction (no forced "checkin")
const resolveAction = (params) => {
  const p = params || {};
  const a =
    p.action ||
    p?.parentRouteParams?.action ||
    p?.params?.action ||
    p?.parentRouteParams?.params?.action ||
    p.type ||
    p.mode;

  const action = normalize(a);
  if (action === "checkin") return "checkin";
  if (action === "checkout") return "checkout";
  return ""; // ✅ unknown
};

const CheckInOption = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // ✅ never undefined
  const imageUrl = String(route?.params?.imageUrl || "");

  const [department, setDepartment] = useState("");
  const [selectedMode, setSelectedMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skipModeScreen, setSkipModeScreen] = useState(false);

  // ✅ track if user is Sales
  const [isSalesUser, setIsSalesUser] = useState(false);

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

      navigation.navigate("SalesCollectionOfficer", payload);
    } catch (e) {
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

      navigation.navigate("MAP", payload);
    } catch (e) {
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
        const storedUserName = await getItemFromStorage(Strings.userName);

        if (!storedUserName) {
          const deptValue = "unknown";
          setDepartment(deptValue);
          setIsSalesUser(false);
          return;
        }

        const Employee = await request(
          "GET",
          `/api/resource/Employee?fields=["name","department"]&filters=[["user_id","=","${storedUserName}"]]`
        );

        const json = Employee?.data;
        const deptRaw = json?.data?.[0]?.department || "";
        const dept = String(deptRaw).toLowerCase().trim();

        const deptValue = dept || "unknown";
        setDepartment(deptValue);

        const isSales = deptValue.includes("sales");
        setIsSalesUser(isSales);
      } catch (error) {
        logError("Error fetching department:", error);
        const deptValue = "unknown";
        setDepartment(deptValue);
        setIsSalesUser(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (skipModeScreen) return null;

  const options = [
    { label: "Office", icon: "business", value: "office" },
    { label: "Marketing", icon: "megaphone", value: "marketing" },
  ];

  const onContinue = async () => {
    if (!selectedMode) return;

    try {
      setLoading(true);

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
      } else {
        await setItemToStorage(Strings.offceCoordinate, "");
        await setItemToStorage(Strings.offceGeoFenceRadius, "");
      }

      // ✅ robust action resolve
      let actionValue = resolveAction(route?.params);

      // ✅ if action missing/invalid => default checkin (silent)
      if (!actionValue) actionValue = "checkin";

      // ✅ IMPORTANT FIX: realtime sales check (avoids isSalesUser false due to late fetch)
      let salesFlag = isSalesUser;

      try {
        const storedUserName = await getItemFromStorage(Strings.userName);
        if (storedUserName) {
          const Employee = await request(
            "GET",
            `/api/resource/Employee?fields=["name","department"]&filters=[["user_id","=","${storedUserName}"]]`
          );
          const deptRaw = Employee?.data?.data?.[0]?.department || "";
          const deptValue = String(deptRaw).toLowerCase().trim();
          salesFlag = deptValue.includes("sales");
        }
      } catch (e) {
        // fallback stays as previous salesFlag
      }

      // ✅ CHANGE: Sales user => ALWAYS open SalesCollectionOfficer (checkin or checkout)
      if (salesFlag) {
        await goToSalesCollection({
          deptValue: department || "unknown",
          actionValue,
          selectedModeValue: selectedMode,
        });
      } else {
        await goToMap({
          deptValue: department || "unknown",
          actionValue,
          selectedModeValue: selectedMode,
        });
      }
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
