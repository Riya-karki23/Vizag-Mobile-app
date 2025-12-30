import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getItemFromStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import { showToast } from "../../constant/toast";
import { logError } from "../../constant/logger";
import { request } from "../../api/auth/auth";
import moment from "moment";

// ✅ YOUR CUSTOM COLORS
const COLORS = {
  primaryRed: "#FE1700",
  primaryOrange: "#FF6901",
  bg: "#F8F9FB",
  white: "#FFFFFF",
  textMain: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  disabled: "#F3F4F6",
};

const DOCTYPE = "Late Collection";

const LateCollection = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lateRow, setLateRow] = useState(null);

  const [userEmail, setUserEmail] = useState("");
  const [userFullName, setUserFullName] = useState("");

  const [lateCollectedAmt, setLateCollectedAmt] = useState("");
  const [remarks, setRemarks] = useState("");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dayStr = useMemo(
    () => moment(selectedDate).format("YYYY-MM-DD"),
    [selectedDate]
  );

  useEffect(() => {
    (async () => {
      try {
        const emailFromStorage = await getItemFromStorage(Strings.userName);
        setUserEmail(emailFromStorage || "");

        const meRes = await request(
          "GET",
          "/api/method/frappe.auth.get_logged_user"
        );
        const loggedUser = meRes?.data?.message;

        if (loggedUser) {
          const userRes = await request(
            "GET",
            `/api/resource/User/${encodeURIComponent(
              loggedUser
            )}?fields=["full_name","email"]`
          );
          const u = userRes?.data?.data;

          setUserFullName(u?.full_name || loggedUser);
          setUserEmail(u?.email || emailFromStorage || loggedUser);
        }
      } catch (e) {
        logError("User Fetch Error", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (userEmail) fetchLateCollection(userEmail, selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, selectedDate]);

  // ✅ FETCH: if entry exists -> setLateRow + load values; else clear
  const fetchLateCollection = async (email, dateObj) => {
    setFetching(true);
    try {
      const day = moment(dateObj).format("YYYY-MM-DD");
      const filters = JSON.stringify([
        ["email", "=", email],
        ["date", "=", day],
      ]);

      // ✅ IMPORTANT: order_by=modified desc (latest) + limit 1
      const url = `/api/resource/${DOCTYPE}?filters=${encodeURIComponent(
        filters
      )}&fields=["name","collected_amount_after_office_hours","remarks","email","date","sales_person"]&order_by=modified desc&limit_page_length=1`;

      const res = await request("GET", url);
      const data = res?.data?.data?.[0] || null;

      if (data) {
        setLateRow(data);
        setLateCollectedAmt(
          data.collected_amount_after_office_hours != null
            ? String(data.collected_amount_after_office_hours)
            : ""
        );
        setRemarks(data.remarks || "");
      } else {
        setLateRow(null);
        setLateCollectedAmt("");
        setRemarks("");
      }
    } catch (e) {
      logError("Fetch Error", e);
      setLateRow(null);
      setLateCollectedAmt("");
      setRemarks("");
    } finally {
      setFetching(false);
    }
  };

  // ✅ SUBMIT: if name exists -> update else create
  const handleSubmit = async () => {
    const amt = parseFloat(lateCollectedAmt);

    if (!lateCollectedAmt || isNaN(amt)) {
      showToast("Enter valid amount");
      return;
    }
    if (!userEmail) {
      showToast("User email not found");
      return;
    }
    if (!userFullName) {
      showToast("User name not loaded");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        collected_amount_after_office_hours: amt,
        remarks: remarks || "",
        date: dayStr,
        email: userEmail,
        sales_person: userFullName,
      };

      if (lateRow?.name) {
        await request("PUT", `/api/resource/${DOCTYPE}/${lateRow.name}`, payload);
        showToast("Updated Successfully");
      } else {
        await request("POST", `/api/resource/${DOCTYPE}`, payload);
        showToast("Submitted Successfully");
      }

      // ✅ after submit, re-fetch to get latest row + name
      fetchLateCollection(userEmail, selectedDate);
    } catch (e) {
      logError("Submit Error", e);
      showToast("Sync Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryRed} barStyle="light-content" />

      {/* ✅ HEADER WITH RED BG */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
          >
            <Icon name="arrow-left" size={26} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Late Collection</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Info Card */}
          <View style={styles.statusCard}>
            <View
              style={[
                styles.indicator,
                {
                  backgroundColor: lateRow
                    ? COLORS.primaryOrange
                    : "#10B981",
                },
              ]}
            />
            <View>
              <Text style={styles.statusTitle}>
                {lateRow ? "Update Record" : "New Collection"}
              </Text>
              <Text style={styles.statusSub}>
                {lateRow
                  ? "Entries for this date already exist."
                  : "No entries found for selected date."}
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            {fetching ? (
              <ActivityIndicator
                size="large"
                color={COLORS.primaryRed}
                style={{ margin: 40 }}
              />
            ) : (
              <>
                <Text style={styles.inputLabel}>Sales Person</Text>
                <View style={styles.disabledInput}>
                  <Icon
                    name="account-circle-outline"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.disabledText}>
                    {userFullName || "Loading..."}
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon
                    name="calendar-range"
                    size={20}
                    color={COLORS.primaryRed}
                  />
                  <Text style={styles.dateText}>
                    {moment(selectedDate).format("DD MMMM, YYYY")}
                  </Text>
                  <Icon
                    name="chevron-down"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>

                <Text style={styles.inputLabel}>Collected Amount</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.textInput}
                    value={lateCollectedAmt}
                    onChangeText={setLateCollectedAmt}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>

                <Text style={styles.inputLabel}>Remarks</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  placeholder="Additional notes here..."
                  placeholderTextColor={COLORS.textSecondary}
                />
              </>
            )}
          </View>
        </ScrollView>

        {/* ✅ FOOTER BUTTON */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.submitBtn, (submitting || fetching) && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting || fetching}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Icon
                  name={lateRow ? "update" : "cloud-upload"}
                  size={22}
                  color={COLORS.white}
                />
                <Text style={styles.submitBtnText}>
                  {lateRow ? "UPDATE ENTRY" : "SUBMIT ENTRY"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setShowDatePicker(false);
            if (d) setSelectedDate(d);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.primaryRed,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerContent: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  iconBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },

  scroll: { padding: 16 },

  statusCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  indicator: { width: 4, height: 35, borderRadius: 2, marginRight: 15 },
  statusTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textMain },
  statusSub: { fontSize: 12, color: COLORS.textSecondary },

  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 15,
  },

  disabledInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.disabled,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabledText: { marginLeft: 10, color: COLORS.textSecondary, fontWeight: "600" },

  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7D7",
  },
  dateText: { flex: 1, marginLeft: 10, fontWeight: "700", color: COLORS.textMain },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primaryRed,
    marginRight: 8,
  },
  textInput: { flex: 1, height: 50, fontSize: 16, fontWeight: "600", color: COLORS.textMain },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
    marginTop: 5,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  footer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.primaryRed,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.primaryOrange,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
  },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "800", marginLeft: 10 },
});

export default LateCollection;
