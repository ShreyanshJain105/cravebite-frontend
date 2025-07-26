import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { assets } from '../../assets/assets';

const Orders = () => {
   const [data, setData] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [updating, setUpdating] = useState(null); // Track which order is being updated
   
   const getAuthHeaders = () => {
      const token = localStorage.getItem('token');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
   };
   
   const fetchOrders = async () => {
      try {
         setLoading(true);
         setError(null);
         
         const headers = getAuthHeaders();
         
         const response = await axios.get('http://localhost:8080/api/orders/all', { headers });
         
         // Ensure we always have an array
         const ordersArray = Array.isArray(response.data) ? response.data : [];
         
         setData(ordersArray);
         
      } catch (error) {
         console.error('Error fetching orders:', error);
         
         // Handle different error scenarios
         if (error.response?.status === 401) {
            setError('Authentication failed. Please log in again.');
            // Optionally redirect to login
         } else if (error.response?.status === 403) {
            setError('Access denied. Admin privileges required.');
         } else {
            setError(error.response?.data?.message || error.message || 'Failed to fetch orders');
         }
      } finally {
         setLoading(false);
      }
   };
   
   const updateStatus = async (event, orderId) => {
      try {
         setUpdating(orderId);
         const newStatus = event.target.value;
         
         const headers = getAuthHeaders();
         
         await axios.patch(
            `http://localhost:8080/api/orders/status/${orderId}?status=${newStatus}`,
            null,
            { headers }
         );
         
         // Update the local state immediately for better UX
         setData(prevData => 
            prevData.map(order => 
               order.id === orderId 
                  ? { ...order, orderStatus: newStatus }
                  : order
            )
         );
         
      } catch (error) {
         console.error('Error updating status:', error);
         
         // Reset the select value on error
         event.target.value = data.find(order => order.id === orderId)?.orderStatus || 'PENDING';
         
         const errorMessage = error.response?.data?.message || error.message || 'Failed to update status';
         alert('Failed to update status: ' + errorMessage);
      } finally {
         setUpdating(null);
      }
   };
   
   useEffect(() => {
      fetchOrders();
   }, []);
   
   if (loading) {
      return (
         <div className="container">
            <div className="py-5 row justify-content-center">
               <div className="col-11 card">
                  <div className="card-body text-center">
                     <div className="spinner-border" role="status">
                        <span className="sr-only">Loading...</span>
                     </div>
                     <p className="mt-2">Loading orders...</p>
                  </div>
               </div>
            </div>
         </div>
      );
   }
   
   if (error) {
      return (
         <div className="container">
            <div className="py-5 row justify-content-center">
               <div className="col-11 card">
                  <div className="card-body text-center">
                     <div className="alert alert-danger">
                        <h5>Error Loading Orders</h5>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={fetchOrders}>
                           Try Again
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }
   
   return (
      <div className="container">
         <div className="py-5 row justify-content-center">
            <div className="col-11 card">
               <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Orders ({data.length})</h5>
                  <button 
                     className="btn btn-outline-primary btn-sm" 
                     onClick={fetchOrders}
                     disabled={loading}
                  >
                     {loading ? 'Loading...' : 'Refresh'}
                  </button>
               </div>
               <div className="table-responsive">
                  <table className="table">
                     <thead>
                        <tr>
                           <th>Image</th>
                           <th>Order Details</th>
                           <th>Amount</th>
                           <th>Items</th>
                           <th>Status</th>
                        </tr>
                     </thead>
                     <tbody>
                        {data.length > 0 ? data.map((order, index) => (
                           <tr key={order.id || index}>
                              <td>
                                 <img 
                                    src={assets.parcel} 
                                    alt="order" 
                                    height={48} 
                                    width={48} 
                                    className="img-fluid"
                                 />
                              </td>
                              <td>
                                 <div className="mb-2">
                                    <strong>Items:</strong>
                                    <br />
                                    {order.orderedItems?.map((item, itemIndex) => (
                                       <span key={itemIndex}>
                                          {item.name} x {item.quantity}
                                          {itemIndex < order.orderedItems.length - 1 ? ', ' : ''}
                                       </span>
                                    )) || 'No items'}
                                 </div>
                                 <div>
                                    <strong>Address:</strong>
                                    <br />
                                    {order.userAddress || 'No address provided'}
                                 </div>
                              </td>
                              <td>
                                 <strong>&#x20B9; {order.amount?.toFixed(2) || '0.00'}</strong>
                              </td>
                              <td>
                                 <span className="badge badge-info">
                                    {order.orderedItems?.length || 0} items
                                 </span>
                              </td>
                              <td>
                                 <select 
                                    className='form-control' 
                                    onChange={(event) => updateStatus(event, order.id)} 
                                    value={order.orderStatus || 'PENDING'}
                                    disabled={updating === order.id}
                                 >
                                    <option value='PENDING'>PENDING</option>
                                    <option value='SHIPPED'>SHIPPED</option>
                                    <option value='DELIVERED'>DELIVERED</option>
                                    <option value='CANCELLED'>CANCELLED</option>
                                 </select>
                                 {updating === order.id && (
                                    <small className="text-muted">Updating...</small>
                                 )}
                              </td>
                           </tr>
                        )) : (
                           <tr>
                              <td colSpan="5" className="text-center py-4">
                                 <div className="text-muted">
                                    <h6>No orders found</h6>
                                    <p>There are no orders to display.</p>
                                    <button className="btn btn-link btn-sm" onClick={fetchOrders}>
                                       🔄 Refresh
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Orders;