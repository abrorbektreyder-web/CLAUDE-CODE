'use client';
import { useState } from 'react';
import { BarChart3, Download, Calendar, ChevronDown, FileSpreadsheet, FileText, Check } from 'lucide-react';

export default function ReportsPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Oxirgi 30 kun');

  const filterOptions = [
    'Bugun',
    'Kecha',
    'Ushbu hafta',
    'Ushbu oy',
    'Oxirgi 30 kun',
    'Yillik hisobot',
    'Barcha vaqt'
  ];

  const handleExportCSV = () => {
    // Generate a simple CSV file with sample data
    const headers = ["Sana", "Umumiy Tushum (UZS)", "Sof foyda (UZS)", "Sotilgan tovarlar", "Yangi mijozlar"];
    const rows = [
      ["2024-04-01", "12500000", "2800000", "42", "15"],
      ["2024-04-02", "14200000", "3100000", "48", "12"],
      ["2024-04-03", "9800000", "1900000", "35", "8"],
      ["2024-04-04", "18500000", "4200000", "55", "22"],
      ["Jami:", "145500000", "32400000", "450", "124"]
    ];

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mobicenter_hisobot_${selectedFilter.toLowerCase().replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExportOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Hisobotlar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Kengaytirilgan moliyaviy va savdo tahlillari</p>
        </div>
        
        <div className="flex items-center gap-3 relative">
          
          {/* Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--color-bg-hover)] active:scale-95"
            >
              <Calendar size={18} className="text-[var(--color-text-tertiary)]" /> 
              {selectedFilter}
              <ChevronDown size={16} className={`text-[var(--color-text-tertiary)] transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1 shadow-xl animate-in fade-in zoom-in-95">
                  {filterOptions.map(option => (
                    <button 
                      key={option}
                      onClick={() => {
                        setSelectedFilter(option);
                        setIsFilterOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      {option}
                      {selectedFilter === option && <Check size={14} className="text-[var(--color-accent)]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:bg-[var(--color-accent-hover)] active:scale-95"
            >
              <Download size={18} /> Eksport
            </button>

            {isExportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                <div className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1 shadow-xl animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                    Formatni tanlang
                  </div>
                  <button 
                    onClick={handleExportCSV}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <div className="bg-green-500/10 text-green-500 p-1.5 rounded-md">
                      <FileSpreadsheet size={16} />
                    </div>
                    Excel (CSV) yuklash
                  </button>
                  <button 
                    onClick={() => {
                      alert('PDF generatsiya qilish jarayoni boshlandi...');
                      setIsExportOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <div className="bg-red-500/10 text-red-500 p-1.5 rounded-md">
                      <FileText size={16} />
                    </div>
                    PDF hisobot yuklash
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Umumiy tushum', value: '145,500,000 UZS', trend: '+15%' },
          { label: 'Sof foyda', value: '32,400,000 UZS', trend: '+8%' },
          { label: 'Sotilgan tovarlar', value: '450 ta', trend: '+24%' },
          { label: 'Yangi mijozlar', value: '124 kishi', trend: '+12%' }
        ].map((stat, i) => (
          <div key={i} className="premium-card rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-gradient-to-br from-[var(--color-accent)]/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2 relative">{stat.label}</div>
            <div className="flex items-end gap-2 relative">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs font-bold text-[var(--color-success)] ml-auto bg-[var(--color-success)]/10 px-1.5 py-0.5 rounded-md">{stat.trend}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="premium-card rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center text-[var(--color-text-tertiary)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <BarChart3 size={64} className="opacity-20 mb-4 group-hover:scale-110 group-hover:text-[var(--color-accent)] transition-all duration-300" />
        <h3 className="text-lg font-bold">Grafik va Diagrammalar</h3>
        <p className="text-sm mt-1 max-w-sm text-center">Savdo va foyda tahlillari uchun vizual grafiklar aynan shu yerda ko'rsatiladi. (V2 update'da to'liq API ulanadi)</p>
      </div>
    </div>
  );
}
