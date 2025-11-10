// Delivery & Drivers Management
let drivers = [];
let deleteDriverId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    if (document.getElementById('driversTableBody')) {
        await loadDrivers();
        await updateDriverStats();
    }
});

// ========== LOAD DRIVERS ==========

async function loadDrivers() {
    try {
        drivers = await window.DB.getDrivers();
        renderDriversTable();
    } catch (error) {
        console.error('Error loading drivers:', error);
        drivers = [];
        renderDriversTable();
    }
}

function renderDriversTable() {
    const tbody = document.getElementById('driversTableBody');
    
    if (!drivers || drivers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">لا يوجد سائقين</td></tr>';
        return;
    }
    
    tbody.innerHTML = drivers.map((driver, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${driver.name}</td>
            <td>${driver.phone_number || driver.phoneNumber || '-'}</td>
            <td>${driver.vehicle_type || driver.vehicleType || '-'}</td>
            <td>${driver.vehicle_plate || driver.vehiclePlate || '-'}</td>
            <td><span class="badge ${getStatusBadgeClass(driver.status)}">${getStatusText(driver.status)}</span></td>
            <td>${driver.notes || '-'}</td>
            <td>
                <button class="action-btn edit-order-btn" onclick="openEditDriverModal(${driver.id})" title="تعديل">✏️</button>
                <button class="action-btn delete-order-btn" onclick="openDeleteDriverModal(${driver.id})" title="حذف">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'active': return 'badge-delivery';
        case 'inactive': return 'badge-pickup';
        case 'on_leave': return 'badge-duplicate';
        default: return '';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'active': return 'نشط';
        case 'inactive': return 'غير نشط';
        case 'on_leave': return 'في إجازة';
        default: return status;
    }
}

// ========== UPDATE STATS ==========

async function updateDriverStats() {
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.status === 'active').length;
    
    // Get delivery orders from Ramadan orders
    let deliveryOrdersCount = 0;
    try {
        const orders = await window.DB.getRamadanOrders();
        deliveryOrdersCount = orders.filter(o => o.deliveryType === 'توصيل').length;
    } catch (error) {
        console.error('Error getting delivery orders:', error);
    }
    
    document.getElementById('totalDrivers').textContent = totalDrivers;
    document.getElementById('activeDrivers').textContent = activeDrivers;
    document.getElementById('deliveryOrders').textContent = deliveryOrdersCount;
}

// ========== ADD DRIVER MODAL ==========

function openAddDriverModal() {
    const modal = document.getElementById('driverModal');
    const modalTitle = document.getElementById('driverModalTitle');
    const form = document.getElementById('driverForm');
    
    modalTitle.textContent = 'إضافة سائق جديد';
    form.reset();
    document.getElementById('driverId').value = '';
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeDriverModal() {
    const modal = document.getElementById('driverModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ========== EDIT DRIVER MODAL ==========

async function openEditDriverModal(driverId) {
    const driver = drivers.find(d => d.id === driverId);
    
    if (!driver) {
        alert('السائق غير موجود');
        return;
    }
    
    const modal = document.getElementById('driverModal');
    const modalTitle = document.getElementById('driverModalTitle');
    
    modalTitle.textContent = 'تعديل بيانات السائق';
    document.getElementById('driverId').value = driver.id;
    document.getElementById('driverName').value = driver.name;
    document.getElementById('driverPhone').value = driver.phone_number || driver.phoneNumber || '';
    document.getElementById('vehicleType').value = driver.vehicle_type || driver.vehicleType || 'سيارة';
    document.getElementById('vehiclePlate').value = driver.vehicle_plate || driver.vehiclePlate || '';
    document.getElementById('driverStatus').value = driver.status || 'active';
    document.getElementById('driverNotes').value = driver.notes || '';
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// ========== SAVE DRIVER ==========

document.addEventListener('DOMContentLoaded', function() {
    const driverForm = document.getElementById('driverForm');
    if (driverForm) {
        driverForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveDriver();
        });
    }
});

async function saveDriver() {
    const driverId = document.getElementById('driverId').value;
    const name = document.getElementById('driverName').value;
    const phoneNumber = document.getElementById('driverPhone').value;
    const vehicleType = document.getElementById('vehicleType').value;
    const vehiclePlate = document.getElementById('vehiclePlate').value;
    const status = document.getElementById('driverStatus').value;
    const notes = document.getElementById('driverNotes').value;
    
    if (!name || !phoneNumber) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    const driverData = {
        name: name,
        phoneNumber: phoneNumber,
        vehicleType: vehicleType,
        vehiclePlate: vehiclePlate,
        status: status,
        notes: notes
    };
    
    if (driverId) {
        driverData.id = parseInt(driverId);
    }
    
    try {
        await window.DB.saveDriver(driverData);
        
        closeDriverModal();
        await loadDrivers();
        await updateDriverStats();
        
        alert(driverId ? '✅ تم تحديث بيانات السائق بنجاح!' : '✅ تم إضافة السائق بنجاح!');
    } catch (error) {
        console.error('Error saving driver:', error);
        alert('❌ حدث خطأ في حفظ بيانات السائق');
    }
}

// ========== DELETE DRIVER ==========

function openDeleteDriverModal(driverId) {
    deleteDriverId = driverId;
    const modal = document.getElementById('deleteDriverModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeDeleteDriverModal() {
    deleteDriverId = null;
    const modal = document.getElementById('deleteDriverModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function confirmDeleteDriver() {
    if (!deleteDriverId) return;
    
    try {
        await window.DB.deleteDriver(deleteDriverId);
        
        closeDeleteDriverModal();
        await loadDrivers();
        await updateDriverStats();
        
        alert('✅ تم حذف السائق بنجاح');
    } catch (error) {
        console.error('Error deleting driver:', error);
        alert('❌ حدث خطأ في حذف السائق');
    }
}

// ========== CLOSE MODALS ON OUTSIDE CLICK ==========

window.onclick = function(event) {
    const driverModal = document.getElementById('driverModal');
    const deleteModal = document.getElementById('deleteDriverModal');
    
    if (event.target === driverModal) {
        closeDriverModal();
    }
    if (event.target === deleteModal) {
        closeDeleteDriverModal();
    }
};

