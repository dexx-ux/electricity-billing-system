// ============ API CONFIGURATION ============
// This automatically works on both localhost and Railway!
const API_URL = window.location.origin + '/api';

let chartInstance = null;

// ============ SIDEBAR TOGGLE ============
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.toggle-sidebar');
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// ============ NAVIGATION ============
document.querySelectorAll('.menu-item').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.menu-item').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        const section = this.dataset.section;
        loadSection(section);
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

// ============ LOAD SECTIONS ============
async function loadSection(section) {
    const title = document.getElementById('pageTitle');
    const content = document.getElementById('contentArea');
    
    switch(section) {
        case 'dashboard':
            title.textContent = '📊 Dashboard';
            await loadDashboard(content);
            break;
        case 'customers':
            title.textContent = '👥 Customers';
            await loadCustomers(content);
            break;
        case 'readings':
            title.textContent = '📊 Meter Readings';
            await loadReadings(content);
            break;
        case 'bills':
            title.textContent = '📄 Bills';
            await loadBills(content);
            break;
        case 'payments':
            title.textContent = '💳 Payments';
            await loadPayments(content);
            break;
        case 'reports':
            title.textContent = '📋 Reports';
            await loadReports(content);
            break;
        default:
            title.textContent = 'Dashboard';
            await loadDashboard(content);
    }
}

