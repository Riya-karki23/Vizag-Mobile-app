import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import axios from "axios";
import RNFS from "react-native-fs";
import Pdf from "react-native-pdf";
import Print from "react-native-print";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { logError, logInfo } from "../../constant/logger";
import Loader from "../../component/loader/appLoader";
import { Colors } from "../../constant/color";
import CustomText from "../../component/CustomText/customText";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
const { width, height } = Dimensions.get("window");
const baseWidth = 375;
const desiredFontSize = 20;
const responsiveFontSize = desiredFontSize * (width / baseWidth);
const desiredFontSizeLabel = 16;
const responsiveFontSizeLabel = desiredFontSizeLabel * (width / baseWidth);

const SalarySlipPrint = ({ route }) => {
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { item } = route.params;
  const navigation = useNavigation();
  const data = new URLSearchParams({
    doctype: "Salary Slip",
    name: item.name,
    format: "Salary Slip Standard",
    no_letterhead: "1",
  }).toString();
  const getBaseURL = async () => {
    try {
      const baseURL = await getItemFromStorage(Strings.baseURL);
      if (!baseURL) {
        throw new Error("Base URL not found. Please log in again.");
      }
      const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${baseURL}/api/method/frappe.utils.print_format.download_pdf`, // Use baseURL here
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "••••••",
          Cookie:
            "full_name=Administrator; sid=654caf647600cd49be5530488ceb3d4b43e0a3cb9b5e1f52974f4c94; system_user=yes; user_id=Administrator; user_image=",
        },
        responseType: "arraybuffer",
        data: data,
      };

      try {
        const response = await axios(config);

        const base64Data = btoa(
          new Uint8Array(response.data).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );

        const filePath = `${RNFS.DocumentDirectoryPath}/file.pdf`;
        await RNFS.writeFile(filePath, base64Data, "base64");
        setPdfUrl(filePath);
      } catch (error) {
        logError(
          "Error fetching PDF:",
          error.response ? error.response.data : error.message
        );
      } finally {
        setLoading(false);
      }
    } catch (error) {
      logError("Error fetching baseURL or making request:", error);
    }
  };

  getBaseURL();

  useEffect(() => {
    getBaseURL();
  }, []);

  const handlePrint = async () => {
    try {
      await Print.print({
        filePath: `${RNFS.DocumentDirectoryPath}/file.pdf`,
      });
    } catch (error) {
      logError("Error printing PDF:", error);
    }
  };

  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={24} color={Colors.orangeColor} />
          </TouchableOpacity>

          {loading && <Loader isLoading={loading} />}
          {pdfUrl ? (
            <View style={styles.container}>
              <Pdf
                source={{ uri: pdfUrl, cache: true }}
                onLoadComplete={(numberOfPages) => {}}
                onPageChanged={(page) => {}}
                onError={(error) => {
                  logError("Error", error);
                }}
                onPressLink={(uri) => {
                  logInfo(`Link pressed: ${uri}`);
                }}
                style={{ flex: 1, backgroundColor: Colors.whiteColor }}
              />
              <TouchableOpacity style={styles.addButton} onPress={handlePrint}>
                <LinearGradient
                  colors={[Colors.orangeColor, Colors.redColor]}
                  style={styles.addButton}
                >
                  <CustomText style={styles.addButtonText}>Print</CustomText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            !loading && <Loader isLoading={true} />
          )}
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  addButton: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  addButtonText: {
    color: Colors.whiteColor,
    // fontWeight: 700,
    textAlign: "center",
    fontSize: responsiveFontSizeLabel,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: responsiveFontSize,
    color: Colors.darkGreyColor,
  },
});

export default SalarySlipPrint;
