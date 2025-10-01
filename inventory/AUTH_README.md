# Inventory System Authentication

The inventory system now includes password protection to prevent unauthorized access.

## Default Password

**Default Password:** `123`

⚠️ **Important:** Change this password immediately in production!

## How to Set a Custom Password

### Option 1: Using Environment Variable (Recommended)

1. Open your `.env` file
2. Add this line with your desired password hash:
   ```
   VITE_INVENTORY_PASSWORD_HASH=your_hash_here
   ```

### Option 2: Generate a Password Hash

To generate a hash for your password:

```javascript
// Run this in your browser console:
const password = "your_secure_password";
const encoder = new TextEncoder();
const data = encoder.encode(password);
crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Password hash:', hash);
});
```

### Option 3: Use This Helper Script

```bash
# Create a file called hash-password.mjs
cat > hash-password.mjs << 'EOF'
import crypto from 'crypto';

const password = process.argv[2] || '123';
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nAdd this to your .env file:');
console.log(`VITE_INVENTORY_PASSWORD_HASH=${hash}`);
EOF

# Run it:
node hash-password.mjs "your_secure_password"
```

## Password Hashes for Common Passwords (For Testing Only!)

| Password | SHA-256 Hash |
|----------|-------------|
| 123 (default) | `a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3` |
| password | `5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8` |
| admin | `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918` |

⚠️ **Never use these in production!**

## Session Management

- Sessions last for **8 hours** after authentication
- Sessions are stored in `sessionStorage` (cleared when browser is closed)
- Click **🔒 Logout** button to end session manually

## Security Features

- ✅ Password hashing (SHA-256)
- ✅ Session expiration (8 hours)
- ✅ No password stored in code
- ✅ Configurable via environment variables
- ✅ Session-only storage (auto-logout on browser close)

## For Production Use

1. **Change the default password immediately**
2. **Use a strong, unique password**
3. **Keep the password hash in .env file**
4. **Add .env to .gitignore** (already done)
5. **Consider adding Supabase Auth** for multi-user support
6. **Set up HTTPS** (Vercel does this automatically)

## Upgrading to Full Authentication

For multi-user support with roles and permissions, consider:

1. **Supabase Auth** - Built-in user management
2. **Row Level Security (RLS)** - Database-level permissions
3. **Role-based Access Control** - Admin, Manager, Viewer roles
4. **Audit Logging** - Track who did what and when

See `docs/authentication-upgrade.md` for implementation guide.