// ============ DASHBOARD ============
async function loadDashboard(container) {
    try {
        const response = await fetch(API_URL + '/reports/summary');
        if (!response.ok) throw new Error('Server not responding');
        const data = await response.json();
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card purple">
                    <div class="stat-header">
                        <span class="stat-label">Total Customers</span>
                        <i class="fas fa-users stat-icon"></i>
                    </div>
                    <div class="stat-number">${data.totalCustomers}</div>
                    <div class="stat-change">Registered accounts</div>
                </div>
                <div class="stat-card yellow">
                    <div class="stat-header">
                        <span class="stat-label">Unpaid Bills</span>
                        <i class="fas fa-exclamation-triangle stat-icon"></i>
                    </div>
                    <div class="stat-number">${data.unpaidBills}</div>
                    <div class="stat-change">Need payment</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-header">
                        <span class="stat-label">Paid Bills</span>
                        <i class="fas fa-check-circle stat-icon"></i>
                    </div>
                    <div class="stat-number">${data.paidBills}</div>
                    <div class="stat-change">Completed payments</div>
                </div>
                <div class="stat-card blue">
                    <div class="stat-header">
                        <span class="stat-label">Total Revenue</span>
                        <i class="fas fa-money-bill-wave stat-icon"></i>
                    </div>
                    <div class="stat-number">₱${data.totalRevenue.toFixed(2)}</div>
                    <div class="stat-change">All time collections</div>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-lg-8">
                    <div class="chart-container">
                        <h6 style="margin-bottom: 1rem; font-weight: 600;">Monthly Revenue</h6>
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="recent-activity">
                        <h6 style="font-weight: 600; margin-bottom: 1rem;">Recent Activity</h6>
                        <div id="recentActivity">
                            <div class="activity-item">
                                <div class="activity-icon"><i class="fas fa-user-plus"></i></div>
                                <div class="activity-text">
                                    <div class="title">System Ready</div>
                                    <div class="time">Your billing system is online</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const ctx = document.getElementById('revenueChart');
            if (ctx) {
                if (chartInstance) chartInstance.destroy();
                chartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Revenue (₱)',
                            data: [1200, 1900, 1500, 2100, 1800, data.totalRevenue || 0],
                            backgroundColor: 'rgba(79, 70, 229, 0.7)',
                            borderColor: '#4f46e5',
                            borderWidth: 2,
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(0,0,0,0.05)' }
                            },
                            x: {
                                grid: { display: false }
                            }
                        }
                    }
                });
            }
        }, 100);

    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-warning" style="border-radius: 12px; padding: 2rem;">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Cannot connect to server.</strong> 
                <p class="mt-2 mb-0">Make sure the backend is running.</p>
            </div>
        `;
    }
}

// ============ CUSTOMERS CRUD ============
async function loadCustomers(container) {
    try {
        const response = await fetch(API_URL + '/customers');
        const customers = await response.json();
        
        let html = `
            <div class="table-container">
                <div class="table-header">
                    <h5><i class="fas fa-users me-2" style="color: var(--primary);"></i>Customer List</h5>
                    <button class="btn btn-primary-custom btn-sm" onclick="showAddCustomer()">
                        <i class="fas fa-plus me-1"></i> Add Customer
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table-ebms">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Address</th>
                                <th>Contact</th>
                                <th>Meter</th>
                                <th>Status</th>
                                <th style="text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        if (customers.length === 0) {
            html += `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem 0; color: var(--gray);">
                        <i class="fas fa-users" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.3;"></i>
                        No customers yet. Click "Add Customer" to get started.
                    </td>
                </tr>
            `;
        } else {
            customers.forEach(c => {
                html += `
                    <tr>
                        <td><strong>#${c.customer_id}</strong></td>
                        <td><strong>${c.fullname}</strong></td>
                        <td>${c.address || '-'}</td>
                        <td>${c.contact_number || '-'}</td>
                        <td><code style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${c.meter_number}</code></td>
                        <td><span class="badge-status ${c.status?.toLowerCase()}">${c.status || 'Active'}</span></td>
                        <td style="text-align: center; white-space: nowrap;">
                            <button class="action-btn" onclick="editCustomer(${c.customer_id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteCustomer(${c.customer_id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `</tbody></table></div></div>`;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error loading customers</div>`;
    }
}

function showAddCustomer() {
    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    document.getElementById('formModalLabel').textContent = 'Add New Customer';
    document.getElementById('formModalBody').innerHTML = `
        <form id="customerForm" class="modal-form">
            <div class="row g-2">
                <div class="col-md-6 mb-2">
                    <label>Full Name *</label>
                    <input class="form-control" id="c_fullname" placeholder="Juan Dela Cruz" required>
                </div>
                <div class="col-md-6 mb-2">
                    <label>Meter Number *</label>
                    <input class="form-control" id="c_meter" placeholder="MTR-001" required>
                </div>
                <div class="col-md-12 mb-2">
                    <label>Address</label>
                    <input class="form-control" id="c_address" placeholder="123 Street, City">
                </div>
                <div class="col-md-6 mb-2">
                    <label>Contact Number</label>
                    <input class="form-control" id="c_contact" placeholder="0917-123-4567">
                </div>
                <div class="col-md-6 mb-2">
                    <label>Email</label>
                    <input type="email" class="form-control" id="c_email" placeholder="email@example.com">
                </div>
                <div class="col-md-12 mb-2">
                    <label>Status</label>
                    <select class="form-select" id="c_status">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>
            <button type="submit" class="btn btn-primary-custom w-100 mt-2">Save Customer</button>
        </form>
    `;
    
    document.getElementById('customerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const data = {
            fullname: document.getElementById('c_fullname').value,
            address: document.getElementById('c_address').value,
            contact_number: document.getElementById('c_contact').value,
            email: document.getElementById('c_email').value,
            meter_number: document.getElementById('c_meter').value,
            status: document.getElementById('c_status').value
        };
        
        try {
            const response = await fetch(API_URL + '/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                modal.hide();
                loadSection('customers');
            } else {
                alert('Error adding customer');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
    
    modal.show();
}

async function editCustomer(id) {
    try {
        const response = await fetch(API_URL + '/customers');
        const customers = await response.json();
        const customer = customers.find(c => c.customer_id === id);
        if (!customer) return alert('Customer not found');
        
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        document.getElementById('formModalLabel').textContent = 'Edit Customer';
        document.getElementById('formModalBody').innerHTML = `
            <form id="customerForm" class="modal-form">
                <div class="row g-2">
                    <div class="col-md-6 mb-2">
                        <label>Full Name *</label>
                        <input class="form-control" id="c_fullname" value="${customer.fullname}" required>
                    </div>
                    <div class="col-md-6 mb-2">
                        <label>Meter Number *</label>
                        <input class="form-control" id="c_meter" value="${customer.meter_number}" required>
                    </div>
                    <div class="col-md-12 mb-2">
                        <label>Address</label>
                        <input class="form-control" id="c_address" value="${customer.address || ''}">
                    </div>
                    <div class="col-md-6 mb-2">
                        <label>Contact Number</label>
                        <input class="form-control" id="c_contact" value="${customer.contact_number || ''}">
                    </div>
                    <div class="col-md-6 mb-2">
                        <label>Email</label>
                        <input type="email" class="form-control" id="c_email" value="${customer.email || ''}">
                    </div>
                    <div class="col-md-12 mb-2">
                        <label>Status</label>
                        <select class="form-select" id="c_status">
                            <option value="Active" ${customer.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${customer.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary-custom w-100 mt-2">Update Customer</button>
            </form>
        `;
        
        document.getElementById('customerForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const data = {
                fullname: document.getElementById('c_fullname').value,
                address: document.getElementById('c_address').value,
                contact_number: document.getElementById('c_contact').value,
                email: document.getElementById('c_email').value,
                meter_number: document.getElementById('c_meter').value,
                status: document.getElementById('c_status').value
            };
            
            try {
                const response = await fetch(API_URL + '/customers/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    modal.hide();
                    loadSection('customers');
                } else {
                    alert('Error updating customer');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
        
        modal.show();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteCustomer(id) {
    if (!confirm('Delete this customer?')) return;
    try {
        const response = await fetch(API_URL + '/customers/' + id, { method: 'DELETE' });
        if (response.ok) {
            loadSection('customers');
        } else {
            alert('Error deleting customer');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============ READINGS CRUD ============
async function loadReadings(container) {
    try {
        const response = await fetch(API_URL + '/readings');
        const readings = await response.json();
        
        let html = `
            <div class="table-container">
                <div class="table-header">
                    <h5><i class="fas fa-gauge-high me-2" style="color: var(--primary);"></i>Meter Readings</h5>
                    <button class="btn btn-primary-custom btn-sm" onclick="showAddReading()">
                        <i class="fas fa-plus me-1"></i> Add Reading
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table-ebms">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Previous</th>
                                <th>Current</th>
                                <th>Consumption</th>
                                <th>Date</th>
                                <th style="text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        if (readings.length === 0) {
            html += `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem 0; color: var(--gray);">
                        <i class="fas fa-gauge-high" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.3;"></i>
                        No readings recorded yet.
                    </td>
                </tr>
            `;
        } else {
            readings.forEach(r => {
                html += `
                    <tr>
                        <td><strong>#${r.reading_id}</strong></td>
                        <td><strong>${r.fullname}</strong><br><small style="color: var(--gray);">${r.meter_number}</small></td>
                        <td>${r.previous_reading}</td>
                        <td>${r.current_reading}</td>
                        <td><strong>${r.consumption}</strong> kWh</td>
                        <td>${new Date(r.reading_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td style="text-align: center; white-space: nowrap;">
                            <button class="action-btn" onclick="editReading(${r.reading_id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteReading(${r.reading_id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `</tbody></table></div></div>`;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error loading readings</div>`;
    }
}

function showAddReading() {
    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    document.getElementById('formModalLabel').textContent = 'Add Meter Reading';
    
    fetch(API_URL + '/customers')
        .then(res => res.json())
        .then(customers => {
            document.getElementById('formModalBody').innerHTML = `
                <form id="readingForm" class="modal-form">
                    <div class="mb-2">
                        <label>Customer *</label>
                        <select class="form-select" id="r_customer" required>
                            <option value="">Select Customer</option>
                            ${customers.map(c => `<option value="${c.customer_id}">${c.fullname} (${c.meter_number})</option>`).join('')}
                        </select>
                    </div>
                    <div class="row g-2">
                        <div class="col-md-6 mb-2">
                            <label>Previous Reading *</label>
                            <input type="number" class="form-control" id="r_previous" required>
                        </div>
                        <div class="col-md-6 mb-2">
                            <label>Current Reading *</label>
                            <input type="number" class="form-control" id="r_current" required>
                        </div>
                    </div>
                    <div class="mb-2">
                        <label>Reading Date *</label>
                        <input type="date" class="form-control" id="r_date" required>
                    </div>
                    <button type="submit" class="btn btn-primary-custom w-100 mt-2">Save Reading</button>
                </form>
            `;
            
            document.getElementById('readingForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                const data = {
                    customer_id: document.getElementById('r_customer').value,
                    previous_reading: parseFloat(document.getElementById('r_previous').value),
                    current_reading: parseFloat(document.getElementById('r_current').value),
                    reading_date: document.getElementById('r_date').value
                };
                
                try {
                    const response = await fetch(API_URL + '/readings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    if (response.ok) {
                        modal.hide();
                        loadSection('readings');
                    } else {
                        alert('Error adding reading');
                    }
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });
        });
    
    modal.show();
}

async function editReading(id) {
    try {
        const response = await fetch(API_URL + '/readings');
        const readings = await response.json();
        const reading = readings.find(r => r.reading_id === id);
        if (!reading) return alert('Reading not found');
        
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        document.getElementById('formModalLabel').textContent = 'Edit Reading';
        document.getElementById('formModalBody').innerHTML = `
            <form id="readingForm" class="modal-form">
                <div class="row g-2">
                    <div class="col-md-6 mb-2">
                        <label>Previous Reading *</label>
                        <input type="number" class="form-control" id="r_previous" value="${reading.previous_reading}" required>
                    </div>
                    <div class="col-md-6 mb-2">
                        <label>Current Reading *</label>
                        <input type="number" class="form-control" id="r_current" value="${reading.current_reading}" required>
                    </div>
                </div>
                <div class="mb-2">
                    <label>Reading Date *</label>
                    <input type="date" class="form-control" id="r_date" value="${reading.reading_date}" required>
                </div>
                <button type="submit" class="btn btn-primary-custom w-100 mt-2">Update Reading</button>
            </form>
        `;
        
        document.getElementById('readingForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const data = {
                previous_reading: parseFloat(document.getElementById('r_previous').value),
                current_reading: parseFloat(document.getElementById('r_current').value),
                reading_date: document.getElementById('r_date').value
            };
            
            try {
                const response = await fetch(API_URL + '/readings/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    modal.hide();
                    loadSection('readings');
                } else {
                    alert('Error updating reading');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
        
        modal.show();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteReading(id) {
    if (!confirm('Delete this reading?')) return;
    try {
        const response = await fetch(API_URL + '/readings/' + id, { method: 'DELETE' });
        if (response.ok) {
            loadSection('readings');
        } else {
            alert('Error deleting reading');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============ BILLS CRUD ============
async function loadBills(container) {
    try {
        const response = await fetch(API_URL + '/bills');
        const bills = await response.json();
        
        let html = `
            <div class="table-container">
                <div class="table-header">
                    <h5><i class="fas fa-file-invoice me-2" style="color: var(--primary);"></i>Bills</h5>
                    <button class="btn btn-primary-custom btn-sm" onclick="showAddBill()">
                        <i class="fas fa-plus me-1"></i> Generate Bill
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table-ebms">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Customer</th>
                                <th>Period</th>
                                <th>Amount</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th style="text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        if (bills.length === 0) {
            html += `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem 0; color: var(--gray);">
                        <i class="fas fa-file-invoice" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.3;"></i>
                        No bills generated yet.
                    </td>
                </tr>
            `;
        } else {
            bills.forEach(b => {
                html += `
                    <tr>
                        <td><strong>#${b.bill_id}</strong></td>
                        <td><strong>${b.fullname}</strong></td>
                        <td>${b.billing_period}</td>
                        <td><strong style="color: var(--primary);">₱${b.amount.toFixed(2)}</strong></td>
                        <td>${new Date(b.due_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td><span class="badge-status ${b.status?.toLowerCase()}">${b.status || 'Unpaid'}</span></td>
                        <td style="text-align: center; white-space: nowrap;">
                            <button class="action-btn" onclick="editBill(${b.bill_id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteBill(${b.bill_id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `</tbody></table></div></div>`;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error loading bills</div>`;
    }
}

function showAddBill() {
    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    document.getElementById('formModalLabel').textContent = 'Generate Bill';
    
    fetch(API_URL + '/customers')
        .then(res => res.json())
        .then(customers => {
            document.getElementById('formModalBody').innerHTML = `
                <form id="billForm" class="modal-form">
                    <div class="mb-2">
                        <label>Customer *</label>
                        <select class="form-select" id="b_customer" required>
                            <option value="">Select Customer</option>
                            ${customers.map(c => `<option value="${c.customer_id}">${c.fullname}</option>`).join('')}
                        </select>
                    </div>
                    <div class="mb-2">
                        <label>Billing Period *</label>
                        <input type="month" class="form-control" id="b_period" required>
                    </div>
                    <div class="row g-2">
                        <div class="col-md-6 mb-2">
                            <label>Amount (₱) *</label>
                            <input type="number" step="0.01" class="form-control" id="b_amount" required>
                        </div>
                        <div class="col-md-6 mb-2">
                            <label>Due Date *</label>
                            <input type="date" class="form-control" id="b_due" required>
                        </div>
                    </div>
                    <div class="mb-2">
                        <label>Status</label>
                        <select class="form-select" id="b_status">
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary-custom w-100 mt-2">Generate Bill</button>
                </form>
            `;
            
            document.getElementById('billForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                const data = {
                    customer_id: document.getElementById('b_customer').value,
                    billing_period: document.getElementById('b_period').value,
                    amount: parseFloat(document.getElementById('b_amount').value),
                    due_date: document.getElementById('b_due').value,
                    status: document.getElementById('b_status').value,
                    reading_id: 1
                };
                
                try {
                    const response = await fetch(API_URL + '/bills', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    if (response.ok) {
                        modal.hide();
                        loadSection('bills');
                    } else {
                        alert('Error generating bill');
                    }
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });
        });
    
    modal.show();
}

async function editBill(id) {
    try {
        const response = await fetch(API_URL + '/bills');
        const bills = await response.json();
        const bill = bills.find(b => b.bill_id === id);
        if (!bill) return alert('Bill not found');
        
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        document.getElementById('formModalLabel').textContent = 'Edit Bill';
        document.getElementById('formModalBody').innerHTML = `
            <form id="billForm" class="modal-form">
                <div class="mb-2">
                    <label>Billing Period *</label>
                    <input type="month" class="form-control" id="b_period" value="${bill.billing_period}" required>
                </div>
                <div class="row g-2">
                    <div class="col-md-6 mb-2">
                        <label>Amount (₱) *</label>
                        <input type="number" step="0.01" class="form-control" id="b_amount" value="${bill.amount}" required>
                    </div>
                    <div class="col-md-6 mb-2">
                        <label>Due Date *</label>
                        <input type="date" class="form-control" id="b_due" value="${bill.due_date}" required>
                    </div>
                </div>
                <div class="mb-2">
                    <label>Status</label>
                    <select class="form-select" id="b_status">
                        <option value="Unpaid" ${bill.status === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
                        <option value="Paid" ${bill.status === 'Paid' ? 'selected' : ''}>Paid</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary-custom w-100 mt-2">Update Bill</button>
            </form>
        `;
        
        document.getElementById('billForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const data = {
                billing_period: document.getElementById('b_period').value,
                amount: parseFloat(document.getElementById('b_amount').value),
                due_date: document.getElementById('b_due').value,
                status: document.getElementById('b_status').value
            };
            
            try {
                const response = await fetch(API_URL + '/bills/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    modal.hide();
                    loadSection('bills');
                } else {
                    alert('Error updating bill');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
        
        modal.show();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteBill(id) {
    if (!confirm('Delete this bill?')) return;
    try {
        const response = await fetch(API_URL + '/bills/' + id, { method: 'DELETE' });
        if (response.ok) {
            loadSection('bills');
        } else {
            alert('Error deleting bill');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============ PAYMENTS CRUD ============
async function loadPayments(container) {
    try {
        const response = await fetch(API_URL + '/payments');
        const payments = await response.json();
        
        let html = `
            <div class="table-container">
                <div class="table-header">
                    <h5><i class="fas fa-credit-card me-2" style="color: var(--primary);"></i>Payments</h5>
                    <button class="btn btn-primary-custom btn-sm" onclick="showAddPayment()">
                        <i class="fas fa-plus me-1"></i> Record Payment
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table-ebms">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Receipt</th>
                                <th>Date</th>
                                <th style="text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        if (payments.length === 0) {
            html += `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem 0; color: var(--gray);">
                        <i class="fas fa-credit-card" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.3;"></i>
                        No payments recorded yet.
                    </td>
                </tr>
            `;
        } else {
            payments.forEach(p => {
                html += `
                    <tr>
                        <td><strong>#${p.payment_id}</strong></td>
                        <td><strong>${p.fullname}</strong></td>
                        <td><strong style="color: var(--success);">₱${p.amount_paid.toFixed(2)}</strong></td>
                        <td>${p.payment_method || '-'}</td>
                        <td><code style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${p.receipt_number || '-'}</code></td>
                        <td>${new Date(p.payment_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td style="text-align: center; white-space: nowrap;">
                            <button class="action-btn" onclick="editPayment(${p.payment_id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deletePayment(${p.payment_id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `</tbody></table></div></div>`;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error loading payments</div>`;
    }
}

function showAddPayment() {
    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    document.getElementById('formModalLabel').textContent = 'Record Payment';
    
    fetch(API_URL + '/bills')
        .then(res => res.json())
        .then(bills => {
            const unpaid = bills.filter(b => b.status === 'Unpaid');
            document.getElementById('formModalBody').innerHTML = `
                <form id="paymentForm" class="modal-form">
                    <div class="mb-2">
                        <label>Bill *</label>
                        <select class="form-select" id="p_bill" required>
                            <option value="">Select Unpaid Bill</option>
                            ${unpaid.map(b => `<option value="${b.bill_id}">#${b.bill_id} - ${b.fullname} - ₱${b.amount}</option>`).join('')}
                        </select>
                    </div>
                    <div class="row g-2">
                        <div class="col-md-6 mb-2">
                            <label>Amount Paid *</label>
                            <input type="number" step="0.01" class="form-control" id="p_amount" required>
                        </div>
                        <div class="col-md-6 mb-2">
                            <label>Payment Date *</label>
                            <input type="date" class="form-control" id="p_date" required>
                        </div>
                    </div>
                    <div class="row g-2">
                        <div class="col-md-6 mb-2">
                            <label>Payment Method</label>
                            <select class="form-select" id="p_method">
                                <option value="Cash">Cash</option>
                                <option value="GCash">GCash</option>
                                <option value="Maya">Maya</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-2">
                            <label>Receipt Number</label>
                            <input class="form-control" id="p_receipt" placeholder="RC-001">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary-custom w-100 mt-2">Record Payment</button>
                </form>
            `;
            
            document.getElementById('paymentForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                const data = {
                    bill_id: document.getElementById('p_bill').value,
                    amount_paid: parseFloat(document.getElementById('p_amount').value),
                    payment_date: document.getElementById('p_date').value,
                    payment_method: document.getElementById('p_method').value,
                    receipt_number: document.getElementById('p_receipt').value
                };
                
                try {
                    const response = await fetch(API_URL + '/payments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    if (response.ok) {
                        modal.hide();
                        loadSection('payments');
                    } else {
                        alert('Error recording payment');
                    }
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });
        });
    
    modal.show();
}

async function editPayment(id) {
    try {
        const response = await fetch(API_URL + '/payments');
        const payments = await response.json();
        const payment = payments.find(p => p.payment_id === id);
        if (!payment) return alert('Payment not found');
        
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        document.getElementById('formModalLabel').textContent = 'Edit Payment';
        document.getElementById('formModalBody').innerHTML = `
            <form id="paymentForm" class="modal-form">
                <div class="row g-2">
                    <div class="col-md-6 mb-2">
                        <label>Amount Paid *</label>
                        <input type="number" step="0.01" class="form-control" id="p_amount" value="${payment.amount_paid}" required>
                    </div>
                    <div class="col-md-6 mb-2">
                        <label>Payment Date *</label>
                        <input type="date" class="form-control" id="p_date" value="${payment.payment_date}" required>
                    </div>
                </div>
                <div class="row g-2">
                    <div class="col-md-6 mb-2">
                        <label>Payment Method</label>
                        <select class="form-select" id="p_method">
                            <option value="Cash" ${payment.payment_method === 'Cash' ? 'selected' : ''}>Cash</option>
                            <option value="GCash" ${payment.payment_method === 'GCash' ? 'selected' : ''}>GCash</option>
                            <option value="Maya" ${payment.payment_method === 'Maya' ? 'selected' : ''}>Maya</option>
                            <option value="Bank Transfer" ${payment.payment_method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-2">
                        <label>Receipt Number</label>
                        <input class="form-control" id="p_receipt" value="${payment.receipt_number || ''}">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary-custom w-100 mt-2">Update Payment</button>
            </form>
        `;
        
        document.getElementById('paymentForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const data = {
                amount_paid: parseFloat(document.getElementById('p_amount').value),
                payment_date: document.getElementById('p_date').value,
                payment_method: document.getElementById('p_method').value,
                receipt_number: document.getElementById('p_receipt').value
            };
            
            try {
                const response = await fetch(API_URL + '/payments/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    modal.hide();
                    loadSection('payments');
                } else {
                    alert('Error updating payment');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
        
        modal.show();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deletePayment(id) {
    if (!confirm('Delete this payment?')) return;
    try {
        const response = await fetch(API_URL + '/payments/' + id, { method: 'DELETE' });
        if (response.ok) {
            loadSection('payments');
        } else {
            alert('Error deleting payment');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============ REPORTS ============
async function loadReports(container) {
    try {
        const response = await fetch(API_URL + '/reports/summary');
        const data = await response.json();
        
        container.innerHTML = `
            <div class="row g-3">
                <div class="col-md-3">
                    <div class="stat-card purple">
                        <div class="stat-header">
                            <span class="stat-label">Total Customers</span>
                            <i class="fas fa-users stat-icon"></i>
                        </div>
                        <div class="stat-number">${data.totalCustomers}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card green">
                        <div class="stat-header">
                            <span class="stat-label">Paid Bills</span>
                            <i class="fas fa-check-circle stat-icon"></i>
                        </div>
                        <div class="stat-number">${data.paidBills}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card yellow">
                        <div class="stat-header">
                            <span class="stat-label">Unpaid Bills</span>
                            <i class="fas fa-exclamation-triangle stat-icon"></i>
                        </div>
                        <div class="stat-number">${data.unpaidBills}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card blue">
                        <div class="stat-header">
                            <span class="stat-label">Revenue</span>
                            <i class="fas fa-money-bill-wave stat-icon"></i>
                        </div>
                        <div class="stat-number">₱${data.totalRevenue.toFixed(2)}</div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="chart-container">
                        <h6 style="font-weight: 600; margin-bottom: 1rem;">Revenue Summary</h6>
                        <canvas id="reportChart"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            const ctx = document.getElementById('reportChart');
            if (ctx) {
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Paid Bills', 'Unpaid Bills'],
                        datasets: [{
                            data: [data.paidBills, data.unpaidBills],
                            backgroundColor: ['#22c55e', '#eab308'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }
        }, 100);
        
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error loading reports</div>`;
    }
}

// ============ INIT ============
loadSection('dashboard');