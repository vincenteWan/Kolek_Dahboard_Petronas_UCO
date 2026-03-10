# Two-Factor Authentication (2FA) Implementation Guide

## Overview

This document describes the Two-Factor Authentication (2FA) system implemented for the Kolek Dashboard admin login. The 2FA system adds an extra layer of security by requiring admins to verify their identity with a 6-digit code sent to their registered email after entering their correct Admin ID and password.

## Features

### 1. **Automatic 2FA on Login**
   - When an admin logs in with correct credentials, the system automatically generates a 6-digit verification code
   - The code is sent to the admin's registered email address
   - The admin must enter this code to complete the login process

### 2. **Code Expiration**
   - Verification codes expire after 10 minutes
   - Session tokens expire after 30 minutes
   - Auto-expiring timer displayed on the 2FA verification screen

### 3. **Code Resend Feature**
   - If an admin doesn't receive the code, they can request a new one
   - The new code is valid for another 10 minutes
   - Previous codes are invalidated when a new code is generated

### 4. **Email Template**
   - Professional HTML email template with clear instructions
   - Code prominently displayed
   - Security warnings about code confidentiality

### 5. **Graceful Fallback**
   - If email sending fails, the code is logged to the server console
   - Admins can retrieve the code from server logs for testing
   - Production deployments should ensure email configuration is valid

## Setup & Configuration

### Step 1: Install Dependencies

```bash
npm install
```

This will install `nodemailer` and all other required packages.

### Step 2: Configure Email Service (Resend)

Create a `.env` file in the project root with the following email configuration:

#### For Resend:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**To configure Resend:**
1. Go to https://resend.com/api-keys
2. Create an API key and copy it into `RESEND_API_KEY`
3. Set `RESEND_FROM_EMAIL` to a verified sender/domain in Resend
4. For quick testing, `onboarding@resend.dev` can be used

Production deployments should use your own verified domain/sender in Resend.

### Step 3: Database Setup

The system automatically creates necessary 2FA columns in the Admin table on first run:
- `twoFactorCode` - Stores the 6-digit verification code
- `twoFactorCodeExpiry` - Stores code expiration timestamp
- `twoFactorEmail` - Stores admin's email address
- `twoFactorEnabled` - Controls 2FA feature (default: enabled)
- `tempTwoFactorToken` - Temporary session token for 2FA verification
- `tempTwoFactorTokenExpiry` - Token expiration timestamp

### Step 4: Admin Email Configuration

Ensure that admin records in the Admin table have email addresses in one of these columns:
- `twoFactorEmail`
- `emailAddress`
- `email`
- `adminEmail`
- `email_address`

## How It Works

### Login Flow

1. **Step 1 - Initial Login**
   ```
   Admin enters Admin ID and Password
   ↓
   System validates credentials
   ↓
   Password is correct ✓
   ```

2. **Step 2 - 2FA Code Generation & Email**
   ```
   System generates 6-digit code
   ↓
   Stores code with 10-minute expiry
   ↓
   Generates temporary session token
   ↓
   Sends email with code to admin
   ↓
   Returns temporary token (NOT full admin data)
   ```

3. **Step 3 - 2FA Verification**
   ```
   Admin receives email with 6-digit code
   ↓
   Admin enters code in 2FA modal
   ↓
   System validates:
      - Code matches stored code
      - Code hasn't expired
      - Session token is valid
   ↓
   All validations pass ✓
   ↓
   Code and token are cleared
   ↓
   Admin is fully logged in
   ↓
   Redirected to Dashboard
   ```

### API Endpoints

#### 1. **POST /api/admin/login**
Validates admin credentials and initiates 2FA.

**Request:**
```json
{
  "adminId": "29549290",
  "password": "password123"
}
```

**Success Response (2FA Enabled):**
```json
{
  "success": true,
  "requires2FA": true,
  "tempToken": "hashed-token-string",
  "adminId": "29549290",
  "message": "2FA code sent to your email. Please verify to complete login."
}
```

