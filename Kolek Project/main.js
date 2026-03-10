// ==================== LOGIN PAGE FUNCTIONS ====================
// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.password-toggle');
    
    if (passwordInput && toggleIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = '👁️';
        }
    }
}

// Forgot Password Modal Functions
function openForgotPasswordModal(event) {
    event.preventDefault();
    const modal = document.getElementById('forgotPasswordModal');
    modal.classList.add('show');
    document.getElementById('forgotPasswordForm').style.display = 'block';
    document.getElementById('resetPasswordMessage').style.display = 'none';
    verifiedSecurityAnswers = null;
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    modal.classList.remove('show');
    document.getElementById('forgotPasswordForm').reset();
    document.getElementById('resetPasswordMessage').style.display = 'none';
    showStep(1); // Reset to step 1
    currentPasswordStep = 1;
    verifiedSecurityAnswers = null;
}

function toggleResetPassword() {
    const passwordInput = document.getElementById('newPassword');
    const toggleIcon = event.target;
    
    if (passwordInput) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = '👁️';
        }
    }
}

function toggleConfirmPassword() {
    const passwordInput = document.getElementById('confirmPassword');
    const toggleIcon = event.target;
    
    if (passwordInput) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = '👁️';
        }
    }
}

// Multi-step forgot password flow
let currentPasswordStep = 1;
let loadedSecurityQuestions = {};
let verifiedSecurityAnswers = null;

function updateForgotPasswordRequiredFields(step) {
    const adminIdInput = document.getElementById('resetAdminId');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const securityAnswerInputs = document.querySelectorAll('#securityQuestionsContainer input[id^="securityAnswer"]');

    if (adminIdInput) adminIdInput.required = step === 1;
    securityAnswerInputs.forEach(input => {
        input.required = step === 2;
    });
    if (newPasswordInput) newPasswordInput.required = step === 3;
    if (confirmPasswordInput) confirmPasswordInput.required = step === 3;
}

function showStep(step) {
    currentPasswordStep = step;
    document.getElementById('adminIdStep').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('securityQuestionsStep').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('newPasswordStep').style.display = step === 3 ? 'block' : 'none';
    updateForgotPasswordRequiredFields(step);
    
    const prevBtn = document.getElementById('prevStepBtn');
    const submitBtn = document.querySelector('#forgotPasswordForm button[type="submit"]');
    
    if (step > 1) {
        prevBtn.style.display = 'block';
    } else {
        prevBtn.style.display = 'none';
    }
    
    // Update submit button text based on step and restore enabled state
    if (submitBtn) {
        submitBtn.disabled = false;  // Re-enable button when transitioning steps
        if (step === 1) {
            submitBtn.textContent = 'Verify & Continue';
        } else if (step === 2) {
            submitBtn.textContent = 'Verify Answers';
        } else if (step === 3) {
            submitBtn.textContent = 'Reset Password';
        }
    }
}

function previousStep() {
    if (currentPasswordStep > 1) {
        showStep(currentPasswordStep - 1);
    }
}

async function verifyAdminIdAndLoadQuestions() {
    const adminId = document.getElementById('resetAdminId').value.trim();
    const messageDiv = document.getElementById('resetPasswordMessage');
    const submitBtn = document.querySelector('#forgotPasswordForm button[type="submit"]');
    
    if (!adminId) {
        showResetMessage('Please enter your Admin ID', 'error', messageDiv);
        return;
    }
    
    // Show loading state
    showResetMessage('⏳ Loading security questions...', 'info', messageDiv);
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Loading...';
    }
    
    try {
        const response = await fetch('/api/admin/get-security-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminId })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            loadedSecurityQuestions = data.questions || {};
            loadSecurityQuestions(data.questions || {});
            if (messageDiv) {
                messageDiv.style.display = 'none';
            }
            showStep(2);
        } else {
            showResetMessage(data.message || 'Admin ID not found or has no security questions set', 'error', messageDiv);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verify & Continue';
            }
        }
    } catch (error) {
        console.error('Error loading security questions:', error);
        showResetMessage('Error loading security questions: ' + error.message, 'error', messageDiv);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify & Continue';
        }
    }
}

function loadSecurityQuestions(questions) {
    const container = document.getElementById('securityQuestionsContainer');
    
    if (!container) {
        console.error('Security questions container not found');
        return;
    }
    
    container.innerHTML = '';
    
    if (!questions || Object.keys(questions).length === 0) {
        container.innerHTML = '<p style="color: #d9534f;">No security questions set. Please contact your administrator.</p>';
        console.warn('No security questions provided');
        return;
    }
    
    const questionKeys = Object.keys(questions).sort();
    console.log('Loading', questionKeys.length, 'security questions');
    
    questionKeys.forEach((qKey, index) => {
        try {
            const question = questions[qKey];
            const answerId = `securityAnswer${index + 1}`;
            const questionText = (question && question.question) ? question.question : ('Security Question ' + (index + 1));
            
            const div = document.createElement('div');
            div.className = 'form-group';
            div.style.marginBottom = '15px';
            
            div.innerHTML = `
                <label for="${answerId}" style="display: block; margin-bottom: 5px; font-weight: 500;">
                    ${questionText}
                </label>
                <input 
                    type="text" 
                    id="${answerId}" 
                    name="${answerId}"
                    placeholder="Enter your answer"
                    style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
                    data-question-index="${index + 1}"
                    required
                >
                <small style="color: #999; font-size: 11px; display: block; margin-top: 4px;">Answer must match your saved answer exactly</small>
            `;
            
            container.appendChild(div);
            console.log(`Created input ${answerId} for key ${qKey}`);
        } catch (error) {
            console.error(`Error creating question input:`, error);
        }
    });
    
    console.log('Security questions loaded successfully');
}

function handleForgotPasswordSubmit() {
    const form = document.getElementById('forgotPasswordForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (currentPasswordStep === 1) {
                // Verify admin ID and load questions
                verifyAdminIdAndLoadQuestions();
            } else if (currentPasswordStep === 2) {
                // Validate security questions and move to step 3
                validateSecurityAnswersAndMove();
            } else if (currentPasswordStep === 3) {
                // Reset password
                resetPasswordWithAnswers();
            }
        });
    }
}

async function validateSecurityAnswersAndMove() {
    const adminId = document.getElementById('resetAdminId').value.trim();
    const messageDiv = document.getElementById('resetPasswordMessage');
    const submitBtn = document.querySelector('#forgotPasswordForm button[type="submit"]');
    
    // Validate admin ID
    if (!adminId) {
        showResetMessage('Admin ID is missing. Please go back and enter your Admin ID.', 'error', messageDiv);
        return;
    }
    
    // Validate that we have loaded questions
    if (!loadedSecurityQuestions || Object.keys(loadedSecurityQuestions).length === 0) {
        showResetMessage('Security questions not loaded. Please go back and verify your Admin ID.', 'error', messageDiv);
        return;
    }
    
    // Collect answers
    const answers = {};
    const questionCount = Object.keys(loadedSecurityQuestions).length;
    
    for (let i = 0; i < questionCount; i++) {
        const answerInput = document.getElementById(`securityAnswer${i + 1}`);
        if (!answerInput) {
            showResetMessage(`Answer input field ${i + 1} not found. Please refresh and try again.`, 'error', messageDiv);
            console.error(`Missing input element securityAnswer${i + 1}`);
            return;
        }
        const answerValue = answerInput.value.trim();
        if (!answerValue) {
            showResetMessage('Please answer all security questions', 'error', messageDiv);
            return;
        }
        answers[`q${i + 1}`] = answerValue;
    }
    
    // Show loading state
    if (messageDiv) {
        messageDiv.style.display = 'block';
    }
    showResetMessage('⏳ Verifying your answers...', 'info', messageDiv);
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
    }
    
    try {
        console.log('Validating answers for admin:', adminId, 'with answers:', Object.keys(answers));
        
        const response = await fetch('/api/admin/validate-security-answers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminId, answers })
        });
        
        const data = await response.json();
        console.log('Validation response:', { status: response.status, success: data.success, message: data.message });
        
        if (response.ok && data.success) {
            // Answers verified successfully
            verifiedSecurityAnswers = answers;
            console.log('Security answers verified successfully');
            
            if (messageDiv) {
                messageDiv.style.display = 'none';
                messageDiv.innerHTML = '';
            }
            
            // Move to reset password step immediately
            showStep(3);
            
            // Focus on new password field
            const newPasswordInput = document.getElementById('newPassword');
            if (newPasswordInput) {
                setTimeout(() => newPasswordInput.focus(), 100);
            }
        } else {
            // Answer validation failed
            const errorMsg = data.message || 'Incorrect answers. Please try again.';
            console.warn('Answer validation failed:', errorMsg);
            showResetMessage(errorMsg, 'error', messageDiv);
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verify Answers';
            }
        }
    } catch (error) {
        console.error('Error validating answers:', error, error.stack);
        showResetMessage('Error validating answers. Please try again. Details: ' + error.message, 'error', messageDiv);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify Answers';
        }
    }
}

async function resetPasswordWithAnswers() {
    const adminId = document.getElementById('resetAdminId').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('resetPasswordMessage');
    const submitBtn = document.querySelector('#forgotPasswordForm button[type="submit"]');
    
    // Validate inputs
    if (!adminId || !newPassword || !confirmPassword) {
        showResetMessage('All fields are required', 'error', messageDiv);
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showResetMessage('New passwords do not match', 'error', messageDiv);
        return;
    }

    if (!verifiedSecurityAnswers || Object.keys(verifiedSecurityAnswers).length === 0) {
        showResetMessage('Please verify your security question answers before resetting password', 'error', messageDiv);
        showStep(2);
        return;
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
        showResetMessage(passwordValidation.message, 'error', messageDiv);
        return;
    }
    
    // Show loading state
    showResetMessage('⏳ Resetting your password...', 'info', messageDiv);
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Resetting...';
    }
    
    try {
        const response = await fetch('/api/admin/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminId, newPassword, answers: verifiedSecurityAnswers })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showResetMessage('✓ Password reset successfully! You can now login with your new password.', 'success', messageDiv);
            setTimeout(() => {
                closeForgotPasswordModal();
                showStep(1); // Reset to step 1
                document.getElementById('forgotPasswordForm').reset();
                verifiedSecurityAnswers = null;
            }, 2000);
        } else {
            showResetMessage(data.message || 'Failed to reset password', 'error', messageDiv);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Reset Password';
            }
        }
    } catch (error) {
        console.error('Reset password error:', error);
        showResetMessage('Error resetting password: ' + error.message, 'error', messageDiv);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
        }
    }
}

function validatePasswordStrength(password) {
    // Minimum 12 characters
    if (password.length < 12) {
        return { 
            valid: false, 
            message: 'Password must be at least 12 characters long' 
        };
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        return { 
            valid: false, 
            message: 'Password must contain at least one uppercase letter (A-Z)' 
        };
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        return { 
            valid: false, 
            message: 'Password must contain at least one lowercase letter (a-z)' 
        };
    }
    
    // Check for number
    if (!/[0-9]/.test(password)) {
        return { 
            valid: false, 
            message: 'Password must contain at least one number (0-9)' 
        };
    }
    
    // Check for special character/symbol
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { 
            valid: false, 
            message: 'Password must contain at least one symbol (!@#$%^&* etc.)' 
        };
    }
    
    return { valid: true, message: '' };
}

// Update password requirements display in real-time
function updatePasswordRequirements() {
    const password = document.getElementById('newPassword').value;
    
    // Check each requirement
    const requirements = {
        'req-length': password.length >= 12,
        'req-upper': /[A-Z]/.test(password),
        'req-lower': /[a-z]/.test(password),
        'req-number': /[0-9]/.test(password),
        'req-symbol': /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    // Update display for each requirement
    for (const [reqId, isMet] of Object.entries(requirements)) {
        const element = document.getElementById(reqId);
        if (element) {
            if (isMet) {
                element.textContent = element.textContent.replace(/^[•✓]/, '✓');
                element.style.color = '#28a745'; // Green
            } else {
                element.textContent = element.textContent.replace(/^[•✓]/, '•');
                element.style.color = '#999'; // Gray
            }
        }
    }
}

function showResetMessage(message, type, messageDiv) {
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#d4edda';
        messageDiv.style.color = '#155724';
        messageDiv.style.border = '1px solid #c3e6cb';
    } else if (type === 'info') {
        messageDiv.style.backgroundColor = '#d1ecf1';
        messageDiv.style.color = '#0c5460';
        messageDiv.style.border = '1px solid #bee5eb';
    } else {
        messageDiv.style.backgroundColor = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.style.border = '1px solid #f5c6cb';
    }
    
    messageDiv.style.padding = '10px';
    messageDiv.style.borderRadius = '4px';
}

// Handle login form submission
function handleLoginSubmit() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const adminId = document.getElementById('adminId').value;
            const password = document.getElementById('password').value;
            
            console.log('Login attempt:', { adminId, password });
            // Use mock API to "login" then set client-side auth token
            window.dashboardAPI.login(adminId, password).then(resp => {
                if (resp && resp.success) {
                    if (resp.requires2FA) {
                        // Store temporary session data for 2FA
                        sessionStorage.setItem('2fa_adminId', adminId);
                        sessionStorage.setItem('2fa_tempToken', resp.tempToken);
                        // Show 2FA modal
                        show2FAModal();
                    } else {
                        // store a simple flag and adminId for front-end-only session
                        localStorage.setItem('kolek_auth', '1');
                        const adminData = resp.admin || {};
                        const storedId = adminData.adminID || adminData.adminId || adminData.id || adminId;
                        localStorage.setItem('kolek_admin', storedId);
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    alert('Login failed: ' + (resp.message || 'Invalid credentials'));
                }
            }).catch(err => {
                console.error('Login error', err);
                alert('Login error (see console)');
            });
        });
    }
    
    // Setup 2FA form
    setup2FAForm();
    
    // Setup forgot password form
    handleForgotPasswordSubmit();
}

// ==================== 2FA FUNCTIONS ====================
let twoFactorCodeTimer = null;
let twoFactorTimeRemaining = 600; // 10 minutes in seconds

function setup2FAForm() {
    const twoFactorForm = document.getElementById('twoFactorForm');
    if (twoFactorForm) {
        twoFactorForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await verify2FACode();
        });
    }
}

function show2FAModal() {
    const modal = document.getElementById('twoFactorModal');
    if (modal) {
        modal.classList.add('show');
        // Focus on the input field
        setTimeout(() => {
            const codeInput = document.getElementById('twoFactorCode');
            if (codeInput) codeInput.focus();
        }, 100);
        // Start the timer
        start2FATimer();
    }
}

function close2FAModal() {
    const modal = document.getElementById('twoFactorModal');
    if (modal) {
        modal.classList.remove('show');
    }
    if (twoFactorCodeTimer) {
        clearInterval(twoFactorCodeTimer);
    }
    // Clear session storage
    sessionStorage.removeItem('2fa_adminId');
    sessionStorage.removeItem('2fa_tempToken');
    // Clear form
    const codeInput = document.getElementById('twoFactorCode');
    if (codeInput) codeInput.value = '';
}

function cancelTwoFactor() {
    close2FAModal();
    // Also clear the login form so user has to re-enter credentials
    document.getElementById('loginForm').reset();
}

function start2FATimer() {
    twoFactorTimeRemaining = 600; // Reset to 10 minutes
    if (twoFactorCodeTimer) clearInterval(twoFactorCodeTimer);
    
    twoFactorCodeTimer = setInterval(() => {
        twoFactorTimeRemaining--;
        const minutes = Math.floor(twoFactorTimeRemaining / 60);
        const seconds = twoFactorTimeRemaining % 60;
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (twoFactorTimeRemaining <= 0) {
            clearInterval(twoFactorCodeTimer);
            show2FAMessage('Verification code expired. Please request a new code.', 'error');
            const submitBtn = document.querySelector('#twoFactorForm button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
        }
    }, 1000);
}

function show2FAMessage(message, type) {
    const messageDiv = document.getElementById('twoFactorMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
        
        if (type === 'error') {
            messageDiv.style.backgroundColor = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
        } else if (type === 'success') {
            messageDiv.style.backgroundColor = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.style.border = '1px solid #c3e6cb';
        } else {
            messageDiv.style.backgroundColor = '#d1ecf1';
            messageDiv.style.color = '#0c5460';
            messageDiv.style.border = '1px solid #bee5eb';
        }
    }
}

async function verify2FACode() {
    const adminId = sessionStorage.getItem('2fa_adminId');
    const tempToken = sessionStorage.getItem('2fa_tempToken');
    const twoFactorCode = document.getElementById('twoFactorCode').value.trim();
    
    if (!adminId || !tempToken) {
        show2FAMessage('Session expired. Please login again.', 'error');
        return;
    }
    
    if (!twoFactorCode || twoFactorCode.length !== 6 || !/^\d{6}$/.test(twoFactorCode)) {
        show2FAMessage('Please enter a valid 6-digit code.', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#twoFactorForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
    }
    
    try {
        const response = await fetch('/api/admin/verify-2fa-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adminId: adminId,
                twoFactorCode: twoFactorCode,
                tempToken: tempToken
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            show2FAMessage('✓ Verification successful! Redirecting...', 'success');
            // Store auth data and redirect
            localStorage.setItem('kolek_auth', '1');
            const adminData = data.admin || {};
            const storedId = adminData.adminID || adminData.adminId || adminData.id || adminId;
            localStorage.setItem('kolek_admin', storedId);
            
            // Close modal and redirect
            setTimeout(() => {
                close2FAModal();
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            show2FAMessage(data.message || 'Verification failed. Please try again.', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verify & Login';
            }
        }
    } catch (error) {
        console.error('2FA verification error:', error);
        show2FAMessage('An error occurred. Please try again.', 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify & Login';
        }
    }
}

async function resendTwoFactorCode() {
    const adminId = sessionStorage.getItem('2fa_adminId');
    const tempToken = sessionStorage.getItem('2fa_tempToken');
    
    if (!adminId || !tempToken) {
        show2FAMessage('Session expired. Please login again.', 'error');
        return;
    }
    
    const resendBtn = document.getElementById('resendCodeBtn');
    if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending...';
    }
    
    try {
        const response = await fetch('/api/admin/resend-2fa-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adminId: adminId,
                tempToken: tempToken
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            show2FAMessage('✓ New code sent to your email', 'success');
            // Reset timer
            start2FATimer();
            // Clear code input
            document.getElementById('twoFactorCode').value = '';
            document.getElementById('twoFactorCode').focus();
        } else {
            show2FAMessage(data.message || 'Failed to resend code. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Resend 2FA code error:', error);
        show2FAMessage('An error occurred. Please try again.', 'error');
    } finally {
        if (resendBtn) {
            resendBtn.disabled = false;
            resendBtn.textContent = "Didn't receive the code? Resend";
        }
    }
}

// ==================== DASHBOARD PAGE FUNCTIONS ====================
// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    const isDashboard = document.querySelector('.dashboard-container');
    const isLogin = document.querySelector('.container:not(.dashboard-container)');
    // If we're on the dashboard page, ensure user is authenticated
    if (isDashboard) {
        const auth = localStorage.getItem('kolek_auth');
        if (!auth) {
            // not authenticated -> redirect to login
            window.location.href = 'index.html';
            return;
        }
        // Initialize dashboard
        initializeDashboard();
        setupEventListeners();
        // If a page was requested before a reload, navigate to it now
            try {
                const requested = localStorage.getItem('kolek_active_page');
                if (requested) {
                    localStorage.removeItem('kolek_active_page');
                    const nav = document.querySelector(`.nav-item[data-page="${requested}"]`);
                    if (nav) nav.click();
                }
            } catch (e) { console.error('Error restoring requested page', e); }
        refreshUcoTrendChart();
        updateDate();
        initThemeMode();
        initSessionTimeout();
    } else if (isLogin) {
        handleLoginSubmit();
    }
});
// Initialize dashboard charts
function initializeDashboard() {
    createUCOTrendChart();
    createAreaChart();
    setInterval(updateDate, 60000); // Update date every minute
    setupSettingsInteractions();
    setupSecurityQuestionsInteractions();
    initializeLanguageOnLoad();
    // Load household data for leaderboard on dashboard
    loadHouseholdFromCSV().catch(err => console.error('Failed to load household data for dashboard:', err));
    // Load campaign data for awareness overview
    loadCampaignFromCSV().catch(err => console.error('Failed to load campaign data for dashboard:', err));
    // Load household data for leaderboard on dashboard
    loadHouseholdFromCSV().catch(err => console.error('Failed to load household data for dashboard:', err));
    // Load campaign data for awareness overview
    loadCampaignFromCSV().catch(err => console.error('Failed to load campaign data for dashboard:', err));
}
// Setup event listeners
function setupEventListeners() {
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }
    // Applicant page 'Refresh' button (preserve other behavior elsewhere)
    const applicantAdd = document.getElementById('applicant-add');
    if (applicantAdd) {
        applicantAdd.addEventListener('click', function(e) {
            e.preventDefault();
            try {
                // After reload, navigate back to applicant page
                localStorage.setItem('kolek_active_page', 'applicant');
            } catch (err) {}
            // Hard reload to ensure fresh data
            window.location.reload();
        });
    }

    // Reward page 'Refresh' button: persist active page and reload
    const rewardRefresh = document.getElementById('reward-refresh');
    if (rewardRefresh) {
        rewardRefresh.addEventListener('click', function(e) {
            e.preventDefault();
            try {
                localStorage.setItem('kolek_active_page', 'reward');
            } catch (err) {}
            window.location.reload();
        });
    }
    // Export PDF button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportPDF);
    }
    // Year select dropdown
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
        yearSelect.addEventListener('change', handleYearChange);
    }
    const ucoMonthSelect = document.getElementById('uco-month-select');
    if (ucoMonthSelect) {
        ucoMonthSelect.addEventListener('change', handleUcoMonthChange);
    }
    const ucoWeekSelect = document.getElementById('uco-week-select');
    if (ucoWeekSelect) {
        ucoWeekSelect.addEventListener('change', handleUcoWeekChange);
    }
    // Awareness overview sort controls
    const awarenessMetric = document.getElementById('awareness-metric-filter');
    if (awarenessMetric) {
        awarenessMetric.addEventListener('change', handleAwarenessMetricChange);
    }
    const awarenessOrder = document.getElementById('awareness-sort-order');
    if (awarenessOrder) {
        awarenessOrder.addEventListener('change', handleAwarenessSortOrderChange);
    }
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            try {
                localStorage.removeItem('kolek_auth');
                localStorage.removeItem('kolek_admin');
            } catch (err) {}
            window.location.href = 'index.html';
        });
    }
    // Header avatar -> open profile page
    const headerAvatar = document.getElementById('header-user-avatar');
    if (headerAvatar) headerAvatar.addEventListener('click', function(e){ e.preventDefault(); openProfilePage(); });

    setupChartMaximizeControls();
}

let activeMaximizedCard = null;

function getChartBackdrop() {
    let backdrop = document.querySelector('.chart-maximize-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'chart-maximize-backdrop';
        document.body.appendChild(backdrop);
    }
    return backdrop;
}

function resizeChartForCard(card, chartName) {
    const key = chartName || card?.querySelector('.chart-maximize-btn')?.getAttribute('data-chart');
    if (!key || !window[key] || typeof window[key].resize !== 'function') return;
    requestAnimationFrame(() => {
        window[key].resize();
    });
}

function openChartMaximize(card, button) {
    const backdrop = getChartBackdrop();
    card.classList.add('is-maximized');
    document.body.classList.add('chart-maximized');
    backdrop.classList.add('active');
    if (button) {
        button.innerHTML = '<i class="fas fa-compress"></i>';
        button.setAttribute('aria-label', 'Minimize chart');
        button.title = 'Minimize chart';
    }
    activeMaximizedCard = card;
    resizeChartForCard(card, button?.getAttribute('data-chart'));
}

function closeChartMaximize(card) {
    const backdrop = getChartBackdrop();
    const button = card?.querySelector('.chart-maximize-btn');
    card?.classList.remove('is-maximized');
    document.body.classList.remove('chart-maximized');
    backdrop.classList.remove('active');
    if (button) {
        button.innerHTML = '<i class="fas fa-expand"></i>';
        button.setAttribute('aria-label', 'Maximize chart');
        button.title = 'Maximize chart';
    }
    activeMaximizedCard = null;
    resizeChartForCard(card, button?.getAttribute('data-chart'));
}

