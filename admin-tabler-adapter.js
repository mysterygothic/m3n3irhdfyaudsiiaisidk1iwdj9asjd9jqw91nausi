/**
 * Tabler UI Adapter for Admin Dashboard
 * This file adapts the existing admin-secure.js functions to work with Tabler UI structure
 */

// Override loadMenuItems to render Tabler cards
window.originalLoadMenuItems = window.loadMenuItems;
window.loadMenuItems = async function() {
    const menuData = await getMenuData();
    const categories = await getCategories();
    const grid = document.getElementById('adminMenuItems');
    
    if (!grid) return;
    
    // Filter items
    const filteredItems = currentMenuFilter === 'all' 
        ? menuData 
        : menuData.filter(item => item.category === currentMenuFilter);
    
    if (filteredItems.length === 0) {
        grid.innerHTML = '<div class="col-12"><div class="empty"><p class="empty-title">لا توجد أصناف</p></div></div>';
        return;
    }
    
    grid.innerHTML = filteredItems.map(item => `
        <div class="card menu-item-card">
            <img src="${item.image || 'placeholder.jpg'}" class="card-img-top menu-item-image" alt="${item.name}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h3 class="card-title mb-0">${item.name}</h3>
                    <span class="badge bg-primary">${getCategoryName(item.category, categories)}</span>
                </div>
                <p class="text-muted mb-2">${item.description}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="h3 mb-0 text-success">${item.basePrice} د.ل</span>
                    <div class="btn-list">
                        <button class="btn btn-sm btn-primary" onclick="editMenuItem('${item.id}')">
                            <i class="ti ti-edit icon"></i>
                            تعديل
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteMenuItem('${item.id}')">
                            <i class="ti ti-trash icon"></i>
                            حذف
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Update category filter buttons
    updateCategoryFilterButtons(categories);
};

// Helper function to get category name
function getCategoryName(categoryValue, categories) {
    const cat = categories.find(c => c.value === categoryValue);
    return cat ? cat.name : categoryValue;
}

// Update category filter buttons for Tabler
function updateCategoryFilterButtons(categories) {
    const filterContainer = document.getElementById('categoryFilterButtons');
    if (!filterContainer) return;
    
    const allButton = filterContainer.querySelector('.btn:first-child');
    if (allButton) {
        allButton.outerHTML = `<button class="btn btn-outline-primary ${currentMenuFilter === 'all' ? 'active' : ''}" onclick="filterMenuItems('all')">الكل</button>`;
    }
    
    const categoryButtons = categories.map(cat => `
        <button class="btn btn-outline-primary ${currentMenuFilter === cat.value ? 'active' : ''}" 
                onclick="filterMenuItems('${cat.value}')">
            ${cat.name}
        </button>
    `).join('');
    
    filterContainer.innerHTML = `
        <button class="btn btn-outline-primary ${currentMenuFilter === 'all' ? 'active' : ''}" onclick="filterMenuItems('all')">الكل</button>
        ${categoryButtons}
    `;
}

// Override loadCategories to render Tabler cards
window.originalLoadCategories = window.loadCategories;
window.loadCategories = async function() {
    const categories = await getCategories();
    const list = document.getElementById('categoriesList');
    
    if (!list) return;
    
    if (categories.length === 0) {
        list.innerHTML = '<div class="col-12"><div class="empty"><p class="empty-title">لا توجد فئات</p></div></div>';
        return;
    }
    
    list.innerHTML = categories.map(cat => `
        <div class="card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h3 class="card-title mb-1">${cat.name}</h3>
                        <p class="text-muted mb-0"><code>${cat.value}</code></p>
                    </div>
                    <div class="btn-list">
                        <button class="btn btn-sm btn-primary" onclick="editCategory('${cat.id}')">
                            <i class="ti ti-edit icon"></i>
                            تعديل
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat.id}')">
                            <i class="ti ti-trash icon"></i>
                            حذف
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
};

