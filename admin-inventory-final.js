// نظام الجرد اليومي - النسخة النهائية
let purchaseCategories = [];
let charts = { salesPurchases: null, profit: null, distribution: null };

// نظام الحفظ التلقائي والأوفلاين
let autoSaveTimer = null;
let isOnline = navigator.onLine;
let pendingSync = false;
let autoSaveEnabled = true; // للتحكم في تفعيل/تعطيل الحفظ التلقائي

// دالة مساعدة للحصول على main_category من اسم المادة
function getMainCategory(itemName) {
    const category = purchaseCategories.find(cat => cat.item_name === itemName);
    return category ? category.main_category : null;
}

// دالة مساعدة للحصول على sub_category من اسم المادة
function getSubCategory(itemName) {
    const category = purchaseCategories.find(cat => cat.item_name === itemName);
    return category ? category.sub_category : null;
}

// تحديث مؤشر حالة الحفظ
function updateSaveStatus(status, message) {
    const statusEl = document.getElementById('saveStatus');
    const iconEl = document.getElementById('saveStatusIcon');
    const textEl = document.getElementById('saveStatusText');
    
    if (!statusEl || !iconEl || !textEl) return;
    
    const statusConfig = {
        saving: {
            icon: '⏳',
            text: 'جاري الحفظ...',
            bg: '#fef3c7',
            border: '#fbbf24',
            color: '#92400e'
        },
        saved: {
            icon: '✅',
            text: message || 'تم الحفظ',
            bg: '#f0fdf4',
            border: '#86efac',
            color: '#166534'
        },
        offline: {
            icon: '📴',
            text: 'حفظ محلي (بدون إنترنت)',
            bg: '#fef3c7',
            border: '#fbbf24',
            color: '#92400e'
        },
        error: {
            icon: '❌',
            text: message || 'خطأ في الحفظ',
            bg: '#fee2e2',
            border: '#fca5a5',
            color: '#991b1b'
        }
    };
    
    const config = statusConfig[status] || statusConfig.saved;
    
    iconEl.textContent = config.icon;
    textEl.textContent = config.text;
    statusEl.style.background = config.bg;
    statusEl.style.borderColor = config.border;
    statusEl.style.color = config.color;
}

// حفظ البيانات محلياً (Local Storage)
function saveToLocalStorage(date, data) {
    try {
        const key = `inventory_${date}`;
        localStorage.setItem(key, JSON.stringify({
            ...data,
            savedAt: new Date().toISOString(),
            synced: false
        }));
        console.log('💾 تم الحفظ محلياً:', date);
        updateSaveStatus(isOnline ? 'saved' : 'offline', isOnline ? 'تم الحفظ محلياً' : 'حفظ محلي (بدون إنترنت)');
    } catch (error) {
        console.error('❌ خطأ في الحفظ المحلي:', error);
        updateSaveStatus('error', 'خطأ في الحفظ');
    }
}

// تحميل البيانات من Local Storage
function loadFromLocalStorage(date) {
    try {
        const key = `inventory_${date}`;
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            console.log('📂 تم التحميل من الذاكرة المحلية:', date);
            return parsed;
        }
    } catch (error) {
        console.error('❌ خطأ في التحميل المحلي:', error);
    }
    return null;
}

// عرض إشعار للمستخدم
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 14px;
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// مراقبة حالة الاتصال
window.addEventListener('online', () => {
    isOnline = true;
    console.log('✅ عاد الاتصال بالإنترنت');
    showNotification('عاد الاتصال بالإنترنت - جاري المزامنة...', 'success');
    syncPendingData();
});

window.addEventListener('offline', () => {
    isOnline = false;
    console.log('⚠️ انقطع الاتصال بالإنترنت');
    showNotification('انقطع الاتصال - سيتم الحفظ محلياً', 'info');
});

// مزامنة البيانات المعلقة
async function syncPendingData() {
    if (!isOnline) return;
    
    try {
        const keys = Object.keys(localStorage);
        const inventoryKeys = keys.filter(k => k.startsWith('inventory_') && !k.endsWith('_synced'));
        
        for (const key of inventoryKeys) {
            const data = JSON.parse(localStorage.getItem(key));
            if (!data.synced) {
                const date = key.replace('inventory_', '');
                await syncToDatabase(date, data);
            }
        }
    } catch (error) {
        console.error('❌ خطأ في المزامنة:', error);
    }
}

// مزامنة مع قاعدة البيانات
async function syncToDatabase(date, data) {
    if (!isOnline || !window.DB || !window.DB.supabase) {
        console.log('⏳ في انتظار الاتصال...');
        return false;
    }
    
    try {
        const { error } = await window.DB.supabase
            .from('daily_inventory')
            .upsert({
                inventory_date: date,
                total_sales: data.total_sales,
                total_purchases: data.total_purchases,
                purchase_items: data.purchase_items,
                total_damage: data.total_damage,
                total_salaries: data.total_salaries,
                total_hospitality: data.total_hospitality,
                total_employee_meals: data.total_employee_meals,
                total_assets: data.total_assets,
                total_expenses: data.total_expenses,
                notes: data.notes,
                created_by: data.created_by,
                updated_at: new Date().toISOString()
            }, { onConflict: 'inventory_date' });
        
        if (error) throw error;
        
        // تحديث حالة المزامنة
        const key = `inventory_${date}`;
        const localData = JSON.parse(localStorage.getItem(key));
        localData.synced = true;
        localData.syncedAt = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(localData));
        
        console.log('✅ تمت المزامنة مع قاعدة البيانات:', date);
        showNotification('تمت المزامنة مع قاعدة البيانات', 'success');
        return true;
    } catch (error) {
        console.error('❌ خطأ في المزامنة:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

// دالة الحفظ التلقائي
function triggerAutoSave() {
    // التحقق من أن الحفظ التلقائي مفعّل
    if (!autoSaveEnabled) {
        console.log('⏸️ الحفظ التلقائي معطّل مؤقتاً');
        return;
    }
    
    // إلغاء المؤقت السابق
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    
    // تأخير الحفظ لمدة 2 ثانية بعد آخر تعديل
    autoSaveTimer = setTimeout(async () => {
        const date = document.getElementById('inventoryDate').value;
        await autoSaveInventory(date);
    }, 2000);
}

// تفعيل الحفظ التلقائي على جميع الحقول
function setupAutoSave() {
    // الحفظ عند تغيير المبيعات
    const salesInput = document.getElementById('totalSalesInput');
    if (salesInput) {
        salesInput.addEventListener('input', triggerAutoSave);
    }
    
    // الحفظ عند تغيير الملاحظات
    const notesInput = document.getElementById('inventoryNotes');
    if (notesInput) {
        notesInput.addEventListener('input', triggerAutoSave);
    }
    
    // الحفظ عند تغيير أي حقل مشتريات/مصاريف
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('expense-input')) {
            triggerAutoSave();
        }
    });
    
    // محاولة المزامنة كل 30 ثانية
    setInterval(() => {
        if (isOnline) {
            syncPendingData();
        }
    }, 30000);
    
    console.log('✅ تم تفعيل الحفظ التلقائي');
}

