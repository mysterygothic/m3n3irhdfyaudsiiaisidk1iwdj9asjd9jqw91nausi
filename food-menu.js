// Food Menu Data - Load from Supabase or localStorage fallback
async function getFoodItems() {
    // Try to load from Supabase if available
    if (window.DB && window.DB.getMenuItems) {
        const items = await window.DB.getMenuItems();
        if (items && items.length > 0) {
            return items;
        }
    }
    
    // Fallback to localStorage
    const data = localStorage.getItem('menu_data');
    if (data) {
        return JSON.parse(data);
    }
    
    // Return default data if not available
    return [
        {
            id: 1,
            name: "زرب",
            description: "زرب مع الأرز البسمتي والبهارات الخاصة",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/zarbjaj.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/zarbjaj.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/zarblaham.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر نصف دجاجة", value: "سدر نصف دجاجة", price: 5 },
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "نصف كيلو", value: "نصف كيلو", price: 8 },
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 2,
            name: "منسف",
            description: "منسف مع الأرز واللبن واللوز",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/mansaf.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/mansaf.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/mansaf.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 3,
            name: "مندي",
            description: "مندي مع الأرز البسمتي والبهارات",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/mande.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/mande.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/mande.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 4,
            name: "برياني",
            description: "برياني حار بالفلفل الحار والخلطة العدنية السرية لمطعم الشيخ",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/breane.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/breane.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/breane.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 5,
            name: "كبسة",
            description: "  كبسة سعودية خاصة بمطعم الشيخ عيش تجربة الكبسة السعودية وأطلب كبسة ..",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/kabsa.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/kabsa.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/kabsa.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8},
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 6,
            name: "قدرة",
            description: " القدرة الخليلية على أصولها من عند مطعم الشيخ باللحم والدجاج ",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/qedra.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/qedra.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/qedra.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 7,
            name: "فريكة",
            description: "فريكة جنين الشهية من مطعم الشيخ بالدجاج واللحم",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/freke.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/freke.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/freke.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        }
    ];
}

// Initialize menu data in localStorage if not exists
async function initMenuData() {
    const items = await getFoodItems();
    if (items && items.length > 0) {
        localStorage.setItem('menu_data', JSON.stringify(items));
    }
}

// Cart Management
let cart = [];
let currentFilter = 'all';
let foodItems = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize database connection
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.init) {
        await window.SUPABASE_CONFIG.init();
    }
    
    // Load menu data
    await initMenuData();
    foodItems = await getFoodItems();
    
    // Render page
    renderFoodItems();
    updateCartDisplay();
});

// Filter food items by category
async function filterCategory(category) {
    currentFilter = category;
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    await renderFoodItems();
}