function setupChartMaximizeControls() {
    const buttons = document.querySelectorAll('.chart-maximize-btn');
    if (!buttons.length) return;
    const backdrop = getChartBackdrop();

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const card = targetId ? document.getElementById(targetId) : button.closest('.chart-maximizable');
            if (!card) return;
            if (activeMaximizedCard && activeMaximizedCard !== card) {
                closeChartMaximize(activeMaximizedCard);
            }
            if (card.classList.contains('is-maximized')) {
                closeChartMaximize(card);
            } else {
                openChartMaximize(card, button);
            }
        });
    });

    backdrop.addEventListener('click', () => {
        if (activeMaximizedCard) closeChartMaximize(activeMaximizedCard);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && activeMaximizedCard) {
            closeChartMaximize(activeMaximizedCard);
        }
    });
}
// Handle navigation
function handleNavigation(event) {
    event.preventDefault();
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    this.classList.add('active');
    
    // Get the page name
    const page = this.getAttribute('data-page');
    
    // Hide all content sections
    document.querySelectorAll('.content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected content
    const contentId = `${page}-content`;
    const content = document.getElementById(contentId);
    if (content) {
        content.style.display = 'block';
    }
    if (page === 'collection' && typeof loadCollectionFromDatabase === 'function') {
        loadCollectionFromDatabase()
            .then(() => {
                setupCollectionInteractions();
                setupCollectionPagination();
            })
            .catch(err => {
                console.error('Collection load error', err);
                setupCollectionInteractions();
            });
    }
    if (page === 'collector' && collectorFullData && collectorFullData.length) {
        applyCollectorFilters();
    }
    if (page === 'household' && householdFullData && householdFullData.length) {
        applyHouseholdFilters();
    }
    // update header title to the clicked item's text
    try {
        const title = this.textContent.replace(/\s+/g, ' ').trim();
        const headerTitle = document.querySelector('.header-left h1');
        if (headerTitle) headerTitle.textContent = title;
    } catch(e){}
}
// Open profile page programmatically (used by header avatar click)
function openProfilePage(){
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.content').forEach(content => content.style.display = 'none');
    const profile = document.getElementById('profile-content');
    if (profile) profile.style.display = 'block';
    const headerTitle = document.querySelector('.header-left h1');
    if (headerTitle) headerTitle.textContent = 'Profile';
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
const UCO_MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function parseCreditEarned(row) {
    const raw = pickCollectionField(row, [
        'creditEarned',
        'creditsEarned',
        'credit',
        'creditAmount',
        'credit_earned',
        'credit_earned_rm'
    ], 0);
    const num = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
    return Number.isFinite(num) ? num : 0;
}

function parsePointsEarned(row) {
    const raw = pickCollectionField(row, [
        'pointsEarned',
        'points',
        'points_earned'
    ], 0);
    const num = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
    return Number.isFinite(num) ? num : 0;
}

function parseCollectionDate(row) {
    const raw = pickCollectionField(row, [
        'collectionDate',
        'collectedTime',
        'collectionTime',
        'requestTime',
        'date'
    ], '');
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDmy(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getWeekOfYear(date) {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

function getWeekOfMonth(date) {
    const dayOfMonth = date.getDate();
    return Math.ceil(dayOfMonth / 7);
}

function buildWeekRanges(year, monthIndex) {
    const ranges = [];
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let startDay = 1;
    while (startDay <= daysInMonth) {
        const endDay = Math.min(startDay + 6, daysInMonth);
        const start = new Date(year, monthIndex, startDay);
        const end = new Date(year, monthIndex, endDay);
        ranges.push({ start, end });
        startDay = endDay + 1;
    }
    return ranges;
}

function updateUcoWeekOptions(year, monthIndex) {
    const weekSelect = document.getElementById('uco-week-select');
    if (!weekSelect) return;
    weekSelect.innerHTML = '';

    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'All weeks';
    weekSelect.appendChild(allOpt);

    if (typeof monthIndex !== 'number' || monthIndex < 0) {
        weekSelect.value = 'all';
        weekSelect.disabled = true;
        return;
    }

    const ranges = buildWeekRanges(year, monthIndex);
    ranges.forEach(range => {
        const option = document.createElement('option');
        const start = range.start;
        const end = range.end;
        const value = `${start.toISOString().slice(0, 10)}|${end.toISOString().slice(0, 10)}`;
        option.value = value;
        option.textContent = `${formatDmy(start)}-${formatDmy(end)}`;
        weekSelect.appendChild(option);
    });

    weekSelect.disabled = false;
    if (!weekSelect.value) weekSelect.value = 'all';
}

function computeDailyTotals(data, year, startDate, endDate) {
    const dailyKg = {};
    const dailyPoints = {};
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (cursor <= end) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        dailyKg[key] = 0;
        dailyPoints[key] = 0;
        cursor.setDate(cursor.getDate() + 1);
    }

    (data || []).forEach(row => {
        const status = normalizeStatusText(pickCollectionField(row, ['collectionStatus', 'status', 'collection_status'], ''));
        if (!status.includes('completed')) return;
        const date = parseCollectionDate(row);
        if (!date || date.getFullYear() !== year) return;
        if (date < startDate || date > endDate) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const points = parsePointsEarned(row);
        const kg = points / 150;
        if (Object.prototype.hasOwnProperty.call(dailyKg, key)) {
            dailyKg[key] += kg;
            dailyPoints[key] += points;
        }
    });

    const keys = Object.keys(dailyKg).sort();
    const labels = keys.map(key => {
        const parts = key.split('-');
        return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
    });
    const kgTotals = keys.map(key => dailyKg[key] || 0);
    const pointsTotals = keys.map(key => dailyPoints[key] || 0);

    return { labels, kgTotals, pointsTotals };
}

function computeWeeklyTotals(data, year, monthIndex) {
    const weeklyKg = {};
    const weeklyPoints = {};
    (data || []).forEach(row => {
        const status = normalizeStatusText(pickCollectionField(row, ['collectionStatus', 'status', 'collection_status'], ''));
        if (!status.includes('completed')) return;
        const date = parseCollectionDate(row);
        if (!date || date.getFullYear() !== year) return;
        if (typeof monthIndex === 'number' && monthIndex >= 0 && date.getMonth() !== monthIndex) return;
        const week = (typeof monthIndex === 'number' && monthIndex >= 0)
            ? getWeekOfMonth(date)
            : getWeekOfYear(date);
        const points = parsePointsEarned(row);
        const kg = points / 150;
        weeklyKg[week] = (weeklyKg[week] || 0) + kg;
        weeklyPoints[week] = (weeklyPoints[week] || 0) + points;
    });

    const weeks = Object.keys(weeklyKg).map(n => parseInt(n, 10)).sort((a, b) => a - b);
    const labels = weeks.map(week => `Week ${week}`);
    const kgTotals = weeks.map(week => weeklyKg[week] || 0);
    const pointsTotals = weeks.map(week => weeklyPoints[week] || 0);

    return { labels, kgTotals, pointsTotals };
}

function refreshUcoTrendChart() {
    if (!window.ucoChart) return;
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('uco-month-select');
    const weekSelect = document.getElementById('uco-week-select');
    const year = parseInt(yearSelect?.value, 10) || new Date().getFullYear();
    const monthIndex = (monthSelect && monthSelect.value !== 'all')
        ? parseInt(monthSelect.value, 10) - 1
        : null;

    updateUcoWeekOptions(year, monthIndex);

    let totals = null;
    const weekRange = weekSelect && weekSelect.value && weekSelect.value !== 'all'
        ? weekSelect.value
        : null;

    if (weekRange && monthIndex !== null) {
        const parts = weekRange.split('|');
        const startDate = new Date(parts[0]);
        const endDate = new Date(parts[1]);
        totals = computeDailyTotals(collectionFullData || [], year, startDate, endDate);
        window.ucoChart.data.datasets[0]._pointsDaily = totals.pointsTotals;
        window.ucoChart.data.datasets[0]._pointsWeekly = [];
    } else {
        totals = computeWeeklyTotals(collectionFullData || [], year, monthIndex);
        window.ucoChart.data.datasets[0]._pointsWeekly = totals.pointsTotals;
        window.ucoChart.data.datasets[0]._pointsDaily = [];
    }

    window.ucoChart.data.labels = totals.labels;
    window.ucoChart.data.datasets[0].data = totals.kgTotals;
    window.ucoChart.data.datasets[0].label = String(year);
    window.ucoChart.update();
}

// Create UCO Collection Trend Chart
function createUCOTrendChart() {
    const canvas = document.getElementById('ucoChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 240);
    gradient.addColorStop(0, 'rgba(76, 175, 80, 0.4)');
    gradient.addColorStop(1, 'rgba(76, 175, 80, 0.05)');
    
    const data = {
        labels: [],
        datasets: [{
            label: '2025',
            data: [],
            borderColor: '#4CAF50',
            backgroundColor: gradient,
            borderWidth: 2,
            fill: 'origin',
            tension: 0.4,
            pointBackgroundColor: '#2e9f69',
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#2e9f69',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 1.5
        }]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 6,
                right: 8,
                bottom: 0,
                left: 4
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                align: 'center',
                labels: {
                    color: '#666',
                    font: {
                        size: 12
                    },
                    padding: 12,
                    usePointStyle: true,
                    boxWidth: 10
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#2e9f69',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                cornerRadius: 8,
                callbacks: {
                    label: function(context) {
                        const kg = context.parsed.y || 0;
                        const weeklyPoints = (context.dataset && Array.isArray(context.dataset._pointsWeekly))
                            ? (context.dataset._pointsWeekly[context.dataIndex] || 0)
                            : 0;
                        const dailyPoints = (context.dataset && Array.isArray(context.dataset._pointsDaily))
                            ? (context.dataset._pointsDaily[context.dataIndex] || 0)
                            : 0;
                        const points = dailyPoints || weeklyPoints;
                        return [`${kg.toFixed(2)} kg`, `Points ${points.toFixed(0)}`];
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#666',
                    font: {
                        size: 11
                    },
                    padding: 6
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    borderDash: [4, 4],
                    drawBorder: false,
                    drawTicks: false
                }
            },
            x: {
                ticks: {
                    color: '#666',
                    font: {
                        size: 11
                    },
                    padding: 6,
                    maxTicksLimit: 8
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            }
        }
    };
    window.ucoChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}
// Create Area Distribution Pie Chart
function createAreaChart() {
    const canvas = document.getElementById('areaChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const data = {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: ['#4CAF50'],
            borderColor: '#fff',
            borderWidth: 2
        }]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#4CAF50',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: function(context) {
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((sum, v) => sum + v, 0) || 1;
                        const pct = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${value} (${pct}%)`;
                    }
                }
            }
        }
    };
    window.areaChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: options
    });
    refreshAreaChartFromCollections();
}
// Handle refresh button
function handleRefresh() {
    const btn = document.getElementById('refresh-btn');
    if (!btn) return;
    btn.style.transform = 'rotate(0deg)';
    btn.style.transition = 'transform 0.6s ease';
    
    setTimeout(() => {
        btn.style.transform = 'rotate(360deg)';
    }, 10);
    
    // Simulate data refresh
    setTimeout(() => {
        console.log('Dashboard refreshed');
        // Update charts with latest collection data
        refreshUcoTrendChart();
        refreshAreaChartFromCollections();
    }, 300);
}
// Handle export to PDF
function handleExportPDF() {
    console.log('Exporting dashboard to PDF...');
    alert('PDF export functionality will be implemented with backend');
}
// Handle year change
function handleYearChange(event) {
    const year = event.target.value;
    console.log('Year selected:', year);
    const monthSelect = document.getElementById('uco-month-select');
    const monthIndex = (monthSelect && monthSelect.value !== 'all')
        ? parseInt(monthSelect.value, 10) - 1
        : null;
    updateUcoWeekOptions(parseInt(year, 10) || new Date().getFullYear(), monthIndex);
    refreshUcoTrendChart();
}
// Handle month filter
function handleMonthFilter(event) {
    const filter = event.target.value;
    console.log('Month filter selected:', filter);
    // Filter table data based on selection
    // TODO: Connect to backend for filtered data
}

function toAwarenessNumber(value) {
    if (value === null || value === undefined) return 0;
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    return Number.isFinite(num) ? num : 0;
}

function pickAwarenessField(row, keys, fallback = '') {
    for (const key of keys) {
        if (!row) continue;
        if (Object.prototype.hasOwnProperty.call(row, key)) {
            const val = row[key];
            if (val !== null && val !== undefined && String(val).trim() !== '') return val;
        }
    }
    return fallback;
}

function getAwarenessMetricValue(row, metric) {
    const m = String(metric || '').trim();
    if (m === 'views') {
        return toAwarenessNumber(pickAwarenessField(row, ['campaignViews', 'views', 'Views'], 0));
    }
    if (m === 'watchTime') {
        return toAwarenessNumber(pickAwarenessField(row, ['averageWatchTime', 'watchTime', 'Average Watch Time', 'avgWatchTime'], 0));
    }
    if (m === 'clickRate') {
        return toAwarenessNumber(pickAwarenessField(row, ['clickRate', 'Click Rate', 'click_rate'], 0));
    }
    if (m === 'totalShare') {
        return toAwarenessNumber(pickAwarenessField(row, ['totalShare', 'totalShares', 'Total Share', 'share', 'shares'], 0));
    }
    return 0;
}

function applyAwarenessSortAndRender() {
    if (!Array.isArray(awarenessCampaignFullData) || awarenessCampaignFullData.length === 0) {
        // If no data loaded from CSV or API, attempt to build data from the existing DOM table
        const fromDom = parseAwarenessTableFromDOM();
        if (fromDom && fromDom.length) {
            awarenessCampaignFullData = fromDom.slice();
        } else {
            return;
        }
    }
    const metricSel = document.getElementById('awareness-metric-filter');
    const orderSel = document.getElementById('awareness-sort-order');
    const metric = metricSel ? (metricSel.value || awarenessSortMetric) : awarenessSortMetric;
    const order = orderSel ? (orderSel.value || awarenessSortOrder) : awarenessSortOrder;
    awarenessSortMetric = metric;
    awarenessSortOrder = order;

    const dir = order === 'asc' ? 1 : -1;
    const sorted = awarenessCampaignFullData.slice().sort((a, b) => {
        const av = getAwarenessMetricValue(a, metric);
        const bv = getAwarenessMetricValue(b, metric);
        if (av === bv) return 0;
        return av > bv ? dir : -dir;
    });
    populateAwarenessTable(sorted);
}

// Try to build awareness campaign objects from the existing table rows
function parseAwarenessTableFromDOM() {
    try {
        const tbody = document.getElementById('awareness-tbody') || document.querySelector('#awareness-table tbody');
        if (!tbody) return [];
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const data = rows.map(r => {
            const cells = r.querySelectorAll('td');
            const idText = (cells[0] && cells[0].textContent || '').replace(/^#/, '').trim();
            const name = (cells[1] && cells[1].textContent || '').trim();
            const views = (cells[2] && cells[2].textContent || '').trim();
            const watchTime = (cells[3] && cells[3].textContent || '').trim().replace(/seconds?$/i, '').trim();
            const clickRate = (cells[4] && cells[4].textContent || '').trim().replace(/%$/,'').trim();
            const shareCell = (cells[5] && cells[5].textContent || '').trim();
            const totalShare = shareCell.replace(/[^0-9.%\-+]/g, '').trim();
            return {
                campaignID: idText,
                campaignName: name,
                campaignViews: views,
                averageWatchTime: watchTime,
                clickRate: clickRate,
                totalShare: totalShare
            };
        });
        return data;
    } catch (e) {
        console.error('parseAwarenessTableFromDOM failed', e);
        return [];
    }
}

function handleAwarenessMetricChange(event) {
    awarenessHasUserSelection = true;
    awarenessSortMetric = event?.target?.value || awarenessSortMetric;
    applyAwarenessSortAndRender();
}

function handleAwarenessSortOrderChange(event) {
    awarenessHasUserSelection = true;
    awarenessSortOrder = event?.target?.value || awarenessSortOrder;
    applyAwarenessSortAndRender();
}

function handleUcoMonthChange(event) {
    const filter = event.target.value;
    console.log('UCO month selected:', filter);
    const yearSelect = document.getElementById('year-select');
    const year = parseInt(yearSelect?.value, 10) || new Date().getFullYear();
    const monthIndex = filter !== 'all' ? parseInt(filter, 10) - 1 : null;
    updateUcoWeekOptions(year, monthIndex);
    const weekSelect = document.getElementById('uco-week-select');
    if (weekSelect) weekSelect.value = 'all';
    refreshUcoTrendChart();
}

function handleUcoWeekChange(event) {
    const filter = event.target.value;
    console.log('UCO week selected:', filter);
    refreshUcoTrendChart();
}
// ==================== EXPORT FORMAT FUNCTIONS ====================
// Get the selected report format from settings
function getReportFormatSetting() {
    try {
        return localStorage.getItem('settings:reportFormat') || 'PDF';
    } catch(e) {
        return 'PDF';
    }
}

// Get saved report header from localStorage
function getReportHeader() {
    try {
        const raw = localStorage.getItem('settings:reportHeader');
        if (!raw) return null;
        const obj = JSON.parse(raw);
        return obj && typeof obj === 'object' ? obj : null;
    } catch (e) { return null; }
}

// Export table data in the selected format (CSV, XLSX, or PDF)
function exportTableData(filename, headers, rows, format) {
    format = format || getReportFormatSetting();
    
    try {
        if (format === 'XLSX') {
            exportTableAsXLSX(filename, headers, rows);
        } else if (format === 'PDF') {
            exportTableAsPDF(filename, headers, rows);
        } else {
            // Default to CSV
            exportTableAsCSV(filename, headers, rows);
        }
    } catch(err) {
        console.error('Export error:', err);
        alert('Export failed: ' + (err.message || 'Unknown error'));
    }
}

// Export table as CSV
function exportTableAsCSV(filename, headers, rows) {
    const headerObj = getReportHeader();
    const csvRows = [];
    if (headerObj && (headerObj.title || headerObj.subtitle || headerObj.logo)) {
        csvRows.push('"' + String(headerObj.title || '').replace(/"/g,'""') + '"');
        if (headerObj.subtitle) csvRows.push('"' + String(headerObj.subtitle || '').replace(/"/g,'""') + '"');
        if (headerObj.logo) csvRows.push('"Logo URL: ' + String(headerObj.logo).replace(/"/g,'""') + '"');
        csvRows.push(''); // blank line after header
    }
    csvRows.push(headers.join(','));
    rows.forEach(r => {
        const values = r.map(c => '"' + String(c).trim().replace(/"/g,'""') + '"');
        csvRows.push(values.join(','));
    });
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export table as XLSX (requires xlsx library)
function exportTableAsXLSX(filename, headers, rows) {
    try {
        // Check if XLSX library is available
        if (typeof XLSX === 'undefined') {
            console.warn('XLSX library not loaded, falling back to CSV');
            exportTableAsCSV(filename, headers, rows);
            return;
        }
        // Create workbook and worksheet
        const headerObj = getReportHeader();
        const headerRows = [];
        if (headerObj && (headerObj.title || headerObj.subtitle || headerObj.logo)) {
            headerRows.push([headerObj.title || '']);
            if (headerObj.subtitle) headerRows.push([headerObj.subtitle]);
            if (headerObj.logo) headerRows.push(['Logo URL:', headerObj.logo]);
            headerRows.push([]);
        }
        const ws = XLSX.utils.aoa_to_sheet([ ...headerRows, headers, ...rows ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        // Generate download
        XLSX.writeFile(wb, filename + '.xlsx');
    } catch(err) {
        console.error('XLSX export error:', err);
        console.warn('Falling back to CSV');
        exportTableAsCSV(filename, headers, rows);
    }
}

// Export table as PDF
function exportTableAsPDF(filename, headers, rows) {
    try {
        // Check if jsPDF library is available
        if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
            console.warn('jsPDF library not loaded, falling back to CSV');
            exportTableAsCSV(filename, headers, rows);
            return;
        }
        
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;
        let yPosition = margin;
        
        // Add custom header (title / subtitle / logo URL)
        const headerObj = getReportHeader();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        const headerTitle = headerObj && headerObj.title ? String(headerObj.title) : filename;
        doc.text(headerTitle, margin, yPosition);
        yPosition += 8;
        if (headerObj && headerObj.subtitle) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(String(headerObj.subtitle), margin, yPosition);
            yPosition += 8;
        }
        if (headerObj && headerObj.logo) {
            const logoVal = String(headerObj.logo);
            // If logo is a data URL image, embed it into the PDF; otherwise, print the URL as text
            try {
                if (/^data:image\//.test(logoVal)) {
                    const imgFormat = /^data:image\/(png|jpeg|jpg)/.exec(logoVal)?.[1];
                    const fmt = (imgFormat && imgFormat.toUpperCase().replace('JPG','JPEG')) || 'PNG';
                    const imgWidth = Math.min(40, pageWidth - 2*margin - 20);
                    const imgHeight =  (imgWidth * 0.35) || 12;
                    // place image at right side of header area
                    try {
                        doc.addImage(logoVal, fmt, pageWidth - margin - imgWidth, margin, imgWidth, imgHeight);
                    } catch (e) {
                        // If addImage fails, fallback to printing the URL text
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(9);
                        doc.text('Logo: (image embed failed)', margin, yPosition);
                        yPosition += 8;
                    }
                } else {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    doc.text('Logo: ' + String(headerObj.logo), margin, yPosition);
                    yPosition += 8;
                }
            } catch (err) {
                console.warn('Logo embed/print failed', err);
            }
        }
        // Add date
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const now = new Date();
        doc.text('Generated: ' + now.toLocaleDateString() + ' ' + now.toLocaleTimeString(), margin, yPosition);
        yPosition += 8;
        
        // Create table data
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        const tableData = [headers, ...rows];
        const colWidths = Array(headers.length).fill((pageWidth - 2*margin) / headers.length);
        
        // Use auto table if available, otherwise use basic text rendering
        if (typeof doc.autoTable === 'function') {
            doc.autoTable({
                head: [headers],
                body: rows,
                startY: yPosition,
                margin: margin,
                styles: { fontSize: 9, cellPadding: 2 }
            });
        } else {
            // Fallback: render as text
            headers.forEach((h, i) => {
                doc.text(String(h), margin + (i * 30), yPosition);
            });
            yPosition += 6;
            rows.forEach(row => {
                if (yPosition > pageHeight - margin) {
                    doc.addPage();
                    yPosition = margin;
                }
                row.forEach((cell, i) => {
                    doc.text(String(cell), margin + (i * 30), yPosition);
                });
                yPosition += 5;
            });
        }
        
        // Save PDF
        doc.save(filename + '.pdf');
    } catch(err) {
        console.error('PDF export error:', err);
        console.warn('Falling back to CSV');
        exportTableAsCSV(filename, headers, rows);
    }
}

// Export Collector Details modal table as PDF
function exportCollectorDetailsModalAsPDF() {
    const modal = document.getElementById('collector-details-modal');
    if (!modal) {
        alert('Collector details modal not found.');
        return;
    }

    const idEl = modal.querySelector('.collector-id');
    const nameEl = modal.querySelector('.collector-name-large');
    const collectorId = String(idEl?.textContent || '').trim().replace(/^#/, '');
    const collectorName = String(nameEl?.textContent || '').replace(/\s+/g, ' ').trim();

    const table = modal.querySelector('.collector-details-table');
    if (!table) {
        alert('Collector details table not found.');
        return;
    }

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim()).filter(Boolean);
    const bodyRows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
        const cells = Array.from(tr.querySelectorAll('td'));
        return cells.map(td => td.textContent.trim());
    });

    // If table is in an empty-state row with one cell, export a simple message row
    const rows = (bodyRows.length === 1 && bodyRows[0].length <= 1)
        ? [[bodyRows[0][0] || 'No data']]
        : bodyRows;

    // Ensure we have some headers (fallback to fixed headers)
    const finalHeaders = headers.length
        ? headers
        : ['Collection ID', 'Source ID', 'Location', 'Time Requested', 'Time Collected', 'UCO Collected', 'Status'];

    const safeId = collectorId ? collectorId.replace(/[^a-z0-9_-]/gi, '_') : 'collector';
    const filename = `collector_${safeId}_details`;

    exportTableAsPDF(filename, finalHeaders, rows);
}

// Update export button text based on selected format
function updateExportButtonText(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    const format = getReportFormatSetting();
    const icon = '<i class="fas fa-file-export"></i>';
    btn.innerHTML = icon + ' Export ' + format;
}

// Update all export button texts
function updateAllExportButtonTexts() {
    const exportButtons = [
        'collection-export',
        'report-export',
        'household-export',
        'collector-export',
        'applicant-export',
        'station-export',
        'reward-export',
        'redemption-export',
        'export-btn'
    ];
    exportButtons.forEach(btnId => updateExportButtonText(btnId));
}

// ==================== API FUNCTIONS (For Backend Integration) ====================
// Mock data API functions (to be replaced with actual backend calls)
window.dashboardAPI = {
    // Get KPI data
    getKPIData: async function() {
        return {
            ucoCollected: 1290,
            co2Saved: 850,
            routesCreated: 50,
            households: 120
        };
    },
    // Get chart data
    getChartData: async function(year) {
        return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct'],
            data: [65, 70, 75, 80, 85, 80, 65.7, 75, 60, 55]
        };
    },
    // Get leaderboard data
    getLeaderboard: async function() {
        return [
            { rank: 1, householdId: '#H-100', points: 20630 },
            { rank: 2, householdId: '#H-095', points: 16451 },
            { rank: 3, householdId: '#H-098', points: 12300 },
            { rank: 4, householdId: '#H-098', points: 11750 },
            { rank: 5, householdId: '#H-094', points: 10370 }
        ];
    },
    // Get awareness campaigns
    getAwarenessData: async function(filter = 'this-month') {
        return [
            { id: '#CC-005', name: 'UCO Challenge', views: 85, watchTime: '32 seconds', clickRate: '20%', engagement: 85 },
            { id: '#CC-004', name: 'Go Green Tips', views: 90, watchTime: '35 seconds', clickRate: '12%', engagement: 72 },
            { id: '#CC-003', name: 'Reuse Oil Tips', views: 87, watchTime: '40 seconds', clickRate: '8%', engagement: 65 },
            { id: '#CC-002', name: 'Oil Disposal Tips', views: 98, watchTime: '43 seconds', clickRate: '10%', engagement: 70 },
            { id: '#CC-001', name: 'Kolek Rewards', views: 112, watchTime: '21 seconds', clickRate: '18%', engagement: 82 }
        ];
    },
    // Get area distribution
    getAreaDistribution: async function() {
        return [
            { area: 'Kuala Lumpur', percentage: 35 },
            { area: 'Ampang', percentage: 25 },
            { area: 'Shah Alam', percentage: 25 },
            { area: 'Cheras', percentage: 15 }
        ];
    },
    // Login function
    login: async function(adminId, password) {
        try {
            const resp = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminId, password })
            });
            const data = await resp.json();
            if (!resp.ok) {
                return { success: false, message: data?.message || 'Login failed' };
            }
            // Return full response data to support 2FA
            return {
                success: true,
                admin: data.admin,
                requires2FA: data.requires2FA,
                tempToken: data.tempToken,
                adminId: data.adminId,
                message: data.message
            };
        } catch (e) {
            console.error('Login error:', e);
            return { success: false, message: 'Login failed' };
        }
    },
    getAdmin: async function(adminId) {
        try {
            const resp = await fetch(`/api/admin/${encodeURIComponent(adminId)}`);
            const data = await resp.json();
            if (!resp.ok) {
                return { success: false, message: data?.message || 'Failed to load admin' };
            }
            return { success: true, data: data.data };
        } catch (e) {
            console.error('Get admin error:', e);
            return { success: false, message: 'Failed to load admin' };
        }
    },
    updateAdmin: async function(adminId, payload) {
        try {
            const resp = await fetch(`/api/admin/${encodeURIComponent(adminId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload || {})
            });
            const data = await resp.json();
            if (!resp.ok) {
                return { success: false, message: data?.message || 'Failed to update admin' };
            }
            return { success: true, data: data.data };
        } catch (e) {
            console.error('Update admin error:', e);
            return { success: false, message: 'Failed to update admin' };
        }
    },
    // Get stations data from backend
    getStations: async function() {
        // TODO: Replace with actual backend API call
        // Example: return fetch('/api/stations').then(r => r.json())
        console.log('Fetching stations from backend...');
        return {
            success: true,
            data: [
                { id: '#S-048', name: 'PETRONAS Temasya Federal Highway', fill: 42, purity: 98, status: 'good' },
                { id: '#S-047', name: 'Petronas Batu 3 Federal Highway', fill: 83.2, purity: 78, status: 'warning' },
                { id: '#S-046', name: 'PETRONAS Temasya Federal Highway', fill: 98, purity: 67, status: 'danger' },
                { id: '#S-045', name: 'PETRONAS Mutiara Damansara', fill: 21.5, purity: 97, status: 'good' },
                { id: '#S-044', name: 'PETRONAS Glenmarie TTDI Jaya', fill: 32, purity: 86, status: 'good' },
                { id: '#S-043', name: 'Petronas Cochrane Perkasa', fill: 86, purity: 91, status: 'warning' },
                { id: '#S-042', name: 'Petronas SS4B KELANA JAYA', fill: 95, purity: 89, status: 'danger' },
                { id: '#S-041', name: 'Petronas Kota Damansara 1', fill: 43.3, purity: 75, status: 'good' },
                { id: '#S-040', name: 'Petronas Bandar Puteri Puchong', fill: 41.6, purity: 65, status: 'good' },
                { id: '#S-039', name: 'PETRONAS Ara Damansara', fill: 35.1, purity: 45, status: 'good' }
            ]
        };
    },
    // Get available collectors from backend
    getCollectors: async function() {
        // TODO: Replace with actual backend API call
        // Example: return fetch('/api/collectors?status=available').then(r => r.json())
        console.log('Fetching available collectors from backend...');
        return {
            success: true,
            data: [
                { id: 'C001', name: 'Ahmad Bin Said', phone: '+60-17-123-4567', status: 'available' },
                { id: 'C002', name: 'Fatimah Binti Hasan', phone: '+60-16-987-6543', status: 'available' },
                { id: 'C003', name: 'Muhammad Ali', phone: '+60-18-555-1234', status: 'available' },
                { id: 'C004', name: 'Siti Nurhaliza', phone: '+60-19-444-5678', status: 'available' },
                { id: 'C005', name: 'Chen Wei Ming', phone: '+60-17-222-8901', status: 'on-trip' }
            ]
        };
    },
    // Assign collector to station
    assignCollector: async function(stationId, collectorId) {
        // TODO: Replace with actual backend API call
        // Example: return fetch('/api/assignments', { method: 'POST', body: JSON.stringify({stationId, collectorId}) }).then(r => r.json())
        console.log('Assigning collector to station:', { stationId, collectorId });
        return {
            success: true,
            message: 'Collector assigned successfully',
            assignmentId: 'ASS-' + Date.now()
        };
    },
    // Assign collector to collection
    assignCollectorToCollection: async function(payload) {
        try {
            const adminId = localStorage.getItem('kolek_admin') || '';
            const resp = await fetch('/api/collection/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...(payload || {}), adminId })
            });
            const data = await resp.json();
            if (!resp.ok) {
                return { success: false, message: data?.message || 'Failed to assign collector' };
            }
            return { success: true, data: data.data };
        } catch (e) {
            console.error('Assign collection error:', e);
            return { success: false, message: 'Failed to assign collector' };
        }
    },
    // Search stations
    searchStations: async function(query) {
        // TODO: Replace with actual backend API call
        // Example: return fetch(`/api/stations/search?q=${query}`).then(r => r.json())
        console.log('Searching stations:', { query });
        return {
            success: true,
            data: []
        };
    },
    // Export stations data
    exportStations: async function(filters = {}) {
        // TODO: Replace with actual backend API call for CSV generation
        // Example: return fetch('/api/stations/export', { method: 'POST', body: JSON.stringify(filters) }).then(r => r.blob())
        console.log('Exporting stations with filters:', filters);
        return {
            success: true,
            message: 'Export generated successfully'
        };
    }
    ,
    addStation: async function(payload) {
        try {
            const adminId = localStorage.getItem('kolek_admin') || '';
            const resp = await fetch('/api/station', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...(payload || {}), adminId })
            });
            const data = await resp.json();
            if (!resp.ok) {
                return { success: false, message: data?.message || data?.error || 'Failed to add station' };
            }
            return { success: true, data: data.data };
        } catch (e) {
            console.error('Add station error:', e);
            return { success: false, message: 'Failed to add station' };
        }
    }
    ,
    deleteStation: async function(stationId) {
        try {
            const adminId = localStorage.getItem('kolek_admin') || '';
            const cleanId = String(stationId || '').replace(/^#/, '').trim();
            const resp = await fetch(`/api/station/${encodeURIComponent(cleanId)}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminId })
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                return { success: false, message: data?.message || data?.error || 'Failed to delete station' };
            }
            return { success: true, data: data?.data };
        } catch (e) {
            console.error('Delete station error:', e);
            return { success: false, message: 'Failed to delete station' };
        }
    }
    ,
    // Export households data (mock)
    exportHouseholds: async function(filters = {}) {
        // TODO: Replace with actual backend API call for PDF/CSV generation
        console.log('Exporting households with filters:', filters);
        return { success: true, message: 'Household export generation started' };
    }
    ,
    // Export collectors data (mock)
    exportCollectors: async function(filters = {}) {
        console.log('Exporting collectors with filters:', filters);
        return { success: true, message: 'Collectors export generation started' };
    }
    ,
    // Export applicants data (mock)
    exportApplicants: async function(filters = {}) {
        console.log('Exporting applicants with filters:', filters);
        return { success: true, message: 'Applicants export generation started' };
    }
    ,
    // Export reports data (mock)
    exportReports: async function(filters = {}) {
        console.log('Exporting reports with filters:', filters);
        return { success: true, message: 'Reports export generation started' };
    }
    ,
    // Export collections (mock)
    exportCollections: async function(filters = {}) {
        console.log('Exporting collections with filters:', filters);
        return { success: true, message: 'Collections export generation started' };
    }
    ,
    // Empty station bin
    emptyStationBin: async function(stationId) {
        try {
            const resp = await fetch('/api/station/empty-bin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stationID: stationId })
            });
            const data = await resp.json();
            if (!resp.ok) {
                return { success: false, message: data?.message || 'Failed to empty bin' };
            }
            return { success: true, data: data.data };
        } catch (e) {
            console.error('Empty bin error:', e);
            return { success: false, message: 'Failed to empty bin' };
        }
    }
};
// Export API for backend integration
console.log('Application loaded. API available at window.dashboardAPI');
/* ==================== STATION PAGE JS: CLIENT-SIDE SEARCH + PAGINATION + COLLECTOR ASSIGNMENT ==================== */
(function(){
    const perPage = 10;
    let stationData = [];
    let filteredData = [];
    let currentPage = 1;
    let stationSearchQuery = '';
    let stationStatusFilter = 'all';
    let selectedStationForAssignment = null;
    let selectedCollector = null;
    let controlsBound = false;
    function reloadStations() {
        const loader = (typeof loadStationFromDatabase === 'function')
            ? loadStationFromDatabase
            : loadStationFromCSV;
        return loader().then(stations => {
            stationData = stations;
            filteredData = stationData.slice();
            currentPage = 1;
            applyStationFilters();
            updateStationKPI(stations.length);
            return stations;
        }).catch(err => {
            console.error('Error loading stations:', err);
            return [];
        });
    }
    function initStations() {
        reloadStations().then(() => {
            attachControls();
        });
    }
    function renderStationTable(page = currentPage) {
        const tbody = document.querySelector('#station-table tbody');
        const entriesInfo = document.getElementById('station-entries-info');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const data = filteredData;
        const total = data.length;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        
        if (page > totalPages) page = totalPages;
        currentPage = page;
        
        const start = (page - 1) * perPage;
        const end = Math.min(start + perPage, total);
        for (let i = start; i < end; i++) {
            const r = data[i];
            const tr = document.createElement('tr');
            let actionContent = '';
            // Robustly determine if station is nearly full (by fill value or status)
            const rawFill = String(r.fill || '').replace('%', '').trim();
            const fillNum = Number(rawFill) || 0;
            const statusLower = String(r.status || '').toLowerCase();
            const nearlyFull = fillNum >= 80 || statusLower === 'warning' || statusLower === 'danger';
            if (nearlyFull) {
                actionContent = `<a href="#" class="empty-bin-link danger" data-station-id="${r.id}" data-station-name="${escapeAttr(r.name)}" data-fill="${r.fill}"><i class="fas fa-trash-alt"></i> [Empty bin]</a>`;
            } else {
                // Not nearly full - show a subtle '[Empty bin]' action
                actionContent = `<a href="#" class="empty-bin-link" data-station-id="${r.id}" data-station-name="${escapeAttr(r.name)}" data-fill="${r.fill}"><i class="fas fa-trash-alt"></i> [Empty bin]</a>`;
            }
            tr.innerHTML = `
                <td>${escapeHtml(r.id)}</td>
                <td>${escapeHtml(r.name)}</td>
                <td class="map-col"><a href="#" class="view-map" data-station-name="${escapeAttr(r.name)}">View map <i class="fas fa-location-arrow"></i></a></td>
                <td>${r.fill}%</td>
                <td class="status ${r.status}">${statusText(r.status)}</td>
                <td class="actions actions-col">
                    <span class="action-group">${actionContent}</span>
                </td>
            `;
            tbody.appendChild(tr);
        }
        if (entriesInfo) {
            entriesInfo.textContent = `Showing ${total === 0 ? 0 : start + 1} to ${total === 0 ? 0 : end} of ${total} samples`;
        }
        
        renderPagination(totalPages);
        attachRowHandlers();
    }

    function renderPendingCollection(data){
        const tbody = document.getElementById("pending-collection-tbody");
        tbody.innerHTML = "";

        if(!data || data.length === 0){
            tbody.innerHTML = `<tr><td colspan="7">No pending collections</td></tr>`;
            return;
        }

        data.forEach((item) => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.collectionID || "-"}</td>
                <td>${item.householdID || "-"}</td>
                <td>${item.collectionAddress || "-"}</td>
                <td>${item.requestTime || "-"}</td>

                <td>
                    <select class="collector-select">
                        <option value="">Select Collector</option>
                    </select>
                </td>

                <!-- AI Suggestion Button -->
                <td>
                    <button 
                        class="btn btn-success ai-suggestion-btn"
                        data-id="${collectionId}">
                        AI Suggestion
                    </button>
                </td>

                <td>
                    <button class="btn btn-primary">Assign</button>
                </td>
            `;

            tbody.appendChild(row);
        });

        /* Attach click event AFTER rows are created */
        document.querySelectorAll(".ai-suggestion-btn").forEach(btn => {

            btn.addEventListener("click", function(){

                const collectionId = this.getAttribute("data-id");

                requestAISuggestion(collectionId);

            });

        });

    }

    document.addEventListener("click", function(e){

        if(e.target.classList.contains("ai-suggestion-btn")){

            const collectionId = e.target.getAttribute("data-id");

            requestAISuggestion(collectionId);

        }

    });

    function renderPagination(totalPages) {
        const container = document.getElementById('station-pagination');
        if (!container) return;
        
        container.innerHTML = '';
        
        const prev = pageBtn('prev', 'Prev', currentPage > 1, () => {
            if (currentPage > 1) renderStationTable(currentPage - 1);
        });
        container.appendChild(prev);
        
        for (let p = 1; p <= totalPages; p++) {
            const btn = pageBtn(p, String(p), true, () => renderStationTable(p));
            if (p === currentPage) btn.classList.add('active');
            container.appendChild(btn);
        }
        
        const next = pageBtn('next', 'Next', currentPage < totalPages, () => {
            if (currentPage < totalPages) renderStationTable(currentPage + 1);
        });
        container.appendChild(next);
    }
    function pageBtn(key, label, enabled = true, onClick = () => {}) {
        const b = document.createElement('button');
        b.className = 'page-btn';
        b.dataset.page = key;
        b.textContent = label;
        if (!enabled) {
            b.disabled = true;
            b.style.opacity = 0.6;
        }
        b.addEventListener('click', onClick);
        return b;
    }
    function applyStationFilters() {
        const q = stationSearchQuery.trim().toLowerCase();
        filteredData = stationData.filter(s => {
            const textMatch = !q || (
                String(s.id || '').toLowerCase().includes(q) ||
                String(s.name || '').toLowerCase().includes(q) ||
                String(s.fill || '').toLowerCase().includes(q)
            );
            const statusMatch = stationStatusFilter === 'all' || String(s.status || '').toLowerCase() === stationStatusFilter;
            return textMatch && statusMatch;
        });
        currentPage = 1;
        renderStationTable(1);
    }
    function attachControls() {
        if (controlsBound) return;
        controlsBound = true;
        const search = document.getElementById('station-search');
        const filterBtn = document.querySelector('#station-content #filter-sort-btn');
        const filterSelect = document.getElementById('station-filter-select');
        const exportBtn = document.getElementById('station-export');
        const addBtn = document.getElementById('station-add');
        if (search) {
            search.addEventListener('input', function(e) {
                stationSearchQuery = this.value || '';
                applyStationFilters();
            });
        }
        if (filterSelect) {
            filterSelect.addEventListener('change', function() {
                stationStatusFilter = this.value || 'all';
                applyStationFilters();
            });
            filterSelect.value = stationStatusFilter || 'all';
        }
        if (filterBtn && filterSelect) {
            setupFilterDropdown(filterBtn, filterSelect, () => {
                stationStatusFilter = filterSelect.value || 'all';
                applyStationFilters();
            });
        } else if (filterBtn) {
            filterBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const options = ['all', 'good', 'warning', 'danger'];
                const labels = {
                    all: 'All',
                    good: 'Good Condition',
                    warning: 'Nearly Full',
                    danger: 'Full Bin'
                };
                const idx = options.indexOf(stationStatusFilter);
                stationStatusFilter = options[(idx + 1) % options.length];
                filterBtn.title = `Filter: ${labels[stationStatusFilter] || 'All'}`;
                applyStationFilters();
            });
            if (!filterBtn.title) {
                filterBtn.title = 'Filter: All';
            }
        }
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                // Call backend API to export stations data
                window.dashboardAPI.exportStations({ filteredIds: filteredData.map(s => s.id) }).then(resp => {
                    if (resp && resp.success) {
                        console.log('Export successful:', resp);
                        // Export using selected format from settings
                        const header = ['Station ID','Station Name','Fill Level','Status'];
                        const dataRows = filteredData.map(r => 
                            [r.id, r.name, r.fill + '%', statusText(r.status)]
                        );
                        exportTableData('stations_export', header, dataRows);
                    } else {
                        console.error('Export failed:', resp);
                    }
                }).catch(err => {
                    console.error('Export error:', err);
                });
            });
        }
        // Station refresh button: reload page and return to Station tab
        const stationRefresh = document.getElementById('station-refresh');
        if (stationRefresh) stationRefresh.addEventListener('click', function(e) {
            e.preventDefault();
            const btn = this;
            if (btn.disabled || btn.dataset.refreshing === 'true') return;
            btn.dataset.refreshing = 'true';
            btn.disabled = true;
            try {
                btn.style.transform = 'rotate(0deg)';
                btn.style.transition = 'transform 0.6s ease';
                setTimeout(() => { btn.style.transform = 'rotate(360deg)'; }, 10);
                const table = document.querySelector('.station-table');
                if (table) {
                    table.style.transition = 'box-shadow 0.25s ease, transform 0.25s ease';
                    table.style.transform = 'translateY(-4px)';
                    table.style.boxShadow = '0 12px 34px rgba(0,0,0,0.08)';
                    setTimeout(() => { table.style.transform = ''; table.style.boxShadow = ''; }, 400);
                }
                setTimeout(() => {
                    try { localStorage.setItem('kolek_active_page', 'station'); } catch (e) {}
                    btn.dataset.refreshing = 'false';
                    btn.disabled = false;
                    window.location.reload();
                }, 650);
            } catch (err) {
                console.error('Station refresh error', err);
                btn.dataset.refreshing = 'false';
                btn.disabled = false;
            }
        });
        if (addBtn) {
            addBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openAddStationModal();
            });
        }

        const deleteBtn = document.getElementById('station-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openDeleteStationModal();
            });
        }

        const addClose = document.getElementById('station-add-close');
        const addCancel = document.getElementById('station-add-cancel');
        const addSave = document.getElementById('station-add-save');
        const addModal = document.getElementById('station-add-modal');
        const addForm = document.getElementById('station-add-form');
        if (addClose) addClose.addEventListener('click', closeAddStationModal);
        if (addCancel) addCancel.addEventListener('click', closeAddStationModal);
        if (addSave) addSave.addEventListener('click', function(e){ e.preventDefault(); submitAddStation(); });
        if (addForm) addForm.addEventListener('submit', function(e){ e.preventDefault(); submitAddStation(); });
        if (addModal) addModal.addEventListener('click', function(e){ if (e.target === this) closeAddStationModal(); });

        const deleteClose = document.getElementById('station-delete-close');
        const deleteCancel = document.getElementById('station-delete-cancel');
        const deleteConfirm = document.getElementById('station-delete-confirm');
        const deleteModal = document.getElementById('station-delete-modal');
        const deleteForm = document.getElementById('station-delete-form');
        if (deleteClose) deleteClose.addEventListener('click', closeDeleteStationModal);
        if (deleteCancel) deleteCancel.addEventListener('click', closeDeleteStationModal);
        if (deleteConfirm) deleteConfirm.addEventListener('click', function(e){ e.preventDefault(); submitDeleteStation(); });
        if (deleteForm) deleteForm.addEventListener('submit', function(e){ e.preventDefault(); submitDeleteStation(); });
        if (deleteModal) deleteModal.addEventListener('click', function(e){ if (e.target === this) closeDeleteStationModal(); });
    }
    function attachRowHandlers() {
        const assignBtns = document.querySelectorAll('.btn-small[data-assign-id]');
        assignBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const stationId = this.dataset.assignId;
                const stationName = this.dataset.assignName;
                const fillLevel = this.dataset.assignFill;
                openCollectorModal(stationId, stationName, fillLevel);
            });
        });
        const mapLinks = document.querySelectorAll('.view-map');
        mapLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const stationName = this.dataset.stationName;
                if (stationName) {
                    // Open Google Maps with the station name as the search query
                    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(stationName)}`;
                    window.open(mapsUrl, '_blank');
                }
            });
        });
        const emptyLinks = document.querySelectorAll('.empty-bin-link');
        emptyLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const stationId = this.dataset.stationId || '';
                if (!stationId) return;
                const normalizedId = String(stationId).replace(/^#/, '');

                window.dashboardAPI.emptyStationBin(normalizedId).then(resp => {
                    if (!resp || !resp.success) {
                        alert('Failed to empty bin: ' + (resp?.message || 'Unknown error'));
                        return;
                    }

                    const applyUpdate = (row) => {
                        row.fill = 0;
                        row.status = 'good';
                    };

                    stationData.forEach(row => {
                        const rowId = String(row.id || '').replace(/^#/, '');
                        if (rowId === normalizedId) applyUpdate(row);
                    });
                    filteredData.forEach(row => {
                        const rowId = String(row.id || '').replace(/^#/, '');
                        if (rowId === normalizedId) applyUpdate(row);
                    });

                    renderStationTable(currentPage);
                }).catch(err => {
                    console.error('Empty bin failed:', err);
                    alert('Failed to empty bin. Please try again.');
                });
            });
        });
    }
    function openCollectorModal(stationId, stationName, fillLevel) {
        selectedStationForAssignment = { id: stationId, name: stationName, fill: fillLevel };
        selectedCollector = null;
        const modal = document.getElementById('collector-modal');
        const stationNameEl = document.getElementById('modal-station-name');
        const stationIdEl = document.getElementById('modal-station-id');
        const fillLevelEl = document.getElementById('modal-fill-level');
        const collectorsList = document.getElementById('collectors-list');
        if (!modal) return;
        // Update modal info
        if (stationNameEl) stationNameEl.textContent = escapeHtml(stationName);
        if (stationIdEl) stationIdEl.textContent = escapeHtml(stationId);
        if (fillLevelEl) fillLevelEl.textContent = fillLevel + '%';
        // Fetch available collectors from backend
        window.dashboardAPI.getCollectors().then(resp => {
            if (resp && resp.success && resp.data && collectorsList) {
                collectorsList.innerHTML = '';
                const collectors = sortCollectorsByOptimizationMode(resp.data, stationName || '');
                collectors.forEach((col, idx) => {
                    const label = document.createElement('label');
                    label.className = 'collector-option';
                    
                    // Generate avatar with initials
                    const namesParts = col.name.split(' ');
                    const initials = (namesParts[0]?.charAt(0) + (namesParts[namesParts.length - 1]?.charAt(0) || '')).toUpperCase();
                    const colors = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9'];
                    const avatarColor = colors[idx % colors.length];
                    
                    label.innerHTML = `
                        <input type="radio" name="collector" value="${col.id}" ${idx === 0 ? 'checked' : ''}>
                        <div class="collector-avatar" style="background: linear-gradient(135deg, ${avatarColor}, ${avatarColor}88);">${initials}</div>
                        <div class="collector-info">
                            <div class="collector-name">${escapeHtml(col.name)}</div>
                            <div class="collector-details">${escapeHtml(col.phone)} • ${col.status === 'available' ? '✓ Available' : '⏳ On Trip'}</div>
                        </div>
                    `;
                    label.addEventListener('change', function() {
                        if (this.querySelector('input:checked')) {
                            document.querySelectorAll('.collector-option').forEach(opt => opt.classList.remove('selected'));
                            this.classList.add('selected');
                            selectedCollector = col;
                        }
                    });
                    collectorsList.appendChild(label);
                });
                // Select first by default
                if (collectors.length > 0) {
                    document.querySelector('.collector-option').classList.add('selected');
                    selectedCollector = collectors[0];
                }
            } else {
                console.error('Failed to load collectors:', resp);
            }
        }).catch(err => {
            console.error('Error loading collectors:', err);
        });
        // Show modal
        modal.classList.add('show');
    }
    function closeCollectorModal() {
        const modal = document.getElementById('collector-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        selectedStationForAssignment = null;
        selectedCollector = null;
    }
    function openAddStationModal() {
        const modal = document.getElementById('station-add-modal');
        if (!modal) return;
        resetAddStationForm();
        prefillAddStationForm();
        modal.classList.add('show');
        const first = document.getElementById('station-add-id');
        if (first) first.focus();
    }
    function closeAddStationModal() {
        const modal = document.getElementById('station-add-modal');
        if (modal) modal.classList.remove('show');
    }
    function resetAddStationForm() {
        const form = document.getElementById('station-add-form');
        if (form) form.reset();
    }

    function openDeleteStationModal() {
        const modal = document.getElementById('station-delete-modal');
        if (!modal) return;
        const confirmBtn = document.getElementById('station-delete-confirm');
        if (confirmBtn) confirmBtn.disabled = true;
        // Ensure we have the latest station list for the dropdown
        const ensure = (stationData && stationData.length) ? Promise.resolve() : reloadStations();
        ensure.then(() => {
            populateDeleteStationSelect();
        }).catch(() => {
            populateDeleteStationSelect();
        });
        modal.classList.add('show');
        const sel = document.getElementById('station-delete-select');
        if (sel) sel.focus();
    }

    function closeDeleteStationModal() {
        const modal = document.getElementById('station-delete-modal');
        if (modal) modal.classList.remove('show');
    }

    function populateDeleteStationSelect() {
        const select = document.getElementById('station-delete-select');
        const confirmBtn = document.getElementById('station-delete-confirm');
        if (!select) return;

        const rows = (stationData || []).slice();
        rows.sort((a, b) => String(a?.id || '').localeCompare(String(b?.id || ''), undefined, { numeric: true, sensitivity: 'base' }));

        select.innerHTML = '';

        if (!rows.length) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'No stations available';
            opt.disabled = true;
            opt.selected = true;
            select.appendChild(opt);
            if (confirmBtn) confirmBtn.disabled = true;
            return;
        }

        rows.forEach(r => {
            const id = String(r?.id || '').trim();
            const name = String(r?.name || '').trim();
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = name ? `${id} - ${name}` : id;
            select.appendChild(opt);
        });
        if (confirmBtn) confirmBtn.disabled = false;
    }

    function submitDeleteStation() {
        const select = document.getElementById('station-delete-select');
        const confirmBtn = document.getElementById('station-delete-confirm');
        const raw = (select?.value || '').trim();
        const cleanId = raw.replace(/^#/, '').trim();
        if (!cleanId) {
            alert('Please select a station to delete.');
            return;
        }

        const ok = window.confirm(`Are you sure you want to delete station ${cleanId}?`);
        if (!ok) return;

        if (confirmBtn) confirmBtn.disabled = true;
        window.dashboardAPI.deleteStation(cleanId).then(resp => {
            if (!resp || !resp.success) {
                alert('Failed to delete station: ' + (resp?.message || 'Unknown error'));
                if (confirmBtn) confirmBtn.disabled = false;
                return;
            }
            closeDeleteStationModal();
            reloadStations().then(() => {
                // Keep the modal list up to date if user opens it again
                if (confirmBtn) confirmBtn.disabled = false;
            });
        }).catch(err => {
            console.error('Delete station failed:', err);
            alert('Failed to delete station. Please try again.');
            if (confirmBtn) confirmBtn.disabled = false;
        });
    }

    function getMaxStationNumber() {
        let maxNum = 0;
        (stationData || []).forEach(row => {
            const raw = String(row?.id || '').replace(/^#/, '').trim();
            const match = raw.match(/S\s*[-_]?\s*(\d+)/i);
            if (!match) return;
            const num = parseInt(match[1], 10);
            if (Number.isFinite(num) && num > maxNum) maxNum = num;
        });
        return maxNum;
    }

    function prefillAddStationForm() {
        const idInput = document.getElementById('station-add-id');
        const adminInput = document.getElementById('station-add-admin');
        if (idInput && !String(idInput.value || '').trim()) {
            const nextNum = getMaxStationNumber() + 1;
            const padded = String(nextNum).padStart(3, '0');
            idInput.value = `S-${padded}`;
        }
        if (adminInput && !String(adminInput.value || '').trim()) {
            try {
                const adminId = (localStorage.getItem('kolek_admin') || '').trim();
                if (adminId) adminInput.value = adminId;
            } catch (e) { /* ignore */ }
        }
    }
    function submitAddStation() {
        const idInput = document.getElementById('station-add-id');
        const nameInput = document.getElementById('station-add-name');
        const locationInput = document.getElementById('station-add-location');
        const fillInput = document.getElementById('station-add-fill');
        const statusSelect = document.getElementById('station-add-status');
        const hoursInput = document.getElementById('station-add-hours');
        const adminInput = document.getElementById('station-add-admin');

        // Recompute and enforce Station ID and Admin ID here to prevent manual edits
        const forcedStationId = (function(){
            const nextNum = getMaxStationNumber() + 1;
            return `S-${String(nextNum).padStart(3, '0')}`;
        })();
        const forcedAdminId = (function(){
            try { return (localStorage.getItem('kolek_admin') || '').trim(); } catch(e){ return ''; }
        })();

        // keep inputs in sync (in case the DOM value was tampered with)
        if (idInput) idInput.value = forcedStationId;
        if (adminInput) adminInput.value = forcedAdminId;

        const stationId = forcedStationId;
        const stationName = (nameInput?.value || '').trim();
        const stationLocation = (locationInput?.value || '').trim();
        const fillRaw = (fillInput?.value || '').trim();
        const status = (statusSelect?.value || '').trim();
        const operationHour = (hoursInput?.value || '').trim();
        const adminId = forcedAdminId;

        if (!stationId || !stationName || !stationLocation || fillRaw === '' || !status || !operationHour || !adminId) {
            alert('Please fill in all station fields.');
            return;
        }

        const fillLevel = Number(fillRaw);
        if (!Number.isFinite(fillLevel) || fillLevel < 0 || fillLevel > 100) {
            alert('Fill level must be a number between 0 and 100.');
            return;
        }

        const payload = {
            stationId,
            stationName,
            stationLocation,
            fillLevel,
            status,
            operationHour,
            adminId
        };

        window.dashboardAPI.addStation(payload).then(resp => {
            if (!resp || !resp.success) {
                alert('Failed to add station: ' + (resp?.message || 'Unknown error'));
                return;
            }
            closeAddStationModal();
            reloadStations();
        }).catch(err => {
            console.error('Add station failed:', err);
            alert('Failed to add station. Please try again.');
        });
    }
    function assignCollector() {
        if (!selectedStationForAssignment || !selectedCollector) {
            alert('Please select a collector');
            return;
        }
        // Call backend API to assign collector
        window.dashboardAPI.assignCollector(
            selectedStationForAssignment.id,
            selectedCollector.id
        ).then(resp => {
            if (resp && resp.success) {
                console.log('Assignment successful:', resp);
                alert(`Collector ${selectedCollector.name} has been assigned to ${selectedStationForAssignment.name}`);
                closeCollectorModal();
                // Refresh station table to reflect changes
                renderStationTable(currentPage);
            } else {
                console.error('Assignment failed:', resp);
                alert('Failed to assign collector: ' + (resp?.message || 'Unknown error'));
            }
        }).catch(err => {
            console.error('Assignment error:', err);
            alert('Error assigning collector (see console)');
        });
    }
    // Initialize when DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('station-content')) {
            initStations();
        }
        // Collector page interactions: load collectors from database (fallback to CSV)
        if (document.getElementById('collector-content')) {
            const loader = (typeof loadCollectorFromDatabase === 'function')
                ? loadCollectorFromDatabase
                : loadCollectorFromCSV;
            loader()
                .then(() => { setupCollectorInteractions(); setupCollectorPagination(); applyCollectorFilters(); })
                .catch(err => {
                    console.error('Collector load error', err);
                    setupCollectorInteractions();
                });

            if (!collectorAutoRefreshId && typeof loadCollectorFromDatabase === 'function') {
                collectorAutoRefreshId = setInterval(() => {
                    const collectorSection = document.getElementById('collector-content');
                    const isVisible = collectorSection && collectorSection.style.display !== 'none';
                    if (isVisible) {
                        loadCollectorFromDatabase().catch(err => console.error('Collector auto-refresh error', err));
                    }
                }, 30000);
            }
        }
        if (document.getElementById('collection-content')) {
            loadCollectionFromDatabase()
                .then(function() { setupCollectionInteractions(); setupCollectionPagination(); })
                .catch(function(err) { console.error('Collection load error', err); setupCollectionInteractions(); });
        }
        if (document.getElementById('household-content')) {
            // Load household data from CSV file, then setup interactions
            loadHouseholdFromCSV().then(() => { setupHouseholdInteractions(); setupHouseholdPagination(); applyHouseholdFilters(); });
        }
        if (document.getElementById('applicant-content')) {
            if (typeof loadApplicationFromDatabase === 'function') {
                loadApplicationFromDatabase()
                    .then(() => setupApplicantInteractions())
                    .catch(err => {
                        console.error('Application load error', err);
                        setupApplicantInteractions();
                    });
            } else {
                loadApplicationFromCSV()
                    .then(() => setupApplicantInteractions())
                    .catch(err => {
                        console.error('Application load error', err);
                        setupApplicantInteractions();
                    });
            }
        }
        if (document.getElementById('report-content')) {
            setupReportInteractions();
            if (typeof loadReportFromDatabase === 'function') {
                loadReportFromDatabase()
                    .then(() => applyReportRowFilters())
                    .catch(err => console.error('Report load error', err));
            }
        }
        if (document.getElementById('profile-content')) {
            setupProfileInteractions();
        }
        if (document.getElementById('ai-assist-content')) {
            setupAIAssist();
            // show admin name if present
            try { const admin = localStorage.getItem('kolek_admin'); if (admin) { const el = document.querySelector('.ai-name'); if (el) el.textContent = admin; } } catch(e){}
        }
        // Modal controls
        const modalCloseBtn = document.getElementById('modal-close');
        const modalCancelBtn = document.getElementById('modal-cancel');
        const modalAssignBtn = document.getElementById('modal-assign');
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCollectorModal);
        if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeCollectorModal);
        if (modalAssignBtn) modalAssignBtn.addEventListener('click', assignCollector);
        // Close modal on background click
        const modal = document.getElementById('collector-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeCollectorModal();
                }
            });
        }
        // Pending Collection Modal controls
        const pendingCloseBtn = document.getElementById('pending-collection-close');
        const pendingDoneBtn = document.getElementById('pending-done');
        if (pendingCloseBtn) pendingCloseBtn.addEventListener('click', closePendingCollectionModal);
        if (pendingDoneBtn) pendingDoneBtn.addEventListener('click', closePendingCollectionModal);
        const pendingModal = document.getElementById('pending-collection-modal');
        if (pendingModal) {
            pendingModal.addEventListener('click', function(e) {
                if (e.target === this) closePendingCollectionModal();
            });
        }
    });
    // Helper functions
    function statusText(key) {
        if (key === 'danger') return 'Full Bin';
        if (key === 'warning') return 'Nearly Full';
        return 'Good Condition';
    }
    function escapeHtml(s) {
        if (!s) return '';
        return s.replace(/[&<>"']/g, function(m) {
            return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[m];
        });
    }
    function escapeAttr(s) {
        if (!s) return '';
        return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    // Expose for debugging
    window._station = { render: renderStationTable, data: stationData };
})();

function normalizeStatusText(value) {
    return String(value || '').toLowerCase();
}

function pickCollectionField(row, candidates, fallback = '') {
    if (!row) return fallback;
    for (const key of candidates) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
    }
    return fallback;
}

function getPendingCollections(filter = {}) {
    const stationId = filter.stationId ? String(filter.stationId).toLowerCase() : '';
    return (collectionFullData || []).filter(d => {
        const status = normalizeStatusText(pickCollectionField(d, ['collectionStatus', 'status', 'collection_status'], ''));
        if (!status.includes('pending')) return false;
        if (!stationId) return true;
        const sid = String(pickCollectionField(d, ['stationID', 'stationId', 'station_id'], '')).toLowerCase();
        return sid === stationId;
    });
}

function updatePendingBadgeCount() {
    const badgeCount = document.querySelector('#collection-pending .pending-count');
    if (!badgeCount) return;
    const pendingCount = getPendingCollections().length;
    badgeCount.textContent = String(pendingCount);
}

function updateCollectionAssignmentLocal(collectionId, collectorId) {
    const targetId = String(collectionId || '').trim();
    if (!targetId) return;

    const applyUpdate = (row) => {
        row.collectorID = collectorId;
        row.collectorId = collectorId;
        row.collector_id = collectorId;
        row.collectionStatus = 'Assigned';
        row.status = 'Assigned';
        row.collection_status = 'Assigned';
    };

    (collectionFullData || []).forEach(row => {
        const rowId = String(pickCollectionField(row, ['collectionID', 'collectionId', 'collection_id', 'id'], '')).trim();
        if (!rowId) return;
        if (rowId === targetId || `#${rowId}` === targetId || rowId === `#${targetId}`) {
            applyUpdate(row);
        }
    });

    (collectionFilteredData || []).forEach(row => {
        const rowId = String(pickCollectionField(row, ['collectionID', 'collectionId', 'collection_id', 'id'], '')).trim();
        if (!rowId) return;
        if (rowId === targetId || `#${rowId}` === targetId || rowId === `#${targetId}`) {
            applyUpdate(row);
        }
    });

    updatePendingBadgeCount();
    applyCollectionFilters();
}
    // Collection refresh button: reload page and return to collection tab
    const collectionRefresh = document.getElementById('collection-refresh');
    if (collectionRefresh) collectionRefresh.addEventListener('click', function(e) {
        e.preventDefault();
        const btn = this;
        if (btn.disabled || btn.dataset.refreshing === 'true') return;
        btn.dataset.refreshing = 'true';
        btn.disabled = true;
        try {
            btn.style.transform = 'rotate(0deg)';
            btn.style.transition = 'transform 0.6s ease';
            setTimeout(() => { btn.style.transform = 'rotate(360deg)'; }, 10);
            const table = document.querySelector('.collection-table');
            if (table) {
                table.style.transition = 'box-shadow 0.25s ease, transform 0.25s ease';
                table.style.transform = 'translateY(-4px)';
                table.style.boxShadow = '0 12px 34px rgba(0,0,0,0.08)';
                setTimeout(() => { table.style.transform = ''; table.style.boxShadow = ''; }, 400);
            }
            setTimeout(() => {
                try { localStorage.setItem('kolek_active_page', 'collection'); } catch (e) {}
                btn.dataset.refreshing = 'false';
                btn.disabled = false;
                window.location.reload();
            }, 650);
        } catch (err) {
            console.error('Collection refresh error', err);
            btn.dataset.refreshing = 'false';
            btn.disabled = false;
        }
    });