// حفظ تلقائي
async function autoSaveInventory(date) {
    try {
        updateSaveStatus('saving', 'جاري الحفظ...');
        
        const salesTotal = parseFloat(document.getElementById('totalSalesInput').value) || 0;
        const notes = document.getElementById('inventoryNotes')?.value || '';
        
        const purchaseItems = {};
        let totalPurchases = 0;
        let totalDamage = 0;
        let totalSalaries = 0;
        let totalHospitality = 0;
        let totalEmployeeMeals = 0;
        let totalAssets = 0;
        let totalExpenses = 0;
        
        document.querySelectorAll('.expense-input').forEach(input => {
            const item = input.dataset.item;
            const value = parseFloat(input.value) || 0;
            if (value > 0) {
                purchaseItems[item] = value;
                
                const mainCategory = getMainCategory(item);
                const subCategory = getSubCategory(item);
                
                if (mainCategory === 'مصاريف') {
                    if (subCategory === 'الإتلاف') {
                        totalDamage += value;
                    } else if (subCategory === 'ضيافة') {
                        totalHospitality += value;
                    } else if (subCategory === 'رواتب وأجور' && item.includes('وجبات')) {
                        totalEmployeeMeals += value;
                    } else if (subCategory === 'رواتب وأجور' && !item.includes('وجبات')) {
                        totalSalaries += value;
                        totalPurchases += value;
                    } else if (subCategory === 'أصول/أدوات') {
                        totalAssets += value;
                        totalPurchases += value;
                    } else {
                        totalPurchases += value;
                    }
                } else if (mainCategory === 'المشتريات') {
                    totalPurchases += value;
                } else {
                    totalPurchases += value;
                }
            }
        });
        
        totalExpenses = totalDamage + totalHospitality + totalEmployeeMeals;
        
        const currentUser = getCurrentAdmin();
        
        const inventoryData = {
            total_sales: salesTotal,
            total_purchases: totalPurchases,
            purchase_items: purchaseItems,
            total_damage: totalDamage,
            total_salaries: totalSalaries,
            total_hospitality: totalHospitality,
            total_employee_meals: totalEmployeeMeals,
            total_assets: totalAssets,
            total_expenses: totalExpenses,
            notes: notes,
            created_by: currentUser?.username || 'admin'
        };
        
        // حفظ محلياً أولاً
        saveToLocalStorage(date, inventoryData);
        
        // محاولة المزامنة مع قاعدة البيانات
        if (isOnline) {
            const synced = await syncToDatabase(date, inventoryData);
            if (synced) {
                updateSaveStatus('saved', 'تم الحفظ والمزامنة');
            }
        } else {
            updateSaveStatus('offline', 'حفظ محلي (بدون إنترنت)');
        }
        
    } catch (error) {
        console.error('❌ خطأ في الحفظ التلقائي:', error);
        updateSaveStatus('error', 'خطأ في الحفظ');
    }
}

async function initializePage() {
    const dateInput = document.getElementById('inventoryDate');
    dateInput.value = new Date().toISOString().split('T')[0];
    
    await loadPurchaseCategories();
    await loadInventoryData(dateInput.value);
    
    // تفعيل الحفظ التلقائي عند أي تغيير
    setupAutoSave();
    initializeCharts();
    await loadInventoryHistory();
    await calculateAverageSales();
    populateYearSelect();
    populateChartYearSelect();
    populateMonthSelect();
    populateChartMonthSelect();
    await initNotifications();
    
    dateInput.addEventListener('change', async function() {
        console.log('📅 تغيير التاريخ إلى:', this.value);
        await loadInventoryData(this.value);
    });
}

async function loadPurchaseCategories() {
    try {
        // التحقق من أن Supabase جاهز
        if (!window.DB || !window.DB.supabase) {
            console.warn('⚠️ Supabase not ready yet, retrying...');
            // إعادة المحاولة بعد ثانية
            setTimeout(loadPurchaseCategories, 1000);
            return;
        }
        
        console.log('📦 Loading purchase categories...');
        
        // تعطيل الحفظ التلقائي مؤقتاً أثناء إعادة التحميل
        autoSaveEnabled = false;
        
        const { data, error } = await window.DB.supabase
            .from('expense_categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order');
        
        if (error) {
            console.error('❌ Error loading categories:', error);
            throw error;
        }
        
        purchaseCategories = data || [];
        console.log(`✅ Loaded ${purchaseCategories.length} categories`);
        renderExpensesList();
        
        // إعادة تفعيل الحفظ التلقائي بعد إعادة الرسم
        setTimeout(() => {
            autoSaveEnabled = true;
            console.log('✅ Auto-save re-enabled after category reload');
        }, 500);
        
    } catch (error) {
        console.error('❌ Error in loadPurchaseCategories:', error);
        purchaseCategories = [];
        renderExpensesList();
        
        // إعادة تفعيل الحفظ التلقائي حتى في حالة الخطأ
        setTimeout(() => {
            autoSaveEnabled = true;
        }, 500);
    }
}

