'use client';
import { useState } from 'react';
import { MapPin, Plus, MoreHorizontal, Edit2, Trash2, X, Loader2, CheckCircle2 } from 'lucide-react';

interface BranchItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: string;
  type: string;
}

interface BranchesListProps {
  initialData: BranchItem[];
}

export default function BranchesList({ initialData }: BranchesListProps) {
  const [branches, setBranches] = useState<BranchItem[]>(initialData);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', address: '', phone: '', type: 'Qo\'shimcha' });

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi');
      
      setIsAddModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Filiallar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Do'konlar va savdo shoxobchalari boshqaruvi</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all"
        >
          <Plus size={18} /> Yangi filial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {branches.length > 0 ? branches.map(branch => (
          <div key={branch.id} className="premium-card rounded-3xl p-6 relative group">
            <div className="absolute top-6 right-6 z-10">
              <button 
                onClick={() => setOpenMenuId(openMenuId === branch.id ? null : branch.id)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center mb-4">
              <MapPin size={24} />
            </div>
            <h3 className="text-lg font-bold mb-1 pr-8">{branch.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4 min-h-[40px] pr-4">{branch.address}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-tertiary)]">Telefon:</span>
                <span className="font-medium">{branch.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-tertiary)]">Turi:</span>
                <span className="font-medium">{branch.type === 'main' ? 'Asosiy' : 'Qo\'shimcha'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={branch.status === 'active' ? "w-2 h-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]" : "w-2 h-2 rounded-full bg-[var(--color-danger)]"}></div>
              <span className={`text-xs font-bold uppercase tracking-wider ${branch.status === 'active' ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>{branch.status === 'active' ? 'Faol' : 'Noaktiv'}</span>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-12 text-center text-[var(--color-text-tertiary)]">
             <MapPin size={48} className="mx-auto opacity-20 mb-4" />
             <p>Hozircha filiallar mavjud emas.</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border)] shadow-2xl p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold">Yangi filial qo'shish</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddBranch} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Filial nomi</label>
                <input 
                  required
                  type="text" 
                  placeholder="Misol: Yunusobod filiali"
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Manzili</label>
                <input 
                  required
                  type="text" 
                  placeholder="Toshkent sh, Yunusobod tumani..."
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Telefon raqami</label>
                <input 
                  type="text" 
                  placeholder="+998 90 123 45 67"
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Filial turi</label>
                <select 
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                >
                  <option value="Qo'shimcha">Qo'shimcha</option>
                  <option value="Asosiy">Asosiy</option>
                </select>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-12 rounded-xl border border-[var(--color-border)] font-bold hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl bg-[var(--color-accent)] text-white font-bold hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
