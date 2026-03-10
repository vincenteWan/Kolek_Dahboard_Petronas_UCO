// ==================== REWARD PAGE FUNCTIONS ====================

let rewardsData = [];
let redemptionsData = [];
let rewardsLoaded = false;
let redemptionsLoaded = false;

function pickFieldByPattern(row, patterns) {
    if (!row) return null;
    const keys = Object.keys(row);
    for (const pattern of patterns) {
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
        const match = keys.find(k => regex.test(k));
        if (match) return match;
    }
    return null;
}

async function fetchRewardsFromDatabase() {
    try {
        const resp = await fetch('/api/reward');
        if (!resp.ok) throw new Error('Failed to fetch rewards');
        const data = await resp.json();
        rewardsData = Array.isArray(data) ? data.map(r => ({
            id: r.rewardID || r.rewardId || r.id || '',
            name: r.rewardName || r.name || '',
            category: r.rewardCategory || r.category || '',
            merchant: r.merchant || r.merchantName || '',
            value: Number(r.rewardValue ?? r.value ?? 0),
            pointsRequired: Number(r.pointsRequired ?? r.points ?? 0),
            expiryDate: r.expiryDate || r.expiry || '',
            adminId: r.adminID || r.adminId || r.admin_id || ''
        })) : [];
        rewardsLoaded = true;
    } catch (err) {
        console.error('Error loading rewards:', err);
        rewardsData = [];
        rewardsLoaded = true;
    }
}

async function createRewardInDatabase(reward) {
    const adminId = localStorage.getItem('kolek_admin');
    const rewardWithAdmin = { ...reward, adminId };
    const resp = await fetch('/api/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewardWithAdmin)
    });
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create reward');
    }
    return resp.json();
}

async function updateRewardInDatabase(rewardId, reward) {
    const adminId = localStorage.getItem('kolek_admin');
    const rewardWithAdmin = { ...reward, adminId };
    const resp = await fetch(`/api/reward/${encodeURIComponent(rewardId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewardWithAdmin)
    });
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update reward');
    }
    return resp.json();
}

async function deleteRewardInDatabase(rewardId) {
    const adminId = localStorage.getItem('kolek_admin');
    const resp = await fetch(`/api/reward/${encodeURIComponent(rewardId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
    });
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to delete reward');
    }
    return resp.json();
}

async function fetchRedemptionsFromDatabase() {
    try {
        const resp = await fetch('/api/rewardredemption');
        if (!resp.ok) throw new Error('Failed to fetch redemptions');
        const data = await resp.json();
        redemptionsData = Array.isArray(data) ? data.map(r => ({
            id: r[pickFieldByPattern(r, [/^redeem.*id$/i, /^redemption.*id$/i, /^rewardredemption.*id$/i, /^id$/i])] || '',
            dateTime: r[pickFieldByPattern(r, [/redemption.*date/i, /redemption.*time/i, /date_time/i, /datetime/i, /^date$/i, /^created.*at$/i])] || '',
            pointsDeducted: Number(r[pickFieldByPattern(r, [/points.*deduct/i, /points.*used/i, /points/i])] ?? 0),
            promoCode: r[pickFieldByPattern(r, [/promo.*code/i, /promo/i, /code/i])] || '',
            status: r[pickFieldByPattern(r, [/status/i])] || '',
            rewardId: r[pickFieldByPattern(r, [/reward(?!redemption).*id/i, /^rewardid$/i])] || '',
            householdId: r[pickFieldByPattern(r, [/household.*id/i, /^householdid$/i])] || ''
        })) : [];
        redemptionsLoaded = true;
    } catch (err) {
        console.error('Error loading redemptions:', err);
        redemptionsData = [];
        redemptionsLoaded = true;
    }
}

// Initialize reward page with page setup
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const auth = localStorage.getItem('kolek_auth');
    if (!auth) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize reward functionality
    initializeRewardPage();
    initializeRedemptionPage();
    
    // Setup header controls
    setupHeaderControls();
    
    // Update date
    updateDate();
    setInterval(updateDate, 60000);
    
    // Setup logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('kolek_auth');
            localStorage.removeItem('kolek_admin');
            window.location.href = 'index.html';
        });
    }

    // Setup profile click
    const headerAvatar = document.getElementById('header-user-avatar');
    if (headerAvatar) {
        headerAvatar.addEventListener('click', function(e) {
            e.preventDefault();
            const hasProfile = document.getElementById('profile-content');
            if (hasProfile && typeof openProfilePage === 'function') {
                openProfilePage();
                return;
            }
            window.location.href = 'dashboard.html';
        });
    }
});

