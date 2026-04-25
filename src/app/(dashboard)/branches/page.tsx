'use client';
import { MapPin, Plus, MoreHorizontal } from 'lucide-react';

export default function BranchesPage() {
  const branches = [
    { id: 1, name: 'Asosiy filial (Chilonzor)', address: 'Chilonzor tumani, Muqimiy ko\'chasi', phone: '+998 90 123 45 67', status: 'Faol', type: 'Asosiy' },
    { id: 2, name: 'Yunusobod filiali', address: 'Yunusobod tumani, Amir Temur ko\'chasi', phone: '+998 90 765 43 21', status: 'Faol', type: 'Qo\'shimcha' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Filiallar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Do'konlar va savdo shoxobchalari boshqaruvi</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all">
          <Plus size={18} /> Yangi filial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="premium-card rounded-3xl p-6 relative group">
            <div className="absolute top-6 right-6">
              <button className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center mb-4">
              <MapPin size={24} />
            </div>
            <h3 className="text-lg font-bold mb-1">{branch.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4 min-h-[40px]">{branch.address}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-tertiary)]">Telefon:</span>
                <span className="font-medium">{branch.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-tertiary)]">Turi:</span>
                <span className="font-medium">{branch.type}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]"></div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)]">{branch.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
