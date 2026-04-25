'use client';
import { Activity, Search, Filter } from 'lucide-react';

export default function AuditPage() {
  const logs = [
    { id: 1, action: 'Tizimga kirdi', user: 'Super Admin', ip: '192.168.1.10', time: '10:45 - 25.04.2026', type: 'login' },
    { id: 2, action: 'Yangi savdo qo\'shildi (#1024)', user: 'Kassir #1', ip: '10.0.0.15', time: '09:30 - 25.04.2026', type: 'create' },
    { id: 3, action: 'Nasiya to\'lovi qabul qilindi', user: 'Kassir #1', ip: '10.0.0.15', time: '18:15 - 24.04.2026', type: 'update' },
    { id: 4, action: 'Filial sozlamalari o\'zgartirildi', user: 'Super Admin', ip: '192.168.1.10', time: '14:20 - 24.04.2026', type: 'system' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Audit log</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Tizimdagi barcha xatti-harakatlar tarixi</p>
        </div>
      </div>
      
      <div className="premium-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
             <input type="text" placeholder="Qidirish..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)]" />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--color-bg-hover)]">
            <Filter size={18} /> Filtr
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-bg-elevated)]/30 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
            <tr>
              <th className="px-6 py-4">Amal</th>
              <th className="px-6 py-4">Foydalanuvchi</th>
              <th className="px-6 py-4">IP Manzil</th>
              <th className="px-6 py-4">Vaqt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                <td className="px-6 py-4 font-medium">{log.action}</td>
                <td className="px-6 py-4">{log.user}</td>
                <td className="px-6 py-4 font-mono text-xs">{log.ip}</td>
                <td className="px-6 py-4 text-[var(--color-text-secondary)]">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