// Render food items
async function renderFoodItems() {
    const grid = document.getElementById('foodItemsGrid');
    foodItems = await getFoodItems(); // Get fresh data
    const filteredItems = currentFilter === 'all' 
        ? foodItems 
        : foodItems.filter(item => item.category === currentFilter);
    
    grid.innerHTML = filteredItems.map(item => `
        <div class="food-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="food-item-image" loading="lazy">
            <div class="food-item-content">
                <h3 class="food-item-name">${item.name}</h3>
                <p class="food-item-description">${item.description}</p>
                <div class="food-item-price">من ${item.basePrice} دينار</div>
                
                <div class="meat-selection">
                    <label>نوع السدر:</label>
                    <div class="meat-options">
                        <button class="meat-btn active" data-type="دجاج" onclick="selectMeatType(${item.id}, 'دجاج')">دجاج</button>
                        <button class="meat-btn" data-type="لحم" onclick="selectMeatType(${item.id}, 'لحم')">لحم</button>
                    </div>
                </div>
                
                <div class="quantity-selection">
                    <label for="quantity-${item.id}">اختر الكمية:</label>
                    <select id="quantity-${item.id}" onchange="updateItemQuantity(${item.id})">
                        <option value="">اختر الكمية</option>
                        <div id="quantity-options-${item.id}">
                            ${item.quantityOptions.map(option => 
                                `<option value="${option.value}" data-price="${option.price}">${option.label} - ${option.price} دينار</option>`
                            ).join('')}
                        </div>
                    </select>
                </div>
                
                <div class="food-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="decreaseQuantity(${item.id})" disabled>-</button>
                        <span class="quantity-display" id="qty-${item.id}">0</span>
                        <button class="quantity-btn" onclick="increaseQuantity(${item.id})" disabled>+</button>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart(${item.id})" disabled>
                        أضف للسلة
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Select meat type
async function selectMeatType(itemId, meatType) {
    foodItems = await getFoodItems();
    const item = foodItems.find(item => item.id === itemId);
    const meatButtons = document.querySelectorAll(`[data-id="${itemId}"] .meat-btn`);
    const quantitySelect = document.getElementById(`quantity-${itemId}`);
    const quantityOptionsDiv = document.getElementById(`quantity-options-${itemId}`);
    
    // Update active button
    meatButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === meatType) {
            btn.classList.add('active');
        }
    });
    
    // Update image
    const meatOption = item.meatOptions.find(option => option.type === meatType);
    const foodImage = document.querySelector(`[data-id="${itemId}"] .food-item-image`);
    foodImage.src = meatOption.image;
    
    // Update quantity options
    const options = meatType === 'دجاج' ? item.quantityOptions : item.meatQuantityOptions;
    const optionsHTML = options.map(option => 
        `<option value="${option.value}" data-price="${option.price}">${option.label} - ${option.price} دينار</option>`
    ).join('');
    
    // Update the select element with new options
    quantitySelect.innerHTML = '<option value="">اختر الكمية</option>' + optionsHTML;
    
    // Reset quantity selection
    quantitySelect.selectedIndex = 0;
    
    // Update item in cart if exists
    const cartItem = cart.find(item => item.id === itemId);
    if (cartItem) {
        cartItem.meatType = meatType;
        cartItem.selectedQuantity = '';
        // Update price based on new meat type
        const meatOption = item.meatOptions.find(option => option.type === meatType);
        cartItem.basePrice = meatOption.price;
        cartItem.price = 0;
        cartItem.quantity = 0;
    }
    
    updateQuantityDisplay(itemId);
    updateCartDisplay();
    updateAddToCartButton(itemId);
}

// Update item quantity selection
async function updateItemQuantity(itemId) {
    const select = document.getElementById(`quantity-${itemId}`);
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        foodItems = await getFoodItems();
        const item = foodItems.find(item => item.id === itemId);
        const selectedQuantity = selectedOption.value;
        const selectedPrice = parseFloat(selectedOption.dataset.price);
        const activeMeatBtn = document.querySelector(`[data-id="${itemId}"] .meat-btn.active`);
        const meatType = activeMeatBtn ? activeMeatBtn.dataset.type : 'دجاج';
        
        // Update or add to cart
        const cartItem = cart.find(item => item.id === itemId);
        if (cartItem) {
            cartItem.selectedQuantity = selectedQuantity;
            cartItem.price = selectedPrice;
            cartItem.meatType = meatType;
        } else {
            cart.push({
                ...item,
                selectedQuantity: selectedQuantity,
                price: selectedPrice,
                meatType: meatType,
                quantity: 1
            });
        }
        
        updateQuantityDisplay(itemId);
        updateCartDisplay();
        updateAddToCartButton(itemId);
    }
}

// Increase quantity
function increaseQuantity(itemId) {
    const cartItem = cart.find(item => item.id === itemId);
    
    if (cartItem && cartItem.selectedQuantity) {
        cartItem.quantity++;
        updateQuantityDisplay(itemId);
        updateCartDisplay();
    }
}

// Decrease quantity
function decreaseQuantity(itemId) {
    const cartItem = cart.find(item => item.id === itemId);
    
    if (cartItem && cartItem.selectedQuantity) {
        cartItem.quantity--;
        if (cartItem.quantity <= 0) {
            cart = cart.filter(item => item.id !== itemId);
            // Reset select
            const select = document.getElementById(`quantity-${itemId}`);
            select.selectedIndex = 0;
            // Reset meat selection to default (دجاج)
            const meatButtons = document.querySelectorAll(`[data-id="${itemId}"] .meat-btn`);
            meatButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.type === 'دجاج') {
                    btn.classList.add('active');
                }
            });
            // Reset to chicken image and options
            selectMeatType(itemId, 'دجاج');
        }
    }
    
    updateQuantityDisplay(itemId);
    updateCartDisplay();
    updateAddToCartButton(itemId);
}

// Update quantity display
function updateQuantityDisplay(itemId) {
    const cartItem = cart.find(item => item.id === itemId);
    const quantityDisplay = document.getElementById(`qty-${itemId}`);
    const decreaseBtn = quantityDisplay.parentElement.querySelector('.quantity-btn:first-child');
    const increaseBtn = quantityDisplay.parentElement.querySelector('.quantity-btn:last-child');
    
    if (cartItem && cartItem.selectedQuantity) {
        quantityDisplay.textContent = cartItem.quantity;
        decreaseBtn.disabled = false;
        increaseBtn.disabled = false;
    } else {
        quantityDisplay.textContent = '0';
        decreaseBtn.disabled = true;
        increaseBtn.disabled = true;
    }
}

// Update add to cart button
function updateAddToCartButton(itemId) {
    const cartItem = cart.find(item => item.id === itemId);
    const addBtn = document.querySelector(`[data-id="${itemId}"] .add-to-cart-btn`);
    
    if (cartItem && cartItem.selectedQuantity) {
        addBtn.disabled = false;
        addBtn.textContent = 'أضف للسلة';
    } else {
        addBtn.disabled = true;
        addBtn.textContent = 'اختر الكمية أولاً';
    }
}

// Add to cart
function addToCart(itemId) {
    increaseQuantity(itemId);
}

// Update cart display
function updateCartDisplay() {
    const cartSection = document.getElementById('cartSection');
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const totalPrice = document.getElementById('totalPrice');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const mobileBar = document.getElementById('mobileCheckoutBar');
    const mobileTotal = document.getElementById('mobileTotalPrice');
    const mobileCheckoutBtn = document.getElementById('mobileCheckoutBtn');
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    const floatingCartBadge = document.getElementById('floatingCartBadge');
    const mobileCartCount = document.getElementById('mobileCartCount');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    if (mobileCartCount) mobileCartCount.textContent = totalItems;
    if (floatingCartBadge) floatingCartBadge.textContent = totalItems;
    
    // Show/hide cart and floating button
    if (cart.length > 0) {
        cartSection.classList.add('visible');
        if (floatingCartBtn && window.innerWidth <= 768) {
            floatingCartBtn.classList.add('visible');
        }
    } else {
        cartSection.classList.remove('visible');
        if (floatingCartBtn) {
            floatingCartBtn.classList.remove('visible');
        }
    }
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">السلة فارغة</p>';
        checkoutBtn.disabled = true;
        if (mobileCheckoutBtn) mobileCheckoutBtn.disabled = true;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name} (${item.meatType})</div>
                    <div class="cart-item-details">${item.selectedQuantity} • ${item.quantity}x</div>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-item-price">${item.price * item.quantity} دينار</div>
                    <button class="remove-item-btn" onclick="removeFromCart(${item.id})" title="إزالة">×</button>
                </div>
            </div>
        `).join('');
        checkoutBtn.disabled = false;
        if (mobileCheckoutBtn) mobileCheckoutBtn.disabled = false;
    }
    
    // Update total price
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPrice.textContent = `${total} دينار`;
    if (mobileTotal) mobileTotal.textContent = `${total} دينار`;

    // Toggle mobile checkout bar on small screens
    if (mobileBar) {
        if (window.innerWidth <= 768 && cart.length > 0) {
            mobileBar.style.display = 'flex';
        } else {
            mobileBar.style.display = 'none';
        }
    }
}

