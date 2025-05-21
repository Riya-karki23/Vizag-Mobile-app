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
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [SelectedSalesOrder, setSelectedSalesOrder] = useState("");
  const [salesOrderItems, setSalesOrderItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [submittedItems, setSubmittedItems] = useState([]);
  const [updatedTableData, setUpdatedTableData] = useState([]);
  const [readonlyItems, setReadonlyItems] = useState([]);
  const [productIdData, setProductIdData] = useState(null);
  const [SalesOrderTime, setSalesOrderTime] = useState(null);
  const [salesOderStatus, setSalesOrderStatus] = useState(null);
const [isDropdownDisabled, setIsDropdownDisabled] = useState(false);

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
      FetchSalesOrderTime(productIdData.select);
      setSalesOrderTime(productIdData.time);
      setSalesOrderStatus(productIdData.status);
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
      if (result.data) {
        setSalesOrderItems(result.data.data.items || []);
        setSalesOrderTime(result.data.data.time);
        setSalesOrderStatus(result.data.data.status);

        
      } else {
        showToast("Could not fetch Sales Order data.", true);
      }
    } catch (error) {
      console.log("Sales order fetch error:", error);
      showToast("Error fetching Sales Order", true);
    }
  };

  const FetchSalesOrderTime =  async(salesOrderId) => {
     const Url = `${AppRoutes.SALESORDER}/${salesOrderId}`;

    try {
      const response = await request("GET", Url);
      const result = await response;
      if (result.data) {
        setSalesOrderTime(result.data.data.time);
        setSalesOrderStatus(result.data.data.status);
      } else {
        showToast("Could not fetch Sales Order data.", true);
      }
    } catch (error) {
      console.log("Sales order fetch error:", error);
      showToast("Error fetching Sales Order", true);
    }
  }

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
    const hasInvalidSheet = selectedData.some(
    (item) => parseFloat(item.no_of_sheet) <= 0
  );

  if (hasInvalidSheet) {
    showToast("No. of Sheet must be greater than 0.", true); 
    return;
  }
    const enrichedData = selectedData.map((item) => ({
      ...item,
      qty: item.qty ?? 0,
      amount: "",
      no_of_sheet:item.no_of_sheet ,
      date: new Date().toISOString().split("T")[0],
    }));
    setSubmittedItems(enrichedData);
    setIsDropdownDisabled(true);};



const completedProduction = async () => {
  const processedItems = submittedItems.map((item) => {
    const previousItem = salesOrderItems.find(i => i.idx === item.idx);
    const previousProducedQty = parseFloat(previousItem?.produced_quantity || 0);
    const enteredAmount = parseFloat(item.amount || 0);

    const totalProducedQty = enteredAmount;
    const noOfSheet = item.no_of_sheet - enteredAmount;
    const qtyPerWeight = item.qty / enteredAmount;

    return {
      ...item,
      produced_nos: isEditMode ? (item.produced_nos ?? item.amount ?? "") : "",
      production_date: new Date().toISOString().split("T")[0],
      quantity: item.qty * enteredAmount / item.no_of_sheet,
      qty_per_weight:( item.qty * enteredAmount / item.no_of_sheet) /enteredAmount ,
      produced_quantity: totalProducedQty,
      no_of_sheet: noOfSheet.toFixed(2),
    };
  });


  // Update salesOrderItems table
  const updatedSalesOrderItems = salesOrderItems.map((item) => {
    const matchingProcessed = processedItems.find((sub) => sub.idx === item.idx);
    if (matchingProcessed) {
      return {
        ...item,
        produced_quantity: matchingProcessed.produced_quantity,
        no_of_sheet: matchingProcessed.no_of_sheet,
        qty_per_weight: matchingProcessed.qty_per_weight,
      };
    }
    return item;
  });

  setSalesOrderItems(updatedSalesOrderItems); 
  setUpdatedTableData((prev) => [...prev, ...processedItems]);

  setReadonlyItems((prev) =>
    Array.from(new Set([...prev, ...processedItems.map((item) => item.idx)]))
  );
  setSubmittedItems([]);
  return updatedSalesOrderItems
};