// Setup header controls
function setupHeaderControls() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            initializeRewardPage();
            initializeRedemptionPage();
        });
    }

    // Export PDF button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            alert('Export PDF functionality - coming soon');
        });
    }
}

// Update current date
function updateDate() {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const today = new Date().toLocaleDateString('en-US', options);
    const dateDisplay = document.getElementById('current-date');
    if (dateDisplay) {
        dateDisplay.textContent = `Today, ${today}`;
    }
}

// Initialize reward page
function initializeRewardPage() {
    rewardsLoaded = false;
    loadRewardsTable();
    setupRewardEventListeners();
}

// Load rewards table
function loadRewardsTable(page = 1, itemsPerPage = 10, filter = {}) {
    if (!rewardsLoaded) {
        fetchRewardsFromDatabase().then(() => loadRewardsTable(page, itemsPerPage, filter));
        return;
    }
    let filteredData = rewardsData;
    
    // Apply filters
    if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredData = filteredData.filter(r => 
            r.name.toLowerCase().includes(searchLower) || 
            r.id.toLowerCase().includes(searchLower)
        );
    }
    
    if (filter.category && filter.category !== '') {
        filteredData = filteredData.filter(r => r.category === filter.category);
    }
    
    // Paginate
    const startIdx = (page - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageData = filteredData.slice(startIdx, endIdx);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    // Populate table
    const tbody = document.getElementById('reward-tbody');
    if (tbody) {
        tbody.innerHTML = pageData.map(reward => `
            <tr>
                <td class="reward-id">${reward.id}</td>
                <td>${reward.name}</td>
                <td><span class="category-badge">${reward.category}</span></td>
                <td>${reward.merchant}</td>
                <td>RM ${reward.value.toFixed(2)}</td>
                <td><strong>${reward.pointsRequired}</strong></td>
                <td>${reward.expiryDate}</td>
                <td>${reward.adminId}</td>
                <td class="actions-col">
                    <span class="action-group">
                        <a href="#" class="view-action" onclick="viewRewardDetails('${reward.id}'); return false;" title="View details"><i class="fas fa-eye"></i></a>
                        <a href="#" class="edit-action" onclick="editReward('${reward.id}'); return false;" title="Edit reward"><i class="fas fa-edit"></i></a>
                        <a href="#" class="delete-action" onclick="deleteReward('${reward.id}'); return false;" title="Delete reward"><i class="fas fa-trash-alt"></i></a>
                    </span>
                </td>
            </tr>
        `).join('');
    }
    
    // Update entries info
    const entriesInfo = document.getElementById('reward-entries-info');
    if (entriesInfo) {
        entriesInfo.textContent = `Showing ${startIdx + 1} to ${Math.min(endIdx, filteredData.length)} of ${filteredData.length} entries`;
    }
    
    // Update pagination
    updateRewardPagination('reward-pagination', totalPages, page, (p) => loadRewardsTable(p, itemsPerPage, filter));
}

// Update pagination buttons
function updateRewardPagination(elementId, totalPages, currentPage, callback) {
    const pagination = document.getElementById(elementId);
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => callback(i));
        pagination.appendChild(btn);
    }
}

// Setup reward page event listeners
function setupRewardEventListeners() {
    const rewardSearch = document.getElementById('reward-search');
    const categoryFilter = document.getElementById('reward-category-filter');
    const addNewBtn = document.getElementById('reward-add-new');
    const exportBtn = document.getElementById('reward-export');
    
    if (rewardSearch) {
        rewardSearch.addEventListener('input', () => loadRewardsTable(1, 10, { search: rewardSearch.value, category: categoryFilter?.value || '' }));
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => loadRewardsTable(1, 10, { search: rewardSearch?.value || '', category: categoryFilter.value }));
    }
    
    if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
            openAddRewardModal();
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportRewardsToPDF();
        });
    }
}

// Current reward being viewed/edited
let currentRewardId = null;

