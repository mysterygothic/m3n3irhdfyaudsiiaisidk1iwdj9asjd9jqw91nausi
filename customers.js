// Customers Management
let allCustomers = [];

document.addEventListener('DOMContentLoaded', async function() {
    if (document.getElementById('customersTableBody')) {
        await loadCustomers();
    }
});

async function loadCustomers() {
    try {
        allCustomers = await window.DB.getCustomers();
        renderCustomersTable(allCustomers);
        updateCustomerStats();
        
        // Reset selection
        const selectAllCheckbox = document.getElementById('selectAllCustomers');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
        updateDeleteButton();
    } catch (error) {

        allCustomers = [];
        renderCustomersTable([]);
    }
}

function renderCustomersTable(customers) {
    const tbody = document.getElementById('customersTableBody');
    
    if (!customers || customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">لا يوجد زبائن</td></tr>';
        return;
    }
    
    tbody.innerHTML = customers.map((customer, index) => `
        <tr>
            <td>
                <input type="checkbox" class="customer-checkbox" data-customer-id="${customer.id}" onchange="updateDeleteButton()">
            </td>
            <td>${index + 1}</td>
            <td><strong>${customer.customer_name || customer.customerName}</strong></td>
            <td>${customer.phone_number || customer.phoneNumber}</td>
            <td>${customer.delivery_address || customer.deliveryAddress || '-'}</td>
            <td>${customer.order_count || customer.orderCount || 0}</td>
            <td><strong style="color: #27ae60;">${(customer.total_spent || customer.totalSpent || 0).toFixed(2)} دينار</strong></td>
            <td>${formatDate(customer.last_order_date || customer.lastOrderDate)}</td>
            <td>
                <button class="action-btn delete-order-btn" onclick="confirmDeleteCustomer(${customer.id})" title="حذف"></button>
            </td>
        </tr>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-JO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateCustomerStats() {
    const totalCustomers = allCustomers.length;
    const totalOrders = allCustomers.reduce((sum, c) => sum + (c.order_count || c.orderCount || 0), 0);
    const totalSales = allCustomers.reduce((sum, c) => sum + parseFloat(c.total_spent || c.totalSpent || 0), 0);
    
    document.getElementById('totalCustomers').textContent = totalCustomers;
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalSales').textContent = totalSales.toFixed(2) + ' دينار';
}

function searchCustomers() {
    const searchTerm = document.getElementById('searchCustomers').value.toLowerCase();
    
    if (!searchTerm) {
        renderCustomersTable(allCustomers);
        updateDeleteButton();
        return;
    }
    
    const filtered = allCustomers.filter(customer => {
        const name = (customer.customer_name || customer.customerName || '').toLowerCase();
        const phone = (customer.phone_number || customer.phoneNumber || '').toLowerCase();
        
        return name.includes(searchTerm) || phone.includes(searchTerm);
    });
    
    renderCustomersTable(filtered);
    updateDeleteButton();
}

function clearCustomerSearch() {
    document.getElementById('searchCustomers').value = '';
    renderCustomersTable(allCustomers);
    updateDeleteButton();
}

async function confirmDeleteCustomer(customerId) {
    const confirmed = confirm(' هل أنت متأكد من حذف هذا الزبون؟\n\nسيتم حذف جميع معلوماته من قاعدة البيانات.');
    
    if (!confirmed) return;
    
    try {
        await window.DB.deleteCustomer(customerId);
        
        await loadCustomers();
        
        alert(' تم حذف الزبون بنجاح');
    } catch (error) {

        alert(' حدث خطأ في حذف الزبون');
    }
}

async function exportCustomers() {
    try {
        const data = [
            ['قاعدة بيانات الزبائن'],
            ['مطعم ومطبخ الشيخ'],
            ['التاريخ: ' + new Date().toLocaleDateString('ar-JO')],
            [],
            ['الرقم', 'اسم الزبون', 'رقم التلفون', 'العنوان', 'عدد الطلبات', 'إجمالي المشتريات (دينار)', 'تاريخ أول طلب', 'تاريخ آخر طلب']
        ];
        
        allCustomers.forEach((customer, index) => {
            data.push([
                index + 1,
                customer.customer_name || customer.customerName,
                customer.phone_number || customer.phoneNumber,
                customer.delivery_address || customer.deliveryAddress || '-',
                customer.order_count || customer.orderCount || 0,
                (customer.total_spent || customer.totalSpent || 0).toFixed(2),
                formatDate(customer.first_order_date || customer.firstOrderDate),
                formatDate(customer.last_order_date || customer.lastOrderDate)
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'قاعدة بيانات الزبائن');
        
        const fileName = `قاعدة_بيانات_الزبائن_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        alert(' تم تصدير قاعدة البيانات بنجاح!');
    } catch (error) {

        alert(' حدث خطأ في التصدير');
    }
}

