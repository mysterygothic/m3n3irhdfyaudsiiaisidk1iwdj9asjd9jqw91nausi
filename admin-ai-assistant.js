// AI Assistant for Ramadan Orders
// Supports: Google Gemini, OpenAI GPT, Anthropic Claude

const AI_CONFIG_KEY = 'ai_assistant_config';
const CHAT_HISTORY_KEY = 'ai_chat_history';

// Example prompts
const EXAMPLE_PROMPTS = [
    "أحمد محمد، سدر منسف دجاجة، توصيل حي رمزي، 0781504450، بدون لوز، 8 + 1",
    "سارة علي، 2 سدر منسف دجاجة + 1 سدر منسف لحم، حي الجامعة، 0791234567، 16 + 1",
    "خالد حسن، سدر منسف لحم، استلام، 0791112233، بدون بصل، 10"
];

// System prompt for AI
const SYSTEM_PROMPT = `أنت مساعد ذكي لإدارة طلبات رمضان في مطعم ومطبخ الشيخ.
مهمتك هي استخراج معلومات الطلب من النص الذي يرسله المستخدم وإرجاعها بصيغة JSON.

المعلومات المطلوبة:
1. customerName: اسم العميل (نص)
2. orderItems: الطلبات (نص - قد يحتوي على أكثر من صنف)
3. deliveryType: نوع الطلب - "توصيل" أو "استلام" (نص)
4. deliveryAddress: عنوان التوصيل (نص - فقط إذا كان النوع "توصيل"، وإلا لا تضعه في JSON)
5. phoneNumber: رقم الهاتف (نص)
6. notes: ملاحظات إضافية (نص - اختياري، لا تضعه إذا لم يكن موجود)
7. price: السعر الأساسي (رقم)
8. deliveryFee: رسوم التوصيل (رقم - لا تضعه في حالة الاستلام، ضعه فقط في حالة التوصيل)

مثال على طلب توصيل:
"أحمد محمد، سدر منسف دجاجة، توصيل حي رمزي، 0781504450، بدون لوز، 8 + 1"

الإخراج (JSON فقط):
{
  "customerName": "أحمد محمد",
  "orderItems": "سدر منسف دجاجة",
  "deliveryType": "توصيل",
  "deliveryAddress": "حي رمزي",
  "phoneNumber": "0781504450",
  "notes": "بدون لوز",
  "price": 8,
  "deliveryFee": 1
}

مثال على طلب استلام:
"خالد أحمد، سدر منسف لحم، استلام، 0791234567، بدون بصل، 10"

الإخراج (JSON فقط):
{
  "customerName": "خالد أحمد",
  "orderItems": "سدر منسف لحم",
  "deliveryType": "استلام",
  "phoneNumber": "0791234567",
  "notes": "بدون بصل",
  "price": 10
}

ملاحظات مهمة:
- إذا ذكر "استلام" أو "من المطعم"، اجعل deliveryType = "استلام" ولا تضع deliveryAddress ولا deliveryFee في JSON
- إذا ذكر "توصيل" أو عنوان محدد، اجعل deliveryType = "توصيل" وأضف deliveryAddress و deliveryFee
- إذا لم يتم ذكر رسوم التوصيل في طلب توصيل، استخدم 1 كقيمة افتراضية
- إذا تم ذكر الساعة مثل الساعة 7 وكان الطلب توصيل ضيف الساعة للملاحظات notes
- إذا لم يتم ذكر نوع الطلب ولكن يوجد عنوان، افترض أنه توصيل
- إذا لم يتم ذكر نوع الطلب ولا يوجد عنوان، افترض أنه استلام
- إذا كانت هناك عدة أصناف، اجمعها في orderItems
- استخرج الأسعار من النص (مثل "8 + 1" تعني السعر 8 والتوصيل 1، أو "10" فقط يعني السعر 10)
- أرجع JSON فقط بدون أي نص إضافي
- لا تضع حقول فارغة أو null في JSON - فقط الحقول التي لها قيم`;

// Load saved configuration
async function loadAIConfig() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('orderDate').value = today;
    
    // Try to load from database first
    try {
        if (typeof getAIConfig === 'function') {
            const dbConfig = await getAIConfig();
            if (dbConfig && dbConfig.apiKey) {
                document.getElementById('apiProvider').value = 'gemini';
                document.getElementById('apiKey').value = dbConfig.apiKey;
                document.getElementById('aiModel').value = 'gemini-2.5-flash';
                updateAPIStatus(true);
                updateModelOptions('gemini');

                return;
            }
        }
    } catch (e) {

    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (saved) {
        try {
            const config = JSON.parse(saved);
            document.getElementById('apiProvider').value = 'gemini';
            document.getElementById('apiKey').value = config.apiKey || '';
            document.getElementById('aiModel').value = 'gemini-2.5-flash';
            updateAPIStatus(!!config.apiKey);
            updateModelOptions('gemini');
        } catch (e) {

        }
    } else {
        // Set default values
        document.getElementById('apiProvider').value = 'gemini';
        document.getElementById('aiModel').value = 'gemini-2.5-flash';
        updateModelOptions('gemini');
    }
}