let _pendingCollectorsCache = null;

// Helper function to extract city/area from an address
// E.g., "Station 052, Jalan SS15/8, Subang Jaya, Selangor" -> "Subang Jaya"
// E.g., "Station 014, Jalan SS2/72, Petaling Jaya, Selangor" -> "Petaling Jaya"
// E.g., "2, Jalan SS15, Subang Jaya" -> "Subang Jaya"
// Malaysian address format variations:
// 4+ parts: [Station/Building, Street, City, State] - take second-to-last
// 3 parts: [Number/Building, Street, City] - take last
// 2 parts: [Building, City/State] - take last
function extractCityFromAddress(address) {
    if (!address) return '';
    const parts = String(address).split(',').map(p => p.trim());
    if (parts.length === 0) return '';
    
    // For 4+ parts, take second-to-last (city before state)
    // For less than 4 parts, take last part (which is city)
    if (parts.length >= 4) {
        return parts[parts.length - 2].toLowerCase();
    }
    // Fallback for 2-3 part addresses: use the last part
    return parts[parts.length - 1].toLowerCase();
}

function normalizeCityKey(city) {
    return String(city || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function formatCityLabel(cityKey) {
    return String(cityKey || '')
        .split(' ')
        .map(word => (word ? word[0].toUpperCase() + word.slice(1) : ''))
        .join(' ');
}

function buildAreaColors(count) {
    const base = ['#4CAF50', '#7CB342', '#9CCC65', '#C5E1A5', '#81C784', '#66BB6A', '#43A047'];
    if (count <= base.length) return base.slice(0, count);
    const colors = base.slice();
    for (let i = base.length; i < count; i += 1) {
        const hue = (120 + (i * 28)) % 360;
        colors.push(`hsl(${hue}, 45%, 55%)`);
    }
    return colors;
}

function buildAreaChartDataFromCollections(rows) {
    const counts = new Map();
    (rows || []).forEach(row => {
        const status = normalizeStatusText(pickCollectionField(row, ['collectionStatus', 'status', 'collection_status'], ''));
        if (!status.includes('completed')) return;
        const address = pickCollectionField(row, ['collectionAddress', 'address', 'location'], '');
        const city = normalizeCityKey(extractCityFromAddress(address));
        if (!city) return;
        counts.set(city, (counts.get(city) || 0) + 1);
    });

    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return {
        labels: entries.map(([city]) => formatCityLabel(city)),
        values: entries.map(([, count]) => count)
    };
}

function renderAreaLegend(labels, colors) {
    const legend = document.querySelector('.pie-legend');
    if (!legend) return;
    if (!labels.length) {
        legend.innerHTML = '';
        return;
    }
    legend.innerHTML = labels.map((label, idx) => {
        const color = colors[idx] || '#4CAF50';
        return `
            <div class="legend-item">
                <span class="legend-color" style="background-color: ${color};"></span>
                <span>${label}</span>
            </div>
        `;
    }).join('');
}

function refreshAreaChartFromCollections() {
    if (!window.areaChart) return;
    const areaData = buildAreaChartDataFromCollections(collectionFullData || []);
    const colors = buildAreaColors(areaData.labels.length);

    window.areaChart.data.labels = areaData.labels;
    window.areaChart.data.datasets[0].data = areaData.values;
    window.areaChart.data.datasets[0].backgroundColor = colors;
    window.areaChart.update();

    renderAreaLegend(areaData.labels, colors);
}

// Get collectors for a specific location (filters by preferred collection area)
const ROUTE_OPTIMIZATION_MODE_KEY = 'settings:routeOptimizationMode';
const ROUTE_OPTIMIZATION_MODES = ['distance', 'balanced', 'availability'];

function normalizeRouteOptimizationMode(mode) {
    const raw = String(mode || '').toLowerCase();
    return ROUTE_OPTIMIZATION_MODES.includes(raw) ? raw : 'distance';
}

function getStoredRouteOptimizationMode() {
    try {
        return normalizeRouteOptimizationMode(localStorage.getItem(ROUTE_OPTIMIZATION_MODE_KEY));
    } catch (e) {
        return 'distance';
    }
}

function setStoredRouteOptimizationMode(mode) {
    const normalized = normalizeRouteOptimizationMode(mode);
    try {
        localStorage.setItem(ROUTE_OPTIMIZATION_MODE_KEY, normalized);
    } catch (e) { /* ignore */ }
    return normalized;
}

function getRouteOptimizationModeLabel(mode) {
    const normalized = normalizeRouteOptimizationMode(mode);
    if (normalized === 'balanced') return 'Balanced Workload';
    if (normalized === 'availability') return 'Availability First';
    return 'Distance Priority';
}

function isCollectorActiveForRouting(collector) {
    const status = String(collector?.accountStatus || collector?.accountstatus || collector?.status || '').toLowerCase();
    return !status.includes('inactive') && !status.includes('deactiv');
}

function isCollectorAvailableForRouting(collector) {
    const status = String(collector?.status || collector?.availability || collector?.accountStatus || '').toLowerCase();
    if (!status) return true;
    if (status.includes('on-trip') || status.includes('on trip') || status.includes('busy') || status.includes('unavailable')) return false;
    return true;
}

function isCollectorAreaMatch(collector, location) {
    const targetCity = extractCityFromAddress(location);
    if (!targetCity) return false;
    const collectorArea = String(collector?.preferredCollectionArea || collector?.preferredArea || '').toLowerCase();
    if (!collectorArea) return false;
    return collectorArea.includes(targetCity) || targetCity.includes(collectorArea);
}

function getCollectorActiveLoadCount(collector) {
    const collectorId = String(collector?.collectorID || collector?.collectorId || collector?.id || '').trim();
    if (!collectorId || !Array.isArray(collectionFullData)) return 0;

    let load = 0;
    collectionFullData.forEach(row => {
        const assignedCollectorId = String(pickCollectionField(row, ['collectorID', 'collectorId', 'collector_id'], '')).trim();
        if (assignedCollectorId !== collectorId) return;
        const status = normalizeStatusText(pickCollectionField(row, ['collectionStatus', 'status', 'collection_status'], ''));
        const done = status.includes('completed') || status.includes('done') || status.includes('resolved');
        if (!done) load += 1;
    });
    return load;
}

function sortCollectorsByOptimizationMode(collectors, location) {
    const mode = getStoredRouteOptimizationMode();
    const list = Array.isArray(collectors) ? collectors.slice() : [];

    return list.sort((a, b) => {
        const aActive = isCollectorActiveForRouting(a) ? 0 : 1;
        const bActive = isCollectorActiveForRouting(b) ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;

        const aArea = isCollectorAreaMatch(a, location) ? 0 : 1;
        const bArea = isCollectorAreaMatch(b, location) ? 0 : 1;
        const aAvailable = isCollectorAvailableForRouting(a) ? 0 : 1;
        const bAvailable = isCollectorAvailableForRouting(b) ? 0 : 1;
        const aLoad = getCollectorActiveLoadCount(a);
        const bLoad = getCollectorActiveLoadCount(b);

        if (mode === 'balanced') {
            if (aLoad !== bLoad) return aLoad - bLoad;
            if (aArea !== bArea) return aArea - bArea;
            if (aAvailable !== bAvailable) return aAvailable - bAvailable;
        } else if (mode === 'availability') {
            if (aAvailable !== bAvailable) return aAvailable - bAvailable;
            if (aArea !== bArea) return aArea - bArea;
            if (aLoad !== bLoad) return aLoad - bLoad;
        } else {
            if (aArea !== bArea) return aArea - bArea;
            if (aAvailable !== bAvailable) return aAvailable - bAvailable;
            if (aLoad !== bLoad) return aLoad - bLoad;
        }

        const aName = String(a?.collectorName || a?.name || '');
        const bName = String(b?.collectorName || b?.name || '');
        return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
    });
}

// Get collectors for a specific location (filters by preferred collection area)
function getCollectorsForLocation(location) {
    const targetCity = extractCityFromAddress(location);
    const activeCollectors = (collectorFullData || []).filter(isCollectorActiveForRouting);

    if (!targetCity) {
        // If no location provided, return all active collectors sorted by optimization mode
        return sortCollectorsByOptimizationMode(activeCollectors, location || '');
    }

    const matchingCollectors = activeCollectors.filter(c => isCollectorAreaMatch(c, location));

    // If matching collectors found, return them; otherwise return all active collectors as fallback
    const routingCandidates = matchingCollectors.length > 0 ? matchingCollectors : activeCollectors;
    return sortCollectorsByOptimizationMode(routingCandidates, location || '');
}

function loadPendingCollectors() {
    if (_pendingCollectorsCache) return Promise.resolve(_pendingCollectorsCache);
    if (!window.dashboardAPI || typeof window.dashboardAPI.getCollectors !== 'function') {
        _pendingCollectorsCache = [];
        return Promise.resolve(_pendingCollectorsCache);
    }
    return window.dashboardAPI.getCollectors().then(resp => {
        _pendingCollectorsCache = (resp && resp.success && Array.isArray(resp.data)) ? resp.data : [];
        return _pendingCollectorsCache;
    }).catch(() => {
        _pendingCollectorsCache = [];
        return _pendingCollectorsCache;
    });
}

function setupFilterDropdown(button, select, onApply) {
    if (!button || !select) return;
    if (!select.dataset._dropdownInit) {
        select.dataset._dropdownInit = '1';
        select.style.display = 'none';
        select.addEventListener('change', () => {
            if (onApply) onApply();
            select.style.display = 'none';
        });
        select.addEventListener('blur', () => {
            setTimeout(() => { select.style.display = 'none'; }, 120);
        });
    }
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const isVisible = select.style.display !== 'none';
        select.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) select.focus();
    });
}

