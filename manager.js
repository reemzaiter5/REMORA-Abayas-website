
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL = "https://mhtkzlnsqcpqnwzoqpfn.supabase.co";

const SUPABASE_KEY = "sb_publishable_EelD1sgSIahNOHm30_JYnA_Hp3bNvdn";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


/* =========================================================
   ELEMENTS
========================================================= */

const ordersContainer = document.getElementById("ordersContainer");

const dashboardMessage = document.getElementById("dashboardMessage");

const orderSearch = document.getElementById("orderSearch");

const statusFilter = document.getElementById("statusFilter");

let currentShopId = null;

let allOrders = [];


/* =========================================================
   HELPERS
========================================================= */

function money(value) {
    return "$" + Number(value || 0).toFixed(2);
}

function showDashboardMessage(message) {
    dashboardMessage.textContent = message;
    dashboardMessage.classList.add("visible");
}

function clearDashboardMessage() {
    dashboardMessage.textContent = "";
    dashboardMessage.classList.remove("visible");
}

function formatDate(value) {
    if (!value) return "Not specified";

    return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function formatDateTime(value) {
    if (!value) return "";

    return new Date(value).toLocaleString();
}

function readableStatus(value) {
    return String(value || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

function createInfo(label, value) {

    const wrapper = document.createElement("div");

    const heading = document.createElement("p");
    heading.className = "order-info-label";
    heading.textContent = label;

    const content = document.createElement("p");
    content.className = "order-info-value";
    content.textContent = value || "Not provided";

    wrapper.append(heading, content);

    return wrapper;
}


/* =========================================================
   CHECK MANAGER ACCESS
========================================================= */

async function checkManagerAccess() {

    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if (userError || !userData.user) {
        window.location.href = "auth.html";
        return false;
    }

    const user = userData.user;

    document.getElementById("managerEmail").textContent =
        user.email || "";

    const { data: membership, error: membershipError } =
        await supabase
            .from("remora_shop_members")
            .select("shop_id, role")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

    if (membershipError) {
        console.error(membershipError);
        showDashboardMessage(
            "Could not verify manager permissions. Check your Supabase policies."
        );
        return false;
    }

    if (!membership) {
        showDashboardMessage(
            "Access denied. This account has not been assigned as a manager or owner."
        );
        ordersContainer.innerHTML =
            '<div class="empty-state">No manager access is assigned to this account.</div>';
        return false;
    }

    currentShopId = membership.shop_id;

    const { data: shop, error: shopError } =
        await supabase
            .from("remora_shops")
            .select("name")
            .eq("id", currentShopId)
            .maybeSingle();

    if (shopError) {
        console.error(shopError);
        showDashboardMessage("Could not load your shop details.");
        return false;
    }

    document.getElementById("shopTitle").textContent =
        shop?.name || "Manager Dashboard";

    return true;
}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

    clearDashboardMessage();

    ordersContainer.innerHTML =
        '<div class="loading-state">Loading orders...</div>';

    const { data, error } = await supabase
        .from("remora_orders")
        .select(`
            *,
            remora_order_items (
                id,
                product_id,
                product_name,
                color,
                image,
                quantity,
                unit_price,
                line_total
            )
        `)
        .eq("shop_id", currentShopId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Orders error:", error);

        showDashboardMessage(
            "Could not load orders. Please check your Supabase table permissions."
        );

        ordersContainer.innerHTML =
            '<div class="empty-state">Orders could not be loaded.</div>';

        return;
    }

    allOrders = data || [];

    updateDashboardStats();

    renderOrders();
}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function updateDashboardStats() {

    const today = new Date().toLocaleDateString();

    const activeOrders = allOrders.filter(function (order) {
        return order.order_status !== "cancelled";
    });

    const revenue = activeOrders.reduce(function (total, order) {
        return total + Number(order.total || 0);
    }, 0);

    const pending = allOrders.filter(function (order) {
        return order.order_status === "pending";
    }).length;

    const todayCount = allOrders.filter(function (order) {
        return new Date(order.created_at).toLocaleDateString() === today;
    }).length;

    document.getElementById("totalOrders").textContent =
        allOrders.length;

    document.getElementById("totalRevenue").textContent =
        money(revenue);

    document.getElementById("pendingOrders").textContent =
        pending;

    document.getElementById("todayOrders").textContent =
        todayCount;
}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders() {

    const search = orderSearch.value.trim().toLowerCase();

    const selectedStatus = statusFilter.value;

    const filteredOrders = allOrders.filter(function (order) {

        const matchesSearch =
            String(order.order_number).toLowerCase().includes(search) ||
            String(order.customer_name).toLowerCase().includes(search) ||
            String(order.customer_email).toLowerCase().includes(search) ||
            String(order.customer_phone).toLowerCase().includes(search);

        const matchesStatus =
            selectedStatus === "all" ||
            order.order_status === selectedStatus;

        return matchesSearch && matchesStatus;

    });


    ordersContainer.innerHTML = "";

    if (!filteredOrders.length) {

        ordersContainer.innerHTML =
            '<div class="empty-state">No matching orders were found.</div>';

        return;
    }

    filteredOrders.forEach(function (order) {

        const card = document.createElement("article");

        card.className = "order-card";


        /* HEADER */

        const header = document.createElement("div");

        header.className = "order-card-header";

        const heading = document.createElement("div");

        const orderNumber = document.createElement("p");

        orderNumber.className = "order-number";

        orderNumber.textContent = order.order_number;

        const date = document.createElement("p");

        date.className = "order-date";

        date.textContent = formatDateTime(order.created_at);

        heading.append(orderNumber, date);

        const badge = document.createElement("span");

        badge.className =
            "status-pill " + order.order_status;

        badge.textContent =
            readableStatus(order.order_status);

        header.append(heading, badge);


        /* CUSTOMER INFORMATION */

        const customer = document.createElement("div");

        customer.className = "order-customer";

        customer.append(
            createInfo("Customer", order.customer_name),
            createInfo("Username", order.customer_username),
            createInfo("Email", order.customer_email),
            createInfo("Phone", order.customer_phone),
            createInfo("Delivery Address", order.delivery_address),
            createInfo(
                "Requested Delivery",
                formatDate(order.delivery_date) + " | " + order.delivery_time
            ),
            createInfo("Payment Method", readableStatus(order.payment_method)),
            createInfo("Payment Status", readableStatus(order.payment_status)),
            createInfo("Order Notes", order.notes)
        );


        /* ORDER ITEMS */

        const products = document.createElement("div");

        products.className = "order-products";

        const itemList = order.remora_order_items || [];

        itemList.forEach(function (item) {

            const row = document.createElement("div");

            row.className = "order-product";

            const name = document.createElement("span");

            name.textContent =
                item.product_name +
                " / " +
                item.color +
                " × " +
                item.quantity;

            const price = document.createElement("span");

            price.textContent =
                money(item.line_total);

            row.append(name, price);

            products.appendChild(row);

        });


        /* BOTTOM */

        const bottom = document.createElement("div");

        bottom.className = "order-bottom";

        const total = document.createElement("strong");

        total.className = "order-total";

        total.textContent = money(order.total);


        const controls = document.createElement("div");

        controls.className = "order-status-control";

        const label = document.createElement("label");

        label.textContent = "Update status";

        const select = document.createElement("select");

        select.setAttribute("aria-label", "Update order status");

        const statuses = [
            "pending",
            "confirmed",
            "preparing",
            "out_for_delivery",
            "delivered",
            "cancelled"
        ];

        statuses.forEach(function (status) {

            const option = document.createElement("option");

            option.value = status;

            option.textContent = readableStatus(status);

            if (status === order.order_status) {
                option.selected = true;
            }

            select.appendChild(option);

        });


        const saveButton = document.createElement("button");

        saveButton.type = "button";

        saveButton.className = "save-status";

        saveButton.textContent = "Save Status";

        saveButton.addEventListener("click", async function () {

            await updateOrderStatus(
                order.id,
                select.value,
                saveButton
            );

        });


        controls.append(label, select, saveButton);

        bottom.append(total, controls);

        card.append(header, customer, products, bottom);

        ordersContainer.appendChild(card);

    });

}


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

async function updateOrderStatus(orderId, newStatus, button) {

    const allowedStatuses = [
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled"
    ];

    if (!allowedStatuses.includes(newStatus)) {
        return;
    }

    button.disabled = true;

    button.textContent = "Saving...";

    const { error } = await supabase
        .from("remora_orders")
        .update({
            order_status: newStatus
        })
        .eq("id", orderId)
        .eq("shop_id", currentShopId);

    if (error) {

        console.error("Status update error:", error);

        showDashboardMessage(
            "Could not update this order. Please check your manager permissions."
        );

        button.disabled = false;

        button.textContent = "Save Status";

        return;
    }

    await loadOrders();

}


/* =========================================================
   LOG OUT
========================================================= */

document.getElementById("managerLogout").addEventListener(
    "click",
    async function () {

        const { error } = await supabase.auth.signOut();

        if (error) {
            showDashboardMessage(error.message);
            return;
        }

        window.location.href = "auth.html";

    }
);


/* =========================================================
   FILTERS
========================================================= */

orderSearch.addEventListener("input", renderOrders);

statusFilter.addEventListener("change", renderOrders);

document.getElementById("refreshDashboard").addEventListener(
    "click",
    loadOrders
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeDashboard() {

    const hasAccess = await checkManagerAccess();

    if (!hasAccess) return;

    await loadOrders();

}

initializeDashboard();
