// حماية ثانوية لصفحة الجرد
// Second Authentication for Inventory Page

(function() {
    'use strict';
    
    const INVENTORY_AUTH_KEY = 'inventory_second_auth';
    const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    
    // Check if this is the inventory page
    function isInventoryPage() {
        const path = window.location.pathname;
        return path.includes('admin-inventory.html');
    }
    
    // Check if second auth is valid
    function isSecondAuthValid() {
        const authData = localStorage.getItem(INVENTORY_AUTH_KEY);
        if (!authData) return false;
        
        try {
            const data = JSON.parse(authData);
            const now = Date.now();
            
            // Check if session is still valid
            if (data.timestamp && (now - data.timestamp) < SESSION_DURATION) {
                return true;
            }
        } catch (e) {

        }
        
        return false;
    }
    
    // Verify password with Supabase via secure Edge Function
    async function verifySecondPassword(password) {
        try {
            if (!window.SUPABASE_SECURE || !window.SUPABASE_SECURE.api) {

                return false;
            }
            
            // Use the secure API to verify inventory password
            const result = await window.SUPABASE_SECURE.api.inventory.verifyPassword(password);
            
            return result.success && result.valid;
        } catch (error) {

            return false;
        }
    }
    
    // Show authentication modal
    function showAuthModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="inventoryAuthModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                backdrop-filter: blur(10px);
            ">
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                ">
                    <div style="
                        font-size: 60px;
                        margin-bottom: 20px;
                    "></div>
                    
                    <h2 style="
                        color: white;
                        font-family: 'IBM Plex Sans Arabic', sans-serif;
                        margin-bottom: 10px;
                        font-size: 24px;
                    ">حماية إضافية</h2>
                    
                    <p style="
                        color: rgba(255, 255, 255, 0.8);
                        font-family: 'IBM Plex Sans Arabic', sans-serif;
                        margin-bottom: 30px;
                        font-size: 14px;
                    ">يرجى إدخال كلمة المرور الثانوية للوصول إلى صفحة الجرد</p>
                    
                    <input 
                        type="password" 
                        id="inventorySecondPassword" 
                        placeholder="كلمة المرور الثانوية"
                        style="
                            width: 100%;
                            padding: 15px;
                            border: 2px solid rgba(255, 255, 255, 0.3);
                            border-radius: 10px;
                            font-size: 16px;
                            font-family: 'IBM Plex Sans Arabic', sans-serif;
                            background: rgba(255, 255, 255, 0.1);
                            color: white;
                            text-align: center;
                            margin-bottom: 10px;
                            box-sizing: border-box;
                        "
                        autocomplete="off"
                    />
                    
                    <div id="inventoryAuthError" style="
                        color: #ff6b6b;
                        font-family: 'IBM Plex Sans Arabic', sans-serif;
                        margin-bottom: 20px;
                        font-size: 14px;
                        min-height: 20px;
                        font-weight: 600;
                    "></div>
                    
                    <button id="inventoryAuthSubmit" style="
                        width: 100%;
                        padding: 15px;
                        background: white;
                        color: #667eea;
                        border: none;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: 700;
                        font-family: 'IBM Plex Sans Arabic', sans-serif;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    ">
                        تأكيد
                    </button>
                    
                    <button id="inventoryAuthCancel" style="
                        width: 100%;
                        padding: 15px;
                        background: transparent;
                        color: white;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-radius: 10px;
                        font-size: 14px;
                        font-weight: 600;
                        font-family: 'IBM Plex Sans Arabic', sans-serif;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        margin-top: 10px;
                    ">
                        إلغاء والعودة
                    </button>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('inventoryAuthModal');
        const passwordInput = document.getElementById('inventorySecondPassword');
        const submitBtn = document.getElementById('inventoryAuthSubmit');
        const cancelBtn = document.getElementById('inventoryAuthCancel');
        const errorDiv = document.getElementById('inventoryAuthError');
        
        // Focus on input
        setTimeout(() => passwordInput.focus(), 100);
        
        // Handle submit
        async function handleSubmit() {
            const password = passwordInput.value.trim();
            
            if (!password) {
                errorDiv.textContent = 'الرجاء إدخال كلمة المرور';
                return;
            }
            
            submitBtn.textContent = 'جاري التحقق...';
            submitBtn.disabled = true;
            errorDiv.textContent = '';
            
            const isValid = await verifySecondPassword(password);
            
            if (isValid) {
                // Save auth session
                localStorage.setItem(INVENTORY_AUTH_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    verified: true
                }));
                
                // Remove modal
                modal.remove();
                
                // Show page content
                if (document.body) {
                    document.body.style.removeProperty('display');
                }
            } else {
                errorDiv.textContent = ' كلمة المرور غير صحيحة';
                submitBtn.textContent = 'تأكيد';
                submitBtn.disabled = false;
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
        
        // Handle cancel
        function handleCancel() {
            window.location.href = 'admin-dashboard.html';
        }
        
        // Event listeners
        submitBtn.addEventListener('click', handleSubmit);
        cancelBtn.addEventListener('click', handleCancel);
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        });
        
        // Hover effects
        submitBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
        });
        submitBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        });
        
        cancelBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        cancelBtn.addEventListener('mouseleave', function() {
            this.style.background = 'transparent';
        });
    }
    
    // Initialize guard
    function init() {
        if (!isInventoryPage()) {
            return;
        }
        
        // Check if second auth is valid
        if (isSecondAuthValid()) {
            // Already authenticated, show page
            if (document.body) {
                document.body.style.removeProperty('display');
            }
            return;
        }
        
        // Need authentication, show modal
        // Wait for Supabase to be ready
        const checkSupabase = setInterval(() => {
            if (window.DB && window.DB.supabase) {
                clearInterval(checkSupabase);
                showAuthModal();
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkSupabase);
            if (!isSecondAuthValid()) {
                showAuthModal();
            }
        }, 10000);
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
