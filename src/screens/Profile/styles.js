import { StyleSheet } from "react-native";
import { Colors } from "../../constant/color";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.whiteColor,
  },
  profileSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.orangeColor,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  initialText: {
    fontSize: 40,
    color: Colors.whiteColor,
    fontWeight: "bold",
  },
  userNameText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  fieldRow: {
    width: "100%",
    height: "auto",
    flexDirection: "row",
  },
  detailLabel: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "left",
    color: Colors.darkGreyColor,
    padding: 10,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: "400",
    marginBottom: 16,
    textAlign: "left",
    color: Colors.darkGreyColor,
    padding: 10,
  },
  backButton: {
    marginTop: 20,
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.whiteColor,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default styles;
