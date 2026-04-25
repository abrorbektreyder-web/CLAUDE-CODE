'use client';
import { useState } from 'react';
import { MapPin, Plus, MoreHorizontal, Edit2, Trash2, X } from 'lucide-react';

interface BranchItem {
  id: number;
  name: string;
  address: string;
  phone: string;
  status: string;
  type: string;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchItem[]>([
    { id: 1, name: 'Asosiy filial (Chilonzor)', address: 'Chilonzor tumani, Muqimiy ko\'chasi', phone: '+998 90 123 45 67', status: 'Faol', type: 'Asosiy' },
    { id: 2, name: 'Yunusobod filiali', address: 'Yunusobod tumani, Amir Temur ko\'chasi', phone: '+998 90 765 43 21', status: 'Faol', type: 'Qo\'shimcha' },
  ]);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<BranchItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Filiallar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Do'konlar va savdo shoxobchalari boshqaruvi</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all"
        >
          <Plus size={18} /> Yangi filial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {branches.map(branch => (
          <div key={branch.id} className="premium-card rounded-3xl p-6 relative group">
            
            {/* Context Menu Trigger */}
            <div className="absolute top-6 right-6 z-10">
              <button 
                onClick={() => setOpenMenuId(openMenuId === branch.id ? null : branch.id)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>
              
              {openMenuId === branch.id && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setOpenMenuId(null)}
                  />
                  <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1 shadow-xl animate-in fade-in zoom-in-95">
                    <button 
                      onClick={() => {
                        setEditBranch(branch);
                        setOpenMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      <Edit2 size={14} />
                      Tahrirlash
                    </button>
                    <button 
                      onClick={() => {
                        // delete logic
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
                <span className="font-medium">{branch.type}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={branch.status === 'Faol' ? "w-2 h-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]" : "w-2 h-2 rounded-full bg-[var(--color-danger)]"}></div>
              <span className={`text-xs font-bold uppercase tracking-wider ${branch.status === 'Faol' ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>{branch.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border)] shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold">Yangi filial qo'shish</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Filial nomi</label>
                <input 
                  type="text" 
                  placeholder="Misol: Yunusobod filiali"
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Manzili</label>
                <input 
                  type="text" 
                  placeholder="Toshkent sh, Yunusobod tumani..."
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Telefon raqami</label>
                <input 
                  type="text" 
                  placeholder="+998 90 123 45 67"
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Filial turi</label>
                <select className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] appearance-none">
                  <option>Qo'shimcha</option>
                  <option>Asosiy</option>
                </select>
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
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 h-12 rounded-xl bg-[var(--color-accent)] text-white font-bold hover:bg-[var(--color-accent-hover)] transition-colors shadow-lg shadow-[var(--color-accent)]/20"
              >
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {editBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border)] shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold">Filialni tahrirlash</h3>
              <button 
                onClick={() => setEditBranch(null)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Filial nomi</label>
                <input 
                  type="text" 
                  defaultValue={editBranch.name}
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Manzili</label>
                <input 
                  type="text" 
                  defaultValue={editBranch.address}
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Telefon raqami</label>
                <input 
                  type="text" 
                  defaultValue={editBranch.phone}
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Filial turi</label>
                <select 
                  defaultValue={editBranch.type}
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] appearance-none"
                >
                  <option>Qo'shimcha</option>
                  <option>Asosiy</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                 <label className="flex items-center gap-3 p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-base)] cursor-pointer">
                    <input type="checkbox" defaultChecked={editBranch.status === 'Faol'} className="w-5 h-5 rounded border-[var(--color-border)] accent-[var(--color-accent)]" />
                    <span className="font-semibold text-[var(--color-foreground)]">Filial faol</span>
                  </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setEditBranch(null)}
                className="flex-1 h-12 rounded-xl border border-[var(--color-border)] font-bold hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                Bekor qilish
              </button>
              <button 
                onClick={() => setEditBranch(null)}
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
