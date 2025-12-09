import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
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
import Ionicons from "react-native-vector-icons/Entypo";
import LinearGradient from "react-native-linear-gradient";
import { fetchSalesCollectionData } from "../../api/fetchSalesCollection/fetchSalesCollectionData";


const { width, height } = Dimensions.get("window");
const baseWidth = 375;
const desiredFontSize = 20;
const responsiveFontSize = desiredFontSize * (width / baseWidth);

const SalesOfficerColletionList = ({ route }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const [SalesOColletionList, setSalesOColletionList] = useState([]);
  const isFocused = useIsFocused();

  const filterData = async () => {
    try {
      setLoading(true);
      const data = await fetchSalesCollectionData();
      setSalesOColletionList(data.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterData();
  }, [isFocused]);

  if (loading) {
    return <Loader isLoading={loading} />;
  }

  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <TopBar />
          <View style={styles.filterButtons}>
            <CustomText style={styles.headerText}>Sales Officer Colletion List </CustomText>
            {/* <LinearGradient
              colors={[Colors.orangeColor, Colors.redColor]}
              style={styles.filterContainer}
            > */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Create Production Entry")}
              // {
              //   from_date: route.params?.fromDate || "",
              //   selected_log_type: route.params?.selectedLogType || "",

              // })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                height: 40,
                borderWidth: 1.5,
                gap: 5,
                borderColor: Colors.blackColor,
                borderRadius: 10,
                padding: 5,
              }}
            >
              <Ionicons name="plus" size={25} color={Colors.blackColor} />
              {/* <CustomText style={styles.AddText}> ADD</CustomText> */}
            </TouchableOpacity>
            {/* </LinearGradient> */}
          </View>

          {SalesOColletionList.length > 0 ? (
            <FlatList
              data={[...SalesOColletionList]}
              keyExtractor={(item, index) =>
                item.name ? item.name.toString() : index.toString()
              }
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate("Create Production Entry", {
                      ProductID: item.name,
                    });
                  }}
                >
                  <View
                    style={[
                      styles.tableRow,
                      {
                        backgroundColor:
                          index % 2 === 0 ? Colors.tableRowColor : "white",
                      },
                    ]}
                  >
                    <CustomText style={styles.tableCell}>
                      {item.name ? item.name : "NA"}
                    </CustomText>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <CustomText style={styles.noDataText}>
              {Strings.noDataAvailable}
            </CustomText>
          )}
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: 600,
    color: "#000",
  },
  safeAreaStyle: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontWeight: Platform.OS == "ios" ? 700 : null,
    fontSize: responsiveFontSize,
    marginBottom: 16,
    textAlign: "left",
    color: Colors.darkGreyColor,
    marginLeft: 18,
  },
  subText: {
    fontWeight: Platform.OS == "ios" ? 400 : null,
    fontSize: 14,
    marginBottom: 10,
    textAlign: "right",
    color: Colors.darkGreyColor,
    marginRight: 24,
  },

  tableRow: {
    flexDirection: "row",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderRadius: 10,
    padding: 7,
    marginLeft: 15,
    marginTop: 10,
    marginBottom: 4,
    marginRight: 15,
    backgroundColor: Colors.whiteColor,
  },
  tableCell: {
    flex: 1,
    paddingTop: 5,
    fontSize: 16,
    paddingLeft: 10,
    fontWeight: Platform.OS == "ios" ? 500 : null,
    textAlign: "left",
    fontFamily: Strings.fontFamilyConstant,
    color: Colors.darkGreyColor,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  noDataText: {
    padding: 20,
    textAlign: "center",
    color: Colors.darkGreyColor,
    marginTop: 20,
    fontSize: responsiveFontSize,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginRight: 20,
  },

  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  AddText: {
    color: Colors.blackColor,
    fontSize: 16,
    // fontWeight: "600",
  },

  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    gap: 2,
    paddingHorizontal: 10,
  },
  filterText: {
    fontSize: 14,
    color: Colors.whiteColor,
  },
});

export default SalesOfficerColletionList;
