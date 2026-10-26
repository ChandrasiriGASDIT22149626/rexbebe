import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STORE_MANAGER' | 'CONTENT_MANAGER' | 'CUSTOMER_SUPPORT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  permissions: string[];
  lastLogin: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface SanitizedAdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  permissions: string[];
  lastLogin: string | null;
  createdAt: string;
}

const usersFilePath = path.join(__dirname, '../../data/admin_users.json');

function readUsers(): AdminUser[] {
  try {
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[adminUserService] Error reading admin_users.json:', err);
  }
  return [];
}

function writeUsers(users: AdminUser[]): void {
  try {
    const dir = path.dirname(usersFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[adminUserService] Error writing admin_users.json:', err);
  }
}

export function sanitizeUser(user: AdminUser): SanitizedAdminUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username || user.email.split('@')[0],
    email: user.email,
    role: user.role,
    status: user.status,
    permissions: user.permissions || [],
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
}

export class AdminUserService {
  getAll(): SanitizedAdminUser[] {
    return readUsers().map(sanitizeUser);
  }

  findById(id: string): AdminUser | null {
    const users = readUsers();
    return users.find(u => u.id === id) || null;
  }

  findByEmailOrUsername(identifier: string): AdminUser | null {
    const clean = identifier.trim().toLowerCase();
    const users = readUsers();
    return users.find(u => 
      u.email.toLowerCase() === clean || 
      (u.username && u.username.toLowerCase() === clean)
    ) || null;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  updateLastLogin(id: string): void {
    const users = readUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      user.lastLogin = new Date().toISOString();
      writeUsers(users);
    }
  }

  async createAdmin(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: AdminUser['role'];
    permissions?: string[];
  }): Promise<SanitizedAdminUser> {
    const users = readUsers();
    const existing = this.findByEmailOrUsername(data.email) || this.findByEmailOrUsername(data.username);
    if (existing) {
      throw new Error(`An administrator with email '${data.email}' or username '${data.username}' already exists.`);
    }

    const passwordHash = await this.hashPassword(data.password);
    const newUser: AdminUser = {
      id: `usr-admin-${Date.now()}`,
      name: data.name,
      username: data.username.toLowerCase(),
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role || 'ADMIN',
      status: 'ACTIVE',
      permissions: data.permissions || ['manage_orders', 'manage_inventory', 'manage_products'],
      lastLogin: null,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);
    return sanitizeUser(newUser);
  }

  updateStatus(id: string, status: AdminUser['status']): SanitizedAdminUser {
    const users = readUsers();
    const user = users.find(u => u.id === id);
    if (!user) throw new Error(`Admin user '${id}' not found`);
    user.status = status;
    user.updatedAt = new Date().toISOString();
    writeUsers(users);
    return sanitizeUser(user);
  }

  /**
   * Initializes the primary admin account securely on boot if no hashed password exists.
   * Reads credentials from environment variables ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD.
   */
  async ensurePrimaryAdmin(): Promise<void> {
    const users = readUsers();
    const defaultEmail = process.env.ADMIN_INITIAL_EMAIL || process.env.ADMIN_EMAIL || 'admin@rexbebe.com';
    const defaultUsername = process.env.ADMIN_INITIAL_USERNAME || process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@Rexbebe2026!';

    // Check if primary admin exists with a valid passwordHash
    const primary = users.find(u => u.email.toLowerCase() === defaultEmail.toLowerCase());

    if (primary && primary.passwordHash && primary.passwordHash.startsWith('$2')) {
      // Primary admin already properly configured with bcrypt hash
      if (!primary.username) {
        primary.username = defaultUsername;
        writeUsers(users);
      }
      return;
    }

    const passwordHash = await this.hashPassword(defaultPassword);

    if (primary) {
      primary.username = defaultUsername;
      primary.passwordHash = passwordHash;
      primary.status = 'ACTIVE';
      primary.role = 'SUPER_ADMIN';
      if (!primary.permissions || primary.permissions.length === 0) {
        primary.permissions = ['all'];
      }
      writeUsers(users);
      console.log(`[Admin Security] Updated primary admin (${defaultEmail}) with secure bcrypt password hash.`);
    } else {
      const newPrimary: AdminUser = {
        id: 'usr-super-1',
        name: 'REXBEBE Executive Admin',
        username: defaultUsername,
        email: defaultEmail.toLowerCase(),
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        permissions: ['all'],
        lastLogin: null,
        createdAt: new Date().toISOString(),
      };
      users.unshift(newPrimary);
      writeUsers(users);
      console.log(`[Admin Security] Created primary super admin (${defaultEmail}) with secure bcrypt password hash.`);
    }
  }
}

export const adminUserService = new AdminUserService();
