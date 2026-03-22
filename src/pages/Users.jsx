import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { userService } from '../services/index.js';
import toast from 'react-hot-toast';
import { PlusIcon, PencilSquareIcon, UserGroupIcon, TrashIcon } from '@heroicons/react/24/outline';
import ActionModal from '../components/POS/ActionModal';

const ROLE_BADGE = {
  'Super Admin': 'bg-purple-100 text-primary',
  'Admin': 'bg-blue-100 text-blue-700',
  'Worker': 'bg-green-100 text-green-700',
};

function Users() {
  const { currentUser } = usePOS();
  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const isAdmin = ['Admin', 'Super Admin'].includes(currentUser?.role);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'Worker' });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await userService.getAll();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setFormData({ name: user.name, username: user.username, password: '', role: user.role });
      setSelectedUser(user);
      setIsEditing(true);
    } else {
      setFormData({ name: '', username: '', password: '', role: 'Worker' });
      setSelectedUser(null);
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        const payload = { name: formData.name, role: formData.role };
        if (formData.password) payload.password = formData.password;
        await userService.update(selectedUser._id, payload);
        toast.success('User updated successfully');
      } else {
        await userService.create(formData);
        toast.success('User created successfully');
      }
      await fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    if (user._id === currentUser._id) {
      toast.error("You can't deactivate your own account");
      return;
    }
    try {
      await userService.update(user._id, { active: !user.active });
      toast.success(user.active ? 'User deactivated' : 'User activated');
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = (user) => {
    if (user._id === currentUser._id) {
       toast.error("You can't delete your own account");
       return;
    }
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await userService.delete(userToDelete._id);
      toast.success('User deleted successfully');
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const canEdit = (user) => {
    if (user._id === currentUser._id) return true;
    if (user.role === 'Super Admin' && !isSuperAdmin) return false;
    if (user.role === 'Admin' && !isSuperAdmin) return false;
    return true;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage staff accounts and access levels</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-1.5" /> Add User
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[540px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs tracking-wider uppercase">
                <th className="px-5 py-3 font-semibold w-12"></th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Username</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-gray-400">Loading users...</td></tr>
              ) : users.map(user => (
                <tr key={user._id} className={`hover:bg-gray-50 transition-colors ${!user.active ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-4 text-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mx-auto text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {user.name}
                    {user._id === currentUser._id && <span className="ml-2 text-xs text-primary font-semibold">(You)</span>}
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-mono text-sm">@{user.username}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${ROLE_BADGE[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {canEdit(user) ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(user)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        {user._id !== currentUser._id && (
                          <button onClick={() => handleToggleActive(user)} className={`px-2 py-1 rounded text-xs font-semibold transition ${user.active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                            {user.active ? 'Disable' : 'Enable'}
                          </button>
                        )}
                        {isSuperAdmin && user._id !== currentUser._id && (
                          <button onClick={() => handleDeleteUser(user)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Restricted</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="e.g. Rahul Sharma" />
              </div>
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username*</label>
                  <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-mono" placeholder="rahul123" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isEditing ? 'New Password (leave blank to keep)' : 'Password*'}</label>
                <input type="password" required={!isEditing} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role*</label>
                {/* Super Admin: full control. Admin: can only assign Worker, sees read-only badge for Admin/SuperAdmin users */}
                {isSuperAdmin ? (
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none text-sm">
                    <option value="Worker">Worker (POS only)</option>
                    <option value="Admin">Admin (Dashboard + POS)</option>
                    <option value="Super Admin">Super Admin (Full Access)</option>
                  </select>
                ) : (formData.role === 'Admin' || formData.role === 'Super Admin') ? (
                  // Admin editing a higher-role user - show as read-only
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ROLE_BADGE[formData.role] || ''}`}>{formData.role}</span>
                    <span className="text-gray-400 text-xs">(cannot change — contact Super Admin)</span>
                  </div>
                ) : (
                  // Admin editing a Worker — can only keep them as Worker
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none text-sm">
                    <option value="Worker">Worker (POS only)</option>
                  </select>
                )}
              </div>
              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-medium rounded-lg text-sm transition">
                  {saving ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ActionModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User Account"
        message={`Are you sure you want to PERMANENTLY delete ${userToDelete?.name}? This action cannot be undone and they will lose all access.`}
        confirmText="Yes, Delete User"
        type="danger"
      />
    </div>
  );
}

export default Users;