function renderExpensesList() {
    const list = document.getElementById('expensesList');
    if (!list) return;
    
    // إذا لم تكن هناك فئات، أظهر رسالة تحميل
    if (purchaseCategories.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p style="font-size: 1.2rem; margin-bottom: 10px;">⏳ جاري تحميل الفئات...</p>
                <small>إذا استمرت المشكلة، تحقق من اتصال قاعدة البيانات</small>
            </div>
        `;
        return;
    }
    
    // حفظ القيم الحالية قبل إعادة الرسم
    const currentValues = {};
    document.querySelectorAll('.expense-input').forEach(input => {
        const item = input.dataset.item;
        const value = input.value;
        if (value) {
            currentValues[item] = value;
        }
    });
    
    const grouped = {};
    purchaseCategories.forEach(item => {
        if (!grouped[item.main_category]) grouped[item.main_category] = {};
        if (!grouped[item.main_category][item.sub_category]) grouped[item.main_category][item.sub_category] = [];
        grouped[item.main_category][item.sub_category].push(item);
    });
    
    list.innerHTML = '';
    Object.entries(grouped).forEach(([mainCat, subCats]) => {
        const catGroup = document.createElement('div');
        catGroup.className = 'expense-category-group';
        catGroup.innerHTML = `<div class="category-header" onclick="toggleCategory(this)"><span>${mainCat}</span><span class="toggle-icon">▼</span></div>`;
        
        Object.entries(subCats).forEach(([subCat, items]) => {
            const subGroup = document.createElement('div');
            subGroup.className = 'subcategory-group';
            subGroup.innerHTML = `<div class="subcategory-header">${subCat || 'عام'}</div><div class="expense-items"></div>`;
            
            const itemsContainer = subGroup.querySelector('.expense-items');
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'expense-item';
                itemDiv.innerHTML = `<label>${item.item_name}</label><input type="number" class="expense-input" data-item="${item.item_name}" min="0" step="0.5" placeholder="0" onchange="calculateAllTotals()">`;
                
                // استعادة القيمة المحفوظة إن وجدت
                const input = itemDiv.querySelector('.expense-input');
                if (currentValues[item.item_name]) {
                    input.value = currentValues[item.item_name];
                }
                
                itemsContainer.appendChild(itemDiv);
            });
            
            catGroup.appendChild(subGroup);
        });
        
        list.appendChild(catGroup);
    });
}

function toggleCategory(header) {
    header.classList.toggle('collapsed');
    const group = header.parentElement;
    const subgroups = group.querySelectorAll('.subcategory-group');
    subgroups.forEach(sg => sg.style.display = header.classList.contains('collapsed') ? 'none' : 'block');
}

function filterItems() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const noResultsMessage = document.getElementById('noResultsMessage');
    
    // إذا كان البحث فارغاً، أظهر كل شيء
    if (!search) {
        // إظهار جميع العناصر
        document.querySelectorAll('.expense-item').forEach(item => {
            item.style.display = 'flex';
        });
        
        // إظهار جميع الفئات الفرعية
        document.querySelectorAll('.subcategory-group').forEach(group => {
            group.style.display = 'block';
        });
        
        // إظهار جميع الفئات الرئيسية
        document.querySelectorAll('.expense-category-group').forEach(group => {
            group.style.display = 'block';
            const header = group.querySelector('.category-header');
            if (header) {
                header.classList.remove('collapsed');
            }
        });
        
        // إخفاء رسالة "لا توجد نتائج"
        if (noResultsMessage) {
            noResultsMessage.style.display = 'none';
        }
        
        return;
    }
    
    // البحث في العناصر
    let totalVisibleItems = 0;
    
    document.querySelectorAll('.expense-category-group').forEach(categoryGroup => {
        let categoryHasVisibleItems = false;
        
        // فحص كل فئة فرعية
        categoryGroup.querySelectorAll('.subcategory-group').forEach(subGroup => {
            let subGroupHasVisibleItems = false;
            
            // فحص كل عنصر في الفئة الفرعية
            subGroup.querySelectorAll('.expense-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                const matches = text.includes(search);
                
                item.style.display = matches ? 'flex' : 'none';
                
                if (matches) {
                    subGroupHasVisibleItems = true;
                    categoryHasVisibleItems = true;
                    totalVisibleItems++;
                }
            });
            
            // إخفاء أو إظهار الفئة الفرعية بناءً على وجود عناصر مرئية
            subGroup.style.display = subGroupHasVisibleItems ? 'block' : 'none';
        });
        
        // إخفاء أو إظهار الفئة الرئيسية بناءً على وجود عناصر مرئية
        if (categoryHasVisibleItems) {
            categoryGroup.style.display = 'block';
            // فتح الفئة تلقائياً عند البحث
            const header = categoryGroup.querySelector('.category-header');
            if (header) {
                header.classList.remove('collapsed');
            }
        } else {
            categoryGroup.style.display = 'none';
        }
    });
    
    // إظهار أو إخفاء رسالة "لا توجد نتائج"
    if (noResultsMessage) {
        noResultsMessage.style.display = totalVisibleItems === 0 ? 'block' : 'none';
    }
}

async function loadInventoryData(date) {
    try {
        console.log('🔄 تحميل بيانات التاريخ:', date);
        
        // محاولة التحميل من Local Storage أولاً
        const localData = loadFromLocalStorage(date);
        if (localData && !localData.synced) {
            console.log('📂 تحميل من الذاكرة المحلية (غير متزامن)');
            populateForm(localData);
            calculateAllTotals();
            
            // محاولة المزامنة في الخلفية
            if (isOnline) {
                syncToDatabase(date, localData);
            }
            return;
        }
        
        // التحميل من قاعدة البيانات
        if (!window.DB || !window.DB.supabase) {
            console.warn('⚠️ قاعدة البيانات غير متاحة');
            // إذا كان هناك بيانات محلية، استخدمها
            if (localData) {
                populateForm(localData);
                calculateAllTotals();
            }
            return;
        }
        
        const { data, error } = await window.DB.supabase
            .from('daily_inventory')
            .select('*')
            .eq('inventory_date', date)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('❌ خطأ في تحميل البيانات:', error);
            // استخدام البيانات المحلية إذا كانت متوفرة
            if (localData) {
                populateForm(localData);
                calculateAllTotals();
            }
            return;
        }
        
        if (data) {
            console.log('✅ تم العثور على بيانات للتاريخ:', date);
            populateForm(data);
            // حفظ نسخة محلية
            saveToLocalStorage(date, {
                ...data,
                synced: true
            });
        } else {
            console.log('ℹ️ لا توجد بيانات للتاريخ:', date, '- تفريغ النموذج');
            // التحقق من البيانات المحلية
            if (localData) {
                populateForm(localData);
            } else {
                clearForm();
            }
        }
        
        calculateAllTotals();
        
    } catch (error) {
        console.error('Error:', error);
        // محاولة استخدام البيانات المحلية
        const localData = loadFromLocalStorage(date);
        if (localData) {
            populateForm(localData);
            calculateAllTotals();
        }
    }
}

// دالة مساعدة لملء النموذج
function populateForm(data) {
    document.getElementById('totalSalesInput').value = data.total_sales || '';
    
    const purchases = data.purchase_items || {};
    document.querySelectorAll('.expense-input').forEach(input => {
        const item = input.dataset.item;
        const value = purchases[item];
        input.value = value > 0 ? value : '';
    });
    
    if (document.getElementById('inventoryNotes')) {
        document.getElementById('inventoryNotes').value = data.notes || '';
    }
}

function clearForm() {
    // إلغاء أي مؤقت حفظ تلقائي قيد التنفيذ
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    
    document.getElementById('totalSalesInput').value = '';
    document.querySelectorAll('.expense-input').forEach(input => {
        input.value = '';
    });
    if (document.getElementById('inventoryNotes')) {
        document.getElementById('inventoryNotes').value = '';
    }
    calculateAllTotals();
}

function calculateAllTotals() {
    const salesTotal = parseFloat(document.getElementById('totalSalesInput').value) || 0;
    
    let purchasesTotal = 0; // المشتريات الفعلية فقط
    let damageTotal = 0; // الإتلاف بأنواعه
    let salariesTotal = 0; // رواتب الموظفين
    let hospitalityTotal = 0; // الضيافة
    let employeeMealsTotal = 0; // وجبات الموظفين
    let assetsTotal = 0; // الأصول
    let allItemsTotal = 0; // مجموع كل المدخلات
    
    document.querySelectorAll('.expense-input').forEach(input => {
        const value = parseFloat(input.value) || 0;
        const item = input.dataset.item;
        
        allItemsTotal += value;
        
        // الحصول على التصنيف من قاعدة البيانات
        const mainCategory = getMainCategory(item);
        const subCategory = getSubCategory(item);
        
        // التصنيف حسب main_category و sub_category من قاعدة البيانات
        if (mainCategory === 'مصاريف') {
            // التصنيفات الفرعية للمصاريف
            if (subCategory === 'الإتلاف') {
                damageTotal += value;
            } else if (subCategory === 'ضيافة') {
                hospitalityTotal += value;
            } else if (subCategory === 'رواتب وأجور' && item.includes('وجبات')) {
                employeeMealsTotal += value;
            } else if (subCategory === 'رواتب وأجور' && !item.includes('وجبات')) {
                salariesTotal += value;
                purchasesTotal += value; // الرواتب جزء من المشتريات
            } else if (subCategory === 'أصول/أدوات') {
                assetsTotal += value;
                purchasesTotal += value; // الأصول جزء من المشتريات
            } else {
                // باقي المصاريف تُضاف للمشتريات
                purchasesTotal += value;
            }
        } else if (mainCategory === 'المشتريات') {
            // كل المشتريات تُضاف للمشتريات
            purchasesTotal += value;
        } else {
            // في حالة عدم وجود تصنيف، تُضاف للمشتريات
            purchasesTotal += value;
        }
    });
    
    // المصاريف = الإتلاف + الضيافة + وجبات الموظفين
    const expensesTotal = damageTotal + hospitalityTotal + employeeMealsTotal;
    
    // الصافي النقدي = المبيعات - المشتريات (بدون المصاريف)
    const netCash = salesTotal - purchasesTotal;
    
    // صافي الربح = الصافي النقدي - المصاريف
    const netProfit = netCash - expensesTotal;
    
    document.getElementById('purchasesTotal').textContent = allItemsTotal.toFixed(2) + ' د.أ';
    
    if (document.getElementById('totalSalesDisplay')) {
        document.getElementById('totalSalesDisplay').textContent = salesTotal.toFixed(2) + ' د.أ';
        document.getElementById('totalPurchasesDisplay').textContent = purchasesTotal.toFixed(2) + ' د.أ';
        document.getElementById('totalSalariesDisplay').textContent = salariesTotal.toFixed(2) + ' د.أ';
        
        // البطاقات الجديدة
        if (document.getElementById('totalExpensesDisplay')) {
            document.getElementById('totalExpensesDisplay').textContent = expensesTotal.toFixed(2) + ' د.أ';
        }
        if (document.getElementById('totalAssetsDisplay')) {
            document.getElementById('totalAssetsDisplay').textContent = assetsTotal.toFixed(2) + ' د.أ';
        }
        
        document.getElementById('netCashDisplay').textContent = netCash.toFixed(2) + ' د.أ';
        document.getElementById('netProfitDisplay').textContent = netProfit.toFixed(2) + ' د.أ';
    }
    
    updateDistributionChart(salesTotal, purchasesTotal, damageTotal, salariesTotal);
}

async function saveInventory() {
    try {
        const purchaseItems = {};
        let totalPurchases = 0; // المشتريات الفعلية
        let totalDamage = 0;
        let totalSalaries = 0;
        let totalHospitality = 0;
        let totalEmployeeMeals = 0;
        let totalAssets = 0;
        let totalExpenses = 0;
        
        document.querySelectorAll('.expense-input').forEach(input => {
            const item = input.dataset.item;
            const value = parseFloat(input.value) || 0;
            if (value > 0) {
                purchaseItems[item] = value;
                
                // الحصول على التصنيف من قاعدة البيانات
                const mainCategory = getMainCategory(item);
                const subCategory = getSubCategory(item);
                
                // التصنيف حسب main_category و sub_category من قاعدة البيانات
                if (mainCategory === 'مصاريف') {
                    // التصنيفات الفرعية للمصاريف
                    if (subCategory === 'الإتلاف') {
                        totalDamage += value;
                    } else if (subCategory === 'ضيافة') {
                        totalHospitality += value;
                    } else if (subCategory === 'رواتب وأجور' && item.includes('وجبات')) {
                        totalEmployeeMeals += value;
                    } else if (subCategory === 'رواتب وأجور' && !item.includes('وجبات')) {
                        totalSalaries += value;
                        totalPurchases += value; // الرواتب جزء من المشتريات
                    } else if (subCategory === 'أصول/أدوات') {
                        totalAssets += value;
                        totalPurchases += value; // الأصول جزء من المشتريات
                    } else {
                        // باقي المصاريف تُضاف للمشتريات
                        totalPurchases += value;
                    }
                } else if (mainCategory === 'المشتريات') {
                    // كل المشتريات تُضاف للمشتريات
                    totalPurchases += value;
                } else {
                    // في حالة عدم وجود تصنيف، تُضاف للمشتريات
                    totalPurchases += value;
                }
            }
        });
        
        // حساب المصاريف
        totalExpenses = totalDamage + totalHospitality + totalEmployeeMeals;
        
        const totalSales = parseFloat(document.getElementById('totalSalesInput').value) || 0;
        const notes = document.getElementById('inventoryNotes').value.trim();
        const date = document.getElementById('inventoryDate').value;
        
        const currentUser = getCurrentAdmin();
        
        const inventoryData = {
            inventory_date: date,
            total_sales: totalSales,
            total_purchases: totalPurchases,
            purchase_items: purchaseItems,
            total_damage: totalDamage,
            total_salaries: totalSalaries,
            total_hospitality: totalHospitality,
            total_employee_meals: totalEmployeeMeals,
            total_assets: totalAssets,
            total_expenses: totalExpenses,
            notes: notes,
            created_by: currentUser?.username || 'admin'
        };
        
        if (!window.DB || !window.DB.supabase) {
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
        
        alert('✅ تم حفظ البيانات بنجاح!');
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
        if (!window.DB || !window.DB.supabase) return;
        
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
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">لا يوجد سجلات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(record => {
            // حساب الصافي النقدي وصافي الربح من البيانات
            const netCash = (record.total_sales || 0) - (record.total_purchases || 0);
            const netProfit = netCash - (record.total_expenses || 0);
            
            return `
            <tr>
                <td>${new Date(record.inventory_date).toLocaleDateString('ar-JO')}</td>
                <td style="color: #10b981; font-weight: 600;">${(record.total_sales || 0).toFixed(2)} د.أ</td>
                <td style="color: #ef4444; font-weight: 600;">${(record.total_purchases || 0).toFixed(2)} د.أ</td>
                <td style="color: #ff6b6b; font-weight: 600;">${(record.total_expenses || 0).toFixed(2)} د.أ</td>
                <td style="color: #4ecdc4; font-weight: 600;">${(record.total_assets || 0).toFixed(2)} د.أ</td>
                <td style="color: #6366f1; font-weight: 600;">${(record.total_salaries || 0).toFixed(2)} د.أ</td>
                <td style="color: #3b82f6; font-weight: 600;">${netCash.toFixed(2)} د.أ</td>
                <td style="color: #8b5cf6; font-weight: 600;">${netProfit.toFixed(2)} د.أ</td>
                <td>
                    <button class="edit-btn" onclick="loadInventoryForDate('${record.inventory_date}')">عرض</button>
                    <button class="delete-btn" onclick="deleteInventory('${record.inventory_date}')">حذف</button>
                </td>
            </tr>
            `;
        }).join('');
        
        await updateCharts();
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

async function loadInventoryForDate(date) {
    document.getElementById('inventoryDate').value = date;
    await loadInventoryData(date);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteInventory(date) {
    if (!confirm('هل أنت متأكد من حذف سجل هذا اليوم؟')) return;
    
    try {
        // حذف من قاعدة البيانات
        const { error } = await window.DB.supabase
            .from('daily_inventory')
            .delete()
            .eq('inventory_date', date);
        
        if (error) {
            alert('❌ حدث خطأ أثناء الحذف');
            return;
        }
        
        // حذف من Local Storage
        const key = `inventory_${date}`;
        localStorage.removeItem(key);
        console.log('🗑️ تم حذف البيانات المحلية:', date);
        
        // إذا كان التاريخ المحذوف هو التاريخ الحالي، تفريغ النموذج
        const currentDate = document.getElementById('inventoryDate').value;
        if (date === currentDate) {
            // تعطيل الحفظ التلقائي مؤقتاً
            autoSaveEnabled = false;
            
            clearForm();
            updateSaveStatus('saved', 'تم حذف السجل');
            
            // إعادة تفعيل الحفظ التلقائي بعد 3 ثوانٍ
            setTimeout(() => {
                autoSaveEnabled = true;
                console.log('✅ تم إعادة تفعيل الحفظ التلقائي');
            }, 3000);
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
        if (!window.DB || !window.DB.supabase) return;
        
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

// ملء قائمة السنوات للجرد الشهري
function populateYearSelect() {
    const select = document.getElementById('yearSelect');
    if (!select) return;
    
    const currentYear = new Date().getFullYear();
    select.innerHTML = '<option value="">اختر السنة</option>';
    
    // إضافة السنوات من 2024 إلى السنة الحالية + 2
    for (let year = 2024; year <= currentYear + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        select.appendChild(option);
    }
}

// ملء قائمة الأشهر للجرد الشهري
function populateMonthSelect() {
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    if (!yearSelect || !monthSelect) return;
    
    const selectedYear = yearSelect.value;
    if (!selectedYear) {
        monthSelect.innerHTML = '<option value="">اختر السنة أولاً</option>';
        return;
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    monthSelect.innerHTML = '<option value="">اختر الشهر</option>';
    
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    // إضافة جميع الأشهر من 1-12
    for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        const value = `${selectedYear}-${monthStr}`;
        
        const option = document.createElement('option');
        option.value = value;
        option.textContent = `${monthNames[month - 1]} ${selectedYear}`;
        
        // تحديد الشهر الحالي تلقائياً
        if (parseInt(selectedYear) === currentYear && month === currentMonth) {
            option.selected = true;
        }
        
        monthSelect.appendChild(option);
    }
    
    // تحميل البيانات إذا كان الشهر الحالي محدد
    if (parseInt(selectedYear) === currentYear) {
        loadMonthlySummary();
    }
}

async function loadMonthlySummary() {
    const monthSelect = document.getElementById('monthSelect');
    const selectedMonth = monthSelect.value;
    
    if (!selectedMonth) {
        document.getElementById('monthlySales').textContent = '0.00 د.أ';
        document.getElementById('monthlyPurchases').textContent = '0.00 د.أ';
        document.getElementById('monthlyExpenses').textContent = '0.00 د.أ';
        document.getElementById('monthlyAssets').textContent = '0.00 د.أ';
        document.getElementById('monthlySalaries').textContent = '0.00 د.أ';
        document.getElementById('monthlyNetCash').textContent = '0.00 د.أ';
        document.getElementById('monthlyProfit').textContent = '0.00 د.أ';
        return;
    }
    
    try {
        if (!window.DB || !window.DB.supabase) return;
        
        const [year, month] = selectedMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        
        const { data, error } = await window.DB.supabase
            .from('daily_inventory')
            .select('*')
            .gte('inventory_date', startDate)
            .lte('inventory_date', endDate)
            .order('inventory_date', { ascending: true });
        
        if (error || !data || data.length === 0) {
            document.getElementById('monthlySales').textContent = '0.00 د.أ';
            document.getElementById('monthlyPurchases').textContent = '0.00 د.أ';
            document.getElementById('monthlyExpenses').textContent = '0.00 د.أ';
            document.getElementById('monthlyAssets').textContent = '0.00 د.أ';
            document.getElementById('monthlySalaries').textContent = '0.00 د.أ';
            document.getElementById('monthlyNetCash').textContent = '0.00 د.أ';
            document.getElementById('monthlyProfit').textContent = '0.00 د.أ';
            return;
        }
        
        // إعادة حساب المشتريات والمصاريف من purchase_items
        let totalSales = 0;
        let totalPurchases = 0;
        let totalExpenses = 0;
        let totalAssets = 0;
        let totalSalaries = 0;
        
        data.forEach(record => {
            totalSales += parseFloat(record.total_sales || 0);
            
            // إعادة حساب المشتريات والمصاريف من purchase_items
            if (record.purchase_items) {
                const items = record.purchase_items;
                Object.keys(items).forEach(itemName => {
                    const value = parseFloat(items[itemName]) || 0;
                    const mainCategory = getMainCategory(itemName);
                    const subCategory = getSubCategory(itemName);
                    
                    if (mainCategory === 'مصاريف') {
                        // المصاريف: الإتلاف + الضيافة + وجبات الموظفين
                        if (subCategory === 'الإتلاف' || 
                            subCategory === 'ضيافة' || 
                            (subCategory === 'رواتب وأجور' && itemName.includes('وجبات'))) {
                            totalExpenses += value;
                        }
                        // المشتريات: باقي المصاريف
                        else {
                            totalPurchases += value;
                            
                            // الرواتب
                            if (subCategory === 'رواتب وأجور' && !itemName.includes('وجبات')) {
                                totalSalaries += value;
                            }
                            // الأصول
                            else if (subCategory === 'أصول/أدوات') {
                                totalAssets += value;
                            }
                        }
                    } else if (mainCategory === 'المشتريات') {
                        totalPurchases += value;
                    }
                });
            }
        });
        
        // حساب الصافي النقدي والربح الشهري
        const totalNetCash = totalSales - totalPurchases;
        const totalProfit = totalNetCash - totalExpenses;
        
        document.getElementById('monthlySales').textContent = totalSales.toFixed(2) + ' د.أ';
        document.getElementById('monthlyPurchases').textContent = totalPurchases.toFixed(2) + ' د.أ';
        document.getElementById('monthlyExpenses').textContent = totalExpenses.toFixed(2) + ' د.أ';
        document.getElementById('monthlyAssets').textContent = totalAssets.toFixed(2) + ' د.أ';
        document.getElementById('monthlySalaries').textContent = totalSalaries.toFixed(2) + ' د.أ';
        document.getElementById('monthlyNetCash').textContent = totalNetCash.toFixed(2) + ' د.أ';
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
                plugins: { legend: { display: true, position: 'top' } }
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
                plugins: { legend: { display: false } }
            }
        });
    }
    
    const ctx3 = document.getElementById('distributionChart');
    if (ctx3) {
        charts.distribution = new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: ['المبيعات', 'المشتريات', 'الإتلاف', 'الرواتب'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#6366f1']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

async function updateCharts(period = 'last7', selectedMonth = null) {
    try {
        if (!window.DB || !window.DB.supabase) return;
        
        let query = window.DB.supabase
            .from('daily_inventory')
            .select('*')
            .order('inventory_date', { ascending: true });
        
        // تحديد الفترة الزمنية
        if (period === 'last7') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            query = query.gte('inventory_date', sevenDaysAgo.toISOString().split('T')[0]);
        } else if (period === 'last30') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query = query.gte('inventory_date', thirtyDaysAgo.toISOString().split('T')[0]);
        } else if (period === 'month' && selectedMonth) {
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
            query = query.gte('inventory_date', startDate).lte('inventory_date', endDate);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Error loading chart data:', error);
            return;
        }
        
        if (!data || data.length === 0) {
            // مسح الرسوم البيانية إذا لم تكن هناك بيانات
            if (charts.salesPurchases) {
                charts.salesPurchases.data.labels = [];
                charts.salesPurchases.data.datasets[0].data = [];
                charts.salesPurchases.data.datasets[1].data = [];
                charts.salesPurchases.update();
            }
            if (charts.profit) {
                charts.profit.data.labels = [];
                charts.profit.data.datasets[0].data = [];
                charts.profit.update();
            }
            return;
        }
        
        const labels = data.map(r => new Date(r.inventory_date).toLocaleDateString('ar-JO', { month: 'short', day: 'numeric' }));
        const sales = data.map(r => parseFloat(r.total_sales) || 0);
        const purchases = data.map(r => parseFloat(r.total_purchases) || 0);
        const profits = data.map(r => parseFloat(r.net_profit) || 0);
        
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
        
        // تحديث عناوين الرسوم البيانية
        updateChartTitles(period, selectedMonth);
        
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function updateChartTitles(period, selectedMonth) {
    const salesChartTitle = document.querySelector('.chart-container:nth-child(1) h3');
    const profitChartTitle = document.querySelector('.chart-container:nth-child(2) h3');
    
    let periodText = '';
    if (period === 'last7') {
        periodText = 'آخر 7 أيام';
    } else if (period === 'last30') {
        periodText = 'آخر 30 يوم';
    } else if (period === 'month' && selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        periodText = `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    
    if (salesChartTitle) {
        salesChartTitle.textContent = `المبيعات vs المشتريات (${periodText})`;
    }
    if (profitChartTitle) {
        profitChartTitle.textContent = `صافي الربح (${periodText})`;
    }
}

// ملء قائمة السنوات للرسوم البيانية
function populateChartYearSelect() {
    const select = document.getElementById('chartYearSelect');
    if (!select) return;
    
    const currentYear = new Date().getFullYear();
    select.innerHTML = '<option value="">اختر السنة</option>';
    
    // إضافة السنوات من 2024 إلى السنة الحالية + 2
    for (let year = 2024; year <= currentYear + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        select.appendChild(option);
    }
}

// ملء قائمة الأشهر للرسوم البيانية
function populateChartMonthSelect() {
    const yearSelect = document.getElementById('chartYearSelect');
    const monthSelect = document.getElementById('chartMonthSelect');
    if (!yearSelect || !monthSelect) return;
    
    const selectedYear = yearSelect.value;
    if (!selectedYear) {
        monthSelect.innerHTML = '<option value="">اختر السنة أولاً</option>';
        return;
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    monthSelect.innerHTML = '<option value="">اختر الشهر</option>';
    
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    // إضافة جميع الأشهر من 1-12
    for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        const value = `${selectedYear}-${monthStr}`;
        
        const option = document.createElement('option');
        option.value = value;
        option.textContent = `${monthNames[month - 1]} ${selectedYear}`;
        
        // تحديد الشهر الحالي تلقائياً
        if (parseInt(selectedYear) === currentYear && month === currentMonth) {
            option.selected = true;
        }
        
        monthSelect.appendChild(option);
    }
    
    // تحديث الرسوم إذا كان الشهر الحالي محدد
    if (parseInt(selectedYear) === currentYear) {
        updateChartsByMonth();
    }
}

function updateChartsByPeriod() {
    const periodSelect = document.getElementById('chartPeriodSelect');
    const yearSelect = document.getElementById('chartYearSelect');
    const monthSelect = document.getElementById('chartMonthSelect');
    
    if (periodSelect.value === 'month') {
        yearSelect.style.display = 'inline-block';
        monthSelect.style.display = 'inline-block';
        // تحديث قائمة الأشهر بناءً على السنة المحددة
        populateChartMonthSelect();
    } else {
        yearSelect.style.display = 'none';
        monthSelect.style.display = 'none';
        updateCharts(periodSelect.value);
    }
}

function updateChartsByMonth() {
    const monthSelect = document.getElementById('chartMonthSelect');
    const selectedMonth = monthSelect.value;
    
    if (selectedMonth) {
        updateCharts('month', selectedMonth);
    }
}

function updateDistributionChart(sales, purchases, damage, salaries) {
    if (charts.distribution) {
        charts.distribution.data.datasets[0].data = [sales, purchases, damage, salaries || 0];
        charts.distribution.update();
    }
}

async function initNotifications() {
    try {
        await refreshNotificationsPanel();
        await evaluateNotificationsNow();
    } catch (e) {}

    // Attach global handlers once
    if (!window.__notifHandlersAttached) {
        window.__notifHandlersAttached = true;
        document.addEventListener('click', function(e) {
            const panel = document.getElementById('notificationsPanel');
            const bell = document.getElementById('notificationsBell');
            if (!panel) return;
            const isOpen = panel.style.display === 'block';
            const clickInsidePanel = panel.contains(e.target);
            const clickOnBell = bell && bell.contains(e.target);
            if (isOpen && !clickInsidePanel && !clickOnBell) {
                closeNotificationsPanel();
            }
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeNotificationsPanel();
            }
        });
    }
}

function openNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (!panel) return;
    panel.style.display = 'block';
}

function closeNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (!panel) return;
    panel.style.display = 'none';
}

function toggleNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (!panel) return;
    if (panel.style.display === 'block') {
        closeNotificationsPanel();
    } else {
        openNotificationsPanel();
    }
}

function updateNotificationsBadge(count) {
    const badge = document.getElementById('notificationsBadge');
    if (!badge) return;
    if (!count || count <= 0) {
        badge.style.display = 'none';
        badge.textContent = '0';
    } else {
        badge.style.display = 'inline-block';
        badge.textContent = String(count);
    }
}

async function refreshNotificationsPanel() {
    if (!window.DB || !window.DB.supabase) return;
    const listEl = document.getElementById('notificationsList');
    if (!listEl) return;
    const { data, error } = await window.DB.supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) return;
    const unread = (data || []).filter(n => !n.is_read).length;
    updateNotificationsBadge(unread);
    listEl.innerHTML = (data || []).map(renderNotificationItem).join('') || '<div style="padding:12px; color:#6b7280;">لا توجد إشعارات</div>';
}

function renderNotificationItem(n) {
    const color = n.severity === 'critical' ? '#ef4444' : n.severity === 'warning' ? '#f59e0b' : '#10b981';
    const icon = n.severity === 'critical' ? '⛔' : n.severity === 'warning' ? '⚠️' : 'ℹ️';
    const bg = n.is_read ? '#ffffff' : '#f8fafc';
    const ts = new Date(n.created_at).toLocaleString('ar-JO');
    return `
      <div style="background:${bg}; border:1px solid #eef2f7; border-radius:12px; padding:12px; margin:10px 8px;">
        <div style="display:flex; gap:10px;">
          <div style="flex:0 0 auto; width:28px; height:28px; border-radius:8px; background:${color}1A; color:${color}; display:flex; align-items:center; justify-content:center; font-size:16px;">${icon}</div>
          <div style="flex:1 1 auto; min-width:0;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
              <div style="font-weight:800; color:#0f172a;">${n.title || ''}</div>
              <div style="font-size:12px; color:#64748b; white-space:nowrap;">${ts}</div>
            </div>
            <div style="margin-top:6px; color:#334155; line-height:1.5;">${n.message || ''}</div>
          </div>
        </div>
      </div>
    `;
}

