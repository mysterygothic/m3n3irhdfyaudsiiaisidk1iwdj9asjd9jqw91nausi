/**
 * ========================================
 * Category Management System
 * نظام إدارة الفئات والمنتجات
 * ========================================
 */

let allCategories = [];
let currentEditingCategory = null;
let isCategoryManagementVisible = false;

/**
 * إظهار/إخفاء قسم إدارة الفئات
 */
function toggleCategoryManagement() {
    const section = document.getElementById('categoryManagementSection');
    isCategoryManagementVisible = !isCategoryManagementVisible;
    
    if (isCategoryManagementVisible) {
        section.style.display = 'block';
        // تحميل الفئات عند الإظهار لأول مرة
        if (allCategories.length === 0) {
            loadAllCategories();
        }
        // التمرير إلى القسم
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        section.style.display = 'none';
    }
}

/**
 * تحميل جميع الفئات عند فتح الصفحة
 */
async function loadAllCategories() {
    try {

        allCategories = await DB.getExpenseCategories();

        displayCategoriesTable();
        populateMainCategoryOptions();
    } catch (error) {

        showNotification('حدث خطأ في تحميل الفئات', 'error');
    }
}

/**
 * عرض الفئات في الجدول
 */
function displayCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    
    if (!allCategories || allCategories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">لا توجد فئات</td></tr>';
        return;
    }
    
    tbody.innerHTML = allCategories.map(cat => `
        <tr>
            <td><strong>${cat.main_category}</strong></td>
            <td>${cat.sub_category || '-'}</td>
            <td>${cat.item_name}</td>
            <td>${cat.display_order || 0}</td>
            <td>
                <button class="btn-icon btn-edit" onclick="editExpenseCategory(${cat.id})" title="تعديل">
                    
                </button>
                <button class="btn-icon btn-delete" onclick="confirmDeleteCategory(${cat.id})" title="حذف">
                    
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * تصفية الجدول حسب البحث والفلتر
 */
function filterCategoriesTable() {
    const searchTerm = document.getElementById('categorySearchInput').value.toLowerCase();
    const mainCategoryFilter = document.getElementById('mainCategoryFilter').value;
    
    let filtered = allCategories;
    
    // تصفية حسب الفئة الرئيسية
    if (mainCategoryFilter) {
        filtered = filtered.filter(cat => cat.main_category === mainCategoryFilter);
    }
    
    // تصفية حسب البحث
    if (searchTerm) {
        filtered = filtered.filter(cat => 
            cat.main_category.toLowerCase().includes(searchTerm) ||
            (cat.sub_category && cat.sub_category.toLowerCase().includes(searchTerm)) ||
            cat.item_name.toLowerCase().includes(searchTerm)
        );
    }
    
    // عرض النتائج
    const tbody = document.getElementById('categoriesTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">لا توجد نتائج</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(cat => `
        <tr>
            <td><strong>${cat.main_category}</strong></td>
            <td>${cat.sub_category || '-'}</td>
            <td>${cat.item_name}</td>
            <td>${cat.display_order || 0}</td>
            <td>
                <button class="btn-icon btn-edit" onclick="editExpenseCategory(${cat.id})" title="تعديل">
                    
                </button>
                <button class="btn-icon btn-delete" onclick="confirmDeleteCategory(${cat.id})" title="حذف">
                    
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * فتح نافذة إضافة فئة جديدة
 */
function showAddCategoryModal() {
    currentEditingCategory = null;
    document.getElementById('categoryModalTitle').textContent = ' إضافة فئة/منتج جديد';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('newMainCategoryGroup').style.display = 'none';
    document.getElementById('newSubCategoryGroup').style.display = 'none';
    document.getElementById('categoryModal').style.display = 'flex';
    populateMainCategoryOptions();
}

/**
 * تعديل فئة موجودة
 */
function editExpenseCategory(categoryId) {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) {
        showNotification('الفئة غير موجودة', 'error');
        return;
    }
    
    currentEditingCategory = category;
    document.getElementById('categoryModalTitle').textContent = ' تعديل فئة/منتج';
    document.getElementById('categoryId').value = category.id;
    document.getElementById('mainCategoryInput').value = category.main_category;
    document.getElementById('itemNameInput').value = category.item_name;
    document.getElementById('displayOrderInput').value = category.display_order || 0;
    
    // تحديث الفئات الفرعية
    updateSubCategoryOptions();
    
    // تعيين الفئة الفرعية
    setTimeout(() => {
        const subSelect = document.getElementById('subCategoryInput');
        const option = Array.from(subSelect.options).find(opt => opt.value === category.sub_category);
        if (option) {
            subSelect.value = category.sub_category;
        } else if (category.sub_category) {
            // إضافة الفئة الفرعية إذا لم تكن موجودة
            const newOption = new Option(category.sub_category, category.sub_category);
            subSelect.add(newOption);
            subSelect.value = category.sub_category;
        }
    }, 100);
    
    document.getElementById('categoryModal').style.display = 'flex';
}

