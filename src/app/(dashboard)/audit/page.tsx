'use client';
import { useState, useEffect } from 'react';
import { Activity, Search, Filter, Loader2 } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/audit');
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Audit log</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Tizimdagi barcha xatti-harakatlar tarixi</p>
        </div>
      </div>
      
      <div className="premium-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
             <input type="text" placeholder="Qidirish..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all" />
          </div>
          <button className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--color-bg-hover)]">
            <Filter size={18} /> Filtr
          </button>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
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
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-secondary)]">
                    <Loader2 className="animate-spin inline-block mr-2" size={18} />
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-secondary)]">Ma'lumot topilmadi</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td className="px-6 py-4 font-medium">{log.action}</td>
                    <td className="px-6 py-4">{log.user}</td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-tertiary)]">{log.ip}</td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] whitespace-nowrap">{log.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-[var(--color-border)]">
          {loading ? (
            <div className="p-8 text-center text-[var(--color-text-secondary)]">
              <Loader2 className="animate-spin inline-block mr-2" size={18} />
              Yuklanmoqda...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-secondary)]">Ma'lumot topilmadi</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-4 space-y-3 active:bg-[var(--color-bg-hover)] transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="font-bold text-sm leading-tight">{log.action}</div>
                  <div className="text-[10px] font-bold text-[var(--color-text-tertiary)] whitespace-nowrap uppercase">{log.time.split(' - ')[0]}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-[var(--color-text-tertiary)] text-[10px] font-bold">
                      {log.user.charAt(0)}
                    </div>
                    <div className="text-xs font-medium">{log.user}</div>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--color-text-tertiary)]">{log.ip}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
