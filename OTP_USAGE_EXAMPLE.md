# 🔐 OTP Authentication Implementation Guide

## Backend Setup Complete ✅

Your OTP authentication system is now ready with the following endpoints:

### **API Endpoints**

#### 1. Send OTP

```http
POST /api/users/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "expiresIn": "10 minutes"
}
```

#### 2. Verify OTP and Login

```http
POST /api/users/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Same as regular login):**

```json
{
  "success": true,
  "message": "Login successful via OTP",
  "user": {
    "id": 1,
    "employee_id": "2025-00001",
    "username": "jdoe",
    "email": "user@example.com",
    "role": "admin",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## Frontend Implementation Example

### **React Component Example:**

```jsx
// components/OTPLogin.jsx
import { useState } from "react";
import axios from "axios";
import { useUserSessionStore } from "../store/userSessionStore";
import useToastStore from "../store/toastStore";

const OTPLogin = () => {
  const [step, setStep] = useState("email"); // 'email' or 'otp'
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { login } = useUserSessionStore();
  const { showToast } = useToastStore();

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await axios.post("/users/send-otp", { email });

      if (response.data.success) {
        showToast("OTP sent to your email!", "success");
        setStep("otp");
        startCountdown();
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!email || !otp) return;

    setIsLoading(true);
    try {
      const response = await axios.post("/users/verify-otp", {
        email,
        otp,
      });

      if (response.data.success) {
        // Login user (same as regular login)
        login(response.data.user);
        showToast("Login successful!", "success");
        // Redirect to dashboard based on role
        window.location.href = `/dashboard/${response.data.user.role}`;
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Invalid OTP", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(600); // 10 minutes
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (step === "email") {
    return (
      <form onSubmit={handleSendOTP} className="space-y-4">
        <h2 className="text-xl font-bold">Login with OTP</h2>

        <div>
          <label className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered w-full"
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className={`btn btn-primary w-full ${isLoading ? "loading" : ""}`}
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send OTP"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <h2 className="text-xl font-bold">Enter OTP</h2>

      <div className="text-sm text-gray-600">
        OTP sent to: <strong>{email}</strong>
        <button
          type="button"
          onClick={() => setStep("email")}
          className="ml-2 text-blue-600 hover:underline"
        >
          Change email
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">6-Digit OTP</label>
        <input
          type="text"
          value={otp}
          onChange={(e) =>
            setOTP(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className="input input-bordered w-full text-center text-2xl tracking-widest"
          placeholder="123456"
          maxLength={6}
          required
          disabled={isLoading}
        />
      </div>

      {countdown > 0 && (
        <div className="text-sm text-gray-500 text-center">
          OTP expires in: <strong>{formatTime(countdown)}</strong>
        </div>
      )}

      <button
        type="submit"
        className={`btn btn-primary w-full ${isLoading ? "loading" : ""}`}
        disabled={isLoading || otp.length !== 6}
      >
        {isLoading ? "Verifying..." : "Verify & Login"}
      </button>

      <button
        type="button"
        onClick={handleSendOTP}
        className="btn btn-ghost w-full"
        disabled={isLoading || countdown > 540} // Can resend after 1 minute
      >
        Resend OTP
      </button>
    </form>
  );
};

export default OTPLogin;
```

---

## Integration into Your Authentication Page

Update your `Authentication.jsx` to include OTP option:

```jsx
// pages/Authentication.jsx (add this)
import OTPLogin from "../components/OTPLogin";

const Authentication = () => {
  const [authMode, setAuthMode] = useState("login"); // 'login', 'otp', 'create'

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        {/* Mode Switcher */}
        <div className="tabs tabs-boxed justify-center">
          <button
            className={`tab ${authMode === "login" ? "tab-active" : ""}`}
            onClick={() => setAuthMode("login")}
          >
            Username/Password
          </button>
          <button
            className={`tab ${authMode === "otp" ? "tab-active" : ""}`}
            onClick={() => setAuthMode("otp")}
          >
            Email OTP
          </button>
        </div>

        {/* Render Components */}
        {authMode === "login" && <LoginForm />}
        {authMode === "otp" && <OTPLogin />}
        {authMode === "create" && <CreateAccountForm />}
      </div>
    </div>
  );
};
```

---

## Security Features ✅

- **Rate Limiting**: Only one OTP per email at a time
- **Expiration**: OTPs expire in 10 minutes
- **One-time Use**: OTPs are marked as used after verification
- **User Validation**: Only existing users can request OTPs
- **Same JWT Flow**: Uses identical authentication flow as regular login

---

## Testing the Implementation

### **Using Postman/Thunder Client:**

1. **Send OTP:**

   ```
   POST http://localhost:3000/api/users/send-otp
   {
     "email": "admin@yourcompany.com"
   }
   ```

2. **Check your email for the 6-digit OTP**

3. **Verify OTP:**

   ```
   POST http://localhost:3000/api/users/verify-otp
   {
     "email": "admin@yourcompany.com",
     "otp": "123456"
   }
   ```

4. **Check that you receive the same JWT cookie as regular login**

---

## Database Schema Created

The system automatically creates this table:

```sql
CREATE TABLE otps (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Next Steps

1. **Add to your login page** - Implement the React component above
2. **Style to match your theme** - Use your existing DaisyUI classes
3. **Add rate limiting** - Consider implementing rate limiting middleware
4. **Analytics** - Track OTP usage in your admin dashboard

Your OTP system is production-ready and follows the same security patterns as your existing authentication! 🚀
