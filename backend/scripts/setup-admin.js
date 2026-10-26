/**
 * REXBEBE Admin Account Setup Script
 * Usage:
 *   node scripts/setup-admin.js [email] [username] [password]
 * Or configure via environment variables:
 *   ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersFilePath = path.join(__dirname, '../data/admin_users.json');

async function setupAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || 'admin@rexbebe.com').toLowerCase().trim();
  const username = (args[1] || process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
  const password = args[2] || process.env.ADMIN_PASSWORD || 'Admin@Rexbebe2026!';

  console.log(`Setting up secure admin account for: ${email} (${username})...`);

  let users = [];
  try {
    if (fs.existsSync(usersFilePath)) {
      users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading users file:', e.message);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const existingIndex = users.findIndex(u => u.email.toLowerCase() === email || (u.username && u.username.toLowerCase() === username));

  if (existingIndex >= 0) {
    users[existingIndex].passwordHash = passwordHash;
    users[existingIndex].username = username;
    users[existingIndex].email = email;
    users[existingIndex].status = 'ACTIVE';
    users[existingIndex].role = 'SUPER_ADMIN';
    users[existingIndex].updatedAt = new Date().toISOString();
    console.log(`✓ Existing administrator updated with new secure bcrypt password hash.`);
  } else {
    const newAdmin = {
      id: `usr-super-${Date.now()}`,
      name: 'REXBEBE Executive Admin',
      username,
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      permissions: ['all'],
      lastLogin: null,
      createdAt: new Date().toISOString(),
    };
    users.unshift(newAdmin);
    console.log(`✓ New super administrator created with secure bcrypt password hash.`);
  }

  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
  console.log(`✓ Admin credentials saved securely. Password is saved as a one-way bcrypt hash.`);
  console.log(`✓ Email:    ${email}`);
  console.log(`✓ Username: ${username}`);
  console.log(`✓ Status:   ACTIVE`);
  console.log(`✓ Role:     SUPER_ADMIN`);
}

setupAdmin().catch(err => {
  console.error('Failed to set up admin:', err);
  process.exit(1);
});
