/**
 * Cloudflare Worker for Admin Authentication
 * Supports both hardcoded users and dynamic user management
 */

// ========== CONFIGURATION ==========
const ADMIN_USERS = {
  // Default hardcoded users (fallback)
  'admin': {
    password: 'admin123',
    role: 'super_admin'
  },
  'zaid': {
    password: 'zaid2025',
    role: 'super_admin'
  }
};

// KV namespace for storing dynamic users (optional)
// Bind this in your Cloudflare Worker settings: ADMIN_USERS_KV

// Token storage (in-memory, resets on worker restart)
const activeSessions = new Map();

// ========== HELPER FUNCTIONS ==========
function generateToken(username) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return btoa(`${username}:${timestamp}:${random}`);
}

function validateToken(token) {
  try {
    const decoded = atob(token);
    const [username, timestamp] = decoded.split(':');
    
    // Check if token exists in active sessions
    if (activeSessions.has(token)) {
      const sessionData = activeSessions.get(token);
      // Token expires after 24 hours
      if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
        return { valid: true, username: sessionData.username };
      } else {
        activeSessions.delete(token);
      }
    }
    
    return { valid: false };
  } catch (error) {
    return { valid: false };
  }
}

async function getUser(username, env) {
  // Try to get from KV storage first (if available)
  if (env && env.ADMIN_USERS_KV) {
    try {
      const userData = await env.ADMIN_USERS_KV.get(`user:${username}`);
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('KV error:', error);
    }
  }
  
  // Fallback to hardcoded users
  return ADMIN_USERS[username] || null;
}

async function saveUser(username, userData, env) {
  // Save to KV storage (if available)
  if (env && env.ADMIN_USERS_KV) {
    try {
      await env.ADMIN_USERS_KV.put(`user:${username}`, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('KV save error:', error);
      return false;
    }
  }
  
  // If no KV, store in memory (temporary)
  ADMIN_USERS[username] = userData;
  return true;
}

async function deleteUser(username, env) {
  // Delete from KV storage (if available)
  if (env && env.ADMIN_USERS_KV) {
    try {
      await env.ADMIN_USERS_KV.delete(`user:${username}`);
      return true;
    } catch (error) {
      console.error('KV delete error:', error);
      return false;
    }
  }
  
  // Delete from memory
  if (ADMIN_USERS[username]) {
    delete ADMIN_USERS[username];
    return true;
  }
  
  return false;
}

// ========== CORS HEADERS ==========
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ========== MAIN HANDLER ==========
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // ========== LOGIN ENDPOINT ==========
    if (path === '/login' && request.method === 'POST') {
      try {
        const { username, password } = await request.json();
        
        if (!username || !password) {
          return new Response(JSON.stringify({
            success: false,
            error: 'اسم المستخدم وكلمة المرور مطلوبة'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Get user data
        const user = await getUser(username, env);
        
        if (user && user.password === password) {
          // Generate token
          const token = generateToken(username);
          
          // Store session
          activeSessions.set(token, {
            username: username,
            role: user.role || 'admin',
            timestamp: Date.now()
          });
          
          return new Response(JSON.stringify({
            success: true,
            token: token,
            username: username,
            role: user.role || 'admin'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'خطأ في الخادم'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // ========== VERIFY TOKEN ENDPOINT ==========
    if (path === '/verify' && request.method === 'POST') {
      try {
        const { token } = await request.json();
        
        if (!token) {
          return new Response(JSON.stringify({
            success: false,
            valid: false
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const validation = validateToken(token);
        
        return new Response(JSON.stringify({
          success: true,
          valid: validation.valid,
          username: validation.username || null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          valid: false
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // ========== LOGOUT ENDPOINT ==========
    if (path === '/logout' && request.method === 'POST') {
      try {
        const { token } = await request.json();
        
        if (token && activeSessions.has(token)) {
          activeSessions.delete(token);
        }
        
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // ========== ADD/UPDATE USER ENDPOINT ==========
    if (path === '/admin/add-user' && request.method === 'POST') {
      try {
        const { username, password, role } = await request.json();
        
        if (!username || !password) {
          return new Response(JSON.stringify({
            success: false,
            error: 'اسم المستخدم وكلمة المرور مطلوبة'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const userData = {
          password: password,
          role: role || 'admin'
        };
        
        const saved = await saveUser(username, userData, env);
        
        if (saved) {
          return new Response(JSON.stringify({
            success: true,
            message: 'تم إضافة المستخدم بنجاح'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'فشل في حفظ المستخدم'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'خطأ في الخادم'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // ========== DELETE USER ENDPOINT ==========
    if (path === '/admin/delete-user' && request.method === 'POST') {
      try {
        const { username } = await request.json();
        
        if (!username) {
          return new Response(JSON.stringify({
            success: false,
            error: 'اسم المستخدم مطلوب'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Prevent deleting default admin users
        if (username === 'admin' || username === 'zaid') {
          return new Response(JSON.stringify({
            success: false,
            error: 'لا يمكن حذف المستخدمين الافتراضيين'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const deleted = await deleteUser(username, env);
        
        if (deleted) {
          return new Response(JSON.stringify({
            success: true,
            message: 'تم حذف المستخدم بنجاح'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'المستخدم غير موجود'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'خطأ في الخادم'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // ========== DEFAULT RESPONSE ==========
    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
