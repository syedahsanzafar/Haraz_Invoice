// State Management
let state = {
    customers: JSON.parse(localStorage.getItem('haraz_customers')) || [
        { name: "John Doe", phone: "555-0101" },
        { name: "Jane Smith", phone: "555-0202" }
    ],
    inventory: JSON.parse(localStorage.getItem('haraz_inventory')) || [
        { name: "Haraz Latte", price: 5.50 },
        { name: "Espresso", price: 3.00 },
        { name: "Mocha", price: 6.00 }
    ],
    invoices: JSON.parse(localStorage.getItem('haraz_invoices')) || [],
    payments: JSON.parse(localStorage.getItem('haraz_payments')) || []
};

let currentInvoiceItems = [];
let editingCustomerIndex = -1;
let editingInventoryIndex = -1;


// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    renderAll();

    // Set up item listener for price auto-fill and auto-focus
    const itemInput = document.getElementById('invoice-item-name');
    if (itemInput) {
        itemInput.addEventListener('input', (e) => {
            const item = state.inventory.find(i => i.name.toLowerCase() === e.target.value.toLowerCase());
            if (item) {
                document.getElementById('invoice-item-price').value = item.price;
                setTimeout(() => {
                    document.getElementById('invoice-item-qty').focus();
                    document.getElementById('invoice-item-qty').select();
                }, 10);
            }
        });
    }

    // Load email settings
    loadEmailSettings();

    // Enter Key Navigation & Auto-Add
    const focusChain = [
        'invoice-customer-name',
        'invoice-customer-phone',
        'invoice-item-name',
        'invoice-item-qty',
        'invoice-item-price'
    ];

    focusChain.forEach((id, index) => {
        const el = document.getElementById(id);
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Special case: Enter on Qty or Price adds the item
                if (id === 'invoice-item-qty' || id === 'invoice-item-price') {
                    addInvoiceItem();
                    document.getElementById('invoice-item-name').focus();
                } else {
                    const nextEl = document.getElementById(focusChain[index + 1]);
                    if (nextEl) {
                        nextEl.focus();
                        if (nextEl.select) nextEl.select();
                    }
                }
            }
        });
    });

    // Set up customer listener for phone auto-fill and auto-focus
    document.getElementById('invoice-customer-name').addEventListener('input', (e) => {
        const customer = state.customers.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
        if (customer) {
            document.getElementById('invoice-customer-phone').value = customer.phone;
            // Move focus to next field (Phone)
            setTimeout(() => {
                document.getElementById('invoice-customer-phone').focus();
                document.getElementById('invoice-customer-phone').select();
            }, 10);
        }
    });

    // Set up delivery charges listener
    document.getElementById('invoice-delivery').addEventListener('input', calculateInvoiceTotal);
});

function saveState() {
    localStorage.setItem('haraz_customers', JSON.stringify(state.customers));
    localStorage.setItem('haraz_inventory', JSON.stringify(state.inventory));
    localStorage.setItem('haraz_invoices', JSON.stringify(state.invoices));
    localStorage.setItem('haraz_payments', JSON.stringify(state.payments));
}

// Navigation Logic
function initNavigation() {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const tabId = link.getAttribute('data-tab');

            // UI Updates
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');

            renderTab(tabId);
        });
    });
}

function renderTab(tabId) {
    switch (tabId) {
        case 'dashboard': renderDashboard(); break;
        case 'invoice': populateInvoiceForm(); break;
        case 'reports': renderReports(); break;
        case 'payments': populatePaymentsTab(); break;
        case 'customers': renderCustomers(); break;
        case 'inventory': renderInventory(); break;
        case 'system': /* No specific render needed */ break;
    }
}

function renderAll() {
    renderDashboard();
    renderCustomers();
    renderInventory();
    renderReports();
}

// Dashboard
let salesBarChart = null;
let balancePieChart = null;

function renderDashboard() {
    const totalSale = state.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = state.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCredit = Math.max(0, totalSale - totalPaid);

    document.getElementById('dash-total-sale').textContent = `$${totalSale.toFixed(2)}`;
    document.getElementById('dash-total-credit').textContent = `$${totalCredit.toFixed(2)}`;
    document.getElementById('dash-customer-count').textContent = state.customers.length;

    initCharts(totalSale, totalPaid, totalCredit);
}