async function markAllNotificationsRead() {
    if (!window.DB || !window.DB.supabase) return;
    await window.DB.supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    await refreshNotificationsPanel();
}

async function generateNotification(payload) {
    if (!window.DB || !window.DB.supabase) return;
    const n = {
        type: payload.type || 'info',
        title: payload.title || '',
        message: payload.message || '',
        severity: payload.severity || 'info',
        meta: payload.meta || {},
        is_read: false
    };
    await window.DB.supabase.from('notifications').insert(n);
}

async function evaluateNotificationsNow() {
    try {
        await checkSevenDaySalesTrend();
        await weeklyDigestLast7Days();
        await monthlyDigestForCurrentMonth();
        await refreshNotificationsPanel();
    } catch (e) {}
}

async function checkSevenDaySalesTrend() {
    if (!window.DB || !window.DB.supabase) return;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const since = startOfToday.toISOString();
    const exists = await hasRecentNotification('trend', since);
    if (exists) return;
    const d7 = new Date(); d7.setDate(today.getDate() - 7);
    const d14 = new Date(); d14.setDate(today.getDate() - 14);
    const { data: last7, error: e1 } = await window.DB.supabase
        .from('daily_inventory')
        .select('total_sales, inventory_date')
        .gte('inventory_date', d7.toISOString().split('T')[0])
        .lte('inventory_date', today.toISOString().split('T')[0]);
    const { data: prev7, error: e2 } = await window.DB.supabase
        .from('daily_inventory')
        .select('total_sales, inventory_date')
        .gte('inventory_date', d14.toISOString().split('T')[0])
        .lt('inventory_date', d7.toISOString().split('T')[0]);
    if (e1 || e2) return;
    const avg = arr => {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((s, r) => s + (parseFloat(r.total_sales) || 0), 0) / arr.length;
    };
    const a1 = avg(last7);
    const a2 = avg(prev7);
    if (a2 > 0) {
        const drop = (a2 - a1) / a2;
        const threshold = 0.2;
        if (drop >= threshold) {
            await generateNotification({
                type: 'trend',
                title: 'انخفاض المبيعات آخر 7 أيام',
                message: `انخفاض بنسبة ${(drop*100).toFixed(0)}% مقارنة بالأيام السبعة السابقة`,
                severity: 'warning',
                meta: { a1, a2 }
            });
        }
    }
}