// View reward details
function viewRewardDetails(rewardId) {
    const reward = rewardsData.find(r => r.id === rewardId);
    if (reward) {
        currentRewardId = rewardId;
        document.getElementById('view-reward-id').textContent = reward.id;
        document.getElementById('view-reward-name').textContent = reward.name;
        document.getElementById('view-reward-category').textContent = reward.category;
        document.getElementById('view-reward-merchant').textContent = reward.merchant;
        document.getElementById('view-reward-value').textContent = `RM ${reward.value.toFixed(2)}`;
        document.getElementById('view-reward-points').textContent = reward.pointsRequired;
        document.getElementById('view-reward-expiry').textContent = reward.expiryDate;
        document.getElementById('view-reward-admin').textContent = reward.adminId;
        
        const modal = document.getElementById('view-reward-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
}

// Close view modal
function closeViewModal() {
    const modal = document.getElementById('view-reward-modal');
    if (modal) {
        modal.classList.remove('show');
    }
    currentRewardId = null;
}

// Open edit modal from view modal
function openEditModalFromView() {
    closeViewModal();
    if (currentRewardId) {
        editReward(currentRewardId);
    }
}

// Edit reward
function editReward(rewardId) {
    const reward = rewardsData.find(r => r.id === rewardId);
    if (reward) {
        currentRewardId = rewardId;
        document.getElementById('edit-reward-id').value = reward.id;
        document.getElementById('edit-reward-name').value = reward.name;
        document.getElementById('edit-reward-category').value = reward.category;
        document.getElementById('edit-reward-merchant').value = reward.merchant;
        document.getElementById('edit-reward-value').value = reward.value;
        document.getElementById('edit-reward-points').value = reward.pointsRequired;
        document.getElementById('edit-reward-expiry').value = reward.expiryDate;
        document.getElementById('edit-reward-admin').value = reward.adminId;
        
        const modal = document.getElementById('edit-reward-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('edit-reward-modal');
    if (modal) {
        modal.classList.remove('show');
    }
    currentRewardId = null;
}

// Save reward changes
async function saveRewardChanges() {
    if (!currentRewardId) return;
    
    const form = document.getElementById('edit-reward-form');
    if (!form.checkValidity()) {
        alert('Please fill in all required fields correctly.');
        return;
    }
    
    const updatedReward = {
        id: document.getElementById('edit-reward-id').value,
        name: document.getElementById('edit-reward-name').value,
        category: document.getElementById('edit-reward-category').value,
        merchant: document.getElementById('edit-reward-merchant').value,
        value: parseFloat(document.getElementById('edit-reward-value').value),
        pointsRequired: parseInt(document.getElementById('edit-reward-points').value),
        expiryDate: document.getElementById('edit-reward-expiry').value,
        adminId: document.getElementById('edit-reward-admin').value
    };

    try {
        await updateRewardInDatabase(currentRewardId, updatedReward);
        closeEditModal();
        rewardsLoaded = false;
        loadRewardsTable();
        const successMsg = document.createElement('div');
        successMsg.className = 'success-toast';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Reward updated successfully!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
    } catch (err) {
        console.error('Update reward error:', err);
        alert(err.message || 'Failed to update reward');
    }
}

// Delete reward
async function deleteReward(rewardId) {
    if (confirm(`Are you sure you want to delete reward ${rewardId}?`)) {
        try {
            await deleteRewardInDatabase(rewardId);
            rewardsLoaded = false;
            loadRewardsTable();
            const successMsg = document.createElement('div');
            successMsg.className = 'success-toast';
            successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Reward deleted successfully!';
            document.body.appendChild(successMsg);
            setTimeout(() => successMsg.remove(), 3000);
        } catch (err) {
            console.error('Delete reward error:', err);
            alert(err.message || 'Failed to delete reward');
        }
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const viewModal = document.getElementById('view-reward-modal');
    const editModal = document.getElementById('edit-reward-modal');
    const redemptionModal = document.getElementById('view-redemption-modal');
    
    if (viewModal && event.target === viewModal) {
        closeViewModal();
    }
    if (editModal && event.target === editModal) {
        closeEditModal();
    }
    if (redemptionModal && event.target === redemptionModal) {
        closeRedemptionModal();
    }
});

// ==================== REDEMPTION TRACKING FUNCTIONS ====================

// Switch between tabs
function switchTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Mark button as active
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Load data for the selected tab
    if (tabName === 'rewards-tab') {
        loadRewardsTable();
    } else if (tabName === 'redemption-tab') {
        loadRedemptionsTable();
    }
}

// Initialize redemption page
function initializeRedemptionPage() {
    redemptionsLoaded = false;
    loadRedemptionsTable();
    setupRedemptionEventListeners();
}

// Load redemptions table
function loadRedemptionsTable(page = 1, itemsPerPage = 10, filter = {}) {
    if (!redemptionsLoaded) {
        fetchRedemptionsFromDatabase().then(() => loadRedemptionsTable(page, itemsPerPage, filter));
        return;
    }
    let filteredData = redemptionsData;
    
    // Apply filters
    if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredData = filteredData.filter(r => 
            String(r.id || '').toLowerCase().includes(searchLower) || 
            String(r.promoCode || '').toLowerCase().includes(searchLower) ||
            String(r.householdId || '').toLowerCase().includes(searchLower)
        );
    }
    
    if (filter.status && filter.status !== '') {
        const targetStatus = String(filter.status).toLowerCase();
        filteredData = filteredData.filter(r => String(r.status || '').toLowerCase() === targetStatus);
    }
    
    // Paginate
    const startIdx = (page - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageData = filteredData.slice(startIdx, endIdx);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    // Populate table
    const tbody = document.getElementById('redemption-tbody');
    if (tbody) {
        tbody.innerHTML = pageData.map(redemption => {
            const statusText = redemption.status || 'Unknown';
            let statusClass = 'status-' + String(statusText).toLowerCase();
            const dateValue = redemption.dateTime ? new Date(redemption.dateTime) : null;
            const dateDisplay = dateValue && !isNaN(dateValue.getTime()) ? dateValue.toLocaleString() : '-';
            return `
            <tr>
                <td class="redemption-id">${redemption.id}</td>
                <td>${dateDisplay}</td>
                <td>${redemption.rewardId}</td>
                <td>${redemption.householdId}</td>
                <td><code class="promo-code">${redemption.promoCode}</code></td>
                <td>${redemption.pointsDeducted}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="actions-col">
                    <span class="action-group">
                        <a href="#" class="view-action" onclick="viewRedemptionDetails('${redemption.id}'); return false;" title="View details"><i class="fas fa-eye"></i></a>
                    </span>
                </td>
            </tr>
        `}).join('');
    }
    
    // Update entries info
    const entriesInfo = document.getElementById('redemption-entries-info');
    if (entriesInfo) {
        entriesInfo.textContent = `Showing ${startIdx + 1} to ${Math.min(endIdx, filteredData.length)} of ${filteredData.length} entries`;
    }
    
    // Update pagination
    updateRedemptionPagination('redemption-pagination', totalPages, page, (p) => loadRedemptionsTable(p, itemsPerPage, filter));
}

// Update redemption pagination
function updateRedemptionPagination(elementId, totalPages, currentPage, callback) {
    const pagination = document.getElementById(elementId);
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => callback(i));
        pagination.appendChild(btn);
    }
}

// Setup redemption event listeners
function setupRedemptionEventListeners() {
    const redemptionSearch = document.getElementById('redemption-search');
    const statusFilter = document.getElementById('redemption-status-filter');
    const exportBtn = document.getElementById('redemption-export');
    
    if (redemptionSearch) {
        redemptionSearch.addEventListener('input', () => loadRedemptionsTable(1, 10, { search: redemptionSearch.value, status: statusFilter?.value || '' }));
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => loadRedemptionsTable(1, 10, { search: redemptionSearch?.value || '', status: statusFilter.value }));
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportRedemptionsToCSV();
        });
    }
}

