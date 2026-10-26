'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Lock,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Activity,
  Edit2,
  Check,
  X,
  Mail,
  User,
  Shield,
  Trash2,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';
import { AdminUserRecord } from '../../../services/adminService';

export default function AdminUsersPage() {
  const { adminUsers, addAdminUser, updateAdminUserStatus, deleteAdminUser, auditLogs } = useAdminData();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUserRecord | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminUserRecord['role']>('STORE_MANAGER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteAdminUser(userToDelete.id);
      showToast('The item has been permanently deleted.');
      setUserToDelete(null);
    } catch (err: any) {
      showToast(
        err.message ||
          "We couldn't save your changes. Your existing information has not been intentionally removed. Please try again."
      );
    }
  };

  const ROLE_PERMISSIONS: Record<AdminUserRecord['role'], string[]> = {
    SUPER_ADMIN: [
      'Full Store Access',
      'Manage Admin Accounts & Permissions',
      'Store & International Settings',
      'Financial & Payment Records',
      'Publish & Unpublish Website Content',
      'Inventory & Price Adjustments',
    ],
    STORE_MANAGER: [
      'View & Process Customer Orders',
      'Manage Products & Inventory Quantities',
      'Manage Categories & Collections',
      'Website Pages & Content Editing',
      'Customer Feedback Moderation',
    ],
    CONTENT_MANAGER: [
      'Homepage Studio Visual Editing',
      'Website Pages Management',
      'Categories & Navigation Menu',
      'Media Library Management',
      'Collections & Banners',
    ],
    CUSTOMER_SUPPORT: [
      'View Customer Orders',
      'Update Order Fulfillment & Tracking',
      'View Customer Feedback & Inquiries',
      'Add Internal Order Notes',
    ],
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSubmitting(true);
    try {
      await addAdminUser({
        name,
        email,
        role,
        permissions: ROLE_PERMISSIONS[role],
      });
      showToast(`Administrator account for ${name} (${role}) created successfully! 🛡️`);
      setName('');
      setEmail('');
      setRole('STORE_MANAGER');
      setShowAddModal(false);
    } catch (e: any) {
      showToast(e.message || 'Could not create administrator account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUserRecord) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (user.role === 'SUPER_ADMIN' && user.email === 'admin@rexbebe.com') {
      alert('Primary Owner / Super Admin account cannot be suspended.');
      return;
    }
    try {
      await updateAdminUserStatus(user.id, { status: nextStatus });
      showToast(`Account status for ${user.name} changed to ${nextStatus}.`);
    } catch (e) {
      showToast('Could not update user status.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Admin Users & Permissions"
          subtitle="Manage who can access the REXBEBE administration system and what each person is allowed to do."
          actions={
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAuditModal(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold transition-all shadow-2xs"
              >
                <Activity className="w-3.5 h-3.5 text-amber-700" />
                <span>Security Audit Trail ({auditLogs.length})</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Administrator</span>
              </button>
            </div>
          }
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Security Architecture Notice */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-black text-stone-900 text-sm">
                  Role-Based Security & Activity Logging Active
                </h3>
                <p className="text-xs text-stone-600 max-w-2xl leading-relaxed">
                  Administrator access is restricted by role. All administrative actions (orders, products,
                  inventory adjustments, category updates, user status changes) are recorded in the security audit trail.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                ● 256-Bit SSL Enforced
              </span>
            </div>
          </div>

          {/* Admin Users Table */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-stone-900 text-base">
                  Authorized Administrators ({adminUsers.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Staff members permitted to log in and manage the store
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Administrator</th>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4">Permissions Scope</th>
                    <th className="p-4">Last Activity</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-xs">{user.name}</p>
                            <p className="text-[10px] text-stone-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            user.role === 'SUPER_ADMIN'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : user.role === 'STORE_MANAGER'
                              ? 'bg-sky-100 text-sky-900 border border-sky-300'
                              : user.role === 'CONTENT_MANAGER'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-stone-100 text-stone-800 border border-stone-300'
                          }`}
                        >
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-stone-700 max-w-xs truncate">
                          {user.permissions?.join(', ') || 'Standard permissions'}
                        </p>
                      </td>
                      <td className="p-4 text-stone-500 font-medium">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                          : 'Pending initial login'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                              user.status === 'ACTIVE'
                                ? 'bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          {user.email !== 'admin@rexbebe.com' ? (
                            <button
                              onClick={() => setUserToDelete(user)}
                              className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Permanently Delete Administrator"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-stone-300 cursor-not-allowed"
                              title="Primary boutique owner account cannot be deleted"
                            >
                              <Shield className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Governance Reference Card */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="font-heading font-black text-stone-900 text-base">
              Predefined Role Permissions Reference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(ROLE_PERMISSIONS).map(([roleKey, perms]) => (
                <div key={roleKey} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
                  <h4 className="font-black text-stone-900 text-xs uppercase tracking-wider text-amber-800">
                    {roleKey.replace('_', ' ')}
                  </h4>
                  <ul className="space-y-1 text-[11px] text-stone-600">
                    {perms.map((p, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* ADD ADMINISTRATOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-heading font-black text-stone-900">
                  Add Administrator
                </h3>
                <p className="text-xs text-stone-500">Create a secure management account</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Jayawardena"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Business Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kasun@rexbebe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-900"
                >
                  <option value="STORE_MANAGER">Store Manager (Orders, Inventory, Products, Content)</option>
                  <option value="CONTENT_MANAGER">Content Manager (Homepage, Navigation, Pages)</option>
                  <option value="CUSTOMER_SUPPORT">Customer Support (Orders & Reviews)</option>
                  <option value="SUPER_ADMIN">Owner / Super Admin (Full Governance)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">Security Note:</p>
                <p>An activation token will be generated. The new administrator will set their password securely upon initial login.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURITY AUDIT TRAIL MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 border border-stone-200 shadow-2xl space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-heading font-black text-stone-900 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-amber-700" />
                  <span>Security & Action Audit Trail</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Chronological record of sensitive administrative actions and configuration changes
                </p>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-white hover:bg-stone-50/50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-amber-800 text-[10px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {log.action}
                        </span>
                        <span className="font-bold text-stone-900">{log.userName}</span>
                        <span className="text-[10px] text-stone-400">({log.userEmail})</span>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-stone-700 text-xs font-medium">{log.details}</p>
                    <p className="text-[10px] text-stone-400 font-mono">Server IP: {log.ip}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-stone-400 font-bold">
                  No audit logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE ADMINISTRATOR MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-stone-900">
                  Permanently Delete Administrator?
                </h3>
                <span className="text-[11px] text-stone-500 font-semibold">
                  Safe Deletion & Access Revocation
                </span>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
              <p className="font-bold text-stone-800">
                User: <span className="text-amber-800">{userToDelete.name}</span> ({userToDelete.email})
              </p>
              <p className="text-stone-600 leading-relaxed font-medium">
                Are you sure you want to permanently delete this administrator account? All administrative privileges will be revoked immediately and this record will be deleted from the database.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                Permanently Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