async function monthlyDigestForCurrentMonth() {
    if (!window.DB || !window.DB.supabase) return;
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const start = `${y}-${m}-01`;
    const end = new Date(y, parseInt(m), 0).toISOString().split('T')[0];
    const exists = await hasRecentNotification('digest_monthly', new Date(y, parseInt(m)-1, 1).toISOString());
    if (exists) return;
    const { data, error } = await window.DB.supabase
        .from('daily_inventory')
        .select('*')
        .gte('inventory_date', start)
        .lte('inventory_date', end);
    if (error) return;
    const sum = (arr, key) => arr.reduce((s, r) => s + (parseFloat(r[key] || 0)), 0);
    const totalSales = sum(data || [], 'total_sales');
    const totalPurchases = sum(data || [], 'total_purchases');
    const totalDamage = sum(data || [], 'total_damage');
    const totalSalaries = sum(data || [], 'total_salaries');
    const totalProfit = sum(data || [], 'net_profit');
    const title = 'ملخص الشهر الحالي';
    const message = `مبيعات: ${totalSales.toFixed(2)} د.أ | مشتريات: ${totalPurchases.toFixed(2)} د.أ | إتلاف: ${totalDamage.toFixed(2)} د.أ | رواتب: ${totalSalaries.toFixed(2)} د.أ | صافي الربح: ${totalProfit.toFixed(2)} د.أ`;
    await generateNotification({ type: 'digest_monthly', title, message, severity: 'info', meta: { y, m } });
}