/**
 * إغلاق نافذة الفئات
 */
function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
    currentEditingCategory = null;
}

/**
 * ملء خيارات الفئات الرئيسية
 */
function populateMainCategoryOptions() {
    const mainCategories = [...new Set(allCategories.map(c => c.main_category))];
    const select = document.getElementById('mainCategoryInput');
    
    // الاحتفاظ بالخيارات الافتراضية
    const defaultOptions = `
        <option value="">اختر الفئة الرئيسية</option>
        <option value="المشتريات">المشتريات</option>
        <option value="مصاريف">مصاريف</option>
    `;
    
    // إضافة الفئات الموجودة
    const existingOptions = mainCategories
        .filter(cat => cat !== 'المشتريات' && cat !== 'مصاريف')
        .map(cat => `<option value="${cat}">${cat}</option>`)
        .join('');
    
    select.innerHTML = defaultOptions + existingOptions + '<option value="new"> إضافة فئة رئيسية جديدة...</option>';
}

/**
 * تحديث خيارات الفئات الفرعية حسب الفئة الرئيسية
 */
function updateSubCategoryOptions() {
    const mainCategory = document.getElementById('mainCategoryInput').value;
    const newMainGroup = document.getElementById('newMainCategoryGroup');
    const subSelect = document.getElementById('subCategoryInput');
    
    // إظهار/إخفاء حقل الفئة الرئيسية الجديدة
    if (mainCategory === 'new') {
        newMainGroup.style.display = 'block';
        document.getElementById('newMainCategoryInput').required = true;
        subSelect.innerHTML = '<option value="">اختر الفئة الفرعية</option><option value="new"> إضافة فئة فرعية جديدة...</option>';
        return;
    } else {
        newMainGroup.style.display = 'none';
        document.getElementById('newMainCategoryInput').required = false;
    }
    
    if (!mainCategory) {
        subSelect.innerHTML = '<option value="">اختر الفئة الفرعية</option><option value="new"> إضافة فئة فرعية جديدة...</option>';
        return;
    }
    
    // الحصول على الفئات الفرعية للفئة الرئيسية المختارة
    const subCategories = [...new Set(
        allCategories
            .filter(c => c.main_category === mainCategory && c.sub_category)
            .map(c => c.sub_category)
    )];
    
    subSelect.innerHTML = '<option value="">اختر الفئة الفرعية</option>' +
        subCategories.map(sub => `<option value="${sub}">${sub}</option>`).join('') +
        '<option value="new"> إضافة فئة فرعية جديدة...</option>';
}

/**
 * التحقق من اختيار فئة فرعية جديدة
 */
function checkNewSubCategory() {
    const subCategory = document.getElementById('subCategoryInput').value;
    const newSubGroup = document.getElementById('newSubCategoryGroup');
    
    if (subCategory === 'new') {
        newSubGroup.style.display = 'block';
        document.getElementById('newSubCategoryInput').required = true;
    } else {
        newSubGroup.style.display = 'none';
        document.getElementById('newSubCategoryInput').required = false;
    }
}

/**
 * حفظ الفئة من النافذة
 */
async function saveCategoryFromModal(event) {
    event.preventDefault();
    
    try {
        let mainCategory = document.getElementById('mainCategoryInput').value;
        let subCategory = document.getElementById('subCategoryInput').value;
        const itemName = document.getElementById('itemNameInput').value.trim();
        const displayOrder = parseInt(document.getElementById('displayOrderInput').value) || 0;
        const categoryId = document.getElementById('categoryId').value;
        
        // التحقق من الفئة الرئيسية الجديدة
        if (mainCategory === 'new') {
            mainCategory = document.getElementById('newMainCategoryInput').value.trim();
            if (!mainCategory) {
                showNotification('يرجى إدخال اسم الفئة الرئيسية', 'error');
                return;
            }
        }
        
        // التحقق من الفئة الفرعية الجديدة
        if (subCategory === 'new') {
            subCategory = document.getElementById('newSubCategoryInput').value.trim();
            if (!subCategory) {
                showNotification('يرجى إدخال اسم الفئة الفرعية', 'error');
                return;
            }
        }
        
        if (!itemName) {
            showNotification('يرجى إدخال اسم المنتج', 'error');
            return;
        }
        
        // إنشاء كائن الفئة
        const category = {
            main_category: mainCategory,
            sub_category: subCategory,
            item_name: itemName,
            display_order: displayOrder
        };
        
        // إضافة ID إذا كان تعديل
        if (categoryId) {
            category.id = parseInt(categoryId);
        }
        
        // حفظ في قاعدة البيانات

        const saved = await DB.saveExpenseCategory(category);

        // تحديث القائمة
        await loadAllCategories();
        
        // إغلاق النافذة
        closeCategoryModal();
        
        // إظهار رسالة نجاح
        showNotification(categoryId ? ' تم تعديل الفئة بنجاح' : ' تم إضافة الفئة بنجاح', 'success');
        
        // إعادة تحميل قائمة المشتريات في الصفحة الرئيسية
        if (typeof loadPurchaseCategories === 'function') {
            await loadPurchaseCategories();
        }
        
    } catch (error) {

        showNotification('حدث خطأ في حفظ الفئة: ' + error.message, 'error');
    }
}

