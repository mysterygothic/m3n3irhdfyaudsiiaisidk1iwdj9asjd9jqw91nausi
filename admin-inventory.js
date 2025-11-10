// ========================================
// DAILY INVENTORY MANAGEMENT SYSTEM
// ========================================

let currentInventoryData = {
    date: new Date().toISOString().split('T')[0],
    sales: [],
    purchases: [],
    damage: [],
    notes: ''
};

let charts = {
    salesPurchases: null,
    profit: null,
    distribution: null
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

async function initializePage() {
    // Set today's date
    const dateInput = document.getElementById('inventoryDate');
    dateInput.value = currentInventoryData.date;
    
    // Load data for today
    await loadInventoryData(currentInventoryData.date);
    
    // Initialize charts
    initializeCharts();
    
    // Load history
    await loadInventoryHistory();
    
    // Calculate average sales
    await calculateAverageSales();
    
    // Date change listener
    dateInput.addEventListener('change', async function() {
        currentInventoryData.date = this.value;
        await loadInventoryData(this.value);
    });
    
    console.log('✅ Inventory page initialized');
}

// ========================================
// DATA LOADING
// ========================================

async function loadInventoryData(date) {
    try {
        if (!window.DB || !window.DB.supabase) {
            console.warn('Database not available, using local data');
            return;
        }
        
        const { data, error } = await window.DB.supabase
            .from('daily_inventory')
            .select('*')
            .eq('inventory_date', date)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error loading inventory:', error);
            return;
        }
        
        if (data) {
            // Populate form with existing data
            populateFormWithData(data);
        } else {
            // Clear form for new entry
            clearForm();
        }
        
    } catch (error) {
        console.error('Error loading inventory data:', error);
    }
}

function populateFormWithData(data) {
    // Clear existing rows
    document.getElementById('salesTableBody').innerHTML = '';
    document.getElementById('purchasesTableBody').innerHTML = '';
    document.getElementById('damageTableBody').innerHTML = '';
    
    // Populate sales
    if (data.sales_items && data.sales_items.length > 0) {
        data.sales_items.forEach(item => {
            addSalesRow(item);
        });
    } else {
        addSalesRow();
    }
    
    // Populate purchases
    if (data.purchase_items && data.purchase_items.length > 0) {
        data.purchase_items.forEach(item => {
            addPurchasesRow(item);
        });
    } else {
        addPurchasesRow();
    }
    
    // Populate damage
    if (data.damage_items && data.damage_items.length > 0) {
        data.damage_items.forEach(item => {
            addDamageRow(item);
        });
    } else {
        addDamageRow();
    }
    
    // Populate notes
    document.getElementById('inventoryNotes').value = data.notes || '';
    
    // Recalculate totals
    calculateAllTotals();
}

function clearForm() {
    // Clear tables
    document.getElementById('salesTableBody').innerHTML = '';
    document.getElementById('purchasesTableBody').innerHTML = '';
    document.getElementById('damageTableBody').innerHTML = '';
    
    // Add default rows
    addSalesRow();
    addPurchasesRow();
    addDamageRow();
    
    // Clear notes
    document.getElementById('inventoryNotes').value = '';
    
    // Reset totals
    calculateAllTotals();
}

// ========================================
// ROW MANAGEMENT
// ========================================