async function weeklyDigestLast7Days() {
    if (!window.DB || !window.DB.supabase) return;
    const today = new Date();
    const start = new Date(); start.setDate(today.getDate() - 6); start.setHours(0,0,0,0);
    const since = new Date(); since.setDate(today.getDate() - 6); since.setHours(0,0,0,0);
    const exists = await hasRecentNotification('digest_weekly', since.toISOString());
    if (exists) return;
    const { data, error } = await window.DB.supabase
        .from('daily_inventory')
        .select('*')
        .gte('inventory_date', start.toISOString().split('T')[0])
        .lte('inventory_date', today.toISOString().split('T')[0]);
    if (error) return;
    const sum = (arr, key) => arr.reduce((s, r) => s + (parseFloat(r[key] || 0)), 0);
    const totalSales = sum(data || [], 'total_sales');
    const totalPurchases = sum(data || [], 'total_purchases');
    const totalDamage = sum(data || [], 'total_damage');
    const totalSalaries = sum(data || [], 'total_salaries');
    const totalProfit = sum(data || [], 'net_profit');
    const title = 'ملخص آخر 7 أيام';
    const message = `مبيعات: ${totalSales.toFixed(2)} د.أ | مشتريات: ${totalPurchases.toFixed(2)} د.أ | إتلاف: ${totalDamage.toFixed(2)} د.أ | رواتب: ${totalSalaries.toFixed(2)} د.أ | صافي الربح: ${totalProfit.toFixed(2)} د.أ`;
    await generateNotification({ type: 'digest_weekly', title, message, severity: 'info', meta: { range: 'last7' } });
}

async function hasRecentNotification(type, sinceISO) {
    if (!window.DB || !window.DB.supabase) return false;
    const { data, error } = await window.DB.supabase
        .from('notifications')
        .select('id')
        .eq('type', type)
        .gte('created_at', sinceISO)
        .limit(1);
    if (error) return false;
    return Array.isArray(data) && data.length > 0;
}

