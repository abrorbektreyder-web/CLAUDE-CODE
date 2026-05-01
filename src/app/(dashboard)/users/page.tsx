'use client';
import { useState, useEffect } from 'react';
import { UserCog, Plus, MoreHorizontal, Edit2, Trash2, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  branches?: { name: string } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmitAdd = async (data: any) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || '+998000000000',
          password: data.password,
          role: data.role,
          branchId: data.branchId || 'all'
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setIsAddModalOpen(false);
        reset();
        setShowPassword(false);
        fetchUsers();
      } else {
        setServerError(result.error || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setServerError('Server xatoligi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitEdit = async (data: any) => {
    if (!editUser) return;
    setIsSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || '+998000000000',
          password: data.password || undefined, // Only update if provided
          role: data.role,
          branchId: data.branchId || 'all'
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setIsEditModalOpen(false);
        reset();
        setShowPassword(false);
        fetchUsers();
      } else {
        setServerError(result.error || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setServerError('Server xatoligi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Xodimlar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Tizim foydalanuvchilari va ularning huquqlari</p>
        </div>
        <button 
          onClick={() => { reset(); setServerError(null); setIsAddModalOpen(true); setShowPassword(false); }}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all"
        >
          <Plus size={18} /> Yangi xodim
        </button>
      </div>

      <div className="premium-card rounded-2xl overflow-visible">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-bg-elevated)]/30 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
            <tr>
              <th className="px-6 py-4">Xodim</th>
              <th className="px-6 py-4">Roli</th>
              <th className="px-6 py-4">Filial</th>
              <th className="px-6 py-4">Holat</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-text-tertiary)]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-text-tertiary)]">
                  Hali xodimlar yo'q
                </td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold">{user.name}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">{user.email}</div>
                </td>
                <td className="px-6 py-4 font-semibold uppercase text-xs">
                  {user.role === 'cashier' ? 'Kassir' : user.role === 'manager' ? 'Menejer' : 'Admin'}
                </td>
                <td className="px-6 py-4">{user.branches?.name || 'Barcha filiallar'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    user.is_active 
                      ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20'
                      : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20'
                  }`}>
                    {user.is_active ? 'Faol' : "Faol emas"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                    className="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {openMenuId === user.id && (
                    <div className="absolute right-6 top-12 z-10 w-48 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <button 
                        onClick={() => {
                          setEditUser(user);
                          setIsEditModalOpen(true);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--color-bg-hover)] transition-colors flex items-center gap-2"
                      >
                        <Edit2 size={16} className="text-[var(--color-text-secondary)]" />
                        Tahrirlash
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(user.email);
                          setOpenMenuId(null);
                          alert('Login nusxalandi: ' + user.email);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--color-bg-hover)] transition-colors flex items-center gap-2 border-t border-[var(--color-border)]"
                      >
                        <UserCog size={16} className="text-[var(--color-text-secondary)]" />
                        Loginni nusxalash
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border)] shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold">Yangi xodim qo'shish</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">F.I.SH</label>
                <input 
                  type="text" 
                  {...register('name', { required: true })}
                  placeholder="Misol: Alisher Usmonov"
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Email (Login)</label>
                <input 
                  type="email" 
                  {...register('email', { required: true })}
                  placeholder="kassir@m-telecom.uz"
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Telefon</label>
                <input 
                  type="tel" 
                  {...register('phone')}
                  placeholder="+998901234567"
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Parol</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    {...register('password', { required: true, minLength: 6 })}
                    placeholder="Kamida 6 ta belgi"
                    className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 pr-12 text-sm outline-none focus:border-[var(--color-accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)] transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Roli</label>
                  <select {...register('role', { required: true })} className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] appearance-none">
                    <option value="cashier">Kassir</option>
                    <option value="manager">Menejer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Filial</label>
                  <select {...register('branchId')} className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] appearance-none">
                    <option value="all">Barcha filiallar</option>
                    {/* Add dynamic branches here if needed */}
                  </select>
                </div>
              </div>

              {serverError && <p className="text-sm text-red-500 font-medium">{serverError}</p>}

              <div className="flex gap-3 mt-8 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-12 rounded-xl border border-[var(--color-border)] font-bold hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl bg-[var(--color-accent)] text-white font-bold hover:bg-[var(--color-accent-hover)] transition-colors shadow-lg shadow-[var(--color-accent)]/20 flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border)] shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold">Xodimni tahrirlash</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">F.I.SH</label>
                <input 
                  type="text" 
                  defaultValue={editUser.name}
                  {...register('name', { required: true })}
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Email (Login)</label>
                <input 
                  type="email" 
                  defaultValue={editUser.email}
                  {...register('email', { required: true })}
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Yangi Parol (ixtiyoriy)</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    {...register('password')}
                    placeholder="O'zgartirish uchun kiriting..."
                    className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 pr-12 text-sm outline-none focus:border-[var(--color-accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)] transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Roli</label>
                  <select defaultValue={editUser.role} {...register('role', { required: true })} className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] appearance-none">
                    <option value="cashier">Kassir</option>
                    <option value="manager">Menejer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {serverError && <p className="text-sm text-red-500 font-medium">{serverError}</p>}

              <div className="flex gap-3 mt-8 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 h-12 rounded-xl border border-[var(--color-border)] font-bold hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl bg-[var(--color-accent)] text-white font-bold hover:bg-[var(--color-accent-hover)] transition-colors shadow-lg shadow-[var(--color-accent)]/20 flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
