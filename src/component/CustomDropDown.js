import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Colors } from '../constant/color';
import CustomText from './CustomText/customText';



const DropdownInput = ({
  title,
  options,
  value,
  onSelect,
}) => {
  const [selectedValue, setSelectedValue] = useState(null);

  const formattedOptions = (options ?? []).map(item => {
    if ('project_name' in item && item.project_name) {
      return {
        label: `${item.name} - ${item.project_name}`,
        value: item.name,
      };
    } else if ('subject' in item && item.subject) {
      return {
        label: `${item.name} - ${item.subject}`,
        value: item.name,
      };
    } else {
      return {
        label: item.name,
        value: item.name,
      };
    }
  });

  return (
    <View style={styles.container}>
      <CustomText style={styles.title}>{title}</CustomText>
      <Dropdown
        style={styles.dropdown}
        data={formattedOptions || []}
        labelField="label"
        valueField="value"
        placeholderStyle={{color: Colors.blackColor }}
        placeholder={`Select ${title}`}
        search
        searchPlaceholder="Search..." 
        inputSearchStyle={styles.searchInput} 
        value={selectedValue || value}
        iconColor={Colors.blackColor}
        iconStyle={{ width: 30, height: 30 }}
        containerStyle={{ maxHeight: 200 }}
        selectedTextStyle={{
    color: Colors.blackColor,
          fontSize: 16,
        }}
        onChange={item => {
          setSelectedValue(item.value);
          onSelect(item.value);
        }}
        renderItem={(item, selected) => (
          <View
            style={{
              padding: 10,
              backgroundColor: selected ? '#e0f7fa' : 'white',
            }}>
            <CustomText
              style={{
    color: Colors.greyishBlueColor,
                fontWeight: 'bold',
              }}>
              {item.label}
            </CustomText>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  title: {
    fontSize: 14,
    marginBottom: 5,
    color: Colors.blackColor,
  },
  dropdown: {
    height: 60,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: Colors.blackColor,
  },
  searchInput: {
    height: 40,
    fontSize: 16,
    paddingHorizontal: 10,
    borderRadius: 8,
    margin: 10,
    color: Colors.blackColor,
  },
});

export default DropdownInput;




  