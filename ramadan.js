// Ramadan Orders Management
let ramadanCart = [];
let currentRamadanFilter = 'all';
let deleteOrderId = null;
let editOrderId = null;
let quickEntrySessionCount = 0;
let allOrders = []; // For search functionality
let activeRamadanDate = null; // ISO date string 'YYYY-MM-DD'

// Telegram Configuration (using Cloudflare Worker)
const TELEGRAM_WORKER_URL = 'https://mataamshiekh-ramadan.zlmsn3mk.workers.dev'; // Your worker URL

// Get Ramadan orders from database (with localStorage fallback)
async function getRamadanOrders() {
    if (window.DB && window.DB.getRamadanOrders) {
        return await window.DB.getRamadanOrders();
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.RAMADAN_ORDERS);
    return data ? JSON.parse(data) : [];
}

// Format phone as local Jordan number for display/printing (e.g., +9627xxxx -> 07xxxx)
function formatLocalJordanPhone(phone) {
    if (!phone) return '-';
    let s = String(phone).trim().replace(/\s|-/g, '');
    if (s.startsWith('+962')) s = '0' + s.slice(4);
    else if (s.startsWith('962')) s = '0' + s.slice(3);
    else if (s.startsWith('0')) s = s;
    else if (s.startsWith('7')) s = '0' + s;
    return s;
}
// Ensure global access
window.formatLocalJordanPhone = formatLocalJordanPhone;

// ========== BULK PRINT (ONE PRINT JOB) ==========
function openBulkPrintModal() {
    const modal = document.getElementById('bulkPrintModal');
    if (!modal) return;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    refreshBulkPrintList();
}