function initCharts(totalSale, totalPaid, totalCredit) {
    // 1. Sales Bar Chart (Sales per day for last 7 days)
    const ctxBar = document.getElementById('salesBarChart').getContext('2d');
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString();
    }).reverse();

    const dailySales = last7Days.map(date => {
        return state.invoices
            .filter(inv => inv.date === date)
            .reduce((sum, inv) => sum + inv.total, 0);
    });

    if (salesBarChart) salesBarChart.destroy();
    salesBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Daily Sales ($)',
                data: dailySales,
                backgroundColor: 'rgba(209, 184, 148, 0.6)',
                borderColor: '#d1b894',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { color: '#a0a0a0' } },
                x: { ticks: { color: '#a0a0a0' } }
            },
            plugins: { legend: { labels: { color: '#f0f0f0' } } }
        }
    });

    // 2. Balance Pie Chart (Paid vs Credit)
    const ctxPie = document.getElementById('balancePieChart').getContext('2d');
    if (balancePieChart) balancePieChart.destroy();
    balancePieChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['Total Paid', 'Total Credit'],
            datasets: [{
                data: [totalPaid, totalCredit],
                backgroundColor: ['#4ade80', '#f87171'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f0f0f0', padding: 20 }
                }
            }
        }
    });
}

// Customer Management
function renderCustomers() {
    const table = document.getElementById('customers-list-table');
    table.innerHTML = '';
    state.customers.forEach((c, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>
                <button class="btn btn-primary" style="padding: 5px 10px;" onclick="editCustomer(${index})"><i class="fas fa-edit"></i></button>
                <button class="btn" style="background: #e07a5f; padding: 5px 10px;" onclick="deleteCustomer(${index})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        table.appendChild(tr);
    });
}

function openCustomerModal() {
    editingCustomerIndex = -1;
    document.getElementById('customer-modal-title').textContent = "Add Customer";
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('customer-modal').style.display = 'flex';
}

function editCustomer(index) {
    editingCustomerIndex = index;
    const c = state.customers[index];
    document.getElementById('customer-modal-title').textContent = "Edit Customer";
    document.getElementById('cust-name').value = c.name;
    document.getElementById('cust-phone').value = c.phone;
    document.getElementById('customer-modal').style.display = 'flex';
}

document.getElementById('save-customer-btn').onclick = () => {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    if (!name || !phone) return alert('Please fill all fields');

    if (editingCustomerIndex > -1) {
        state.customers[editingCustomerIndex] = { name, phone };
    } else {
        state.customers.push({ name, phone });
    }
    saveState();
    closeModals();
    renderCustomers();
};

function deleteCustomer(index) {
    if (confirm('Delete this customer?')) {
        state.customers.splice(index, 1);
        saveState();
        renderCustomers();
    }
}

// Inventory Management
function renderInventory() {
    const table = document.getElementById('inventory-list-table');
    table.innerHTML = '';
    state.inventory.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.price.toFixed(2)}</td>
            <td>
                <button class="btn btn-primary" style="padding: 5px 10px;" onclick="editInventory(${index})"><i class="fas fa-edit"></i></button>
                <button class="btn" style="background: #e07a5f; padding: 5px 10px;" onclick="deleteInventory(${index})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        table.appendChild(tr);
    });
}

function openInventoryModal() {
    editingInventoryIndex = -1;
    document.getElementById('inventory-modal-title').textContent = "Add Item";
    document.getElementById('item-name').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('inventory-modal').style.display = 'flex';
}

function editInventory(index) {
    editingInventoryIndex = index;
    const item = state.inventory[index];
    document.getElementById('inventory-modal-title').textContent = "Edit Item";
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-price').value = item.price;
    document.getElementById('inventory-modal').style.display = 'flex';
}

document.getElementById('save-item-btn').onclick = () => {
    const name = document.getElementById('item-name').value;
    const price = parseFloat(document.getElementById('item-price').value);
    if (!name || isNaN(price)) return alert('Please fill all fields');

    if (editingInventoryIndex > -1) {
        state.inventory[editingInventoryIndex] = { name, price };
    } else {
        state.inventory.push({ name, price });
    }
    saveState();
    closeModals();
    renderInventory();
};

