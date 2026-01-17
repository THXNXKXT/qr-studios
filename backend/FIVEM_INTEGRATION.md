# 🎮 FiveM License Integration Guide

**QR Studios License System - FiveM Integration**

---

## 📋 Overview

ระบบ License ของ QR Studios ถูกออกแบบมาให้ดีกว่าระบบเดิม:

### **✅ Improvements Over Old System**

| Feature | Old System | QR Studios |
|---------|-----------|------------|
| **SQL Injection** | ❌ Vulnerable | ✅ Prisma ORM (Safe) |
| **IP Whitelist** | Single IP only | **Multiple IPs (up to 5)** |
| **Rate Limiting** | ❌ None | ✅ 10 req/min per license |
| **Token Security** | Plain text | ✅ HMAC-SHA256 signed |
| **Download URLs** | ❌ Direct access | ✅ Signed URLs (1hr expiry) |
| **License Expiry** | Manual tracking | ✅ Auto-check & update |
| **Logging** | Basic | ✅ Detailed with IP tracking |
| **API Design** | PHP + MySQL | ✅ Modern REST API |

---

## 🔧 FiveM Server Integration

### **1. License Verification (server.lua)**

```lua
-- config.lua
Config = {}
Config.LicenseKey = "YOUR_LICENSE_KEY_HERE"  -- Get from QR Studios Dashboard
Config.ResourceName = GetCurrentResourceName()
Config.API = {
    BaseURL = "https://api.qrstudios.com",  -- Your API URL
    VerifyEndpoint = "/api/licenses/verify"
}

-- server/license.lua
local LicenseValid = false
local LicenseInfo = {}

function VerifyLicense()
    local ip = GetConvar("sv_licenseKey", "unknown")
    
    PerformHttpRequest(
        Config.API.BaseURL .. Config.API.VerifyEndpoint .. 
        "?key=" .. Config.LicenseKey .. 
        "&resource=" .. Config.ResourceName,
        function(statusCode, response, headers)
            if statusCode == 200 then
                local data = json.decode(response)
                
                if data.valid then
                    LicenseValid = true
                    LicenseInfo = data.license
                    
                    print("^2[LICENSE] ✅ Verified Successfully^0")
                    print("^3[LICENSE] Product: " .. LicenseInfo.product .. "^0")
                    print("^3[LICENSE] Version: " .. LicenseInfo.version .. "^0")
                    print("^3[LICENSE] User: " .. LicenseInfo.user .. "^0")
                    
                    if LicenseInfo.expiresAt then
                        print("^3[LICENSE] Expires: " .. LicenseInfo.expiresAt .. "^0")
                    end
                    
                    -- Start your resource here
                    TriggerEvent('yourscript:start')
                else
                    print("^1[LICENSE] ❌ Verification Failed: " .. (data.error or "Unknown error") .. "^0")
                    LicenseValid = false
                end
            else
                print("^1[LICENSE] ❌ API Error: " .. statusCode .. "^0")
                LicenseValid = false
            end
        end,
        "GET",
        "",
        {["Content-Type"] = "application/json"}
    )
end

-- Verify on resource start
AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        print("^3[LICENSE] Verifying license...^0")
        VerifyLicense()
        
        -- Re-verify every 30 minutes
        SetTimeout(30 * 60 * 1000, function()
            VerifyLicense()
        end)
    end
end)

-- Export for other scripts
exports('IsLicenseValid', function()
    return LicenseValid
end)

exports('GetLicenseInfo', function()
    return LicenseInfo
end)

-- Prevent resource start if license invalid
AddEventHandler('onResourceStarting', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        if not LicenseValid then
            print("^1[LICENSE] ❌ Resource blocked - Invalid license^0")
            CancelEvent()
        end
    end
end)
```

---

## 🔐 Advanced Security Features

### **2. IP Whitelist Management**

```lua
-- Client-side command to reset IP (for users)
RegisterCommand('resetip', function()
    TriggerServerEvent('license:requestIPReset')
end, false)

-- Server-side
RegisterServerEvent('license:requestIPReset')
AddEventHandler('license:requestIPReset', function()
    local src = source
    local identifier = GetPlayerIdentifier(src, 0)
    
    -- User must reset via dashboard
    TriggerClientEvent('chat:addMessage', src, {
        color = {255, 165, 0},
        multiline = true,
        args = {"[LICENSE]", "Please reset your IP via QR Studios Dashboard: https://qrstudios.com/dashboard/licenses"}
    })
end)
```

---

## 📡 API Endpoints

### **License Verification (Public)**
```http
GET /api/licenses/verify?key=YOUR_KEY&resource=RESOURCE_NAME
```

**Response (Success):**
```json
{
  "valid": true,
  "license": {
    "key": "Z9_xxxxxxxxxxxx",
    "status": "ACTIVE",
    "product": "Advanced Admin Panel",
    "version": "2.1.0",
    "user": "username",
    "discordId": "123456789",
    "expiresAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "valid": false,
  "error": "IP address not whitelisted"
}
```