// Export customers as CSV (Google Contacts format)
function exportCustomersCSV() {
    try {
        // Google Contacts CSV format
        const headers = 'First Name,Middle Name,Last Name,Phonetic First Name,Phonetic Middle Name,Phonetic Last Name,Name Prefix,Name Suffix,Nickname,File As,Organization Name,Organization Title,Organization Department,Birthday,Notes,Photo,Labels,Phone 1 - Label,Phone 1 - Value';
        
        const rows = allCustomers.map(customer => {
            const name = customer.customer_name || customer.customerName || '';
            const phone = customer.phone_number || customer.phoneNumber || '';
            
            // Format: First Name,Middle Name,Last Name,...,Labels,Phone Label,Phone Value
            return `${name},,,,,,,,,,,,,,,,* myContacts,Mobile,${phone}`;
        });
        
        const csvContent = [headers, ...rows].join('\n');
        
        // Create and download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(' تم تصدير الزبائن بصيغة CSV بنجاح!');
    } catch (error) {

        alert(' حدث خطأ في التصدير');
    }
}

// Export customers as VCF (vCard format)
function exportCustomersVCF() {
    try {
        let vcfContent = '';
        
        allCustomers.forEach(customer => {
            const name = customer.customer_name || customer.customerName || 'Unknown';
            const phone = customer.phone_number || customer.phoneNumber || '';
            
            // VCF 3.0 format
            vcfContent += 'BEGIN:VCARD\n';
            vcfContent += 'VERSION:3.0\n';
            vcfContent += `FN:${name}\n`;
            vcfContent += `N:${name};;;;\n`;
            
            if (phone) {
                vcfContent += `TEL;TYPE=CELL:${phone}\n`;
            }
            
            vcfContent += 'END:VCARD\n';
        });
        
        // Create and download file
        const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.vcf`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(' تم تصدير الزبائن بصيغة VCF بنجاح!');
    } catch (error) {

        alert(' حدث خطأ في التصدير');
    }
}

// Handle import file
async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileName = file.name.toLowerCase();
    
    try {
        if (fileName.endsWith('.csv')) {
            await importCSV(file);
        } else if (fileName.endsWith('.vcf')) {
            await importVCF(file);
        } else {
            alert(' صيغة الملف غير مدعومة. يرجى اختيار ملف CSV أو VCF');
        }
    } catch (error) {

        alert(' حدث خطأ في الاستيراد');
    }
    
    // Reset file input
    event.target.value = '';
}

// Normalize phone number - remove dashes, spaces, and other formatting
function normalizePhoneNumber(phone) {
    if (!phone) return '';
    // Remove all non-digit characters except + at the start
    let cleaned = phone.toString().trim();
    // Remove spaces, dashes, parentheses, dots
    cleaned = cleaned.replace(/[\s\-\(\)\.\u200F\u200E]/g, '');
    return cleaned;
}

// Import CSV file
async function importCSV(file) {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
        alert(' الملف فارغ أو غير صالح');
        return;
    }
    
    const headers = lines[0].split(',');
    const phoneIndex = headers.findIndex(h => h.toLowerCase().includes('phone') && h.toLowerCase().includes('value'));
    const nameIndex = headers.findIndex(h => h.toLowerCase().includes('first') && h.toLowerCase().includes('name'));
    
    if (phoneIndex === -1) {
        alert(' لم يتم العثور على عمود رقم الهاتف في الملف');
        return;
    }
    
    const importedContacts = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        if (values.length > phoneIndex) {
            const name = nameIndex !== -1 ? values[nameIndex].trim() : `Contact ${i}`;
            const rawPhone = values[phoneIndex].trim();
            const phone = normalizePhoneNumber(rawPhone);
            
            if (phone) {
                importedContacts.push({
                    name: name || 'Unknown',
                    phone: phone
                });
            }
        }
    }
    
    if (importedContacts.length === 0) {
        alert(' لم يتم العثور على جهات اتصال صالحة في الملف');
        return;
    }
    
    // Show confirmation
    const confirmed = confirm(`هل تريد استيراد ${importedContacts.length} جهة اتصال؟\n\nملاحظة: سيتم إضافة جهات الاتصال الجديدة فقط.`);
    
    if (!confirmed) return;
    
    // Import contacts
    let successCount = 0;
    let skipCount = 0;
    
    for (const contact of importedContacts) {
        // Check if customer already exists
        const exists = allCustomers.some(c => 
            (c.phone_number || c.phoneNumber) === contact.phone
        );
        
        if (exists) {
            skipCount++;
            continue;
        }
        
        try {
            // Add to database (Supabase + localStorage)
            await window.DB.saveCustomer({
                customerName: contact.name,
                phoneNumber: contact.phone,
                deliveryAddress: '',
                orderCount: 0,
                totalSpent: 0,
                firstOrderDate: new Date().toISOString(),
                lastOrderDate: new Date().toISOString()
            });
            successCount++;
        } catch (error) {

        }
    }
    
    // Reload customers
    await loadCustomers();
    
    alert(` تم الاستيراد بنجاح!\n\nتم إضافة: ${successCount}\nتم تخطي (موجود مسبقاً): ${skipCount}`);
}

// Import VCF file
async function importVCF(file) {
    const text = await file.text();
    const vcards = text.split('BEGIN:VCARD').filter(v => v.trim());
    
    if (vcards.length === 0) {
        alert(' الملف فارغ أو غير صالح');
        return;
    }
    
    const importedContacts = [];
    
    vcards.forEach(vcard => {
        const lines = vcard.split('\n');
        let name = '';
        let phone = '';
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('FN:')) {
                name = trimmedLine.substring(3).trim();
            } else if (trimmedLine.startsWith('TEL')) {
                const colonIndex = trimmedLine.indexOf(':');
                if (colonIndex !== -1) {
                    phone = trimmedLine.substring(colonIndex + 1).trim();
                }
            }
        });
        
        if (phone) {
            importedContacts.push({
                name: name || 'Unknown',
                phone: normalizePhoneNumber(phone)
            });
        }
    });
    
    if (importedContacts.length === 0) {
        alert(' لم يتم العثور على جهات اتصال صالحة في الملف');
        return;
    }
    
    // Show confirmation
    const confirmed = confirm(`هل تريد استيراد ${importedContacts.length} جهة اتصال؟\n\nملاحظة: سيتم إضافة جهات الاتصال الجديدة فقط.`);
    
    if (!confirmed) return;
    
    // Import contacts
    let successCount = 0;
    let skipCount = 0;
    
    for (const contact of importedContacts) {
        // Check if customer already exists
        const exists = allCustomers.some(c => 
            (c.phone_number || c.phoneNumber) === contact.phone
        );
        
        if (exists) {
            skipCount++;
            continue;
        }
        
        try {
            // Add to database (Supabase + localStorage)
            await window.DB.saveCustomer({
                customerName: contact.name,
                phoneNumber: contact.phone,
                deliveryAddress: '',
                orderCount: 0,
                totalSpent: 0,
                firstOrderDate: new Date().toISOString(),
                lastOrderDate: new Date().toISOString()
            });
            successCount++;
        } catch (error) {

        }
    }
    
    // Reload customers
    await loadCustomers();
    
    alert(` تم الاستيراد بنجاح!\n\nتم إضافة: ${successCount}\nتم تخطي (موجود مسبقاً): ${skipCount}`);
}

// Helper function to parse CSV line (handles quoted values)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Toggle select all customers
function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.customer-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    updateDeleteButton();
}

// Update delete button visibility
function updateDeleteButton() {
    const checkboxes = document.querySelectorAll('.customer-checkbox:checked');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const selectAllCheckbox = document.getElementById('selectAllCustomers');
    
    if (checkboxes.length > 0) {
        deleteBtn.style.display = 'inline-block';
        deleteBtn.textContent = ` حذف المحدد (${checkboxes.length})`;
    } else {
        deleteBtn.style.display = 'none';
    }
    
    // Update select all checkbox state
    const allCheckboxes = document.querySelectorAll('.customer-checkbox');
    if (allCheckboxes.length > 0) {
        selectAllCheckbox.checked = checkboxes.length === allCheckboxes.length;
        selectAllCheckbox.indeterminate = checkboxes.length > 0 && checkboxes.length < allCheckboxes.length;
    }
}

// Delete selected customers
async function deleteSelectedCustomers() {
    const checkboxes = document.querySelectorAll('.customer-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert(' يرجى تحديد زبون واحد على الأقل للحذف');
        return;
    }
    
    const customerIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.customerId));
    const count = customerIds.length;
    
    const confirmed = confirm(
        ` هل أنت متأكد من حذف ${count} زبون؟\n\n` +
        `سيتم حذف جميع معلوماتهم من قاعدة البيانات بشكل نهائي.\n\n` +
        `هذا الإجراء لا يمكن التراجع عنه!`
    );
    
    if (!confirmed) return;
    
    // Show loading state
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const originalText = deleteBtn.textContent;
    deleteBtn.disabled = true;
    deleteBtn.textContent = '⏳ جاري الحذف...';
    
    try {
        let successCount = 0;
        let failCount = 0;
        
        for (const customerId of customerIds) {
            try {
                await window.DB.deleteCustomer(customerId);
                successCount++;
            } catch (error) {

                failCount++;
            }
        }
        
        // Reload customers
        await loadCustomers();
        
        // Reset checkboxes
        document.getElementById('selectAllCustomers').checked = false;
        updateDeleteButton();
        
        // Show result
        if (failCount === 0) {
            alert(` تم حذف ${successCount} زبون بنجاح!`);
        } else {
            alert(` تم حذف ${successCount} زبون\nفشل حذف ${failCount} زبون`);
        }
    } catch (error) {

        alert(' حدث خطأ في عملية الحذف');
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = originalText;
    }
}