function addSalesRow(data = null) {
    const tbody = document.getElementById('salesTableBody');
    const row = document.createElement('tr');
    row.className = 'sales-row';
    
    const name = data?.item || '';
    const quantity = data?.quantity || 1;
    const price = data?.price || 0;
    const total = quantity * price;
    
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="اسم الصنف" value="${name}"></td>
        <td><input type="number" class="item-quantity" min="0" step="1" value="${quantity}" onchange="calculateSalesRow(this)"></td>
        <td><input type="number" class="item-price" min="0" step="0.5" value="${price}" onchange="calculateSalesRow(this)"></td>
        <td><span class="item-total">${total.toFixed(2)}</span></td>
        <td><button class="btn-remove" onclick="removeRow(this)">🗑️</button></td>
    `;
    
    tbody.appendChild(row);
    calculateAllTotals();
}

function addPurchasesRow(data = null) {
    const tbody = document.getElementById('purchasesTableBody');
    const row = document.createElement('tr');
    row.className = 'purchases-row';
    
    const name = data?.item || '';
    const quantity = data?.quantity || 1;
    const price = data?.price || 0;
    const total = quantity * price;
    
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="اسم الصنف" value="${name}"></td>
        <td><input type="number" class="item-quantity" min="0" step="1" value="${quantity}" onchange="calculatePurchasesRow(this)"></td>
        <td><input type="number" class="item-price" min="0" step="0.5" value="${price}" onchange="calculatePurchasesRow(this)"></td>
        <td><span class="item-total">${total.toFixed(2)}</span></td>
        <td><button class="btn-remove" onclick="removeRow(this)">🗑️</button></td>
    `;
    
    tbody.appendChild(row);
    calculateAllTotals();
}