function closeBulkPrintModal() {
    const modal = document.getElementById('bulkPrintModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function refreshBulkPrintList() {
    const list = document.getElementById('bulkPrintList');
    const bodyPickup = document.getElementById('bulkBody_pickup');
    const bodyDelivery = document.getElementById('bulkBody_delivery');
    if (!list || !bodyPickup || !bodyDelivery) return;
    const all = await getRamadanOrders();
    const orders = filterOrdersByActiveDate(all);
    if (!orders.length) {
        bodyPickup.innerHTML = '';
        bodyDelivery.innerHTML = '';
        list.insertAdjacentHTML('beforeend', '<div style="color:#666; padding:8px;">لا توجد طلبات للطباعة</div>');
        return;
    }
    const pickup = orders.filter(o => o.deliveryType === 'استلام');
    const delivery = orders.filter(o => o.deliveryType === 'توصيل');
    const renderItem = (o) => `
        <label style="display:flex; align-items:center; gap:8px; padding:6px; border-bottom:1px solid #f2f2f2;">
            <input type="checkbox" class="bulk-print-check" data-group="${o.deliveryType === 'توصيل' ? 'delivery' : 'pickup'}" value="${o.id}" />
            <span style="flex:1;">طلب ${o.serialNumber} — ${o.customerName}${o.deliveryType === 'توصيل' ? ' — ' + (o.deliveryAddress || '-') : ''}</span>
            <span style="color:#444; min-width:80px; text-align:end;">${o.totalAmount || 0} د</span>
        </label>`;
    bodyPickup.innerHTML = pickup.map(renderItem).join('') || '<div style="color:#777; padding:6px;">لا توجد طلبات استلام</div>';
    bodyDelivery.innerHTML = delivery.map(renderItem).join('') || '<div style="color:#777; padding:6px;">لا توجد طلبات توصيل</div>';
}

function toggleBulkGroup(group) {
    const body = document.getElementById(`bulkBody_${group}`);
    const icon = document.getElementById(`bulkIcon_${group}`);
    if (!body || !icon) return;
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    icon.textContent = isHidden ? '' : '';
}

function toggleGroupSelectAll(group, chk) {
    const checks = document.querySelectorAll(`.bulk-print-check[data-group="${group}"]`);
    checks.forEach(c => { c.checked = chk.checked; });
    // update master select all
    const allChecks = Array.from(document.querySelectorAll('.bulk-print-check'));
    const allChecked = allChecks.length > 0 && allChecks.every(c => c.checked);
    const master = document.getElementById('bulkSelectAll');
    if (master) master.checked = allChecked;
}

function toggleBulkSelectAll(chk) {
    const checks = document.querySelectorAll('.bulk-print-check');
    checks.forEach(c => { c.checked = chk.checked; });
}

async function bulkPrintSelected() {
    const checks = Array.from(document.querySelectorAll('.bulk-print-check')).filter(c => c.checked);
    if (checks.length === 0) { alert('اختر طلبات للطباعة'); return; }
    const ids = checks.map(c => parseInt(c.value, 10));
    const orders = await getRamadanOrders();
    const selected = orders.filter(o => ids.includes(o.id));
    if (!selected.length) { alert('لا توجد طلبات مطابقة'); return; }

    const buildReceipt = (order) => {

        const itemsHtml = (order.items || []).map(item => {
            if (item.meatType === '-') return `<div class="pos-item"><span>${item.name}</span></div>`;
            return `<div class="pos-item"><span>${item.name} (${item.meatType})</span><span>${item.selectedQuantity} × ${item.quantity}</span></div>`;
        }).join('');
        return `
        <div class="receipt">
          <div class="pos-header">
            <h1>مطعم ومطبخ الشيخ</h1>
            <div class="pos-meta">طلب رقم ${order.serialNumber}</div>
          </div>
          <div class="pos-section">
            <div class="pos-meta">الاسم: ${order.customerName || '-'}</div>
            <div class="pos-meta">الهاتف: ${formatLocalJordanPhone(order.phoneNumber) || '-'}</div>
            <div class="pos-meta">النوع: ${order.deliveryType || '-'}</div>
            ${order.deliveryType === 'توصيل' ? `<div class="pos-meta">العنوان: ${order.deliveryAddress || '-'}</div>` : ''}
            ${order.otherDetails ? `<div class="pos-meta">تفاصيل: ${order.otherDetails}</div>` : ''}
          </div>
          <div class="pos-section">
            <div class="pos-meta" style="margin-bottom:4px;">الطلب</div>
            ${itemsHtml || '<div class="pos-meta">-</div>'}
          </div>
          <div class="pos-section">
            <div class="pos-total"><span>السعر</span><span>${order.totalAmount || 0} دينار</span></div>
            ${order.deliveryType === 'توصيل' && order.deliveryFee != null ? `<div class="pos-total" style="font-size:12px; margin-top:4px;"><span>رسوم التوصيل</span><span>${order.deliveryFee} دينار</span></div>` : ''}
            ${order.deliveryType === 'توصيل' && order.deliveryFee != null ? `<div class="pos-total" style="margin-top:4px; border-top:1px dashed #000; padding-top:4px;"><span>الإجمالي</span><span>${(Number(order.totalAmount||0) + Number(order.deliveryFee||0)).toFixed(2)} دينار</span></div>` : ''}
          </div>
          <div class="pos-footer">${formatOrderDate(order, true)}</div>
        </div>
        `;
    };

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bulk POS</title>
  <style>
    @page { size: 80mm auto; margin: 2mm 2mm; }
    body { font-family: 'IBM Plex Sans Arabic', Arial, sans-serif; direction: rtl; }
    .wrap { width: 72mm; margin: 0 auto; }
    .receipt { page-break-after: always; }
    .pos-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
    .pos-header h1 { font-size: 16px; margin: 0; }
    .pos-meta { font-size: 12px; line-height: 1.5; }
    .pos-section { border-bottom: 1px dashed #000; padding: 6px 0; }
    .pos-item { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
    .pos-total { font-weight: 700; font-size: 14px; display: flex; justify-content: space-between; }
    .pos-footer { text-align: center; font-size: 11px; padding-top: 6px; }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
  </head>
<body>
  <div class="wrap">
    ${selected.map(buildReceipt).join('')}
  </div>
  <script>
    window.onload = () => { 
        // Wait for fonts to load, then auto-print
        setTimeout(() => { 
            window.print(); 
        }, 500); 
    };
  <\/script>
</body>
</html>`;

    // Open in new window - all receipts in ONE window
    const printWin = window.open('', '_blank', 'width=800,height=600');
    if (!printWin) {
        alert(' يرجى السماح بالنوافذ المنبثقة للطباعة\n\nالرجاء:\n1. السماح بالنوافذ المنبثقة لهذا الموقع\n2. إعادة المحاولة');
        return;
    }
    
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    
    // close modal
    closeBulkPrintModal();
}

// Save Ramadan orders to database (with localStorage cache)
async function saveRamadanOrders(orders) {
    // Save to localStorage as cache
    localStorage.setItem(STORAGE_KEYS.RAMADAN_ORDERS, JSON.stringify(orders));
    
    // Save to database if available
    if (window.DB && window.DB.saveRamadanOrders) {
        await window.DB.saveRamadanOrders(orders);
    }
}

function normalizePhone(phone) {
    if (!phone) return '';
    let p = String(phone).trim();
    p = p.replace(/\s|-/g, '');
    if (p.startsWith('+962')) {
        p = p.substring(4);
    }
    if (p.startsWith('0')) {
        p = p.substring(1);
    }
    return p;
}

// Initialize Ramadan page
document.addEventListener('DOMContentLoaded', async function() {
    if (document.getElementById('ramadanOrdersTable')) {
        initRamadanDateSelectors();
        await loadRamadanOrders();
        await updateRamadanStats();
    }
});

// ========== ACTIVE DATE SELECTORS ==========
function initRamadanDateSelectors() {
    const daySel = document.getElementById('ramadanDaySelect');
    const monthSel = document.getElementById('ramadanMonthSelect');
    const yearSel = document.getElementById('ramadanYearSelect');
    const saved = localStorage.getItem('ACTIVE_RAMADAN_DATE'); // YYYY-MM-DD
    const today = new Date();
    const initDate = saved ? new Date(saved) : today;
    const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];
    if (yearSel) {
        yearSel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
        yearSel.value = initDate.getFullYear();
    }
    if (monthSel) {
        monthSel.innerHTML = Array.from({length:12}, (_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');
        monthSel.value = initDate.getMonth() + 1;
    }
    if (daySel) {
        const mdays = daysInMonth(initDate.getMonth()+1, initDate.getFullYear());
        daySel.innerHTML = Array.from({length:mdays}, (_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');
        daySel.value = initDate.getDate();
    }
    setActiveDateLabel();
    activeRamadanDate = toISODate(initDate);
    localStorage.setItem('ACTIVE_RAMADAN_DATE', activeRamadanDate);
}

function updateActiveRamadanDate() {
    const daySel = document.getElementById('ramadanDaySelect');
    const monthSel = document.getElementById('ramadanMonthSelect');
    const yearSel = document.getElementById('ramadanYearSelect');
    if (!daySel || !monthSel || !yearSel) return;
    // adjust day list when month/year changes
    const mdays = daysInMonth(parseInt(monthSel.value,10), parseInt(yearSel.value,10));
    const prevDay = parseInt(daySel.value,10) || 1;
    const dayVal = Math.min(prevDay, mdays);
    daySel.innerHTML = Array.from({length:mdays}, (_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');
    daySel.value = dayVal;
    const d = new Date(parseInt(yearSel.value,10), parseInt(monthSel.value,10)-1, parseInt(daySel.value,10));
    activeRamadanDate = toISODate(d);
    localStorage.setItem('ACTIVE_RAMADAN_DATE', activeRamadanDate);
    setActiveDateLabel();
    loadRamadanOrders();
    updateRamadanStats();
}

function getActiveDateISO() {
    if (activeRamadanDate) return activeRamadanDate;
    const saved = localStorage.getItem('ACTIVE_RAMADAN_DATE');
    return saved || toISODate(new Date());
}

function filterOrdersByActiveDate(list) {
    const iso = getActiveDateISO();
    return (list || []).filter(o => {
        const sched = o.scheduledDate;
        if (sched) return sched === iso;
        // fallback: compare by order.date as Jordan local yyyy-mm-dd
        if (!o.date) return false;
        const parts = new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit', timeZone:'Asia/Amman' }).format(new Date(o.date));
        // en-CA gives YYYY-MM-DD
        return parts === iso;
    });
}

function toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const da = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
}

function daysInMonth(m, y) {
    return new Date(y, m, 0).getDate();
}

function setActiveDateLabel() {
    const label = document.getElementById('activeRamadanDateLabel');
    if (!label) return;
    const iso = getActiveDateISO();
    const d = new Date(`${iso}T00:00:00`);
    label.textContent = d.toLocaleDateString('ar-JO', { year:'numeric', month:'2-digit', day:'2-digit' });
}

// Load Ramadan orders table
async function loadRamadanOrders(ordersToDisplay = null) {
    const all = ordersToDisplay || await getRamadanOrders();
    allOrders = await getRamadanOrders(); // Store all orders for search
    const orders = filterOrdersByActiveDate(all);
    const tbody = document.getElementById('ramadanOrdersBody');
    
    const phoneCounts = {};
    orders.forEach(o => {
        const p = normalizePhone(o.phoneNumber || '');
        if (!p) return;
        phoneCounts[p] = (phoneCounts[p] || 0) + 1;
    });
    const duplicatePhones = new Set(Object.keys(phoneCounts).filter(p => phoneCounts[p] > 1));
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="empty-state">لا توجد طلبات</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map((order, index) => `
        <tr>
            <td>طلب رقم ${order.serialNumber}</td>
            <td>${order.customerName}</td>
            <td>${formatOrderItems(order.items)}</td>
            <td><strong>${order.totalAmount} دينار</strong></td>
            <td>${duplicatePhones.has(normalizePhone(order.phoneNumber)) ? `<span class="badge badge-duplicate" title="رقم مكرر">${order.phoneNumber}</span>` : order.phoneNumber}</td>
            <td><span class="badge ${order.deliveryType === 'توصيل' ? 'badge-delivery' : 'badge-pickup'}">${order.deliveryType}</span></td>
            <td>${order.deliveryType === 'توصيل' ? (order.deliveryAddress || '-') : '-'}</td>
            <td>
                ${order.deliveryType === 'توصيل' ? 
                    (order.driver_name || order.driverName ? 
                        `<span class="badge badge-delivery">${order.driver_name || order.driverName}</span>` : 
                        `<button class="action-btn" onclick="openAssignDriverModal(${order.id})" title="تعيين سائق" style="background: #28a745;"></button>`
                    ) : 
                    '<span style="color: #95a5a6;">-</span>'
                }
            </td>
            <td>${order.cash_amount || order.cashAmount ? `${order.cash_amount || order.cashAmount} د` : '-'}</td>
            <td>${order.otherDetails || '-'}</td>
            <td>${formatOrderDate(order, true)}</td>
            <td>
                <button class="action-btn edit-order-btn" onclick="openEditOrderModal(${order.id})" title="تعديل"></button>
                <button class="action-btn view-btn" onclick="viewOrder(${order.id})" title="عرض"></button>
                <button class="action-btn" onclick="printRamadanOrderPOS(${order.id})" title="طباعة POS" style="background: #6c757d;">🧾</button>
                ${order.driver_name || order.driverName ? 
                    `<button class="action-btn" onclick="openAssignDriverModal(${order.id})" title="تعديل السائق" style="background: #ffc107;"></button>` : 
                    ''
                }
                <button class="action-btn delete-order-btn" onclick="openDeleteOrderModal(${order.id})" title="حذف"></button>
            </td>
        </tr>
    `).join('');
}

// Format order items for display
function formatOrderItems(items) {
    if (!items || items.length === 0) return '-';
    
    return items.map(item => {
        // إذا كان طلب سريع (meatType = '-')
        if (item.meatType === '-') {
            // اعرض فقط اسم الطلب كما كتبه المستخدم
            return item.name;
        }
        // إذا كان طلب من المنيو العادي
        return `${item.name} (${item.meatType}) - ${item.selectedQuantity} × ${item.quantity}`;
    }).join('<br>');
}

// Format date in Jordan timezone and prefer scheduledDate
function formatDateJordan(input, withTime = false) {
    if (!input) return '-';
    let d;
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
        // scheduledDate like YYYY-MM-DD -> set explicit +03:00 offset
        d = new Date(`${input}T00:00:00+03:00`);
    } else {
        d = new Date(input);
    }
    const opts = withTime
        ? { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', timeZone: 'Asia/Amman' }
        : { year:'numeric', month:'2-digit', day:'2-digit', timeZone: 'Asia/Amman' };
    return new Intl.DateTimeFormat('ar-JO', opts).format(d);
}

function formatOrderDate(order, withTime = false) {
    if (!order) return '-';
    const src = order.scheduledDate || order.date;
    return formatDateJordan(src, withTime);
}

// Update Ramadan statistics
async function updateRamadanStats() {
    const all = await getRamadanOrders();
    const orders = filterOrdersByActiveDate(all);
    
    // Total orders
    document.getElementById('totalOrders').textContent = orders.length;
    
    // Delivery orders revenue
    const deliveryOrders = orders.filter(order => order.deliveryType === 'توصيل');
    const deliveryRevenue = deliveryOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    document.getElementById('deliveryRevenue').textContent = `${deliveryRevenue} دينار`;
    
    // Delivery fees total
    const deliveryFeesTotal = deliveryOrders.reduce((sum, order) => sum + (parseFloat(order.deliveryFee || order.delivery_fee || 0)), 0);
    const feeEl = document.getElementById('deliveryFeesTotal');
    if (feeEl) feeEl.textContent = `${deliveryFeesTotal.toFixed(2)} دينار`;
    
    // Today's orders
    document.getElementById('todayOrders').textContent = orders.length;
    
    // Total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    document.getElementById('totalRevenue').textContent = `${totalRevenue} دينار`;
}

// Show Ramadan order form
async function showRamadanOrderForm() {
    const formSection = document.getElementById('ramadanOrderFormSection');
    formSection.style.display = 'block';
    formSection.scrollIntoView({ behavior: 'smooth' });
    
    // Load menu items for ordering
    await loadRamadanFoodItems();
}

// Hide Ramadan order form
function hideRamadanOrderForm() {
    const formSection = document.getElementById('ramadanOrderFormSection');
    formSection.style.display = 'none';
    
    // Clear cart
    ramadanCart = [];
    updateRamadanCartDisplay();
    
    // Reset form
    document.getElementById('ramadanCustomerForm').reset();
}

// Load food items for Ramadan ordering
async function loadRamadanFoodItems() {
    const menuData = await getMenuData();
    const categories = await getCategories();
    const grid = document.getElementById('ramadanFoodItems');
    const categoryButtons = document.getElementById('ramadanCategoryButtons');
    
    // Update category buttons
    if (categoryButtons) {
        categoryButtons.innerHTML = categories.map(cat => 
            `<button class="category-btn ${currentRamadanFilter === cat.value ? 'active' : ''}" onclick="filterRamadanCategory('${cat.value}')">${cat.name}</button>`
        ).join('');
    }
    
    const filteredItems = currentRamadanFilter === 'all' 
        ? menuData 
        : menuData.filter(item => item.category === currentRamadanFilter);
    
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
                        <button class="meat-btn active" data-type="دجاج" onclick="selectRamadanMeatType(${item.id}, 'دجاج')">دجاج</button>
                        <button class="meat-btn" data-type="لحم" onclick="selectRamadanMeatType(${item.id}, 'لحم')">لحم</button>
                    </div>
                </div>
                
                <div class="quantity-selection">
                    <label for="ramadan-quantity-${item.id}">اختر الكمية:</label>
                    <select id="ramadan-quantity-${item.id}" onchange="updateRamadanItemQuantity(${item.id})">
                        <option value="">اختر الكمية</option>
                        ${item.quantityOptions.map(option => 
                            `<option value="${option.value}" data-price="${option.price}">${option.label} - ${option.price} دينار</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="food-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="decreaseRamadanQuantity(${item.id})" disabled>-</button>
                        <span class="quantity-display" id="ramadan-qty-${item.id}">0</span>
                        <button class="quantity-btn" onclick="increaseRamadanQuantity(${item.id})" disabled>+</button>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToRamadanCart(${item.id})" disabled>
                        أضف للسلة
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter Ramadan category
async function filterRamadanCategory(category) {
    currentRamadanFilter = category;
    
    document.querySelectorAll('#ramadanCategoryButtons .category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    await loadRamadanFoodItems();
}

// Select meat type for Ramadan order
async function selectRamadanMeatType(itemId, meatType) {
    const menuData = await getMenuData();
    const item = menuData.find(item => item.id === itemId);
    const meatButtons = document.querySelectorAll(`#ramadanFoodItems [data-id="${itemId}"] .meat-btn`);
    const quantitySelect = document.getElementById(`ramadan-quantity-${itemId}`);
    
    // Update active button
    meatButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === meatType) {
            btn.classList.add('active');
        }
    });
    
    // Update image
    const meatOption = item.meatOptions.find(option => option.type === meatType);
    const foodImage = document.querySelector(`#ramadanFoodItems [data-id="${itemId}"] .food-item-image`);
    foodImage.src = meatOption.image;
    
    // Update quantity options
    const options = meatType === 'دجاج' ? item.quantityOptions : item.meatQuantityOptions;
    const optionsHTML = options.map(option => 
        `<option value="${option.value}" data-price="${option.price}">${option.label} - ${option.price} دينار</option>`
    ).join('');
    
    quantitySelect.innerHTML = '<option value="">اختر الكمية</option>' + optionsHTML;
    quantitySelect.selectedIndex = 0;
    
    // Update item in cart if exists
    const cartItem = ramadanCart.find(item => item.id === itemId);
    if (cartItem) {
        cartItem.meatType = meatType;
        cartItem.selectedQuantity = '';
        cartItem.price = 0;
        cartItem.quantity = 0;
    }
    
    updateRamadanQuantityDisplay(itemId);
    updateRamadanCartDisplay();
    updateRamadanAddToCartButton(itemId);
}

// Update item quantity for Ramadan order
async function updateRamadanItemQuantity(itemId) {
    const select = document.getElementById(`ramadan-quantity-${itemId}`);
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const menuData = await getMenuData();
        const item = menuData.find(item => item.id === itemId);
        const selectedQuantity = selectedOption.value;
        const selectedPrice = parseFloat(selectedOption.dataset.price);
        const activeMeatBtn = document.querySelector(`#ramadanFoodItems [data-id="${itemId}"] .meat-btn.active`);
        const meatType = activeMeatBtn ? activeMeatBtn.dataset.type : 'دجاج';
        
        // Update or add to cart
        const cartItem = ramadanCart.find(item => item.id === itemId);
        if (cartItem) {
            cartItem.selectedQuantity = selectedQuantity;
            cartItem.price = selectedPrice;
            cartItem.meatType = meatType;
        } else {
            ramadanCart.push({
                ...item,
                selectedQuantity: selectedQuantity,
                price: selectedPrice,
                meatType: meatType,
                quantity: 1
            });
        }
        
        updateRamadanQuantityDisplay(itemId);
        updateRamadanCartDisplay();
        updateRamadanAddToCartButton(itemId);
    }
}

// Increase Ramadan quantity
function increaseRamadanQuantity(itemId) {
    const cartItem = ramadanCart.find(item => item.id === itemId);
    
    if (cartItem && cartItem.selectedQuantity) {
        cartItem.quantity++;
        updateRamadanQuantityDisplay(itemId);
        updateRamadanCartDisplay();
    }
}

// Decrease Ramadan quantity
function decreaseRamadanQuantity(itemId) {
    const cartItem = ramadanCart.find(item => item.id === itemId);
    
    if (cartItem && cartItem.selectedQuantity) {
        cartItem.quantity--;
        if (cartItem.quantity <= 0) {
            ramadanCart = ramadanCart.filter(item => item.id !== itemId);
            const select = document.getElementById(`ramadan-quantity-${itemId}`);
            select.selectedIndex = 0;
            const meatButtons = document.querySelectorAll(`#ramadanFoodItems [data-id="${itemId}"] .meat-btn`);
            meatButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.type === 'دجاج') {
                    btn.classList.add('active');
                }
            });
            selectRamadanMeatType(itemId, 'دجاج');
        }
    }
    
    updateRamadanQuantityDisplay(itemId);
    updateRamadanCartDisplay();
    updateRamadanAddToCartButton(itemId);
}

