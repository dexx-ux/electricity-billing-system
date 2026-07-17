// ============ CUSTOMER PORTAL SCRIPT ============

// Get customer ID from URL
const urlParams = new URLSearchParams(window.location.search);
const customerId = urlParams.get('id');

const API_URL = window.location.origin + '/api';

if (!customerId) {
    document.getElementById('customerDetails').innerHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            No customer ID provided. Please use: ?id=1
        </div>
    `;
    document.getElementById('billsList').innerHTML = '';
    document.getElementById('paymentsList').innerHTML = '';
} else {
    loadCustomerData(customerId);
}

async function loadCustomerData(id) {
    try {
        const response = await fetch(API_URL + '/customer/' + id);
        if (!response.ok) throw new Error('Customer not found');
        const data = await response.json();

        // Display customer info
        const customer = data.customer;
        document.getElementById('customerDetails').innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <strong>Name:</strong> ${customer.fullname}
                </div>
                <div class="col-md-6">
                    <strong>Meter Number:</strong> <code>${customer.meter_number}</code>
                </div>
                <div class="col-md-6 mt-2">
                    <strong>Address:</strong> ${customer.address || 'N/A'}
                </div>
                <div class="col-md-6 mt-2">
                    <strong>Contact:</strong> ${customer.contact_number || 'N/A'}
                </div>
                <div class="col-md-12 mt-2">
                    <strong>Status:</strong> 
                    <span class="badge-status ${customer.status?.toLowerCase()}">${customer.status || 'Active'}</span>
                </div>
            </div>
        `;

        // Display bills
        const bills = data.bills;
        if (bills.length === 0) {
            document.getElementById('billsList').innerHTML = `
                <p class="text-muted text-center">No bills found.</p>
            `;
        } else {
            let billsHtml = `
                <div class="table-responsive">
                    <table class="table table-ebms">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Period</th>
                                <th>Amount</th>
                                <th>Due Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            bills.forEach(b => {
                billsHtml += `
                    <tr>
                        <td><strong>#${b.bill_id}</strong></td>
                        <td>${b.billing_period}</td>
                        <td><strong style="color: var(--primary);">₱${b.amount.toFixed(2)}</strong></td>
                        <td>${new Date(b.due_date).toLocaleDateString()}</td>
                        <td><span class="badge-status ${b.status?.toLowerCase()}">${b.status || 'Unpaid'}</span></td>
                    </tr>
                `;
            });
            billsHtml += `</tbody></table></div>`;
            document.getElementById('billsList').innerHTML = billsHtml;
        }

        // Display payments
        const payments = data.payments;
        if (payments.length === 0) {
            document.getElementById('paymentsList').innerHTML = `
                <p class="text-muted text-center">No payments recorded.</p>
            `;
        } else {
            let paymentsHtml = `
                <div class="table-responsive">
                    <table class="table table-ebms">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Receipt</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            payments.forEach(p => {
                paymentsHtml += `
                    <tr>
                        <td><strong>#${p.payment_id}</strong></td>
                        <td><strong style="color: var(--success);">₱${p.amount_paid.toFixed(2)}</strong></td>
                        <td>${p.payment_method || '-'}</td>
                        <td><code>${p.receipt_number || '-'}</code></td>
                        <td>${new Date(p.payment_date).toLocaleDateString()}</td>
                    </tr>
                `;
            });
            paymentsHtml += `</tbody></table></div>`;
            document.getElementById('paymentsList').innerHTML = paymentsHtml;
        }

    } catch (error) {
        document.getElementById('customerDetails').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error loading customer data: ${error.message}
            </div>
        `;
    }
}