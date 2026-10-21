
// =========================================================
// MenuKita - JavaScript
// Mengatur data menu, pencarian, filter, anggaran, keranjang,
// pengelolaan menu, ekspor/impor, dan penyimpanan lokal.
//
// Catatan:
// localStorage hanya tersimpan pada browser/perangkat yang
// sedang digunakan. Data tidak otomatis tersinkron ke perangkat lain.
// =========================================================

(() => {
    "use strict";

    // Nama kunci penyimpanan lokal browser.
    const MENU_STORAGE_KEY = "menukita_menu_v1";
    const CART_STORAGE_KEY = "menukita_cart_v1";

    // Data menu contoh. Ubah daftar ini untuk mengganti menu awal.
    const DEFAULT_MENU = [
        {
            id: "makanan-1",
            name: "Nasi Goreng Spesial",
            category: "Makanan",
            price: 18000,
            description: "Nasi goreng dengan telur, sayuran, dan bumbu spesial.",
            emoji: "🍛",
            available: true
        },
        {
            id: "makanan-2",
            name: "Ayam Geprek",
            category: "Makanan",
            price: 15000,
            description: "Ayam renyah dengan sambal dan nasi putih.",
            emoji: "🍗",
            available: true
        },
        {
            id: "makanan-3",
            name: "Mie Goreng",
            category: "Makanan",
            price: 12000,
            description: "Mie goreng dengan sayuran dan pilihan telur.",
            emoji: "🍜",
            available: true
        },
        {
            id: "camilan-1",
            name: "Kentang Goreng",
            category: "Camilan",
            price: 10000,
            description: "Kentang goreng renyah dengan saus pilihan.",
            emoji: "🍟",
            available: true
        },
        {
            id: "camilan-2",
            name: "Roti Bakar",
            category: "Camilan",
            price: 12000,
            description: "Roti bakar dengan pilihan cokelat atau keju.",
            emoji: "🍞",
            available: true
        },
        {
            id: "camilan-3",
            name: "Pisang Goreng",
            category: "Camilan",
            price: 8000,
            description: "Pisang goreng hangat dengan taburan gula.",
            emoji: "🍌",
            available: true
        },
        {
            id: "kopi-1",
            name: "Espresso",
            category: "Kopi",
            price: 10000,
            description: "Kopi pekat dengan cita rasa khas biji kopi.",
            emoji: "☕",
            available: true
        },
        {
            id: "kopi-2",
            name: "Americano",
            category: "Kopi",
            price: 12000,
            description: "Espresso yang dicampur dengan air panas.",
            emoji: "🖤",
            available: true
        },
        {
            id: "kopi-3",
            name: "Es Kopi Susu",
            category: "Kopi",
            price: 15000,
            description: "Perpaduan kopi, susu, dan es yang menyegarkan.",
            emoji: "🧋",
            available: true
        },
        {
            id: "nonkopi-1",
            name: "Es Teh Manis",
            category: "Non-Kopi",
            price: 5000,
            description: "Teh manis dingin yang menyegarkan.",
            emoji: "🧊",
            available: true
        },
        {
            id: "nonkopi-2",
            name: "Cokelat Dingin",
            category: "Non-Kopi",
            price: 12000,
            description: "Minuman cokelat dengan susu dan es.",
            emoji: "🍫",
            available: true
        },
        {
            id: "nonkopi-3",
            name: "Lemon Tea",
            category: "Non-Kopi",
            price: 8000,
            description: "Teh dengan rasa lemon yang segar.",
            emoji: "🍋",
            available: true
        }
    ];

    // Mengambil elemen HTML berdasarkan ID.
    const $ = (id) => document.getElementById(id);

    // Daftar elemen HTML yang digunakan aplikasi.
    const elements = {
        menuGrid: $("menuGrid"),
        menuCount: $("menuCount"),
        emptyState: $("emptyState"),
        searchInput: $("searchInput"),
        categoryFilter: $("categoryFilter"),
        priceFilter: $("priceFilter"),
        categoryChips: $("categoryChips"),
        resetFilters: $("resetFilters"),
        budgetForm: $("budgetForm"),
        budgetInput: $("budgetInput"),
        budgetResult: $("budgetResult"),
        cartItems: $("cartItems"),
        cartTotal: $("cartTotal"),
        cartCount: $("cartCount"),
        clearCart: $("clearCart"),
        printMenu: $("printMenu"),
        printCart: $("printCart"),
        adminToggle: $("adminToggle"),
        adminPanel: $("adminPanel"),
        menuForm: $("menuForm"),
        productId: $("productId"),
        productName: $("productName"),
        productCategory: $("productCategory"),
        productPrice: $("productPrice"),
        productEmoji: $("productEmoji"),
        productDescription: $("productDescription"),
        productAvailable: $("productAvailable"),
        saveProduct: $("saveProduct"),
        cancelEdit: $("cancelEdit"),
        exportMenu: $("exportMenu"),
        importMenu: $("importMenu"),
        resetMenu: $("resetMenu"),
        toast: $("toast"),
        currentYear: $("currentYear")
    };

    // Memuat menu dan keranjang dari penyimpanan lokal.
    let menu = loadMenu();
    let cart = loadCart();

    // Status panel admin dan notifikasi.
    let adminMode = false;
    let toastTimeout = null;

    // Mengubah angka menjadi format mata uang Rupiah.
    function formatRupiah(value) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(value);
    }

    // Membuat ID unik sederhana untuk produk baru.
    function createId() {
        return (
            "menu-" +
            Date.now().toString(36) +
            Math.random().toString(36).slice(2, 7)
        );
    }

    // Membaca data menu dari localStorage.
    function loadMenu() {
        try {
            const saved = localStorage.getItem(MENU_STORAGE_KEY);

            // Jika belum ada data tersimpan, gunakan menu contoh.
            if (!saved) {
                return DEFAULT_MENU.map((item) => ({ ...item }));
            }

            const parsed = JSON.parse(saved);

            if (!Array.isArray(parsed)) {
                throw new Error("Format data menu tidak sesuai.");
            }

            return parsed
                .filter(isValidProduct)
                .map(normalizeProduct);
        } catch (error) {
            console.warn("Menu lokal tidak dapat dibaca:", error);

            return DEFAULT_MENU.map((item) => ({ ...item }));
        }
    }

    // Memastikan produk memiliki data dasar yang benar.
    function isValidProduct(item) {
        return (
            item &&
            typeof item === "object" &&
            typeof item.name === "string" &&
            typeof item.category === "string" &&
            Number.isFinite(Number(item.price)) &&
            typeof item.description === "string"
        );
    }

    // Menyeragamkan format data produk.
    function normalizeProduct(item) {
        const allowedCategories = [
            "Makanan",
            "Camilan",
            "Kopi",
            "Non-Kopi"
        ];

        return {
            id: String(item.id || createId()),
            name: String(item.name).slice(0, 70),

            category: allowedCategories.includes(item.category)
                ? item.category
                : "Makanan",

            price: Math.max(
                0,
                Math.round(Number(item.price) || 0)
            ),

            description: String(item.description).slice(0, 240),
            emoji: String(item.emoji || "🍽️").slice(0, 8),
            available: item.available !== false
        };
    }

    // Menyimpan seluruh daftar menu di browser.
    function saveMenu() {
        try {
            localStorage.setItem(
                MENU_STORAGE_KEY,
                JSON.stringify(menu)
            );
        } catch (error) {
            showToast(
                "Data menu gagal disimpan. Penyimpanan browser mungkin penuh atau dinonaktifkan."
            );

            console.error(error);
        }
    }

    // Membaca keranjang dari penyimpanan lokal.
    function loadCart() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(CART_STORAGE_KEY) || "[]"
            );

            if (!Array.isArray(saved)) {
                return [];
            }

            return saved.filter(
                (item) =>
                    item &&
                    typeof item.id === "string" &&
                    Number.isInteger(item.quantity) &&
                    item.quantity > 0
            );
        } catch {
            return [];
        }
    }

    // Menyimpan keranjang di browser.
    function saveCart() {
        try {
            localStorage.setItem(
                CART_STORAGE_KEY,
                JSON.stringify(cart)
            );
        } catch (error) {
            console.warn("Keranjang tidak dapat disimpan:", error);
        }
    }

    // Mengamankan teks sebelum dimasukkan ke HTML.
    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    // Menampilkan notifikasi sementara.
    function showToast(message) {
        elements.toast.textContent = message;
        elements.toast.hidden = false;

        clearTimeout(toastTimeout);

        toastTimeout = setTimeout(() => {
            elements.toast.hidden = true;
        }, 2800);
    }

    // Memfilter menu berdasarkan pencarian, kategori, dan harga.
    function getFilteredMenu() {
        const query = elements.searchInput.value
            .trim()
            .toLocaleLowerCase("id-ID");

        const category = elements.categoryFilter.value;
        const maxPrice = Number(elements.priceFilter.value);

        return menu.filter((product) => {
            const searchText =
                product.name +
                " " +
                product.description +
                " " +
                product.category;

            const matchesText = searchText
                .toLocaleLowerCase("id-ID")
                .includes(query);

            const matchesCategory =
                category === "Semua" ||
                product.category === category;

            const matchesPrice =
                maxPrice === 0 ||
                product.price <= maxPrice;

            return (
                matchesText &&
                matchesCategory &&
                matchesPrice
            );
        });
    }

    // Menampilkan kartu seluruh menu yang sesuai filter.
    function renderMenu() {
        const products = getFilteredMenu();

        elements.menuGrid.innerHTML = products
            .map((product) => {
                const status = product.available
                    ? '<span class="product-status">Tersedia</span>'
                    : '<span class="product-status unavailable">Habis</span>';

                // Tombol pengelolaan hanya muncul saat mode admin aktif.
                const adminActions = adminMode
                    ? `
                        <div class="admin-product-actions">
                            <button
                                type="button"
                                data-action="edit"
                                data-id="${escapeHTML(product.id)}"
                            >Edit</button>

                            <button
                                type="button"
                                data-action="toggle"
                                data-id="${escapeHTML(product.id)}"
                            >${product.available ? "Tandai Habis" : "Tandai Tersedia"}</button>

                            <button
                                type="button"
                                class="delete-product"
                                data-action="delete"
                                data-id="${escapeHTML(product.id)}"
                            >Hapus</button>
                        </div>
                    `
                    : "";

                return `
                    <article class="menu-card">
                        <div class="product-visual">
                            <span class="product-emoji" aria-hidden="true">
                                ${escapeHTML(product.emoji)}
                            </span>

                            ${status}
                        </div>

                        <div class="product-body">
                            <p class="product-category">
                                ${escapeHTML(product.category)}
                            </p>

                            <h3 class="product-name">
                                ${escapeHTML(product.name)}
                            </h3>

                            <p class="product-description">
                                ${escapeHTML(product.description)}
                            </p>

                            <div class="product-bottom">
                                <span class="product-price">
                                    ${formatRupiah(product.price)}
                                </span>

                                <button
                                    class="add-button"
                                    type="button"
                                    data-action="add"
                                    data-id="${escapeHTML(product.id)}"
                                    ${product.available ? "" : "disabled"}
                                >
                                    ${product.available ? "+ Tambah" : "Habis"}
                                </button>
                            </div>

                            ${adminActions}
                        </div>
                    </article>
                `;
            })
            .join("");

        elements.menuCount.textContent =
            `${products.length} menu ditemukan`;

        elements.emptyState.hidden = products.length > 0;
        elements.menuGrid.hidden = products.length === 0;
    }

    // Memperbarui tampilan tombol kategori.
    function updateCategoryChips(category) {
        elements.categoryChips
            .querySelectorAll("[data-category]")
            .forEach((button) => {
                const active =
                    button.dataset.category === category;

                button.classList.toggle("active", active);

                button.setAttribute(
                    "aria-pressed",
                    String(active)
                );
            });
    }

    // Menambahkan produk ke keranjang.
    function addToCart(id) {
        const product = menu.find((item) => item.id === id);

        if (!product || !product.available) {
            showToast("Produk ini sedang tidak tersedia.");
            return;
        }

        const cartItem = cart.find((item) => item.id === id);

        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            cart.push({
                id,
                quantity: 1
            });
        }

        saveCart();
        renderCart();

        showToast(`${product.name} ditambahkan ke keranjang.`);
    }

    // Menghitung jumlah produk dan total harga keranjang.
    function getCartSummary() {
        let total = 0;
        let count = 0;

        cart.forEach((item) => {
            const product = menu.find(
                (entry) => entry.id === item.id
            );

            if (!product) return;

            total += product.price * item.quantity;
            count += item.quantity;
        });

        return {
            total,
            count
        };
    }

    // Menggambar seluruh isi keranjang.
    function renderCart() {
        // Menghapus item keranjang yang produknya sudah tidak ada.
        cart = cart.filter((item) =>
            menu.some((product) => product.id === item.id)
        );

        saveCart();

        const validItems = cart
            .map((item) => ({
                item,
                product: menu.find(
                    (product) => product.id === item.id
                )
            }))
            .filter((entry) => entry.product);

        if (validItems.length === 0) {
            elements.cartItems.innerHTML = `
                <div class="cart-empty">
                    <span aria-hidden="true">🛍️</span>
                    <p>Keranjangmu masih kosong.</p>
                    <a href="#menu">Lihat menu</a>
                </div>
            `;
        } else {
            elements.cartItems.innerHTML = validItems
                .map(({ item, product }) => `
                    <div class="cart-row">
                        <div>
                            <p class="cart-product-name">
                                ${escapeHTML(product.name)}
                            </p>

                            <p class="cart-product-meta">
                                ${formatRupiah(product.price)} per item
                            </p>
                        </div>

                        <div
                            class="quantity-control"
                            aria-label="Jumlah ${escapeHTML(product.name)}"
                        >
                            <button
                                class="quantity-button"
                                type="button"
                                data-cart-action="decrease"
                                data-id="${escapeHTML(product.id)}"
                                aria-label="Kurangi jumlah"
                            >−</button>

                            <span class="quantity-number">
                                ${item.quantity}
                            </span>

                            <button
                                class="quantity-button"
                                type="button"
                                data-cart-action="increase"
                                data-id="${escapeHTML(product.id)}"
                                aria-label="Tambah jumlah"
                            >+</button>
                        </div>

                        <div class="cart-subtotal">
                            ${formatRupiah(product.price * item.quantity)}
                        </div>
                    </div>
                `)
                .join("");
        }

        const summary = getCartSummary();

        elements.cartTotal.textContent =
            formatRupiah(summary.total);

        elements.cartCount.textContent =
            String(summary.count);
    }

    // Mengubah kuantitas item dalam keranjang.
    // Jika kuantitas menjadi nol, item dihapus.
    function changeCartQuantity(id, change) {
        const item = cart.find((entry) => entry.id === id);

        if (!item) return;

        item.quantity += change;

        if (item.quantity <= 0) {
            cart = cart.filter((entry) => entry.id !== id);
        }

        saveCart();
        renderCart();
    }

    // Mengosongkan formulir admin.
    function resetProductForm() {
        elements.menuForm.reset();

        elements.productId.value = "";
        elements.productAvailable.checked = true;
        elements.saveProduct.textContent = "Simpan Menu";
        elements.cancelEdit.hidden = true;
    }

    // Mengisi formulir admin dengan produk yang akan diedit.
    function editProduct(id) {
        const product = menu.find((item) => item.id === id);

        if (!product) return;

        elements.productId.value = product.id;
        elements.productName.value = product.name;
        elements.productCategory.value = product.category;
        elements.productPrice.value = product.price;
        elements.productEmoji.value = product.emoji;
        elements.productDescription.value = product.description;
        elements.productAvailable.checked = product.available;

        elements.saveProduct.textContent = "Simpan Perubahan";
        elements.cancelEdit.hidden = false;

        elements.adminPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        elements.productName.focus({
            preventScroll: true
        });
    }

    // Menyimpan produk baru atau perubahan pada produk.
    function handleProductSubmit(event) {
        event.preventDefault();

        const name = elements.productName.value.trim();
        const description =
            elements.productDescription.value.trim();

        const price = Number(elements.productPrice.value);

        if (
            !name ||
            !description ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            showToast(
                "Periksa kembali nama, deskripsi, dan harga produk."
            );
            return;
        }

        const product = normalizeProduct({
            id: elements.productId.value || createId(),
            name,
            category: elements.productCategory.value,
            price,
            emoji: elements.productEmoji.value.trim() || "🍽️",
            description,
            available: elements.productAvailable.checked
        });

        const existingIndex = menu.findIndex(
            (item) => item.id === product.id
        );

        if (existingIndex >= 0) {
            menu[existingIndex] = product;
        } else {
            menu.unshift(product);
        }

        saveMenu();
        resetProductForm();
        renderMenu();
        renderCart();

        showToast(
            existingIndex >= 0
                ? "Perubahan menu disimpan di perangkat ini."
                : "Menu baru ditambahkan di perangkat ini."
        );
    }

    // Menangani aksi tambah, edit, ubah status, dan hapus menu.
    function handleMenuGridClick(event) {
        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button) return;

        const { action, id } = button.dataset;

        const product = menu.find(
            (item) => item.id === id
        );

        if (!product) return;

        if (action === "add") {
            addToCart(id);
        }

        if (action === "edit") {
            editProduct(id);
        }

        if (action === "toggle") {
            product.available = !product.available;

            saveMenu();
            renderMenu();

            showToast(
                product.available
                    ? "Produk ditandai tersedia."
                    : "Produk ditandai habis."
            );
        }

        if (action === "delete") {
            const confirmed = window.confirm(
                `Hapus menu "${product.name}" dari perangkat ini?`
            );

            if (!confirmed) return;

            menu = menu.filter((item) => item.id !== id);

            cart = cart.filter((item) => item.id !== id);

            saveMenu();
            saveCart();

            renderMenu();
            renderCart();

            showToast("Menu dihapus dari perangkat ini.");
        }
    }

    // Menampilkan menu yang sesuai dengan anggaran pengguna.
    function handleBudgetSubmit(event) {
        event.preventDefault();

        const budget = Number(elements.budgetInput.value);

        if (!Number.isFinite(budget) || budget <= 0) {
            elements.budgetResult.textContent =
                "Masukkan anggaran yang valid.";

            return;
        }

        const options = menu
            .filter(
                (product) =>
                    product.available &&
                    product.price <= budget
            )
            .sort((a, b) => a.price - b.price);

        if (options.length === 0) {
            elements.budgetResult.textContent =
                `Belum ada menu tersedia dengan harga hingga ${formatRupiah(budget)}.`;

            return;
        }

        // Menampilkan maksimal tiga saran menu termurah.
        const suggestions = options
            .slice(0, 3)
            .map(
                (product) =>
                    `${product.name} (${formatRupiah(product.price)})`
            )
            .join(" • ");

        elements.budgetResult.textContent =
            `Pilihan sesuai anggaran: ${suggestions}`;
    }

    // Mengunduh data menu sebagai file JSON.
    function exportMenu() {
        const blob = new Blob(
            [JSON.stringify(menu, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "menukita-menu.json";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        showToast("File cadangan menu berhasil dibuat.");
    }

    // Mengimpor data menu dari file JSON.
    async function importMenu(event) {
        const file =
            event.target.files && event.target.files[0];

        if (!file) return;

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);

            if (
                !Array.isArray(parsed) ||
                !parsed.every(isValidProduct)
            ) {
                throw new Error(
                    "File harus berupa daftar produk dengan nama, kategori, harga, dan deskripsi."
                );
            }

            const imported = parsed.map(normalizeProduct);

            const confirmed = window.confirm(
                `Impor ${imported.length} menu dan mengganti semua menu saat ini?`
            );

            if (!confirmed) return;

            menu = imported;

            saveMenu();

            // Keranjang dikosongkan karena menu mungkin berubah.
            cart = [];

            saveCart();
            renderMenu();
            renderCart();
            resetProductForm();

            showToast(
                "Data menu berhasil diimpor ke perangkat ini."
            );
        } catch (error) {
            window.alert(
                `File JSON tidak dapat diimpor: ${error.message}`
            );
        } finally {
            event.target.value = "";
        }
    }

    // Mengembalikan daftar menu ke data contoh.
    function resetMenu() {
        const confirmed = window.confirm(
            "Pulihkan semua menu contoh? Perubahan menu lokal saat ini akan diganti."
        );

        if (!confirmed) return;

        menu = DEFAULT_MENU.map((item) => ({ ...item }));
        cart = [];

        saveMenu();
        saveCart();

        resetProductForm();
        renderMenu();
        renderCart();

        showToast("Menu contoh berhasil dipulihkan.");
    }

    // Memasang event listener pada seluruh elemen interaktif.
    function bindEvents() {
        // Pencarian menu.
        elements.searchInput.addEventListener(
            "input",
            renderMenu
        );

        // Filter kategori.
        elements.categoryFilter.addEventListener(
            "change",
            () => {
                updateCategoryChips(
                    elements.categoryFilter.value
                );

                renderMenu();
            }
        );

        // Filter harga.
        elements.priceFilter.addEventListener(
            "change",
            renderMenu
        );

        // Tombol kategori cepat.
        elements.categoryChips.addEventListener(
            "click",
            (event) => {
                const button = event.target.closest(
                    "button[data-category]"
                );

                if (!button) return;

                elements.categoryFilter.value =
                    button.dataset.category;

                updateCategoryChips(
                    button.dataset.category
                );

                renderMenu();
            }
        );

        // Menghapus semua filter.
        elements.resetFilters.addEventListener(
            "click",
            () => {
                elements.searchInput.value = "";
                elements.categoryFilter.value = "Semua";
                elements.priceFilter.value = "0";

                updateCategoryChips("Semua");
                renderMenu();
            }
        );

        // Klik pada kartu menu.
        elements.menuGrid.addEventListener(
            "click",
            handleMenuGridClick
        );

        // Form pencarian sesuai anggaran.
        elements.budgetForm.addEventListener(
            "submit",
            handleBudgetSubmit
        );

        // Form tambah atau edit produk.
        elements.menuForm.addEventListener(
            "submit",
            handleProductSubmit
        );

        // Membatalkan proses edit.
        elements.cancelEdit.addEventListener(
            "click",
            resetProductForm
        );

        // Mengosongkan keranjang.
        elements.clearCart.addEventListener(
            "click",
            () => {
                if (cart.length === 0) {
                    showToast("Keranjang sudah kosong.");
                    return;
                }

                cart = [];

                saveCart();
                renderCart();

                showToast("Keranjang dikosongkan.");
            }
        );

        // Menambah atau mengurangi jumlah produk dalam keranjang.
        elements.cartItems.addEventListener(
            "click",
            (event) => {
                const button = event.target.closest(
                    "button[data-cart-action]"
                );

                if (!button) return;

                const change =
                    button.dataset.cartAction === "increase"
                        ? 1
                        : -1;

                changeCartQuantity(
                    button.dataset.id,
                    change
                );
            }
        );

        // Mencetak menu.
        elements.printMenu.addEventListener(
            "click",
            () => window.print()
        );

        // Mencetak halaman sebagai ringkasan pilihan.
        elements.printCart.addEventListener(
            "click",
            () => {
                const summary = getCartSummary();

                if (summary.count === 0) {
                    showToast(
                        "Tambahkan menu ke keranjang sebelum mencetak ringkasan."
                    );

                    return;
                }

                window.print();
            }
        );

        // Membuka atau menutup panel pengelola menu.
        elements.adminToggle.addEventListener(
            "click",
            () => {
                adminMode = !adminMode;

                elements.adminPanel.hidden = !adminMode;

                elements.adminToggle.setAttribute(
                    "aria-expanded",
                    String(adminMode)
                );

                elements.adminToggle.textContent =
                    adminMode
                        ? "Tutup Pengelola"
                        : "Kelola Menu";

                renderMenu();

                if (adminMode) {
                    elements.adminPanel.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            }
        );

        // Ekspor dan impor data menu.
        elements.exportMenu.addEventListener(
            "click",
            exportMenu
        );

        elements.importMenu.addEventListener(
            "change",
            importMenu
        );

        // Memulihkan data menu contoh.
        elements.resetMenu.addEventListener(
            "click",
            resetMenu
        );
    }

    // Menjalankan aplikasi ketika file JavaScript diproses.
    function init() {
        elements.currentYear.textContent =
            String(new Date().getFullYear());

        bindEvents();
        renderMenu();
        renderCart();

        // Service worker membantu menyimpan file untuk mode offline.
        // Pendaftaran memerlukan HTTPS atau localhost.
        if (
            "serviceWorker" in navigator &&
            (
                location.protocol === "https:" ||
                location.hostname === "localhost"
            )
        ) {
            navigator.serviceWorker
                .register("./service-worker.js")
                .catch((error) => {
                    console.warn(
                        "Service worker belum dapat didaftarkan:",
                        error
                    );
                });
        }
    }

    // Memulai aplikasi.
    init();
})();