// Update Ramadan quantity display
function updateRamadanQuantityDisplay(itemId) {
    const cartItem = ramadanCart.find(item => item.id === itemId);
    const quantityDisplay = document.getElementById(`ramadan-qty-${itemId}`);
    if (!quantityDisplay) return;
    
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

// Update Ramadan add to cart button
function updateRamadanAddToCartButton(itemId) {
    const cartItem = ramadanCart.find(item => item.id === itemId);
    const addBtn = document.querySelector(`#ramadanFoodItems [data-id="${itemId}"] .add-to-cart-btn`);
    
    if (addBtn) {
        if (cartItem && cartItem.selectedQuantity) {
            addBtn.disabled = false;
            addBtn.textContent = 'أضف للسلة';
        } else {
            addBtn.disabled = true;
            addBtn.textContent = 'اختر الكمية أولاً';
        }
    }
}

// Add to Ramadan cart
function addToRamadanCart(itemId) {
    increaseRamadanQuantity(itemId);
}

// Update Ramadan cart display
function updateRamadanCartDisplay() {
    const cartItems = document.getElementById('ramadanCartItems');
    const cartCount = document.getElementById('ramadanCartCount');
    const totalPrice = document.getElementById('ramadanTotalPrice');
    
    // Update cart count
    const totalItems = ramadanCart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
    if (ramadanCart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">السلة فارغة</p>';
    } else {
        cartItems.innerHTML = ramadanCart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name} (${item.meatType})</div>
                    <div class="cart-item-details">${item.selectedQuantity} • ${item.quantity}x</div>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-item-price">${item.price * item.quantity} دينار</div>
                    <button class="remove-item-btn" onclick="removeFromRamadanCart(${item.id})" title="إزالة">×</button>
                </div>
            </div>
        `).join('');
    }
    
    // Update total price
    const total = ramadanCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPrice.textContent = `${total} دينار`;
}

// Remove from Ramadan cart
function removeFromRamadanCart(itemId) {
    ramadanCart = ramadanCart.filter(item => item.id !== itemId);
    const select = document.getElementById(`ramadan-quantity-${itemId}`);
    if (select) {
        select.selectedIndex = 0;
    }
    const meatButtons = document.querySelectorAll(`#ramadanFoodItems [data-id="${itemId}"] .meat-btn`);
    meatButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === 'دجاج') {
            btn.classList.add('active');
        }
    });
    selectRamadanMeatType(itemId, 'دجاج');
    updateRamadanQuantityDisplay(itemId);
    updateRamadanCartDisplay();
    updateRamadanAddToCartButton(itemId);
}