function deleteInventory(index) {
    if (confirm('Delete this item?')) {
        state.inventory.splice(index, 1);
        saveState();
        renderInventory();
    }
}

// Invoice Generation
function populateInvoiceForm() {
    const custDataList = document.getElementById('customer-list');
    custDataList.innerHTML = '';
    state.customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        custDataList.appendChild(opt);
    });

    const itemDataList = document.getElementById('inventory-items-list');
    itemDataList.innerHTML = '';
    state.inventory.forEach(i => {
        const opt = document.createElement('option');
        opt.value = i.name;
        itemDataList.appendChild(opt);
    });
}

function addInvoiceItem() {
    const itemName = document.getElementById('invoice-item-name').value.trim();
    const qty = parseInt(document.getElementById('invoice-item-qty').value);
    const price = parseFloat(document.getElementById('invoice-item-price').value);

    if (!itemName || isNaN(qty) || isNaN(price)) return alert('Enter item name, quantity and price');

    // Auto-save item to inventory if new
    const existingItem = state.inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    if (!existingItem) {
        state.inventory.push({ name: itemName, price: price });
        saveState();
        renderInventory();
        populateInvoiceForm(); // Refresh datalists
    }

    currentInvoiceItems.push({
        name: itemName,
        qty: qty,
        price: price,
        subtotal: qty * price
    });

    // Clear item fields for next entry
    document.getElementById('invoice-item-name').value = '';
    document.getElementById('invoice-item-qty').value = '1';
    document.getElementById('invoice-item-price').value = '';

    renderInvoiceItems();
    calculateInvoiceTotal();
}

