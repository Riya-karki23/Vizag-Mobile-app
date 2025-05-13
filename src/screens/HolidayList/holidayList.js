import { SafeAreaView, TouchableOpacity, View, StyleSheet } from "react-native";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import Icon from "react-native-vector-icons/Ionicons";
import CustomText from "../../component/CustomText/customText";
import { Colors } from "../../constant/color";
import { useEffect, useState } from "react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { fetchHoliday } from "../../api/fetchHoliday/fetchholiday";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import { request } from "../../api/auth/auth";
import Loader from "../../component/loader/appLoader";
import { FlatList } from "react-native-gesture-handler";
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const HolidayList = () => {
  const [holidayData, setholidayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedUserName = await getItemFromStorage(Strings.userName);
        if (storedUserName) {
          fetchHolidayListData(storedUserName);
        }
      } catch (error) {
        setLoading(false);
        logError("Failed to load username:", error);
      }
    };
    const fetchHolidayListData = async (userName) => {
      setLoading(true);
      try {
        const employeeResponse = await request(
          "GET",
          `/api/resource/Employee?filters=[["user_id", "=", "${userName}"]]`
        );
        if (employeeResponse.data.data.length > 0) {
          const employeeName = employeeResponse.data.data[0].name;

          const detailedEmployeeResponse = await request(
            "GET",
            `/api/resource/Employee/${employeeName}?fields=["holiday_list"]`
          );
          const data = await fetchHoliday(
            detailedEmployeeResponse.data.data["holiday_list"]
          );
          setholidayData(data.data["holidays"]);

          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
        logError("Failed to load employee Attendance Data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserName();
  }, [isFocused]);

  if (loading) {
    return <Loader isLoading={loading} />;
  }

  const removeHTMLTags = (html) => {
    return html.replace(/<[^>]*>/g, "").trim();
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };
  const getDay = (date) => {
    const options = { weekday: "long" };
    const day = new Intl.DateTimeFormat("en-US", options).format(
      new Date(date)
    );
    return day;
  };
  const isHolidayOver = (holidayDate) => {
    const holiday = new Date(holidayDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (holiday < today) {
      return true;
    } else {
      return false;
    }
  };
  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.attendanceView}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={30} color={Colors.orangeColor} />
          </TouchableOpacity>
          <CustomText style={styles.headerText}>Holiday List</CustomText>
        </View>
        <View>
          <FlatList
            data={holidayData}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={7}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CustomText
                  style={{
                    padding: 20,
                    textAlign: "center",
                    marginBottom: 8,
                    fontSize: 20,
                    color: Colors.blackColor,
                    fontWeight: Platform.OS == "ios" ? 600 : null,
                  }}
                >
                  {Strings.noListAvaliable}
                </CustomText>
              </View>
            }
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <View
                  style={[
                    styles.verticalLine,
                    {
                      backgroundColor: isHolidayOver(item.holiday_date)
                        ? Colors.lightGreyColor
                        : Colors.orangeColor,
                    },
                  ]}
                />
                <View style={styles.cardContent}>
                  <View style={styles.textContainer}>
                    <View style={styles.dayContainer}>
                      <View style={styles.dateContainer}>
                        <Icon
                          name="calendar-outline"
                          size={20}
                          color={Colors.orangeColor}
                          style={{ marginRight: 5, paddingBottom: 10 }}
                        />
                        <CustomText style={styles.holidayDate}>
                          {formatDate(item.holiday_date)}
                        </CustomText>
                      </View>
                      <CustomText
                        style={[
                          styles.holidayDate,
                          { color: Colors.mediumDarkGrey, fontSize: 14 },
                        ]}
                      >
                        {getDay(item.holiday_date)}
                      </CustomText>
                    </View>
                    <CustomText style={styles.holidayName}>
                      {removeHTMLTags(item.description)}
                    </CustomText>
                  </View>
                </View>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};
const styles = StyleSheet.create({
  verticalLine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    width: 10,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  dayContainer: {
    flexDirection: "row",
    alignContent: "space-between",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 3,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  cardContainer: {
    backgroundColor: Colors.whiteColor,
    borderRadius: 12,
    paddingLeft: 25,
    paddingRight: 16,
    paddingBottom: 8,
    paddingTop: 0,
    margin: 20,
    marginVertical: 8,
    elevation: 5,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    justifyContent: "center",
  },
  holidayName: {
    fontSize: 20,
    fontWeight: Platform.OS == "ios" ? 700 : null,
    color: Colors.darkGreyColor,
  },
  holidayDate: {
    fontSize: 16,
    paddingBottom: 10,
    fontWeight: Platform.OS == "ios" ? 700 : null,
    paddingLeft: 5,
    color: Colors.blackColor,
  },

  attendanceView: {
    flexDirection: "row",
  },
  headerText: {
    fontWeight: Platform.OS == "ios" ? 700 : null,
    fontSize: 20,
    marginBottom: 16,
    textAlign: "left",
    color: Colors.darkGreyColor,
    marginLeft: 0,
    paddingTop: 21,
  },
  container: {
    flex: 1,
    padding: 10,
  },
  addButton: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 10,
  },
});
export default HolidayList;