function applyCollectorFilters() {
    const q = collectorSearchQuery.trim().toLowerCase();
    collectorFilteredData = collectorFullData.filter(d => {
        const status = normalizeStatusText(d.accountStatus || d.accountstatus || d.status);
        const isInactive = status.includes('inactive') || status.includes('deactiv');
        const isActive = status.includes('active') && !isInactive;
        const statusMatch = collectorStatusFilter === 'all'
            ? true
            : collectorStatusFilter === 'active'
                ? isActive
                : isInactive;
        const textMatch = !q || Object.values(d || {}).some(v => String(v || '').toLowerCase().includes(q));
        return statusMatch && textMatch;
    });
    collectorCurrentPage = 1;
    renderCollectorPage(1);
}

function applyHouseholdFilters() {
    const q = householdSearchQuery.trim().toLowerCase();
    householdFilteredData = householdFullData.filter(d => {
        const status = normalizeStatusText(d.accountStatus || d.accountstatus || d.account_status || d.status);
        const isInactive = /inactive|deactiv|not\s*active/.test(status);
        const isActive = /^active\b/.test(status);
        const statusMatch = householdStatusFilter === 'all'
            ? true
            : householdStatusFilter === 'active'
                ? isActive
                : isInactive;
        const textMatch = !q || Object.values(d || {}).some(v => String(v || '').toLowerCase().includes(q));
        return statusMatch && textMatch;
    });
    householdCurrentPage = 1;
    renderHouseholdPage(1);
}

async function updateCollectorStatusInDatabase(collectorId, status) {
    const adminId = localStorage.getItem('kolek_admin') || '';
    const resp = await fetch(`/api/collector/${encodeURIComponent(collectorId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminId })
    });
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update collector status');
    }
    return resp.json();
}

async function approveApplicationInDatabase(applicationId, adminId) {
    const resp = await fetch(`/api/application/${encodeURIComponent(applicationId)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
    });
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to approve application');
    }
    return resp.json();
}

async function rejectApplicationInDatabase(applicationId, adminId) {
    const resp = await fetch(`/api/application/${encodeURIComponent(applicationId)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
    });
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to reject application');
    }
    return resp.json();
}

async function updateHouseholdStatusInDatabase(householdId, status) {
    const adminId = localStorage.getItem('kolek_admin') || '';
    const resp = await fetch(`/api/household/${encodeURIComponent(householdId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminId })
    });
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update household status');
    }
    return resp.json();
}

function applyCollectionFilters() {
    const q = collectionSearchQuery.trim().toLowerCase();
    collectionFilteredData = collectionFullData.filter(d => {
        const status = normalizeStatusText(pickCollectionField(d, ['collectionStatus', 'status', 'collection_status'], ''));
        const statusMatch = collectionStatusFilter === 'all'
            ? true
            : status.includes(collectionStatusFilter);
        const textMatch = !q || Object.values(d || {}).some(v => String(v || '').toLowerCase().includes(q));
        
        // Date range filtering
        let dateMatch = true;
        if (collectionDateFilterStart || collectionDateFilterEnd) {
            const collectionDate = pickCollectionField(d, ['collectionDate', 'date', 'collection_date'], '');
            if (collectionDate) {
                const date = new Date(collectionDate);
                if (collectionDateFilterStart) {
                    const startDate = new Date(collectionDateFilterStart);
                    startDate.setHours(0, 0, 0, 0);
                    if (date < startDate) dateMatch = false;
                }
                if (collectionDateFilterEnd && dateMatch) {
                    const endDate = new Date(collectionDateFilterEnd);
                    endDate.setHours(23, 59, 59, 999);
                    if (date > endDate) dateMatch = false;
                }
            }
        }
        
        return statusMatch && textMatch && dateMatch;
    });
    collectionCurrentPage = 1;
    renderCollectionPage(1);
}

function applyApplicantFilters() {
    const q = applicantSearchQuery.trim().toLowerCase();
    applicantFilteredData = applicantFullData.filter(d => {
        const statusRaw = d.applicationStatus || d.status || d.applicationstatus || '';
        const status = normalizeStatusText(statusRaw);
        const statusMatch = applicantStatusFilter === 'all'
            ? true
            : applicantStatusFilter === 'approved'
                ? status.includes('approve')
                : applicantStatusFilter === 'rejected'
                    ? status.includes('reject')
                    : status.includes('pending');
        const textMatch = !q || Object.values(d || {}).some(v => String(v || '').toLowerCase().includes(q));
        return statusMatch && textMatch;
    });
    renderApplicantTableFromData(applicantFilteredData);
}

function applyReportRowFilters() {
    const tbody = document.querySelector('.report-table tbody');
    if (!tbody) return;
    const q = reportSearchQuery.trim().toLowerCase();
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach(tr => {
        const text = tr.textContent.toLowerCase();
        const statusCell = tr.querySelector('td:nth-child(5)');
        const status = normalizeStatusText(statusCell ? statusCell.textContent : '');
        const statusMatch = reportStatusFilter === 'all'
            ? true
            : reportStatusFilter === 'pending'
                ? status.includes('pending')
                : (status.includes('reviewed') || status.includes('resolved'));
        const textMatch = !q || text.includes(q);
        tr.style.display = (statusMatch && textMatch) ? '' : 'none';
    });
}
function setupCollectorInteractions() {
    const search = document.getElementById('collector-search');
    const table = document.querySelector('.collector-table tbody');
    // Prefer the filter select inside the visible collector panel to avoid
    // collisions with similarly-named controls elsewhere on the page.
    const filterSelect = document.querySelector('#collector-content #collector-filter-select') || document.getElementById('collector-filter-select');
    if (search && table) {
        search.addEventListener('input', function() {
            collectorSearchQuery = this.value || '';
            applyCollectorFilters();
        });
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            collectorStatusFilter = this.value || 'all';
            applyCollectorFilters();
        });
        filterSelect.value = collectorStatusFilter || 'all';
    }

    // small control actions
    const addBtn = document.getElementById('add-collector');
    if (addBtn) addBtn.addEventListener('click', e => {
        e.preventDefault();
        const btn = e.currentTarget;
        if (btn.disabled || btn.dataset.refreshing === 'true') return;
        btn.dataset.refreshing = 'true';
        btn.disabled = true;
        try {
            // animate rotate
            btn.style.transform = 'rotate(0deg)';
            btn.style.transition = 'transform 0.6s ease';
            setTimeout(() => { btn.style.transform = 'rotate(360deg)'; }, 10);
            const table = document.querySelector('.collector-table');
            if (table) {
                table.style.transition = 'box-shadow 0.25s ease, transform 0.25s ease';
                table.style.transform = 'translateY(-4px)';
                table.style.boxShadow = '0 12px 34px rgba(0,0,0,0.08)';
                setTimeout(() => { table.style.transform = ''; table.style.boxShadow = ''; }, 400);
            }
            setTimeout(() => {
                try { localStorage.setItem('kolek_active_page', 'collector'); } catch (e) {}
                btn.dataset.refreshing = 'false';
                btn.disabled = false;
                window.location.reload();
            }, 650);
        } catch (err) {
            console.error('Collector refresh error', err);
            btn.dataset.refreshing = 'false';
            btn.disabled = false;
        }
    });
    const exportBtn = document.getElementById('collector-export');
    if (exportBtn) exportBtn.addEventListener('click', e => {
        e.preventDefault();
        try {
            const rows = Array.from(document.querySelectorAll('.collector-table tbody tr')).filter(r => r.style.display !== 'none');
            const header = ['Collector ID','Collector Name','Phone Number','Email Address','Date of Birth','Vehicle Type','Plate No.','Preferred Area','Availability','Status'];
            const dataRows = rows.map(r => {
                const cells = Array.from(r.querySelectorAll('td'));
                return cells.slice(0, 9).map(c => c.textContent.trim());
            });
            window.dashboardAPI.exportCollectors({ count: rows.length }).then(resp => {
                exportTableData('collectors_export', header, dataRows);
            }).catch(err => { console.error('Export collectors failed:', err); alert('Export failed — see console'); });
        } catch(err) { console.error('Export collectors handler error', err); alert('Export failed (client error)'); }
    });

    if (table) {
        table.addEventListener('click', async (e) => {
            const btn = e.target.closest('.collector-toggle-status');
            if (!btn) return;
            e.preventDefault();
            const collectorId = btn.dataset.collectorId || '';
            const targetStatus = btn.dataset.targetStatus || '';
            if (!collectorId || !targetStatus) return;

            try {
                await updateCollectorStatusInDatabase(collectorId, targetStatus);
                const row = collectorFullData.find(d => {
                    const id = d.collectorID || d.collectorId || d.id || d.ID || '';
                    return String(id) === String(collectorId);
                });
                if (row) row.accountStatus = targetStatus;
                applyCollectorFilters();
            } catch (err) {
                console.error('Collector status update failed:', err);
                alert(err.message || 'Failed to update collector status');
            }
        });
    }
    const filterBtn = document.querySelector('#collector-content #filter-sort-btn');
    if (filterBtn && filterSelect) {
        setupFilterDropdown(filterBtn, filterSelect, () => {
            collectorStatusFilter = filterSelect.value || 'all';
            applyCollectorFilters();
        });
    } else if (filterBtn) {
        filterBtn.addEventListener('click', e => {
            e.preventDefault();
            const options = ['all', 'active', 'inactive'];
            const labels = { all: 'All', active: 'Active', inactive: 'Inactive' };
            const idx = options.indexOf(collectorStatusFilter);
            collectorStatusFilter = options[(idx + 1) % options.length];
            filterBtn.title = `Filter: ${labels[collectorStatusFilter] || 'All'}`;
            applyCollectorFilters();
        });
        if (!filterBtn.title) {
            filterBtn.title = 'Filter: All';
        }
    }
    // Collector 'View' IC link -> open details modal
    document.querySelectorAll('.collector-table .note').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const row = this.closest('tr');
            if (!row) return;
            const id = (row.querySelector('td') && row.querySelector('td').textContent || '').trim();
            const name = (row.querySelector('td:nth-child(2)') && row.querySelector('td:nth-child(2)').textContent || '').trim();
            openCollectorDetails({ id, name });
        });
    });
    // details modal close and actions
    const detailsClose = document.getElementById('collector-details-close');
    if (detailsClose) detailsClose.addEventListener('click', e => { e.preventDefault(); closeCollectorDetails(); });
    const detailsModal = document.getElementById('collector-details-modal');
    if (detailsModal) {
        detailsModal.addEventListener('click', function(e) {
            if (e.target === this) closeCollectorDetails();
        });
    }
    const addRouteBtn = document.getElementById('add-route-btn');
    if (addRouteBtn) addRouteBtn.addEventListener('click', e => { e.preventDefault(); alert('Add New Route — design-only'); });
    const detailsExport = document.getElementById('details-export');
    if (detailsExport) detailsExport.addEventListener('click', e => { e.preventDefault(); exportCollectorDetailsModalAsPDF(); });
}
// Inline assign dropdown helpers
function closeAssignDropdown() {
    const existing = document.getElementById('assign-dropdown');
    if (existing) existing.remove();
    try { document.removeEventListener('click', _assignDocListener); } catch(e){}
    try { document.removeEventListener('keydown', _assignEscHandler); } catch(e){}
    try { if (_currentAssignAnchor) { _currentAssignAnchor.classList.remove('assign-open'); _currentAssignAnchor = null; } } catch(e){}
}
let _assignDocListener = null;
let _assignEscHandler = null;
let _currentAssignAnchor = null;
function showAssignDropdown(anchorEl, stationMeta = {}){
    closeAssignDropdown();
    const { stationId, stationName, fill } = stationMeta;
    const node = document.createElement('div');
    node.id = 'assign-dropdown';
    node.className = 'assign-dropdown';
    node.innerHTML = `
        <div class="assign-header"><div class="title">Select Collector</div><div class="sub">${escapeHtml(stationName || stationId || '')}</div></div>
        <div class="assign-list"><div class="empty-note">Loading collectors…</div></div>
    `;
    document.body.appendChild(node);
    // mark anchor active so user sees the UI opened
    try { anchorEl.classList.add('assign-open'); _currentAssignAnchor = anchorEl; } catch(e){}
    // position the dropdown near anchor using fixed coords so it sits above other overlays
    const rect = anchorEl.getBoundingClientRect();
    const dropdownWidth = 360;
    const top = rect.bottom + 8; // viewport coords (fixed)
    // prefer aligning to the left of the anchor so it sits over the actions column
    let left = rect.left;
    // clamp left inside viewport with small margin
    const margin = 12;
    left = Math.max(margin, Math.min(left, window.innerWidth - dropdownWidth - margin));
    node.style.top = top + 'px';
    node.style.left = left + 'px';
    // load collectors
    window.dashboardAPI.getCollectors().then(resp => {
        const list = node.querySelector('.assign-list');
        if (!list) return;
        list.innerHTML = '';
        const collectors = (resp && resp.success && resp.data)
            ? sortCollectorsByOptimizationMode(resp.data, stationName || '')
            : [];
        if (!collectors.length) {
            // fallback: if inline list empty, open the full assign modal
            list.innerHTML = '<div class="empty-note">No collectors available — opening full assign modal…</div>';
            setTimeout(function(){ closeAssignDropdown(); openCollectorModal(stationId, stationName, fill); }, 450);
            return;
        }
        collectors.forEach(c => {
            const item = document.createElement('div');
            item.className = 'assign-item';
            item.dataset.collectorId = c.id;
            item.innerHTML = `
                <div class="assign-avatar">${(c.name || '').split(' ').slice(0,2).map(s=>s[0]).join('') || 'C'}</div>
                <div style="flex:1">
                    <div style="font-weight:700;color:#222">${escapeHtml(c.name)}</div>
                    <div class="meta">${escapeHtml(c.phone || '')} ${c.status ? ('• ' + c.status) : ''}</div>
                </div>
                <div style="margin-left:8px;color:#2e9f69;font-weight:700">Assign</div>
            `;
            item.addEventListener('click', function(e){
                e.preventDefault();
                // call assign collector API
                const collectorId = this.dataset.collectorId;
                if (!collectorId) return;
                node.querySelectorAll('.assign-item').forEach(it => it.style.opacity = 0.6);
                window.dashboardAPI.assignCollector(stationId, collectorId).then(res => {
                    if (res && res.success) {
                        // design-only: change station fill/status to show emptied
                        try {
                            const idx = stationData.findIndex(s => s.id === stationId);
                            if (idx > -1) {
                                stationData[idx].fill = 5; // set to near-empty demo
                                stationData[idx].status = 'good';
                            }
                        } catch(e){}
                        closeAssignDropdown();
                        renderStationTable(currentPage);
                        alert('Collector assigned successfully (demo)');
                    } else {
                        closeAssignDropdown();
                        alert('Failed to assign collector (demo)');
                    }
                }).catch(err => {
                    console.error('assignCollector error', err);
                    closeAssignDropdown();
                    alert('Error assigning collector (see console)');
                });
            });
            list.appendChild(item);
        });
    }).catch(err => {
        const list = node.querySelector('.assign-list');
        if (list) list.innerHTML = '<div class="empty-note">Unable to load collectors — opening full assign modal…</div>';
        setTimeout(function(){ closeAssignDropdown(); openCollectorModal(stationId, stationName, fill); }, 450);
    });
    // close when click outside and ignore clicks inside the new node itself
    _assignDocListener = function(ev){
        try {
            if (!node.contains(ev.target) && ev.target !== anchorEl) {
                closeAssignDropdown();
            }
        } catch(e) { /* ignore */ }
    };
    document.addEventListener('click', _assignDocListener);
    _assignEscHandler = function(ev){ if (ev.key === 'Escape') closeAssignDropdown(); };
    document.addEventListener('keydown', _assignEscHandler);
}
// Pending Collection Modal (opened from Empty Bin action or Pending Badge)
    function openPendingCollectionModal(stationId, stationName, fill) {
        const modal = document.getElementById('pending-collection-modal');
        if (!modal) return;
        
        // Ensure collector data is loaded before opening modal
        const ensureCollectorDataLoaded = () => {
            return (collectorFullData && collectorFullData.length > 0)
                ? Promise.resolve()
                : (typeof loadCollectorFromDatabase === 'function'
                    ? loadCollectorFromDatabase().catch(() => {})
                    : Promise.resolve());
        };
        
        // Load collector data if needed, then populate modal
        ensureCollectorDataLoaded().then(() => {
            // Get pending collections (filtered by stationId if provided)
            const pendingCollections = getPendingCollections(stationId ? { stationId } : {});
            const tbody = modal.querySelector('#pending-collection-tbody');
            
            if (tbody) {
                tbody.innerHTML = '';
                if (!pendingCollections.length) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = '<td colspan="7" class="empty-state">No pending collections found.</td>';
                    tbody.appendChild(tr);
                } else {
                    pendingCollections.forEach((pc, index) => {
                        const collectionId = pickCollectionField(pc, ['collectionID', 'collectionId', 'id'], '');
                        const householdId = pickCollectionField(pc, ['householdID', 'householdId', 'household_id'], '');
                        const location = pickCollectionField(pc, ['collectionAddress', 'address', 'location'], '');
                        const timeRequested = pickCollectionField(pc, ['requestTime', 'requestedTime', 'timeRequested'], '');
                        
                        // Get collectors matching this collection's location
                        const availableCollectors = getCollectorsForLocation(location);
                        const selectId = `collector-select-${index}`;
                        
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${collectionId}</td>
                            <td>${householdId}</td>
                            <td>${location}</td>
                            <td>${timeRequested}</td>
                            <td>
                                <select id="${selectId}" class="assign-select" data-location="${escapeHtml(location)}">
                                    ${availableCollectors && availableCollectors.length > 0
                                        ? '<option value="">Select Collector</option>' + availableCollectors.map(c => {
                                            const collectorName = c.collectorName || c.name || 'Collector';
                                            const collectorArea = c.preferredCollectionArea || c.preferredArea || '';
                                            const displayName = collectorArea 
                                                ? `${escapeHtml(collectorName)} (${escapeHtml(collectorArea)})` 
                                                : escapeHtml(collectorName);
                                            return `<option value="${escapeHtml(String(c.collectorID || c.id || ''))}">${displayName}</option>`;
                                        }).join('')
                                        : '<option value="">No collectors available for this area</option>'
                                    }
                                </select>
                            </td>
                            <td>
                                <button class="btn btn-secondary ai-suggestion-btn"
                                    data-id="${escapeHtml(String(collectionId))}">
                                    AI Suggestion
                                </button>
                            </td>
                            <td>
                                <button class="assign-btn" data-collection-id="${escapeHtml(String(collectionId))}" data-select-id="${selectId}" title="Assign collector to this collection">Assign</button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            }
            
            const entriesInfo = modal.querySelector('#pending-entries-info');
            if (entriesInfo) {
                const count = pendingCollections.length;
                const text = count === 0 ? 'Showing 0 to 0 of 0 entries' : `Showing 1 to ${count} of ${count} entries`;
                entriesInfo.textContent = text;
            }
            
            modal.classList.add('show');
            modal.style.display = 'flex';
            
            // Add click handler for Assign buttons
            const assignButtons = modal.querySelectorAll('.assign-btn');
            assignButtons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const collectionId = this.getAttribute('data-collection-id');
                    const selectId = this.getAttribute('data-select-id');
                    const select = document.getElementById(selectId);
                    
                    if (!select) {
                        alert('Dropdown not found');
                        return;
                    }
                    
                    const selectedCollectorId = select.value;
                    if (!selectedCollectorId) {
                        alert('Please select a collector first');
                        return;
                    }
                    
                    // Find selected collector details
                    const selectedCollector = (collectorFullData || []).find(c => 
                        String(c.collectorID || c.id || '') === selectedCollectorId
                    );
                    
                    if (!selectedCollector) {
                        alert('Collector not found');
                        return;
                    }
                    
                    // Perform assignment via API
                    const assignmentData = {
                        collectionID: collectionId,
                        collectorID: selectedCollectorId,
                        collectorName: selectedCollector.collectorName || selectedCollector.name || 'Collector',
                        assignedAt: new Date().toISOString()
                    };
                    
                    // Send assignment to server
                    if (typeof window.dashboardAPI === 'object' && typeof window.dashboardAPI.assignCollectorToCollection === 'function') {
                        window.dashboardAPI.assignCollectorToCollection(assignmentData)
                            .then(resp => {
                                if (resp && resp.success) {
                                    updateCollectionAssignmentLocal(collectionId, selectedCollectorId);
                                    alert('Collector assigned successfully!');
                                    closePendingCollectionModal();
                                    if (typeof loadCollectionFromDatabase === 'function') {
                                        loadCollectionFromDatabase().catch(err => console.error('Reload error', err));
                                    }
                                } else {
                                    alert('Failed to assign collector: ' + (resp?.message || 'Unknown error'));
                                }
                            })
                            .catch(err => {
                                console.error('Assignment error:', err);
                                alert('Failed to assign collector. Please try again.');
                            });
                    } else {
                        // Fallback: make direct API call
                        const adminId = localStorage.getItem('kolek_admin') || '';
                        fetch('/api/collection/assign', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...assignmentData, adminId })
                        })
                            .then(res => res.json())
                            .then(data => {
                                if (data.success || data.message === 'Collection assigned successfully') {
                                    updateCollectionAssignmentLocal(collectionId, selectedCollectorId);
                                    alert('Collector assigned successfully!');
                                    closePendingCollectionModal();
                                    // Reload collection data
                                    if (typeof loadCollectionFromDatabase === 'function') {
                                        loadCollectionFromDatabase().catch(err => console.error('Reload error', err));
                                    }
                                } else {
                                    alert('Failed to assign collector: ' + (data.message || 'Unknown error'));
                                }
                            })
                            .catch(err => {
                                console.error('Assignment error:', err);
                                alert('Failed to assign collector. Please try again.');
                            });
                    }
                });
            });
            
            function onKey(e) {
                if (e.key === 'Escape' || e.key === 'Esc') {
                    closePendingCollectionModal();
                }
            }
            
            // Clean up previous handler if exists
            if (modal._onKey) {
                document.removeEventListener('keydown', modal._onKey);
            }
            document.addEventListener('keydown', onKey);
            modal._onKey = onKey;
            
            try { modal.querySelector('#pending-collection-tbody').focus(); } catch(e){}
        });
    }
