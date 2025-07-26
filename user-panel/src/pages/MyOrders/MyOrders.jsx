import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/assets";
import "./MyOrders.css";
import { fetchUserOrders } from "../../service/orderService";

const MyOrders = () => {
  const { token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Token available:", !!token); // Debug log
      
      if (!token) {
        setError("Please login to view your orders");
        setLoading(false);
        return;
      }

      const response = await fetchUserOrders(token);
      console.log("Orders response:", response); // Debug log
      
      // Handle different response structures
      let ordersArray = [];
      if (Array.isArray(response)) {
        ordersArray = response;
      } else if (response && Array.isArray(response.data)) {
        ordersArray = response.data;
      } else if (response && response.orders && Array.isArray(response.orders)) {
        ordersArray = response.orders;
      } else {
        console.warn("Unexpected response structure:", response);
        ordersArray = [];
      }
      
      setData(ordersArray);
      
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(
        error.response?.data?.message || 
        error.message || 
        "Failed to fetch orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("MyOrders component mounted, token:", !!token); // Debug log
    fetchOrders();
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <div className="py-5 row justify-content-center">
          <div className="col-11 card">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 mb-0">Loading your orders...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container">
        <div className="py-5 row justify-content-center">
          <div className="col-11 card">
            <div className="card-body text-center py-5">
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Error Loading Orders</strong>
                <p className="mb-3 mt-2">{error}</p>
                <button className="btn btn-primary" onClick={fetchOrders}>
                  <i className="bi bi-arrow-clockwise me-1"></i>
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
            <h5 className="mb-0">
              <i className="bi bi-bag-check me-2"></i>
              My Orders ({data.length})
            </h5>
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={fetchOrders}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>
          </div>
          
          {data.length === 0 ? (
            <div className="card-body text-center py-5">
              <div className="text-muted">
                <i className="bi bi-bag-x" style={{ fontSize: '3rem' }}></i>
                <h6 className="mt-3">No orders found</h6>
                <p>You haven't placed any orders yet.</p>
                <button className="btn btn-link btn-sm" onClick={fetchOrders}>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <tbody>
                  {data.map((order, index) => {
                    // Safety checks for order data
                    if (!order) {
                      console.warn("Invalid order data at index:", index);
                      return null;
                    }

                    const orderedItems = order.orderedItems || [];
                    const amount = order.amount || 0;
                    const orderStatus = order.orderStatus || 'PENDING';

                    return (
                      <tr key={order.id || index}>
                        <td className="align-middle" style={{ width: '80px' }}>
                          <img
                            src={assets.delivery}
                            alt="delivery"
                            height={48}
                            width={48}
                            className="rounded"
                          />
                        </td>
                        <td className="align-middle">
                          <div className="fw-medium">
                            {orderedItems.length > 0 ? (
                              orderedItems.map((item, itemIndex) => {
                                if (!item) return '';
                                const itemName = item.name || 'Unknown Item';
                                const itemQty = item.quantity || 0;
                                
                                if (itemIndex === orderedItems.length - 1) {
                                  return `${itemName} x ${itemQty}`;
                                } else {
                                  return `${itemName} x ${itemQty}, `;
                                }
                              })
                            ) : (
                              <span className="text-muted">No items</span>
                            )}
                          </div>
                          {order.userAddress && (
                            <small className="text-muted d-block mt-1">
                              <i className="bi bi-geo-alt me-1"></i>
                              {order.userAddress}
                            </small>
                          )}
                        </td>
                        <td className="align-middle">
                          <span className="fw-bold">&#x20B9;{amount.toFixed(2)}</span>
                        </td>
                        <td className="align-middle">
                          <small className="text-muted">
                            Items: {orderedItems.length}
                          </small>
                        </td>
                        <td className="align-middle">
                          <span className={`badge ${getStatusBadgeClass(orderStatus)}`}>
                            &#x25cf; {orderStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="align-middle">
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={fetchOrders}
                            title="Refresh orders"
                          >
                            <i className="bi bi-arrow-clockwise"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get appropriate badge class based on order status
const getStatusBadgeClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'DELIVERED':
      return 'bg-success';
    case 'SHIPPED':
      return 'bg-info';
    case 'PENDING':
      return 'bg-warning';
    case 'CANCELLED':
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
};

export default MyOrders;