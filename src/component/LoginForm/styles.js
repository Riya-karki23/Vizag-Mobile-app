import { StyleSheet } from "react-native";
import { Colors } from "../../constant/color";
import { Strings } from "../../constant/string_constant";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 30,
  },
  logoConatiner: {
    paddingBottom: 80,
  },
  multarkLogo: {
    width: 250,
    height: 60,
  },
  loginImage: {
    width: 273.76,
    height: 249,
  },
  fieldContainer: {
    paddingRight: 20,
    paddingLeft: 20,
  },
  input: {
    marginBottom: 30,
    width: "100%",
    height: 56,
    borderRadius: 24,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: Colors.pinkColor,
    elevation: 5,
    fontSize: 16,
    fontFamily: Strings.fontFamilyConstant,
    color: "black",
    fontSize: 16,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  activeInput: {
    borderWidth: 1,
    borderColor: Colors.redColor,
  },
  Submitbutton: {
    alignItems: "center",
    width: "100%",
    height: 50,
    borderRadius: 24,
    paddingBottom: 14,
    paddingTop: 14,
    marginBottom: 40,
    // marginTop: 5,
  },

  button: {
    alignItems: "center",
    width: "100%",
    height: 50,
    borderRadius: 24,
    paddingBottom: 14,
    paddingTop: 14,
    marginBottom: 40,
    marginTop: 5,
  },
  buttonText: {
    color: Colors.whiteColor,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
  },
  error: {
    color: "red",
    marginBottom: 12,
  },
  svg: {
    position: "absolute",
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: 5,
    bottom: "55%",
    paddingRight: 20,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    paddingTop: 20,
    backgroundColor: "white",
    borderRadius: 20,
    width: "70%",
    alignItems: "center",
  },
  modalTextContainer: {
    marginTop: 6,
  },
  modelHading: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "left",
    color: Colors.darkGreyColor,
    marginRight: 5,
    lineHeight: 22,
  },
  boldText: {
    fontSize: 14,
    // fontWeight: "600",
    textAlign: "left",
    color: Colors.darkGreyColor,
    marginRight: 5,
    lineHeight: 22,
  },
  boldTextHighlight: {
    fontSize: 12,
    // fontWeight: "400",
    color: Colors.redColor,
    marginLeft: 5,
    textAlign: "right",
  },
  CloseButton: {
    alignItems: "center",
    textAlign: "center",
    width: 80,
    height: 36,
    borderRadius: 24,
    marginTop: 10,
  },
  CloseButtonText: {
    color: Colors.whiteColor,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    alignItems: "center",
    marginTop: 8,
  },
});

export default styles;
