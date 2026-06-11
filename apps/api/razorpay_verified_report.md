# Production SaaS & Razorpay Verified Credentials Report

## 1. Initializing Temporary Email via Mail.tm
- **Email Address Created:** razorpay_1781177837356@web-library.net

## 2. User Registration (`/api/auth/signup`)
- **Password:** TestPassword123!
- **Status**: 201 Created
- **Message**: Signup successful. Please check your email to verify your account.

## 3. Email Verification Polling
  - Polling inbox (Attempt 1)...
  - Polling inbox (Attempt 2)...
  - Polling inbox (Attempt 3)...
  - Email received! ID: 6a2a9df1f0ac822855799063
  - Verification token extracted: 87e6c1d27f121970e994d69b68081a8ae89de5768be6a74ca79143c7ae091b4d
- **Verify Status**: 200 OK
- **Message**: Email verified successfully. You can now log in.

## 4. User Login (`/api/auth/login`)
- **Status**: 200 OK
- **Token Generated**: Yes (Bearer eyJhbGciOi...)

## 5. Razorpay Checkout Generation (`/api/billing/checkout`)
- **Status**: 201 OK
- **Response**: {"success":true,"orderId":"order_T0JI2x6u2IvHes","amount":499900,"currency":"INR"}

---
### Verified Credentials for Razorpay Team
Please provide the following credentials to the Razorpay testing team so they can test the workflow manually on the production dashboard:
* **Frontend URL:** https://revenuepilot.in/login
* **Email:** `razorpay_1781177837356@web-library.net`
* **Password:** `TestPassword123!`