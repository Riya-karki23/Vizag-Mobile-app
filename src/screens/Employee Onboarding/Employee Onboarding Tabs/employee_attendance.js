import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import CustomText from "../../../component/CustomText/customText";
import { Colors } from "../../../constant/color";
import { Strings } from "../../../constant/string_constant";
import { ScrollView } from "react-native-gesture-handler";

const EmployeeAttendanceDetail = ({ empData }) => {
  return (
    <ScrollView>
      <View style={styles.container}>
        <CustomText style={styles.headingText}>Mobile</CustomText>
        <TextInput
          placeholderTextColor={Colors.lightGreyColor}
          style={styles.input}
          editable={false}
          value={empData?.cell_number}
          cursorColor={Colors.orangeColor}
          placeholder="Mobile"
        />
        <CustomText style={styles.headingText}>Personal Email</CustomText>
        <TextInput
          placeholderTextColor={Colors.lightGreyColor}
          style={styles.input}
          editable={false}
          value={empData?.personal_email}
          cursorColor={Colors.orangeColor}
          placeholder="Personal Email"
        />
        <CustomText style={styles.headingText}>Prefered Email</CustomText>
        <TextInput
          placeholderTextColor={Colors.lightGreyColor}
          style={styles.input}
          editable={false}
          value={empData?.prefered_email}
          cursorColor={Colors.orangeColor}
          placeholder="Prefered Email"
        />
        <CustomText style={styles.headingText}>Company Email</CustomText>
        <TextInput
          placeholderTextColor={Colors.lightGreyColor}
          style={styles.input}
          editable={false}
          value={empData?.company_email}
          cursorColor={Colors.orangeColor}
          placeholder="Company Email"
        />
        <CustomText style={styles.headingText}>Current Address</CustomText>
        <TextInput
          placeholderTextColor={Colors.lightGreyColor}
          style={[styles.input, { height: 100, borderRadius: 13 }]}
          editable={false}
          value={empData?.current_address}
          cursorColor={Colors.orangeColor}
          multiline={true}
          placeholder="Current Address"
        />

        <CustomText style={styles.headingText}>
          Emergency Contact Name
        </CustomText>
        <TextInput
          placeholderTextColor={Colors.lightGreyColor}
          style={styles.input}
          editable={false}
          value={empData?.person_to_be_contacted}
          cursorColor={Colors.orangeColor}
          placeholder="Emergency Contact Name"
        />
        <CustomText style={styles.headingText}>Emergency Phone</CustomText>
        <TextInput
          placeholderTextColor={Colors.lightGreyColor}
          style={styles.input}
          editable={false}
          value={empData?.emergency_phone_number}
          cursorColor={Colors.orangeColor}
          placeholder="Emergency Phone"
        />
        <CustomText style={styles.headingText}>Relation</CustomText>
        <TextInput
          placeholderTextColor={Colors.lightGreyColor}
          style={styles.input}
          editable={false}
          value={empData?.relation}
          cursorColor={Colors.orangeColor}
          placeholder="Relation"
        />
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  headingText: {
    fontSize: 16,
    fontWeight: Platform.OS == "ios" ? 600 : null,
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,

    paddingVertical: 10,
  },
  input: {
    marginHorizontal: 20,
    height: 50,
    padding: 10,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    fontSize: 15,
    color: Colors.blackColor,
    backgroundColor: Colors.whiteColor,
    fontFamily: Strings.fontFamilyConstant,
  },
});

export default EmployeeAttendanceDetail;