**Success Response (2FA Disabled):**
```json
{
  "success": true,
  "admin": { /* full admin data */ },
  "requires2FA": false
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### 2. **POST /api/admin/verify-2fa-code**
Verifies the 6-digit code and completes login.

**Request:**
```json
{
  "adminId": "29549290",
  "twoFactorCode": "123456",
  "tempToken": "hashed-token-string"
}
```

**Success Response:**
```json
{
  "success": true,
  "admin": { /* full admin data */ },
  "message": "Two-factor authentication successful. Login complete."
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid verification code"
}
```

#### 3. **POST /api/admin/resend-2fa-code**
Sends a new 2FA code to the admin's email.

**Request:**
```json
{
  "adminId": "29549290",
  "tempToken": "hashed-token-string"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "New 2FA code sent to your email"
}
```

## Frontend Components

### HTML Elements Added

1. **2FA Modal** (`#twoFactorModal`)
   - Input field for 6-digit code
   - Verify button
   - Resend code button
   - Back to login button
   - Countdown timer (shows remaining time)
   - Message area for feedback

### JavaScript Functions

#### Core Functions:
- `setup2FAForm()` - Sets up the 2FA form submission handler
- `show2FAModal()` - Displays the 2FA verification modal
- `close2FAModal()` - Closes the 2FA modal and clears session data
- `verify2FACode()` - Submits and validates the entered code
- `resendTwoFactorCode()` - Requests a new 2FA code
- `start2FATimer()` - Starts the countdown timer for code expiration

#### Helper Functions:
- `show2FAMessage()` - Displays success/error messages in the modal
- `cancelTwoFactor()` - Cancels 2FA and returns to login form

### SessionStorage Keys

The system uses browser `sessionStorage` (cleared on browser close) for security:
- `2fa_adminId` - Admin ID waiting for 2FA verification
- `2fa_tempToken` - Temporary authentication token

## Testing the 2FA System

### Local Testing (Without Email)

If email isn't configured, the 2FA code will be logged to the server console:

```
⚠️  Email transporter not configured. 2FA Code for admin@example.com : 123456
```

You can copy this code and enter it in the 2FA modal.

### Production Testing (With Gmail)

1. Set up `.env` file with Gmail credentials
2. Restart the server
3. Login with any admin account
4. Check the registered email for the verification code
5. Enter the code in the 2FA modal

## Disabling 2FA (Optional)

If you want to disable 2FA for specific admins:

```sql
-- Disable 2FA for a specific admin
UPDATE Admin SET twoFactorEnabled = 0 WHERE adminID = '29549290';

-- Enable 2FA for all admins
UPDATE Admin SET twoFactorEnabled = 1;
```

## Security Considerations

1. **Code Storage**: Codes are stored in plaintext in the database but expire quickly (10 minutes)
2. **Token Usage**: Session tokens are hashed and valid for 30 minutes
3. **Email Security**: Ensure your email credentials are secured in `.env` file (never commit to git)
4. **HTTPS**: In production, always use HTTPS to protect credentials in transit
5. **Password**: The admin password is still verified before 2FA, maintaining existing security

## Troubleshooting

### Problem: "Email not configured for 2FA"

**Solution:** Ensure `EMAIL_SERVICE` and `EMAIL_USER` are configured in `.env` file.

### Problem: Code never arrives in email

**Possible causes:**
1. Email not configured in `.env`
2. Admin record doesn't have an email address
3. Email service credentials are incorrect
4. Email marked as spam

**Solution:** Check server console for logged codes, update admin email, verify email credentials.

### Problem: "Session expired" error

**Cause:** The temporary token expired (30-minute limit)

**Solution:** Admin must log in again to receive a new code.

### Problem: "Code expired" error

**Cause:** The 6-digit code expired (10-minute limit)

**Solution:** Use the "Resend" button to get a new code.

## Future Enhancements

Potential improvements for future versions:
1. Backup 2FA methods (SMS, authenticator apps)
2. Remember device for 30 days
3. 2FA enforcement policy per admin role
4. 2FA setup wizard on first admin login
5. Recovery codes for account recovery
6. Monitoring and alerting for failed 2FA attempts

## Support & Documentation

For additional help:
- Check server logs for any errors or warnings
- Review the console (F12) in the browser for client-side errors
- Verify `.env` configuration matches your email provider's requirements
- Test email configuration before deploying to production
