'use client';
import { useState } from 'react';
import { Settings, Save, Smartphone, Printer, ShieldCheck, MessageSquare } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', icon: Settings, label: 'Umumiy sozlamalar' },
    { id: 'pos', icon: Smartphone, label: 'POS interfeysi' },
    { id: 'print', icon: Printer, label: 'Chek va printer' },
    { id: 'integrations', icon: MessageSquare, label: 'Integratsiyalar (Telegram/SMS)' },
    { id: 'security', icon: ShieldCheck, label: 'Xavfsizlik' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Sozlamalar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Tizim va do'kon sozlamalarini boshqarish</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all">
          <Save size={18} /> Saqlash
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Nav */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === tab.id ? 'bg-[var(--color-bg-card)] text-[var(--color-accent)] border border-[var(--color-border)] shadow-sm' : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="lg:col-span-2">
          <div className="premium-card rounded-3xl p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
            
            {activeTab === 'general' && (
              <>
                <h2 className="text-xl font-bold border-b border-[var(--color-border)] pb-4 mb-6">Umumiy ma'lumotlar</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-2">Do'kon nomi</label>
                    <input type="text" defaultValue="Mobicenter Demo" className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-2">Asosiy valyuta</label>
                    <select className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all appearance-none">
                      <option>UZS (O'zbek so'mi)</option>
                      <option>USD (AQSh dollari)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-2">Standart kafolat muddati (oy)</label>
                    <input type="number" defaultValue="12" className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all" />
                  </div>
                </div>

                <h2 className="text-xl font-bold border-b border-[var(--color-border)] pb-4 mt-8 mb-6">Nasiya sozlamalari</h2>
                <div className="space-y-4">
                   <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-2">Minimal boshlang'ich to'lov (%)</label>
                    <input type="number" defaultValue="30" className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all" />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'pos' && (
              <>
                <h2 className="text-xl font-bold border-b border-[var(--color-border)] pb-4 mb-6">POS interfeysi sozlamalari</h2>
                <div className="space-y-4 text-sm text-[var(--color-text-secondary)]">
                  <p>Bu yerda kassa (POS) interfeysi ko'rinishi, tezkor tugmalar va skaner sozlamalari bo'ladi.</p>
                  <label className="flex items-center gap-3 p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-base)]">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-[var(--color-border)] accent-[var(--color-accent)]" />
                    <span className="font-semibold text-[var(--color-foreground)]">Skanerdan so'ng avtomat saqlash</span>
                  </label>
                </div>
              </>
            )}

            {activeTab === 'print' && (
              <>
                <h2 className="text-xl font-bold border-b border-[var(--color-border)] pb-4 mb-6">Chek va printer sozlamalari</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-2">Chek formati</label>
                    <select className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all appearance-none">
                      <option>80mm (Termal printer)</option>
                      <option>58mm (Kichik termal printer)</option>
                      <option>A4 (Oddiy printer)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-2">Chek tagiga yozuv</label>
                    <input type="text" defaultValue="Xaridingiz uchun raxmat! (Sotilgan tovarlar 24 soat ichida almashtiriladi)" className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all" />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'integrations' && (
              <>
                <h2 className="text-xl font-bold border-b border-[var(--color-border)] pb-4 mb-6">Telegram Bot va SMS Integratsiyasi</h2>
                
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm">
                    Bu yerdan Telegram botingizni ulab, har kungi savdo hisobotlarini guruhga yoki shaxsiy lichkangizga qabul qilishingiz mumkin.
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-2">Telegram Bot Token (BotFather dan olinadi)</label>
                    <input type="password" placeholder="1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw" className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all font-mono" />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-2">Hisobot yuboriladigan Chat ID (Admin yoki Guruh)</label>
                    <input type="text" placeholder="-100123456789" className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all font-mono" />
                  </div>

                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <h3 className="font-bold mb-3 text-[var(--color-foreground)]">Qarzdorlarga eslatma yuborish (Avtomatlashtirish)</h3>
                    <label className="flex items-center justify-between p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-base)] mb-3 cursor-pointer hover:border-[var(--color-accent)] transition-colors">
                      <div>
                        <div className="font-bold">Telegram orqali eslatma yuborish</div>
                        <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Mijozning telegram raqamiga bot orqali bepul xabar ketadi.</div>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-[var(--color-border)] accent-[var(--color-accent)]" />
                    </label>
                    
                    <label className="flex items-center justify-between p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-base)] cursor-pointer hover:border-[var(--color-accent)] transition-colors">
                      <div>
                        <div className="font-bold">SMS orqali eslatma yuborish</div>
                        <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Eskiz.uz yoki PlayMobile orqali SMS xabar boradi (pullik).</div>
                      </div>
                      <input type="checkbox" className="w-5 h-5 rounded border-[var(--color-border)] accent-[var(--color-accent)]" />
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <h2 className="text-xl font-bold border-b border-[var(--color-border)] pb-4 mb-6">Xavfsizlik</h2>
                <div className="space-y-4 text-sm text-[var(--color-text-secondary)]">
                  <p>Ikki bosqichli autentifikatsiya va sessiyalarni boshqarish sozlamalari shu yerda bo'ladi.</p>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