// Handle Ramadan customer form submission
document.addEventListener('DOMContentLoaded', function() {
    const ramadanForm = document.getElementById('ramadanCustomerForm');
    if (ramadanForm) {
        ramadanForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitRamadanOrder();
        });
    }
});

// Submit Ramadan order
async function submitRamadanOrder() {
    if (ramadanCart.length === 0) {
        alert('السلة فارغة! يرجى إضافة عناصر للطلب');
        return;
    }
    
    const customerName = document.getElementById('ramadanCustomerName').value;
    const phoneNumber = document.getElementById('ramadanPhoneNumber').value;
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    const otherDetails = document.getElementById('ramadanOtherDetails').value;
    
    if (!customerName || !phoneNumber) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    // Format phone number
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
        formattedPhone = phoneNumber.substring(1);
    }
    formattedPhone = '+962' + formattedPhone;
    
    // Get existing orders
    const orders = await getRamadanOrders();
    
    if (orders.some(o => normalizePhone(o.phoneNumber) === normalizePhone(formattedPhone))) {
        alert(' تحذير: رقم التلفون هذا موجود مسبقًا ضمن الطلبات. سيتم تمييز الطلبات المكررة باللون الأحمر في الجدول.');
    }
    
    // Determine scheduled date (active selector) and display date
    const schedDate = getActiveDateISO(); // 'YYYY-MM-DD'
    
    // Generate serial number based on orders for the same date
    const ordersForSameDate = orders.filter(o => o.scheduledDate === schedDate);
    const serialNumber = ordersForSameDate.length > 0 ? Math.max(...ordersForSameDate.map(o => o.serialNumber)) + 1 : 1;
    
    // Calculate total
    const totalAmount = ramadanCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Ask for delivery fee if delivery type
    let deliveryFee = null;
    if (deliveryType === 'توصيل') {
        const feeStr = prompt('أدخل مبلغ التوصيل (مثال: 1 أو 1.5 أو 2):', '');
        if (feeStr !== null && feeStr.trim() !== '') {
            const fee = parseFloat(feeStr.replace(',', '.'));
            if (!isNaN(fee)) deliveryFee = fee;
        }
    }
    const displayISO = schedDate ? `${schedDate}T00:00:00+03:00` : new Date().toISOString();
    // Create order object
    const newOrder = {
        id: Date.now(),
        serialNumber: serialNumber,
        customerName: customerName,
        phoneNumber: formattedPhone,
        deliveryType: deliveryType,
        otherDetails: otherDetails,
        scheduledDate: schedDate || null,
        items: ramadanCart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            selectedQuantity: item.selectedQuantity,
            meatType: item.meatType,
            price: item.price,
            total: item.price * item.quantity
        })),
        totalAmount: totalAmount,
        deliveryFee: deliveryFee,
        date: displayISO
    };
    
    // Save order
    orders.push(newOrder);
    await saveRamadanOrders(orders);
    
    // Save customer info to customers database
    await saveCustomerInfo(newOrder);
    
    // Clear cart and form
    ramadanCart = [];
    updateRamadanCartDisplay();
    document.getElementById('ramadanCustomerForm').reset();
    hideRamadanOrderForm();
    
    // Refresh orders table and stats
    await loadRamadanOrders();
    await updateRamadanStats();
    
    alert(`تم حفظ الطلب بنجاح!\nرقم الطلب: ${serialNumber}`);
}

// View order details
async function viewOrder(orderId) {
    const orders = await getRamadanOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('الطلب غير موجود');
        return;
    }
    
    const itemsList = order.items.map(item => 
        `• ${item.name} (${item.meatType}) - ${item.selectedQuantity} × ${item.quantity} = ${item.total} دينار`
    ).join('\n');
    
    let orderDetails = `
طلب رقم ${order.serialNumber}


اسم العميل: ${order.customerName}
رقم التلفون: ${order.phoneNumber}
توصيل/استلام: ${order.deliveryType}`;

    if (order.deliveryType === 'توصيل' && order.deliveryAddress) {
        orderDetails += `\nعنوان التوصيل: ${order.deliveryAddress}`;
    }
    
    orderDetails += `
تفاصيل أخرى: ${order.otherDetails || 'لا يوجد'}

تفاصيل الطلب:
${itemsList}

المجموع: ${order.totalAmount} دينار
التاريخ: ${formatOrderDate(order, true)}
    `;
    
    alert(orderDetails);
}