function renderInvoiceItems() {
    const tbody = document.querySelector('#invoice-items-table tbody');
    tbody.innerHTML = '';
    currentInvoiceItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${item.subtotal.toFixed(2)}</td>
            <td><button class="btn" style="background: #e07a5f; padding: 5px 10px;" onclick="removeInvoiceItem(${index})"><i class="fas fa-times"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function removeInvoiceItem(index) {
    currentInvoiceItems.splice(index, 1);
    renderInvoiceItems();
    calculateInvoiceTotal();
}

function calculateInvoiceTotal() {
    const delivery = parseFloat(document.getElementById('invoice-delivery').value) || 0;
    const itemsTotal = currentInvoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
    const total = itemsTotal + delivery;
    document.getElementById('invoice-total-display').textContent = `$${total.toFixed(2)}`;
    return total;
}

function generateInvoice() {
    const custName = document.getElementById('invoice-customer-name').value.trim();
    const custPhone = document.getElementById('invoice-customer-phone').value.trim();
    const delivery = parseFloat(document.getElementById('invoice-delivery').value) || 0;

    if (!custName || !custPhone) return alert('Enter customer name and phone');
    if (currentInvoiceItems.length === 0) return alert('Add at least one item');

    // Check if html2canvas is loaded
    if (typeof html2canvas === 'undefined') {
        return alert("Error: html2canvas library not loaded. Check internet connection.");
    }

    // Auto-save customer if new
    let customer = state.customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
    if (!customer) {
        customer = { name: custName, phone: custPhone };
        state.customers.push(customer);
        saveState();
        renderCustomers();
        populateInvoiceForm();
    }

    const total = calculateInvoiceTotal();
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const date = new Date().toLocaleDateString();

    const newInvoice = {
        id: invoiceId,
        date: date,
        customer: customer,
        items: [...currentInvoiceItems],
        delivery: delivery,
        total: total,
        paid: 0
    };

    state.invoices.push(newInvoice);
    saveState();

    // Generate Image (JPG)
    generateImageInvoice(newInvoice);

    // Reset Form
    currentInvoiceItems = [];
    document.getElementById('invoice-delivery').value = 0;
    document.getElementById('invoice-customer-name').value = '';
    document.getElementById('invoice-customer-phone').value = '';
    renderInvoiceItems();
    calculateInvoiceTotal();
    renderAll();
}

function generatePDFInvoice(inv) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        compress: true
    });

    const logoImg = new Image();

    // Define onload handler BEFORE setting src
    logoImg.onload = function () {
        // Add logo
        const logoWidth = 60;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth || 20; // Default height if calculation fails
        const logoX = (doc.internal.pageSize.width - logoWidth) / 2;
        doc.addImage(logoImg, 'PNG', logoX, 10, logoWidth, logoHeight, undefined, 'FAST');

        // Company name
        doc.setFontSize(20);
        doc.setDrawColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("Haraz Coffee House", doc.internal.pageSize.width / 2, logoHeight + 20, { align: 'center' });

        // Invoice title
        doc.setFontSize(16);
        doc.text("INVOICE", doc.internal.pageSize.width / 2, logoHeight + 30, { align: 'center' });

        // Invoice details
        let yPos = logoHeight + 45;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Left side - Customer info
        doc.setFont("helvetica", "bold");
        doc.text("Client:", 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(inv.customer.name || "", 20, yPos + 6);
        doc.text(inv.customer.phone || "", 20, yPos + 12);

        // Right side - Invoice info
        doc.setFont("helvetica", "bold");
        doc.text("Invoice ID:", 140, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(inv.id, 170, yPos);
        doc.setFont("helvetica", "bold");
        doc.text("Date:", 140, yPos + 6);
        doc.setFont("helvetica", "normal");
        doc.text(inv.date, 170, yPos + 6);

        // Separator line
        yPos += 20;
        doc.setLineWidth(0.5);
        doc.line(20, yPos, 190, yPos);

        // Table headers
        yPos += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("No.", 20, yPos);
        doc.text("Item Name", 35, yPos);
        doc.text("Qty", 120, yPos);
        doc.text("Price", 145, yPos);
        doc.text("Total", 175, yPos);

        // Table separator
        yPos += 2;
        doc.setLineWidth(0.3);
        doc.line(20, yPos, 190, yPos);

        // Table items
        doc.setFont("helvetica", "normal");
        yPos += 8;
        inv.items.forEach((item, index) => {
            // Check for page break (basic implementation)
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text((index + 1).toString(), 20, yPos);
            doc.text(item.name.substring(0, 40), 35, yPos);
            doc.text(item.qty.toString(), 120, yPos);
            doc.text(`$${item.price.toFixed(2)}`, 145, yPos);
            doc.text(`$${(item.qty * item.price).toFixed(2)}`, 175, yPos);
            yPos += 8;
        });

        // Bottom separator
        doc.setLineWidth(0.3);
        doc.line(20, yPos, 190, yPos);

        // Delivery charges
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.text("Delivery Charges:", 145, yPos);
        doc.text(`$${(inv.delivery || 0).toFixed(2)}`, 175, yPos);

        // Grand Total
        yPos += 8;
        doc.setLineWidth(0.5);
        doc.line(140, yPos - 2, 190, yPos - 2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Grand Total:", 145, yPos + 3);
        doc.text(`$${inv.total.toFixed(2)}`, 175, yPos + 3);

        // Footer
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Thank you for your business!", doc.internal.pageSize.width / 2, 285, { align: 'center' });

        // Sanitize filename
        const safeName = (inv.customer.name || "Customer").replace(/[/\\?%*:|"<>]/g, '-');
        doc.save(`${inv.id}_${safeName}.pdf`);
    };

    logoImg.onerror = function () {
        generatePDFWithoutLogo(doc, inv);
    };

    // Set src AFTER onload
    logoImg.src = 'logo_cinv.png';
}

function generatePDFWithoutLogo(doc, inv) {
    // Company name
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Haraz Coffee House", doc.internal.pageSize.width / 2, 20, { align: 'center' });

    // Invoice title
    doc.setFontSize(16);
    doc.text("INVOICE", doc.internal.pageSize.width / 2, 30, { align: 'center' });

    // Invoice details
    let yPos = 45;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Left side - Customer info
    doc.setFont("helvetica", "bold");
    doc.text("Client:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(inv.customer.name || "", 20, yPos + 6);
    doc.text(inv.customer.phone || "", 20, yPos + 12);

    // Right side - Invoice info
    doc.setFont("helvetica", "bold");
    doc.text("Invoice ID:", 140, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(inv.id, 170, yPos);
    doc.setFont("helvetica", "bold");
    doc.text("Date:", 140, yPos + 6);
    doc.setFont("helvetica", "normal");
    doc.text(inv.date, 170, yPos + 6);

    // Separator line
    yPos += 20;
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);

    // Table headers
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("No.", 20, yPos);
    doc.text("Item Name", 35, yPos);
    doc.text("Qty", 120, yPos);
    doc.text("Price", 145, yPos);
    doc.text("Total", 175, yPos);

    // Table separator
    yPos += 2;
    doc.setLineWidth(0.3);
    doc.line(20, yPos, 190, yPos);

    // Table items
    doc.setFont("helvetica", "normal");
    yPos += 8;
    inv.items.forEach((item, index) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        doc.text((index + 1).toString(), 20, yPos);
        doc.text(item.name.substring(0, 40), 35, yPos);
        doc.text(item.qty.toString(), 120, yPos);
        doc.text(`$${item.price.toFixed(2)}`, 145, yPos);
        doc.text(`$${(item.qty * item.price).toFixed(2)}`, 175, yPos);
        yPos += 8;
    });

    // Bottom separator
    doc.setLineWidth(0.3);
    doc.line(20, yPos, 190, yPos);

    // Delivery charges
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.text("Delivery Charges:", 145, yPos);
    doc.text(`$${(inv.delivery || 0).toFixed(2)}`, 175, yPos);

    // Grand Total
    yPos += 8;
    doc.setLineWidth(0.5);
    doc.line(140, yPos - 2, 190, yPos - 2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Grand Total:", 145, yPos + 3);
    doc.text(`$${inv.total.toFixed(2)}`, 175, yPos + 3);

    // Footer
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for your business!", doc.internal.pageSize.width / 2, 285, { align: 'center' });

    // Save PDF
    const safeName = (inv.customer.name || "Customer").replace(/[/\\?%*:|"<>]/g, '-');
    doc.save(`${inv.id}_${safeName}.pdf`);
}

// Reports
function renderReports() {
    const totalSale = state.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = state.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCredit = totalSale - totalPaid;

    document.getElementById('report-total-sale').textContent = `$${totalSale.toFixed(2)}`;
    document.getElementById('report-total-credit').textContent = `$${totalCredit.toFixed(2)}`;

    const table = document.querySelector('#all-invoices-table tbody');
    table.innerHTML = '';
    state.invoices.slice().reverse().forEach(inv => {
        const paidForThis = state.payments
            .filter(p => p.invoiceId === inv.id)
            .reduce((sum, p) => sum + p.amount, 0);

        const credit = inv.total - paidForThis;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${inv.id}</td>
            <td>${inv.date}</td>
            <td>${inv.customer.name}</td>
            <td>$${inv.total.toFixed(2)}</td>
            <td style="color: #4ade80;">$${paidForThis.toFixed(2)}</td>
            <td style="color: ${credit > 0 ? '#f87171' : '#4ade80'};">$${credit.toFixed(2)}</td>
            <td>
                 <div style="display: flex; gap: 5px;">
                    <button class="btn btn-primary" title="Print/PDF" style="padding: 5px 10px;" onclick="printExistingInvoice('${inv.id}')"><i class="fas fa-print"></i></button>
                    <button class="btn" title="Delete Invoice" style="background: #ef4444; color: white; padding: 5px 10px;" onclick="deleteInvoice('${inv.id}')"><i class="fas fa-trash"></i></button>
                 </div>
            </td>
            <td>
                 <button class="btn" title="Email Invoice" style="background: #e07a5f; padding: 5px 10px;" onclick="emailInvoice('${inv.id}')"><i class="fas fa-envelope"></i></button>
            </td>
        `;
        table.appendChild(tr);
    });
}

function deleteInvoice(id) {
    if (!confirm("Are you sure you want to delete this invoice? This will also delete any associated payment records for this invoice.")) return;

    state.invoices = state.invoices.filter(inv => inv.id !== id);
    state.payments = state.payments.filter(p => p.invoiceId !== id);

    saveState();
    renderReports();
    renderDashboard();
    alert("Invoice deleted successfully.");
}

function renderInvoiceForPrint(inv) {
    document.getElementById('print-cust-name').textContent = inv.customer.name;
    document.getElementById('print-cust-phone').textContent = inv.customer.phone;
    document.getElementById('print-invoice-id').textContent = inv.id;
    document.getElementById('print-date').textContent = inv.date;

    const printBody = document.getElementById('print-items-body');
    printBody.innerHTML = '';
    inv.items.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.qty * item.price).toFixed(2)}</td>
        `;
        printBody.appendChild(tr);
    });

    document.getElementById('print-delivery').textContent = `$${inv.delivery.toFixed(2)}`;
    document.getElementById('print-grand-total').textContent = `$${inv.total.toFixed(2)}`;

    // SVG logos are now inline in index.html, so no manual conversion is needed.
    // This avoids "tainted canvas" errors while keeping the logo vector-sharp.
    return Promise.resolve();
}

function generateImageInvoice(inv) {
    // Render to print area
    renderInvoiceForPrint(inv).then(() => {
        const printArea = document.getElementById('print-area');
        const logoImg = document.getElementById('print-logo-img');

        // Use Base64 Logo if available to prevent Tainted Canvas error
        if (typeof LOGO_BASE64 !== 'undefined') {
            logoImg.src = 'data:image/png;base64,' + LOGO_BASE64;
        }

        // Wait for image render (base64 is instant, but good practice)
        setTimeout(() => {
            html2canvas(printArea, {
                scale: 2,
                useCORS: true,
                allowTaint: false // Should be false if we want valid export
            }).then(canvas => {
                try {
                    const link = document.createElement('a');
                    link.download = `Invoice_${inv.id}.jpg`;
                    link.href = canvas.toDataURL("image/jpeg", 0.9);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (e) {
                    console.error("Canvas Export Error:", e);
                    alert("Error saving image. Please ensure no external images are blocking the operation.");
                }
            }).catch(err => {
                console.error("html2canvas Error:", err);
                // Fallback to print if canvas fails
                window.print();
            });
        }, 100);
    });
}

function printExistingInvoice(id) {
    const inv = state.invoices.find(i => i.id === id);
    if (!inv) return;
    generateImageInvoice(inv);
}

// Payments
function populatePaymentsTab() {
    const sel = document.getElementById('payment-customer');
    sel.innerHTML = '<option value="">Select Customer</option>';
    state.customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        sel.appendChild(opt);
    });
    document.getElementById('payment-form').style.display = 'none';
    document.getElementById('customer-credit-info').innerHTML = '';
}

function loadCustomerInvoices() {
    const name = document.getElementById('payment-customer').value;
    if (!name) return;

    const invoices = state.invoices.filter(inv => inv.customer.name === name);
    const invSelect = document.getElementById('payment-invoice');
    invSelect.innerHTML = '<option value="">Select Invoice</option>';

    let totalCredit = 0;

    invoices.forEach(inv => {
        const paid = state.payments
            .filter(p => p.invoiceId === inv.id)
            .reduce((sum, p) => sum + p.amount, 0);

        const credit = inv.total - paid;
        if (credit > 0) {
            totalCredit += credit;
            const opt = document.createElement('option');
            opt.value = inv.id;
            opt.textContent = `${inv.id} - Total: $${inv.total.toFixed(2)} (Due: $${credit.toFixed(2)})`;
            invSelect.appendChild(opt);
        }
    });

    document.getElementById('customer-credit-info').innerHTML = `
        <div class="stat-card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px;">
            <span>Total Outstanding Credit:</span>
            <span style="font-size: 1.5rem; color: #f87171; font-weight: 700;">$${totalCredit.toFixed(2)}</span>
        </div>
    `;

    document.getElementById('payment-form').style.display = 'block';
}

function processPayment() {
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const invoiceId = document.getElementById('payment-invoice').value;

    if (!invoiceId || isNaN(amount) || amount <= 0) return alert('Select invoice and valid amount');

    // Verify amount doesn't exceed credit
    const inv = state.invoices.find(i => i.id === invoiceId);
    const paidAlready = state.payments
        .filter(p => p.invoiceId === invoiceId)
        .reduce((sum, p) => sum + p.amount, 0);
    const credit = inv.total - paidAlready;

    if (amount > credit) {
        if (!confirm(`Payment exceeds due amount ($${credit.toFixed(2)}). Continue?`)) return;
    }

    state.payments.push({
        invoiceId: invoiceId,
        amount: amount,
        date: new Date().toLocaleDateString()
    });

    saveState();
    alert('Payment recorded successfully!');
    document.getElementById('payment-amount').value = '';
    loadCustomerInvoices();
    renderAll();
}

// Utils
function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) closeModals();
};

// System Functions
function backupDatabase() {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `Haraz_DB_Backup_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function restoreDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedState = JSON.parse(e.target.result);
            if (importedState.customers && importedState.invoices) {
                state = importedState;
                saveState();
                alert('Database restored successfully!');
                location.reload();
            } else {
                alert('Invalid database file!');
            }
        } catch (err) {
            alert('Error parsing database file!');
        }
    };
    reader.readAsText(file);
}

function resetDatabase() {
    if (confirm("CRITICAL: This will permanently delete ALL customers, items, invoices, and payments. Are you absolutely sure?")) {
        localStorage.clear();
        alert("All data has been cleared.");
        location.reload();
    }
}

// Mobile Menu Helpers
function toggleMobileMenu() {
    document.querySelector('.sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

function closeMobileMenu() {
    document.querySelector('.sidebar').classList.remove('active');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

function requestFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

// Email Helpers
function saveEmailSettings() {
    const email = document.getElementById('sender-email').value;
    const password = document.getElementById('sender-password').value;
    if (email && password) {
        localStorage.setItem('haraz_sender_email', email);
        localStorage.setItem('haraz_sender_password', password);
        alert('Email credentials saved locally!');
    } else {
        alert('Please enter both email and password.');
    }
}

function loadEmailSettings() {
    const email = localStorage.getItem('haraz_sender_email');
    const password = localStorage.getItem('haraz_sender_password');
    if (email) {
        const emailInput = document.getElementById('sender-email');
        if (emailInput) emailInput.value = email;
    }
    if (password) {
        const passInput = document.getElementById('sender-password');
        if (passInput) passInput.value = password;
    }
}

function emailInvoice(id) {
    const inv = state.invoices.find(i => i.id === id);
    if (!inv) return alert("Invoice not found");

    const currentCustomer = state.customers.find(c => c.name === inv.customer.name);
    // Prefer customer email from current record, fallback to invoice record
    const customerEmail = (currentCustomer && currentCustomer.email) || inv.customer.email;

    if (!customerEmail) {
        return alert("This customer does not have an email address saved. Please edit the customer details in the 'Manage Customers' tab to add an email.");
    }

    // Show status
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) {
        syncStatus.innerHTML = '<i class="fas fa-cog fa-spin"></i> Preparing Invoice Attachment...';
        syncStatus.style.display = 'block';
    }

    // Generate Image (will download automatically)
    generateImageInvoice(inv);

    if (syncStatus) {
        setTimeout(() => { syncStatus.style.display = 'none'; }, 1000);
    }

    // Open Email Client
    const senderEmail = localStorage.getItem('haraz_sender_email');
    const subject = `Invoice #${inv.id} from Haraz Coffee House`;
    const body = `Dear ${inv.customer.name},\n\nPlease find your invoice attached to this email.\n\nInvoice ID: #${inv.id}\nDate: ${inv.date}\nTotal Amount: $${inv.total.toFixed(2)}\n\nThank you for your business!\n\n${senderEmail ? 'Sent from: ' + senderEmail : ''}`;

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    let url = `mailto:${customerEmail}?subject=${encodedSubject}&body=${encodedBody}`;

    if (senderEmail && senderEmail.includes('@')) {
        const domain = senderEmail.split('@')[1].toLowerCase();
        if (domain.includes('gmail.com')) {
            url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${encodedSubject}&body=${encodedBody}`;
        } else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live') || domain.includes('msn')) {
            url = `https://outlook.live.com/default.aspx?rru=compose&to=${encodeURIComponent(customerEmail)}&subject=${encodedSubject}&body=${encodedBody}`;
        } else if (domain.includes('yahoo') || domain.includes('ymail')) {
            url = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(customerEmail)}&subject=${encodedSubject}&body=${encodedBody}`;
        }
    }

    setTimeout(() => {
        window.open(url, '_blank');
        alert("The invoice Image has been downloaded/saved to your device.\n\nPlease attach it to the email that just opened.");
    }, 500);
}
// GitHub Database Logic
const GH_OWNER = 'syedahsanzafar';
const GH_REPO = 'Haraz_Invoice';
const GH_PATH = 'Haraz_inv_db.json';
// Note: We use the raw URL for loading without token (if public) or API for authenticated ops
const GH_RAW_URL = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${GH_PATH}`;

function saveGithubSettings() {
    const token = document.getElementById('github-token').value;
    if (token) {
        localStorage.setItem('haraz_gh_token', token);
        alert('GitHub Token saved!');
    } else {
        alert('Please enter a token');
    }
}

function loadGithubSettings() {
    const token = localStorage.getItem('haraz_gh_token');
    if (token) {
        const el = document.getElementById('github-token');
        if (el) el.value = token;
    }
}

// Call this on init
document.addEventListener('DOMContentLoaded', loadGithubSettings);

async function loadFromCloud() {
    const btn = event ? event.target : null;
    const originalText = btn ? btn.innerHTML : '';
    if (btn) btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Loading...';

    // Update status bar
    const cloudStatus = document.getElementById('cloud-status-indicator');
    if (cloudStatus) cloudStatus.innerHTML = '<i class="fas fa-sync fa-spin" style="color: #3b82f6;"></i>Cloud: Pulling...';

    try {
        // Try getting from API first (better validation) if token exists, else raw
        const token = localStorage.getItem('haraz_gh_token');
        let data;

        if (token) {
            const response = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3.raw'
                }
            });
            if (!response.ok) throw new Error('GitHub API Error: ' + response.statusText);
            data = await response.json();
        } else {
            const response = await fetch(GH_RAW_URL);
            if (!response.ok) throw new Error('Fetch Error: ' + response.statusText);
            data = await response.json();
        }

        if (data && data.customers && data.invoices) {
            state = data;
            saveState();
            renderAll();
            alert('Database successfully loaded from GitHub!');
            if (cloudStatus) cloudStatus.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i>Cloud: Synced';
        } else {
            alert('Invalid database format received.');
            if (cloudStatus) cloudStatus.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>Cloud: Error';
        }

    } catch (err) {
        console.error(err);
        alert('Failed to load from cloud: ' + err.message);
        if (cloudStatus) cloudStatus.innerHTML = '<i class="fas fa-times" style="color: #ef4444;"></i>Cloud: Failed';
    } finally {
        if (btn) btn.innerHTML = originalText;
    }
}

async function saveToCloud() {
    const token = localStorage.getItem('haraz_gh_token');
    if (!token) return alert('Please save your GitHub Personal Access Token in the System tab first.');

    const btn = event ? event.target : null;
    const originalText = btn ? btn.innerHTML : '';
    if (btn) btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';

    // Update status bar
    const cloudStatus = document.getElementById('cloud-status-indicator');
    if (cloudStatus) cloudStatus.innerHTML = '<i class="fas fa-sync fa-spin" style="color: #3b82f6;"></i>Cloud: Pushing...';

    try {
        // 1. Get current SHA
        const getUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`;
        const getResp = await fetch(getUrl, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (!getResp.ok && getResp.status !== 404) throw new Error('Failed to check file status');

        let sha = null;
        if (getResp.ok) {
            const fileData = await getResp.json();
            sha = fileData.sha;
        }

        // 2. Prepare content (Base64)
        // btoa works for ASCII. For UTF-8, we need a workaround or valid encoding.
        // Simple hack for unicode: btoa(unescape(encodeURIComponent(str)))
        const contentStr = JSON.stringify(state, null, 2);
        const contentBase64 = btoa(unescape(encodeURIComponent(contentStr)));

        // 3. PUT
        const putBody = {
            message: `Update Database: ${new Date().toLocaleString()}`,
            content: contentBase64,
            sha: sha // undefined if new file? No, GitHub API requires omission if new, but sending null might fail.
        };
        if (sha) putBody.sha = sha;

        const putResp = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(putBody)
        });

        if (!putResp.ok) throw new Error('Save failed: ' + putResp.statusText);

        alert('Database saved to GitHub successfully!');
        if (cloudStatus) cloudStatus.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i>Cloud: Saved';

    } catch (err) {
        console.error(err);
        alert('Cloud Save Error: ' + err.message);
        if (cloudStatus) cloudStatus.innerHTML = '<i class="fas fa-times" style="color: #ef4444;"></i>Cloud: Failed';
    } finally {
        if (btn) btn.innerHTML = originalText;
    }
}
