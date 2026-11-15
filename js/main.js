
const WHATSAPP_NUMBER = "917418350372";
const cart = new Map();

const formatRupees = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(amount);

function renderCart() {
    const itemsContainer = document.getElementById("cart-items");
    if (!itemsContainer) return;

    itemsContainer.replaceChildren();
    let total = 0;

    for (const [id, item] of cart) {
        const lineTotal = item.price * item.quantity;
        total += lineTotal;

        const row = document.createElement("div");
        row.className = "cart-item";

        const details = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = item.name;

        const meta = document.createElement("p");
        meta.textContent =
            `${item.quantity} kg × ${formatRupees(item.price)}/kg`;

        details.append(name, meta);

        const amount = document.createElement("strong");
        amount.textContent = formatRupees(lineTotal);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-item";
        remove.textContent = "Remove";
        remove.setAttribute("aria-label", `Remove ${item.name}`);
        remove.addEventListener("click", () => {
            cart.delete(id);
            renderCart();
        });

        const right = document.createElement("div");
        right.className = "cart-item-right";
        right.append(amount, remove);

        row.append(details, right);
        itemsContainer.append(row);
    }

    document.getElementById("cart-total").textContent =
        formatRupees(total);

    document.getElementById("cart-empty").hidden = cart.size > 0;

    document.getElementById("whatsapp-order").disabled =
        cart.size === 0;
}

document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", () => {
        const card = button.closest(".product-card");
        const input = card.querySelector('input[type="number"]');
        const quantity = Number(input.value);
        const price = Number(button.dataset.price);

        if (!Number.isFinite(quantity) || quantity < 0.25 ||
            quantity > 100 || !Number.isFinite(price) || price < 0) {
            alert("Please enter a valid quantity between 0.25 and 100 kg.");
            return;
        }

        const id = button.dataset.id;
        const existing = cart.get(id);

        const newQuantity =
            (existing ? existing.quantity : 0) + quantity;

        if (newQuantity > 100) {
            alert("Maximum quantity per product is 100 kg.");
            return;
        }

        cart.set(id, {
            name: button.dataset.name,
            price,
            quantity: newQuantity,
        });

        renderCart();

        const originalText = button.textContent;
        button.textContent = "Added ✓";
        window.setTimeout(() => {
            button.textContent = originalText;
        }, 1200);
    });
});

document.getElementById("clear-cart")?.addEventListener("click", () => {
    cart.clear();
    renderCart();
});

document.getElementById("whatsapp-order")?.addEventListener("click", () => {
    if (cart.size === 0) return;

    let message = "Hello TS Snacks! I'd like to place an order:\n\n";
    let total = 0;

    for (const item of cart.values()) {
        const lineTotal = item.price * item.quantity;
        total += lineTotal;

        message +=
            `• ${item.name} — ${item.quantity} kg × ` +
            `${formatRupees(item.price)}/kg = ` +
            `${formatRupees(lineTotal)}\n`;
    }

    message += `\nEstimated total: ${formatRupees(total)}`;
    message += "\n\nPlease confirm availability and order details.";

    const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
});

renderCart();

/* ============================================================
   Static-site additions (these replace the Django template logic)
   ============================================================ */

// Footer year (was {% now "Y" %} in base.html)
const currentYear = document.getElementById("current-year");
if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

// Catalogue search + category filter (was the GET form handled by Django)
const catalogueForm = document.getElementById("catalogue-form");

if (catalogueForm) {
    const searchInput = catalogueForm.querySelector('input[name="q"]');
    const categorySelect = catalogueForm.querySelector('select[name="category"]');
    const catalogueCards = document.querySelectorAll("#catalogue-grid .product-card");
    const emptyState = document.getElementById("catalogue-empty");
    const countLabel = document.getElementById("catalogue-count");

    const applyFilters = (search, category) => {
        const term = search.trim().toLowerCase();
        let visible = 0;

        catalogueCards.forEach((card) => {
            const matchesName = card.dataset.name.toLowerCase().includes(term);
            const matchesCategory = !category || card.dataset.category === category;
            const show = matchesName && matchesCategory;

            card.hidden = !show;
            if (show) visible += 1;
        });

        countLabel.textContent = `${visible} products`;
        emptyState.hidden = visible > 0;
    };

    // Restore search and category from the URL, as the Django view did
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get("q") || "";
    const initialCategory = params.get("category") || "";

    searchInput.value = initialSearch;
    if ([...categorySelect.options].some((option) => option.value === initialCategory)) {
        categorySelect.value = initialCategory;
    }
    applyFilters(initialSearch, initialCategory);

    catalogueForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const search = searchInput.value.trim();
        const category = categorySelect.value;

        const query = new URLSearchParams();
        if (search) query.set("q", search);
        if (category) query.set("category", category);
        const queryString = query.toString();

        try {
            window.history.pushState(
                null,
                "",
                queryString ? `?${queryString}` : window.location.pathname
            );
        } catch (error) {
            // Some file:// contexts block URL changes; filtering still works.
        }

        applyFilters(search, category);
    });
}
