import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import { showToast } from "../../constant/toast";
import { logError } from "../../constant/logger";
import { request } from "../../api/auth/auth";
import moment from "moment";

// ✅ ADD THIS
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  primary: "#FE1700",
  background: "#F2F2F7",
  white: "#FFFFFF",
  textDark: "#1C1C1E",
  textGrey: "#636366",
  border: "#D1D1D6",
  inputBg: "#F9F9F9",
};

const DOCTYPE = "Daily Sales Officer Collection Update";

const SalesCollectionOfficer = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dailyRow, setDailyRow] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  const [plannedAmt, setPlannedAmt] = useState("");
  const [collectedAmt, setCollectedAmt] = useState("");
  const [remarks, setRemarks] = useState("");

  // ✅ for one-time-per-session render while redirect checks
  const [gateChecking, setGateChecking] = useState(true);

  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();
  const currentTimeDec = currentHour + currentMinutes / 60;

  const isMorningTime = currentTimeDec >= 9 && currentTimeDec <= 10.5;
  const isEveningTime = currentTimeDec >= 17 && currentTimeDec <= 21;
  const isAllowedTime = isMorningTime || isEveningTime;

  const todayStr = moment().format("YYYY-MM-DD");
  const checkinKey = `daily_checkin_done_${todayStr}`;
  const checkoutKey = `daily_checkout_done_${todayStr}`;

  // ✅ If time exceeded OR already done for this window => redirect to MAP
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          setGateChecking(true);

          // time window not allowed => redirect immediately
          if (!isAllowedTime) {
            navigation.replace("MAP", { ...(route.params || {}) });
            return;
          }

          // if morning & already checked-in once => redirect
          if (isMorningTime) {
            const done = await AsyncStorage.getItem(checkinKey);
            if (done === "1") {
              navigation.replace("MAP", { ...(route.params || {}) });
              return;
            }
          }

          // if evening & already checked-out once => redirect
          if (isEveningTime) {
            const done = await AsyncStorage.getItem(checkoutKey);
            if (done === "1") {
              navigation.replace("MAP", { ...(route.params || {}) });
              return;
            }
          }
        } finally {
          if (mounted) setGateChecking(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [
      isAllowedTime,
      isMorningTime,
      isEveningTime,
      navigation,
      route.params,
      checkinKey,
      checkoutKey,
    ])
  );

  useEffect(() => {
    (async () => {
      const email = await getItemFromStorage(Strings.userName);
      setUserEmail(email || "");
      if (email) fetchDailySales(email);
    })();
  }, []);

  const fetchDailySales = async (email) => {
    setFetching(true);
    try {
      const filters = JSON.stringify([["preferred_email", "=", email]]);
      const url = `/api/resource/${DOCTYPE}?filters=${encodeURIComponent(
        filters
      )}&fields=["*"]&order_by=date desc&limit_page_length=1`;

      const res = await request("GET", url);
      const data = res?.data?.data?.[0] || null;

      if (data) {
        if (data.date === todayStr) {
          setDailyRow(data);
          setPlannedAmt(String(data.planned_collection_amount_for_the_day || ""));
          setCollectedAmt(String(data.collected_amount_for_the_day || ""));
          setRemarks(data.remarks || "");
        } else {
          setDailyRow(null);
        }
      } else {
        setDailyRow(null);
      }
    } catch (e) {
      logError("Fetch Error", e);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!dailyRow?.name) {
      showToast("No record found.");
      return;
    }

    // safety: if not allowed window => go back
    if (!isAllowedTime) {
      navigation.replace("MAP", { ...(route.params || {}) });
      return;
    }

    setSubmitting(true);
    try {
      const updateUrl = `/api/resource/${DOCTYPE}/${dailyRow.name}`;

      const payload = {
        remarks: remarks,
        planned_collection_amount_for_the_day: parseFloat(plannedAmt) || 0,
        collected_amount_for_the_day: parseFloat(collectedAmt) || 0,
      };

      if (isMorningTime) {
        payload.check_in = 1;
        payload.check_out = 0;
      } else if (isEveningTime) {
        payload.check_out = 1;
        payload.check_in = 0;
      }

      await request("PUT", updateUrl, payload);

      // ✅ mark done (so it won't open again today for same window)
      if (isMorningTime) await AsyncStorage.setItem(checkinKey, "1");
      if (isEveningTime) await AsyncStorage.setItem(checkoutKey, "1");

      showToast("Sync Successful");
      navigation.replace("MAP", { ...(route.params || {}) });
    } catch (e) {
      showToast("Sync Failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ while checking gate (time + one-time flag), don't show UI
  if (gateChecking) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={30} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Collection update</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : null} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {fetching ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : dailyRow ? (
            <View style={styles.content}>
              {/* Profile Card */}
              <View style={styles.profileCard}>
                <View style={styles.profileIcon}>
                  <Icon name="account-tie" size={40} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.officerName}>{dailyRow.sales_person}</Text>
                  <Text style={styles.officerEmail}>{userEmail}</Text>
                  <Text style={styles.dateText}>{moment(dailyRow.date).format("DD MMMM YYYY")}</Text>
                </View>
              </View>

              {/* Stats */}
              <Text style={styles.sectionTitle}>Outstanding Summary</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Outstanding</Text>
                  <Text style={[styles.statValue, { color: COLORS.textDark }]}>
                    ₹{dailyRow.outstanding_amount || "0"}
                  </Text>
                </View>
                <View style={[styles.statBox, styles.borderLeft]}>
                  <Text style={styles.statLabel}>Overdue</Text>
                  <Text style={[styles.statValue, { color: "#D32F2F" }]}>
                    ₹{dailyRow.overdue || "0"}
                  </Text>
                </View>
              </View>

              {/* Update */}
              <Text style={styles.sectionTitle}>Collection Update</Text>
              <View style={styles.updateCard}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Planned collection amount for the day</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="target" size={20} color={COLORS.textGrey} style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={plannedAmt}
                      onChangeText={setPlannedAmt}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor="#A9A9A9"
                    />
                  </View>
                </View>

                {isEveningTime && (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Collected Amount for the day</Text>
                    <View style={styles.inputContainer}>
                      <Icon
                        name="currency-inr"
                        size={20}
                        color={COLORS.textGrey}
                        style={styles.fieldIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        value={collectedAmt}
                        onChangeText={setCollectedAmt}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor="#A9A9A9"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Remarks / Comments</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline
                    numberOfLines={4}
                    placeholder="Enter visit remarks..."
                    placeholderTextColor="#A9A9A9"
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="calendar-search" size={80} color={COLORS.border} />
              <Text style={styles.emptyText}>No collection record found for today.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.mainBtn, (!dailyRow || submitting) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={!dailyRow || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={styles.btnContent}>
              <Text style={styles.btnText}>SUBMIT UPDATE</Text>
              <Icon name="chevron-right" size={24} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    height: Platform.OS === "ios" ? 50 : 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    elevation: 4,
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "bold", marginLeft: 5 },
  backBtn: { padding: 5 },
  loader: { marginTop: 100 },
  scroll: { flexGrow: 1, paddingBottom: 100 },
  content: { padding: 16 },

  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF5F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  officerName: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  officerEmail: { fontSize: 14, color: COLORS.textGrey },
  dateText: { fontSize: 12, color: COLORS.primary, fontWeight: "700", marginTop: 4 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textGrey,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statBox: { flex: 1, padding: 16, alignItems: "center" },
  borderLeft: { borderLeftWidth: 1, borderLeftColor: COLORS.border },
  statLabel: { fontSize: 12, color: COLORS.textGrey, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "800" },

  updateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: "700", color: COLORS.textDark, marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  fieldIcon: { marginRight: 10 },
  textInput: { flex: 1, height: 48, fontSize: 16, color: COLORS.textDark, fontWeight: "600" },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    padding: 12,
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  mainBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  btnContent: { flexDirection: "row", alignItems: "center" },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "800", marginRight: 8 },

  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: {
    color: COLORS.textGrey,
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});

export default SalesCollectionOfficer;
