'use client';
import { useState } from 'react';
import { UserCog, Plus, MoreHorizontal, Edit2, Trash2, X } from 'lucide-react';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  branch: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([
    { id: 1, name: 'Abrorbek Treyder', email: 'admin@mobicenter.uz', role: 'Super Admin', status: 'Faol', branch: 'Barcha filiallar' },
    { id: 2, name: 'Sardor Qodirov', email: 'sardor@mobicenter.uz', role: 'Menejer', status: 'Faol', branch: 'Chilonzor filiali' },
    { id: 3, name: 'Alisher Usmonov', email: 'kassir1@mobicenter.uz', role: 'Kassir', status: 'Faol', branch: 'Chilonzor filiali' },
  ]);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Xodimlar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Tizim foydalanuvchilari va ularning huquqlari</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
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
            {users.map(user => (
              <tr key={user.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold">{user.name}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">{user.email}</div>
                </td>
                <td className="px-6 py-4 font-semibold">{user.role}</td>
                <td className="px-6 py-4">{user.branch}</td>
                <td className="px-6 py-4">
                  <span className="bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {user.status}
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
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-8 top-10 z-20 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1 shadow-xl animate-in fade-in zoom-in-95">
                        <button 
                          onClick={() => {
                            setEditUser(user);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                        >
                          <Edit2 size={14} />
                          Tahrirlash
                        </button>
                        <button 
                          onClick={() => {
                            // delete logic here
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                          O'chirish
                        </button>
                      </div>
                    </>
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
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">F.I.SH</label>
                <input 
                  type="text" 
                  placeholder="Misol: Alisher Usmonov"
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Email (Login)</label>
                <input 
                  type="email" 
                  placeholder="kassir@do'kon.uz"
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Parol</label>
                <input 
                  type="password" 
                  placeholder="Xodim uchun yangi parol"
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Roli</label>
                  <select className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] appearance-none">
                    <option>Kassir</option>
                    <option>Menejer</option>
                    <option>Super Admin</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Filial</label>
                  <select className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] appearance-none">
                    <option>Chilonzor filiali</option>
                    <option>Yunusobod filiali</option>
                    <option>Barcha filiallar</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 h-12 rounded-xl border border-[var(--color-border)] font-bold hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                Bekor qilish
              </button>
              <button 
                onClick={() => {
                  // handle save
                  setIsAddModalOpen(false);
                }}
                className="flex-1 h-12 rounded-xl bg-[var(--color-accent)] text-white font-bold hover:bg-[var(--color-accent-hover)] transition-colors shadow-lg shadow-[var(--color-accent)]/20"
              >
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border)] shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold">Xodimni tahrirlash</h3>
              <button 
                onClick={() => setEditUser(null)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">F.I.SH</label>
                <input 
                  type="text" 
                  defaultValue={editUser.name}
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Email (Login)</label>
                <input 
                  type="email" 
                  defaultValue={editUser.email}
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] text-[var(--color-text-secondary)]"
                  readOnly
                />
                <p className="text-[10px] text-[var(--color-text-tertiary)]">Loginni o'zgartirib bo'lmaydi. Faqat yangi xodim qo'shish orqali mumkin.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Roli</label>
                  <select 
                    defaultValue={editUser.role}
                    className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] appearance-none"
                  >
                    <option>Kassir</option>
                    <option>Menejer</option>
                    <option>Super Admin</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Filial</label>
                  <select 
                    defaultValue={editUser.branch}
                    className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] appearance-none"
                  >
                    <option>Chilonzor filiali</option>
                    <option>Yunusobod filiali</option>
                    <option>Barcha filiallar</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                 <label className="flex items-center gap-3 p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-base)] cursor-pointer">
                    <input type="checkbox" defaultChecked={editUser.status === 'Faol'} className="w-5 h-5 rounded border-[var(--color-border)] accent-[var(--color-accent)]" />
                    <span className="font-semibold text-[var(--color-foreground)]">Akkaunt faol</span>
                  </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setEditUser(null)}
                className="flex-1 h-12 rounded-xl border border-[var(--color-border)] font-bold hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                Bekor qilish
              </button>
              <button 
                onClick={() => {
                  // handle save
                  setEditUser(null);
                }}
                className="flex-1 h-12 rounded-xl bg-[var(--color-accent)] text-white font-bold hover:bg-[var(--color-accent-hover)] transition-colors shadow-lg shadow-[var(--color-accent)]/20"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