// Open delete order modal
function openDeleteOrderModal(orderId) {
    deleteOrderId = orderId;
    const modal = document.getElementById('deleteOrderModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close delete order modal
function closeDeleteOrderModal() {
    deleteOrderId = null;
    const modal = document.getElementById('deleteOrderModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Confirm delete order
async function confirmDeleteOrder() {
    if (!deleteOrderId) return;
    
    // Delete from database
    if (window.DB && window.DB.deleteRamadanOrder) {
        await window.DB.deleteRamadanOrder(deleteOrderId);
    } else {
        // Fallback: delete from localStorage
        let orders = await getRamadanOrders();
        orders = orders.filter(order => order.id !== deleteOrderId);
        await saveRamadanOrders(orders);
    }
    
    closeDeleteOrderModal();
    await loadRamadanOrders();
    await updateRamadanStats();
    
    alert('✅ تم حذف الطلب بنجاح');
}

// Export to Excel
async function exportRamadanOrders() {
    const all = await getRamadanOrders();
    const orders = filterOrdersByActiveDate(all);
    
    if (orders.length === 0) {
        alert('لا توجد طلبات لتصديرها');
        return;
    }
    
    // Separate orders by delivery type
    const deliveryOrders = orders.filter(order => order.deliveryType === 'توصيل');
    const pickupOrders = orders.filter(order => order.deliveryType === 'استلام');
    
    // Helper: build a vertical (column-per-order) AOA sheet
    const buildVerticalSheet = (orderList) => {
        // Fixed layout rows (top -> bottom). Keep each cell concise and RTL-friendly.
        const ROWS_COUNT = 9; // number of rows we will fill per order column
        const aoa = Array.from({ length: ROWS_COUNT }, () => []);
        
        orderList.forEach((order, colIdx) => {
            // Items joined by newlines for better wrapping
            const itemsList = (order.items || []).map(item => {
                if (item.meatType === '-') return `${item.name}`;
                return `${item.name} (${item.meatType}) - ${item.selectedQuantity} × ${item.quantity}`;
            }).join('\n');
            
            const lines = [
                `طلب رقم ${order.serialNumber}`,
                `الاسم: ${order.customerName || '-'}`,
                `الهاتف: ${formatLocalJordanPhone(order.phoneNumber) || '-'}`,
                `النوع: ${order.deliveryType || '-'}`,
                `العنوان: ${order.deliveryType === 'توصيل' ? (order.deliveryAddress || '-') : '-'}`,
                `تفاصيل: ${order.otherDetails || '-'}`,
                `الأصناف:\n${itemsList || '-'}`,
                `المجموع: ${order.totalAmount != null ? order.totalAmount + ' دينار' : '-'}`
            ];
            if (order.deliveryType === 'توصيل' && order.deliveryFee != null) {
                lines.push(`رسوم التوصيل: ${order.deliveryFee} دينار`);
                lines.push(`الإجمالي مع التوصيل: ${(Number(order.totalAmount||0)+Number(order.deliveryFee||0)).toFixed(2)} دينار`);
            }
            lines.push(`التاريخ: ${formatOrderDate(order, true)}`);
            
            for (let r = 0; r < ROWS_COUNT; r++) {
                aoa[r][colIdx] = lines[r] || '';
            }
        });
        
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        // Narrow columns to approximate 80mm thermal width (~72mm printable)
        const colWidth = 22; // characters; tweakable after previewing print
        ws['!cols'] = Array(orderList.length).fill({ wch: colWidth });
        // Make sheet RTL
        ws['!rtl'] = true;
        // Increase height for the items row to allow wrapping
        ws['!rows'] = Array(ROWS_COUNT).fill(null);
        // items row index (0-based) is 6
        ws['!rows'][6] = { hpt: 60 };
        return ws;
    };
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Delivery sheet (each order is a column)
    if (deliveryOrders.length > 0) {
        const wsDelivery = buildVerticalSheet(deliveryOrders);
        XLSX.utils.book_append_sheet(wb, wsDelivery, 'توصيل');
    }
    
    // Pickup sheet (each order is a column)
    if (pickupOrders.length > 0) {
        const wsPickup = buildVerticalSheet(pickupOrders);
        XLSX.utils.book_append_sheet(wb, wsPickup, 'استلام');
    }
    
    if (deliveryOrders.length === 0 && pickupOrders.length === 0) {
        alert('لا توجد طلبات لتصديرها');
        return;
    }
    
    // Generate filename with current date
    const date = new Date();
    const filename = `طلبات_رمضان_${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    
    // Summary
    let message = 'تم تصدير الطلبات إلى ملف Excel بنجاح!\n\n';
    if (deliveryOrders.length > 0) message += ` شيت التوصيل: ${deliveryOrders.length} طلب\n`;
    if (pickupOrders.length > 0) message += ` شيت الاستلام: ${pickupOrders.length} طلب\n`;
    alert(message);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const deleteModal = document.getElementById('deleteOrderModal');
    const editModal = document.getElementById('editOrderModal');
    
    if (event.target === deleteModal) {
        closeDeleteOrderModal();
    }
    if (event.target === editModal) {
        closeEditOrderModal();
    }
};

// ==================== SEARCH FUNCTIONALITY ====================

// Search orders
function searchRamadanOrders() {
    const searchTerm = document.getElementById('searchOrders').value.toLowerCase().trim();
    
    if (!searchTerm) {
        // Show all orders if search is empty
        loadRamadanOrders();
        return;
    }
    
    const filteredOrdersRaw = allOrders.filter(order => {
        const serialNumber = `طلب رقم ${order.serialNumber}`.toLowerCase();
        const customerName = order.customerName.toLowerCase();
        const phoneNumber = order.phoneNumber.toLowerCase();
        const orderDetails = formatOrderItems(order.items).toLowerCase();
        
        return serialNumber.includes(searchTerm) ||
               customerName.includes(searchTerm) ||
               phoneNumber.includes(searchTerm) ||
               orderDetails.includes(searchTerm) ||
               order.serialNumber.toString().includes(searchTerm);
    });
    const filteredOrders = filterOrdersByActiveDate(filteredOrdersRaw);
    loadRamadanOrders(filteredOrders);
}

// Clear search
function clearSearch() {
    document.getElementById('searchOrders').value = '';
    loadRamadanOrders();
}

// ==================== EDIT ORDER FUNCTIONALITY ====================

// Open edit order modal
async function openEditOrderModal(orderId) {
    const orders = await getRamadanOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('الطلب غير موجود');
        return;
    }
    
    editOrderId = orderId;
    
    // Fill form with order data
    document.getElementById('editOrderId').value = order.id;
    document.getElementById('editOrderSerial').value = order.serialNumber;
    document.getElementById('editCustomerName').value = order.customerName;
    document.getElementById('editPhoneNumber').value = order.phoneNumber.replace('+962', '');
    document.getElementById('editOrderDetails').value = formatOrderItems(order.items);
    document.getElementById('editOrderPrice').value = order.totalAmount;
    document.getElementById('editDeliveryType').value = order.deliveryType;
    document.getElementById('editDeliveryAddress').value = order.deliveryAddress || '';
    document.getElementById('editOtherDetails').value = order.otherDetails || '';
    
    // Toggle address field visibility
    toggleEditDeliveryAddress();
    
    // Show modal
    const modal = document.getElementById('editOrderModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close edit order modal
function closeEditOrderModal() {
    editOrderId = null;
    const modal = document.getElementById('editOrderModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset form
    document.getElementById('editOrderForm').reset();
}

// Handle edit order form submission
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('editOrderForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveOrderEdit();
        });
    }
});

// Save edited order
async function saveOrderEdit() {
    if (!editOrderId) return;
    
    let orders = await getRamadanOrders();
    const orderIndex = orders.findIndex(o => o.id === editOrderId);
    
    if (orderIndex === -1) {
        alert('الطلب غير موجود');
        return;
    }
    
    // Get new values
    const newSerial = parseInt(document.getElementById('editOrderSerial').value);
    const newName = document.getElementById('editCustomerName').value;
    const newPhone = document.getElementById('editPhoneNumber').value;
    const newOrderDetails = document.getElementById('editOrderDetails').value;
    const newPrice = parseFloat(document.getElementById('editOrderPrice').value);
    const newDeliveryType = document.getElementById('editDeliveryType').value;
    const newDeliveryAddress = document.getElementById('editDeliveryAddress').value;
    const newDetails = document.getElementById('editOtherDetails').value;
    
    // Validate delivery address if توصيل
    if (newDeliveryType === 'توصيل' && !newDeliveryAddress) {
        alert('يرجى إدخال عنوان التوصيل');
        document.getElementById('editDeliveryAddress').focus();
        return;
    }
    
    // Format phone
    let formattedPhone = newPhone.trim();
    if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('+962')) {
        formattedPhone = '+962' + formattedPhone;
    }
    
    
    if (orders.some((o, idx) => idx !== orderIndex && normalizePhone(o.phoneNumber) === normalizePhone(formattedPhone))) {
        alert(' تحذير: رقم التلفون هذا موجود مسبقًا ضمن الطلبات. سيتم تمييز الطلبات المكررة باللون الأحمر في الجدول.');
    }
    
    // Update order
    orders[orderIndex] = {
        ...orders[orderIndex],
        serialNumber: newSerial,
        customerName: newName,
        phoneNumber: formattedPhone,
        deliveryType: newDeliveryType,
        deliveryAddress: newDeliveryType === 'توصيل' ? newDeliveryAddress : '-',
        otherDetails: newDetails,
        totalAmount: newPrice,
        items: [{
            name: newOrderDetails,
            quantity: 1,
            selectedQuantity: newOrderDetails,
            meatType: '-',
            price: newPrice,
            total: newPrice
        }]
    };
    
    // Save
    await saveRamadanOrders(orders);
    
    // Close modal
    closeEditOrderModal();
    
    // Refresh display
    await loadRamadanOrders();
    await updateRamadanStats();
    
    alert(' تم تحديث الطلب بنجاح!');
}

// ==================== QUICK ENTRY MODE ====================

// Show quick entry form
function showQuickEntryForm() {
    const section = document.getElementById('quickEntrySection');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
    
    // Hide other forms
    document.getElementById('ramadanOrderFormSection').style.display = 'none';
    
    // Initialize delivery address field visibility
    toggleDeliveryAddress();
    
    // Focus first field
    setTimeout(() => {
        document.getElementById('quickCustomerName').focus();
    }, 300);
    
    // Reset session count
    quickEntrySessionCount = 0;
    updateQuickEntryCount();
}

// Hide quick entry form
function hideQuickEntry() {
    document.getElementById('quickEntrySection').style.display = 'none';
    document.getElementById('quickEntryForm').reset();
    quickEntrySessionCount = 0;
    updateQuickEntryCount();
}

// Update quick entry counter
function updateQuickEntryCount() {
    document.getElementById('quickEntryCount').textContent = quickEntrySessionCount;
}

// Handle quick entry form submission
document.addEventListener('DOMContentLoaded', function() {
    const quickForm = document.getElementById('quickEntryForm');
    if (quickForm) {
        quickForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitQuickEntry();
        });
        
        // Auto-advance on Enter
        const inputs = quickForm.querySelectorAll('input:not([type="number"]), select');
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && input.tagName !== 'BUTTON') {
                    e.preventDefault();
                    const nextInput = inputs[index + 1];
                    if (nextInput) {
                        nextInput.focus();
                    }
                }
            });
        });
    }
});

// Toggle delivery address field
function toggleDeliveryAddress() {
    const deliveryType = document.getElementById('quickDeliveryType').value;
    const addressGroup = document.getElementById('deliveryAddressGroup');
    const addressInput = document.getElementById('quickDeliveryAddress');
    const feeGroup = document.getElementById('deliveryFeeGroup');
    const feeInput = document.getElementById('quickDeliveryFee');
    
    if (deliveryType === 'توصيل') {
        addressGroup.style.display = 'block';
        addressInput.required = true;
        if (feeGroup) feeGroup.style.display = 'block';
    } else {
        addressGroup.style.display = 'none';
        addressInput.required = false;
        addressInput.value = '';
        if (feeGroup) feeGroup.style.display = 'none';
        if (feeInput) feeInput.value = '';
    }
}

// Toggle edit delivery address field
function toggleEditDeliveryAddress() {
    const deliveryType = document.getElementById('editDeliveryType').value;
    const addressGroup = document.getElementById('editDeliveryAddressGroup');
    const addressInput = document.getElementById('editDeliveryAddress');
    
    if (deliveryType === 'توصيل') {
        addressGroup.style.display = 'block';
    } else {
        addressGroup.style.display = 'none';
        addressInput.value = '';
    }
}

// Submit quick entry
async function submitQuickEntry() {
    const customerName = document.getElementById('quickCustomerName').value;
    const phoneNumber = document.getElementById('quickPhoneNumber').value;
    const order = document.getElementById('quickOrder').value;
    const price = parseFloat(document.getElementById('quickPrice').value);
    const deliveryType = document.getElementById('quickDeliveryType').value;
    const deliveryAddress = document.getElementById('quickDeliveryAddress').value;
    const details = document.getElementById('quickDetails').value;
    
    if (!customerName || !phoneNumber || !order || !price) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    // Validate delivery address if توصيل
    if (deliveryType === 'توصيل' && !deliveryAddress) {
        alert('يرجى إدخال عنوان التوصيل');
        document.getElementById('quickDeliveryAddress').focus();
        return;
    }
    
    // Format phone number
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('+962')) {
        formattedPhone = '+962' + formattedPhone;
    }
    
    // Get existing orders
    const orders = await getRamadanOrders();
    
    // Warn if duplicate phone exists
    if (orders.some(o => normalizePhone(o.phoneNumber) === normalizePhone(formattedPhone))) {
        alert(' تحذير: رقم التلفون هذا موجود مسبقًا ضمن الطلبات. سيتم تمييز الطلبات المكررة باللون الأحمر في الجدول.');
    }
    
    // Determine scheduled date (active selector) and display date ISO (+03:00)
    const schedDateQE = getActiveDateISO();
    
    // Generate serial number based on orders for the same date
    const ordersForSameDateQE = orders.filter(o => o.scheduledDate === schedDateQE);
    const serialNumber = ordersForSameDateQE.length > 0 ? Math.max(...ordersForSameDateQE.map(o => o.serialNumber)) + 1 : 1;
    const displayISOQE = schedDateQE ? `${schedDateQE}T00:00:00+03:00` : new Date().toISOString();

    // Get delivery fee from form field
    let deliveryFeeQE = null;
    if (deliveryType === 'توصيل') {
        const feeInput = document.getElementById('quickDeliveryFee');


        if (feeInput && feeInput.value) {
            const fee = parseFloat(feeInput.value);

            if (!isNaN(fee) && fee > 0) deliveryFeeQE = fee;
        }

    }

    // Create order object
    const newOrder = {
        id: Date.now(),
        serialNumber: serialNumber,
        customerName: customerName,
        phoneNumber: formattedPhone,
        deliveryType: deliveryType,
        deliveryAddress: deliveryType === 'توصيل' ? deliveryAddress : '-',
        otherDetails: details || '-',
        scheduledDate: schedDateQE || null,
        items: [{
            name: order,
            quantity: 1,
            selectedQuantity: order,
            meatType: '-',
            price: price,
            total: price
        }],
        totalAmount: price,
        deliveryFee: deliveryFeeQE,
        date: displayISOQE
    };

    // Save order
    orders.push(newOrder);
    await saveRamadanOrders(orders);
    
    // Save customer info to customers database
    await saveCustomerInfo(newOrder);
    
    // Update session count
    quickEntrySessionCount++;
    updateQuickEntryCount();
    
    // Refresh table and stats
    await loadRamadanOrders();
    await updateRamadanStats();
    
    // Clear form (except delivery type)
    document.getElementById('quickCustomerName').value = '';
    document.getElementById('quickPhoneNumber').value = '';
    document.getElementById('quickOrder').value = '';
    document.getElementById('quickPrice').value = '';
    document.getElementById('quickDeliveryAddress').value = '';
    const feeInput = document.getElementById('quickDeliveryFee');
    if (feeInput) feeInput.value = '';
    document.getElementById('quickDetails').value = '';
    
    // Focus first field again
    document.getElementById('quickCustomerName').focus();
    
    // Show brief success
    const submitBtn = document.querySelector('#quickEntryForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = ' تم الحفظ!';
    submitBtn.style.background = '#28a745';
    
    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.style.background = '';
    }, 1000);
}

// ==================== TELEGRAM SYNC ====================

// Upload orders to Telegram
async function syncToTelegram() {
    const orders = await getRamadanOrders();
    
    if (orders.length === 0) {
        alert('لا توجد طلبات للرفع');
        return;
    }
    
    // Show loading
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ جاري الرفع...';
    
    try {
        // Separate orders by delivery type
        const deliveryOrders = orders.filter(order => order.deliveryType === 'توصيل');
        const pickupOrders = orders.filter(order => order.deliveryType === 'استلام');
        
        // Function to format order data
        const formatOrderData = (order) => {
            // Format items - show as written (no repetition or x1)
            const itemsList = order.items.map(item => {
                // إذا كان طلب سريع، اعرض النص فقط
                if (item.meatType === '-') {
                    return item.name;
                }
                // إذا كان طلب عادي
                return `${item.name} (${item.meatType}) - ${item.selectedQuantity} × ${item.quantity}`;
            }).join(', ');
            
            return {
                'الرقم التسلسلي للطلب': `طلب رقم ${order.serialNumber}`,
                'اسم العميل': order.customerName,
                'الطلب': itemsList,
                'رقم التلفون': formatLocalJordanPhone(order.phoneNumber),
                'عنوان التوصيل': order.deliveryType === 'توصيل' ? (order.deliveryAddress || '-') : '-',
                'تفاصيل أخرى': order.otherDetails || '-',
                'المجموع': `${order.totalAmount} دينار`,
                ...(order.deliveryType === 'توصيل' && order.deliveryFee != null ? { 'رسوم التوصيل': `${order.deliveryFee} دينار` } : {}),
                ...(order.deliveryType === 'توصيل' && order.deliveryFee != null ? { 'الإجمالي مع التوصيل': `${(Number(order.totalAmount||0)+Number(order.deliveryFee||0)).toFixed(2)} دينار` } : {}),
                'التاريخ': formatOrderDate(order, true)
            };
        };
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Create delivery sheet
        if (deliveryOrders.length > 0) {
            const deliveryData = deliveryOrders.map(formatOrderData);
            const wsDelivery = XLSX.utils.json_to_sheet(deliveryData);
            
            wsDelivery['!cols'] = [
                { wch: 15 }, { wch: 20 }, { wch: 50 }, { wch: 15 },
                { wch: 30 }, { wch: 15 }, { wch: 20 }
            ];
            
            XLSX.utils.book_append_sheet(wb, wsDelivery, 'توصيل');
        }
        
        // Create pickup sheet
        if (pickupOrders.length > 0) {
            const pickupData = pickupOrders.map(formatOrderData);
            const wsPickup = XLSX.utils.json_to_sheet(pickupData);
            
            wsPickup['!cols'] = [
                { wch: 15 }, { wch: 20 }, { wch: 50 }, { wch: 15 },
                { wch: 30 }, { wch: 15 }, { wch: 20 }
            ];
            
            XLSX.utils.book_append_sheet(wb, wsPickup, 'استلام');
        }
        
        // Generate file
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        
        // Send to Telegram via Worker
        const date = new Date();
        const filename = `طلبات_رمضان_${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}_${date.getHours()}${date.getMinutes()}.xlsx`;
        
        // Create caption with summary
        let caption = ` طلبات رمضان\n`;
        caption += ` إجمالي الطلبات: ${orders.length}\n`;
        if (deliveryOrders.length > 0) {
            caption += ` طلبات التوصيل: ${deliveryOrders.length} (${deliveryOrders.reduce((s, o) => s + o.totalAmount, 0)} دينار)\n`;
        }
        if (pickupOrders.length > 0) {
            caption += ` طلبات الاستلام: ${pickupOrders.length} (${pickupOrders.reduce((s, o) => s + o.totalAmount, 0)} دينار)\n`;
        }
        caption += ` المجموع الكلي: ${orders.reduce((sum, o) => sum + o.totalAmount, 0)} دينار\n`;
        caption += ` ${new Date().toLocaleString('ar-JO')}`;
        
        const response = await fetch(TELEGRAM_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'upload',
                filename: filename,
                filedata: wbout,
                caption: caption
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(' تم رفع الطلبات إلى التليجرام بنجاح!');
        } else {
            throw new Error(result.error || 'فشل الرفع');
        }
        
    } catch (error) {

        alert('❌ حدث خطأ في رفع الطلبات: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Download orders from Telegram
async function syncFromTelegram(replaceAll = false) {
    // Show loading
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ جاري التحميل...';
    
    try {
        // Get latest file from Telegram
        const response = await fetch(TELEGRAM_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'download'
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'فشل التحميل');
        }
        
        // Parse Excel file - check both sheets
        const workbook = XLSX.read(result.filedata, { type: 'base64' });
        let allData = [];
        
        // Read from both sheets if they exist
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(worksheet);
            allData = [...allData, ...sheetData];
        }
        
        if (allData.length === 0) {
            alert(' الملف فارغ أو لا يحتوي على بيانات');
            return;
        }
        
        const currentOrders = await getRamadanOrders();
        const activeDate = getActiveDateISO(); // Get the currently selected date
        let maxSerialNumber = currentOrders.length > 0 ? Math.max(...currentOrders.map(o => o.serialNumber)) : 0;
        
        let finalOrders;
        let message;
        
        if (replaceAll) {
            // Replace all orders with new ones from Telegram
            const newOrders = allData.map((row, index) => {
                const serialMatch = row['الرقم التسلسلي للطلب'] ? row['الرقم التسلسلي للطلب'].match(/\d+/) : null;
                const serialNumber = serialMatch ? parseInt(serialMatch[0]) : index + 1;
                
                const priceMatch = row['المجموع'] ? row['المجموع'].match(/[\d.]+/) : null;
                const totalAmount = priceMatch ? parseFloat(priceMatch[0]) : 0;
                
                let deliveryType = 'توصيل';
                if (row['توصيل او استلام']) {
                    deliveryType = row['توصيل او استلام'];
                }
                
                return {
                    id: Date.now() + index,
                    serialNumber: serialNumber,
                    customerName: row['اسم العميل'] || 'غير معروف',
                    phoneNumber: row['رقم التلفون'] || '-',
                    deliveryType: deliveryType,
                    deliveryAddress: row['عنوان التوصيل'] || '-',
                    otherDetails: row['تفاصيل أخرى'] || '-',
                    items: [{
                        name: row['الطلب'] || '-',
                        quantity: 1,
                        selectedQuantity: row['الطلب'] || '-',
                        meatType: '-',
                        price: totalAmount,
                        total: totalAmount
                    }],
                    totalAmount: totalAmount,
                    date: new Date().toISOString(),
                    scheduledDate: activeDate // Use the active date selector
                };
            });
            
            finalOrders = newOrders.sort((a, b) => a.serialNumber - b.serialNumber);
            message = ` تم استبدال جميع الطلبات!\n تم تحميل ${newOrders.length} طلب من التليجرام`;
        } else {
            // Merge - only add NEW orders (skip duplicates based on phone number)
            const existingPhones = new Set(currentOrders.map(o => normalizePhone(o.phoneNumber)));
            // Get max serial for the active date only
            const ordersForActiveDate = currentOrders.filter(o => o.scheduledDate === activeDate);
            let serialCounter = ordersForActiveDate.length > 0 ? Math.max(...ordersForActiveDate.map(o => o.serialNumber)) : 0;
            let skippedCount = 0;
            
            const newOrders = allData.map((row, index) => {
                const phoneNumber = row['رقم التلفون'] || '-';
                const normalizedPhone = normalizePhone(phoneNumber);
                
                // Skip if phone number already exists
                if (existingPhones.has(normalizedPhone)) {
                    skippedCount++;
                    return null;
                }
                
                // Give new serial number based on active date
                serialCounter++;
                const newSerialNumber = serialCounter;
                
                const priceMatch = row['المجموع'] ? row['المجموع'].match(/[\d.]+/) : null;
                const totalAmount = priceMatch ? parseFloat(priceMatch[0]) : 0;
                
                let deliveryType = 'توصيل';
                if (row['توصيل او استلام']) {
                    deliveryType = row['توصيل او استلام'];
                }
                
                // Add to existing phones set
                existingPhones.add(normalizedPhone);
                
                return {
                    id: Date.now() + index,
                    serialNumber: newSerialNumber,
                    customerName: row['اسم العميل'] || 'غير معروف',
                    phoneNumber: phoneNumber,
                    deliveryType: deliveryType,
                    deliveryAddress: row['عنوان التوصيل'] || '-',
                    otherDetails: row['تفاصيل أخرى'] || '-',
                    items: [{
                        name: row['الطلب'] || '-',
                        quantity: 1,
                        selectedQuantity: row['الطلب'] || '-',
                        meatType: '-',
                        price: totalAmount,
                        total: totalAmount
                    }],
                    totalAmount: totalAmount,
                    date: new Date().toISOString(),
                    scheduledDate: activeDate // Use the active date selector
                };
            }).filter(order => order !== null); // Remove skipped (null) orders
            
            // Add only new orders to existing ones
            finalOrders = [...currentOrders, ...newOrders].sort((a, b) => a.serialNumber - b.serialNumber);
            
            // Build message with stats
            message = ` تم دمج الطلبات!\n تم إضافة ${newOrders.length} طلب جديد`;
            if (skippedCount > 0) {
                message += `\n تم تجاهل ${skippedCount} طلب مكرر (رقم تلفون موجود مسبقاً)`;
            }
        }
        
        // Save
        await saveRamadanOrders(finalOrders);
        
        // Refresh display
        await loadRamadanOrders();
        await updateRamadanStats();
        
        alert(message);
        
    } catch (error) {

        alert('❌ حدث خطأ في تحميل الطلبات: ' + error.message + '\n\nتأكد من تكوين Worker بشكل صحيح');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// ========== DRIVER ASSIGNMENT FUNCTIONS ==========

let currentAssignOrderId = null;

async function openAssignDriverModal(orderId) {
    currentAssignOrderId = orderId;
    
    // Get order details
    const orders = await getRamadanOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('الطلب غير موجود');
        return;
    }
    
    // Load drivers
    const drivers = await window.DB.getDrivers();
    const select = document.getElementById('assignDriverSelect');
    
    select.innerHTML = '<option value="">-- اختر سائق --</option>' + 
        drivers.filter(d => d.status === 'active').map(driver => 
            `<option value="${driver.id}">${driver.name}</option>`
        ).join('');
    
    // Fill form with existing data
    document.getElementById('assignOrderId').value = orderId;
    if (order.driver_id || order.driverId) {
        select.value = order.driver_id || order.driverId;
    }
    
    // المبلغ النقدي = سعر الطلب تلقائياً
    const cashAmount = order.cash_amount || order.cashAmount || order.totalAmount || 0;
    document.getElementById('assignCashAmount').value = cashAmount;
    
    // Show modal
    const modal = document.getElementById('assignDriverModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeAssignDriverModal() {
    currentAssignOrderId = null;
    const modal = document.getElementById('assignDriverModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    const assignDriverForm = document.getElementById('assignDriverForm');
    if (assignDriverForm) {
        assignDriverForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveDriverAssignment();
        });
    }
});

async function saveDriverAssignment() {
    const orderId = parseInt(document.getElementById('assignOrderId').value);
    const driverId = parseInt(document.getElementById('assignDriverSelect').value);
    const cashAmount = parseFloat(document.getElementById('assignCashAmount').value) || 0;
    
    if (!driverId) {
        alert('يرجى اختيار سائق');
        return;
    }
    
    try {
        // Get driver name
        const drivers = await window.DB.getDrivers();
        const driver = drivers.find(d => d.id === driverId);
        
        if (!driver) {
            alert('السائق غير موجود');
            return;
        }
        
        // Update order
        const orders = await getRamadanOrders();
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            alert('الطلب غير موجود');
            return;
        }
        
        orders[orderIndex].driver_id = driverId;
        orders[orderIndex].driverId = driverId;
        orders[orderIndex].driver_name = driver.name;
        orders[orderIndex].driverName = driver.name;
        orders[orderIndex].cash_amount = cashAmount;
        orders[orderIndex].cashAmount = cashAmount;
        orders[orderIndex].delivery_status = 'assigned';
        orders[orderIndex].deliveryStatus = 'assigned';
        
        // Save to database
        await saveRamadanOrders(orders);
        
        // Reload table
        await loadRamadanOrders();
        
        closeAssignDriverModal();
        alert('✅ تم تعيين السائق بنجاح!');
        
    } catch (error) {

        alert('❌ حدث خطأ في تعيين السائق');
    }
}

// Close modal on outside click
window.addEventListener('click', function(event) {
    const assignModal = document.getElementById('assignDriverModal');
    if (event.target === assignModal) {
        closeAssignDriverModal();
    }
});

// ========== SAVE CUSTOMER INFO ==========

async function saveCustomerInfo(order) {
    try {
        if (!order.customerName || !order.phoneNumber) {

            return;
        }
        
        // Get existing customers
        const customers = await window.DB.getCustomers();
        
        // Normalize phone number for comparison
        const normalizedPhone = normalizePhone(order.phoneNumber);
        
        // Find existing customer by phone number
        const existingCustomer = customers.find(c => 
            normalizePhone(c.phone_number || c.phoneNumber) === normalizedPhone
        );
        
        const deliveryAddress = order.deliveryType === 'توصيل' ? (order.deliveryAddress || '') : '';
        
        if (existingCustomer) {
            // Update existing customer - keep the original phone format from database
            const updatedCustomer = {
                id: existingCustomer.id,
                customer_name: order.customerName,
                phone_number: existingCustomer.phone_number || existingCustomer.phoneNumber, // Keep original format
                delivery_address: deliveryAddress || existingCustomer.delivery_address || existingCustomer.deliveryAddress,
                order_count: (existingCustomer.order_count || existingCustomer.orderCount || 0) + 1,
                total_spent: parseFloat(existingCustomer.total_spent || existingCustomer.totalSpent || 0) + parseFloat(order.totalAmount || 0),
                last_order_date: new Date().toISOString(),
                first_order_date: existingCustomer.first_order_date || existingCustomer.firstOrderDate || new Date().toISOString()
            };
            
            await window.DB.saveCustomer(updatedCustomer);

        } else {
            // Create new customer - normalize phone to 07... format (without +962)
            let phoneToSave = order.phoneNumber;
            if (phoneToSave.startsWith('+962')) {
                phoneToSave = '0' + phoneToSave.substring(4); // Convert +962785831844 to 0785831844
            }
            
            const newCustomer = {
                customer_name: order.customerName,
                phone_number: phoneToSave,
                delivery_address: deliveryAddress,
                order_count: 1,
                total_spent: parseFloat(order.totalAmount || 0),
                last_order_date: new Date().toISOString(),
                first_order_date: new Date().toISOString()
            };
            
            await window.DB.saveCustomer(newCustomer);

        }
    } catch (error) {

        // Don't throw error - customer save failure shouldn't block order
    }
}

// ========== DELETE ALL ORDERS ==========

async function confirmDeleteAllOrders() {
    const iso = getActiveDateISO();
    const confirmed = confirm(` تحذير!\n\nسيتم حذف طلبات اليوم المحدد فقط (${iso}).\n\nهل أنت متأكد؟`);
    if (!confirmed) return;

    const doubleConfirm = confirm(' تأكيد نهائي!\n\nاضغط OK للمتابعة أو Cancel للإلغاء');
    if (!doubleConfirm) return;

    try {
        const all = await getRamadanOrders();
        const toDelete = all.filter(o => {
            if (o.scheduledDate) return o.scheduledDate === iso;
            const d = o.date ? toISODate(new Date(o.date)) : null;
            return d === iso;
        });
        const keep = all.filter(o => !toDelete.includes(o));

        // If DB supports deleting by IDs, use it; otherwise overwrite dataset
        const ids = toDelete.map(o => o.id);
        if (window.DB && typeof window.DB.deleteRamadanOrdersByIds === 'function') {
            await window.DB.deleteRamadanOrdersByIds(ids);
        } else {
            await saveRamadanOrders(keep);
        }

        await loadRamadanOrders();
        await updateRamadanStats();
        alert('✅ تم حذف طلبات اليوم المحدد بنجاح');
    } catch (error) {

        alert('❌ حدث خطأ في حذف طلبات هذا اليوم');
    }
}

// ========== POS THERMAL PRINT (80mm) ==========
async function printRamadanOrderPOS(orderId) {
    try {
        const orders = await getRamadanOrders();
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            alert('الطلب غير موجود');
            return;
        }
        const itemsHtml = (order.items || []).map(item => {
            if (item.meatType === '-') return `<div class="pos-item"><span>${item.name}</span></div>`;
            return `<div class="pos-item"><span>${item.name} (${item.meatType})</span><span>${item.selectedQuantity} × ${item.quantity}</span></div>`;
        }).join('');

        const receiptHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>POS</title>
  <style>
    @page { size: 80mm auto; margin: 2mm 2mm; }
    body { font-family: 'IBM Plex Sans Arabic', Arial, sans-serif; direction: rtl; }
    .pos-wrap { width: 72mm; margin: 0 auto; }
    .pos-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
    .pos-header h1 { font-size: 16px; margin: 0; }
    .pos-meta { font-size: 12px; line-height: 1.5; }
    .pos-section { border-bottom: 1px dashed #000; padding: 6px 0; }
    .pos-item { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
    .pos-total { font-weight: 700; font-size: 14px; display: flex; justify-content: space-between; }
    .pos-footer { text-align: center; font-size: 11px; padding-top: 6px; }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
  </head>
<body>
  <div class="pos-wrap">
    <div class="pos-header">
      <h1>مطعم ومطبخ الشيخ</h1>
      <div class="pos-meta">طلب رقم ${order.serialNumber}</div>
    </div>
    <div class="pos-section">
      <div class="pos-meta">الاسم: ${order.customerName || '-'}</div>
      <div class="pos-meta">الهاتف: ${formatLocalJordanPhone(order.phoneNumber) || '-'}</div>
      <div class="pos-meta">النوع: ${order.deliveryType || '-'}</div>
      ${order.deliveryType === 'توصيل' ? `<div class="pos-meta">العنوان: ${order.deliveryAddress || '-'}</div>` : ''}
      ${order.otherDetails ? `<div class="pos-meta">تفاصيل: ${order.otherDetails}</div>` : ''}
    </div>
    <div class="pos-section">
      <div class="pos-meta" style="margin-bottom:4px;">الطلب</div>
      ${itemsHtml || '<div class="pos-meta">-</div>'}
    </div>
    <div class="pos-section">
      <div class="pos-total"><span>السعر</span><span>${order.totalAmount || 0} دينار</span></div>
      ${order.deliveryType === 'توصيل' && order.deliveryFee != null ? `<div class="pos-total" style="font-size:12px; margin-top:4px;"><span>رسوم التوصيل</span><span>${order.deliveryFee} دينار</span></div>` : ''}
      ${order.deliveryType === 'توصيل' && order.deliveryFee != null ? `<div class="pos-total" style="margin-top:4px; border-top:1px dashed #000; padding-top:4px;"><span>الإجمالي</span><span>${(Number(order.totalAmount||0) + Number(order.deliveryFee||0)).toFixed(2)} دينار</span></div>` : ''}
    </div>
    <div class="pos-footer">${formatOrderDate(order, true)}</div>
  </div>
  <script>window.onload = () => { setTimeout(() => { window.print(); }, 200); };<\/script>
</body>
</html>`;

        const printWin = window.open('', '_blank');
        if (!printWin) { alert('يرجى السماح بالنوافذ المنبثقة للطباعة'); return; }
        printWin.document.open();
        printWin.document.write(receiptHtml);
        printWin.document.close();
    } catch (e) {

        alert('تعذر طباعة الإيصال');
    }
}

