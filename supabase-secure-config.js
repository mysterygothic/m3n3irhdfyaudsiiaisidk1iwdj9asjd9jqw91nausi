// Secure Supabase Configuration
// This configuration uses Edge Functions to hide sensitive credentials
// The anon key is safe to expose - all admin operations go through Edge Functions

const SUPABASE_CONFIG = {
    // Public configuration - safe to expose
    URL: 'https://noooysoqieuuaogrhlty.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vb295c29xaWV1dWFvZ3JobHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTExMjgsImV4cCI6MjA3NjgyNzEyOH0.W9EexKNYoErZf_8DmiBv0KfvYKy-pbBlvC3lMVEf7Bc',
    
    // Edge Function URLs - all admin operations go through these
    EDGE_FUNCTIONS: {
        AUTH: 'https://noooysoqieuuaogrhlty.supabase.co/functions/v1/admin-auth',
        API: 'https://noooysoqieuuaogrhlty.supabase.co/functions/v1/admin-api'
    }
};

// Storage keys - exported globally for compatibility
const STORAGE_KEYS = {
    ADMIN_TOKEN: 'admin_token',
    ADMIN_USER: 'admin_user',
    ADMIN_USER_DATA: 'admin_user_data',
    MENU_DATA: 'menu_data',
    CATEGORIES: 'categories',
    RAMADAN_ORDERS: 'ramadan_orders',
    DRIVERS: 'drivers',
    CUSTOMERS: 'customers'
};

// Initialize Supabase client for public read-only operations
let supabaseClient = null;

async function initSupabase() {
    try {
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase JS library not loaded!');
            return null;
        }
        
        const { createClient } = window.supabase;
        supabaseClient = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
        
        console.log('✅ Supabase client initialized (read-only mode)');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        return null;
    }
}

// Get Supabase client for public read operations
function getSupabaseClient() {
    return supabaseClient;
}

// Secure API call helper - adds admin token to requests
async function secureApiCall(endpoint, options = {}) {
    const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    
    if (!token) {
        throw new Error('Not authenticated');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
        'apikey': SUPABASE_CONFIG.ANON_KEY,
        'x-admin-token': token,
        ...(options.headers || {})
    };
    
    const response = await fetch(`${SUPABASE_CONFIG.EDGE_FUNCTIONS.API}${endpoint}`, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }
    
    return response.json();
}

// Authentication functions
const SecureAuth = {
    // Login
    async login(username, password) {
        const response = await fetch(SUPABASE_CONFIG.EDGE_FUNCTIONS.AUTH, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
                'apikey': SUPABASE_CONFIG.ANON_KEY
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const userInfo = {
                username: result.username,
                role: result.role,
                fullName: result.fullName
            };
            
            localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, result.token);
            localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(userInfo));
            localStorage.setItem(STORAGE_KEYS.ADMIN_USER_DATA, JSON.stringify(userInfo)); // For permissions system
        }
        
        return result;
    },
    
    // Verify token
    async verify(token) {
        const response = await fetch(`${SUPABASE_CONFIG.EDGE_FUNCTIONS.AUTH}/verify`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
                'apikey': SUPABASE_CONFIG.ANON_KEY
            },
            body: JSON.stringify({ token })
        });
        
        return response.json();
    },
    
    // Logout
    async logout() {
        const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
        
        if (token) {
            await fetch(`${SUPABASE_CONFIG.EDGE_FUNCTIONS.AUTH}/logout`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
                    'apikey': SUPABASE_CONFIG.ANON_KEY
                },
                body: JSON.stringify({ token })
            });
        }
        
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_USER_DATA);
    },
    
    // Check if logged in
    isLoggedIn() {
        return !!localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    },
    
    // Get current user
    getCurrentUser() {
        const user = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
        return user ? JSON.parse(user) : null;
    }
};

// Secure API for admin operations
const SecureAPI = {
    // Orders
    orders: {
        async getAll() {
            return secureApiCall('/orders');
        },
        async create(orderData) {
            return secureApiCall('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
        },
        async update(orderId, orderData) {
            return secureApiCall(`/orders/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify(orderData)
            });
        },
        async delete(orderId) {
            return secureApiCall(`/orders/${orderId}`, {
                method: 'DELETE'
            });
        }
    },
    
    // Drivers
    drivers: {
        async getAll() {
            return secureApiCall('/drivers');
        },
        async create(driverData) {
            return secureApiCall('/drivers', {
                method: 'POST',
                body: JSON.stringify(driverData)
            });
        },
        async update(driverId, driverData) {
            return secureApiCall(`/drivers/${driverId}`, {
                method: 'PUT',
                body: JSON.stringify(driverData)
            });
        },
        async delete(driverId) {
            return secureApiCall(`/drivers/${driverId}`, {
                method: 'DELETE'
            });
        }
    },
    
    // Customers
    customers: {
        async getAll() {
            return secureApiCall('/customers');
        },
        async createOrUpdate(customerData) {
            return secureApiCall('/customers', {
                method: 'POST',
                body: JSON.stringify(customerData)
            });
        }
    },
    
    // Menu Items
    menu: {
        async create(itemData) {
            return secureApiCall('/menu', {
                method: 'POST',
                body: JSON.stringify(itemData)
            });
        },
        async update(itemId, itemData) {
            return secureApiCall(`/menu/${itemId}`, {
                method: 'PUT',
                body: JSON.stringify(itemData)
            });
        },
        async delete(itemId) {
            return secureApiCall(`/menu/${itemId}`, {
                method: 'DELETE'
            });
        }
    },
    
    // Inventory
    inventory: {
        async get(date = null) {
            const endpoint = date ? `/inventory?date=${date}` : '/inventory';
            return secureApiCall(endpoint);
        },
        async save(inventoryData) {
            return secureApiCall('/inventory', {
                method: 'POST',
                body: JSON.stringify(inventoryData)
            });
        },
        async verifyPassword(password) {
            return secureApiCall('/inventory/verify-password', {
                method: 'POST',
                body: JSON.stringify({ password })
            });
        }
    },
    
    // Admin Users
    adminUsers: {
        async getAll() {
            return secureApiCall('/admin-users');
        },
        async create(userData) {
            return secureApiCall('/admin-users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },
        async update(userId, userData) {
            return secureApiCall(`/admin-users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        },
        async delete(userId) {
            return secureApiCall(`/admin-users/${userId}`, {
                method: 'DELETE'
            });
        }
    }
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.SUPABASE_SECURE = {
        config: SUPABASE_CONFIG,
        init: initSupabase,
        getClient: getSupabaseClient,
        auth: SecureAuth,
        api: SecureAPI
    };
    
    // Export STORAGE_KEYS globally for compatibility with existing code
    window.STORAGE_KEYS = STORAGE_KEYS;
}

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
});
