// Admin Users Management
let users = [];
let deleteUserId = null;

document.addEventListener('DOMContentLoaded', async function() {
    if (document.getElementById('usersTableBody')) {
        await loadUsers();
        await updateUserStats();
    }
});

async function loadUsers() {
    try {
        users = await window.DB.getAdminUsers();
        renderUsersTable();
    } catch (error) {
        console.error('Error loading users:', error);
        users = [];
        renderUsersTable();
    }
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">لا يوجد مستخدمين</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map((user, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.full_name || user.fullName || '-'}</td>
            <td><span class="badge ${getRoleBadgeClass(user.role)}">${getRoleText(user.role)}</span></td>
            <td><span class="badge ${user.is_active || user.isActive ? 'badge-delivery' : 'badge-pickup'}">${user.is_active || user.isActive ? 'نشط' : 'غير نشط'}</span></td>
            <td>${formatDate(user.created_at || user.createdAt)}</td>
            <td>
                <button class="action-btn edit-order-btn" onclick="openEditUserModal(${user.id})" title="تعديل">✏️</button>
                <button class="action-btn delete-order-btn" onclick="openDeleteUserModal(${user.id})" title="حذف">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function getRoleBadgeClass(role) {
    return role === 'super_admin' ? 'badge-delivery' : 'badge-pickup';
}

function getRoleText(role) {
    return role === 'super_admin' ? 'مدير عام' : 'مشرف';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-JO');
}

async function updateUserStats() {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active || u.isActive).length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activeUsers').textContent = activeUsers;
}

function openAddUserModal() {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    
    document.getElementById('userModalTitle').textContent = 'إضافة مستخدم جديد';
    form.reset();
    document.getElementById('userId').value = '';
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function openEditUserModal(userId) {
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('المستخدم غير موجود');
        return;
    }
    
    const modal = document.getElementById('userModal');
    
    document.getElementById('userModalTitle').textContent = 'تعديل المستخدم';
    document.getElementById('userId').value = user.id;
    document.getElementById('username').value = user.username;
    document.getElementById('password').value = user.password_hash || user.passwordHash || '';
    document.getElementById('fullName').value = user.full_name || user.fullName || '';
    document.getElementById('role').value = user.role || 'admin';
    document.getElementById('isActive').value = String(user.is_active !== undefined ? user.is_active : user.isActive);
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

document.addEventListener('DOMContentLoaded', function() {
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveUser();
        });
    }
});

async function saveUser() {
    const userId = document.getElementById('userId').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('fullName').value;
    const role = document.getElementById('role').value;
    const isActive = document.getElementById('isActive').value === 'true';
    
    if (!username || !password) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    const userData = {
        username: username,
        password: password,
        fullName: fullName,
        role: role,
        is_active: isActive
    };
    
    if (userId) {
        userData.id = parseInt(userId);
    }
    
    try {
        // Save to Supabase
        await window.DB.saveAdminUser(userData);
        
        // Sync to Cloudflare Worker
        if (typeof syncUserToWorker === 'function') {
            const workerSynced = await syncUserToWorker({
                username: username,
                password: password,
                role: role
            });
            
            if (workerSynced) {
                console.log('✅ تمت مزامنة المستخدم مع Cloudflare Worker');
            } else {
                console.warn('⚠️ تم حفظ المستخدم في Supabase فقط (Worker غير متاح)');
            }
        }
        
        closeUserModal();
        await loadUsers();
        await updateUserStats();
        
        alert(userId ? '✅ تم تحديث المستخدم بنجاح!' : '✅ تم إضافة المستخدم بنجاح!');
    } catch (error) {
        console.error('Error saving user:', error);
        alert('❌ حدث خطأ في حفظ المستخدم');
    }
}

function openDeleteUserModal(userId) {
    deleteUserId = userId;
    const modal = document.getElementById('deleteUserModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeDeleteUserModal() {
    deleteUserId = null;
    const modal = document.getElementById('deleteUserModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function confirmDeleteUser() {
    if (!deleteUserId) return;
    
    try {
        // Get user info before deleting
        const user = users.find(u => u.id === deleteUserId);
        const username = user ? user.username : null;
        
        // Delete from Supabase
        await window.DB.deleteAdminUser(deleteUserId);
        
        // Delete from Cloudflare Worker
        if (username && typeof deleteUserFromWorker === 'function') {
            const workerDeleted = await deleteUserFromWorker(username);
            
            if (workerDeleted) {
                console.log('✅ تم حذف المستخدم من Cloudflare Worker');
            } else {
                console.warn('⚠️ تم حذف المستخدم من Supabase فقط (Worker غير متاح)');
            }
        }
        
        closeDeleteUserModal();
        await loadUsers();
        await updateUserStats();
        
        alert('✅ تم حذف المستخدم بنجاح');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('❌ حدث خطأ في حذف المستخدم');
    }
}

window.onclick = function(event) {
    const userModal = document.getElementById('userModal');
    const deleteModal = document.getElementById('deleteUserModal');
    
    if (event.target === userModal) {
        closeUserModal();
    }
    if (event.target === deleteModal) {
        closeDeleteUserModal();
    }
};