// Save API configuration
async function saveAPIKey() {
    const apiKey = document.getElementById('apiKey').value;
    
    const config = {
        provider: 'gemini',
        apiKey: apiKey,
        model: 'gemini-2.5-flash'
    };
    
    // Save to localStorage as backup
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    updateAPIStatus(!!apiKey);
    
    if (apiKey) {
        // Try to save to database
        try {
            if (typeof saveAIConfig === 'function') {
                await saveAIConfig(config);
                addSystemMessage(' تم حفظ API Key بنجاح في قاعدة البيانات - جاهز للاستخدام مع Gemini 2.5 Flash');

            } else {
                addSystemMessage(' تم حفظ API Key بنجاح محلياً - جاهز للاستخدام مع Gemini 2.5 Flash');
            }
        } catch (e) {

            addSystemMessage(' تم حفظ API Key بنجاح محلياً - جاهز للاستخدام مع Gemini 2.5 Flash');
        }
    }
}

// Update API provider
function updateAPIProvider() {
    const provider = document.getElementById('apiProvider').value;
    updateModelOptions(provider);
    saveAPIKey();
}

// Update model options based on provider
function updateModelOptions(provider) {
    const modelSelect = document.getElementById('aiModel');
    modelSelect.innerHTML = '';
    
    const models = {
        'gemini': [
            { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }
        ],
        'openai': [
            { value: 'gpt-4', label: 'GPT-4' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
        ],
        'claude': [
            { value: 'claude-3-opus', label: 'Claude 3 Opus' },
            { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
            { value: 'claude-3-haiku', label: 'Claude 3 Haiku' }
        ]
    };
    
    const providerModels = models[provider] || models['gemini'];
    providerModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.label;
        modelSelect.appendChild(option);
    });
}

// Update API status indicator
function updateAPIStatus(connected) {
    const statusEl = document.getElementById('apiStatus');
    if (connected) {
        statusEl.className = 'api-status connected';
        statusEl.innerHTML = ' متصل';
    } else {
        statusEl.className = 'api-status disconnected';
        statusEl.innerHTML = ' غير متصل';
    }
}

// Add message to chat
function addMessage(text, type = 'user') {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const time = new Date().toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        ${text}
        <div class="message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add system message
function addSystemMessage(text) {
    addMessage(text, 'system');
}

// Add success message
function addSuccessMessage(text) {
    addMessage(text, 'success');
}

// Add loading indicator
function addLoadingMessage() {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    messageDiv.id = 'loadingMessage';
    messageDiv.innerHTML = `
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
        جاري المعالجة...
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Remove loading indicator
function removeLoadingMessage() {
    const loadingMsg = document.getElementById('loadingMessage');
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

// Send message to AI
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) {
        return;
    }
    
    // Check API key
    const config = JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || '{}');
    if (!config.apiKey) {
        addSystemMessage(' يرجى إدخال API Key أولاً');
        return;
    }
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    
    // Disable send button
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    
    // Add loading
    addLoadingMessage();
    
    try {
        // Call AI API
        const orderData = await callAI(message, config);
        
        removeLoadingMessage();
        
        if (orderData) {
            // Show extracted data
            const isDelivery = orderData.deliveryType === 'توصيل';
            let dataText = `
                 تم استخراج البيانات:
                • العميل: ${orderData.customerName}
                • الطلب: ${orderData.orderItems}
                • نوع الطلب: ${orderData.deliveryType || 'استلام'}
                • الهاتف: ${orderData.phoneNumber}`;
            
            if (isDelivery) {
                dataText += `
                • العنوان: ${orderData.deliveryAddress || '-'}
                • السعر: ${orderData.price} دينار
                • رسوم التوصيل: ${orderData.deliveryFee || 0} دينار
                • الإجمالي: ${(parseFloat(orderData.price) + parseFloat(orderData.deliveryFee || 0)).toFixed(2)} دينار`;
            } else {
                dataText += `
                • السعر: ${orderData.price} دينار`;
            }
            
            if (orderData.notes) {
                dataText += `
                • ملاحظات: ${orderData.notes}`;
            }
            
            addMessage(dataText, 'ai');
            
            // Add order to database
            const success = await addOrderToDatabase(orderData);
            
            if (success) {
                addSuccessMessage(' تم إضافة الطلب بنجاح إلى نظام طلبات رمضان!');
            } else {
                addSystemMessage(' حدث خطأ في إضافة الطلب إلى قاعدة البيانات');
            }
        } else {
            addSystemMessage(' لم أتمكن من فهم الطلب. يرجى التأكد من تضمين جميع المعلومات المطلوبة');
        }
    } catch (error) {
        removeLoadingMessage();

        addSystemMessage(' حدث خطأ في الاتصال بـ AI: ' + error.message);
    }
    
    // Re-enable send button
    sendBtn.disabled = false;
}

// Call AI API (Google Gemini)
async function callAI(message, config) {
    const { provider, apiKey, model } = config;
    
    if (provider === 'gemini') {
        return await callGemini(message, apiKey, model);
    } else if (provider === 'openai') {
        return await callOpenAI(message, apiKey, model);
    } else if (provider === 'claude') {
        return await callClaude(message, apiKey, model);
    }
    
    throw new Error('مزود AI غير مدعوم');
}

// Call Google Gemini API
async function callGemini(message, apiKey, model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${SYSTEM_PROMPT}\n\nالطلب: ${message}`
                }]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1024
            }
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'فشل الاتصال بـ Gemini');
    }
    
    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!text) {
        throw new Error('لم يتم الحصول على رد من Gemini');
    }
    
    // Extract JSON from response
    return extractJSON(text);
}