function closePendingCollectionModal() {
    const modal = document.getElementById('pending-collection-modal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = 'none';
    try {
        if (modal._onKey) {
            document.removeEventListener('keydown', modal._onKey);
            delete modal._onKey;
        }
    } catch (e) { /* ignore */ }
}
// Collector details modal (open / close / small helpers)
function openCollectorDetails(data = {}) {
    const modal = document.getElementById('collector-details-modal');
    if (!modal) return;
    
    // Find collector details from collectorFullData if we have an ID
    let collectorInfo = { ...data };
    if (collectorInfo.id && collectorFullData && collectorFullData.length > 0) {
        const found = collectorFullData.find(c => {
            const cId = String(c.collectorID || c.collectorId || c.id || '').trim();
            const searchId = String(collectorInfo.id || '').trim();
            return cId === searchId;
        });
        if (found) {
            collectorInfo = {
                id: found.collectorID || found.collectorId || found.id || data.id || '',
                name: found.collectorName || found.name || data.name || '',
                email: found.emailAddress || found.email || '',
                phone: found.phoneNumber || found.phone || '',
                area: found.preferredCollectionArea || found.preferredArea || '',
                vehicle: found.vehicleType || found.vehicle || '',
                availability: found.availability || ''
            };
        }
    }
    
    try {
        // Update header with collector name and ID
        const nameEl = modal.querySelector('.collector-name-large');
        const idEl = modal.querySelector('.collector-id');
        if (nameEl) {
            // Get the text content (exclude the span)
            const textNodes = Array.from(nameEl.childNodes).filter(node => node.nodeType === 3);
            if (textNodes.length > 0) {
                // Update first text node
                textNodes[0].textContent = (collectorInfo.name || 'Collector') + ' ';
            } else {
                // Create new text node if none exists
                nameEl.insertBefore(document.createTextNode(collectorInfo.name || 'Collector'), nameEl.firstChild);
            }
        }
        if (idEl) {
            idEl.textContent = collectorInfo.id || idEl.textContent;
        }
        
        // Update avatar with initials
        const avatarImg = modal.querySelector('.collector-avatar-large img');
        if (avatarImg && collectorInfo.name) {
            // Generate avatar with initials
            const initials = collectorInfo.name
                .split(' ')
                .map(word => word.charAt(0).toUpperCase())
                .slice(0, 2)
                .join('');
            // Use a placeholder service or create a simple avatar
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=84&background=4CAF50&color=fff`;
            avatarImg.src = avatarUrl;
            avatarImg.alt = collectorInfo.name;
        }
        
        // Update role (assuming "Collector In Charge" as default)
        const roleEl = modal.querySelector('.collector-role');
        if (roleEl) {
            // Use availability or default role
            const role = collectorInfo.availability || 'Collector In Charge';
            roleEl.textContent = role;
        }
        
    } catch (e) { 
        console.error('Error populating collector details:', e);
    }
    
    // Populate collections table for this collector
    try {
        const collectorId = String(collectorInfo.id || '').trim();
        const tbody = modal.querySelector('.collector-details-table tbody');
        if (tbody && collectorId && collectionFullData && collectionFullData.length > 0) {
            // Filter collections for this collector
            const collectorCollections = collectionFullData.filter(c => {
                const cId = String(pickCollectionField(c, ['collectorID', 'collectorId', 'collector_id'], '')).trim();
                return cId === collectorId;
            });
            
            if (collectorCollections.length === 0) {
                // Show empty state
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">No collections found for this collector.</td></tr>';
            } else {
                // Render collection rows
                const rows = collectorCollections.map(collection => {
                    const collectionId = pickCollectionField(collection, ['collectionID', 'collectionId', 'collection_id', 'id'], '');
                    const sourceId = pickCollectionField(collection, ['householdID', 'householdId', 'household_id'], '');
                    const location = pickCollectionField(collection, ['collectionAddress', 'address', 'location'], '');
                    const timeRequested = pickCollectionField(collection, ['requestTime', 'requestedTime', 'timeRequested'], '');
                    const timeCollected = pickCollectionField(collection, ['collectedTime', 'collectionTime', 'collected_time'], 'N/A');
                    const ucoCollected = pickCollectionField(collection, ['ucoCollected', 'ucoWeight', 'weightCollected'], 'N/A');
                    const status = pickCollectionField(collection, ['collectionStatus', 'status', 'collection_status'], '');
                    const statusLower = String(status).toLowerCase();
                    let statusClass = 'assigned';
                    if (statusLower.includes('completed')) statusClass = 'completed';
                    else if (statusLower.includes('ongoing')) statusClass = 'ongoing';
                    else if (statusLower.includes('assigned')) statusClass = 'assigned';
                    else if (statusLower.includes('pending')) statusClass = 'pending';
                    
                    return `
                        <tr>
                            <td>${escapeHtml(String(collectionId))}</td>
                            <td>${escapeHtml(String(sourceId))}</td>
                            <td>${escapeHtml(String(location))}</td>
                            <td>${escapeHtml(String(timeRequested))}</td>
                            <td>${escapeHtml(String(timeCollected))}</td>
                            <td>${escapeHtml(String(ucoCollected))}</td>
                            <td class="status ${statusClass}">${escapeHtml(String(status))}</td>
                        </tr>
                    `;
                }).join('\n');
                tbody.innerHTML = rows;
            }
        }
    } catch (e) {
        console.error('Error populating collections table:', e);
    }
    
    // Show modal
    modal.classList.add('show');
    const content = modal.querySelector('.modal-content');
    if (content) {
        content.focus();
    }
    
    // Add an escape key handler (scoped) so Esc closes this modal
    function onKey(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            closeCollectorDetails();
        }
    }
    // Remove previous handler if it exists
    if (modal._onKey) {
        document.removeEventListener('keydown', modal._onKey);
    }
    document.addEventListener('keydown', onKey);
    modal._onKey = onKey;
}
function closeCollectorDetails() {
    const modal = document.getElementById('collector-details-modal');
    if (!modal) return;
    modal.classList.remove('show');
    // ensure any escape handler gets cleaned up
    try {
        if (modal._onKey) {
            document.removeEventListener('keydown', modal._onKey);
            delete modal._onKey;
        }
    } catch (e) { /* ignore */ }
}
function setupCollectionInteractions() {
    if (setupCollectionInteractions._initialized) return;
    setupCollectionInteractions._initialized = true;
    const search = document.getElementById('collection-search');
    const table = document.querySelector('.collection-table tbody');
    const filterSelect = document.getElementById('collection-filter-select');
    const pendingBadge = document.getElementById('collection-pending');
    if (search && table) {
        search.addEventListener('input', function() {
            collectionSearchQuery = this.value || '';
            applyCollectionFilters();
        });
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            collectionStatusFilter = this.value || 'all';
            applyCollectionFilters();
        });
        filterSelect.value = collectionStatusFilter || 'all';
    }
    
    // Date filter pill click handler
    const datePill = document.getElementById('collection-date');
    const datePickerModal = document.getElementById('collection-date-picker-modal');
    const dateStartInput = document.getElementById('collection-date-start');
    const dateEndInput = document.getElementById('collection-date-end');
    const dateApplyBtn = document.getElementById('collection-date-picker-apply');
    const dateClearBtn = document.getElementById('collection-date-picker-clear');
    const dateCancelBtn = document.getElementById('collection-date-picker-cancel');
    const dateCloseBtn = document.getElementById('collection-date-picker-close');
    
    if (datePill) {
        datePill.addEventListener('click', (e) => {
            e.preventDefault();
            if (datePickerModal) {
                // Set current values
                if (dateStartInput) dateStartInput.value = collectionDateFilterStart || '';
                if (dateEndInput) dateEndInput.value = collectionDateFilterEnd || '';
                datePickerModal.classList.add('show');
                datePickerModal.style.display = 'flex';
            }
        });
    }
    
    if (dateApplyBtn) {
        dateApplyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const startDate = dateStartInput ? dateStartInput.value : null;
            const endDate = dateEndInput ? dateEndInput.value : null;
            
            if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                alert('Start date cannot be after end date');
                return;
            }
            
            collectionDateFilterStart = startDate;
            collectionDateFilterEnd = endDate;
            
            // Update date pill display
            if (datePill) {
                if (startDate && endDate) {
                    const start = new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
                    const end = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
                    datePill.innerHTML = `${start} - ${end} <i class="fas fa-chevron-down" style="margin-left:8px;color:#7b7b7b"></i>`;
                }
            }
            
            if (datePickerModal) {
                datePickerModal.classList.remove('show');
                datePickerModal.style.display = 'none';
            }
            
            applyCollectionFilters();
        });
    }
    
    if (dateClearBtn) {
        dateClearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            collectionDateFilterStart = null;
            collectionDateFilterEnd = null;
            if (dateStartInput) dateStartInput.value = '';
            if (dateEndInput) dateEndInput.value = '';
            
            // Reset date pill display to default
            if (datePill) {
                datePill.innerHTML = '01 Oct 25 - 31 Oct 25 <i class="fas fa-chevron-down" style="margin-left:8px;color:#7b7b7b"></i>';
            }
            
            if (datePickerModal) {
                datePickerModal.classList.remove('show');
                datePickerModal.style.display = 'none';
            }
            
            applyCollectionFilters();
        });
    }
    
    if (dateCancelBtn) {
        dateCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (datePickerModal) {
                datePickerModal.classList.remove('show');
                datePickerModal.style.display = 'none';
            }
        });
    }
    
    if (dateCloseBtn) {
        dateCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (datePickerModal) {
                datePickerModal.classList.remove('show');
                datePickerModal.style.display = 'none';
            }
        });
    }
    
    // Close modal when clicking outside
    if (datePickerModal) {
        datePickerModal.addEventListener('click', (e) => {
            if (e.target === datePickerModal) {
                datePickerModal.classList.remove('show');
                datePickerModal.style.display = 'none';
            }
        });
    }
    
    if (pendingBadge) {
        pendingBadge.addEventListener('click', async (e) => {
            e.preventDefault();
            // Load data if needed
            if (!collectionFullData || collectionFullData.length === 0) {
                if (typeof loadCollectionFromDatabase === 'function') {
                    await loadCollectionFromDatabase();
                } else if (typeof loadCollectionFromCSV === 'function') {
                    await loadCollectionFromCSV();
                }
            }
            if (!collectorFullData || collectorFullData.length === 0) {
                if (typeof loadCollectorFromDatabase === 'function') {
                    await loadCollectorFromDatabase();
                } else if (typeof loadCollectorFromCSV === 'function') {
                    await loadCollectorFromCSV();
                }
            }
            // Open modal without parameters to show all pending collections
            openPendingCollectionModal();
        });
    }
    // export button (Use selected format)
    const exportBtn = document.getElementById('collection-export');
    if (exportBtn) exportBtn.addEventListener('click', e => {
        e.preventDefault();
        try {
            const rows = Array.from(document.querySelectorAll('.collection-table tbody tr')).filter(r => r.style.display !== 'none');
            const header = ['Collection ID','Collection Date','Collection Address','Request Time','Collected Time','Collection Status','Points Earned','Credit Earned','Household ID','Collector ID','Station ID'];
            const dataRows = rows.map(r => {
                const cells = Array.from(r.querySelectorAll('td'));
                return cells.slice(0,11).map(c => c.textContent.trim());
            });
            window.dashboardAPI.exportCollections({ count: rows.length }).then(resp => {
                exportTableData('collections_export', header, dataRows);
            }).catch(err => { console.error('Export collections failed:', err); alert('Export failed — see console'); });
        } catch(err) { console.error('Export collections handler error', err); alert('Export failed (client error)'); }
    });
    const filterBtn = document.getElementById('collection-filter-sort');
    if (filterBtn && filterSelect) {
        setupFilterDropdown(filterBtn, filterSelect, () => {
            collectionStatusFilter = filterSelect.value || 'all';
            applyCollectionFilters();
        });
    } else if (filterBtn) {
        filterBtn.addEventListener('click', e => {
            e.preventDefault();
            const options = ['all', 'completed', 'ongoing', 'assigned', 'pending'];
            const labels = {
                all: 'All',
                completed: 'Completed',
                ongoing: 'Ongoing',
                assigned: 'Assigned',
                pending: 'Pending'
            };
            const idx = options.indexOf(collectionStatusFilter);
            collectionStatusFilter = options[(idx + 1) % options.length];
            filterBtn.title = `Filter: ${labels[collectionStatusFilter] || 'All'}`;
            applyCollectionFilters();
        });
        if (!filterBtn.title) {
            filterBtn.title = 'Filter: All';
        }
    }
    
    // view details -> open collector details modal (use event delegation for dynamically created rows)
    const collectionTableBody = document.querySelector('.collection-table tbody');
    if (collectionTableBody && !collectionTableBody.dataset._collectionViewDetailsBound) {
        collectionTableBody.dataset._collectionViewDetailsBound = '1';
        collectionTableBody.addEventListener('click', function(e) {
            const link = e.target.closest('.view-details');
            if (!link) return;
            e.preventDefault();
            
            const row = link.closest('tr');
            if (!row) return;
            
            // Collection table columns: 1=collectionID, 2=date, 3=address, 4=requestTime, 5=collectedTime, 
            // 6=status, 7=points, 8=credit, 9=householdID, 10=collectorID, 11=stationID, 12=actions
            const collectorId = (row.querySelector('td:nth-child(10)') && row.querySelector('td:nth-child(10)').textContent || '').trim();
            
            if (!collectorId) {
                console.warn('No collector ID found for this collection');
                return;
            }
            
            // Find collector name from collectorFullData
            let collectorName = 'Collector';
            if (collectorFullData && collectorFullData.length > 0) {
                const collectorRecord = collectorFullData.find(c => {
                    const cId = String(c.collectorID || c.collectorId || c.id || '').trim();
                    return cId === collectorId;
                });
                if (collectorRecord) {
                    collectorName = collectorRecord.collectorName || collectorRecord.name || 'Collector';
                }
            }
            
            openCollectorDetails({ id: collectorId, name: collectorName });
        });
    }
}
function setupHouseholdInteractions() {
    const search = document.getElementById('household-search');
    const table = document.querySelector('.household-table tbody');
    const filterSelect = document.getElementById('household-filter-select');
    if (search && table) {
        search.addEventListener('input', function() {
            householdSearchQuery = this.value || '';
            applyHouseholdFilters();
        });
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            householdStatusFilter = this.value || 'all';
            applyHouseholdFilters();
        });
        filterSelect.value = householdStatusFilter || 'all';
    }
    // small control actions
    const pageBtns = document.querySelectorAll('#household-content .pagination .page-btn');
    if (pageBtns && pageBtns.length) {
        pageBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                pageBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const page = this.textContent.trim();
                const rows = Array.from(document.querySelectorAll('.household-table tbody tr'));
                if (page === '1') {
                    rows.forEach((r, i) => r.style.display = i < 10 ? '' : 'none');
                } else if (page === '2') {
                    rows.forEach((r, i) => r.style.display = i >= 10 && i < 20 ? '' : 'none');
                } else if (this.classList.contains('next')) {
                    pageBtns.forEach(b => { if (b.textContent.trim()==='2') b.click(); });
                }
            });
        });
        pageBtns[0].classList.add('active');
    }
    // small control actions
    const refreshBtn = document.getElementById('household-refresh');
    if (refreshBtn) refreshBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const btn = this;
        // prevent double-click while refreshing
        if (btn.disabled || btn.dataset.refreshing === 'true') return;
        btn.dataset.refreshing = 'true';
        btn.disabled = true;
        try {
            // rotation animation
            btn.style.transform = 'rotate(0deg)';
            btn.style.transition = 'transform 0.6s ease';
            setTimeout(() => { btn.style.transform = 'rotate(360deg)'; }, 10);
            // visual feedback on table
            const table = document.querySelector('.household-table');
            if (table) {
                table.style.transition = 'box-shadow 0.25s ease, transform 0.25s ease';
                table.style.transform = 'translateY(-4px)';
                table.style.boxShadow = '0 12px 34px rgba(0,0,0,0.08)';
                setTimeout(() => { table.style.transform = ''; table.style.boxShadow = ''; }, 400);
            }
            // reload after animation completes (600ms)
            setTimeout(() => {
                try {
                    // ensure app returns to Household page after reload
                    try { localStorage.setItem('kolek_active_page', 'household'); } catch (e) {}
                } finally {
                    // reset attribute briefly in case reload is prevented
                    btn.dataset.refreshing = 'false';
                    btn.disabled = false;
                    // perform page reload
                    window.location.reload();
                }
            }, 650);
        } catch (err) {
            console.error('Household refresh error', err);
            btn.dataset.refreshing = 'false';
            btn.disabled = false;
        }
    });
    const exportBtn = document.getElementById('household-export');
    if (exportBtn) exportBtn.addEventListener('click', e => {
        e.preventDefault();
        try {
            // Collect visible rows from household table
            const rows = Array.from(document.querySelectorAll('.household-table tbody tr'))
                .filter(r => r.style.display !== 'none');
            // Header
            const header = ['Household ID','Household Name','Phone Number','Email Address','Gender','Points','Credit','UCO Deposit','Status'];
            const dataRows = rows.map(r => {
                const cells = Array.from(r.querySelectorAll('td'));
                return cells.slice(0, 9).map(c => c.textContent.trim());
            });
            // Call backend (mock) then trigger client-side download with selected format
            window.dashboardAPI.exportHouseholds({ count: rows.length }).then(resp => {
                exportTableData('households_export', header, dataRows);
            }).catch(err => {
                console.error('Export households failed:', err);
                alert('Export failed — see console');
            });
        } catch (err) {
            console.error('Export handler error', err);
            alert('Export failed (client error)');
        }
    });
    if (table) {
        table.addEventListener('click', async (e) => {
            const action = e.target.closest('.danger-action, .success-action');
            if (!action) return;
            e.preventDefault();
            const row = action.closest('tr');
            if (!row) return;
            const idCell = row.querySelector('td:nth-child(1)');
            const rawId = idCell ? idCell.textContent.trim() : '';
            const normalizedId = rawId.replace(/^#/, '');
            if (!normalizedId) return;
            const targetStatus = action.classList.contains('danger-action') ? 'Inactive' : 'Active';
            try {
                await updateHouseholdStatusInDatabase(normalizedId, targetStatus);
                const findRecord = (list) => (list || []).find(d => {
                    const idVal = d.householdID || d.householdId || d.household || d.id || d.ID || '';
                    return String(idVal).replace(/^#/, '') === normalizedId;
                });
                const record = findRecord(householdFullData) || findRecord(householdFilteredData);
                if (record) {
                    record.accountStatus = targetStatus;
                    record.accountstatus = targetStatus;
                    record.account_status = targetStatus;
                    record.status = targetStatus;
                }
                const statusCell = row.querySelector('td:nth-child(9)');
                if (statusCell) statusCell.textContent = targetStatus;
                if (action) {
                    if (targetStatus.toLowerCase() === 'inactive') {
                        action.classList.remove('danger-action');
                        action.classList.add('success-action');
                        action.textContent = '[Activate]';
                    } else {
                        action.classList.remove('success-action');
                        action.classList.add('danger-action');
                        action.textContent = '[Deactivate]';
                    }
                }
                applyHouseholdFilters();
            } catch (err) {
                console.error('Household status update failed:', err);
                alert(err.message || 'Failed to update household status');
            }
        });
    }
    const filterBtn = document.getElementById('household-filter-sort');
    if (filterBtn && filterSelect) {
        setupFilterDropdown(filterBtn, filterSelect, () => {
            householdStatusFilter = filterSelect.value || 'all';
            applyHouseholdFilters();
        });
    } else if (filterBtn) {
        filterBtn.addEventListener('click', e => {
            e.preventDefault();
            const options = ['all', 'active', 'inactive'];
            const labels = { all: 'All', active: 'Active', inactive: 'Inactive' };
            const idx = options.indexOf(householdStatusFilter);
            householdStatusFilter = options[(idx + 1) % options.length];
            filterBtn.title = `Filter: ${labels[householdStatusFilter] || 'All'}`;
            applyHouseholdFilters();
        });
        if (!filterBtn.title) {
            filterBtn.title = 'Filter: All';
        }
    }
}
// Function to load and parse Fnl-Household.csv
// Pagination state for household
let householdFullData = [];
let householdFilteredData = [];
let householdCurrentPage = 1;
const householdRecordsPerPage = 15;
let householdSearchQuery = '';
let householdStatusFilter = 'all';

// Pagination state for collector
let collectorFullData = [];
let collectorFilteredData = [];
let collectorCurrentPage = 1;
const collectorRecordsPerPage = 15;
let collectorSearchQuery = '';
let collectorStatusFilter = 'all';
let collectorAutoRefreshId = null;

// Pagination state for collection
let collectionFullData = [];
let collectionFilteredData = [];
let collectionCurrentPage = 1;
const collectionRecordsPerPage = 10;
let collectionSearchQuery = '';
let collectionStatusFilter = 'all';
let collectionDateFilterStart = null;
let collectionDateFilterEnd = null;

// Report filter state (non-paginated)
let reportSearchQuery = '';
let reportStatusFilter = 'all';

// Awareness (campaign) table state
let awarenessCampaignFullData = [];
let awarenessSortMetric = 'views';
let awarenessSortOrder = 'desc';
let awarenessHasUserSelection = false;

// ==================== TRANSLATION SYSTEM ====================
const translations = {
    en: {
        // Sidebar Navigation
        'nav-general': 'General',
        'nav-dashboard': 'Dashboard',
        'nav-collection': 'Collection',
        'nav-station': 'Station',
        'nav-collector': 'Collector',
        'nav-applicant': 'Applicant',
        'nav-household': 'Household',
        'nav-reward': 'Reward',
        'nav-report': 'Report',
        'nav-support': 'Support',
        'nav-ai-assist': 'AI Assist',
        'nav-setting': 'Setting',
        // Header
        'header-refresh': 'Refresh',
        'header-export': 'Export PDF',
        'header-logout': 'Logout',
        // Page Titles
        'title-dashboard': 'Dashboard',
        'title-collection': 'Collection',
        'title-station': 'Station',
        'title-collector': 'Collector',
        'title-applicant': 'Applicant',
        'title-household': 'Household',
        'title-reward': 'Reward',
        'title-report': 'Report',
        'title-settings': 'Settings',
        'title-ai-assist': 'AI Assist',
        // Common UI
        'btn-prev': 'Prev',
        'btn-next': 'Next',
        'btn-previous': 'Previous',
        'btn-refresh': 'Refresh',
        'btn-export': 'Export PDF',
        'btn-search': 'Search something..',
        'btn-filter': 'Filter & Sort',
        'showing-entries': 'Showing',
        'of-entries': 'of',
        'entries': 'entries',
        // Station Page
        'station-id': 'Station ID',
        'station-name': 'Station Name',
        'station-map': 'Map',
        'station-capability': 'Capability',
        'station-status': 'Status',
        'station-fill': 'Fill Level',
        'station-address': 'Address',
        'station-description': 'Description',
        'station-actions': 'Actions',
        // Collection Page
        'collection-id': 'Collection ID',
        'collection-date': 'Collection Date',
        'collection-address': 'Collection Address',
        'collection-request-time': 'Request Time',
        'collection-collected-time': 'Collected Time',
        'collection-status': 'Collection Status',
        'collection-points': 'Points Earned',
        'collection-credit': 'Credit Earned',
        'collection-household-id': 'Household ID',
        'collection-collector-id': 'Collector ID',
        'collection-station-id': 'Station ID',
        // Collector Page
        'collector-id': 'Collector ID',
        'collector-name': 'Collector Name',
        'collector-phone': 'Phone Number',
        'collector-email': 'Email Address',
        'collector-dob': 'Date of Birth',
        'collector-vehicle': 'Vehicle Type',
        'collector-plate': 'Plate No.',
        'collector-area': 'Preferred Area',
        'collector-availability': 'Availability',
        'collector-status': 'Status',
        'collector-action': 'Action',
        // Household Page
        'household-id': 'Household ID',
        'household-name': 'Name',
        'household-phone': 'Phone',
        'household-email': 'Email',
        'household-gender': 'Gender',
        'household-points': 'Points',
        'household-credit': 'Credit',
        'household-weight': 'Weight',
        'household-status': 'Status',
        // Applicant Page
        'applicant-id': 'Applicant ID',
        'applicant-name': 'Full Name',
        'applicant-phone': 'Phone Number',
        'applicant-email': 'Email',
        'applicant-date': 'Application Date',
        'applicant-status': 'Status',
        // Reward Page
        'reward-id': 'Reward ID',
        'reward-name': 'Reward Name',
        'reward-category': 'Category',
        'reward-merchant': 'Merchant',
        'reward-value': 'Value',
        'reward-points': 'Points Required',
        'reward-expiry': 'Expiry Date',
        // Status values
        'status-active': 'Active',
        'status-inactive': 'Inactive',
        'status-pending': 'Pending',
        'status-completed': 'Completed',
        'status-approved': 'Approved',
        'status-rejected': 'Rejected',
        'status-all': 'All Status',
        // Settings Page
        'settings-title': 'Settings',
        'general-settings': 'General Settings',
        'system-language': 'System Language',
        'theme-mode': 'Theme Mode',
        'date-time-format': 'Date & Time Format',
        'default-region': 'Default Region',
        'security-access': 'Security & Access Control',
        'two-factor-auth': 'Two-Factor Authentication',
        'session-timeout': 'Session Timeout Duration',
        'timeout-value': '30 minutes',
        'ip-whitelist': 'Reset Password',
        'activity-log': 'Activity Log',
        'data-report': 'Data & Report Managment',
        'report-format': 'Report Format',
        'scheduled-reports': 'Scheduled Reports',
        'include-co2': 'Include CO2 Metrics',
        'custom-header': 'Custom Report Header',
        'route-station': 'Route & Station Preference',
        'default-fill-level': 'Default Fill Level Alert',
        'fill-level-value': '80%',
        'route-optimization': 'Route Optimization Mode',
        'auto-route-approval': 'Auto Route Approval',
        'logout-button': 'Log out',
        // KPI Cards
        'kpi-total-uco': 'Total UCO Collected',
        'kpi-litres': 'kg',
        'kpi-households': 'Active Households',
        'kpi-collectors': 'Active Collectors'
    },
    zh: {
        // Sidebar Navigation
        'nav-general': '常规',
        'nav-dashboard': '仪表盘',
        'nav-collection': '收集',
        'nav-station': '站点',
        'nav-collector': '收集人员',
        'nav-applicant': '申请人',
        'nav-household': '住户',
        'nav-reward': '奖励',
        'nav-report': '报告',
        'nav-support': '支持',
        'nav-ai-assist': '人工智能助手',
        'nav-setting': '设置',
        // Header
        'header-refresh': '刷新',
        'header-export': '导出PDF',
        'header-logout': '登出',
        // Page Titles
        'title-dashboard': '仪表盘',
        'title-collection': '收集',
        'title-station': '站点',
        'title-collector': '收集人员',
        'title-applicant': '申请人',
        'title-household': '住户',
        'title-reward': '奖励',
        'title-report': '报告',
        'title-settings': '设置',
        'title-ai-assist': '人工智能助手',
        // Common UI
        'btn-prev': '上一页',
        'btn-next': '下一页',
        'btn-previous': '上一页',
        'btn-refresh': '刷新',
        'btn-export': '导出PDF',
        'btn-search': '搜索内容..',
        'btn-filter': '筛选和排序',
        'showing-entries': '显示',
        'of-entries': '共',
        'entries': '条',
        // Station Page
        'station-id': '站点ID',
        'station-name': '站点名称',
        'station-map': '地图',
        'station-capability': '容量',
        'station-status': '状态',
        'station-fill': '填充级别',
        'station-address': '地址',
        'station-description': '描述',
        'station-actions': '操作',
        // Collection Page
        'collection-id': '收集ID',
        'collection-date': '收集日期',
        'collection-address': '收集地址',
        'collection-request-time': '请求时间',
        'collection-collected-time': '收集时间',
        'collection-status': '收集状态',
        'collection-points': '获得的积分',
        'collection-credit': '获得的积分',
        'collection-household-id': '住户ID',
        'collection-collector-id': '收集人员ID',
        'collection-station-id': '站点ID',
        // Collector Page
        'collector-id': '收集人员ID',
        'collector-name': '收集人员名称',
        'collector-phone': '电话号码',
        'collector-email': '电子邮件地址',
        'collector-dob': '出生日期',
        'collector-vehicle': '车辆类型',
        'collector-plate': '车牌号',
        'collector-area': '首选地区',
        'collector-availability': '可用性',
        'collector-status': '状态',
        'collector-action': '操作',
        // Household Page
        'household-id': '住户ID',
        'household-name': '名称',
        'household-phone': '电话',
        'household-email': '电子邮件',
        'household-gender': '性别',
        'household-points': '积分',
        'household-credit': '积分',
        'household-weight': '重量',
        'household-status': '状态',
        // Applicant Page
        'applicant-id': '申请人ID',
        'applicant-name': '全名',
        'applicant-phone': '电话号码',
        'applicant-email': '电子邮件',
        'applicant-date': '申请日期',
        'applicant-status': '状态',
        // Reward Page
        'reward-id': '奖励ID',
        'reward-name': '奖励名称',
        'reward-category': '类别',
        'reward-merchant': '商户',
        'reward-value': '价值',
        'reward-points': '所需积分',
        'reward-expiry': '过期日期',
        // Status values
        'status-active': '活跃',
        'status-inactive': '非活跃',
        'status-pending': '待处理',
        'status-completed': '已完成',
        'status-approved': '已批准',
        'status-rejected': '已拒绝',
        'status-all': '所有状态',
        // Settings Page
        'settings-title': '设置',
        'general-settings': '常规设置',
        'system-language': '系统语言',
        'theme-mode': '主题模式',
        'date-time-format': '日期和时间格式',
        'default-region': '默认地区',
        'security-access': '安全和访问控制',
        'manage-roles': '管理角色和权限',
        'session-timeout': '会话超时时长',
        'timeout-value': '30 分钟',
        'ip-whitelist': 'IP白名单',
        'activity-log': '活动日志',
        'data-report': '数据和报告管理',
        'report-format': '报告格式',
        'scheduled-reports': '预定报告',
        'include-co2': '包含CO2指标',
        'custom-header': '自定义报告头',
        'route-station': '路线和站点偏好',
        'default-fill-level': '默认填充级别警报',
        'fill-level-value': '80%',
        'route-optimization': '路线优化模式',
        'auto-route-approval': '自动路线批准',
        'logout-button': '登出',
        // KPI Cards
        'kpi-total-uco': '收集的总油',
        'kpi-litres': '公斤',
        'kpi-households': '活跃住户',
        'kpi-collectors': '活跃收集人员'
    },
    bahasa: {
        // Sidebar Navigation
        'nav-general': 'Umum',
        'nav-dashboard': 'Dasbor',
        'nav-collection': 'Koleksi',
        'nav-station': 'Stasiun',
        'nav-collector': 'Kolektor',
        'nav-applicant': 'Pelamar',
        'nav-household': 'Rumah Tangga',
        'nav-reward': 'Hadiah',
        'nav-report': 'Laporan',
        'nav-support': 'Dukungan',
        'nav-ai-assist': 'Asisten AI',
        'nav-setting': 'Pengaturan',
        // Header
        'header-refresh': 'Segarkan',
        'header-export': 'Ekspor PDF',
        'header-logout': 'Keluar',
        // Page Titles
        'title-dashboard': 'Dasbor',
        'title-collection': 'Koleksi',
        'title-station': 'Stasiun',
        'title-collector': 'Kolektor',
        'title-applicant': 'Pelamar',
        'title-household': 'Rumah Tangga',
        'title-reward': 'Hadiah',
        'title-report': 'Laporan',
        'title-settings': 'Pengaturan',
        'title-ai-assist': 'Asisten AI',
        // Common UI
        'btn-prev': 'Sebelumnya',
        'btn-next': 'Selanjutnya',
        'btn-previous': 'Sebelumnya',
        'btn-refresh': 'Segarkan',
        'btn-export': 'Ekspor PDF',
        'btn-search': 'Cari sesuatu..',
        'btn-filter': 'Filter & Sortir',
        'showing-entries': 'Menampilkan',
        'of-entries': 'dari',
        'entries': 'entri',
        // Station Page
        'station-id': 'ID Stasiun',
        'station-name': 'Nama Stasiun',
        'station-map': 'Peta',
        'station-capability': 'Kapabilitas',
        'station-status': 'Status',
        'station-fill': 'Tingkat Pengisian',
        'station-address': 'Alamat',
        'station-description': 'Deskripsi',
        'station-actions': 'Tindakan',
        // Collection Page
        'collection-id': 'ID Koleksi',
        'collection-date': 'Tanggal Koleksi',
        'collection-address': 'Alamat Koleksi',
        'collection-request-time': 'Waktu Permintaan',
        'collection-collected-time': 'Waktu Pengumpulan',
        'collection-status': 'Status Koleksi',
        'collection-points': 'Poin Diperoleh',
        'collection-credit': 'Kredit Diperoleh',
        'collection-household-id': 'ID Rumah Tangga',
        'collection-collector-id': 'ID Kolektor',
        'collection-station-id': 'ID Stasiun',
        // Collector Page
        'collector-id': 'ID Kolektor',
        'collector-name': 'Nama Kolektor',
        'collector-phone': 'Nomor Telepon',
        'collector-email': 'Alamat Email',
        'collector-dob': 'Tanggal Lahir',
        'collector-vehicle': 'Jenis Kendaraan',
        'collector-plate': 'Nomor Plat',
        'collector-area': 'Area Pilihan',
        'collector-availability': 'Ketersediaan',
        'collector-status': 'Status',
        'collector-action': 'Tindakan',
        // Household Page
        'household-id': 'ID Rumah Tangga',
        'household-name': 'Nama',
        'household-phone': 'Telepon',
        'household-email': 'Email',
        'household-gender': 'Jenis Kelamin',
        'household-points': 'Poin',
        'household-credit': 'Kredit',
        'household-weight': 'Berat',
        'household-status': 'Status',
        // Applicant Page
        'applicant-id': 'ID Pelamar',
        'applicant-name': 'Nama Lengkap',
        'applicant-phone': 'Nomor Telepon',
        'applicant-email': 'Email',
        'applicant-date': 'Tanggal Aplikasi',
        'applicant-status': 'Status',
        // Reward Page
        'reward-id': 'ID Hadiah',
        'reward-name': 'Nama Hadiah',
        'reward-category': 'Kategori',
        'reward-merchant': 'Pedagang',
        'reward-value': 'Nilai',
        'reward-points': 'Poin Diperlukan',
        'reward-expiry': 'Tanggal Kadaluarsa',
        // Status values
        'status-active': 'Aktif',
        'status-inactive': 'Tidak Aktif',
        'status-pending': 'Tertunda',
        'status-completed': 'Selesai',
        'status-approved': 'Disetujui',
        'status-rejected': 'Ditolak',
        'status-all': 'Semua Status',
        // Settings Page
        'settings-title': 'Pengaturan',
        'general-settings': 'Pengaturan Umum',
        'system-language': 'Bahasa Sistem',
        'theme-mode': 'Mode Tema',
        'date-time-format': 'Format Tanggal dan Waktu',
        'default-region': 'Region Default',
        'security-access': 'Keamanan & Kontrol Akses',
        'manage-roles': 'Kelola Peran & Izin',
        'session-timeout': 'Durasi Waktu Habis Sesi',
        'timeout-value': '30 menit',
        'ip-whitelist': 'Daftar Putih IP',
        'activity-log': 'Log Aktivitas',
        'data-report': 'Manajemen Data & Laporan',
        'report-format': 'Format Laporan',
        'scheduled-reports': 'Laporan Terjadwal',
        'include-co2': 'Sertakan Metrik CO2',
        'custom-header': 'Header Laporan Khusus',
        'route-station': 'Preferensi Rute & Stasiun',
        'default-fill-level': 'Peringatan Level Isi Default',
        'fill-level-value': '80%',
        'route-optimization': 'Mode Optimasi Rute',
        'auto-route-approval': 'Persetujuan Rute Otomatis',
        'logout-button': 'Keluar',
        // KPI Cards
        'kpi-total-uco': 'Total UCO Dikumpulkan',
        'kpi-litres': 'kg',
        'kpi-households': 'Rumah Tangga Aktif',
        'kpi-collectors': 'Kolektor Aktif'
    }
};

let currentLanguage = 'en';

function applyLanguageTranslations(language) {
    const trans = translations[language] || translations.en;
    currentLanguage = language;
    
    if (!trans) {
        console.error('Translation not found for language:', language);
        return;
    }
    
    console.log('🌐 Starting language translation to:', language);
    let translationCount = 0;
    const startTime = performance.now();
    
    // Build bidirectional text mappings
    // 1. Map English text to current language (for initial translation)
    // 2. Map all other languages' text to current language (for switching between languages)
    const textMappings = {};
    
    // Forward mapping: English → Target Language
    for (const [key, value] of Object.entries(trans)) {
        const englishValue = translations.en[key];
        if (englishValue && englishValue !== value) {
            textMappings[englishValue] = value;
        }
    }
    
    // Reverse mapping: Other Languages → Target Language
    // This allows switching between any two non-English languages
    for (const langCode of Object.keys(translations)) {
        if (langCode === language || langCode === 'en') continue; // Skip current and English
        
        const otherLang = translations[langCode];
        for (const [key, _] of Object.entries(trans)) {
            const otherLangValue = otherLang[key];
            const targetValue = trans[key];
            if (otherLangValue && targetValue && otherLangValue !== targetValue) {
                textMappings[otherLangValue] = targetValue;
            }
        }
    }
    
    console.log('📖 Text mappings created:', Object.keys(textMappings).length, 'entries');
    
    // Recursive function to walk DOM and translate text nodes
    function walkAndTranslate(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text && textMappings[text]) {
                node.textContent = textMappings[text];
                translationCount++;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Skip script and style tags
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(node.tagName)) {
                return;
            }
            
            // Special handling for input elements
            if (node.tagName === 'INPUT') {
                if (node.placeholder && textMappings[node.placeholder]) {
                    node.placeholder = textMappings[node.placeholder];
                    translationCount++;
                }
                if (node.value && textMappings[node.value]) {
                    node.value = textMappings[node.value];
                    translationCount++;
                }
                if (node.title && textMappings[node.title]) {
                    node.title = textMappings[node.title];
                    translationCount++;
                }
                return;
            }
            
            // Handle all child nodes
            const children = Array.from(node.childNodes);
            for (const child of children) {
                walkAndTranslate(child);
            }
        }
    }
    
    // Start from body
    walkAndTranslate(document.body);
    
    // Also specifically update common elements
    // Table headers
    document.querySelectorAll('th').forEach(el => {
        const text = el.textContent.trim();
        if (text && textMappings[text]) {
            el.textContent = textMappings[text];
            translationCount++;
        }
    });
    
    // Headings
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
        const text = el.textContent.trim();
        if (text && textMappings[text]) {
            el.textContent = textMappings[text];
            translationCount++;
        }
    });
    
    // Labels and other common elements
    document.querySelectorAll('label, .label, .pill, .badge, .btn, button, [role="button"]').forEach(el => {
        const text = el.textContent.trim();
        if (text && textMappings[text]) {
            el.textContent = textMappings[text];
            translationCount++;
        }
    });
    
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(el => {
        const text = el.textContent.trim();
        for (const [oldText, newText] of Object.entries(textMappings)) {
            if (text.includes(oldText)) {
                const icon = el.querySelector('i');
                el.textContent = '';
                if (icon) el.appendChild(icon);
                el.appendChild(document.createTextNode(' ' + newText));
                translationCount++;
                break;
            }
        }
    });
    
    // Nav section titles
    const navTitles = document.querySelectorAll('.nav-title');
    if (navTitles[0]) {
        const genText = navTitles[0].textContent.trim();
        if (genText && textMappings[genText]) {
            navTitles[0].textContent = textMappings[genText];
            translationCount++;
        }
    }
    if (navTitles[1]) {
        const suppText = navTitles[1].textContent.trim();
        if (suppText && textMappings[suppText]) {
            navTitles[1].textContent = textMappings[suppText];
            translationCount++;
        }
    }
    
    // Header buttons - special handling to preserve icons
    ['refresh-btn', 'export-btn', 'logout-btn'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            const icon = btn.querySelector('i');
            const text = btn.textContent.trim();
            for (const [oldText, newText] of Object.entries(textMappings)) {
                if (text.includes(oldText)) {
                    btn.textContent = '';
                    if (icon) btn.appendChild(icon);
                    btn.appendChild(document.createTextNode(' ' + newText));
                    translationCount++;
                    break;
                }
            }
        }
    });
    
    // Logout button in settings
    const settingsLogoutBtn = document.getElementById('logout-action');
    if (settingsLogoutBtn) {
        const text = settingsLogoutBtn.textContent.trim();
        if (text && textMappings[text]) {
            settingsLogoutBtn.textContent = textMappings[text];
            translationCount++;
        }
    }
    
    // Attributes
    document.querySelectorAll('[placeholder]').forEach(el => {
        if (el.placeholder && textMappings[el.placeholder]) {
            el.placeholder = textMappings[el.placeholder];
            translationCount++;
        }
    });
    
    document.querySelectorAll('[title]').forEach(el => {
        if (el.title && textMappings[el.title]) {
            el.title = textMappings[el.title];
            translationCount++;
        }
    });
    
    const endTime = performance.now();
    console.log('✅ Translation complete! Updated', translationCount, 'elements in', (endTime - startTime).toFixed(2), 'ms');
}


function initializeLanguageOnLoad() {
    try {
        const savedLanguage = localStorage.getItem('settings:language') || 'English';
        const langSelect = document.getElementById('setting-language');
        if (langSelect) {
            langSelect.value = savedLanguage;
            
            // Apply translation if not English
            if (savedLanguage !== 'English') {
                const langMap = { 'English': 'en', 'Bahasa': 'bahasa', '中文': 'zh' };
                const lang = langMap[savedLanguage] || 'en';
                applyLanguageTranslations(lang);
            }
        }
    } catch (e) {
        console.error('Error initializing language:', e);
    }
}


// Applicant filter state (non-paginated)
let applicantFullData = [];
let applicantFilteredData = [];
let applicantSearchQuery = '';
let applicantStatusFilter = 'all';




// Pagination state for household
function loadHouseholdFromCSV(url = 'Fnl-Household.csv') {
    return fetch(url)
        .then(resp => {
            if (!resp.ok) throw new Error('Failed to load household CSV');
            return resp.text();
        })
        .then(text => {
            if (!text) return [];
            const parsed = parseCSV(text.trim());
            if (!parsed || parsed.length < 1) return [];
            const headerRow = parsed.shift().map(h => (h || '').trim());
            const data = parsed.map(r => {
                const obj = {};
                for (let i = 0; i < headerRow.length; i++) {
                    if (headerRow[i]) obj[headerRow[i]] = (r[i] || '').trim();
                }
                return obj;
            });
            householdFullData = data;
            householdFilteredData = data.slice();
            householdCurrentPage = 1;
            applyHouseholdFilters();
            updateHouseholdKPI(data.length);
            updateUcoKPIFromHouseholds(data);
            updateTop5RewardsLeaders(data);
            return data;
        })
        .catch(err => {
            console.error('Error loading household CSV:', err);
            return [];
        });
}
// Function to load and parse Fnl-Collector.csv
function loadCollectorFromCSV(url = 'Fnl-Collector.csv') {
    return fetch(url)
        .then(resp => {
            if (!resp.ok) throw new Error('Failed to load collector CSV');
            return resp.text();
        })
        .then(text => {
            if (!text) return [];
            const parsed = parseCSV(text.trim());
            if (!parsed || parsed.length < 1) return [];
            const headerRow = parsed.shift().map(h => (h || '').trim());
            const data = parsed.map(r => {
                const obj = {};
                for (let i = 0; i < headerRow.length; i++) {
                    if (headerRow[i]) obj[headerRow[i]] = (r[i] || '').trim();
                }
                return obj;
            });
            collectorFullData = data;
            collectorFilteredData = data.slice();
            console.log("Collector data loaded:", data.length, "records");
            collectorCurrentPage = 1;
            applyCollectorFilters();
            updateCollectorKPI(data.length);
            return data;
        })
        .catch(err => {
            console.error('Error loading collector CSV:', err);
            return [];
        });
}
// Function to load and parse Fnl-Application.csv
function loadApplicationFromCSV(url = 'Fnl-Application.csv') {
    return fetch(url)
        .then(resp => {
            if (!resp.ok) throw new Error('Failed to load application CSV');
            return resp.text();
        })
        .then(text => {
            if (!text) return [];
            const parsed = parseCSV(text.trim());
            if (!parsed || parsed.length < 1) return [];
            const headerRow = parsed.shift().map(h => (h || '').trim());
            const data = parsed.map(r => {
                const obj = {};
                for (let i = 0; i < headerRow.length; i++) {
                    if (headerRow[i]) obj[headerRow[i]] = (r[i] || '').trim();
                }
                return obj;
            });
            populateApplicantTableFromData(data);
            updateApplicantKPI(data.length);
            return data;
        })
        .catch(err => {
            console.error('Error loading application CSV:', err);
            return [];
        });
}
// Function to load and parse Fnl-Station.csv
function loadStationFromCSV(url = 'Fnl-Station.csv') {
    return fetch(url)
        .then(resp => {
            if (!resp.ok) throw new Error('Failed to load station CSV');
            return resp.text();
        })
        .then(text => {
            if (!text) return [];
            const parsed = parseCSV(text.trim());
            if (!parsed || parsed.length < 1) return [];
            const headerRow = parsed.shift().map(h => (h || '').trim());
            const data = parsed.map(r => {
                const obj = {};
                for (let i = 0; i < headerRow.length; i++) {
                    if (headerRow[i]) obj[headerRow[i]] = (r[i] || '').trim();
                }
                return obj;
            });
            // Transform to expected format for station table
            const stations = data.map(s => {
                const fillLevel = parseFloat(s.fillLevel || '0');
                let status = 'good';
                if (fillLevel >= 90) status = 'danger';
                else if (fillLevel >= 70) status = 'warning';
                
                return {
                    id: '#' + (s.stationID || ''),
                    name: s.stationName || '',
                    location: s.stationLocation || '',
                    fill: fillLevel,
                    purity: 0, // Not in CSV, default to 0
                    status: status,
                    operationHour: s.operationHour || '',
                    adminID: s.adminID || ''
                };
            });
            return stations;
        })
        .catch(err => {
            console.error('Error loading station CSV:', err);
            return [];
        });
}


// Function to load and parse Fnl-Campaign.csv
function loadCampaignFromCSV(url = 'Fnl-Campaign.csv') {
    return fetch(url)
        .then(resp => {
            if (!resp.ok) throw new Error('Failed to load campaign CSV');
            return resp.text();
        })
        .then(text => {
            if (!text) return [];
            const parsed = parseCSV(text.trim());
            if (!parsed || parsed.length < 1) return [];
            const headerRow = parsed.shift().map(h => (h || '').trim());
            const data = parsed.map(r => {
                const obj = {};
                for (let i = 0; i < headerRow.length; i++) {
                    if (headerRow[i]) obj[headerRow[i]] = (r[i] || '').trim();
                }
                return obj;
            });
            awarenessCampaignFullData = Array.isArray(data) ? data.slice() : [];

            // Default behavior: do not sort until admin changes a filter.
            if (awarenessHasUserSelection) {
                applyAwarenessSortAndRender();
            } else {
                populateAwarenessTable(awarenessCampaignFullData);
            }
            return data;
        })
        .catch(async err => {
            console.error('Error loading campaign CSV:', err);

            // Fallback: use mock awareness data so the table + filter still works
            // even when Fnl-Campaign.csv is not present.
            try {
                const mock = (window.dashboardAPI && typeof window.dashboardAPI.getAwarenessData === 'function')
                    ? await window.dashboardAPI.getAwarenessData()
                    : [];

                const data = Array.isArray(mock) ? mock.map(m => ({
                    campaignID: String(m.id || '').replace(/^#/, ''),
                    campaignName: m.name || '',
                    campaignViews: m.views ?? '',
                    averageWatchTime: m.watchTime || '',
                    clickRate: m.clickRate || '',
                    totalShare: (m.totalShare ?? m.engagement ?? '')
                })) : [];

                awarenessCampaignFullData = data.slice();
                if (awarenessHasUserSelection) {
                    applyAwarenessSortAndRender();
                } else {
                    populateAwarenessTable(awarenessCampaignFullData);
                }
                return data;
            } catch (fallbackErr) {
                console.error('Awareness fallback data failed:', fallbackErr);
                return [];
            }
        });
}

function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
            } else {
                field += c;
            }
        } else {
            if (c === '"') {
                inQuotes = true;
            } else if (c === ',') {
                row.push(field);
                field = '';
            } else if (c === '\r') {
                // ignore
            } else if (c === '\n') {
                row.push(field);
                rows.push(row);
                row = [];
                field = '';
            } else {
                field += c;
            }
        }
    }
    // push last field
    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}
function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function(m) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
}
function formatNumberWithCommas(n) {
    if (n === null || n === undefined || n === '') return '';
    const num = Number(String(n).replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return String(n);
    return num.toLocaleString('en-US');
}
function populateHouseholdTableFromData(data) {
    const tbody = document.querySelector('.household-table tbody');
    if (!tbody) return;
    const rows = data.map(d => {
        const idRaw = d.householdID || d.householdId || d.household || '';
        const id = idRaw.startsWith('#') ? idRaw : '#' + idRaw;
        const name = d.householdName || d.householdName || '';
        const phone = d.phoneNumber || d.phone || '';
        const email = d.emailAddress || d.email || '';
        const gender = d.gender || '';
        const points = formatNumberWithCommas(d.pointsEarned || d.points || '') + (d.pointsEarned ? ' pt' : (d.points ? ' pt' : ''));
        const creditVal = (d.creditBalance || d.credit || '').toString();
        const credit = creditVal ? ('RM ' + Number(creditVal).toFixed(2)) : '';
        const ucoVal = (d.totalUCODeposited || d.totalUcoDeposited || d.ucoDeposited || '').toString();
        const uco = ucoVal ? (Number(ucoVal).toFixed(2).replace(/\.00$/, '') + ' kg') : '';
        const status = d.accountStatus || d.accountstatus || d.account_status || d.status || '';
        const statusLower = String(status).toLowerCase();
        const isInactive = /inactive|deactiv|not\s*active/.test(statusLower);
        const isActive = /^active\b/.test(statusLower);
        const action = isActive
            ? `<a href="#" class="danger-action">[Deactivate]</a>`
            : `<a href="#" class="success-action">[Activate]</a>`;
        return `
            <tr>
                <td>${escapeHtml(id)}</td>
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(phone)}</td>
                <td>${escapeHtml(email)}</td>
                <td>${escapeHtml(gender)}</td>
                <td>${escapeHtml(points)}</td>
                <td>${escapeHtml(credit)}</td>
                <td>${escapeHtml(uco)}</td>
                <td class="status ${isActive ? 'active' : (isInactive ? 'inactive' : '')}">${escapeHtml(status)}</td>
                <td class="actions-col"><span class="action-group">${action}</span></td>
            </tr>
        `;
    }).join('\n');
    tbody.innerHTML = rows;
}
function updateHouseholdKPI(count) {
    try {
        const kpiCards = Array.from(document.querySelectorAll('.kpi-card'));
        for (const card of kpiCards) {
            const h = card.querySelector('.kpi-header h3');
            if (h && /household/i.test(h.textContent || '')) {
                const valueEl = card.querySelector('.kpi-value');
                if (valueEl) {
                    valueEl.innerHTML = `${count} <span class="unit">Households</span>`;
                }
                break;
            }
        }
    } catch (e) { /* ignore */ }
}

function updateUcoKPIFromHouseholds(data) {
    try {
        const rows = Array.isArray(data) ? data : [];
        const total = rows.reduce((sum, row) => {
            const raw = row?.totalUCODeposited
                ?? row?.totalUcoDeposited
                ?? row?.ucoDeposited
                ?? row?.ucoDeposit
                ?? row?.uco_deposit
                ?? row?.ucoDepositKg
                ?? row?.uco_deposit_kg
                ?? 0;
            const num = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
            return sum + (Number.isFinite(num) ? num : 0);
        }, 0);

        const rounded = Math.round(total * 100) / 100;
        const display = formatNumberWithCommas(rounded);
        const kpiCards = Array.from(document.querySelectorAll('.kpi-card'));
        for (const card of kpiCards) {
            const h = card.querySelector('.kpi-header h3');
            if (h && /total\s+uco/i.test(h.textContent || '')) {
                const valueEl = card.querySelector('.kpi-value');
                if (valueEl) {
                    valueEl.innerHTML = `${display} <span class="unit">kg</span>`;
                }
                break;
            }
        }
    } catch (e) { /* ignore */ }
}
function updateCollectorKPI(count) {
    try {
        const kpiCards = Array.from(document.querySelectorAll('.kpi-card'));
        for (const card of kpiCards) {
            const h = card.querySelector('.kpi-header h3');
            if (h && /collector/i.test(h.textContent || '')) {
                const valueEl = card.querySelector('.kpi-value');
                if (valueEl) {
                    valueEl.innerHTML = `${count} <span class="unit">Collectors</span>`;
                }
                break;
            }
        }
    } catch (e) { /* ignore */ }
}
function getApplicationIdFromRow(row = {}) {
    return row.applicationID || row.applicationId || row.application_id || row.id || '';
}
function getApplicationStatusFromRow(row = {}) {
    return row.applicationStatus || row.status || row.applicationstatus || '';
}
function isIcDetailsColumn(name = '') {
    const key = String(name || '').trim();
    return /ic\s*details|ic_details|icdetail|icimage|ic_image|nric|identity/i.test(key);
}
function renderApplicantTableFromData(data) {
    const table = document.querySelector('.applicant-table');
    if (!table) return;
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;

    if (!Array.isArray(data) || data.length === 0) {
        thead.innerHTML = '<tr><th>No data</th></tr>';
        tbody.innerHTML = '<tr><td>No application records</td></tr>';
        return;
    }

    const columns = Object.keys(data[0]);
    const headerCells = columns.map(col => `<th>${escapeHtml(col)}</th>`).join('');
    thead.innerHTML = `<tr>${headerCells}<th>Action</th></tr>`;

    const rows = data.map(d => {
        const appId = getApplicationIdFromRow(d);
        const appIdNorm = String(appId || '').trim().toUpperCase();
        const cells = columns.map(col => {
            if (isIcDetailsColumn(col)) {
                const raw = d[col];
                let rawText = raw === null || raw === undefined ? '' : String(raw);
                if (!rawText && appIdNorm === 'A-001') {
                    rawText = 'hilman.png';
                }
                const encoded = escapeHtml(encodeURIComponent(rawText));
                const disabled = rawText ? '' : 'disabled';
                return `<td class="ic-details-cell"><button class="btn btn-secondary btn-small ic-view-btn" type="button" data-ic-src="${encoded}" ${disabled}>View</button></td>`;
            }
            const val = d[col];
            return `<td>${escapeHtml(val === null || val === undefined ? '' : String(val))}</td>`;
        }).join('');
        const statusRaw = getApplicationStatusFromRow(d);
        const statusLower = String(statusRaw).toLowerCase();
        const isPending = statusLower.includes('pending');
        const encoded = escapeHtml(encodeURIComponent(JSON.stringify(d)));
        const action = isPending
            ? `<button class="action-accept btn-small" title="Approve" data-application-id="${escapeHtml(appId)}" data-application-status="${escapeHtml(statusRaw)}"><i class="fas fa-check-circle" style="color:#2e9f69"></i></button>
                <button class="action-reject btn-small" title="Reject" data-application-id="${escapeHtml(appId)}" data-application-status="${escapeHtml(statusRaw)}"><i class="fas fa-times-circle" style="color:#e74c3c"></i></button>`
            : `<button class="action-view btn-small" title="View" aria-label="View application" data-application="${encoded}"><i class="fas fa-eye"></i></button>`;
        return `<tr>${cells}<td class="actions-col"><span class="action-group">${action}</span></td></tr>`;
    }).join('\n');

    tbody.innerHTML = rows;
}

function populateApplicantTableFromData(data) {
    applicantFullData = Array.isArray(data) ? data.slice() : [];
    applicantFilteredData = applicantFullData.slice();
    applyApplicantFilters();
}

function updateApplicantKPI(count) {
    try {
        const kpiCards = Array.from(document.querySelectorAll('.kpi-card'));
        for (const card of kpiCards) {
            const h = card.querySelector('.kpi-header h3');
            if (h && /applicant/i.test(h.textContent || '')) {
                const valueEl = card.querySelector('.kpi-value');
                if (valueEl) {
                    valueEl.innerHTML = `${count} <span class="unit">Applications</span>`;
                }
                break;
            }
        }
    } catch (e) { /* ignore */ }
}
function updateStationKPI(count) {
    try {
        const kpiCards = Array.from(document.querySelectorAll('.kpi-card'));
        for (const card of kpiCards) {
            const h = card.querySelector('.kpi-header h3');
            if (h && /station/i.test(h.textContent || '')) {
                const valueEl = card.querySelector('.kpi-value');
                if (valueEl) {
                    valueEl.innerHTML = `${count} <span class="unit">Stations</span>`;
                }
                break;
            }
        }
    } catch (e) { /* ignore */ }
}
function updateTop5RewardsLeaders(householdData) {
    try {
        const tbody = document.querySelector('.leaderboard-table tbody');
        if (!tbody) return;
        
        // Sort by points (highest first) and take top 5
        const sorted = householdData
            .map(h => ({
                id: h.householdID || h.householdId || '',
                name: h.householdName || '',
                points: parseInt(String(h.pointsEarned || h.points || '0').replace(/,/g, '')) || 0
            }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);
        
        // Generate rows
        const rows = sorted.map((h, index) => {
            const rank = index + 1;
            const rankClass = `rank-${rank}`;
            const formattedPoints = h.points.toLocaleString('en-US');
            return `
                <tr>
                    <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                    <td>#${h.id}</td>
                    <td>${formattedPoints}</td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = rows;
    } catch (e) {
        console.error('Error updating leaderboard:', e);
    }
}

function populateAwarenessTable(campaigns) {
    try {
        const tbody = document.getElementById('awareness-tbody') || document.querySelector('#awareness-table tbody');
        if (!tbody) return;
        
        const rows = campaigns.map(c => {
            const id = c.campaignID || '';
            const name = c.campaignName || '';
            const views = c.campaignViews || '0';
            const watchTime = c.averageWatchTime || '0';
            const clickRate = c.clickRate || '0';
            const shares = c.totalShare || '0';
            
            return `
                <tr>
                    <td>#${escapeHtml(id)}</td>
                    <td>${escapeHtml(name)}</td>
                    <td>${escapeHtml(views)}</td>
                    <td>${escapeHtml(watchTime)} seconds</td>
                    <td>${escapeHtml(clickRate)}%</td>
                    <td>${escapeHtml(shares)}</td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = rows;
    } catch (e) {
        console.error('Error populating awareness table:', e);
    }
}

function setupApplicantInteractions() {
    const search = document.getElementById('applicant-search');
    const table = document.querySelector('.applicant-table tbody');
    const filterSelect = document.getElementById('applicant-filter-select');
    if (search && table) {
        search.addEventListener('input', function() {
            applicantSearchQuery = this.value || '';
            applyApplicantFilters();
        });
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            applicantStatusFilter = this.value || 'all';
            applyApplicantFilters();
        });
        filterSelect.value = applicantStatusFilter || 'all';
    }
    const filterBtn = document.getElementById('applicant-filter-sort');
    if (filterBtn && filterSelect) {
        setupFilterDropdown(filterBtn, filterSelect, () => {
            applicantStatusFilter = filterSelect.value || 'all';
            applyApplicantFilters();
        });
    }

    if (table) {
        table.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.action-view');
            if (!viewBtn) return;
            e.preventDefault();
            let rowData = {};
            try {
                const encoded = viewBtn.dataset.application || '';
                if (encoded) rowData = JSON.parse(decodeURIComponent(encoded)) || {};
            } catch (err) {
                rowData = {};
            }
            openApplicantDetails(rowData);
        });
        table.addEventListener('click', (e) => {
            const icBtn = e.target.closest('.ic-view-btn');
            if (!icBtn) return;
            e.preventDefault();
            let src = '';
            try {
                const encoded = icBtn.dataset.icSrc || '';
                src = encoded ? decodeURIComponent(encoded) : '';
            } catch (err) {
                src = '';
            }
            openApplicantIcModal(src);
        });
        table.addEventListener('click', async (e) => {
            const approveBtn = e.target.closest('.action-accept');
            if (!approveBtn) return;
            e.preventDefault();

            const applicationId = approveBtn.dataset.applicationId || '';
            if (!applicationId) return;

            try {
                const adminId = (localStorage.getItem('kolek_admin') || '').trim();
                await approveApplicationInDatabase(applicationId, adminId);
                if (typeof loadApplicationFromDatabase === 'function') {
                    await loadApplicationFromDatabase();
                }
                if (typeof loadCollectorFromDatabase === 'function') {
                    await loadCollectorFromDatabase();
                }
            } catch (err) {
                console.error('Approve application error:', err);
                alert(err.message || 'Failed to approve application');
            }
        });

        table.addEventListener('click', async (e) => {
            const rejectBtn = e.target.closest('.action-reject');
            if (!rejectBtn) return;
            e.preventDefault();

            const applicationId = rejectBtn.dataset.applicationId || '';
            if (!applicationId) return;

            try {
                const adminId = (localStorage.getItem('kolek_admin') || '').trim();
                await rejectApplicationInDatabase(applicationId, adminId);
                if (typeof loadApplicationFromDatabase === 'function') {
                    await loadApplicationFromDatabase();
                }
            } catch (err) {
                console.error('Reject application error:', err);
                alert(err.message || 'Failed to reject application');
            }
        });
    }
    // Export button for applicant data
    const exportBtn = document.getElementById('applicant-export');
    if (exportBtn) exportBtn.addEventListener('click', e => {
        e.preventDefault();
        try {
            const rows = Array.from(document.querySelectorAll('.applicant-table tbody tr')).filter(r => r.style.display !== 'none');
            const header = ['Application ID','Applicant Name','Email Address','Phone Number','Application Date','Status'];
            const dataRows = rows.map(r => {
                const cells = Array.from(r.querySelectorAll('td:not(.actions-col)'));
                return cells.slice(0, 6).map(c => c.textContent.trim());
            });
            window.dashboardAPI.exportApplications({ count: rows.length }).then(resp => {
                exportTableData('applicants_export', header, dataRows);
            }).catch(err => { console.error('Export applicants failed:', err); alert('Export failed — see console'); });
        } catch(err) { console.error('Export applicants handler error', err); alert('Export failed (client error)'); }
    });
}

function openApplicantDetails(data = {}) {
    const modal = document.getElementById('applicant-details-modal');
    if (!modal) return;
    const body = document.getElementById('applicant-details-body');
    if (body) {
        const rows = Object.keys(data).map(key => {
            const val = data[key];
            const safeKey = escapeHtml(String(key));

            // Don't print raw base64 or binary IC image data in the details modal.
            // Instead provide a button that opens the dedicated IC preview modal.
            if (isIcDetailsColumn(key)) {
                const rawText = val === null || val === undefined ? '' : String(val).trim();
                if (rawText) {
                    const encoded = escapeHtml(encodeURIComponent(rawText));
                    return `<div class="details-row"><span class="details-label">${safeKey}</span><span class="details-value"><button class="btn btn-secondary btn-small applicant-details-ic-view" type="button" data-ic-src="${encoded}">View</button></span></div>`;
                }
                return `<div class="details-row"><span class="details-label">${safeKey}</span><span class="details-value">-</span></div>`;
            }

            const safeVal = escapeHtml(val === null || val === undefined ? '' : String(val));
            return `<div class="details-row"><span class="details-label">${safeKey}</span><span class="details-value">${safeVal}</span></div>`;
        }).join('');
        body.innerHTML = rows || '<div class="details-row"><span class="details-label">No data</span><span class="details-value">-</span></div>';

        // Wire up IC view buttons inside the details modal.
        body.querySelectorAll('.applicant-details-ic-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                let src = '';
                try {
                    const encoded = btn.dataset.icSrc || '';
                    src = encoded ? decodeURIComponent(encoded) : '';
                } catch (err) {
                    src = '';
                }
                openApplicantIcModal(src);
            });
        });
    }
    modal.classList.add('show');
    const content = modal.querySelector('.modal-content');
    if (content) content.focus();
}

function normalizeApplicantIcSrc(src = '') {
    const raw = String(src || '').trim();
    if (!raw) return '';

    // Already a data URL
    if (/^data:image\//i.test(raw)) return raw;

    // If backend accidentally returned a JSON stringified Buffer: {"type":"Buffer","data":[...]}
    if (raw.startsWith('{') && raw.includes('"type"') && raw.includes('"Buffer"') && raw.includes('"data"')) {
        try {
            const obj = JSON.parse(raw);
            if (obj && obj.type === 'Buffer' && Array.isArray(obj.data)) {
                // Use a binary string to avoid spreading huge arrays.
                let binary = '';
                for (let i = 0; i < obj.data.length; i++) binary += String.fromCharCode(obj.data[i]);
                const base64 = btoa(binary);
                return `data:image/png;base64,${base64}`;
            }
        } catch (e) {
            // ignore
        }
    }

    // Base64-only content (no data: prefix)
    if (raw.length > 200 && /^[A-Za-z0-9+/=\r\n]+$/.test(raw)) {
        const cleaned = raw.replace(/\s+/g, '');
        // Heuristic mime sniff based on common base64 headers
        // JPEG often starts with /9j/ ; PNG starts with iVBORw0KGgo
        const mime = cleaned.startsWith('/9j/') ? 'image/jpeg'
            : cleaned.startsWith('iVBORw0KGgo') ? 'image/png'
            : cleaned.startsWith('R0lGOD') ? 'image/gif'
            : 'image/png';
        return `data:${mime};base64,${cleaned}`;
    }

    // Filename or relative path
    if (/\.(png|jpe?g|gif|webp)$/i.test(raw)) {
        const normalized = raw.replace(/\\/g, '/');
        if (/^https?:\/\//i.test(normalized) || normalized.startsWith('/')) return normalized;
        if (normalized.startsWith('uploads/')) return `/${normalized}`;
        return `/${normalized}`;
    }

    return raw;
}

function openApplicantIcModal(src = '') {
    const modal = document.getElementById('applicant-ic-modal');
    const img = document.getElementById('applicant-ic-image');
    const empty = document.getElementById('applicant-ic-empty');
    if (!modal || !img || !empty) return;
    const safeSrc = normalizeApplicantIcSrc(src);
    if (safeSrc) {
        img.src = safeSrc;
        img.style.display = 'block';
        empty.style.display = 'none';
    } else {
        img.removeAttribute('src');
        img.style.display = 'none';
        empty.style.display = 'block';
    }
    modal.classList.add('show');
    const content = modal.querySelector('.modal-content');
    if (content) content.focus();
    function onKey(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            closeApplicantIcModal();
            document.removeEventListener('keydown', onKey);
        }
    }
    document.addEventListener('keydown', onKey);
    modal._onKey = onKey;
}

function closeApplicantIcModal() {
    const modal = document.getElementById('applicant-ic-modal');
    if (!modal) return;
    modal.classList.remove('show');
    try { if (modal._onKey) { document.removeEventListener('keydown', modal._onKey); delete modal._onKey; } } catch(e) {}
}

function closeApplicantDetails() {
    const modal = document.getElementById('applicant-details-modal');
    if (modal) modal.classList.remove('show');
}

function setupReportInteractions() {
    const search = document.getElementById('report-search');
    const table = document.querySelector('.report-table tbody');
    const filterSelect = document.getElementById('report-filter-select');
    if (search && table) {
        search.addEventListener('input', function() {
            reportSearchQuery = this.value || '';
            applyReportRowFilters();
        });
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            reportStatusFilter = this.value || 'all';
            applyReportRowFilters();
        });
        filterSelect.value = reportStatusFilter || 'all';
    }
    const filterBtn = document.getElementById('report-filter-sort');
    if (filterBtn && filterSelect) {
        setupFilterDropdown(filterBtn, filterSelect, () => {
            reportStatusFilter = filterSelect.value || 'all';
            applyReportRowFilters();
        });
    } else if (filterBtn && table) {
        filterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const options = ['all', 'pending', 'reviewed'];
            const labels = { all: 'All', pending: 'Pending', reviewed: 'Reviewed' };
            const idx = options.indexOf(reportStatusFilter);
            reportStatusFilter = options[(idx + 1) % options.length];
            filterBtn.title = `Filter: ${labels[reportStatusFilter] || 'All'}`;
            applyReportRowFilters();
        });
        if (!filterBtn.title) {
            filterBtn.title = 'Filter: All';
        }
    }
    // Refresh button -> reload the page and return to Report tab
    const refreshBtn = document.getElementById('report-refresh');
    if (refreshBtn) refreshBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const btn = this;
        if (btn.disabled || btn.dataset.refreshing === 'true') return;
        btn.dataset.refreshing = 'true';
        btn.disabled = true;
        try {
            btn.style.transform = 'rotate(0deg)';
            btn.style.transition = 'transform 0.6s ease';
            setTimeout(() => { btn.style.transform = 'rotate(360deg)'; }, 10);
            const tableEl = document.querySelector('.report-table');
            if (tableEl) {
                tableEl.style.transition = 'box-shadow 0.25s ease, transform 0.25s ease';
                tableEl.style.transform = 'translateY(-4px)';
                tableEl.style.boxShadow = '0 12px 34px rgba(0,0,0,0.08)';
                setTimeout(() => { tableEl.style.transform = ''; tableEl.style.boxShadow = ''; }, 400);
            }
            setTimeout(() => {
                try { localStorage.setItem('kolek_active_page', 'report'); } catch (e) {}
                btn.dataset.refreshing = 'false';
                btn.disabled = false;
                window.location.reload();
            }, 650);
        } catch (err) {
            console.error('Report refresh error', err);
            btn.dataset.refreshing = 'false';
            btn.disabled = false;
        }
    });
    // Export button -> Use selected format
    const exportBtn = document.getElementById('report-export');
    if (exportBtn) exportBtn.addEventListener('click', e => {
        e.preventDefault();
        try {
            const rows = Array.from(document.querySelectorAll('.report-table tbody tr')).filter(r => r.style.display !== 'none');
            const header = ['Report ID','Collector ID','Date and Time','Report Type','Status'];
            const dataRows = rows.map(r => {
                const cells = Array.from(r.querySelectorAll('td'));
                return cells.slice(0,5).map(c => c.textContent.trim());
            });
            window.dashboardAPI.exportReports({ count: rows.length }).then(resp => {
                exportTableData('reports_export', header, dataRows);
            }).catch(err => { console.error('Export reports failed:', err); alert('Export failed — see console'); });
        } catch(err) { console.error('Export reports handler error', err); alert('Export failed (client error)'); }
    });
    // Report 'View' -> open report modal (delegate for dynamic rows)
    const reportTable = document.querySelector('.report-table');
    if (reportTable && !reportTable.dataset.viewBound) {
        reportTable.dataset.viewBound = '1';
        reportTable.addEventListener('click', async function(e) {
            const link = e.target.closest('.view-details');
            if (!link) return;
            e.preventDefault();
            const row = link.closest('tr');
            if (!row) return;

            let rowData = {};
            try {
                rowData = JSON.parse(row.dataset.reportData || '{}') || {};
            } catch (err) {
                rowData = {};
            }

            const cellText = (idx) => {
                const cell = row.querySelector('td:nth-child(' + idx + ')');
                return cell ? cell.textContent.trim() : '';
            };

            const pick = (obj, keys, fallback) => {
                if (!obj) return fallback || '';
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
                }
                return fallback || '';
            };

            const formatId = (value) => {
                if (value === undefined || value === null) return '';
                const str = String(value).trim();
                if (!str) return '';
                return str.startsWith('#') ? str : '#' + str;
            };

            const formatDateTime = (value) => {
                if (!value) return '';
                const dt = new Date(value);
                if (!isNaN(dt)) {
                    return dt.toLocaleDateString('en-GB') + ' ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                }
                return String(value);
            };

            const reportType = String(pick(rowData, ['reportType','type','report_type','categoryType'], cellText(4))).trim();
            const reportTypeLower = reportType.toLowerCase();
            const reportIdRaw = String(pick(rowData, ['reportID','reportId','id','report_id'], cellText(1))).trim();
            const reportIdForApi = reportIdRaw.replace(/^#/, '');
            const details = {
                id: formatId(reportIdRaw),
                type: reportType,
                collector: formatId(pick(rowData, ['collectorID','collectorId','collector_id','collector'], cellText(2))),
                date: formatDateTime(pick(rowData, ['dateTime','reportDateTime','reportDate','date','createdAt'], cellText(3))),
                collectionId: formatId(pick(rowData, ['collectionID','collectionId','collection_id'], '')),
                location: pick(rowData, ['location','reportLocation','accidentLocation','collectionLocation','address'], '-'),
                accidentType: pick(rowData, ['accidentType','typeOfAccident','typeofAccident','accident_type'], '-'),
                missReason: pick(rowData, ['missReason','missingReason','reason','collectionIssue','missedReason'], '-'),
                title: pick(rowData, ['title','reportTitle','manualTitle','subject'], '-'),
                category: pick(rowData, ['category','reportCategory','manualCategory'], '-'),
                description: pick(rowData, ['reportDesc','description','briefDescription','details','reportDescription','reportDetail','notes'], '-')
            };

            if (reportIdForApi && (reportTypeLower.includes('accident') || reportTypeLower.includes('collection') || reportTypeLower.includes('manual'))) {
                try {
                    const url = `http://localhost:3001/api/report-details?reportId=${encodeURIComponent(reportIdForApi)}&type=${encodeURIComponent(reportTypeLower)}`;
                    const resp = await fetch(url);
                    if (resp.ok) {
                        const payload = await resp.json();
                        const dbRow = (payload && payload.data) ? payload.data : null;
                        if (dbRow) {
                            details.collectionId = formatId(pick(dbRow, ['collectionID','collectionId','collection_id'], details.collectionId));
                            details.location = pick(dbRow, ['location','reportLocation','accidentLocation','collectionLocation','address'], details.location);
                            details.accidentType = pick(dbRow, ['accidentType','typeOfAccident','typeofAccident','accident_type'], details.accidentType);
                            details.missReason = pick(dbRow, ['missReason','missingReason','reason','collectionIssue','missedReason'], details.missReason);
                            details.title = pick(dbRow, ['title','reportTitle','manualTitle','subject'], details.title);
                            details.category = pick(dbRow, ['category','reportCategory','manualCategory'], details.category);
                            details.description = pick(dbRow, ['description','briefDescription','details','reportDescription','reportDetail','notes'], details.description);
                        }
                    }
                } catch (err) {
                    console.error('Report details fetch error', err);
                }
            }

            openReportDetails(details);
        });
    }
    // View details removed from markup — no event handlers required
}
// Report details modal helpers
function openReportDetails(data = {}) {
    const modal = document.getElementById('report-details-modal');
    if (!modal) return;
    try {
        const setText = (id, value, fallback) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (value === undefined || value === null || value === '') {
                el.textContent = fallback || '-';
            } else {
                el.textContent = value;
            }
        };
        setText('rd-report-id', data.id, '#-');
        setText('rd-report-type', data.type, 'Report');
        setText('rd-collector-id', data.collector, '#-');
        setText('rd-date', data.date, '-');
        setText('rd-location', data.location, '-');
        setText('rd-accident-type', data.accidentType, '-');
        setText('rd-collection-id', data.collectionId, '-');
        setText('rd-miss-reason', data.missReason, '-');
        setText('rd-title', data.title, '-');
        setText('rd-category', data.category, '-');
        setText('rd-description', data.description, '-');

        const header = modal.querySelector('.modal-header h2');
        if (header) header.textContent = data.type || 'Report Details';
        modal.dataset.reportId = data.id || '';
    } catch (e) { /* ignore */ }
    // Toggle which fields are visible based on type
    const typeVal = (data.type || '').toLowerCase();
    const labelCollection = document.getElementById('label-collection-id');
    const fieldCollection = document.getElementById('rd-collection-id');
    const labelMiss = document.getElementById('label-miss-reason');
    const fieldMiss = document.getElementById('rd-miss-reason');
    const labelLocation = document.getElementById('label-location');
    const fieldLocation = document.getElementById('rd-location');
    const labelAccType = document.getElementById('label-accident-type');
    const fieldAccType = document.getElementById('rd-accident-type');
    const labelTitle = document.getElementById('label-title');
    const fieldTitle = document.getElementById('rd-title');
    const labelCategory = document.getElementById('label-category');
    const fieldCategory = document.getElementById('rd-category');
    const markBtn = document.getElementById('report-mark-resolved');
    const contactBtn = document.getElementById('report-contact-collector');
    if (typeVal.includes('collection')) {
        // show collection-specific
        if (labelCollection) labelCollection.style.display = '';
        if (fieldCollection) fieldCollection.style.display = '';
        if (labelMiss) labelMiss.style.display = '';
        if (fieldMiss) fieldMiss.style.display = '';
        // hide accident fields
        if (labelLocation) labelLocation.style.display = 'none';
        if (fieldLocation) fieldLocation.style.display = 'none';
        if (labelAccType) labelAccType.style.display = 'none';
        if (fieldAccType) fieldAccType.style.display = 'none';
        // hide manual fields
        if (labelTitle) labelTitle.style.display = 'none';
        if (fieldTitle) fieldTitle.style.display = 'none';
        if (labelCategory) labelCategory.style.display = 'none';
        if (fieldCategory) fieldCategory.style.display = 'none';
        // actions: show both Mark as Resolved and Contact Collector for collection reports
        if (markBtn) markBtn.style.display = 'inline-block';
        if (contactBtn) contactBtn.style.display = 'inline-block';
    } else if (typeVal.includes('manual')) {
        // manual report -> show title + category
        // hide collection-specific
        if (labelCollection) labelCollection.style.display = 'none';
        if (fieldCollection) fieldCollection.style.display = 'none';
        if (labelMiss) labelMiss.style.display = 'none';
        if (fieldMiss) fieldMiss.style.display = 'none';
        // hide accident fields
        if (labelLocation) labelLocation.style.display = 'none';
        if (fieldLocation) fieldLocation.style.display = 'none';
        if (labelAccType) labelAccType.style.display = 'none';
        if (fieldAccType) fieldAccType.style.display = 'none';
        // show manual specific
        if (labelTitle) labelTitle.style.display = '';
        if (fieldTitle) fieldTitle.style.display = '';
        if (labelCategory) labelCategory.style.display = '';
        if (fieldCategory) fieldCategory.style.display = '';
        // show both action buttons for manual reports
        if (markBtn) markBtn.style.display = 'inline-block';
        if (contactBtn) contactBtn.style.display = 'inline-block';
    } else {
        // default / accident view: show accident fields, hide collection-specific
        if (labelCollection) labelCollection.style.display = '';
        if (fieldCollection) fieldCollection.style.display = '';
        if (labelMiss) labelMiss.style.display = 'none';
        if (fieldMiss) fieldMiss.style.display = 'none';
        if (labelLocation) labelLocation.style.display = '';
        if (fieldLocation) fieldLocation.style.display = '';
        if (labelAccType) labelAccType.style.display = '';
        if (fieldAccType) fieldAccType.style.display = '';
        // hide manual fields
        if (labelTitle) labelTitle.style.display = 'none';
        if (fieldTitle) fieldTitle.style.display = 'none';
        if (labelCategory) labelCategory.style.display = 'none';
        if (fieldCategory) fieldCategory.style.display = 'none';
        if (markBtn) markBtn.style.display = 'inline-block';
        if (contactBtn) contactBtn.style.display = 'inline-block';
    }
    modal.classList.add('show');
    const content = modal.querySelector('.modal-content');
    if (content) content.focus();
    function onKey(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            closeReportDetails();
            document.removeEventListener('keydown', onKey);
        }
    }
    document.addEventListener('keydown', onKey);
    modal._onKey = onKey;
}
function closeReportDetails() {
    const modal = document.getElementById('report-details-modal');
    if (!modal) return;
    modal.classList.remove('show');
    try { if (modal._onKey) { document.removeEventListener('keydown', modal._onKey); delete modal._onKey; } } catch(e) {}
}
// attach close handlers
document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('report-details-close');
    if (closeBtn) closeBtn.addEventListener('click', e => { e.preventDefault(); closeReportDetails(); });
    const modal = document.getElementById('report-details-modal');
    if (modal) modal.addEventListener('click', function(e) { if (e.target === this) closeReportDetails(); });
    const applicantClose = document.getElementById('applicant-details-close');
    if (applicantClose) applicantClose.addEventListener('click', e => { e.preventDefault(); closeApplicantDetails(); });
    const applicantModal = document.getElementById('applicant-details-modal');
    if (applicantModal) applicantModal.addEventListener('click', function(e) { if (e.target === this) closeApplicantDetails(); });
    const applicantIcClose = document.getElementById('applicant-ic-close');
    if (applicantIcClose) applicantIcClose.addEventListener('click', e => { e.preventDefault(); closeApplicantIcModal(); });
    const applicantIcModal = document.getElementById('applicant-ic-modal');
    if (applicantIcModal) applicantIcModal.addEventListener('click', function(e) { if (e.target === this) closeApplicantIcModal(); });
    const markBtn = document.getElementById('report-mark-resolved');
    if (markBtn) markBtn.addEventListener('click', async e => {
        e.preventDefault();
        const reportModal = document.getElementById('report-details-modal');
        const reportId = reportModal ? (reportModal.dataset.reportId || '').trim() : '';
        const cleanId = reportId.replace(/^#/, '');
        try {
            if (cleanId) {
                const adminId = localStorage.getItem('kolek_admin') || '';
                const resp = await fetch(`/api/report/${encodeURIComponent(cleanId)}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Reviewed', adminId })
                });
                if (!resp.ok) {
                    throw new Error(`Failed to update report status (${resp.status})`);
                }
            }
        } catch (err) {
            console.error('Report status update failed', err);
        }

        const tbody = document.querySelector('.report-table tbody');
        if (reportId && tbody) {
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const normalizedTarget = reportId.replace(/\s+/g, '');
            rows.forEach(row => {
                const idCell = row.querySelector('td:nth-child(1)');
                const statusCell = row.querySelector('td:nth-child(5)');
                if (!idCell || !statusCell) return;
                const rowId = idCell.textContent.trim().replace(/\s+/g, '');
                if (rowId === normalizedTarget) {
                    statusCell.textContent = 'Reviewed';
                    statusCell.className = 'status reviewed';
                    try {
                        const rowData = JSON.parse(row.dataset.reportData || '{}') || {};
                        rowData.status = 'Reviewed';
                        row.dataset.reportData = JSON.stringify(rowData);
                    } catch (err) {}
                }
            });
            applyReportRowFilters();
        }
        if (typeof loadReportFromDatabase === 'function') {
            loadReportFromDatabase().then(() => applyReportRowFilters()).catch(err => console.error('Report reload error', err));
        }
        closeReportDetails();
    });
    const contactBtn = document.getElementById('report-contact-collector');
    if (contactBtn) contactBtn.addEventListener('click', e => { e.preventDefault(); alert('Contacting collector (demo)'); });
});
let themeAutoTimer = null;
function getStoredThemeMode(){
    try { return localStorage.getItem('settings:themeMode'); } catch (e) { return null; }
}
function setStoredThemeMode(mode){
    try { localStorage.setItem('settings:themeMode', mode); } catch (e) {}
}
function getAutoThemeModeByTime(date = new Date()){
    const hour = date.getHours();
    return (hour >= 18 || hour < 6) ? 'dark' : 'light';
}
function applyThemeMode(mode){
    const body = document.body;
    if (!body) return;
    body.classList.toggle('theme-dark', mode === 'dark');
}
function syncThemeToggle(mode){
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    if (mode === 'dark') themeToggle.checked = true;
    else if (mode === 'light') themeToggle.checked = false;
    else themeToggle.checked = getAutoThemeModeByTime() === 'dark';
}
function stopAutoThemeTimer(){
    if (themeAutoTimer){
        clearInterval(themeAutoTimer);
        themeAutoTimer = null;
    }
}
function startAutoThemeTimer(){
    stopAutoThemeTimer();
    themeAutoTimer = setInterval(() => {
        const mode = getStoredThemeMode();
        if (mode !== 'auto') return;
        const autoMode = getAutoThemeModeByTime();
        applyThemeMode(autoMode);
        syncThemeToggle('auto');
    }, 5 * 60 * 1000);
}
function initThemeMode(){
    if (!document.querySelector('.dashboard-container')) return;
    let mode = getStoredThemeMode();
    if (!mode){
        mode = 'auto';
        setStoredThemeMode('auto');
    }
    if (mode === 'auto'){
        const autoMode = getAutoThemeModeByTime();
        applyThemeMode(autoMode);
        syncThemeToggle('auto');
        startAutoThemeTimer();
    } else {
        applyThemeMode(mode);
        syncThemeToggle(mode);
        stopAutoThemeTimer();
    }
}

let sessionTimeoutMinutes = null;
let sessionTimeoutTimer = null;
let sessionTimeoutBound = false;

function normalizeSessionTimeoutValue(value) {
    if (value === 'none') return null;
    const minutes = parseInt(value, 10);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : 30;
}

function getStoredSessionTimeout() {
    try {
        return localStorage.getItem('settings:sessionTimeout') || 'none';
    } catch (e) {
        return 'none';
    }
}

function handleSessionTimeout() {
    try {
        localStorage.removeItem('kolek_auth');
        localStorage.removeItem('kolek_admin');
    } catch (e) {}
    window.location.href = 'index.html';
}

function clearSessionTimeoutTimer() {
    if (sessionTimeoutTimer) {
        clearTimeout(sessionTimeoutTimer);
        sessionTimeoutTimer = null;
    }
}

function startSessionTimeoutTimer() {
    clearSessionTimeoutTimer();
    if (sessionTimeoutMinutes === null) return;
    sessionTimeoutTimer = setTimeout(handleSessionTimeout, sessionTimeoutMinutes * 60 * 1000);
}

function resetSessionTimeoutTimer() {
    startSessionTimeoutTimer();
}

function bindSessionTimeoutActivity() {
    if (sessionTimeoutBound) return;
    sessionTimeoutBound = true;
    const reset = () => resetSessionTimeoutTimer();
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(eventName => {
        window.addEventListener(eventName, reset, { passive: true });
    });
}

function applySessionTimeoutSetting(value) {
    sessionTimeoutMinutes = normalizeSessionTimeoutValue(value);
    startSessionTimeoutTimer();
}

function initSessionTimeout() {
    if (!document.querySelector('.dashboard-container')) return;
    const stored = getStoredSessionTimeout();
    applySessionTimeoutSetting(stored);
    bindSessionTimeoutActivity();
}

function setupSettingsInteractions(){
    if (setupSettingsInteractions._initialized) return;
    setupSettingsInteractions._initialized = true;
    
    // theme toggle and CO2 toggle - persist state to localStorage as demo
    const themeToggle = document.getElementById('theme-toggle');
    const co2Toggle = document.getElementById('co2-toggle');
    const routeAuto = document.getElementById('route-auto');
    const routeOptimizationRow = document.getElementById('route-optimization-mode-row');
    const routeOptimizationValue = document.getElementById('route-optimization-mode-value');

    function renderRouteOptimizationMode() {
        if (!routeOptimizationValue) return;
        const currentMode = getStoredRouteOptimizationMode();
        routeOptimizationValue.textContent = `${getRouteOptimizationModeLabel(currentMode)} ›`;
        routeOptimizationValue.title = `Current mode: ${getRouteOptimizationModeLabel(currentMode)}`;
    }

    function cycleRouteOptimizationMode() {
        const currentMode = getStoredRouteOptimizationMode();
        const currentIndex = ROUTE_OPTIMIZATION_MODES.indexOf(currentMode);
        const nextMode = ROUTE_OPTIMIZATION_MODES[(currentIndex + 1) % ROUTE_OPTIMIZATION_MODES.length] || 'distance';
        setStoredRouteOptimizationMode(nextMode);
        renderRouteOptimizationMode();
    }
    // load saved state
    try {
        const storedMode = getStoredThemeMode();
        if (themeToggle) {
            if (storedMode === 'dark') themeToggle.checked = true;
            else if (storedMode === 'light') themeToggle.checked = false;
            else themeToggle.checked = getAutoThemeModeByTime() === 'dark';
        }
        if (co2Toggle && localStorage.getItem('settings:co2') === '1') co2Toggle.checked = true;
        if (routeAuto && localStorage.getItem('settings:routeAuto') === '1') routeAuto.checked = true;
        if (!localStorage.getItem(ROUTE_OPTIMIZATION_MODE_KEY)) {
            localStorage.setItem(ROUTE_OPTIMIZATION_MODE_KEY, 'distance');
        }
    } catch (e) { /* ignore private modes */ }
    renderRouteOptimizationMode();
    if (themeToggle) themeToggle.addEventListener('change', function(){
        const mode = this.checked ? 'dark' : 'light';
        setStoredThemeMode(mode);
        applyThemeMode(mode);
        stopAutoThemeTimer();
    });
    if (co2Toggle) co2Toggle.addEventListener('change', function(){
        try{ localStorage.setItem('settings:co2', this.checked ? '1' : '0'); }catch(e){}
    });
    if (routeAuto) routeAuto.addEventListener('change', function(){
        try{ localStorage.setItem('settings:routeAuto', this.checked ? '1' : '0'); }catch(e){}
    });
    if (routeOptimizationRow) {
        routeOptimizationRow.addEventListener('click', function(e){
            e.preventDefault();
            cycleRouteOptimizationMode();
        });
    }
    // extra selects and simple persistence for demo
    const lang = document.getElementById('setting-language');
    const dtfmt = document.getElementById('setting-datetime');
    const region = document.getElementById('setting-region');
    const rformat = document.getElementById('setting-report-format');
    const schedule = document.getElementById('setting-schedule');
    const sessionTimeout = document.getElementById('setting-session-timeout');
    try {
        if (lang && localStorage.getItem('settings:language')) lang.value = localStorage.getItem('settings:language');
        if (dtfmt && localStorage.getItem('settings:datetime')) dtfmt.value = localStorage.getItem('settings:datetime');
        if (region && localStorage.getItem('settings:region')) region.value = localStorage.getItem('settings:region');
        if (rformat && localStorage.getItem('settings:reportFormat')) rformat.value = localStorage.getItem('settings:reportFormat');
        if (schedule && localStorage.getItem('settings:schedule')) schedule.value = localStorage.getItem('settings:schedule');
        if (sessionTimeout) sessionTimeout.value = getStoredSessionTimeout();
    } catch(e){}
    // Update export button texts based on current format setting
    updateAllExportButtonTexts();
    if (lang) lang.addEventListener('change', function(){
        try{
            localStorage.setItem('settings:language', this.value);
            const langMap = { 'English': 'en', 'Bahasa': 'bahasa', '中文': 'zh' };
            const selectedLang = langMap[this.value] || 'en';
            applyLanguageTranslations(selectedLang);
        } catch(e){
            console.error('Language change error:', e);
        }
    });
    if (dtfmt) dtfmt.addEventListener('change', function(){ try{ localStorage.setItem('settings:datetime', this.value); }catch(e){} });
    if (region) region.addEventListener('change', function(){ try{ localStorage.setItem('settings:region', this.value); }catch(e){} });
    if (rformat) rformat.addEventListener('change', function(){ try{ localStorage.setItem('settings:reportFormat', this.value); updateAllExportButtonTexts(); }catch(e){} });
    if (schedule) schedule.addEventListener('change', function(){ try{ localStorage.setItem('settings:schedule', this.value); }catch(e){} });

    // Custom Report Header interactions
    try {
        const editBtn = document.getElementById('custom-report-header-edit');
        const previewInline = document.getElementById('custom-report-header-preview');
        const modal = document.getElementById('custom-report-header-modal');
        const modalClose = document.getElementById('custom-report-header-close');
        const inpTitle = document.getElementById('setting-report-header-title');
        const inpSubtitle = document.getElementById('setting-report-header-subtitle');
        const inpLogo = document.getElementById('setting-report-header-logo'); // hidden, holds data URL when uploaded
        const logoFileInput = document.getElementById('setting-report-header-logo-file');
        const logoFileName = document.getElementById('setting-report-header-logo-name');
        const btnSave = document.getElementById('setting-report-header-save');
        const btnCancel = document.getElementById('setting-report-header-cancel');
        const previewLogo = document.getElementById('preview-logo');
        const previewTitle = document.getElementById('preview-title');
        const previewSubtitle = document.getElementById('preview-subtitle');
        const modalPreview = document.getElementById('custom-report-header-modal-preview');

        function getSavedHeader() {
            try {
                const raw = localStorage.getItem('settings:reportHeader');
                if (!raw) return null;
                return JSON.parse(raw);
            } catch (e) { return null; }
        }

        function applyInlinePreview(obj) {
            if (!previewInline) return;
            if (!obj || (!obj.title && !obj.subtitle)) {
                previewInline.textContent = 'Not set';
                return;
            }
            const t = obj.title || '';
            const s = obj.subtitle ? ` — ${obj.subtitle}` : '';
            previewInline.textContent = `${t}${s}`;
        }

        function applyModalPreview(obj) {
            if (previewLogo) {
                const logoVal = obj && obj.logo ? String(obj.logo) : '';
                if (logoVal) {
                    // logoVal may be a data URL or plain URL; render as image src
                    previewLogo.innerHTML = `<img src="${escapeHtml(logoVal)}" alt="logo" style="height:40px;object-fit:contain;">`;
                } else previewLogo.innerHTML = '';
            }
            if (previewTitle) previewTitle.textContent = obj?.title || '';
            if (previewSubtitle) previewSubtitle.textContent = obj?.subtitle || '';
        }

        // initialize inline preview
        try { applyInlinePreview(getSavedHeader()); } catch (e) {}

        if (editBtn) editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const saved = getSavedHeader() || {};
            if (inpTitle) inpTitle.value = saved.title || '';
            if (inpSubtitle) inpSubtitle.value = saved.subtitle || '';
            // saved.logo may be a data URL or URL; place into hidden field
            if (inpLogo) inpLogo.value = saved.logo || '';
            if (logoFileName) logoFileName.textContent = saved.logo ? (saved.logo.length > 64 ? '(uploaded image)' : '(logo set)') : '';
            applyModalPreview(saved);
            if (modal) modal.classList.add('show');
            const content = modal?.querySelector('.modal-content'); if (content) content.focus();
        });

        if (modalClose) modalClose.addEventListener('click', (e) => { e.preventDefault(); if (modal) modal.classList.remove('show'); });
        if (btnCancel) btnCancel.addEventListener('click', (e) => { e.preventDefault(); if (modal) modal.classList.remove('show'); });

        // live preview on input
        if (inpTitle) inpTitle.addEventListener('input', () => applyModalPreview({ title: inpTitle.value, subtitle: inpSubtitle?.value, logo: inpLogo?.value }));
        if (inpSubtitle) inpSubtitle.addEventListener('input', () => applyModalPreview({ title: inpTitle?.value, subtitle: inpSubtitle.value, logo: inpLogo?.value }));
        // file input handling: read file as data URL and place into hidden inpLogo
        if (logoFileInput) {
            logoFileInput.addEventListener('change', function() {
                const f = this.files && this.files[0];
                if (!f) {
                    if (logoFileName) logoFileName.textContent = '';
                    if (inpLogo) inpLogo.value = '';
                    applyModalPreview({ title: inpTitle?.value, subtitle: inpSubtitle?.value, logo: '' });
                    return;
                }
                if (logoFileName) logoFileName.textContent = f.name || '(uploaded image)';
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const dataUrl = ev.target.result;
                    try { if (inpLogo) inpLogo.value = dataUrl; } catch(e){}
                    applyModalPreview({ title: inpTitle?.value, subtitle: inpSubtitle?.value, logo: dataUrl });
                };
                reader.readAsDataURL(f);
            });
        }

        if (btnSave) btnSave.addEventListener('click', (e) => {
            e.preventDefault();
            try {
                const obj = { title: inpTitle?.value?.trim() || '', subtitle: inpSubtitle?.value?.trim() || '', logo: (inpLogo?.value && String(inpLogo.value).trim()) || '' };
                localStorage.setItem('settings:reportHeader', JSON.stringify(obj));
                applyInlinePreview(obj);
            } catch (err) { console.error('Saving report header failed', err); }
            if (modal) modal.classList.remove('show');
        });

        // close modal when clicking backdrop
        if (modal) modal.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });
    } catch (e) { console.error('Custom report header init failed', e); }
    if (sessionTimeout) sessionTimeout.addEventListener('change', function(){
        try { localStorage.setItem('settings:sessionTimeout', this.value); } catch (e) {}
        applySessionTimeoutSetting(this.value);
    });
    // logout action: clear demo auth and redirect to login
    const logoutBtn = document.getElementById('logout-action');
    if (logoutBtn){
        logoutBtn.addEventListener('click', function(e){
            e.preventDefault();
            if (!confirm('Log out now?')) return;
            try{ localStorage.removeItem('kolek_auth'); localStorage.removeItem('kolek_admin'); }catch(e){}
            // redirect back to login page
            window.location.href = 'index.html';
        });
    }
    // Activity Log interactions
    try {
        const activityLogLink = document.getElementById('activity-log-link');
        const activityLogModal = document.getElementById('activity-log-modal');
        const activityLogClose = document.getElementById('activity-log-close');
        const activityLogTableBody = document.getElementById('activity-log-table-body');
        const activityLogEmpty = document.getElementById('activity-log-empty');
        const activityLogRefresh = document.getElementById('activity-log-refresh-btn');
        const activityLogAdminFilter = document.getElementById('activity-log-admin-filter');

        async function loadActivityLog() {
            try {
                if (!activityLogTableBody) return;
                activityLogTableBody.innerHTML = '<tr style="height: 40px;"><td colspan="5" style="text-align: center; color: var(--text-light); padding: 20px;">Loading...</td></tr>';
                
                const adminIdFilter = activityLogAdminFilter?.value || '';
                const url = `/api/activity-log?limit=200${adminIdFilter ? '&adminId=' + encodeURIComponent(adminIdFilter) : ''}`;
                
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const logs = await response.json();
                
                if (!logs || logs.length === 0) {
                    activityLogTableBody.innerHTML = '';
                    if (activityLogEmpty) activityLogEmpty.style.display = 'block';
                    return;
                }
                
                if (activityLogEmpty) activityLogEmpty.style.display = 'none';
                
                activityLogTableBody.innerHTML = logs.map(log => {
                    const adminId = log.adminID || 'Unknown';
                    const action = log.action || '-';
                    const resource = log.resource || '-';
                    let details = log.details || '';
                    try {
                        if (typeof details === 'string' && details.startsWith('{')) {
                            details = JSON.parse(details);
                            details = JSON.stringify(details).substring(0, 100) + (JSON.stringify(details).length > 100 ? '...' : '');
                        } else if (typeof details === 'string') {
                            details = details.substring(0, 100) + (details.length > 100 ? '...' : '');
                        }
                    } catch (e) {
                        details = String(details || '').substring(0, 100);
                    }
                    const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : '-';
                    
                    return `<tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 12px; color: var(--text-dark);">${escapeHtml(adminId)}</td>
                        <td style="padding: 12px; color: var(--text-dark);">${escapeHtml(action)}</td>
                        <td style="padding: 12px; color: var(--text-dark);">${escapeHtml(resource)}</td>
                        <td style="padding: 12px; color: var(--text-light); font-size: 12px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(String(details))}">${escapeHtml(String(details))}</td>
                        <td style="padding: 12px; color: var(--text-light); font-size: 12px;">${escapeHtml(timestamp)}</td>
                    </tr>`;
                }).join('');
            } catch (error) {
                console.error('Error loading activity log:', error);
                if (activityLogTableBody) {
                    activityLogTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-danger); padding: 20px;">Error loading activity log: ' + escapeHtml(error.message) + '</td></tr>';
                }
            }
        }

        async function loadAdminList() {
            try {
                const response = await fetch('/api/admin', { cache: 'no-store' });
                if (response.ok) {
                    const admins = await response.json();
                    if (activityLogAdminFilter && admins && admins.length > 0) {
                        const currentValue = activityLogAdminFilter.value;
                        const newOptions = [{ label: 'All Admins', value: '' }, ...admins.map(a => {
                            const id = a.adminID || a.adminId || a.id || '';
                            const name = a.adminName || a.name || a.fullName || a.fullname || '';
                            return { label: name ? `${name} (${id})` : id, value: id };
                        })];
                        activityLogAdminFilter.innerHTML = newOptions.map(opt => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join('');
                        if (currentValue) activityLogAdminFilter.value = currentValue;
                    }
                }
            } catch (error) {
                console.error('Error loading admin list:', error);
            }
        }

        if (activityLogLink) {
            activityLogLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (activityLogModal) {
                    activityLogModal.classList.add('show');
                    loadAdminList().then(() => loadActivityLog());
                    const content = activityLogModal.querySelector('.modal-content');
                    if (content) content.focus();
                }
            });
        }

        if (activityLogClose) {
            activityLogClose.addEventListener('click', (e) => {
                e.preventDefault();
                if (activityLogModal) activityLogModal.classList.remove('show');
            });
        }

        if (activityLogModal) {
            activityLogModal.addEventListener('click', function(e) {
                if (e.target === this) this.classList.remove('show');
            });
        }

        if (activityLogRefresh) {
            activityLogRefresh.addEventListener('click', (e) => {
                e.preventDefault();
                loadActivityLog();
            });
        }

        if (activityLogAdminFilter) {
            activityLogAdminFilter.addEventListener('change', () => {
                loadActivityLog();
            });
        }
    } catch (e) { console.error('Activity log init failed', e); }
    
    // Reset Password interactions
    try {
        const resetPasswordLink = document.getElementById('reset-password-link');
        const resetPasswordModal = document.getElementById('reset-password-modal');
        const resetPasswordClose = document.getElementById('reset-password-close');
        const resetPasswordCancel = document.getElementById('reset-password-cancel');
        const resetPasswordSubmit = document.getElementById('reset-password-submit');
        const resetCurrentPasswordInput = document.getElementById('reset-current-password');
        const resetNewPasswordInput = document.getElementById('reset-new-password');
        const resetConfirmPasswordInput = document.getElementById('reset-confirm-password');
        const resetCurrentPasswordToggle = document.getElementById('reset-current-password-toggle');
        const resetNewPasswordToggle = document.getElementById('reset-new-password-toggle');
        const resetConfirmPasswordToggle = document.getElementById('reset-confirm-password-toggle');
        const resetPasswordMessage = document.getElementById('reset-password-message');
        const storedAdminId = (localStorage.getItem('kolek_admin') || '').trim();

        function toggleSettingsPasswordVisibility(inputEl, toggleEl) {
            if (!inputEl || !toggleEl) return;
            if (inputEl.type === 'password') {
                inputEl.type = 'text';
                toggleEl.textContent = '🙈';
            } else {
                inputEl.type = 'password';
                toggleEl.textContent = '👁️';
            }
        }

        function resetSettingsPasswordVisibility() {
            if (resetCurrentPasswordInput) resetCurrentPasswordInput.type = 'password';
            if (resetNewPasswordInput) resetNewPasswordInput.type = 'password';
            if (resetConfirmPasswordInput) resetConfirmPasswordInput.type = 'password';
            if (resetCurrentPasswordToggle) resetCurrentPasswordToggle.textContent = '👁️';
            if (resetNewPasswordToggle) resetNewPasswordToggle.textContent = '👁️';
            if (resetConfirmPasswordToggle) resetConfirmPasswordToggle.textContent = '👁️';
        }
        
        function showResetPasswordMessage(message, type) {
            if (!resetPasswordMessage) return;
            resetPasswordMessage.textContent = message;
            resetPasswordMessage.style.display = 'block';
            resetPasswordMessage.style.backgroundColor = type === 'success' ? 'var(--success-bg, #dcfce7)' : 'var(--error-bg, #fee2e2)';
            resetPasswordMessage.style.color = type === 'success' ? 'var(--success-color, #15803d)' : 'var(--error-color, #dc2626)';
            resetPasswordMessage.style.borderLeft = type === 'success' ? '4px solid var(--success-color, #15803d)' : '4px solid var(--error-color, #dc2626)';
        }
        
        function clearResetPasswordFields() {
            if (resetCurrentPasswordInput) resetCurrentPasswordInput.value = '';
            if (resetNewPasswordInput) resetNewPasswordInput.value = '';
            if (resetConfirmPasswordInput) resetConfirmPasswordInput.value = '';
            if (resetPasswordMessage) resetPasswordMessage.style.display = 'none';
            resetSettingsPasswordVisibility();
        }
        
        function closeResetPasswordModal() {
            if (resetPasswordModal) {
                resetPasswordModal.classList.remove('show');
                clearResetPasswordFields();
            }
        }
        
        if (resetPasswordLink) {
            resetPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (resetPasswordModal) {
                    resetPasswordModal.classList.add('show');
                    clearResetPasswordFields();
                    if (resetCurrentPasswordInput) resetCurrentPasswordInput.focus();
                }
            });
        }
        
        if (resetPasswordClose) {
            resetPasswordClose.addEventListener('click', (e) => {
                e.preventDefault();
                closeResetPasswordModal();
            });
        }
        
        if (resetPasswordCancel) {
            resetPasswordCancel.addEventListener('click', (e) => {
                e.preventDefault();
                closeResetPasswordModal();
            });
        }
        
        if (resetPasswordModal) {
            resetPasswordModal.addEventListener('click', function(e) {
                if (e.target === this) closeResetPasswordModal();
            });
        }

        if (resetCurrentPasswordToggle) {
            resetCurrentPasswordToggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleSettingsPasswordVisibility(resetCurrentPasswordInput, resetCurrentPasswordToggle);
            });
        }

        if (resetNewPasswordToggle) {
            resetNewPasswordToggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleSettingsPasswordVisibility(resetNewPasswordInput, resetNewPasswordToggle);
            });
        }

        if (resetConfirmPasswordToggle) {
            resetConfirmPasswordToggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleSettingsPasswordVisibility(resetConfirmPasswordInput, resetConfirmPasswordToggle);
            });
        }
        
        if (resetPasswordSubmit) {
            resetPasswordSubmit.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const currentPassword = resetCurrentPasswordInput?.value || '';
                const newPassword = resetNewPasswordInput?.value || '';
                const confirmPassword = resetConfirmPasswordInput?.value || '';
                
                if (!currentPassword || !newPassword || !confirmPassword) {
                    showResetPasswordMessage('Please fill in all fields', 'error');
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    showResetPasswordMessage('New passwords do not match', 'error');
                    return;
                }
                
                if (currentPassword === newPassword) {
                    showResetPasswordMessage('New password must be different from current password', 'error');
                    return;
                }
                
                // Disable submit button during request
                resetPasswordSubmit.disabled = true;
                resetPasswordSubmit.textContent = 'Updating...';
                
                try {
                    const response = await fetch('/api/admin/reset-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            adminId: storedAdminId,
                            currentPassword: currentPassword,
                            newPassword: newPassword
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        showResetPasswordMessage('Password updated successfully! You will need to login again with your new password.', 'success');
                        setTimeout(() => {
                            closeResetPasswordModal();
                            // Logout after successful password reset
                            try {
                                localStorage.removeItem('kolek_auth');
                                localStorage.removeItem('kolek_admin');
                            } catch (e) {}
                            window.location.href = 'index.html';
                        }, 2000);
                    } else {
                        showResetPasswordMessage(data.message || 'Failed to update password', 'error');
                    }
                } catch (error) {
                    console.error('Password reset error:', error);
                    showResetPasswordMessage('Error updating password. Please try again.', 'error');
                } finally {
                    resetPasswordSubmit.disabled = false;
                    resetPasswordSubmit.textContent = 'Update Password';
                }
            });
        }
        
        // Allow Enter key to submit
        if (resetConfirmPasswordInput) {
            resetConfirmPasswordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    resetPasswordSubmit?.click();
                }
            });
        }
    } catch (e) { console.error('Reset password init failed', e); }
}

function setupSecurityQuestionsInteractions(){
    const securityQuestionsLink = document.getElementById('security-questions-link');
    const securityQuestionsModal = document.getElementById('security-questions-modal');
    const securityQuestionsClose = document.getElementById('security-questions-close');
    const securityQuestionsCancel = document.getElementById('security-questions-cancel');
    const securityQuestionsSubmit = document.getElementById('security-questions-submit');
    const securityQuestionsMessage = document.getElementById('security-questions-message');
    const storedAdminId = (localStorage.getItem('kolek_admin') || '').trim();
    
    function showSecurityQuestionsMessage(message, type) {
        if (!securityQuestionsMessage) return;
        securityQuestionsMessage.textContent = message;
        securityQuestionsMessage.style.display = 'block';
        securityQuestionsMessage.style.backgroundColor = type === 'success' ? 'var(--success-bg, #dcfce7)' : 'var(--error-bg, #fee2e2)';
        securityQuestionsMessage.style.color = type === 'success' ? 'var(--success-color, #15803d)' : 'var(--error-color, #dc2626)';
        securityQuestionsMessage.style.borderLeft = type === 'success' ? '4px solid var(--success-color, #15803d)' : '4px solid var(--error-color, #dc2626)';
    }
    
    function clearSecurityQuestionsFields() {
        for (let i = 1; i <= 3; i++) {
            const q = document.getElementById(`security-question-${i}`);
            const a = document.getElementById(`security-answer-${i}`);
            if (q) q.value = '';
            if (a) a.value = '';
        }
        if (securityQuestionsMessage) securityQuestionsMessage.style.display = 'none';
    }
    
    function closeSecurityQuestionsModal() {
        if (securityQuestionsModal) {
            securityQuestionsModal.classList.remove('show');
            clearSecurityQuestionsFields();
        }
    }
    
    async function loadSecurityQuestionsForEdit() {
        try {
            const response = await fetch('/api/admin/my-security-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ adminId: storedAdminId })
            });
            
            const data = await response.json();
            
            if (response.ok && data.questions) {
                const questions = data.questions;
                for (let i = 1; i <= 3; i++) {
                    const qKey = `q${i}`;
                    if (questions[qKey]) {
                        const q = document.getElementById(`security-question-${i}`);
                        const a = document.getElementById(`security-answer-${i}`);
                        // Try to match the question value
                        const questionText = questions[qKey].question || '';
                        if (q) {
                            // Find matching option based on question text
                            for (const option of q.options) {
                                if (option.textContent.toLowerCase().includes(questionText.toLowerCase())) {
                                    q.value = option.value;
                                    break;
                                }
                            }
                        }
                        // Don't pre-fill answers for security
                    }
                }
            }
        } catch (error) {
            console.error('Error loading security questions:', error);
        }
    }
    
    if (securityQuestionsLink) {
        securityQuestionsLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (securityQuestionsModal) {
                securityQuestionsModal.classList.add('show');
                clearSecurityQuestionsFields();
                loadSecurityQuestionsForEdit();
            }
        });
    }
    
    if (securityQuestionsClose) {
        securityQuestionsClose.addEventListener('click', (e) => {
            e.preventDefault();
            closeSecurityQuestionsModal();
        });
    }
    
    if (securityQuestionsCancel) {
        securityQuestionsCancel.addEventListener('click', (e) => {
            e.preventDefault();
            closeSecurityQuestionsModal();
        });
    }
    
    if (securityQuestionsModal) {
        securityQuestionsModal.addEventListener('click', function(e) {
            if (e.target === this) closeSecurityQuestionsModal();
        });
    }
    
    if (securityQuestionsSubmit) {
        securityQuestionsSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const questions = {};
            const answers = {};
            
            // Collect questions and answers
            for (let i = 1; i <= 3; i++) {
                const q = document.getElementById(`security-question-${i}`);
                const a = document.getElementById(`security-answer-${i}`);
                
                if (!q?.value || !a?.value) {
                    showSecurityQuestionsMessage('Please select a question and enter an answer for each field', 'error');
                    return;
                }
                
                questions[`q${i}`] = { question: q.options[q.selectedIndex].text };
                answers[`q${i}`] = a.value.trim();
            }
            
            // Disable submit button during request
            securityQuestionsSubmit.disabled = true;
            securityQuestionsSubmit.textContent = 'Saving...';
            
            try {
                const response = await fetch('/api/admin/set-security-questions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        adminId: storedAdminId,
                        questions: questions,
                        answers: answers
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    showSecurityQuestionsMessage('Security questions saved successfully!', 'success');
                    setTimeout(() => {
                        closeSecurityQuestionsModal();
                    }, 2000);
                } else {
                    showSecurityQuestionsMessage(data.message || 'Failed to save security questions', 'error');
                }
            } catch (error) {
                console.error('Security questions save error:', error);
                showSecurityQuestionsMessage('Error saving security questions. Please try again.', 'error');
            } finally {
                securityQuestionsSubmit.disabled = false;
                securityQuestionsSubmit.textContent = 'Save Security Questions';
            }
        });
    }
}

function setupProfileInteractions(){
    const fileInput = document.getElementById('profile-file-input');
    const avatar = document.getElementById('profile-avatar');
    const headerAvatar = document.getElementById('header-user-avatar');
    const avatarEditBtn = document.getElementById('profile-avatar-edit');
    const saveBtn = document.getElementById('profile-save-btn');
    const adminIdEl = document.getElementById('profile-admin-id');
    const fullnameEl = document.getElementById('profile-fullname');
    const emailEl = document.getElementById('profile-email');
    const phoneCodeEl = document.getElementById('profile-phone-code');
    const phoneEl = document.getElementById('profile-phone');
    const genderEl = document.getElementById('profile-gender');
    const storedAdminId = (localStorage.getItem('kolek_admin') || '').trim();
    function applyAdminData(data = {}) {
        const idRaw = data.adminID || data.adminId || data.id || storedAdminId || '';
        const idDisplay = idRaw ? (String(idRaw).startsWith('#') ? String(idRaw) : '#' + String(idRaw)) : '';
        const name = data.adminName || data.name || data.fullName || data.fullname || '';
        const email = data.emailAddress || data.email || data.adminEmail || '';
        const phone = data.phoneNumber || data.phone || data.adminPhone || '';
        const phoneCode = data.phoneCode || data.phone_code || data.adminPhoneCode || '';
        const genderRaw = data.gender || data.adminGender || data.sex || '';
        const genderLower = String(genderRaw || '').toLowerCase();
        const gender = genderLower.startsWith('m') ? 'Man'
            : genderLower.startsWith('w') || genderLower.startsWith('f') ? 'Woman'
            : genderRaw;

        if (adminIdEl && idDisplay) adminIdEl.value = idDisplay;
        if (fullnameEl && name) fullnameEl.value = name;
        if (emailEl && email) emailEl.value = email;
        if (phoneEl && phone) phoneEl.value = phone;
        if (phoneCodeEl && phoneCode) phoneCodeEl.value = phoneCode;
        if (genderEl && gender) genderEl.value = gender;
    }
    // Load avatar from local storage (client-only)
    try {
        const av = localStorage.getItem('profile:avatar');
        if (av) {
            if (avatar) avatar.src = av;
            if (headerAvatar) headerAvatar.src = av;
        }
    } catch(e){/* ignore */}

    // Load admin profile from backend
    if (storedAdminId && window.dashboardAPI && typeof window.dashboardAPI.getAdmin === 'function') {
        window.dashboardAPI.getAdmin(storedAdminId).then(resp => {
            if (resp && resp.success && resp.data) {
                applyAdminData(resp.data);
            }
        }).catch(err => {
            console.error('Load admin profile error', err);
        });
    }
    // Avatar change
    function triggerFile() { if (fileInput) fileInput.click(); }
    if (avatarEditBtn) avatarEditBtn.addEventListener('click', function(e){ e.preventDefault(); triggerFile(); });
    if (fileInput) {
        fileInput.addEventListener('change', function(){
            if (this.files && this.files.length) {
                const f = this.files[0];
                const reader = new FileReader();
                reader.onload = function(ev){
                    try {
                        const data = ev.target.result;
                        if (avatar) avatar.src = data;
                        if (headerAvatar) headerAvatar.src = data;
                        // temporarily store preview until saved
                        fileInput._preview = data;
                    } catch(e){}
                };
                reader.readAsDataURL(f);
            }
        });
    }
    // Save changes
    if (saveBtn) saveBtn.addEventListener('click', function(e){
        e.preventDefault();
        const adminId = (storedAdminId || '').trim();
        const payload = {
            fullName: fullnameEl ? fullnameEl.value.trim() : '',
            email: emailEl ? emailEl.value.trim() : '',
            phone: phoneEl ? phoneEl.value.trim() : '',
            phoneCode: phoneCodeEl ? phoneCodeEl.value.trim() : '',
            gender: genderEl ? genderEl.value.trim() : ''
        };
        if (adminId && window.dashboardAPI && typeof window.dashboardAPI.updateAdmin === 'function') {
            window.dashboardAPI.updateAdmin(adminId, payload).then(resp => {
                if (resp && resp.success) {
                    alert('Profile saved.');
                } else {
                    alert('Save failed: ' + (resp?.message || 'Unknown error'));
                }
            }).catch(err => {
                console.error('Profile save error', err);
                alert('Save failed (see console).');
            });
        }
        // commit avatar if preview exists (client-only)
        try {
            if (fileInput && fileInput._preview) {
                localStorage.setItem('profile:avatar', fileInput._preview);
                delete fileInput._preview;
            }
        } catch(e){}
        // sync header avatar
        try { const av = localStorage.getItem('profile:avatar'); if (av && headerAvatar) headerAvatar.src = av; } catch(e){}
    });
    // Allow clicking the avatar image itself to open file picker
    if (avatar) avatar.addEventListener('click', function(e){ e.preventDefault(); triggerFile(); });
}
// AI Assist interactions
function setupAIAssist() {
    const input = document.getElementById('ai-prompt-input');
    const send = document.getElementById('ai-send');
    const chatLog = document.getElementById('ai-chat-log');
    const emptyState = document.getElementById('ai-empty');
    const chatShell = document.getElementById('ai-chat-shell');
    const intro = document.getElementById('ai-intro');
    const suggestions = document.querySelectorAll('.ai-suggestion');
    const fileInput = document.getElementById('ai-file-input');
    const uploadFeedback = document.getElementById('ai-upload-feedback');
    const voiceBtn = document.getElementById('ai-voice');
    function appendMessage(role, text) {
        if (!chatLog) return null;
        const msg = document.createElement('div');
        msg.className = `ai-msg ${role}`;
        msg.textContent = text;
        chatLog.appendChild(msg);
        chatLog.scrollTop = chatLog.scrollHeight;
        return msg;
    }
    if (chatLog && chatShell && chatLog.children.length === 0) {
        chatShell.classList.add('is-hidden');
        if (emptyState) emptyState.style.display = 'flex';
        if (intro) intro.style.display = 'block';
    }
    async function sendPrompt(){
        const val = input.value.trim();
        if(!val) return alert('Please enter a prompt');
        if (chatShell) chatShell.classList.remove('is-hidden');
        if (emptyState) emptyState.style.display = 'none';
        if (intro) intro.style.display = 'none';
        appendMessage('user', val);
        const botMsg = appendMessage('bot', 'Thinking...');
        if (send) send.disabled = true;
        try {
            const resp = await fetch('/api/ai/assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: val })
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                const errText = data?.error || 'AI request failed';
                if (resp.status === 429) {
                    const e = new Error(errText);
                    e.status = 429;
                    throw e;
                }
                throw new Error(errText);
            }
            const text = data?.text || 'No response.';
            if (botMsg) botMsg.textContent = text;
            if (!botMsg) alert(text);
        } catch (err) {
            console.error('AI assist request failed:', err);
            if (botMsg) {
                if (err && err.status === 429) {
                    botMsg.textContent = 'AI service is temporarily rate-limited. Please try again in a moment.';
                } else {
                    botMsg.textContent = 'Sorry, the AI assistant is unavailable right now.';
                }
            } else {
                alert('AI assistant unavailable (see console).');
            }
        } finally {
            if (send) send.disabled = false;
        }
        input.value = '';
    }
    if (send) send.addEventListener('click', (e)=>{ e.preventDefault(); sendPrompt(); });
    if (input) input.addEventListener('keyup', (e)=>{ if (e.key === 'Enter') sendPrompt(); });
    suggestions.forEach(s => {
        s.addEventListener('click', function(){
            input.value = this.textContent.trim();
            input.focus();
        });
    });
    // attach -> open file picker
    const attachBtn = document.getElementById('ai-attach');
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', (e) => { e.preventDefault(); fileInput.click(); });
        fileInput.addEventListener('change', function(e) {
            if (this.files && this.files.length) {
                const f = this.files[0];
                const name = f.name || 'selected file';
                if (uploadFeedback) {
                    uploadFeedback.textContent = name;
                    setTimeout(() => { if (uploadFeedback) uploadFeedback.textContent = ''; }, 4000);
                } else {
                    alert('Selected file: ' + name);
                }
                // design-only: keep a console log of selected file
                console.log('AI file selected:', f);
            }
        });
    }
    // microphone permission - prompt user
    if (voiceBtn) {
        voiceBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            // Check API
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Microphone API not supported in this browser');
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // permission granted, immediately stop tracks (design-only)
                stream.getTracks().forEach(t => t.stop());
                alert('Microphone permission granted (demo).');
                console.log('Microphone stream:', stream);
            } catch (err) {
                console.error('Microphone permission denied or error:', err);
                alert('Microphone permission denied or unavailable.');
            }
        });
    }
    // dismiss info link
    const dismiss = document.getElementById('dismiss-info');
    if (dismiss) dismiss.addEventListener('click', e => { e.preventDefault(); document.querySelector('.ai-info').style.display = 'none'; });
}

// Render household table with pagination
function renderHouseholdPage(page = 1) {
    if (!householdFilteredData || householdFilteredData.length === 0) {
        const tbody = document.querySelector('.household-table tbody');
        if (tbody) tbody.innerHTML = '';
        updateHouseholdPagination();
        return;
    }
    
    householdCurrentPage = page;
    const startIndex = (page - 1) * householdRecordsPerPage;
    const endIndex = startIndex + householdRecordsPerPage;
    const pageData = householdFilteredData.slice(startIndex, endIndex);
    
    // Populate table with current page data
    const tbody = document.querySelector('.household-table tbody');
    if (!tbody) return;
    
    const rows = pageData.map(d => {
        const idRaw = d.householdID || d.householdId || d.household || '';
        const id = idRaw.startsWith('#') ? idRaw : '#' + idRaw;
        const name = d.householdName || d.householdName || '';
        const phone = d.phoneNumber || d.phone || '';
        const email = d.emailAddress || d.email || '';
        const gender = d.gender || '';
        const points = formatNumberWithCommas(d.pointsEarned || d.points || '') + (d.pointsEarned ? ' pt' : (d.points ? ' pt' : ''));
        const creditVal = (d.creditBalance || d.credit || '').toString();
        const credit = creditVal ? ('RM ' + Number(creditVal).toFixed(2)) : '';
        const ucoVal = (d.totalUCODeposited || d.totalUcoDeposited || d.ucoDeposited || '').toString();
        const uco = ucoVal ? (Number(ucoVal).toFixed(2).replace(/\.00$/, '') + ' kg') : '';
        const status = d.accountStatus || d.accountstatus || d.account_status || d.status || '';
        const statusLower = String(status).toLowerCase();
        const isInactive = /inactive|deactiv|not\s*active/.test(statusLower);
        const isActive = /^active\b/.test(statusLower);
        const action = isActive && !isInactive
            ? `<button type="button" class="danger-action household-toggle-status" data-target-status="Inactive" aria-label="Deactivate ${escapeHtml(name)}">Deactivate <i class="fas fa-user-slash" aria-hidden="true"></i></button>`
            : `<button type="button" class="success-action household-toggle-status" data-target-status="Active" aria-label="Activate ${escapeHtml(name)}">Activate <i class="fas fa-check" aria-hidden="true"></i></button>`;
        
        return `
            <tr>
                <td>${escapeHtml(id)}</td>
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(phone)}</td>
                <td>${escapeHtml(email)}</td>
                <td>${escapeHtml(gender)}</td>
                <td>${escapeHtml(points)}</td>
                <td>${escapeHtml(credit)}</td>
                <td>${escapeHtml(uco)}</td>
                <td class="status ${isActive ? 'active' : (isInactive ? 'inactive' : '')}">${escapeHtml(status)}</td>
                <td class="actions-col"><span class="action-group">${action}</span></td>
            </tr>
        `;
    }).join('\n');
    tbody.innerHTML = rows;
    
    // Update pagination controls
    updateHouseholdPagination();
}

// Update pagination controls
function updateHouseholdPagination() {
    const totalRecords = householdFilteredData.length;
    const totalPages = Math.ceil(totalRecords / householdRecordsPerPage) || 1;
    
    // Update entries info
    const entriesInfo = document.getElementById('household-entries-info');
    if (entriesInfo) {
        if (totalRecords === 0) {
            entriesInfo.textContent = 'Showing 0 to 0 of 0 entries';
        } else {
            const startRecord = ((householdCurrentPage - 1) * householdRecordsPerPage) + 1;
            const endRecord = Math.min(householdCurrentPage * householdRecordsPerPage, totalRecords);
            entriesInfo.textContent = `Showing ${startRecord} to ${endRecord} of ${totalRecords} entries`;
        }
    }
    
    // Update prev/next buttons
    const prevBtn = document.getElementById('household-prev-btn');
    const nextBtn = document.getElementById('household-next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = householdCurrentPage === 1;
    }
    if (nextBtn) {
        nextBtn.disabled = householdCurrentPage >= totalPages;
    }
    
    // Update page numbers
    const pageNumbersContainer = document.getElementById('household-page-numbers');
    if (pageNumbersContainer) {
        let pageButtons = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, householdCurrentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        if (startPage > 1) {
            pageButtons += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                pageButtons += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === householdCurrentPage ? ' active' : '';
            pageButtons += `<button class="page-btn${activeClass}" data-page="${i}">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageButtons += `<span class="page-ellipsis">...</span>`;
            }
            pageButtons += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        pageNumbersContainer.innerHTML = pageButtons;
    }
}

// Setup household pagination event listeners
function setupHouseholdPagination() {
    const prevBtn = document.getElementById('household-prev-btn');
    const nextBtn = document.getElementById('household-next-btn');
    const pageNumbersContainer = document.getElementById('household-page-numbers');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (householdCurrentPage > 1) {
                renderHouseholdPage(householdCurrentPage - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(householdFilteredData.length / householdRecordsPerPage);
            if (householdCurrentPage < totalPages) {
                renderHouseholdPage(householdCurrentPage + 1);
            }
        });
    }
    
    if (pageNumbersContainer) {
        pageNumbersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== householdCurrentPage) {
                    renderHouseholdPage(page);
                }
            }
        });
    }
}


