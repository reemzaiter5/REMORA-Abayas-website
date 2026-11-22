
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL = "https://mhtkzlnsqcpqnwzoqpfn.supabase.co";

const SUPABASE_KEY = "sb_publishable_EelD1sgSIahNOHm30_JYnA_Hp3bNvdn";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


/* =========================================================
   PRODUCT LOOKUP
   MUST MATCH THE PRODUCT IDs IN YOUR EXISTING app.js
========================================================= */

const PRODUCTS = [
    { id: 1, name: "Black Embroidered Abaya", price: 40 },
    { id: 2, name: "Classic Open Abaya", price: 45 },
    { id: 3, name: "Luxury Embroidered Abaya", price: 40 },
    { id: 4, name: "Dress Abaya", price: 50 },
    { id: 5, name: "Chic Abaya", price: 45 },
    { id: 6, name: "Elegant Black Abaya", price: 45 },
    { id: 7, name: "Classic Open Abaya With White Skim Dress", price: 65 },
    { id: 8, name: "Beautifully Detailed Abaya With Crochet", price: 45 },
    { id: 9, name: "Modern Statement Lace Abaya", price: 45 },
    { id: 10, name: "Timeless Classic Abaya", price: 50 },
    { id: 11, name: "Soft Flowy Abaya", price: 45 },
    { id: 12, name: "Premium Skim Dress", price: 35 }
];


/* =========================================================
   ELEMENTS
========================================================= */

const checkoutForm = document.getElementById("checkoutForm");

const checkoutItems = document.getElementById("checkoutItems");

const checkoutTotal = document.getElementById("checkoutTotal");

const checkoutMessage = document.getElementById("checkoutMessage");

const placeOrderButton = document.getElementById("placeOrderButton");

const confirmationOverlay = document.getElementById("confirmationOverlay");


/* =========================================================
   CART DATA
========================================================= */

let cart = [];

try {
    cart = JSON.parse(
        sessionStorage.getItem("remoraCheckoutCart") || "[]"
    );
} catch (error) {
    cart = [];
}


/* =========================================================
   HELPERS
========================================================= */

function showMessage(message, type = "error") {
    checkoutMessage.textContent = message;
    checkoutMessage.className = message ? type : "";
}

function money(value) {
    return "$" + Number(value).toFixed(2);
}

function getProduct(productId) {
    return PRODUCTS.find(product => product.id === Number(productId));
}

function getCartTotal() {
    return cart.reduce(function (total, item) {
        const product = getProduct(item.product_id);

        if (!product) return total;

        return total + product.price * item.quantity;
    }, 0);
}


/* =========================================================
   DISPLAY ORDER SUMMARY
========================================================= */

function displayOrderSummary() {

    checkoutItems.innerHTML = "";

    if (!cart.length) {

        checkoutItems.textContent = "Your cart is empty.";

        checkoutTotal.textContent = money(0);

        placeOrderButton.disabled = true;

        return;
    }

    placeOrderButton.disabled = false;

    cart.forEach(function (item) {

        const product = getProduct(item.product_id);

        if (!product) return;

        const wrapper = document.createElement("div");

        wrapper.className = "summary-item";

        const image = document.createElement("img");

        image.src = item.image || "";

        image.alt = product.name;

        const details = document.createElement("div");

        const name = document.createElement("h3");

        name.textContent = product.name;

        const color = document.createElement("p");

        color.textContent = "Color: " + item.color;

        const quantity = document.createElement("p");

        quantity.textContent = "Quantity: " + item.quantity;

        const price = document.createElement("strong");

        price.textContent = money(product.price * item.quantity);

        details.append(name, color, quantity, price);

        wrapper.append(image, details);

        checkoutItems.appendChild(wrapper);

    });

    checkoutTotal.textContent = money(getCartTotal());
}


/* =========================================================
   SET MINIMUM DELIVERY DATE
========================================================= */

function setMinimumDeliveryDate() {

    const dateInput = document.getElementById("deliveryDate");

    const today = new Date();

    const localDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];

    dateInput.min = localDate;

    if (!dateInput.value) {
        dateInput.value = localDate;
    }
}


/* =========================================================
   LOAD CUSTOMER SESSION
========================================================= */

async function loadCustomer() {

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) return;

    const user = data.user;

    const username =
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        "";

    document.getElementById("customerUsername").value = username;

    document.getElementById("customerEmail").value = user.email || "";

    document.getElementById("customerName").value =
        user.user_metadata?.full_name || username;

}


/* =========================================================
   SUBMIT ORDER
========================================================= */

async function submitOrder(event) {

    event.preventDefault();

    showMessage("");

    if (!cart.length) {
        showMessage("Your cart is empty.");
        return;
    }

    const formData = new FormData(checkoutForm);

    const customerName = String(formData.get("customerName") || "").trim();

    const customerUsername = String(formData.get("customerUsername") || "").trim();

    const customerEmail = String(formData.get("customerEmail") || "").trim();

    const customerPhone = String(formData.get("customerPhone") || "").trim();

    const deliveryAddress = String(formData.get("deliveryAddress") || "").trim();

    const deliveryDate = String(formData.get("deliveryDate") || "");

    const deliveryTime = String(formData.get("deliveryTime") || "");

    const paymentMethod = String(formData.get("paymentMethod") || "");

    const orderNotes = String(formData.get("orderNotes") || "").trim();

    if (!customerName || !customerEmail || !customerPhone || !deliveryAddress) {
        showMessage("Please complete all required customer and delivery fields.");
        return;
    }

    if (!deliveryDate || !deliveryTime) {
        showMessage("Please select your requested delivery date and time.");
        return;
    }

    const items = cart.map(function (item) {

        return {
            product_id: Number(item.product_id),
            color: String(item.color),
            image: String(item.image || ""),
            quantity: Number(item.quantity)
        };

    });

    if (items.some(item => !getProduct(item.product_id) || !item.color || !Number.isInteger(item.quantity) || item.quantity < 1)) {
        showMessage("One of your cart items is invalid. Please return to the shop and try again.");
        return;
    }

    placeOrderButton.disabled = true;

    placeOrderButton.textContent = "Placing Your Order...";

    try {

        const { data, error } = await supabase.rpc(
            "remora_place_order",
            {
                p_customer_name: customerName,
                p_customer_username: customerUsername,
                p_customer_email: customerEmail,
                p_customer_phone: customerPhone,
                p_delivery_address: deliveryAddress,
                p_delivery_date: deliveryDate,
                p_delivery_time: deliveryTime,
                p_payment_method: paymentMethod,
                p_notes: orderNotes,
                p_items: items
            }
        );

        if (error) throw error;

        const result = typeof data === "string"
            ? JSON.parse(data)
            : data;

        if (!result?.success) {
            throw new Error("The order could not be completed.");
        }

        document.getElementById("confirmationOrderNumber").textContent =
            result.order_number;

        document.getElementById("confirmationTotal").textContent =
            money(result.total);

        confirmationOverlay.classList.add("active");

        sessionStorage.removeItem("remoraCheckoutCart");

        cart = [];

        checkoutForm.reset();

    } catch (error) {

        console.error("Checkout error:", error);

        showMessage(
            error.message || "Something went wrong while placing your order."
        );

        placeOrderButton.disabled = false;

        placeOrderButton.textContent = "Place Order";

    }

}


/* =========================================================
   INITIALIZE
========================================================= */

displayOrderSummary();

setMinimumDeliveryDate();

loadCustomer();

checkoutForm.addEventListener("submit", submitOrder);