function addDamageRow(data = null) {
    const tbody = document.getElementById('damageTableBody');
    const row = document.createElement('tr');
    row.className = 'damage-row';
    
    const name = data?.item || '';
    const quantity = data?.quantity || 1;
    const price = data?.price || 0;
    const total = quantity * price;
    
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="اسم الصنف" value="${name}"></td>
        <td><input type="number" class="item-quantity" min="0" step="1" value="${quantity}" onchange="calculateDamageRow(this)"></td>
        <td><input type="number" class="item-price" min="0" step="0.5" value="${price}" onchange="calculateDamageRow(this)"></td>
        <td><span class="item-total">${total.toFixed(2)}</span></td>
        <td><button class="btn-remove" onclick="removeRow(this)">🗑️</button></td>
    `;
    
    tbody.appendChild(row);
    calculateAllTotals();
}

function removeRow(button) {
    const row = button.closest('tr');
    const tbody = row.parentElement;
    
    // Keep at least one row
    if (tbody.children.length > 1) {
        row.remove();
        calculateAllTotals();
    } else {
        alert('يجب الإبقاء على صف واحد على الأقل');
    }
}

// ========================================
// CALCULATIONS
// ========================================

function calculateSalesRow(input) {
    const row = input.closest('tr');
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = quantity * price;
    
    row.querySelector('.item-total').textContent = total.toFixed(2);
    calculateAllTotals();
}

function calculatePurchasesRow(input) {
    const row = input.closest('tr');
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = quantity * price;
    
    row.querySelector('.item-total').textContent = total.toFixed(2);
    calculateAllTotals();
}

function calculateDamageRow(input) {
    const row = input.closest('tr');
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = quantity * price;
    
    row.querySelector('.item-total').textContent = total.toFixed(2);
    calculateAllTotals();
}

function calculateAllTotals() {
    // Calculate sales total
    let salesTotal = 0;
    document.querySelectorAll('#salesTableBody .item-total').forEach(span => {
        salesTotal += parseFloat(span.textContent) || 0;
    });
    
    // Calculate purchases total
    let purchasesTotal = 0;
    document.querySelectorAll('#purchasesTableBody .item-total').forEach(span => {
        purchasesTotal += parseFloat(span.textContent) || 0;
    });
    
    // Calculate damage total
    let damageTotal = 0;
    document.querySelectorAll('#damageTableBody .item-total').forEach(span => {
        damageTotal += parseFloat(span.textContent) || 0;
    });
    
    // Calculate net cash and profit
    const netCash = salesTotal - purchasesTotal;
    const netProfit = salesTotal - purchasesTotal - damageTotal;
    
    // Update displays
    document.getElementById('salesTotal').textContent = salesTotal.toFixed(2) + ' د.أ';
    document.getElementById('purchasesTotal').textContent = purchasesTotal.toFixed(2) + ' د.أ';
    document.getElementById('damageTotal').textContent = damageTotal.toFixed(2) + ' د.أ';
    
    document.getElementById('totalSalesDisplay').textContent = salesTotal.toFixed(2) + ' د.أ';
    document.getElementById('totalPurchasesDisplay').textContent = purchasesTotal.toFixed(2) + ' د.أ';
    document.getElementById('totalDamageDisplay').textContent = damageTotal.toFixed(2) + ' د.أ';
    document.getElementById('netCashDisplay').textContent = netCash.toFixed(2) + ' د.أ';
    document.getElementById('netProfitDisplay').textContent = netProfit.toFixed(2) + ' د.أ';
    
    // Update distribution chart
    updateDistributionChart(salesTotal, purchasesTotal, damageTotal);
}

// ========================================
// SAVE DATA
// ========================================

async function saveInventory() {
    try {
        // Collect sales data
        const salesItems = [];
        document.querySelectorAll('#salesTableBody tr').forEach(row => {
            const name = row.querySelector('.item-name').value.trim();
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            
            if (name && quantity > 0) {
                salesItems.push({ item: name, quantity, price });
            }
        });
        
        // Collect purchases data
        const purchaseItems = [];
        document.querySelectorAll('#purchasesTableBody tr').forEach(row => {
            const name = row.querySelector('.item-name').value.trim();
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            
            if (name && quantity > 0) {
                purchaseItems.push({ item: name, quantity, price });
            }
        });
        
        // Collect damage data
        const damageItems = [];
        document.querySelectorAll('#damageTableBody tr').forEach(row => {
            const name = row.querySelector('.item-name').value.trim();
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            
            if (name && quantity > 0) {
                damageItems.push({ item: name, quantity, price });
            }
        });
        
        // Calculate totals
        const totalSales = salesItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const totalPurchases = purchaseItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const totalDamage = damageItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        
        const notes = document.getElementById('inventoryNotes').value.trim();
        const date = document.getElementById('inventoryDate').value;
        
        const currentUser = getCurrentAdmin();
        
        const inventoryData = {
            inventory_date: date,
            total_sales: totalSales,
            sales_items: salesItems,
            total_purchases: totalPurchases,
            purchase_items: purchaseItems,
            total_damage: totalDamage,
            damage_items: damageItems,
            notes: notes,
            created_by: currentUser?.username || 'admin'
        };
        
        if (!window.DB || !window.DB.supabase) {
            alert('⚠️ قاعدة البيانات غير متاحة. يرجى التحقق من الاتصال.');
            return;
        }
        
        // Upsert (insert or update)
        const { data, error } = await window.DB.supabase
            .from('daily_inventory')
            .upsert(inventoryData, { onConflict: 'inventory_date' })
            .select();
        
        if (error) {
            console.error('Error saving inventory:', error);
            alert('❌ حدث خطأ أثناء الحفظ: ' + error.message);
            return;
        }
        
        alert('✅ تم حفظ البيانات بنجاح!');
        
        // Reload history and charts
        await loadInventoryHistory();
        await updateCharts();
        await calculateAverageSales();
        
    } catch (error) {
        console.error('Error saving inventory:', error);
        alert('❌ حدث خطأ أثناء الحفظ');
    }
}

// ========================================
// HISTORY
// ========================================

async function loadInventoryHistory() {
    try {
        if (!window.DB || !window.DB.supabase) {
            console.warn('Database not available');
            return;
        }
        
        const { data, error } = await window.DB.supabase
            .from('daily_inventory')
            .select('*')
            .order('inventory_date', { ascending: false })
            .limit(30);
        
        if (error) {
            console.error('Error loading history:', error);
            return;
        }
        
        const tbody = document.getElementById('historyTableBody');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">لا يوجد سجلات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(record => `
            <tr>
                <td>${new Date(record.inventory_date).toLocaleDateString('ar-JO')}</td>
                <td style="color: #10b981; font-weight: 600;">${record.total_sales.toFixed(2)} د.أ</td>
                <td style="color: #ef4444; font-weight: 600;">${record.total_purchases.toFixed(2)} د.أ</td>
                <td style="color: #f59e0b; font-weight: 600;">${record.total_damage.toFixed(2)} د.أ</td>
                <td style="color: #3b82f6; font-weight: 600;">${record.net_cash.toFixed(2)} د.أ</td>
                <td style="color: #8b5cf6; font-weight: 600;">${record.net_profit.toFixed(2)} د.أ</td>
                <td>
                    <button class="edit-btn" onclick="loadInventoryForDate('${record.inventory_date}')">عرض</button>
                    <button class="delete-btn" onclick="deleteInventory('${record.inventory_date}')">حذف</button>
                </td>
            </tr>
        `).join('');
        
        // Update charts with history data
        await updateCharts();
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

async function loadInventoryForDate(date) {
    document.getElementById('inventoryDate').value = date;
    currentInventoryData.date = date;
    await loadInventoryData(date);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteInventory(date) {
    if (!confirm('هل أنت متأكد من حذف سجل هذا اليوم؟')) {
        return;
    }
    
    try {
        const { error } = await window.DB.supabase
            .from('daily_inventory')
            .delete()
            .eq('inventory_date', date);
        
        if (error) {
            console.error('Error deleting inventory:', error);
            alert('❌ حدث خطأ أثناء الحذف');
            return;
        }
        
        alert('✅ تم حذف السجل بنجاح');
        await loadInventoryHistory();
        await calculateAverageSales();
        
    } catch (error) {
        console.error('Error deleting inventory:', error);
        alert('❌ حدث خطأ أثناء الحذف');
    }
}

// ========================================
// AVERAGE SALES
// ========================================

async function calculateAverageSales() {
    try {
        if (!window.DB || !window.DB.supabase) {
            return;
        }
        
        const { data, error } = await window.DB.supabase
            .from('daily_inventory')
            .select('total_sales, inventory_date')
            .order('inventory_date', { ascending: false });
        
        if (error || !data || data.length === 0) {
            document.getElementById('averageSales').textContent = '0.00 د.أ';
            document.getElementById('averageSubtitle').textContent = 'لا توجد بيانات';
            return;
        }
        
        const totalSales = data.reduce((sum, record) => sum + parseFloat(record.total_sales), 0);
        const average = totalSales / data.length;
        const lastDate = new Date(data[0].inventory_date).toLocaleDateString('ar-JO');
        
        document.getElementById('averageSales').textContent = average.toFixed(2) + ' د.أ';
        document.getElementById('averageSubtitle').textContent = `حتى ${lastDate} (${data.length} يوم)`;
        
    } catch (error) {
        console.error('Error calculating average:', error);
    }
}

// ========================================
// CHARTS
// ========================================

function initializeCharts() {
    // Sales vs Purchases Chart
    const ctx1 = document.getElementById('salesPurchasesChart');
    if (ctx1) {
        charts.salesPurchases = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'المبيعات',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }, {
                    label: 'المشتريات',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }
    
    // Profit Chart
    const ctx2 = document.getElementById('profitChart');
    if (ctx2) {
        charts.profit = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'صافي الربح',
                    data: [],
                    backgroundColor: '#8b5cf6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Distribution Chart
    const ctx3 = document.getElementById('distributionChart');
    if (ctx3) {
        charts.distribution = new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: ['المبيعات', 'المشتريات', 'الإتلاف'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

async function updateCharts() {
    try {
        if (!window.DB || !window.DB.supabase) {
            return;
        }
        
        const { data, error } = await window.DB.supabase
            .from('daily_inventory')
            .select('*')
            .order('inventory_date', { ascending: true })
            .limit(7);
        
        if (error || !data || data.length === 0) {
            return;
        }
        
        const labels = data.map(r => new Date(r.inventory_date).toLocaleDateString('ar-JO', { month: 'short', day: 'numeric' }));
        const sales = data.map(r => r.total_sales);
        const purchases = data.map(r => r.total_purchases);
        const profits = data.map(r => r.net_profit);
        
        // Update sales vs purchases chart
        if (charts.salesPurchases) {
            charts.salesPurchases.data.labels = labels;
            charts.salesPurchases.data.datasets[0].data = sales;
            charts.salesPurchases.data.datasets[1].data = purchases;
            charts.salesPurchases.update();
        }
        
        // Update profit chart
        if (charts.profit) {
            charts.profit.data.labels = labels;
            charts.profit.data.datasets[0].data = profits;
            charts.profit.update();
        }
        
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function updateDistributionChart(sales, purchases, damage) {
    if (charts.distribution) {
        charts.distribution.data.datasets[0].data = [sales, purchases, damage];
        charts.distribution.update();
    }
}

// ========================================
// EXCEL EXPORT
// ========================================

function exportToExcel() {
    const date = document.getElementById('inventoryDate').value;
    const formattedDate = new Date(date).toLocaleDateString('ar-JO');
    
    // Collect all data
    const salesData = [];
    document.querySelectorAll('#salesTableBody tr').forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const quantity = row.querySelector('.item-quantity').value;
        const price = row.querySelector('.item-price').value;
        const total = row.querySelector('.item-total').textContent;
        if (name) {
            salesData.push([name, quantity, price, total]);
        }
    });
    
    const purchasesData = [];
    document.querySelectorAll('#purchasesTableBody tr').forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const quantity = row.querySelector('.item-quantity').value;
        const price = row.querySelector('.item-price').value;
        const total = row.querySelector('.item-total').textContent;
        if (name) {
            purchasesData.push([name, quantity, price, total]);
        }
    });
    
    const damageData = [];
    document.querySelectorAll('#damageTableBody tr').forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const quantity = row.querySelector('.item-quantity').value;
        const price = row.querySelector('.item-price').value;
        const total = row.querySelector('.item-total').textContent;
        if (name) {
            damageData.push([name, quantity, price, total]);
        }
    });
    
    const totalSales = document.getElementById('totalSalesDisplay').textContent;
    const totalPurchases = document.getElementById('totalPurchasesDisplay').textContent;
    const totalDamage = document.getElementById('totalDamageDisplay').textContent;
    const netCash = document.getElementById('netCashDisplay').textContent;
    const netProfit = document.getElementById('netProfitDisplay').textContent;
    const notes = document.getElementById('inventoryNotes').value;
    
    // Create CSV content
    let csv = '\uFEFF'; // UTF-8 BOM for Arabic support
    csv += `تقرير الجرد اليومي - ${formattedDate}\n\n`;
    
    csv += 'المبيعات اليومية\n';
    csv += 'اسم الصنف,الكمية,السعر,المجموع\n';
    salesData.forEach(row => csv += row.join(',') + '\n');
    csv += `,,المجموع الكلي:,${totalSales}\n\n`;
    
    csv += 'المشتريات اليومية\n';
    csv += 'اسم الصنف,الكمية,السعر,المجموع\n';
    purchasesData.forEach(row => csv += row.join(',') + '\n');
    csv += `,,المجموع الكلي:,${totalPurchases}\n\n`;
    
    csv += 'الإتلاف اليومي\n';
    csv += 'اسم الصنف,الكمية,السعر,المجموع\n';
    damageData.forEach(row => csv += row.join(',') + '\n');
    csv += `,,المجموع الكلي:,${totalDamage}\n\n`;
    
    csv += 'الملخص المالي\n';
    csv += `الصافي النقدي:,${netCash}\n`;
    csv += `صافي الربح:,${netProfit}\n\n`;
    
    if (notes) {
        csv += `ملاحظات:\n${notes}\n`;
    }
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${date}.csv`;
    link.click();
    
    alert('✅ تم تصدير الملف بنجاح!');
}