// Render collector table with pagination
function renderCollectorPage(page = 1) {
    if (!collectorFilteredData || collectorFilteredData.length === 0) {
        const tbody = document.querySelector('.collector-table tbody');
        if (tbody) tbody.innerHTML = '';
        updateCollectorPagination();
        return;
    }
    
    collectorCurrentPage = page;
    const startIndex = (page - 1) * collectorRecordsPerPage;
    const endIndex = startIndex + collectorRecordsPerPage;
    const pageData = collectorFilteredData.slice(startIndex, endIndex);
    
    const tbody = document.querySelector('.collector-table tbody');
    if (!tbody) return;
    
    const rows = pageData.map(d => {
        const id = d.collectorID || d.id || d.collectorId || '';
        const name = d.collectorName || d.name || '';
        const phone = d.phoneNumber || d.phone || '';
        const email = d.emailAddress || d.email || '';
        const dob = d.dateOfBirth || d.dob || '';
        const vehicle = d.vehicleType || d.vehicle || '';
        const plate = d.vehiclePlateNumber || d.vehiclePlate || d.vehiclePlateNumber || '';
        const area = d.preferredCollectionArea || d.preferredArea || '';
        const availability = d.availability || '';
        const status = d.accountStatus || d.accountstatus || d.status || '';
        const normalizedStatus = String(status).toLowerCase();
        const isInactive = normalizedStatus.includes('inactive') || normalizedStatus.includes('deactiv');
        const isActive = normalizedStatus.includes('active') && !isInactive;
        const action = isActive
            ? `<button type="button" class="danger-action collector-toggle-status" data-collector-id="${escapeHtml(id)}" data-target-status="Inactive" aria-label="Deactivate ${escapeHtml(name)}">Deactivate <i class="fas fa-user-slash" aria-hidden="true"></i></button>`
            : `<button type="button" class="success-action collector-toggle-status" data-collector-id="${escapeHtml(id)}" data-target-status="Active" aria-label="Activate ${escapeHtml(name)}">Activate <i class="fas fa-check" aria-hidden="true"></i></button>`;
        
        return `
            <tr>
                <td>${escapeHtml(id)}</td>
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(phone)}</td>
                <td>${escapeHtml(email)}</td>
                <td>${escapeHtml(dob)}</td>
                <td>${escapeHtml(vehicle)}</td>
                <td>${escapeHtml(plate)}</td>
                <td>${escapeHtml(area)}</td>
                <td>${escapeHtml(availability)}</td>
                <td class="status ${isActive ? 'active' : 'inactive'}">${escapeHtml(status)}</td>
                <td class="actions-col"><span class="action-group">${action}</span></td>
            </tr>
        `;
    }).join('\n');
    tbody.innerHTML = rows;
    
    updateCollectorPagination();
}

