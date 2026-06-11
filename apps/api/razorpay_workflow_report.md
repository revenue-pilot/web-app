# Production SaaS & Razorpay Verified Credentials Report

**Test Initiated at:** 2026-06-11T11:21:54.323Z
**Target API:** https://api.revenuepilot.in/api

## 1. User Registration (`/api/auth/signup`)
- **Email:** razorpay_1781176914321@1secmail.com
- **Password:** TestPassword123!
- **Status**: 201 Created
- **Message**: Signup successful. Please check your email to verify your account.

## 2. Email Verification via Temp Mail
  - Polling inbox (Attempt 1)...

**ERROR OCCURRED:** Request failed with status code 403
Response Data: "<!DOCTYPE HTML PUBLIC \"-//IETF//DTD HTML 2.0//EN\">\n<html><head>\n<title>403 Forbidden</title>\n</head><body>\n<h1>Forbidden</h1>\n<p>You don't have permission to access this resource.Server unable to read htaccess file, denying access to be safe</p>\n</body></html>\n"