function exportToExcel() {
    const date = document.getElementById('inventoryDate').value;
    const formattedDate = new Date(date).toLocaleDateString('ar-JO');
    
    const salesTotal = parseFloat(document.getElementById('totalSalesInput').value) || 0;
    
    const purchasesData = [];
    const expensesData = [];
    const assetsData = [];
    
    let totalPurchases = 0;
    let totalDamage = 0;
    let totalHospitality = 0;
    let totalEmployeeMeals = 0;
    let totalSalaries = 0;
    let totalAssets = 0;
    
    document.querySelectorAll('.expense-input').forEach(input => {
        const item = input.dataset.item;
        const value = parseFloat(input.value) || 0;
        if (value > 0) {
            // الحصول على التصنيف من قاعدة البيانات
            const mainCategory = getMainCategory(item);
            const subCategory = getSubCategory(item);
            
            // التصنيف حسب main_category و sub_category من قاعدة البيانات
            if (mainCategory === 'مصاريف') {
                if (subCategory === 'الإتلاف') {
                    totalDamage += value;
                    expensesData.push([item, value.toFixed(2)]);
                } else if (subCategory === 'ضيافة') {
                    totalHospitality += value;
                    expensesData.push([item, value.toFixed(2)]);
                } else if (subCategory === 'رواتب وأجور' && item.includes('وجبات')) {
                    totalEmployeeMeals += value;
                    expensesData.push([item, value.toFixed(2)]);
                } else if (subCategory === 'رواتب وأجور' && !item.includes('وجبات')) {
                    totalSalaries += value;
                    purchasesData.push([item, value.toFixed(2)]);
                } else if (subCategory === 'أصول/أدوات') {
                    totalAssets += value;
                    assetsData.push([item, value.toFixed(2)]);
                } else {
                    totalPurchases += value;
                    purchasesData.push([item, value.toFixed(2)]);
                }
            } else if (mainCategory === 'المشتريات') {
                totalPurchases += value;
                purchasesData.push([item, value.toFixed(2)]);
            } else {
                totalPurchases += value;
                purchasesData.push([item, value.toFixed(2)]);
            }
        }
    });
    
    const totalExpenses = totalDamage + totalHospitality + totalEmployeeMeals;
    const netCash = salesTotal - totalPurchases;
    const netProfit = netCash - totalExpenses;
    const notes = document.getElementById('inventoryNotes') ? document.getElementById('inventoryNotes').value : '';
    
    let csv = '\uFEFF';
    csv += `تقرير الجرد اليومي - ${formattedDate}\n\n`;
    
    csv += '=== المبيعات ===\n';
    csv += `إجمالي المبيعات:,${salesTotal.toFixed(2)} د.أ\n\n`;
    
    csv += '=== المشتريات ===\n';
    csv += 'الصنف,المبلغ\n';
    purchasesData.forEach(row => csv += row.join(',') + ' د.أ\n');
    csv += `المجموع:,${totalPurchases.toFixed(2)} د.أ\n\n`;
    
    csv += '=== المصاريف ===\n';
    csv += 'الصنف,المبلغ\n';
    expensesData.forEach(row => csv += row.join(',') + ' د.أ\n');
    csv += `المجموع:,${totalExpenses.toFixed(2)} د.أ\n`;
    csv += `  - الإتلاف:,${totalDamage.toFixed(2)} د.أ\n`;
    csv += `  - الضيافة:,${totalHospitality.toFixed(2)} د.أ\n`;
    csv += `  - وجبات الموظفين:,${totalEmployeeMeals.toFixed(2)} د.أ\n\n`;
    
    csv += '=== الأصول ===\n';
    csv += 'الصنف,المبلغ\n';
    assetsData.forEach(row => csv += row.join(',') + ' د.أ\n');
    csv += `المجموع:,${totalAssets.toFixed(2)} د.أ\n\n`;
    
    csv += '=== الملخص المالي ===\n';
    csv += `رواتب الموظفين:,${totalSalaries.toFixed(2)} د.أ\n`;
    csv += `الصافي النقدي:,${netCash.toFixed(2)} د.أ\n`;
    csv += `صافي الربح:,${netProfit.toFixed(2)} د.أ\n\n`;
    
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
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${month}-${String(daysInMonth).padStart(2, '0')}`;
        
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
        
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ar-JO', { month: 'long', year: 'numeric' });
        
        // تنظيم البيانات حسب التاريخ
        const dataByDate = {};
        if (data) {
            data.forEach(record => {
                const day = new Date(record.inventory_date).getDate();
                dataByDate[day] = record;
            });
        }
        
        // جمع جميع الأصناف من البيانات الفعلية
        const allItems = new Set();
        if (data) {
            data.forEach(record => {
                const purchases = record.purchase_items || {};
                Object.keys(purchases).forEach(item => allItems.add(item));
            });
        }
        
        const itemsArray = Array.from(allItems).sort();
        
        let csv = '\uFEFF';
        csv += `الجرد الشهري - ${monthName}\n\n`;
        
        // رأس الجدول
        csv += 'الصنف';
        for (let day = 1; day <= daysInMonth; day++) {
            csv += `,${day}`;
        }
        csv += ',المجموع الشهري\n';
        
        // صفوف المشتريات والمصاريف
        const itemTotals = {};
        itemsArray.forEach(item => {
            csv += `"${item}"`;
            let itemTotal = 0;
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dayData = dataByDate[day];
                let value = 0;
                
                if (dayData) {
                    const purchases = dayData.purchase_items || {};
                    value = purchases[item] || 0;
                }
                
                csv += `,${value > 0 ? value.toFixed(2) : ''}`;
                itemTotal += value;
            }
            
            csv += `,${itemTotal.toFixed(2)}\n`;
            itemTotals[item] = itemTotal;
        });
        
        csv += '\n';
        
        // صف المبيعات اليومية
        csv += 'المبيعات اليومية';
        let totalSales = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = dataByDate[day];
            const sales = dayData ? (dayData.total_sales || 0) : 0;
            csv += `,${sales > 0 ? sales.toFixed(2) : '-'}`;
            totalSales += sales;
        }
        csv += `,${totalSales.toFixed(2)}\n`;
        
        // صف إجمالي المشتريات اليومية (إعادة حساب من purchase_items)
        csv += 'إجمالي المشتريات';
        let totalPurchases = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = dataByDate[day];
            let dayPurchases = 0;
            
            if (dayData && dayData.purchase_items) {
                const items = dayData.purchase_items;
                Object.keys(items).forEach(itemName => {
                    const value = parseFloat(items[itemName]) || 0;
                    const mainCategory = getMainCategory(itemName);
                    const subCategory = getSubCategory(itemName);
                    
                    // المشتريات = كل شيء ما عدا (الإتلاف + الضيافة + وجبات الموظفين)
                    if (mainCategory === 'مصاريف') {
                        // استثناء الإتلاف والضيافة ووجبات الموظفين
                        if (subCategory !== 'الإتلاف' && 
                            subCategory !== 'ضيافة' && 
                            !(subCategory === 'رواتب وأجور' && itemName.includes('وجبات'))) {
                            dayPurchases += value;
                        }
                    } else if (mainCategory === 'المشتريات') {
                        dayPurchases += value;
                    }
                });
            }
            
            csv += `,${dayPurchases > 0 ? dayPurchases.toFixed(2) : '-'}`;
            totalPurchases += dayPurchases;
        }
        csv += `,${totalPurchases.toFixed(2)}\n`;
        
        // صف المصاريف اليومية (إعادة حساب من purchase_items)
        csv += 'إجمالي المصاريف';
        let totalExpenses = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = dataByDate[day];
            let dayExpenses = 0;
            
            if (dayData && dayData.purchase_items) {
                const items = dayData.purchase_items;
                Object.keys(items).forEach(itemName => {
                    const value = parseFloat(items[itemName]) || 0;
                    const mainCategory = getMainCategory(itemName);
                    const subCategory = getSubCategory(itemName);
                    
                    // المصاريف = الإتلاف + الضيافة + وجبات الموظفين
                    if (mainCategory === 'مصاريف') {
                        if (subCategory === 'الإتلاف' || 
                            subCategory === 'ضيافة' || 
                            (subCategory === 'رواتب وأجور' && itemName.includes('وجبات'))) {
                            dayExpenses += value;
                        }
                    }
                });
            }
            
            csv += `,${dayExpenses > 0 ? dayExpenses.toFixed(2) : '-'}`;
            totalExpenses += dayExpenses;
        }
        csv += `,${totalExpenses.toFixed(2)}\n`;
        
        // صف الأصول اليومية
        csv += 'إجمالي الأصول';
        let totalAssets = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = dataByDate[day];
            const assets = dayData ? (dayData.total_assets || 0) : 0;
            csv += `,${assets > 0 ? assets.toFixed(2) : '-'}`;
            totalAssets += assets;
        }
        csv += `,${totalAssets.toFixed(2)}\n`;
        
        // صف الرواتب اليومية
        csv += 'رواتب الموظفين';
        let totalSalaries = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = dataByDate[day];
            const salaries = dayData ? (dayData.total_salaries || 0) : 0;
            csv += `,${salaries > 0 ? salaries.toFixed(2) : '-'}`;
            totalSalaries += salaries;
        }
        csv += `,${totalSalaries.toFixed(2)}\n`;
        
        // صف الصافي النقدي اليومي (إعادة حساب)
        csv += 'الصافي النقدي';
        let totalNetCash = 0;
        const dailyPurchasesArray = []; // لحفظ المشتريات اليومية
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = dataByDate[day];
            const sales = dayData ? (dayData.total_sales || 0) : 0;
            let dayPurchases = 0;
            
            // إعادة حساب المشتريات لهذا اليوم
            if (dayData && dayData.purchase_items) {
                const items = dayData.purchase_items;
                Object.keys(items).forEach(itemName => {
                    const value = parseFloat(items[itemName]) || 0;
                    const mainCategory = getMainCategory(itemName);
                    const subCategory = getSubCategory(itemName);
                    
                    if (mainCategory === 'مصاريف') {
                        if (subCategory !== 'الإتلاف' && 
                            subCategory !== 'ضيافة' && 
                            !(subCategory === 'رواتب وأجور' && itemName.includes('وجبات'))) {
                            dayPurchases += value;
                        }
                    } else if (mainCategory === 'المشتريات') {
                        dayPurchases += value;
                    }
                });
            }
            
            dailyPurchasesArray[day] = dayPurchases;
            const netCash = sales - dayPurchases;
            csv += `,${netCash !== 0 ? netCash.toFixed(2) : '-'}`;
            totalNetCash += netCash;
        }
        csv += `,${totalNetCash.toFixed(2)}\n`;
        
        // صف صافي الربح اليومي (إعادة حساب)
        csv += 'صافي الربح';
        let totalProfit = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = dataByDate[day];
            const sales = dayData ? (dayData.total_sales || 0) : 0;
            const dayPurchases = dailyPurchasesArray[day] || 0;
            let dayExpenses = 0;
            
            // إعادة حساب المصاريف لهذا اليوم
            if (dayData && dayData.purchase_items) {
                const items = dayData.purchase_items;
                Object.keys(items).forEach(itemName => {
                    const value = parseFloat(items[itemName]) || 0;
                    const mainCategory = getMainCategory(itemName);
                    const subCategory = getSubCategory(itemName);
                    
                    if (mainCategory === 'مصاريف') {
                        if (subCategory === 'الإتلاف' || 
                            subCategory === 'ضيافة' || 
                            (subCategory === 'رواتب وأجور' && itemName.includes('وجبات'))) {
                            dayExpenses += value;
                        }
                    }
                });
            }
            
            const netCash = sales - dayPurchases;
            const profit = netCash - dayExpenses;
            csv += `,${profit !== 0 ? profit.toFixed(2) : '-'}`;
            totalProfit += profit;
        }
        csv += `,${totalProfit.toFixed(2)}\n`;
        
        csv += '\n';
        
        // الملخص الشهري
        csv += 'الملخص الشهري\n';
        csv += `إجمالي المبيعات الشهرية:,${totalSales.toFixed(2)} د.أ\n`;
        csv += `إجمالي المشتريات الشهرية:,${totalPurchases.toFixed(2)} د.أ\n`;
        csv += `إجمالي المصاريف الشهرية:,${totalExpenses.toFixed(2)} د.أ\n`;
        csv += `إجمالي الأصول الشهرية:,${totalAssets.toFixed(2)} د.أ\n`;
        csv += `إجمالي الرواتب الشهرية:,${totalSalaries.toFixed(2)} د.أ\n`;
        csv += `الصافي النقدي الشهري:,${totalNetCash.toFixed(2)} د.أ\n`;
        csv += `صافي الربح الشهري:,${totalProfit.toFixed(2)} د.أ\n`;
        
        csv += '\n\nتفاصيل المشتريات والمصاريف:\n';
        csv += 'الصنف,المجموع الشهري\n';
        itemsArray.forEach(item => {
            if (itemTotals[item] > 0) {
                csv += `"${item}",${itemTotals[item].toFixed(2)} د.أ\n`;
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
