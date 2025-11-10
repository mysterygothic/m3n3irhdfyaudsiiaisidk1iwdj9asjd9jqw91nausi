// نظام الجرد اليومي - النسخة المحدثة
// المبيعات: رقم واحد فقط
// المشتريات: تفصيلية
// الإتلاف: تفصيلي

let currentInventoryData = {
    date: new Date().toISOString().split('T')[0],
    totalSales: 0,
    purchases: [],
    damage: [],
    notes: ''
};

let charts = { salesPurchases: null, profit: null, distribution: null };

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

async function initializePage() {
    const dateInput = document.getElementById('inventoryDate');
    dateInput.value = currentInventoryData.date;
    
    await loadInventoryData(currentInventoryData.date);
    initializeCharts();
    await loadInventoryHistory();
    await calculateAverageSales();
    populateMonthSelect();
    
    dateInput.addEventListener('change', async function() {
        currentInventoryData.date = this.value;
        await loadInventoryData(this.value);
    });
}

async function loadInventoryData(date) {
    try {
        if (\!window.DB || \!window.DB.supabase) return;
        
        const { data, error } = await window.DB.supabase
            .from('daily_inventory')
            .select('*')
            .eq('inventory_date', date)
            .single();
        
        if (error && error.code \!== 'PGRST116') {
            console.error('Error loading inventory:', error);
            return;
        }
        
        if (data) {
            populateFormWithData(data);
        } else {
            clearForm();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function populateFormWithData(data) {
    document.getElementById('totalSalesInput').value = data.total_sales || 0;
    
    document.getElementById('purchasesTableBody').innerHTML = '';
    if (data.purchase_items && data.purchase_items.length > 0) {
        data.purchase_items.forEach(item => addPurchasesRow(item));
    } else {
        addPurchasesRow();
    }
    
    document.getElementById('damageTableBody').innerHTML = '';
    if (data.damage_items && data.damage_items.length > 0) {
        data.damage_items.forEach(item => addDamageRow(item));
    } else {
        addDamageRow();
    }
    
    document.getElementById('inventoryNotes').value = data.notes || '';
    calculateAllTotals();
}

function clearForm() {
    document.getElementById('totalSalesInput').value = 0;
    document.getElementById('purchasesTableBody').innerHTML = '';
    document.getElementById('damageTableBody').innerHTML = '';
    addPurchasesRow();
    addDamageRow();
    document.getElementById('inventoryNotes').value = '';
    calculateAllTotals();
}

function addPurchasesRow(data = null) {
    const tbody = document.getElementById('purchasesTableBody');
    const row = document.createElement('tr');
    row.className = 'purchases-row';
    
    const name = data?.item || '';
    const price = data?.price || 0;
    
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="مثال: فاين" value="${name}"></td>
        <td><input type="number" class="item-price" min="0" step="0.5" value="${price}" placeholder="13" onchange="calculateAllTotals()"></td>
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
    const price = data?.price || 0;
    
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="مثال: خضار تالفة" value="${name}"></td>
        <td><input type="number" class="item-price" min="0" step="0.5" value="${price}" placeholder="20" onchange="calculateAllTotals()"></td>
        <td><button class="btn-remove" onclick="removeRow(this)">🗑️</button></td>
    `;
    
    tbody.appendChild(row);
    calculateAllTotals();
}

function removeRow(button) {
    const row = button.closest('tr');
    const tbody = row.parentElement;
    
    if (tbody.children.length > 1) {
        row.remove();
        calculateAllTotals();
    } else {
        alert('يجب الإبقاء على صف واحد على الأقل');
    }
}

function calculateAllTotals() {
    const salesTotal = parseFloat(document.getElementById('totalSalesInput').value) || 0;
    
    let purchasesTotal = 0;
    document.querySelectorAll('#purchasesTableBody .item-price').forEach(input => {
        purchasesTotal += parseFloat(input.value) || 0;
    });
    
    let damageTotal = 0;
    document.querySelectorAll('#damageTableBody .item-price').forEach(input => {
        damageTotal += parseFloat(input.value) || 0;
    });
    
    const netCash = salesTotal - purchasesTotal;
    const netProfit = salesTotal - purchasesTotal - damageTotal;
    
    document.getElementById('purchasesTotal').textContent = purchasesTotal.toFixed(2) + ' د.أ';
    document.getElementById('damageTotal').textContent = damageTotal.toFixed(2) + ' د.أ';
    
    document.getElementById('totalSalesDisplay').textContent = salesTotal.toFixed(2) + ' د.أ';
    document.getElementById('totalPurchasesDisplay').textContent = purchasesTotal.toFixed(2) + ' د.أ';
    document.getElementById('totalDamageDisplay').textContent = damageTotal.toFixed(2) + ' د.أ';
    document.getElementById('netCashDisplay').textContent = netCash.toFixed(2) + ' د.أ';
    document.getElementById('netProfitDisplay').textContent = netProfit.toFixed(2) + ' د.أ';
    
    updateDistributionChart(salesTotal, purchasesTotal, damageTotal);
}

async function saveInventory() {
    try {
        const purchaseItems = [];
        document.querySelectorAll('#purchasesTableBody tr').forEach(row => {
            const name = row.querySelector('.item-name').value.trim();
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            
            if (name && price > 0) {
                purchaseItems.push({ item: name, price });
            }
        });
        
        const damageItems = [];
        document.querySelectorAll('#damageTableBody tr').forEach(row => {
            const name = row.querySelector('.item-name').value.trim();
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            
            if (name && price > 0) {
                damageItems.push({ item: name, price });
            }
        });
        
        const totalSales = parseFloat(document.getElementById('totalSalesInput').value) || 0;
        const notes = document.getElementById('inventoryNotes').value.trim();
        const date = document.getElementById('inventoryDate').value;
        
        const currentUser = getCurrentAdmin();
        
        const inventoryData = {
            inventory_date: date,
            total_sales: totalSales,
            purchase_items: purchaseItems,
            damage_items: damageItems,
            notes: notes,
            created_by: currentUser?.username || 'admin'
        };
        
        if (\!window.DB || \!window.DB.supabase) {
            alert('⚠️ قاعدة البيانات غير متاحة');
            return;
        }
        
        const { data, error } = await window.DB.supabase
            .from('daily_inventory')
            .upsert(inventoryData, { onConflict: 'inventory_date' })
            .select();
        
        if (error) {
            console.error('Error saving:', error);
            alert('❌ حدث خطأ: ' + error.message);
            return;
        }
        
        alert('✅ تم حفظ البيانات بنجاح\!');
        await loadInventoryHistory();
        await updateCharts();
        await calculateAverageSales();
        await loadMonthlySummary();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ حدث خطأ');
    }
}

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
        await loadMonthlySummary();
        
    } catch (error) {
        console.error('Error deleting inventory:', error);
        alert('❌ حدث خطأ أثناء الحذف');
    }
}

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

function populateMonthSelect() {
    const select = document.getElementById('monthSelect');
    const currentDate = new Date();
    
    select.innerHTML = '<option value="">اختر الشهر</option>';
    
    for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthName = date.toLocaleDateString('ar-JO', { month: 'long', year: 'numeric' });
        
        const option = document.createElement('option');
        option.value = `${year}-${String(month).padStart(2, '0')}`;
        option.textContent = monthName;
        select.appendChild(option);
    }
}

async function loadMonthlySummary() {
    const monthSelect = document.getElementById('monthSelect');
    const selectedMonth = monthSelect.value;
    
    if (!selectedMonth) {
        document.getElementById('monthlySales').textContent = '0.00 د.أ';
        document.getElementById('monthlyPurchases').textContent = '0.00 د.أ';
        document.getElementById('monthlyDamage').textContent = '0.00 د.أ';
        document.getElementById('monthlyProfit').textContent = '0.00 د.أ';
        return;
    }
    
    try {
        if (!window.DB || !window.DB.supabase) {
            return;
        }
        
        const [year, month] = selectedMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        
        const { data, error } = await window.DB.supabase
            .from('daily_inventory')
            .select('*')
            .gte('inventory_date', startDate)
            .lte('inventory_date', endDate)
            .order('inventory_date', { ascending: true });
        
        if (error) {
            console.error('Error loading monthly summary:', error);
            return;
        }
        
        if (!data || data.length === 0) {
            document.getElementById('monthlySales').textContent = '0.00 د.أ';
            document.getElementById('monthlyPurchases').textContent = '0.00 د.أ';
            document.getElementById('monthlyDamage').textContent = '0.00 د.أ';
            document.getElementById('monthlyProfit').textContent = '0.00 د.أ';
            return;
        }
        
        const totalSales = data.reduce((sum, r) => sum + parseFloat(r.total_sales), 0);
        const totalPurchases = data.reduce((sum, r) => sum + parseFloat(r.total_purchases), 0);
        const totalDamage = data.reduce((sum, r) => sum + parseFloat(r.total_damage), 0);
        const totalProfit = data.reduce((sum, r) => sum + parseFloat(r.net_profit), 0);
        
        document.getElementById('monthlySales').textContent = totalSales.toFixed(2) + ' د.أ';
        document.getElementById('monthlyPurchases').textContent = totalPurchases.toFixed(2) + ' د.أ';
        document.getElementById('monthlyDamage').textContent = totalDamage.toFixed(2) + ' د.أ';
        document.getElementById('monthlyProfit').textContent = totalProfit.toFixed(2) + ' د.أ';
        
    } catch (error) {
        console.error('Error loading monthly summary:', error);
    }
}

function initializeCharts() {
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
        
        if (charts.salesPurchases) {
            charts.salesPurchases.data.labels = labels;
            charts.salesPurchases.data.datasets[0].data = sales;
            charts.salesPurchases.data.datasets[1].data = purchases;
            charts.salesPurchases.update();
        }
        
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

function exportToExcel() {
    const date = document.getElementById('inventoryDate').value;
    const formattedDate = new Date(date).toLocaleDateString('ar-JO');
    
    const salesTotal = document.getElementById('totalSalesInput').value;
    
    const purchasesData = [];
    document.querySelectorAll('#purchasesTableBody tr').forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const price = row.querySelector('.item-price').value;
        if (name) {
            purchasesData.push([name, price]);
        }
    });
    
    const damageData = [];
    document.querySelectorAll('#damageTableBody tr').forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const price = row.querySelector('.item-price').value;
        if (name) {
            damageData.push([name, price]);
        }
    });
    
    const totalPurchases = document.getElementById('totalPurchasesDisplay').textContent;
    const totalDamage = document.getElementById('totalDamageDisplay').textContent;
    const netCash = document.getElementById('netCashDisplay').textContent;
    const netProfit = document.getElementById('netProfitDisplay').textContent;
    const notes = document.getElementById('inventoryNotes').value;
    
    let csv = '\uFEFF';
    csv += `تقرير الجرد اليومي - ${formattedDate}\n\n`;
    
    csv += 'المبيعات اليومية:\n';
    csv += `إجمالي المبيعات:,${salesTotal} د.أ\n\n`;
    
    csv += 'المشتريات اليومية:\n';
    csv += 'الصنف,السعر\n';
    purchasesData.forEach(row => csv += row.join(',') + '\n');
    csv += `المجموع الكلي:,${totalPurchases}\n\n`;
    
    csv += 'الإتلاف اليومي:\n';
    csv += 'الصنف,السعر\n';
    damageData.forEach(row => csv += row.join(',') + '\n');
    csv += `المجموع الكلي:,${totalDamage}\n\n`;
    
    csv += 'الملخص المالي:\n';
    csv += `الصافي النقدي:,${netCash}\n`;
    csv += `صافي الربح:,${netProfit}\n\n`;
    
    if (notes) {
        csv += `ملاحظات:\n${notes}\n`;
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${date}.csv`;
    link.click();
    
    alert('✅ تم تصدير الملف بنجاح!');
}

async function exportMonthlyInventory() {
    const monthSelect = document.getElementById('monthSelect');
    const selectedMonth = monthSelect.value;
    
    if (!selectedMonth) {
        alert('⚠️ الرجاء اختيار الشهر أولاً');
        return;
    }
    
    try {
        if (!window.DB || !window.DB.supabase) {
            alert('⚠️ قاعدة البيانات غير متاحة');
            return;
        }
        
        const [year, month] = selectedMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        
        const { data, error } = await window.DB.supabase
            .from('daily_inventory')
            .select('*')
            .gte('inventory_date', startDate)
            .lte('inventory_date', endDate)
            .order('inventory_date', { ascending: true });
        
        if (error) {
            console.error('Error:', error);
            alert('❌ حدث خطأ في تحميل البيانات');
            return;
        }
        
        if (!data || data.length === 0) {
            alert('⚠️ لا توجد بيانات لهذا الشهر');
            return;
        }
        
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ar-JO', { month: 'long', year: 'numeric' });
        
        let csv = '\uFEFF';
        csv += `تقرير الجرد الشهري - ${monthName}\n\n`;
        
        csv += 'التاريخ,المبيعات,المشتريات,الإتلاف,الصافي النقدي,صافي الربح\n';
        
        let totalSales = 0;
        let totalPurchases = 0;
        let totalDamage = 0;
        let totalProfit = 0;
        
        data.forEach(record => {
            const date = new Date(record.inventory_date).toLocaleDateString('ar-JO');
            csv += `${date},${record.total_sales.toFixed(2)},${record.total_purchases.toFixed(2)},${record.total_damage.toFixed(2)},${record.net_cash.toFixed(2)},${record.net_profit.toFixed(2)}\n`;
            
            totalSales += parseFloat(record.total_sales);
            totalPurchases += parseFloat(record.total_purchases);
            totalDamage += parseFloat(record.total_damage);
            totalProfit += parseFloat(record.net_profit);
        });
        
        csv += '\nالمجاميع الشهرية:\n';
        csv += `إجمالي المبيعات الشهرية:,${totalSales.toFixed(2)} د.أ\n`;
        csv += `إجمالي المشتريات الشهرية:,${totalPurchases.toFixed(2)} د.أ\n`;
        csv += `إجمالي الإتلاف الشهري:,${totalDamage.toFixed(2)} د.أ\n`;
        csv += `صافي الربح الشهري:,${totalProfit.toFixed(2)} د.أ\n\n`;
        
        csv += 'تفاصيل المشتريات الشهرية:\n';
        csv += 'التاريخ,الصنف,السعر\n';
        
        data.forEach(record => {
            const date = new Date(record.inventory_date).toLocaleDateString('ar-JO');
            if (record.purchase_items && record.purchase_items.length > 0) {
                record.purchase_items.forEach(item => {
                    csv += `${date},${item.item},${item.price}\n`;
                });
            }
        });
        
        csv += '\nتفاصيل الإتلاف الشهري:\n';
        csv += 'التاريخ,الصنف,السعر\n';
        
        data.forEach(record => {
            const date = new Date(record.inventory_date).toLocaleDateString('ar-JO');
            if (record.damage_items && record.damage_items.length > 0) {
                record.damage_items.forEach(item => {
                    csv += `${date},${item.item},${item.price}\n`;
                });
            }
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `monthly_inventory_${selectedMonth}.csv`;
        link.click();
        
        alert('✅ تم تصدير الجرد الشهري بنجاح!');
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ حدث خطأ في التصدير');
    }
}
