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

  const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
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

  
  const fetchSalesOrders = async () => {
    setLoading(true);
    const Url = `${AppRoutes.SALESORDER}?fields=["name","customer_name","status","transaction_date","territory","order_type","company","time"]&limit_page_length=0`;
    try {
      const response = await  request("GET", Url) 
      const formatted = (response.data.data || []).map((item) => {
  const formattedDate = formatDate(item.transaction_date);
  const formattedTime = formatTime(item.time);

  return {
    name: item.name,
    project_name: `${item.customer_name},${item.status},${formattedDate},${item.territory},${item.order_type},${item.company},${formattedTime}`,
  };
});
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
