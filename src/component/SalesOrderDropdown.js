import React, { useEffect, useState } from 'react';
import { ActivityIndicator, TextStyle, View } from 'react-native';
import DropdownInput from './CustomDropDown';
import { Colors } from '../constant/color';
import { AppRoutes } from '../constant/appRoutes';
import { request } from '../api/auth/auth';
import Loader from './loader/appLoader';



const SalesOrderDropdown = ({ onSelect }) => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  
  
  const fetchSalesOrders = async () => {
    setLoading(true);
    const Url = `${AppRoutes.SALESORDER}?fields=["name","customer_name","status","transaction_date","territory","order_type","company","time"]&limit_page_length=0`;
    try {
      const response = await  request("GET", Url) 
      const formatted = (response.data.data || []).map((item) => ({
        name: item.name,
        project_name:
         `${item.customer_name},${item.status},${item.transaction_date},${item.territory},${item.order_type},${item.company},${item.time}`,
      }));
      setSalesOrders(formatted);
    } catch (err) {
      console.error('Failed to fetch sales orders:', err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View >
      {loading ? (
        
        // <ActivityIndicator size="small" color={Colors.orangeColor} />
        <Loader isLoading={loading}/>

      ) : (
        <DropdownInput
          title="Sales Order"
          options={salesOrders}
          onSelect={onSelect}
        />
      )}
    </View>
  );
};

export default SalesOrderDropdown;