// Override filterMenuItems to work with Tabler buttons
window.originalFilterMenuItems = window.filterMenuItems;
window.filterMenuItems = function(category) {
    currentMenuFilter = category;
    
    // Update button states
    document.querySelectorAll('#categoryFilterButtons .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Reload items
    loadMenuItems();
};

// Override showAdminSection for Tabler structure
window.originalShowAdminSection = window.showAdminSection;
window.showAdminSection = function(sectionId) {
    // This is handled by the showSection function in the HTML
    // Just update nav items
    document.querySelectorAll('.navbar-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (event && event.target) {
        const navItem = event.target.closest('.nav-item');
        if (navItem) {
            navItem.classList.add('active');
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Load initial data
    await loadMenuItems();
    await loadCategories();
    
    // Populate category dropdowns in modals
    const categories = await getCategories();
    const itemCategorySelect = document.getElementById('itemCategory');
    if (itemCategorySelect) {
        itemCategorySelect.innerHTML = categories.map(cat => 
            `<option value="${cat.value}">${cat.name}</option>`
        ).join('');
    }
    
    // Setup form submissions
    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', handleItemFormSubmit);
    }
    
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    }
});

// Handle item form submission
async function handleItemFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const itemId = formData.get('itemId');
    
    const itemData = {
        id: itemId || Date.now().toString(),
        name: formData.get('itemName'),
        category: formData.get('itemCategory'),
        description: formData.get('itemDescription'),
        basePrice: parseFloat(formData.get('itemBasePrice')),
        image: '', // Handle image upload separately
        imageMeat: '',
        chickenQuantityOptions: getQuantityOptions('chicken'),
        meatQuantityOptions: getQuantityOptions('meat')
    };
    
    // Handle image uploads
    const imageFile = document.getElementById('itemImage').files[0];
    if (imageFile) {
        itemData.image = await convertImageToBase64(imageFile);
    }
    
    const imageMeatFile = document.getElementById('itemImageMeat').files[0];
    if (imageMeatFile) {
        itemData.imageMeat = await convertImageToBase64(imageMeatFile);
    }
    
    // Save to database
    const menuData = await getMenuData();
    
    if (itemId) {
        // Update existing item
        const index = menuData.findIndex(item => item.id === itemId);
        if (index !== -1) {
            menuData[index] = { ...menuData[index], ...itemData };
        }
    } else {
        // Add new item
        menuData.push(itemData);
    }
    
    await saveMenuData(menuData);
    await loadMenuItems();
    
    closeItemModal();
    
    // Show success message using Tabler toast (if available)
    showToast('success', itemId ? 'تم تحديث الصنف بنجاح' : 'تم إضافة الصنف بنجاح');
}

// Handle category form submission
async function handleCategoryFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const categoryId = formData.get('categoryId');
    
    const categoryData = {
        id: categoryId || Date.now().toString(),
        name: formData.get('categoryName'),
        value: formData.get('categoryValue')
    };
    
    const categories = await getCategories();
    
    if (categoryId) {
        // Update existing category
        const index = categories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
            categories[index] = categoryData;
        }
    } else {
        // Add new category
        categories.push(categoryData);
    }
    
    await saveCategories(categories);
    await loadCategories();
    await loadMenuItems(); // Refresh menu items to update category names
    
    closeCategoryModal();
    
    showToast('success', categoryId ? 'تم تحديث الفئة بنجاح' : 'تم إضافة الفئة بنجاح');
}

// Helper function to get quantity options from form
function getQuantityOptions(type) {
    const container = document.getElementById(`${type}QuantityOptions`);
    if (!container) return [];
    
    const rows = container.querySelectorAll('.quantity-option-row');
    const options = [];
    
    rows.forEach(row => {
        const label = row.querySelector(`.${type}-qty-label`)?.value;
        const value = row.querySelector(`.${type}-qty-value`)?.value;
        const price = row.querySelector(`.${type}-qty-price`)?.value;
        
        if (label && value && price) {
            options.push({ label, value, price: parseFloat(price) });
        }
    });
    
    return options;
}

// Helper function to convert image to base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Show toast notification (Tabler-style)
function showToast(type, message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible`;
    toast.setAttribute('role', 'alert');
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    
    toast.innerHTML = `
        <div class="d-flex">
            <div>
                <i class="ti ti-${type === 'success' ? 'check' : 'alert-circle'} icon alert-icon"></i>
            </div>
            <div>${message}</div>
        </div>
        <a class="btn-close" data-bs-dismiss="alert" aria-label="close"></a>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Export menu file function
async function exportMenuFile() {
    const menuData = await getMenuData();
    const categories = await getCategories();
    
    const fileContent = `// Auto-generated menu data
const menuData = ${JSON.stringify(menuData, null, 2)};

const categories = ${JSON.stringify(categories, null, 2)};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { menuData, categories };
}
`;
    
    const blob = new Blob([fileContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'food-menu.js';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('success', 'تم تصدير الملف بنجاح');
}

console.log('✅ Tabler UI Adapter loaded successfully');
