/**
 * Security Helper Functions
 * دوال مساعدة للأمان - حماية من XSS و Input Validation
 */

// ========== XSS PROTECTION ==========

/**
 * تنظيف النص من أكواد HTML الخبيثة
 * @param {string} text - النص المراد تنظيفه
 * @returns {string} - النص النظيف
 */
function sanitizeHTML(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * إدراج نص آمن في عنصر (بدلاً من innerHTML)
 * @param {HTMLElement} element - العنصر
 * @param {string} text - النص
 */
function safeSetText(element, text) {
  if (!element) return;
  element.textContent = text || '';
}

/**
 * إدراج HTML آمن بعد التنظيف
 * @param {HTMLElement} element - العنصر
 * @param {string} html - HTML
 */
function safeSetHTML(element, html) {
  if (!element) return;
  element.innerHTML = sanitizeHTML(html);
}

// ========== INPUT VALIDATION ==========

/**
 * التحقق من رقم الهاتف
 * @param {string} phone - رقم الهاتف
 * @returns {boolean}
 */
function validatePhone(phone) {
  if (!phone) return false;
  
  // إزالة المسافات والرموز
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // يجب أن يكون أرقام فقط وطوله بين 9-15
  return /^[0-9]{9,15}$/.test(cleaned);
}

/**
 * التحقق من الاسم
 * @param {string} name - الاسم
 * @returns {boolean}
 */
function validateName(name) {
  if (!name) return false;
  
  // يجب أن يكون بين 2-100 حرف
  if (name.length < 2 || name.length > 100) return false;
  
  // حروف عربية أو إنجليزية ومسافات فقط
  return /^[\u0621-\u064Aa-zA-Z\s]+$/.test(name);
}

/**
 * التحقق من السعر
 * @param {number} price - السعر
 * @returns {boolean}
 */
function validatePrice(price) {
  if (price === null || price === undefined) return false;
  
  const num = parseFloat(price);
  
  // يجب أن يكون رقم موجب وأقل من مليون
  return !isNaN(num) && num >= 0 && num <= 1000000;
}

/**
 * التحقق من العنوان
 * @param {string} address - العنوان
 * @returns {boolean}
 */
function validateAddress(address) {
  if (!address) return false;
  
  // يجب أن يكون بين 5-500 حرف
  return address.length >= 5 && address.length <= 500;
}

/**
 * التحقق من البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean}
 */
function validateEmail(email) {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
}

// ========== localStorage ENCRYPTION ==========

/**
 * تشفير بسيط للبيانات (Base64 + XOR)
 * @param {string} data - البيانات
 * @param {string} key - مفتاح التشفير
 * @returns {string}
 */
function encryptData(data, key = 'sheikh-secret-key-2025') {
  try {
    const encrypted = btoa(data)
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
    return btoa(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
}

/**
 * فك تشفير البيانات
 * @param {string} encrypted - البيانات المشفرة
 * @param {string} key - مفتاح التشفير
 * @returns {string}
 */
function decryptData(encrypted, key = 'sheikh-secret-key-2025') {
  try {
    const decoded = atob(encrypted);
    const decrypted = decoded
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
    return atob(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return encrypted;
  }
}

/**
 * حفظ بيانات مشفرة في localStorage
 * @param {string} key - المفتاح
 * @param {any} value - القيمة
 */
function secureSetItem(key, value) {
  try {
    const jsonString = JSON.stringify(value);
    const encrypted = encryptData(jsonString);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Secure set error:', error);
  }
}

/**
 * قراءة بيانات مشفرة من localStorage
 * @param {string} key - المفتاح
 * @returns {any}
 */
function secureGetItem(key) {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    const decrypted = decryptData(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Secure get error:', error);
    return null;
  }
}

// ========== RATE LIMITING (Client-Side) ==========

const rateLimitStore = new Map();

/**
 * التحقق من معدل الطلبات
 * @param {string} action - اسم العملية
 * @param {number} maxAttempts - الحد الأقصى
 * @param {number} windowMs - النافذة الزمنية بالميلي ثانية
 * @returns {boolean}
 */
function checkRateLimit(action, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  
  if (!rateLimitStore.has(action)) {
    rateLimitStore.set(action, []);
  }
  
  const attempts = rateLimitStore.get(action);
  
  // احذف المحاولات القديمة
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false; // تجاوز الحد
  }
  
  recentAttempts.push(now);
  rateLimitStore.set(action, recentAttempts);
  
  return true; // مسموح
}

/**
 * إعادة تعيين معدل الطلبات
 * @param {string} action - اسم العملية
 */
function resetRateLimit(action) {
  rateLimitStore.delete(action);
}

// ========== EXPORT ==========

// إذا كان في window، اجعلها متاحة عالمياً
if (typeof window !== 'undefined') {
  window.SecurityHelpers = {
    // XSS Protection
    sanitizeHTML,
    safeSetText,
    safeSetHTML,
    
    // Input Validation
    validatePhone,
    validateName,
    validatePrice,
    validateAddress,
    validateEmail,
    
    // Encryption
    encryptData,
    decryptData,
    secureSetItem,
    secureGetItem,
    
    // Rate Limiting
    checkRateLimit,
    resetRateLimit
  };
}
