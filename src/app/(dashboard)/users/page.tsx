'use client';
import { UserCog, Plus, MoreHorizontal } from 'lucide-react';

export default function UsersPage() {
  const users = [
    { id: 1, name: 'Abrorbek Treyder', email: 'admin@mobicenter.uz', role: 'Super Admin', status: 'Faol', branch: 'Barcha filiallar' },
    { id: 2, name: 'Sardor Qodirov', email: 'sardor@mobicenter.uz', role: 'Menejer', status: 'Faol', branch: 'Chilonzor filiali' },
    { id: 3, name: 'Alisher Usmonov', email: 'kassir1@mobicenter.uz', role: 'Kassir', status: 'Faol', branch: 'Chilonzor filiali' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Xodimlar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Tizim foydalanuvchilari va ularning huquqlari</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all">
          <Plus size={18} /> Yangi xodim
        </button>
      </div>

      <div className="premium-card rounded-2xl overflow-hidden">
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
                <td className="px-6 py-4 text-right">
                  <button className="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