// Update collector pagination controls
function updateCollectorPagination() {
    const totalRecords = collectorFilteredData.length;
    const totalPages = Math.ceil(totalRecords / collectorRecordsPerPage) || 1;
    
    const entriesInfo = document.getElementById('collector-entries-info');
    if (entriesInfo) {
        if (totalRecords === 0) {
            entriesInfo.textContent = 'Showing 0 to 0 of 0 entries';
        } else {
            const startRecord = ((collectorCurrentPage - 1) * collectorRecordsPerPage) + 1;
            const endRecord = Math.min(collectorCurrentPage * collectorRecordsPerPage, totalRecords);
            entriesInfo.textContent = `Showing ${startRecord} to ${endRecord} of ${totalRecords} entries`;
        }
    }
    
    const prevBtn = document.getElementById('collector-prev-btn');
    const nextBtn = document.getElementById('collector-next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = collectorCurrentPage === 1;
    }
    if (nextBtn) {
        nextBtn.disabled = collectorCurrentPage >= totalPages;
    }
    
    const pageNumbersContainer = document.getElementById('collector-page-numbers');
    if (pageNumbersContainer) {
        let pageButtons = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, collectorCurrentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        if (startPage > 1) {
            pageButtons += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                pageButtons += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === collectorCurrentPage ? ' active' : '';
            pageButtons += `<button class="page-btn${activeClass}" data-page="${i}">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageButtons += `<span class="page-ellipsis">...</span>`;
            }
            pageButtons += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        pageNumbersContainer.innerHTML = pageButtons;
    }
}

// Setup collector pagination event listeners
function setupCollectorPagination() {
    console.log("=== setupCollectorPagination called ===");
    console.log("collectorFullData.length:", collectorFullData ? collectorFullData.length : "undefined");
    
    const prevBtn = document.getElementById('collector-prev-btn');
    const nextBtn = document.getElementById('collector-next-btn');
    const pageNumbersContainer = document.getElementById('collector-page-numbers');
    
    console.log("Pagination elements:", { prevBtn: !!prevBtn, nextBtn: !!nextBtn, pageNumbersContainer: !!pageNumbersContainer });
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (collectorCurrentPage > 1) {
                renderCollectorPage(collectorCurrentPage - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(collectorFilteredData.length / collectorRecordsPerPage);
            if (collectorCurrentPage < totalPages) {
                renderCollectorPage(collectorCurrentPage + 1);
            }
        });
    }
    
    if (pageNumbersContainer) {
        pageNumbersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== collectorCurrentPage) {
                    renderCollectorPage(page);
                }
            }
        });
    }
}

// ==================== Collection Page Functions ====================
function renderCollectionPage(page = 1) {
    if (!collectionFilteredData || collectionFilteredData.length === 0) {
        const tbody = document.querySelector('.collection-table tbody');
        if (tbody) tbody.innerHTML = '';
        updateCollectionPagination();
        return;
    }
    collectionCurrentPage = page;
    const startIndex = (page - 1) * collectionRecordsPerPage;
    const endIndex = startIndex + collectionRecordsPerPage;
    const pageData = collectionFilteredData.slice(startIndex, endIndex);

    const tbody = document.querySelector('.collection-table tbody');
    if (!tbody) return;

    const displayVal = (value, formatter) => {
        if (value === null || value === undefined || value === '') return 'NULL';
        return formatter ? formatter(value) : value;
    };
    const rows = pageData.map(d => {
        const collectionId = displayVal(pickCollectionField(d, ['collectionID', 'collectionId', 'collection_id', 'id'], ''));
        const date = displayVal(pickCollectionField(d, ['collectionDate', 'date', 'collection_date'], ''), v => new Date(v).toLocaleDateString('en-GB'));
        const address = displayVal(pickCollectionField(d, ['collectionAddress', 'address', 'location'], ''));
        const requestTime = displayVal(pickCollectionField(d, ['requestTime', 'requestedTime', 'timeRequested'], ''));
        const collectedTime = displayVal(pickCollectionField(d, ['collectedTime', 'collectionTime', 'collected_time'], ''));
        const status = displayVal(pickCollectionField(d, ['collectionStatus', 'status', 'collection_status'], ''));
        const points = displayVal(pickCollectionField(d, ['pointsEarned', 'points', 'points_earned'], ''));
        const credit = displayVal(pickCollectionField(d, ['creditEarned', 'credit', 'credit_earned'], ''));
        const householdId = displayVal(pickCollectionField(d, ['householdID', 'householdId', 'household_id'], ''));
        const collectorId = displayVal(pickCollectionField(d, ['collectorID', 'collectorId', 'collector_id'], ''));
        const stationId = displayVal(pickCollectionField(d, ['stationID', 'stationId', 'station_id'], ''));
        const statusLower = String(status).toLowerCase();
        const statusClass = statusLower.includes('completed')
            ? 'completed'
            : statusLower.includes('ongoing') || statusLower.includes('assigned')
                ? 'ongoing'
                : statusLower.includes('pending')
                    ? 'pending'
                    : 'pending';
        return `
            <tr>
                <td>${escapeHtml(String(collectionId))}</td>
                <td>${escapeHtml(String(date))}</td>
                <td class="address-col">${escapeHtml(String(address))}</td>
                <td>${escapeHtml(String(requestTime))}</td>
                <td>${escapeHtml(String(collectedTime))}</td>
                <td class="status ${statusClass}">${escapeHtml(String(status))}</td>
                <td>${escapeHtml(String(points))}</td>
                <td>${escapeHtml(String(credit))}</td>
                <td>${escapeHtml(String(householdId))}</td>
                <td>${escapeHtml(String(collectorId))}</td>
                <td>${escapeHtml(String(stationId))}</td>
                <td class="actions-col"><span class="action-group"><button class="view-details view-action btn-small" aria-label="View details">View details</button></span></td>
            </tr>
        `;
    }).join('\n');
    tbody.innerHTML = rows;

    updateCollectionPagination();
}

function updateCollectionPagination() {
    const totalRecords = collectionFilteredData.length;
    const totalPages = Math.ceil(totalRecords / collectionRecordsPerPage) || 1;

    const entriesInfo = document.getElementById('collection-entries-info');
    if (entriesInfo) {
        if (totalRecords === 0) {
            entriesInfo.textContent = 'Showing 0 to 0 of 0 entries';
        } else {
            const startRecord = ((collectionCurrentPage - 1) * collectionRecordsPerPage) + 1;
            const endRecord = Math.min(collectionCurrentPage * collectionRecordsPerPage, totalRecords);
            entriesInfo.textContent = `Showing ${startRecord} to ${endRecord} of ${totalRecords} entries`;
        }
    }

    const prevBtn = document.getElementById('collection-prev-btn');
    const nextBtn = document.getElementById('collection-next-btn');

    if (prevBtn) {
        prevBtn.disabled = collectionCurrentPage === 1;
    }
    if (nextBtn) {
        nextBtn.disabled = collectionCurrentPage >= totalPages;
    }

    const pageNumbersContainer = document.getElementById('collection-page-numbers');
    if (pageNumbersContainer) {
        let pageButtons = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, collectionCurrentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pageButtons += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                pageButtons += `<span class="page-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === collectionCurrentPage ? ' active' : '';
            pageButtons += `<button class="page-btn${activeClass}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageButtons += `<span class="page-ellipsis">...</span>`;
            }
            pageButtons += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        pageNumbersContainer.innerHTML = pageButtons;
    }
}

function setupCollectionPagination() {
    const prevBtn = document.getElementById('collection-prev-btn');
    const nextBtn = document.getElementById('collection-next-btn');
    const pageNumbersContainer = document.getElementById('collection-page-numbers');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (collectionCurrentPage > 1) {
                renderCollectionPage(collectionCurrentPage - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(collectionFilteredData.length / collectionRecordsPerPage);
            if (collectionCurrentPage < totalPages) {
                renderCollectionPage(collectionCurrentPage + 1);
            }
        });
    }

    if (pageNumbersContainer) {
        pageNumbersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== collectionCurrentPage) {
                    renderCollectionPage(page);
                }
            }
        });
    }
}

function updateCollectionKPI() {
    try {
        const kpiCards = Array.from(document.querySelectorAll('.kpi-card'));
        for (const card of kpiCards) {
            const h = card.querySelector('.kpi-header h3');
            if (h && /collection/i.test(h.textContent || '')) {
                const valueEl = card.querySelector('.kpi-value');
                if (valueEl) {
                    valueEl.innerHTML = `${collectionFullData.length} <span class="unit">Collections</span>`;
                }
                break;
            }
        }
    } catch (e) { /* ignore */ }

    try {
        const pendingBadge = document.querySelector('#collection-pending .pending-count');
        if (pendingBadge) {
            const pendingCount = collectionFullData.filter(d => {
                const status = pickCollectionField(d, ['collectionStatus', 'status', 'collection_status'], '');
                return String(status).toLowerCase().includes('pending');
            }).length;
            pendingBadge.textContent = pendingCount;
        }
    } catch (e) { /* ignore */ }
}

// Kaiyean AI Model 1
function requestAISuggestion(collectionId){

    fetch(`/api/ai-suggestion/${collectionId}`)
    .then(res => res.json())
    .then(data => {

        document.getElementById("aiSuggestionText").innerText =
            `Collector: ${data.collectorName}
            Collector ID: ${data.collectorId}
            AI Recommendation Score: ${data.score}
            Model: ${data.reason}`;

        document.getElementById("aiSuggestionModal").style.display = "block";

    })
    .catch(err => {
        console.error("AI suggestion failed:", err);
    });
}

// KAIYEAN AI MODEL 2
document.addEventListener("DOMContentLoaded", function(){

    const closeBtn = document.getElementById("aiSuggestionClose");

    if(closeBtn){
        closeBtn.onclick = function(){
            document.getElementById("aiSuggestionModal").classList.remove("show");
        }
    }

});

// AI COLLECTOR RECOMMENDATION (Kaiyean Model dont remove!!)
function findBestCollector(collectionLocation, collectors) {

    let bestCollector = null;
    let bestScore = Infinity;

    collectors.forEach(c => {

        // Area Match (Main factor)
        const areaMatch = collectionLocation
            .toLowerCase()
            .includes(c.preferredCollectionArea.toLowerCase()) ? 0 : 5;

        // Availability
        const availabilityScore =
            c.accountStatus === "Active" ? 0 : 10;

        // AI scoring formula
        const score =
            (areaMatch * 0.7) +
            (availabilityScore * 0.3);

        if (score < bestScore) {
            bestScore = score;
            bestCollector = c;
        }

    });

    return bestCollector;
}
