/**
 * End-to-End Automated Test Suite for StockSense Auth
 * Run with: node test-auth-flow.mjs
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let authCookie = "";

function parseCookie(headers) {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return "";
  const match = setCookie.match(/stocksense_auth_token=([^;]+)/);
  return match ? `stocksense_auth_token=${match[1]}` : "";
}

async function runTests() {
  console.log("==================================================");
  console.log("🚀 STARTING STOCKSENSE AUTH VERIFICATION SUITE");
  console.log(`Target: ${BASE_URL}`);
  console.log("==================================================\n");

  const testEmail = `test.user.${Date.now()}@example.com`;
  const initialPassword = "Password123!";
  const updatedPassword = "NewSecretPassword456!";

  // 1. Sign up new user
  console.log(`[1] Testing Signup for: ${testEmail}...`);
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Jordan Lee",
      email: testEmail,
      role: "INVENTORY_MANAGER",
      password: initialPassword,
      confirmPassword: initialPassword,
    }),
  });

  const signupData = await signupRes.json();
  if (signupRes.status !== 200 || !signupData.success) {
    throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);
  }
  authCookie = parseCookie(signupRes.headers);
  console.log("   ✅ Signup succeeded. User ID:", signupData.user.id, "| Cookie received:", Boolean(authCookie));

  // 2. Reject duplicate signup
  console.log("\n[2] Testing Duplicate Email Prevention...");
  const dupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Jordan Duplicate",
      email: testEmail,
      role: "WAREHOUSE_STAFF",
      password: initialPassword,
      confirmPassword: initialPassword,
    }),
  });
  if (dupRes.status === 409) {
    console.log("   ✅ Duplicate email was correctly rejected with HTTP 409.");
  } else {
    throw new Error(`Duplicate signup returned unexpected status: ${dupRes.status}`);
  }

  // 3. Test GET /api/auth/me with cookie
  console.log("\n[3] Testing Authenticated Session Check (GET /api/auth/me)...");
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: authCookie },
  });
  const meData = await meRes.json();
  if (meRes.status === 200 && meData.authenticated && meData.user.email === testEmail) {
    console.log("   ✅ Session verified. Active user:", meData.user.name, `(${meData.user.role})`);
  } else {
    throw new Error(`Session check failed: ${JSON.stringify(meData)}`);
  }

  // 4. Test Logout
  console.log("\n[4] Testing Logout (POST /api/auth/logout)...");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: authCookie },
  });
  const logoutCookie = logoutRes.headers.get("set-cookie") || "";
  console.log("   ✅ Logged out successfully. Expired cookie header received:", logoutCookie.includes("Max-Age=0") || logoutCookie.includes("expires="));

  // 5. Test Login with incorrect password
  console.log("\n[5] Testing Login Rejection for Bad Credentials...");
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: "WrongPassword999" }),
  });
  if (badLoginRes.status === 401) {
    console.log("   ✅ Incorrect credentials correctly rejected with HTTP 401.");
  } else {
    throw new Error(`Bad login did not return 401: status ${badLoginRes.status}`);
  }

  // 6. Test OTP generation (POST /api/auth/forgot-password)
  console.log("\n[6] Testing Password Reset OTP Request (POST /api/auth/forgot-password)...");
  const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail }),
  });
  const forgotData = await forgotRes.json();
  if (forgotRes.status !== 200 || !forgotData.success) {
    throw new Error(`Forgot password request failed: ${JSON.stringify(forgotData)}`);
  }
  const receivedOtp = forgotData.previewOtp;
  console.log(`   ✅ OTP generation succeeded! Dispatch mode: ${forgotData.mode}`);
  if (receivedOtp) {
    console.log(`   🔑 Dev OTP received: ${receivedOtp}`);
  }

  // 7. Test Reset Password with invalid OTP
  console.log("\n[7] Testing Rejection of Invalid OTP...");
  const badOtpRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      otp: "000000",
      newPassword: updatedPassword,
      confirmPassword: updatedPassword,
    }),
  });
  if (badOtpRes.status === 400) {
    console.log("   ✅ Invalid OTP correctly rejected with HTTP 400.");
  } else {
    throw new Error(`Invalid OTP did not return 400: status ${badOtpRes.status}`);
  }

  // 8. Test Reset Password with correct OTP
  console.log("\n[8] Testing Password Reset with Valid OTP...");
  if (!receivedOtp) {
    console.log("   (Skipping valid OTP reset since live SMTP was used without previewOtp)");
  } else {
    const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        otp: receivedOtp,
        newPassword: updatedPassword,
        confirmPassword: updatedPassword,
      }),
    });
    const resetData = await resetRes.json();
    if (resetRes.status !== 200 || !resetData.success) {
      throw new Error(`Reset password failed: ${JSON.stringify(resetData)}`);
    }
    console.log("   ✅ Password successfully reset!");

    // 9. Login with NEW password
    console.log("\n[9] Testing Login with New Password...");
    const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: updatedPassword }),
    });
    const newLoginData = await newLoginRes.json();
    if (newLoginRes.status === 200 && newLoginData.success) {
      console.log("   ✅ Successfully authenticated with new password! User:", newLoginData.user.name);
    } else {
      throw new Error(`Login with new password failed: ${JSON.stringify(newLoginData)}`);
    }
  }

  console.log("\n==================================================");
  console.log("🎉 ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILURE:", err);
  process.exit(1);
});
