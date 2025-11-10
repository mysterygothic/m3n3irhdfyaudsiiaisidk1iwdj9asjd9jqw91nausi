// Cloud Menu System - Uses JSONBin.io via Cloudflare Worker
// Menu changes sync to all visitors!

// ========== CONFIGURATION ==========
const JSONBIN_WORKER_URL = 'https://shiekhmenudb.zlmsn3mk.workers.dev';

// Cache for performance
let menuCache = null;
let categoriesCache = null;
let lastMenuFetch = 0;
let lastCategoriesFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds

// ========== GET MENU DATA (FOR CUSTOMERS) ==========
async function getCloudMenuData() {
    // Check cache first
    const now = Date.now();
    if (menuCache && (now - lastMenuFetch) < CACHE_DURATION) {
        return menuCache;
    }
    
    try {
        const response = await fetch(`${JSONBIN_WORKER_URL}/menu/get`);
        const result = await response.json();
        
        if (result.success && result.data) {
            menuCache = result.data;
            lastMenuFetch = now;
            return result.data;
        }
        
        // Fallback to default data
        return getDefaultMenuData();
    } catch (error) {

        // Fallback to default data
        return getDefaultMenuData();
    }
}

// ========== GET MENU DATA (FOR ADMIN) ==========
async function getAdminMenuData() {
    try {
        const response = await fetch(`${JSONBIN_WORKER_URL}/menu/get`);
        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data;
        }
        
        return getDefaultMenuData();
    } catch (error) {

        return getDefaultMenuData();
    }
}

// ========== SAVE MENU DATA (ADMIN ONLY) ==========
async function saveCloudMenuData(menuData) {
    try {
        const response = await fetch(`${JSONBIN_WORKER_URL}/menu/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: menuData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Clear cache
            menuCache = null;
            lastMenuFetch = 0;
            return true;
        }
        
        return false;
    } catch (error) {

        return false;
    }
}

// ========== GET CATEGORIES (FOR CUSTOMERS) ==========
async function getCloudCategories() {
    // Check cache first
    const now = Date.now();
    if (categoriesCache && (now - lastCategoriesFetch) < CACHE_DURATION) {
        return categoriesCache;
    }
    
    try {
        const response = await fetch(`${JSONBIN_WORKER_URL}/categories/get`);
        const result = await response.json();
        
        if (result.success && result.data) {
            categoriesCache = result.data;
            lastCategoriesFetch = now;
            return result.data;
        }
        
        return [{ id: 1, name: 'سدور', value: 'sudor' }];
    } catch (error) {

        return [{ id: 1, name: 'سدور', value: 'sudor' }];
    }
}

// ========== SAVE CATEGORIES (ADMIN ONLY) ==========
async function saveCloudCategories(categories) {
    try {
        const response = await fetch(`${JSONBIN_WORKER_URL}/categories/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: categories })
        });
        
        const result = await response.json();
        
        if (result.success) {
            categoriesCache = null;
            lastCategoriesFetch = 0;
            return true;
        }
        
        return false;
    } catch (error) {

        return false;
    }
}

// ========== DEFAULT DATA ==========
function getDefaultMenuData() {
    return [
        {
            id: 1,
            name: "زرب",
            description: "زرب مع الأرز البسمتي والبهارات الخاصة",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/zarbjaj.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/zarbjaj.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/zarblaham.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر نصف دجاجة", value: "سدر نصف دجاجة", price: 5 },
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "نصف كيلو", value: "نصف كيلو", price: 8 },
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 2,
            name: "منسف",
            description: "منسف مع الأرز واللبن واللوز",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/mansaf.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/mansaf.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/mansaf.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 3,
            name: "مندي",
            description: "مندي مع الأرز البسمتي والبهارات",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/mande.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/mande.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/mande.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 4,
            name: "برياني",
            description: "برياني حار بالفلفل الحار والخلطة العدنية السرية لمطعم الشيخ",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/breane.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/breane.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/breane.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 5,
            name: "كبسة",
            description: "كبسة سعودية خاصة بمطعم الشيخ عيش تجربة الكبسة السعودية وأطلب كبسة ..",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/kabsa.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/kabsa.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/kabsa.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8},
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 6,
            name: "قدرة",
            description: "القدرة الخليلية على أصولها من عند مطعم الشيخ باللحم والدجاج",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/qedra.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/qedra.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/qedra.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        },
        {
            id: 7,
            name: "فريكة",
            description: "فريكة جنين الشهية من مطعم الشيخ بالدجاج واللحم",
            basePrice: 5,
            category: "sudor",
            image: "picturesfood/freke.jpg",
            meatType: "دجاج",
            meatOptions: [
                { type: "دجاج", image: "picturesfood/freke.jpg", priceMultiplier: 1 },
                { type: "لحم", image: "picturesfood/freke.jpg", priceMultiplier: 1.5 }
            ],
            quantityOptions: [
                { label: "سدر دجاجة", value: "سدر دجاجة", price: 8 },
                { label: "دجاجة ونص", value: "دجاجة ونص", price: 12 },
                { label: "دجاجتين", value: "دجاجتين", price: 15 },
                { label: "دجاجتين ونص", value: "دجاجتين ونص", price: 18 },
                { label: "ثلاث دجاجات", value: "ثلاث دجاجات", price: 22 }
            ],
            meatQuantityOptions: [
                { label: "1 كيلو", value: "1 كيلو", price: 13 },
                { label: "كيلو ونص", value: "كيلو ونص", price: 21 },
                { label: "2 كيلو", value: "2 كيلو", price: 25 },
                { label: "2 كيلو ونص", value: "2 كيلو ونص", price: 28 },
                { label: "3 كيلو", value: "3 كيلو", price: 32 }
            ]
        }
    ];
}

