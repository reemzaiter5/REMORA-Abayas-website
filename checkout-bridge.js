
/* =========================================================
   RÉMORA CHECKOUT BRIDGE
   Connects the existing cart to checkout.html
========================================================= */

const REMORA_PRODUCTS = [
    { id: 1, name: "Black Embroidered Abaya" },
    { id: 2, name: "Classic Open Abaya" },
    { id: 3, name: "Luxury Embroidered Abaya" },
    { id: 4, name: "Dress Abaya" },
    { id: 5, name: "Chic Abaya" },
    { id: 6, name: "Elegant Black Abaya" },
    { id: 7, name: "Classic Open Abaya With White Skim Dress" },
    { id: 8, name: "Beautifully Detailed Abaya With Crochet" },
    { id: 9, name: "Modern Statement Lace Abaya" },
    { id: 10, name: "Timeless Classic Abaya" },
    { id: 11, name: "Soft Flowy Abaya" },
    { id: 12, name: "Premium Skim Dress" }
];


document.addEventListener("click", function (event) {

    const checkoutButton = event.target.closest("#checkoutButton");

    if (!checkoutButton) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const cartContainer = document.getElementById("cart-items");

    const cartRows = Array.from(
        cartContainer?.querySelectorAll(".cart-item") || []
    );

    if (cartRows.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    const items = [];

    cartRows.forEach(function (row) {

        const name = row.querySelector(".cart-item-info h4")?.textContent.trim();

        const image = row.querySelector("img")?.getAttribute("src") || "";

        const paragraphs = Array.from(
            row.querySelectorAll(".cart-item-info > p")
        );

        const colorParagraph = paragraphs.find(function (paragraph) {
            return paragraph.textContent.toLowerCase().includes("color:");
        });

        const color = colorParagraph
            ? colorParagraph.textContent.replace(/color:/i, "").trim()
            : "";

        const quantity = Number(
            row.querySelector(".cart-quantity span")?.textContent.trim()
        );

        const product = REMORA_PRODUCTS.find(function (item) {
            return item.name === name;
        });

        if (!product || !color || !Number.isInteger(quantity) || quantity < 1) {
            return;
        }

        items.push({
            product_id: product.id,
            name: product.name,
            color: color,
            image: image,
            quantity: quantity
        });

    });

    if (items.length !== cartRows.length) {
        alert("A cart item could not be identified. Please refresh the shop and try again.");
        return;
    }

    sessionStorage.setItem(
        "remoraCheckoutCart",
        JSON.stringify(items)
    );

    window.location.href = "checkout.html";

}, true);