const handleDelete = (index) => {
  const filteredData = updatedTableData.filter((_, i) => i !== index);
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
       qty_per_weight: item.qty_per_weight,
        qty: item.qty,
         produced_quantity: item.produced_quantity,
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
    quantity: item.quantity, 
    produced_nos: item.amount,
    produced_quantity: item.produced_quantity,
    qty_per_weight: item.qty_per_weight,
    no_of_sheet: item.no_of_sheet,
    date: item.date,
    parentfield: "updated_sales_order",
    parenttype: "Production Entry",
    doctype: "Final Sales Order",
      })),
    };
  // console.log(payload); 

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
      name: `${Math.random().toString(36).substring(2, 15)}`,
      quantity: isEditMode ? (item.quantity ?? item.amount ?? item.produced_quantity) : "",
      produced_nos: isEditMode ? (
  item.produced_quantity ?? item.produced_nos ?? item.amount ?? "N/A"
) : "",
      production_date: isEditMode
        ? item.production_date
        : new Date().toISOString().split("T")[0],
  qty_per_weight:isEditMode ? (item.qty_per_weight ?? item.amount ?? "") : item.qty_per_weight ?? "",       
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
       qty_per_weight: item.qty_per_weight ?? item.amount ?? "" ,
        produced_quantity:item.produced_quantity ?? item.produced_nos ?? item.amount ?? "N/A",
        qty: item.qty,
        stock_uom: item.stock_uom,
        uom: item.uom,
        sqm: item.sqm,
        sqm_weight: item.sqm_weight,
        doctype: "Production Entry Item",
        __islocal: 1,
      })),
      production_table: [],
      updated_sales_order:  updatedData.map((item, index) => ({
      name: item.name,
      produced_nos: item.produced_nos,
      quantity: item.quantity ,
      qty_per_weight: item.qty_per_weight,
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


const decodeHtmlEntities = (text) => {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  };


const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};


const formatTime = (timeStr) => {

  if (!timeStr) return "N/A";
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const getStatusInfo = (status) => {
    switch (status) {
      case 'To Deliver and Bill':
        return { label: 'Emergency', color: 'red' };
      case 'To Deliver':
        return { label: 'Priority', color: 'orange' };
      case 'On Hold':
        return { label: 'Standard', color: 'yellow' };
      default:
        return { label: status || 'N/A', color: 'gray' };
    }
  };
  const { label, color } = getStatusInfo(salesOderStatus);


  // if (loading) {
  //   return <Loader isLoading={loading} />;
  // }

  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.mainContainer}>
          <TopBar />
          <ScrollView style={styles.container} nestedScrollEnabled={true}>
            {
              !isDropdownDisabled && !isEditMode ?  <SalesOrderDropdown 
            onSelect={handleSalesOrderSelect}
            disabled={isDropdownDisabled}   
/> : null
            }
           
            <CustomText
              style={{
                fontSize: 16,
                marginTop: 20,
                color: Colors.blackColor,
              }}
            >
              Sales Order Items:
            </CustomText>

            <ScrollView horizontal={true} style={{ marginVertical: 10 }}>
              <View>
                {/* Table Header */}
                <View style={styles.tableRowHeader}>
                  <CustomText style={styles.smallCell}>No</CustomText>
                  <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>Item Code</CustomText>
                  <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>Item Name</CustomText>
                  <View style={styles.verticalLine} />
                   <CustomText style={styles.wideCell}>Description</CustomText>
                  <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>Qty per weight</CustomText>
                  <View style={styles.verticalLine} />
                   <CustomText style={styles.wideCell}>Produced Quantity</CustomText>
                  <View style={styles.verticalLine} />
                   <CustomText style={styles.wideCell}>crimping</CustomText>
                  <View style={styles.verticalLine} />
                   <CustomText style={styles.wideCell}>length</CustomText>
                    <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>Qty</CustomText>
                  <View style={styles.verticalLine} />
                   <CustomText style={styles.wideCell}>weight</CustomText>
                  <View style={styles.verticalLine} />
                   <CustomText style={styles.wideCell}>uom</CustomText>
                  <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>
                    Delivery Period
                  </CustomText>
                   <CustomText style={styles.wideCell}>
                    Time
                  </CustomText>
                   <CustomText style={styles.wideCell}>
                    Status
                  </CustomText>
                </View>

                {/* Table Body */}

{salesOrderItems.length > 0 ? (
  salesOrderItems.map((item, index) => {
  
    return (
      <View key={index} style={styles.tableRow}>
        <TouchableOpacity onPress={() => toggleItemSelection(item.idx)}>
          <View style={styles.checkbox}>
            {selectedItems.includes(item.idx) && (
              <View style={styles.checkboxInner} />
            )}
          </View>
        </TouchableOpacity>
        <CustomText style={styles.smallCell}>{item.idx}</CustomText>
        <View style={styles.verticalLine} />
        <CustomText style={styles.wideCell} numberOfLines={1} ellipsizeMode="tail">
          {item.item_code || "N/A"}
        </CustomText>
         <View style={styles.verticalLine} />
        <CustomText style={styles.wideCell} numberOfLines={1} ellipsizeMode="tail">
          {item.item_name || "N/A"}
        </CustomText>
        <View style={styles.verticalLine} />
        <CustomText style={styles.wideCell} numberOfLines={1} ellipsizeMode="tail">
           {decodeHtmlEntities(
                    item.description .replace(/<\/?[^>]+(>|$)/g, ''),
                  ) || "N/A"}
                  </CustomText>
        <View style={styles.verticalLine} />
         <CustomText style={styles.wideCell} numberOfLines={1} ellipsizeMode="tail">
           {item.qty_per_weight? (parseFloat(item.qty_per_weight).toFixed(3) || "N/A"): 0.000}
        </CustomText>
        <View style={styles.verticalLine} />
         <CustomText style={styles.wideCell} numberOfLines={1} ellipsizeMode="tail">
           {item.produced_quantity? parseFloat(item.produced_quantity).toFixed(3) : 0.000}</CustomText>

        <CustomText style={styles.wideCell} numberOfLines={1} ellipsizeMode="tail">
          {item.crimping_included || "N/A"}
        </CustomText>
        <View style={styles.verticalLine} />
        <CustomText style={styles.wideCell} numberOfLines={1} ellipsizeMode="tail">
          {item.length || "N/A"}
        </CustomText>
        <View style={styles.verticalLine} />
        <CustomText style={styles.wideCell} numberOfLines={1} ellipsizeMode="tail">
          {item.qty || "N/A"}
        </CustomText>
        <View style={styles.verticalLine} />
        <CustomText style={styles.wideCell} numberOfLines={1} ellipsizeMode="tail">
          {item.sqm_weight || "N/A"}
        </CustomText>
        <View style={styles.verticalLine} />
        <CustomText style={styles.wideCell} numberOfLines={1} ellipsizeMode="tail">
          {item.uom || "N/A"}
        </CustomText>
        <View style={styles.verticalLine} />
        <CustomText style={styles.wideCell}>
  {item.delivery_date
    ? new Date(item.delivery_date).toLocaleDateString('en-GB') 
    : "N/A"}
</CustomText>
 <CustomText style={styles.wideCell}>
  {formatTime(SalesOrderTime) || "N/A"}
</CustomText>
 <View style={styles.wideCell}>
   <View style={styles.statusContainer}>
    <View style={[styles.circle, { backgroundColor: color }]} />
      <CustomText style={styles.statusText} numberOfLines={1} ellipsizeMode="tail">
        {label || "N/A"}
      </CustomText>
      </View>
</View>
      </View>
    );
  })
) : (
  <View style={styles.tableRow}>
    <CustomText style={styles.wideCell}>
      {Strings.noRecordAvaliable}
    </CustomText>
  </View>
)}

              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.Button}
              onPress={handleSendProduction}
            >
              <CustomText style={styles.ButtonText}>Send Production</CustomText>
            </TouchableOpacity>
            <ScrollView horizontal={true} style={{ marginVertical: 10 }}>
              <View>
                <CustomText
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: Colors.black,
                  }}
                >
                  Production Table
                </CustomText>
                <View style={styles.tableRowHeader}>
                  <CustomText style={styles.smallCell}>No</CustomText>
                   <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>
                    No Of Sheet
                  </CustomText>
                  <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>
                    Produced (Nos)
                  </CustomText>
                   <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>
                    To Produce (Nos)
                  </CustomText>
                  <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>Date</CustomText>
                </View>

                {submittedItems.length > 0 ? (
                  submittedItems.map((item, index) => (
                    
                    <View key={index} style={styles.tableRow}>
                      <CustomText style={styles.smallCell}>
                        {item.idx}
                      </CustomText>
                       <View style={styles.verticalLine} />
                      <CustomText style={[styles.wideCell, { padding: 4 }]}>
                        { parseFloat(item.no_of_sheet).toFixed(3) || "N/A"}

                      </CustomText>
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
                          const maxQty = parseInt(item.no_of_sheet, 10);

                          if (value > maxQty) {
                            showToast(
                              `Amount cannot exceed Qty (${item.no_of_sheet}).`,
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
                      <CustomText style={[styles.wideCell, { padding: 4 }]}>
                        {item.qty}
                      </CustomText>

                      <View style={styles.verticalLine} />
<CustomText style={styles.wideCell}>
  {item.date
    ? new Date(item.date).toLocaleDateString('en-GB')
    : "N/A"}
</CustomText>

                    </View>
                  ))
                ) : (
                  <View style={styles.tableRow}>
                    <CustomText style={styles.wideCell}>
                      {Strings.noRecordAvaliable}
                    </CustomText>
                  </View>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.Button}
              onPress={completedProduction}
            >
              <CustomText style={styles.ButtonText}>
                Complete Production
              </CustomText>
            </TouchableOpacity>

            <ScrollView horizontal={true} style={{ marginVertical: 10 }}>
              <View>
                <CustomText
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: Colors.black,
                  }}
                >
                  Completed Order
                </CustomText>
                <View style={styles.tableRowHeader}>
                  <CustomText style={styles.smallCell}>No</CustomText>
                  <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>
                    Produced (Nos)
                  </CustomText>
                  <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>
                    Quantity
                  </CustomText>
                  <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>
                    Qty Per weight
                  </CustomText>
                  <View style={styles.verticalLine} />
                  <CustomText style={styles.wideCell}>Date</CustomText>
                  <View style={styles.verticalLine} />

                  {isEditMode ? (
                    <>
                      <CustomText style={styles.smallCell}>❌</CustomText>
                      <View style={styles.verticalLine} />
                    </>
                  ) : null}
                </View>

                {updatedTableData.length > 0 ? (
                  updatedTableData.map((item, index) => {
                    return (
                      <View key={index} style={styles.tableRow}>
                        <CustomText style={styles.smallCell}>
                          {item.idx}
                        </CustomText>
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
                        <CustomText style={[styles.wideCell, { padding: 4 }]}>
                          { parseFloat(item.quantity).toFixed(3) || "N/A"}
                           {/* {isEditMode ? (item.quantity ?? item.qty) : item.qty}  */}
                        </CustomText>
                         <View style={styles.verticalLine} />
                        <CustomText style={[styles.wideCell, { padding: 4 }]}>
                            {parseFloat(item.qty_per_weight).toFixed(3) || "N/A"}
                        </CustomText>
                      
                        <View style={styles.verticalLine} />
                        <CustomText style={styles.wideCell}>
                             {isEditMode
    ? (item.production_date ? formatDate(item.production_date.split(" ")[0]) : "")
    : (item.date ? formatDate(item.date) : "")}
                        </CustomText>
                        <View style={styles.verticalLine} />
                        {isEditMode ? (
                          <>
                            <TouchableOpacity
                              onPress={() => handleDelete(index)}
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
                    <CustomText style={styles.wideCell}>
                      {Strings.noRecordAvaliable}
                    </CustomText>
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
  circle: {
  width: 10,
  height: 10,
  borderRadius: 5,
  marginHorizontal: 5,
},
 statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
  },
});

export default CreateProductionEntry;