// View redemption details
function viewRedemptionDetails(redemptionId) {
    const redemption = redemptionsData.find(r => r.id === redemptionId);
    if (redemption) {
        const statusText = redemption.status || 'Unknown';
        const dateValue = redemption.dateTime ? new Date(redemption.dateTime) : null;
        const dateDisplay = dateValue && !isNaN(dateValue.getTime()) ? dateValue.toLocaleString() : '-';
        document.getElementById('view-redemption-id').textContent = redemption.id;
        document.getElementById('view-redemption-status').innerHTML = `<span class="status-badge status-${String(statusText).toLowerCase()}">${statusText}</span>`;
        document.getElementById('view-redemption-datetime').textContent = dateDisplay;
        document.getElementById('view-redemption-reward-id').textContent = redemption.rewardId;
        document.getElementById('view-redemption-household-id').textContent = redemption.householdId;
        document.getElementById('view-redemption-points').textContent = redemption.pointsDeducted + ' points';
        document.getElementById('view-redemption-promo').innerHTML = `<code class="promo-code">${redemption.promoCode || '-'}</code>`;
        
        const modal = document.getElementById('view-redemption-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
}

// Export redemptions to CSV
function exportRedemptionsToCSV() {
    try {
        // Collect visible rows from redemption table
        const rows = Array.from(document.querySelectorAll('.redemption-table tbody tr'))
            .filter(r => r.style.display !== 'none');

        // Header
        const header = ['Redemption ID','Date & Time','Reward ID','Household ID','Promo Code','Points Deducted','Status'];

        const dataRows = rows.map(r => {
            const cells = Array.from(r.querySelectorAll('td'));
            // Take data cells (first 7 columns), ignore actions cell
            return cells.slice(0, 7).map(c => c.textContent.trim());
        });

        // Use the main export function with selected format
        exportTableData('redemptions_export', header, dataRows);
    } catch (err) {
        console.error('Export redemptions error:', err);
        alert('Export failed — see console');
    }
}

// Close redemption modal
function closeRedemptionModal() {
    const modal = document.getElementById('view-redemption-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ==================== ADD NEW REWARD FUNCTION ====================

// Open add reward modal
function openAddRewardModal() {
    const modal = document.getElementById('add-reward-modal');
    if (modal) {
        document.getElementById('add-reward-form').reset();
        modal.classList.add('show');
    }
}

// Close add reward modal
function closeAddRewardModal() {
    const modal = document.getElementById('add-reward-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Save new reward
async function saveNewReward() {
    const form = document.getElementById('add-reward-form');
    if (!form.checkValidity()) {
        alert('Please fill in all required fields correctly.');
        return;
    }
    
    const newReward = {
        id: document.getElementById('new-reward-id').value.trim(),
        name: document.getElementById('new-reward-name').value.trim(),
        category: document.getElementById('new-reward-category').value,
        merchant: document.getElementById('new-reward-merchant').value.trim(),
        value: parseFloat(document.getElementById('new-reward-value').value),
        pointsRequired: parseInt(document.getElementById('new-reward-points').value),
        expiryDate: document.getElementById('new-reward-expiry').value,
        adminId: document.getElementById('new-reward-admin').value.trim()
    };
    
    try {
        await createRewardInDatabase(newReward);
        closeAddRewardModal();
        rewardsLoaded = false;
        loadRewardsTable();
        const successMsg = document.createElement('div');
        successMsg.className = 'success-toast';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> New reward added successfully!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
    } catch (err) {
        console.error('Create reward error:', err);
        alert(err.message || 'Failed to add reward');
    }
}

// Export rewards to selected format (CSV, XLSX, or PDF)
function exportRewardsToPDF() {
    try {
        // Collect visible rows from reward table
        const rows = Array.from(document.querySelectorAll('.reward-table tbody tr'))
            .filter(r => r.style.display !== 'none');

        // Header
        const header = ['Reward ID','Name','Category','Merchant','Value (RM)','Points Required','Expiry Date','Admin ID'];

        const dataRows = rows.map(r => {
            const cells = Array.from(r.querySelectorAll('td'));
            // Take only data cells (first 8 columns), ignore actions cell
            return cells.slice(0, 8).map(c => c.textContent.trim());
        });

        // Use the main export function with selected format
        exportTableData('rewards_export', header, dataRows);
    } catch (err) {
        console.error('Export rewards error:', err);
        alert('Export failed — see console');
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const viewModal = document.getElementById('view-reward-modal');
    const editModal = document.getElementById('edit-reward-modal');
    const redemptionModal = document.getElementById('view-redemption-modal');
    const addRewardModal = document.getElementById('add-reward-modal');
    
    if (viewModal && event.target === viewModal) {
        closeViewModal();
    }
    if (editModal && event.target === editModal) {
        closeEditModal();
    }
    if (redemptionModal && event.target === redemptionModal) {
        closeRedemptionModal();
    }
    if (addRewardModal && event.target === addRewardModal) {
        closeAddRewardModal();
    }
});
