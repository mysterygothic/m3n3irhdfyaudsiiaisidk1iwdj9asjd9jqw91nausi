// Supabase Configuration
// ⚠️ بعد إنشاء Supabase Project، استبدل الـ URL والـ Key هنا!

// خطوات الحصول على هذه المعلومات:
// 1. اذهب إلى https://supabase.com/dashboard
// 2. اختار الـ Project
// 3. Settings → API
// 4. انسخ "Project URL" و "anon public" key

const SUPABASE_URL = 'https://noooysoqieuuaogrhlty.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vb295c29xaWV1dWFvZ3JobHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTExMjgsImV4cCI6MjA3NjgyNzEyOH0.W9EexKNYoErZf_8DmiBv0KfvYKy-pbBlvC3lMVEf7Bc';

// ⚠️ تحذير: لا تحط service_role key هنا! استخدم anon key فقط
// anon key آمن للاستخدام في الموقع - service_role سري ولا يُشارك!

// ========== لا تعدل شي تحت هذا الخط ==========

// Check if config is set
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL_HERE' && 
           SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
           SUPABASE_URL.includes('supabase.co');
}

// Initialize Supabase client (will be loaded from CDN)
let supabaseClient = null;

// Initialize Supabase when script loads
async function initSupabase() {
    if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured! Using localStorage fallback.');
        console.warn('📝 Please update SUPABASE_URL and SUPABASE_ANON_KEY in supabase-config.js');
        return null;
    }
    
    try {
        // Check if Supabase JS library is loaded
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase JS library not loaded!');
            console.error('Make sure to include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.js"></script>');
            return null;
        }
        
        // Create Supabase client
        const { createClient } = window.supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        console.log('✅ Supabase connected successfully!');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        return null;
    }
}

// Get Supabase client instance
function getSupabaseClient() {
    return supabaseClient;
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = {
        URL: SUPABASE_URL,
        KEY: SUPABASE_ANON_KEY,
        isConfigured: isSupabaseConfigured,
        init: initSupabase,
        getClient: getSupabaseClient
    };
}