// Toggle cart section (Mobile)
function toggleCartSection() {
    const cartSection = document.getElementById('cartSection');
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    
    if (cartSection.classList.contains('visible')) {
        // If cart is visible, minimize it
        cartSection.classList.add('minimized');
        if (floatingCartBtn) floatingCartBtn.classList.add('visible');
    } else {
        // If cart is hidden, show it
        cartSection.classList.add('visible');
        cartSection.classList.remove('minimized');
        if (floatingCartBtn) floatingCartBtn.classList.remove('visible');
    }
}

// Toggle cart minimize (Mobile)
function toggleCartMinimize() {
    const cartSection = document.getElementById('cartSection');
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    
    if (cartSection.classList.contains('minimized')) {
        cartSection.classList.remove('minimized');
        if (floatingCartBtn && window.innerWidth <= 768) {
            floatingCartBtn.classList.remove('visible');
        }
    } else {
        cartSection.classList.add('minimized');
        if (floatingCartBtn && window.innerWidth <= 768) {
            floatingCartBtn.classList.add('visible');
        }
    }
}

// Handle window resize
window.addEventListener('resize', function() {
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    const cartSection = document.getElementById('cartSection');
    
    if (window.innerWidth > 768) {
        // Desktop: hide floating button
        if (floatingCartBtn) {
            floatingCartBtn.classList.remove('visible');
        }
        // Remove minimized state on desktop
        if (cartSection) {
            cartSection.classList.remove('minimized');
        }
    } else {
        // Mobile: show floating button if cart has items and is minimized
        if (floatingCartBtn && cart.length > 0 && cartSection.classList.contains('minimized')) {
            floatingCartBtn.classList.add('visible');
        }
    }
});

// Remove from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    // Reset select
    const select = document.getElementById(`quantity-${itemId}`);
    if (select) {
        select.selectedIndex = 0;
    }
    // Reset meat selection to default (دجاج)
    const meatButtons = document.querySelectorAll(`[data-id="${itemId}"] .meat-btn`);
    meatButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === 'دجاج') {
            btn.classList.add('active');
        }
    });
    // Reset to chicken image and options
    selectMeatType(itemId, 'دجاج');
    updateQuantityDisplay(itemId);
    updateCartDisplay();
    updateAddToCartButton(itemId);
}

