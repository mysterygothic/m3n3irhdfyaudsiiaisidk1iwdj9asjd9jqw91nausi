// Driver Orders Management - طلبات السائقين والمبالغ النقدية

let activeDriverDate = null; // ISO date string 'YYYY-MM-DD'

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    if (document.getElementById('driversOrdersList')) {
        initDriverDateSelectors();
        await loadDriverOrders();
    }
});

// ========== DATE SELECTORS ==========

function initDriverDateSelectors() {
    const daySel = document.getElementById('driverDaySelect');
    const monthSel = document.getElementById('driverMonthSelect');
    const yearSel = document.getElementById('driverYearSelect');
    const saved = localStorage.getItem('ACTIVE_DRIVER_DATE'); // YYYY-MM-DD
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
    setActiveDriverDateLabel();
    activeDriverDate = toISODate(initDate);
    localStorage.setItem('ACTIVE_DRIVER_DATE', activeDriverDate);
}

function updateDriverOrdersDate() {
    const daySel = document.getElementById('driverDaySelect');
    const monthSel = document.getElementById('driverMonthSelect');
    const yearSel = document.getElementById('driverYearSelect');
    if (!daySel || !monthSel || !yearSel) return;
    
    // adjust day list when month/year changes
    const mdays = daysInMonth(parseInt(monthSel.value,10), parseInt(yearSel.value,10));
    const prevDay = parseInt(daySel.value,10) || 1;
    const dayVal = Math.min(prevDay, mdays);
    daySel.innerHTML = Array.from({length:mdays}, (_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');
    daySel.value = dayVal;
    
    const d = new Date(parseInt(yearSel.value,10), parseInt(monthSel.value,10)-1, parseInt(daySel.value,10));
    activeDriverDate = toISODate(d);
    localStorage.setItem('ACTIVE_DRIVER_DATE', activeDriverDate);
    setActiveDriverDateLabel();
    loadDriverOrders();
}

function getActiveDriverDateISO() {
    if (activeDriverDate) return activeDriverDate;
    const saved = localStorage.getItem('ACTIVE_DRIVER_DATE');
    return saved || toISODate(new Date());
}

function filterOrdersByDriverDate(list) {
    const iso = getActiveDriverDateISO();
    return (list || []).filter(o => {
        const sched = o.scheduledDate;
        if (sched) return sched === iso;
        // fallback: compare by order.date as Jordan local yyyy-mm-dd
        if (!o.date) return false;
        const parts = new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit', timeZone:'Asia/Amman' }).format(new Date(o.date));
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

function setActiveDriverDateLabel() {
    const label = document.getElementById('activeDriverDateLabel');
    if (!label) return;
    const iso = getActiveDriverDateISO();
    const d = new Date(`${iso}T00:00:00`);
    label.textContent = d.toLocaleDateString('ar-JO', { year:'numeric', month:'2-digit', day:'2-digit' });
}

// ========== LOAD DRIVER ORDERS ==========

async function loadDriverOrders() {
    try {
        // Get all drivers
        const drivers = await window.DB.getDrivers();

        // Get all Ramadan orders
        const allOrders = await window.DB.getRamadanOrders();

        // Filter orders by selected date first
        const ordersForDate = filterOrdersByDriverDate(allOrders);

        // Filter orders that have a driver assigned AND are delivery type
        const ordersWithDrivers = ordersForDate.filter(order => {
            const hasDriver = (order.driver_id || order.driverId);
            const isDelivery = (order.deliveryType === 'توصيل' || order.delivery_type === 'توصيل');

            return hasDriver && isDelivery;
        });

        // Group orders by driver
        const driverOrdersMap = {};
        let grandTotal = 0; // existing cash total
        let grandDeliveryFees = 0; // total of delivery fees across drivers
        
        ordersWithDrivers.forEach(order => {
            const driverId = order.driver_id || order.driverId;
            if (!driverOrdersMap[driverId]) {
                driverOrdersMap[driverId] = [];
            }
            driverOrdersMap[driverId].push(order);
            const cashAmount = parseFloat(order.cash_amount || order.cashAmount || order.totalAmount || 0);
            grandTotal += cashAmount;
            const fee = parseFloat(order.deliveryFee || order.delivery_fee || 0);
            if (!isNaN(fee)) grandDeliveryFees += fee;

        });


        // Render
        renderDriverOrders(drivers, driverOrdersMap, grandTotal, grandDeliveryFees);
        
    } catch (error) {

        document.getElementById('driversOrdersList').innerHTML = 
            '<p class="no-orders">حدث خطأ في تحميل البيانات</p>';
    }
}

function renderDriverOrders(drivers, driverOrdersMap, grandTotal, grandDeliveryFees) {
    const container = document.getElementById('driversOrdersList');
    const grandTotalEl = document.getElementById('grandTotal');
    
    // Update grand total
    grandTotalEl.textContent = `${grandTotal.toFixed(2)} دينار`;
    
    // Filter drivers that have orders
    const driversWithOrders = drivers.filter(driver => driverOrdersMap[driver.id]);
    
    if (driversWithOrders.length === 0) {
        container.innerHTML = '<p class="no-orders">لا توجد طلبات مُعيّنة لأي سائق</p>';
        return;
    }
    
    // Render totals header for delivery fees
    const deliveryFeesCard = `
        <div class="driver-section" style="border: 1px dashed #e0e0e0; background: #fafbff;">
            <div class="driver-header" style="border-bottom-color:#eee;">
                <div class="driver-info">
                    <h3> إجمالي رسوم التوصيل (كل السائقين)</h3>
                    <p>مجموع ما حصل عليه السائقون من رسوم التوصيل</p>
                </div>
                <div class="driver-summary">
                    <p class="total-amount" style="color:#2c3e50;">${grandDeliveryFees.toFixed(2)} دينار</p>
                </div>
            </div>
        </div>`;
    
    // Render each driver's section
    container.innerHTML = deliveryFeesCard + driversWithOrders.map(driver => {
        const orders = driverOrdersMap[driver.id] || [];
        const driverTotal = orders.reduce((sum, order) => sum + parseFloat(order.cash_amount || order.cashAmount || order.totalAmount || 0), 0);
        const driverDeliveryFees = orders.reduce((sum, order) => sum + parseFloat(order.deliveryFee || order.delivery_fee || 0), 0);
        
        return `
            <div class="driver-section">
                <div class="driver-header">
                    <div class="driver-info">
                        <h3> ${driver.name}</h3>
                        <p>${driver.phone_number || driver.phoneNumber || 'لا يوجد رقم'} | ${driver.vehicle_type || driver.vehicleType || 'سيارة'} - ${driver.vehicle_plate || driver.vehiclePlate || '-'}</p>
                    </div>
                    <div class="driver-summary">
                        <p class="total-amount">${driverTotal.toFixed(2)} دينار</p>
                        <p class="orders-count">${orders.length} طلب</p>
                        <p class="orders-count" style="margin-top:6px; color:#2c3e50; font-weight:600;">رسوم التوصيل: ${driverDeliveryFees.toFixed(2)} د</p>
                    </div>
                </div>
                
                <table class="driver-orders-table">
                    <thead>
                        <tr>
                            <th>رقم الطلب</th>
                            <th>اسم العميل</th>
                            <th>رقم التلفون</th>
                            <th>عنوان التوصيل</th>
                            <th>الأصناف</th>
                            <th>رسوم التوصيل</th>
                            <th>المبلغ المطلوب</th>
                            <th>الحالة</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td><strong>طلب رقم ${order.serialNumber}</strong></td>
                                <td>${order.customerName}</td>
                                <td>${order.phoneNumber}</td>
                                <td>${order.deliveryAddress || '-'}</td>
                                <td>${formatOrderItems(order.items)}</td>
                                <td>${(order.deliveryFee || order.delivery_fee || 0).toFixed ? (order.deliveryFee || order.delivery_fee || 0).toFixed(2) : Number(order.deliveryFee || order.delivery_fee || 0).toFixed(2)} د</td>
                                <td><strong style="color: #27ae60;">${(order.cash_amount || order.cashAmount || order.totalAmount || 0).toFixed(2)} دينار</strong></td>
                                <td><span class="status-badge status-${order.delivery_status || order.deliveryStatus || 'assigned'}">${getStatusText(order.delivery_status || order.deliveryStatus)}</span></td>
                                <td>${order.delivery_notes || order.deliveryNotes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');
}

// Format order items
function formatOrderItems(items) {
    if (!items || items.length === 0) return '-';
    
    return items.map(item => {
        if (item.meatType === '-') {
            return item.name;
        }
        return `${item.name} (${item.meatType})`;
    }).join(', ');
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'assigned': return 'مُعيّن';
        case 'in_progress': return 'قيد التوصيل';
        case 'delivered': return 'تم التوصيل';
        case 'pending': return 'قيد الانتظار';
        default: return 'مُعيّن';
    }
}

// ========== EXPORT TO EXCEL ==========

async function exportDriversReport() {
    try {
        // Get all data
        const drivers = await window.DB.getDrivers();
        const allOrders = await window.DB.getRamadanOrders();
        
        // Filter orders by selected date first
        const ordersForDate = filterOrdersByDriverDate(allOrders);
        
        // Filter orders with drivers
        const ordersWithDrivers = ordersForDate.filter(order => 
            (order.driver_id || order.driverId) && 
            (order.deliveryType === 'توصيل')
        );
        
        // Group by driver
        const driverOrdersMap = {};
        ordersWithDrivers.forEach(order => {
            const driverId = order.driver_id || order.driverId;
            if (!driverOrdersMap[driverId]) {
                driverOrdersMap[driverId] = [];
            }
            driverOrdersMap[driverId].push(order);
        });
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Get selected date for report title
        const selectedDateISO = getActiveDriverDateISO();
        const selectedDate = new Date(`${selectedDateISO}T00:00:00`);
        const dateStr = selectedDate.toLocaleDateString('ar-JO', { year:'numeric', month:'2-digit', day:'2-digit' });
        
        // Sheet 1: Summary by Driver
        const summaryData = [
            ['تقرير طلبات السائقين والمبالغ النقدية ورسوم التوصيل'],
            ['مطعم ومطبخ الشيخ'],
            ['التاريخ المحدد: ' + dateStr],
            ['تاريخ التصدير: ' + new Date().toLocaleDateString('ar-JO')],
            [],
            ['اسم السائق', 'رقم التلفون', 'عدد الطلبات', 'إجمالي المبالغ (دينار)', 'إجمالي رسوم التوصيل (دينار)']
        ];
        
        let grandTotal = 0;
        let grandDeliveryFees = 0;
        drivers.forEach(driver => {
            const orders = driverOrdersMap[driver.id] || [];
            if (orders.length > 0) {
                const driverTotal = orders.reduce((sum, order) => 
                    sum + parseFloat(order.cash_amount || order.cashAmount || order.totalAmount || 0), 0
                );
                const driverDeliveryFees = orders.reduce((sum, order) => sum + parseFloat(order.deliveryFee || order.delivery_fee || 0), 0);
                grandTotal += driverTotal;
                grandDeliveryFees += driverDeliveryFees;
                
                summaryData.push([
                    driver.name,
                    driver.phone_number || driver.phoneNumber || '-',
                    orders.length,
                    driverTotal.toFixed(2),
                    driverDeliveryFees.toFixed(2)
                ]);
            }
        });
        
        summaryData.push([]);
        summaryData.push(['إجمالي المبالغ النقدية:', '', '', grandTotal.toFixed(2) + ' دينار', '']);
        summaryData.push(['إجمالي رسوم التوصيل:', '', '', '', grandDeliveryFees.toFixed(2) + ' دينار']);
        
        const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws1, 'ملخص السائقين');
        
        // Sheet 2: Detailed Orders
        const detailedData = [
            ['السائق', 'رقم الطلب', 'اسم العميل', 'رقم التلفون', 'عنوان التوصيل', 'الأصناف', 'رسوم التوصيل (دينار)', 'المبلغ (دينار)', 'الحالة', 'ملاحظات', 'التاريخ']
        ];
        
        drivers.forEach(driver => {
            const orders = driverOrdersMap[driver.id] || [];
            orders.forEach(order => {
                detailedData.push([
                    driver.name,
                    'طلب رقم ' + order.serialNumber,
                    order.customerName,
                    order.phoneNumber,
                    order.deliveryAddress || '-',
                    formatOrderItems(order.items),
                    (parseFloat(order.deliveryFee || order.delivery_fee || 0) || 0).toFixed(2),
                    (order.cash_amount || order.cashAmount || order.totalAmount || 0).toFixed(2),
                    getStatusText(order.delivery_status || order.deliveryStatus),
                    order.delivery_notes || order.deliveryNotes || '-',
                    new Date(order.date).toLocaleDateString('ar-JO')
                ]);
            });
        });
        
        const ws2 = XLSX.utils.aoa_to_sheet(detailedData);
        XLSX.utils.book_append_sheet(wb, ws2, 'تفاصيل الطلبات');
        
        // Download
        const fileName = `تقرير_السائقين_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        alert('✅ تم تصدير التقرير بنجاح!');
        
    } catch (error) {

        alert('❌ حدث خطأ في التصدير');
    }
}