/**
 * تأكيد حذف الفئة
 */
function confirmDeleteCategory(categoryId) {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    if (confirm(`هل أنت متأكد من حذف:\n${category.main_category} > ${category.sub_category} > ${category.item_name}؟`)) {
        deleteCategory(categoryId);
    }
}

/**
 * حذف الفئة
 */
async function deleteCategory(categoryId) {
    try {

        await DB.deleteExpenseCategory(categoryId);

        // تحديث القائمة
        await loadAllCategories();
        
        // إظهار رسالة نجاح
        showNotification(' تم حذف الفئة بنجاح', 'success');
        
        // إعادة تحميل قائمة المشتريات في الصفحة الرئيسية
        if (typeof loadPurchaseCategories === 'function') {
            await loadPurchaseCategories();
        }
        
    } catch (error) {

        showNotification('حدث خطأ في حذف الفئة: ' + error.message, 'error');
    }
}

/**
 * إظهار إشعار
 */
function showNotification(message, type = 'info') {
    // استخدام نظام الإشعارات الموجود إذا كان متاحاً
    if (typeof showToast === 'function') {
        showToast(message, type);
        return;
    }
    
    // إشعار بسيط
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);33
}

// لا نحمل الفئات تلقائياً - فقط عند الضغط على زر الإدارة
// سيتم التحميل من خلال toggleCategoryManagement()

// تصدير الدوال للاستخدام العام
if (typeof window !== 'undefined') {
    window.toggleCategoryManagement = toggleCategoryManagement;
    window.showAddCategoryModal = showAddCategoryModal;
    window.editExpenseCategory = editExpenseCategory;
    window.confirmDeleteCategory = confirmDeleteCategory;
    window.closeCategoryModal = closeCategoryModal;
    window.saveCategoryFromModal = saveCategoryFromModal;
    window.filterCategoriesTable = filterCategoriesTable;
    window.updateSubCategoryOptions = updateSubCategoryOptions;
    window.checkNewSubCategory = checkNewSubCategory;
}

// إضافة أنيميشن CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        align-items: center;
        justify-content: center;
    }
    
    .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    /* Dark mode support for modal */
    body.dark-mode .modal-content {
        background: #1f2937;
        color: #f3f4f6;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    body.dark-mode .modal-header {
        border-bottom-color: #374151;
    }
    
    .modal-header h2 {
        margin: 0;
        font-size: 20px;
        color: #1f2937;
    }
    
    body.dark-mode .modal-header h2 {
        color: #f3f4f6;
    }
    
    .close-modal {
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #6b7280;
        line-height: 1;
        padding: 0;
        width: 32px;
        height: 32px;
    }
    
    .close-modal:hover {
        color: #ef4444;
    }
    
    body.dark-mode .close-modal {
        color: #9ca3af;
    }
    
    .modal-body {
        padding: 20px;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #374151;
    }
    
    body.dark-mode .form-group label {
        color: #f3f4f6;
    }
    
    .form-control {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        background: white;
        color: #1f2937;
    }
    
    body.dark-mode .form-control {
        background: #374151;
        border-color: #4b5563;
        color: #f3f4f6;
    }
    
    .form-control:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    body.dark-mode .form-control:focus {
        border-color: #818cf8;
        box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
    }
    
    .form-hint {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        color: #6b7280;
    }
    
    body.dark-mode .form-hint {
        color: #9ca3af;
    }
    
    .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 24px;
    }
    
    .btn-icon {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;
    }
    
    .btn-icon:hover {
        background: #f3f4f6;
    }
    
    .btn-edit:hover {
        background: #dbeafe;
    }
    
    .btn-delete:hover {
        background: #fee2e2;
    }
    
    .category-management-section {
        background: white;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        animation: fadeIn 0.3s ease;
    }
    
    body.dark-mode .category-management-section {
        background: #1f2937;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .categories-list-container h3 {
        margin-bottom: 16px;
        color: #1f2937;
    }
    
    body.dark-mode .categories-list-container h3 {
        color: #f3f4f6;
    }
    
    .search-filter-container {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
    }
    
    .filter-select {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        min-width: 200px;
        background: white;
        color: #1f2937;
    }
    
    body.dark-mode .filter-select {
        background: #374151;
        border-color: #4b5563;
        color: #f3f4f6;
    }
`;
document.head.appendChild(style);
