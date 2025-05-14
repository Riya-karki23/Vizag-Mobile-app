import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import TopBar from "../../component/TopBar/TopBar";
import { SafeAreaView } from "react-native-safe-area-context";
import Loader from "../../component/loader/appLoader";
import { Strings } from "../../constant/string_constant";
import { Colors } from "../../constant/color";
import CustomText from "../../component/CustomText/customText";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import {
  fetchProductionEntryData,
  getSingleProductEntry,
} from "../../api/productionEntry/fetchProductionEntryData";
import LinearGradient from "react-native-linear-gradient";
import SalesOrderDropdown from "../../component/SalesOrderDropdown";
import { AppRoutes } from "../../constant/appRoutes";
import { request } from "../../api/auth/auth";
import { showToast } from "../../constant/toast";
import CustomButton from "../../component/CustomButton";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width, height } = Dimensions.get("window");
const baseWidth = 375;
const desiredFontSize = 20;
const responsiveFontSize = desiredFontSize * (width / baseWidth);

const CreateProductionEntry = ({ route }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [buttonLoading, setButtonLoading] = useState(false);
  const [SelectedSalesOrder, setSelectedSalesOrder] = useState("");
  const [salesOrderItems, setSalesOrderItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [submittedItems, setSubmittedItems] = useState([]);
  const [updatedTableData, setUpdatedTableData] = useState([]);
  const [readonlyItems, setReadonlyItems] = useState([]);
  const [productIdData, setProductIdData] = useState(null);

  const ProductID = route?.params?.ProductID || null;
  const isEditMode = !!ProductID;

  useEffect(() => {
    if (ProductID) {
      fetchProductIdData();
    }
  }, [ProductID]);

  useEffect(() => {
    if (isEditMode && productIdData) {
      setSelectedSalesOrder(productIdData.select);
      setSalesOrderItems(productIdData.sales_order_item || []);
      setUpdatedTableData(productIdData.updated_sales_order || []);
    }
  }, [isEditMode, productIdData]);

  const fetchProductIdData = async () => {
    setLoading(true);
    var getIdData = await getSingleProductEntry(ProductID);
    setProductIdData(getIdData.data);
    setLoading(false);
  };

  const handleSalesOrderSelect = async (salesOrderName) => {
    if (!salesOrderName) {
      showToast("Please select a Sales Order before proceeding.", true);
      return;
    }

    setSelectedSalesOrder(salesOrderName);
    const Url = `${AppRoutes.SALESORDER}/${salesOrderName}`;

    try {
      const response = await request("GET", Url);
      const result = await response;
      console.log("result", result.data.data.items);
      if (result.data) {
        setSalesOrderItems(result.data.data.items || []);
      } else {
        showToast("Could not fetch Sales Order data.", true);
      }
    } catch (error) {
      console.log("Sales order fetch error:", error);
      showToast("Error fetching Sales Order", true);
    }
  };

  const toggleItemSelection = (itemId) => {
    let updatedSelection;

    if (selectedItems.includes(itemId)) {
      updatedSelection = [];
    } else {
      updatedSelection = [itemId];
    }

    setSelectedItems(updatedSelection);
  };

  const handleSendProduction = () => {
    const selectedData = salesOrderItems.filter((item) =>
      selectedItems.includes(item.idx)
    );
    const enrichedData = selectedData.map((item) => ({
      ...item,
      qty: item.qty ?? 0,
      amount: "",
      date: new Date().toISOString().split("T")[0],
    }));

    setSubmittedItems(enrichedData);
  };

  const completedProduction = async () => {
    const processedItems = submittedItems.map((item) => ({
      ...item,
      quantity: isEditMode ? (item.quantity ?? item.qty) : item.qty,
      produced_nos: isEditMode ? (item.produced_nos ?? item.amount ?? "") : "",
      production_date: new Date().toISOString().split("T")[0] ,
    }));

    setUpdatedTableData((prev) => [...prev, ...processedItems]);
    setReadonlyItems((prev) =>
      Array.from(new Set([...prev, ...processedItems.map((item) => item.idx)]))
    );

    setSubmittedItems([]);
  };

  const handleDelete = (id) => {
    console.log("id>>>", id);
    const filteredData = updatedTableData.filter((item) => item.idx !== id);
    showToast("Item deleted successfully!", false);
    setUpdatedTableData(filteredData);
  };

  const handleSubmit = async () => {
    if (!SelectedSalesOrder) {
      showToast("Please select sales order !", true);
      return;
    }

    const payload = {
      select: SelectedSalesOrder,
      doctype: "Production Entry",
      sales_order_item: salesOrderItems.map((item, index) => ({
        item_code: item.item_code,
        delivery_date: item.delivery_date,
        item_name: item.item_name,
        description: item.description,
        type: item.type,
        length: item.length,
        no_of_sheet: item.no_of_sheet,
        qty: item.qty,
        stock_uom: item.stock_uom,
        uom: item.uom,
        sqm: item.sqm,
        sqm_weight: item.sqm_weight,
        parentfield: "sales_order_items",
        parenttype: "Production Entry",
        doctype: "Production Entry Item",
      })),
      production_table: submittedItems.map((item, index) => ({
        to_produce_nos: item.qty,
        produced_nos: item.amount,
        date: item.date,
      })),
      updated_sales_order: updatedTableData.map((item, index) => ({
        quantity: item.qty,
        produced_nos: item.amount,
        date: item.date,
        parentfield: "updated_sales_order",
        parenttype: "Production Entry",
        doctype: "Final Sales Order",
      })),
    };
    // console.log("payload",payload);

    setButtonLoading(true);
    try {
      const response = await request("POST", AppRoutes.PRODUCTENTRY, payload);
      if (response.statusCode === 200 || response.success === true) {
        showToast("product Entry Created!", false);
        navigation.navigate("Production Entry");
        // ClearForm();
      } else {
        throw new Error("product Entry creation failed");
      }
    } catch (error) {
      console.log("[ERROR]: product Entry Create failed:", error);
      showToast("Error  product Entry", true);
    } finally {
      setButtonLoading(false);
    }
  };

  const handleUpdate = async () => {
    const updatedData = updatedTableData.map((item) => ({
      name: item.name || "item_" + Math.random().toString(36).substring(2, 10),
      quantity: isEditMode ? (item.quantity ?? item.qty) : item.qty,
      produced_nos: isEditMode ? (item.produced_nos ?? item.amount ?? "") : "",
      production_date:isEditMode ? item.production_date :  new Date().toISOString().split("T")[0],
    }));

    const payload = {
      name: ProductID,
      sales_order_item: salesOrderItems.map((item) => ({
        name: item.name,
        parent: ProductID,
        parentfield: "sales_order_item",
        parenttype: "Production Entry",
        item_code: item.item_code,
        delivery_date: item.delivery_date,
        item_name: item.item_name,
        description: item.description,
        type: item.type,
        length: item.length,
        no_of_sheet: item.no_of_sheet,
        qty: item.qty,
        stock_uom: item.stock_uom,
        uom: item.uom,
        sqm: item.sqm,
        sqm_weight: item.sqm_weight,
        doctype: "Production Entry Item",
        __islocal: 1,
      })),
      production_table: [],
      updated_sales_order: updatedData.map((item, index) => ({
        name: item.name,
        quantity: item.quantity,
        produced_nos: item.produced_nos,
        production_date: item.production_date,
        parentfield: "updated_sales_order",
        parenttype: "Production Entry",
        doctype: "Final Sales Order",
        __islocal: 1,
      })),
    };

    // console.log("payload",payload);

    setButtonLoading(true);
    try {
      const Url = `${AppRoutes.PRODUCTENTRY}/${payload.name}`;
      const response = await request("PUT", Url, payload);
      if (response.statusCode === 200 || response.success === true) {
        showToast("Product Entry Updated!", false);
        navigation.navigate("Production Entry");
      } else {
        throw new Error("Product Entry failed");
      }
    } catch (error) {
      showToast(_server_messages.message, true);
    } finally {
      setButtonLoading(false);
    }
  };

  // if (loading) {
  //   return <Loader isLoading={loading} />;
  // }

  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.mainContainer}>
          <TopBar />
          <ScrollView style={styles.container} nestedScrollEnabled={true}>
            <SalesOrderDropdown onSelect={handleSalesOrderSelect} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                marginTop: 20,
                color: Colors.black,
              }}
            >
              Sales Order Items:
            </Text>

            <ScrollView horizontal={true} style={{ marginVertical: 10 }}>
              <View>
                {/* Table Header */}
                <View style={styles.tableRowHeader}>
                  <Text style={styles.smallCell}>No</Text>
                  <View style={styles.verticalLine} />
                  <Text style={styles.wideCell}>Item Code</Text>
                  <View style={styles.verticalLine} />
                  <Text style={styles.wideCell}>Item Name</Text>
                  <View style={styles.verticalLine} />
                  <Text style={styles.wideCell}>Qty</Text>
                  <View style={styles.verticalLine} />
                  <Text style={styles.wideCell}>Delivery Period</Text>
                </View>

                {/* Table Body */}
                {salesOrderItems.length > 0 ? (
                  salesOrderItems.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                      <TouchableOpacity
                        onPress={() => toggleItemSelection(item.idx)}
                      >
                        <View style={styles.checkbox}>
                          {selectedItems.includes(item.idx) && (
                            <View style={styles.checkboxInner} />
                          )}
                        </View>
                      </TouchableOpacity>
                      <Text style={styles.smallCell}>{item.idx}</Text>
                      <View style={styles.verticalLine} />
                      <Text
                        style={styles.wideCell}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.item_code}
                      </Text>
                      <View style={styles.verticalLine} />
                      <Text
                        style={styles.wideCell}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.item_name}
                      </Text>
                      <View style={styles.verticalLine} />
                      <Text style={styles.wideCell}>{item.qty}</Text>
                      <View style={styles.verticalLine} />
                      <Text style={styles.wideCell}>{item.delivery_date}</Text>
                      <Text style={styles.wideCell}>{item.time || "N/A"}</Text>
                        
                    </View>
                  ))
                ) : (
                  <View style={styles.tableRow}>
                    <Text style={styles.wideCell}>No data available</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.Button}
              onPress={handleSendProduction}
            >
              <Text style={styles.ButtonText}>Send Production</Text>
            </TouchableOpacity>
            <ScrollView horizontal={true} style={{ marginVertical: 10 }}>
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: Colors.black,
                  }}
                >
                  Production Table
                </Text>
                <View style={styles.tableRowHeader}>
                  <Text style={styles.smallCell}>No</Text>
                  <View style={styles.verticalLine} />
                  <Text style={styles.wideCell}>To Produce (Nos)</Text>
                  <View style={styles.verticalLine} />
                  <Text style={styles.wideCell}>Produced (Nos)</Text>
                  <View style={styles.verticalLine} />
                  <Text style={styles.wideCell}>Date</Text>
                </View>

                {submittedItems.length > 0 ? (
                  submittedItems.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={styles.smallCell}>{item.idx}</Text>
                      <View style={styles.verticalLine} />
                      <Text style={[styles.wideCell, { padding: 4 }]}>
                        {item.qty}
                      </Text>
                      <View style={styles.verticalLine} />

                      <TextInput
                        style={[
                          styles.wideCell,
                          { borderWidth: 1, padding: 2, marginHorizontal: 4 },
                        ]}
                        value={item.amount}
                        keyboardType="numeric"
                        onChangeText={(text) => {
                          const numericText = text.replace(/[^0-9]/g, "");
                          const value = parseInt(numericText || "0", 10);
                          const maxQty = parseInt(item.qty, 10);

                          if (value > maxQty) {
                            showToast(
                              `Amount cannot exceed Qty (${item.qty}).`,
                              true
                            );
                            return;
                          }

                          const updated = [...submittedItems];
                          updated[index].amount = numericText;
                          setSubmittedItems(updated);
                        }}
                      />

                      <View style={styles.verticalLine} />

                      <Text style={styles.wideCell}>{item.date}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.tableRow}>
                    <Text style={styles.wideCell}>No data available</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.Button}
              onPress={completedProduction}
            >
              <Text style={styles.ButtonText}>Complete Production</Text>
            </TouchableOpacity>

            <ScrollView horizontal={true} style={{ marginVertical: 10 }}>
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: Colors.black,
                  }}
                >
                  Completed Order
                </Text>
                <View style={styles.tableRowHeader}>
                  <Text style={styles.smallCell}>No</Text>
                  <View style={styles.verticalLine} />
                  <Text style={styles.wideCell}>To Produce (Nos)</Text>
                  <View style={styles.verticalLine} />
                  <Text style={styles.wideCell}>Produced (Nos)</Text>
                  <View style={styles.verticalLine} />
                  <Text style={styles.wideCell}>Date</Text>
                  <View style={styles.verticalLine} />

                  {isEditMode ? (
                    <>
                      <Text style={styles.smallCell}>❌</Text>
                      <View style={styles.verticalLine} />
                    </>
                  ) : null}
                </View>

                {updatedTableData.length > 0 ? (
                  updatedTableData.map((item, index) => {
                    return (
                      <View key={index} style={styles.tableRow}>
                        <Text style={styles.smallCell}>{item.idx}</Text>
                        <View style={styles.verticalLine} />
                        <Text style={[styles.wideCell, { padding: 4 }]}>
                          {isEditMode ? (item.quantity ?? item.qty) : item.qty}
                        </Text>
                        <View style={styles.verticalLine} />
                        <TextInput
                          style={[
                            styles.wideCell,
                            { borderWidth: 1, padding: 2, marginHorizontal: 4 },
                          ]}
                          value={
                            isEditMode
                              ? String(item.produced_nos) || ""
                              : String(item.amount) || ""
                          }
                          keyboardType="numeric"
                          editable={false}
                          onChangeText={(text) => {
                            const numericText = text.replace(/[^0-9.]/g, "");
                            const updated = [...updatedTableData];
                            if (isEditMode) {
                              updated[index].produced_nos = numericText;
                            } else {
                              updated[index].amount = numericText;
                            }
                            setUpdatedTableData(updated);
                          }}
                        />
                        <View style={styles.verticalLine} />
                        <Text style={styles.wideCell}>
                          {isEditMode
                            ? (item.production_date?.split(" ")[0] ?? "")
                            : (item.date ?? "")}
                        </Text>
                        <View style={styles.verticalLine} />
                        {isEditMode ? (
                          <>
                            <TouchableOpacity
                              onPress={() => handleDelete(item.idx)}
                              style={styles.iconCell}
                            >
                              <Icon name="delete" size={24} color="red" />
                            </TouchableOpacity>
                          </>
                        ) : null}
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.tableRow}>
                    <Text style={styles.wideCell}>No data available</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <CustomButton
              title={isEditMode ? "Update" : "Add"}
              onPress={isEditMode ? handleUpdate : handleSubmit}
              isLoading={buttonLoading}
              style={styles.taskButton}
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  Button: {
    marginBottom: 0,
    marginTop: 10,
    paddingHorizontal: 0,
    paddingVertical: 10,
    fontSize: 10,
    color: Colors.whiteColor,
    backgroundColor: Colors.orangeColor,
    maxWidth: 160,
    borderRadius: 8,
  },
  ButtonText: {
    color: Colors.whiteColor,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },

  UpdateSalesOrderButton: {
    marginBottom: 0,
    marginTop: 10,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 10,
    color: Colors.whiteColor,
    backgroundColor: Colors.orangeColor,
    maxWidth: 200,
    borderRadius: 8,
  },
  label: {
    marginBottom: 5,
    marginTop: 10,
    paddingHorizontal: 6,
    fontSize: 16,
    color: Colors.darkGreyColor,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  DependentTaskButton: {
    marginTop: 10,
    marginBottom: 0,
    paddingHorizontal: 0,
  },

  taskButton: {
    marginTop: 10,
    marginBottom: 25,
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: Colors.whiteColor,
    backgroundColor: Colors.orangeColor,
    borderRadius: 8,
  },

  inputStyle: {
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 0,
    width: "100%",
    borderRadius: 8,
    fontSize: 14,
    borderColor: Colors.borderColor,
  },

  tableRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    color: Colors.blackColor,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  checkboxInner: {
    width: 8,
    height: 8,
    backgroundColor: "#000",
    borderRadius: 4,
  },
  smallCell: {
    width: 50,
    textAlign: "center",
    color: Colors.blackColor,
  },
  wideCell: {
    width: 150,
    textAlign: "center",
    paddingHorizontal: 4,
    color: Colors.blackColor,
  },
  verticalLine: {
    height: "100%",
    width: 0.5,
    backgroundColor: Colors.whiteColor,
  },
  iconCell: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
});

export default CreateProductionEntry;