### **User License Management (Authenticated)**

#### Get All Licenses
```http
GET /api/licenses
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Get License Details
```http
GET /api/licenses/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Update IP Whitelist (Max 5 IPs)
```http
PATCH /api/licenses/:id/ip
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "ipAddresses": ["1.2.3.4", "5.6.7.8"]
}
```

#### Reset IP Whitelist
```http
POST /api/licenses/:id/ip/reset
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Get Download URL (Signed, 1hr expiry)
```http
GET /api/licenses/:id/download-url
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "/api/licenses/xxx/download?token=yyy",
    "expiresIn": 3600,
    "expiresAt": "2025-12-31T01:00:00.000Z"
  }
}
```

---

## 🛡️ Security Features

### **1. Rate Limiting**
- **10 requests per minute** per license key
- Prevents brute force attacks
- Returns `429 Too Many Requests` with `Retry-After` header

### **2. IP Whitelist**
- **Multiple IP support** (up to 5 IPs)
- Auto-bind on first verification
- User can reset via dashboard
- Comma-separated storage: `"1.2.3.4,5.6.7.8"`

### **3. Signed Download URLs**
- **HMAC-SHA256** signature
- **1 hour expiry**
- Prevents direct file access
- Token format: Base64(JSON + Signature)

### **4. License Status Tracking**
- `ACTIVE` - Valid license
- `EXPIRED` - Past expiry date
- `REVOKED` - Manually disabled

### **5. Detailed Logging**
```
[LICENSE] Verification - License: xxx, IP: 1.2.3.4, Success: true, Resource: my_script
[LICENSE] IP_UPDATE - License: xxx, Details: Updated IPs: 1.2.3.4,5.6.7.8
[LICENSE] DOWNLOAD - License: xxx, Details: Download URL generated
```

---

## 📊 Comparison with Old System

### **Old System (4K License)**
```lua
-- ❌ Issues:
-- 1. SQL Injection vulnerable
-- 2. Single IP only
-- 3. No rate limiting
-- 4. Plain text tokens
-- 5. Direct MySQL queries
-- 6. No download security
```

### **QR Studios System**
```lua
-- ✅ Improvements:
-- 1. Prisma ORM (SQL safe)
-- 2. Multiple IPs (up to 5)
-- 3. Rate limiting (10/min)
-- 4. HMAC-SHA256 signed tokens
-- 5. REST API with TypeScript
-- 6. Signed download URLs (1hr expiry)
-- 7. Auto expiry checking
-- 8. Detailed logging
-- 9. Modern error handling
-- 10. JWT authentication for management
```

---

## 🎯 Best Practices

### **For Script Developers:**
1. ✅ Always verify license on resource start
2. ✅ Re-verify periodically (every 30 min)
3. ✅ Block resource if verification fails
4. ✅ Use exports for license status
5. ✅ Handle API errors gracefully
6. ✅ Don't hardcode license keys (use config)

### **For Users:**
1. ✅ Keep license key secure
2. ✅ Update IP whitelist when server IP changes
3. ✅ Use dashboard to manage licenses
4. ✅ Don't share license keys
5. ✅ Check expiry dates

---

## 🔧 Testing

### **Test License Verification:**
```bash
# Replace with your license key
curl "https://api.qrstudios.com/api/licenses/verify?key=Z9_xxxxxxxxxxxx&resource=test_script"
```

### **Test Rate Limiting:**
```bash
# Send 15 requests rapidly (should get rate limited after 10)
for i in {1..15}; do
  curl "https://api.qrstudios.com/api/licenses/verify?key=YOUR_KEY"
  echo "Request $i"
done
```

---

## 📝 Example fxmanifest.lua

```lua
fx_version 'cerulean'
game 'gta5'

author 'QR Studios'
description 'Your Script Name'
version '1.0.0'

-- License verification
server_scripts {
    'config.lua',
    'server/license.lua',
    'server/main.lua'
}

client_scripts {
    'client/main.lua'
}

-- Dependencies
dependencies {
    '/server:5848',  -- Minimum server version
    '/onesync'       -- OneSync required
}
```

---

## 🆘 Troubleshooting

### **"IP address not whitelisted"**
- Reset IP via dashboard: `/dashboard/licenses`
- Or contact support

### **"License has expired"**
- Renew license via dashboard
- Check expiry date

### **"Too many requests"**
- Wait 1 minute before retrying
- Don't spam verification endpoint

### **"License not found"**
- Check license key spelling
- Verify resource name matches

---

## 📞 Support

- **Dashboard:** https://qrstudios.com/dashboard
- **API Docs:** https://api.qrstudios.com/docs
- **Discord:** https://discord.gg/qrstudios

---

*QR Studios License System v1.0 - Secure, Modern, Reliable*
