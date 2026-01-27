import axios from "axios";

export default class InventoryApi {
    constructor() {
        this.BASE = "http://127.0.0.1:8000/api/";
        this.username = sessionStorage.getItem("user");
        this.accessToken = sessionStorage.getItem("accessToken");
    }

    async createOrder(data) {
        const response = await axios.post(
            this.BASE + "orders/",
            JSON.stringify(data), {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`,
                    "X-Username": this.username
                }
            }
        );

        if(response.status === 201 || response.status === 200){
            console.log(response.data);
            return true;
        }else{
            console.log("Error");
            return false;
        }
    }

    async getAllOrders() {
        try {
            const response = await axios.get(
                this.BASE + "orders/user/", {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username
                    }
                }
            );

            if(response.status === 200){
                console.log(response.data.orders);
                return response.data.orders;
            }
            return null;
        } catch (error) {
            console.error("Error fetching orders:", error.response?.data || error.message);
            return null;
        }
    }

    // Admin Methods
    async getAllOrdersAdmin() {
        try {
            const response = await axios.get(
                this.BASE + "admin/orders/", {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username
                    }
                }
            );

            if(response.status === 200){
                console.log(response.data.orders);
                return response.data.orders;
            }
            return null;
        } catch (error) {
            console.error("Error fetching admin orders:", error.response?.data || error.message);
            return null;
        }
    }

    async acceptOrder(orderId) {
        try {
            const response = await axios.post(
                this.BASE + `admin/orders/${orderId}/accept/`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username
                    }
                }
            );

            if(response.status === 200){
                console.log("Order accepted:", response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error accepting order:", error.response?.data || error.message);
            return false;
        }
    }

    async cancelOrder(orderId) {
        try {
            const response = await axios.post(
                this.BASE + `admin/orders/${orderId}/cancel/`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username
                    }
                }
            );

            if(response.status === 200){
                console.log("Order cancelled:", response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error cancelling order:", error.response?.data || error.message);
            return false;
        }
    }
}