// Checkout
function checkout() {
    if (cart.length === 0) return;
    
    const modal = document.getElementById('customerInfoModal');
    const cartSection = document.getElementById('cartSection');
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    const mobileBar = document.getElementById('mobileCheckoutBar');
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Hide cart section and floating button when opening checkout modal
    if (cartSection && window.innerWidth <= 768) {
        cartSection.classList.add('minimized');
    }
    if (floatingCartBtn) {
        floatingCartBtn.style.display = 'none';
    }
    if (mobileBar) {
        mobileBar.style.display = 'none';
    }

}

// Close customer modal
function closeCustomerModal() {
    const modal = document.getElementById('customerInfoModal');
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    const mobileBar = document.getElementById('mobileCheckoutBar');
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Show floating button again if on mobile and cart has items
    if (floatingCartBtn && cart.length > 0 && window.innerWidth <= 768) {
        floatingCartBtn.style.display = 'flex';
    }
    if (mobileBar && cart.length > 0 && window.innerWidth <= 768) {
        mobileBar.style.display = 'flex';
    }
    
    // Reset form
    const form = document.getElementById('customerInfoForm');
    form.reset();
}

// Show order confirmation modal
function showOrderConfirmation() {
    const modal = document.getElementById('orderConfirmationModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close order confirmation modal
function closeOrderConfirmation() {
    const modal = document.getElementById('orderConfirmationModal');
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Show floating button again if on mobile and cart has items (after order completion cart should be empty)
    if (floatingCartBtn && cart.length > 0 && window.innerWidth <= 768) {
        floatingCartBtn.style.display = 'flex';
    }
}

// Submit order
async function submitOrder(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Validate phone number
    const phoneNumber = formData.get('phoneNumber');
    if (!phoneNumber || phoneNumber.trim() === '') {
        alert('رقم الهاتف مطلوب! يرجى إدخال رقم هاتف صحيح');
        document.getElementById('phoneNumber').focus();
        return;
    }
    
    if (phoneNumber.length < 9 || phoneNumber.length > 10) {
        alert('يرجى إدخال رقم هاتف صحيح (9-10 أرقام)');
        document.getElementById('phoneNumber').focus();
        return;
    }
    
    // Check if phone number contains only digits
    if (!/^\d+$/.test(phoneNumber)) {
        alert('رقم الهاتف يجب أن يحتوي على أرقام فقط');
        document.getElementById('phoneNumber').focus();
        return;
    }
    
    // Format phone number (remove leading 0 if present and add +962)
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
        formattedPhone = phoneNumber.substring(1);
    }
    
    const orderData = {
        customerName: formData.get('customerName'),
        phoneNumber: '+962' + formattedPhone,
        deliveryAddress: formData.get('deliveryAddress') || 'لا يوجد عنوان',
        items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            selectedQuantity: item.selectedQuantity,
            meatType: item.meatType,
            price: item.price,
            total: item.price * item.quantity
        })),
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    // Validate required fields
    if (!orderData.customerName || !orderData.phoneNumber) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    // Disable submit button
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الإرسال...';
    
    try {
        // Create order message for Telegram
        const itemsList = orderData.items.map(item => 
            `• ${item.name} (${item.meatType}) - ${item.selectedQuantity} × ${item.quantity} = ${item.total} دينار`
        ).join('\n');
        
        const orderMessage = `
 <b>طلب جديد من الموقع</b>

 <b>اسم العميل:</b> ${orderData.customerName}
 <b>رقم الهاتف:</b> ${orderData.phoneNumber}
 <b>عنوان التوصيل:</b> ${orderData.deliveryAddress}

 <b>تفاصيل الطلب:</b>
${itemsList}

 <b>المجموع الكلي:</b> ${orderData.totalAmount} دينار

 <b>وقت الطلب:</b> ${new Date().toLocaleString('ar-JO')}
        `.trim();
        
        // Send to Telegram
        const response = await sendToTelegram({ 
            type: 'food_order', 
            message: orderMessage,
            orderData: orderData
        });
        
        if (response) {
            // Success - Show confirmation modal
            showOrderConfirmation();
            closeCustomerModal();
            
            // Clear cart
            cart = [];
            updateCartDisplay();
            renderFoodItems();

        } else {
            throw new Error('Failed to send order');
        }
        
    } catch (error) {

        alert('حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى أو الاتصال بنا مباشرة.');

    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'إرسال الطلب';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const customerModal = document.getElementById('customerInfoModal');
    if (event.target === customerModal) {
        closeCustomerModal();
    }
}

// Initialize form submission
document.addEventListener('DOMContentLoaded', function() {
    const customerForm = document.getElementById('customerInfoForm');
    if (customerForm) {
        customerForm.addEventListener('submit', submitOrder);
    }
    // Initial toggle for mobile bar
    updateCartDisplay();
    // Handle orientation/viewport changes
    window.addEventListener('resize', () => {
        updateCartDisplay();
    });
});
