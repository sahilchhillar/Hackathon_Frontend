import React from 'react'
import { useState, useEffect } from 'react';
import InventoryApi from  './api';
import './Inventory.css';

export default function Inventory() {
    const inventory = [
        { label: 'apple', value: 'Apple' },
        { label: 'banana', value: 'Banana' },
        { label: 'cherry', value: 'Cherry' }
    ];

    const inventoryClass = new InventoryApi();

    const [rows, setRows] = useState([
        { item_id: Math.floor(Math.random() * 100), item_name: '', item_quantity: 1}
    ]);

    const [submit, setSubmit] = useState(false);
    const [orderHistory, setOrderHistory] = useState([]);
    const [error, setError] = useState('');
    const [ws, setWs] = useState(null);

    useEffect(() => {
        // Connect to WebSocket
        const username = sessionStorage.getItem("user");
        const websocket = new WebSocket(`ws://127.0.0.1:8000/ws/orders/${username}/`);

        websocket.onopen = () => {
            console.log('WebSocket connected');
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'order_status') {
                console.log('Order status update:', data.data);
                
                // Update order status in the UI
                setOrderHistory(prev => 
                    prev.map(order => 
                        order.id === data.data.order_id 
                            ? { ...order, status: data.data.status }
                            : order
                    )
                );
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        websocket.onclose = () => {
            console.log('WebSocket disconnected');
        };

        setWs(websocket);

        // Cleanup on unmount
        return () => {
            websocket.close();
        };
    }, []);

    // Fetch order history on component mount
    useEffect(() => {
        fetchOrderHistory();
    }, []);

    const fetchOrderHistory = async () => {
        try {
            const orders = await inventoryClass.getAllOrders();
            if(orders) {
                setOrderHistory(orders);
                if(orders.length > 0) {
                    setSubmit(true);
                }
            }
        } catch (err) {
            console.error('Error fetching order history:', err);
        }
    };

    // Check if all rows have items selected
    const areAllRowsValid = () => {
        return rows.every(row => row.item_name !== '');
    };

    const addRow = () => {
        // Only add a new row if all existing rows have items selected
        if (!areAllRowsValid()) {
            alert('Please select an item for all rows before adding a new one');
            return;
        }

        setRows(prev => [
            ...prev,
            { item_id: Math.floor(Math.random() * 100), item_name: '', item_quantity: 1}
        ]);
    };

    const removeRow = (id) => {
        setRows(prev => prev.filter(row => row.item_id !== id));
    };

    const updateRow = (id, field, value) => {
        setRows(prev =>
            prev.map(row =>
                row.item_id === id ? { ...row, [field]: value } : row
            )
        );
    };

    const mergeAndConsolidateRows = (rowsToMerge) => {
        const mergedItems = {};

        rowsToMerge.forEach(row => {
            if (row.item_name !== '') {
                if (mergedItems[row.item_name]) {
                    // Item already exists, add quantities
                    mergedItems[row.item_name].item_quantity += row.item_quantity;
                } else {
                    // New item, create entry
                    mergedItems[row.item_name] = {
                        item_id: row.item_id,
                        item_name: row.item_name,
                        item_quantity: row.item_quantity,
                    };
                }
            }
        });

        return Object.values(mergedItems);
    };

    const submitOrder = async () => {
        // Clear any previous errors
        setError('');

        // Filter out rows that don't have an item selected
        const validRows = rows.filter(row => row.item_name !== '');

        if (validRows.length === 0) {
            alert('Please select at least one item before submitting');
            return;
        }

        // Merge duplicate items and consolidate quantities
        const consolidatedRows = mergeAndConsolidateRows(validRows);

        try {
            // Send only consolidated rows to backend
            const result = await inventoryClass.createOrder(consolidatedRows);

            if(result){
                setSubmit(true);
                
                // Fetch updated order history from database
                await fetchOrderHistory();
                
                setRows([
                    { item_id: Math.floor(Math.random() * 100), item_name: '', item_quantity: 1, user: sessionStorage.getItem("user")}
                ]);
            } else {
                setError('Failed to create order. Please try again.');
            }
        } catch (err) {
            setError('An error occurred while submitting the order. Please try again.');
            console.error('Order submission error:', err);
        }
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return { bg: '#fff3cd', color: '#856404' };
            case 'Processing':
                return { bg: '#cfe2ff', color: '#084298' };
            case 'Processed':
                return { bg: '#d1e7dd', color: '#0f5132' };
            case 'Cancelled':
                return { bg: '#f8d7da', color: '#842029' };
            default:
                return { bg: '#e2e3e5', color: '#41464b' };
        }
    };

    return (
        <div className="App">
            <div className="app-title">
                Event Driven Architecture
            </div>

            <div className="inventory-dropdown-wrapper">
                <div className="inventory-label">Select Inventory Items</div>

                {error && (
                    <div className="error-message" style={{
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        color: '#c33',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '10px'
                    }}>
                        {error}
                    </div>
                )}

                <div className="inventory-order-card">
                    <div className="inventory-order">
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.item_id}>
                                        <td>
                                            <select
                                                className="select-item"
                                                value={row.item_name}
                                                onChange={(e) =>
                                                    updateRow(row.item_id, 'item_name', e.target.value)
                                                }
                                            >
                                                <option value="">-- Select --</option>
                                                {inventory.map((i) => (
                                                    <option key={i.label} value={i.label}>
                                                        {i.value}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="input-item-quantity"
                                                min="1"
                                                value={row.item_quantity}
                                                onChange={(e) =>
                                                    updateRow(row.item_id, 'item_quantity', Number(e.target.value))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <button
                                                className="remove-button"
                                                onClick={() => removeRow(row.item_id)}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="add-row-container">
                    <button className="button-add-item" onClick={addRow}>
                        ADD ITEM
                    </button>
                </div>

                <div className="submit-order">
                    <button className="button-submit-order" onClick={submitOrder}>SUBMIT</button>
                </div>
            </div>

            {submit && orderHistory.length > 0 && (
                <div className="order-history">
                    <h3>Order History</h3>
                    <div className="order-history-table">
                        <table>
                          <thead>
                              <tr>
                                  <th>Order ID</th>
                                  <th>Item</th>
                                  <th>Quantity</th>
                                  <th>Status</th>
                                  <th>Order Date</th>
                              </tr>
                          </thead>
                          <tbody>
                              {orderHistory.map((order) => {
                                  const statusColors = getStatusColor(order.status);
                                  return (
                                      <tr key={order.id}>
                                          <td>{order.id}</td>
                                          <td>{order.item_name}</td>
                                          <td>{order.item_quantity}</td>
                                          <td>
                                              <span style={{
                                                  padding: '4px 8px',
                                                  borderRadius: '4px',
                                                  backgroundColor: statusColors.bg,
                                                  color: statusColors.color,
                                                  fontWeight: '600'
                                              }}>
                                                  {order.status || 'Pending'}
                                              </span>
                                          </td>
                                          <td>{formatDate(order.created_on)}</td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                    </div>
                </div>
            )}
        </div>
    );
}