// Call OpenAI API
async function callOpenAI(message, apiKey, model) {
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: message }
            ],
            temperature: 0.1,
            max_tokens: 1024
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'فشل الاتصال بـ OpenAI');
    }
    
    const data = await response.json();
    const text = data.choices[0]?.message?.content;
    
    if (!text) {
        throw new Error('لم يتم الحصول على رد من OpenAI');
    }
    
    return extractJSON(text);
}

// Call Anthropic Claude API
async function callClaude(message, apiKey, model) {
    const url = 'https://api.anthropic.com/v1/messages';
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 1024,
            messages: [
                { role: 'user', content: `${SYSTEM_PROMPT}\n\nالطلب: ${message}` }
            ]
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'فشل الاتصال بـ Claude');
    }
    
    const data = await response.json();
    const text = data.content[0]?.text;
    
    if (!text) {
        throw new Error('لم يتم الحصول على رد من Claude');
    }
    
    return extractJSON(text);
}

// Extract JSON from AI response
function extractJSON(text) {

    try {
        // Try to parse directly
        const parsed = JSON.parse(text);

        return parsed;
    } catch (e) {

        // Try to extract JSON from markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);

                return parsed;
            } catch (e2) {

            }
        }
        
        // Try to find JSON object in text (more flexible regex)
        const objectMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
        if (objectMatch) {
            try {
                const parsed = JSON.parse(objectMatch[0]);

                return parsed;
            } catch (e3) {

            }
        }
        
        // Last attempt: try to find the first { and last }
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
                const jsonStr = text.substring(firstBrace, lastBrace + 1);
                const parsed = JSON.parse(jsonStr);

                return parsed;
            } catch (e4) {

            }
        }


        throw new Error('لم يتم العثور على JSON في الرد');
    }
}

// Add order to database
async function addOrderToDatabase(orderData) {
    try {
        // Get selected date from date picker
        const selectedDate = document.getElementById('orderDate').value;
        const dateStr = selectedDate || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Calculate total based on delivery type
        const price = parseFloat(orderData.price) || 0;
        const isDelivery = orderData.deliveryType === 'توصيل';
        const deliveryFee = isDelivery ? (parseFloat(orderData.deliveryFee) || 0) : 0;
        const totalAmount = isDelivery ? price : price; // For pickup, total = price only
        
        // Convert order items string to array format
        const itemsArray = [{
            name: orderData.orderItems,
            meatType: '-',
            selectedQuantity: 'كبير',
            quantity: 1
        }];
        
        // Create order object with correct field names for saveRamadanOrder
        const order = {
            id: Date.now(), // Timestamp ID for new orders
            serialNumber: Math.floor(Math.random() * 10000), // Random serial number
            customerName: orderData.customerName,
            phoneNumber: orderData.phoneNumber,
            deliveryType: orderData.deliveryType || 'استلام',
            otherDetails: orderData.notes || '',
            items: itemsArray,
            totalAmount: totalAmount,
            date: dateStr,
            scheduledDate: dateStr,
            driver_id: null,
            driverName: '',
            cashAmount: 0,
            deliveryStatus: 'pending',
            deliveryNotes: orderData.notes || ''
        };
        
        // Add delivery-specific fields only if it's a delivery order
        if (isDelivery) {
            order.deliveryAddress = orderData.deliveryAddress || '';
            order.deliveryFee = deliveryFee;
        }


        // Save to database using existing function
        let success = false;
        if (typeof saveRamadanOrder === 'function') {
            success = await saveRamadanOrder(order);
        } else if (window.DB && window.DB.saveRamadanOrder) {
            success = await window.DB.saveRamadanOrder(order);
        } else {

            console.log('Available functions:', Object.keys(window.DB || {}));
            return false;
        }
        
        if (success) {

            // Save customer info to customers database
            if (typeof saveCustomerInfo === 'function') {
                await saveCustomerInfo(order);

            } else {

            }
            
            return true;
        } else {

            return false;
        }
    } catch (error) {

        return false;
    }
}

// Handle Enter key in textarea
function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Use example prompt
function useExample(index) {
    const input = document.getElementById('chatInput');
    input.value = EXAMPLE_PROMPTS[index];
    input.focus();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadAIConfig();
    
    // Load chat history
    const history = localStorage.getItem(CHAT_HISTORY_KEY);
    if (history) {
        // Could restore chat history here if needed
    }

});
