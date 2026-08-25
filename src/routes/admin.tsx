'use client';

import { useEffect, useState } from 'react';
import { supabase, Product, Order, Drop, PRODUCT_LEVELS } from '@/lib/supabase';
import { publishDueDrops } from '@/lib/drops';
import { formatPrice, INPUT_CLASS, SELECT_CLASS, cn } from '@/lib/utils';
import {
  Package, ShoppingCart, LogOut, Eye, EyeOff, Loader2,
  Trash2, Edit2, X, Check, AlertCircle, ArrowLeft, ChevronDown, Zap, Calendar, Menu, Sparkles,
} from 'lucide-react';
import Link from 'next/link';

const ADMIN_PASSWORD = '123';

type View = 'products' | 'orders';

interface ProductForm {
  name: string;
  brand: string;
  model: string;
  size_eu: string;
  insole_length_cm: string;
  price: string;
  original_price: string;
  surface_type: string;
  level: string;
  condition: string;
  condition_detail: string;
  images: string;
  box_included: boolean;
  bag_included: boolean;
  extras_description: string;
  status: string;
  drop_scheduled_at: string;
  drop_id: string;
}

const EMPTY_FORM: ProductForm = {
  name: '', brand: '', model: '', size_eu: '', insole_length_cm: '',
  price: '', original_price: '', surface_type: 'FG', level: 'Profesjonalny',
  condition: 'Nowe z metką', condition_detail: '', images: '',
  box_included: false, bag_included: false, extras_description: '', status: 'available',
  drop_scheduled_at: '', drop_id: '',
};

interface DropForm {
  name: string;
  description: string;
  scheduled_at: string;
}

const EMPTY_DROP_FORM: DropForm = { name: '', description: '', scheduled_at: '' };

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [view, setView] = useState<View>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<(Order & { product?: Product })[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showDropModal, setShowDropModal] = useState(false);
  const [dropForm, setDropForm] = useState<DropForm>(EMPTY_DROP_FORM);
  const [savingDrop, setSavingDrop] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const draftCount = products.filter((p) => p.status === 'draft').length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data as Product[]);
    setLoading(false);
  };

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, product:products(*)')
      .order('created_at', { ascending: false });
    if (data) setOrders(data as any);
    setLoading(false);
  };

  const loadDrops = async () => {
    const { data } = await supabase.from('drops').select('*').order('scheduled_at', { ascending: true });
    if (data) setDrops(data as Drop[]);
  };

  useEffect(() => {
    if (!authed) return;
    const boot = async () => {
      await publishDueDrops();
      await Promise.all([loadProducts(), loadOrders(), loadDrops()]);
    };
    boot();
    const interval = setInterval(async () => {
      const changed = await publishDueDrops();
      if (changed) {
        await loadProducts();
        await loadDrops();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [authed]);

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.brand || !form.price || !form.size_eu) return;
    setSaving(true);

    const payload: Record<string, unknown> = {
      name: form.name,
      brand: form.brand,
      model: form.model || form.name,
      size_eu: parseFloat(form.size_eu),
      insole_length_cm: form.insole_length_cm ? parseFloat(form.insole_length_cm) : null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      surface_type: form.surface_type,
      level: form.level,
      condition: form.condition,
      condition_detail: form.condition_detail || null,
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
      box_included: form.box_included,
      bag_included: form.bag_included,
      extras_description: form.extras_description || null,
      status: form.status,
    };

    const assignedDropId = form.drop_id && form.drop_id !== 'none' ? form.drop_id : null;
    payload.drop_id = assignedDropId;
    if (assignedDropId) {
      payload.drop_scheduled_at = null;
      payload.status = 'draft';
    } else if (form.status === 'draft' && form.drop_scheduled_at) {
      payload.drop_scheduled_at = new Date(form.drop_scheduled_at).toISOString();
    } else {
      payload.drop_scheduled_at = null;
    }

    if (editingId) {
      await supabase.from('products').update(payload).eq('id', editingId);
      showToast('Produkt zaktualizowany');
    } else {
      await supabase.from('products').insert(payload);
      showToast('Produkt dodany');
    }

    await loadProducts();
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowProductModal(false);
    setView('products');
    setSaving(false);
  };

  const handleEdit = (p: Product) => {
    setForm({
      name: p.name, brand: p.brand, model: p.model,
      size_eu: String(p.size_eu), insole_length_cm: p.insole_length_cm ? String(p.insole_length_cm) : '',
      price: String(p.price), original_price: p.original_price ? String(p.original_price) : '',
      surface_type: p.surface_type, level: p.level, condition: p.condition,
      condition_detail: p.condition_detail || '', images: p.images.join('\n'),
      box_included: p.box_included, bag_included: p.bag_included,
      extras_description: p.extras_description || '', status: p.status,
      drop_scheduled_at: p.drop_scheduled_at ? new Date(p.drop_scheduled_at).toISOString().slice(0, 16) : '',
      drop_id: p.drop_id || 'none',
    });
    setEditingId(p.id);
    setShowProductModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Na pewno usunąć ten produkt?')) return;
    await supabase.from('products').delete().eq('id', id);
    await loadProducts();
    showToast('Produkt usunięty');
  };

  const handleStatusChange = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status !== 'draft') updates.drop_scheduled_at = null;
    await supabase.from('products').update(updates).eq('id', id);
    await loadProducts();
    showToast('Status zaktualizowany');
  };

  const handlePublishAllDrafts = async () => {
    setPublishing(true);
    const { data } = await supabase
      .from('products')
      .update({ status: 'available', drop_scheduled_at: null, drop_id: null })
      .eq('status', 'draft')
      .select('id');
    setShowPublishModal(false);
    setPublishing(false);
    if (data) {
      showToast(`Opublikowano ${data.length} ${data.length === 1 ? 'drop' : 'dropów'}`);
      await loadProducts();
    }
  };

  const handleCreateDrop = async () => {
    if (!dropForm.name || !dropForm.scheduled_at) return;
    setSavingDrop(true);
    const { data, error } = await supabase
      .from('drops')
      .insert({
        name: dropForm.name,
        description: dropForm.description || null,
        scheduled_at: new Date(dropForm.scheduled_at).toISOString(),
        status: 'scheduled',
      })
      .select('id')
      .maybeSingle();

    if (!error && data) {
      showToast('Drop zaplanowany');
      setDropForm(EMPTY_DROP_FORM);
      setShowDropModal(false);
      await loadDrops();
    }
    setSavingDrop(false);
  };

  const handleDeleteDrop = async (id: string) => {
    if (!confirm('Usunąć ten drop? Przypisane produkty zostaną bez dropu.')) return;
    await supabase.from('drops').delete().eq('id', id);
    await loadDrops();
    showToast('Drop usunięty');
  };

  const scheduledDrops = drops.filter((d) => d.status === 'scheduled');
  const dropNameById = (id: string | null) => {
    if (!id) return null;
    const d = drops.find((d) => d.id === id);
    return d ? d.name : null;
  };

  const inp = INPUT_CLASS;
  const sel = SELECT_CLASS;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#FF6B00] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_15px_rgba(255,107,0,0.3)]">
              <Package className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Panel admina</h1>
            <p className="text-neutral-500 text-sm mt-1">FootBubr — dostęp chroniony hasłem</p>
          </div>
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Hasło"
                value={pwInput}
                onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className={cn(inp, 'pr-10', pwError && 'border-red-500/60')}
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwError && <p className="text-red-400 text-xs flex items-center gap-1.5 animate-fade-in"><AlertCircle className="w-3.5 h-3.5" /> Nieprawidłowe hasło</p>}
            <button onClick={handleLogin} className="w-full bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_15px_rgba(255,107,0,0.25)]">
              Zaloguj się
            </button>
            <Link href="/" className="flex items-center justify-center gap-1.5 text-sm text-neutral-500 hover:text-white/80 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Wróć do sklepu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#FF6B00] text-black font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in-up">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Publish confirmation modal */}
      {showPublishModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-backdrop-in" onClick={() => setShowPublishModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 max-w-sm w-full animate-scale-in pointer-events-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#FF6B00]/15 border border-[#FF6B00]/30 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#FF6B00]" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Opublikuj drop teraz</h3>
                  <p className="text-xs text-neutral-500">Akcja natychmiastowa</p>
                </div>
              </div>
              <p className="text-sm text-neutral-400 mb-6">
                Czy na pewno chcesz opublikować wszystkie <span className="text-[#FF6B00] font-bold">{draftCount}</span> {draftCount === 1 ? 'szkic' : draftCount < 5 ? 'szkice' : 'szkiców'}? Wszystkie produkty ze statusem "Szkic" natychmiast zmienią status na "Dostępny" i pojawią się w sklepie.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handlePublishAllDrafts}
                  disabled={publishing || draftCount === 0}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-40 shadow-[0_4px_15px_rgba(255,107,0,0.25)]"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Opublikuj teraz'}
                </button>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-6 py-3 rounded-xl text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 font-medium text-sm transition-all active:scale-95"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Schedule drop modal */}
      {showDropModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-backdrop-in" onClick={() => setShowDropModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 max-w-md w-full animate-scale-in pointer-events-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/15 border border-blue-500/30 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Zaplanuj drop</h3>
                  <p className="text-xs text-neutral-500">Utwórz nazwany drop event</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Nazwa Dropu</label>
                  <input
                    className={inp}
                    placeholder="DROP #01: VINTAGE MERCURIALS & PREDATORS"
                    value={dropForm.name}
                    onChange={(e) => setDropForm({ ...dropForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Data i Godzina publikacji</label>
                  <input
                    type="datetime-local"
                    className={`${inp} [&::-webkit-calendar-picker-indicator]:invert`}
                    value={dropForm.scheduled_at}
                    onChange={(e) => setDropForm({ ...dropForm, scheduled_at: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Krótki opis / zajawka</label>
                  <textarea
                    className={`${inp} resize-none`}
                    rows={2}
                    placeholder="10 unikatowych par w wersji Elite"
                    value={dropForm.description}
                    onChange={(e) => setDropForm({ ...dropForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateDrop}
                  disabled={savingDrop || !dropForm.name || !dropForm.scheduled_at}
                  className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-40"
                >
                  {savingDrop ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Zaplanuj drop'}
                </button>
                <button
                  onClick={() => { setShowDropModal(false); setDropForm(EMPTY_DROP_FORM); }}
                  className="px-6 py-3 rounded-xl text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 font-medium text-sm transition-all active:scale-95"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#0c0c0c] border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-black text-lg text-white uppercase">Foot<span className="text-[#FF6B00]">Bubr</span></Link>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-neutral-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-backdrop-in" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-[#0c0c0c] border-r border-neutral-800/80 flex flex-col z-40 lg:hidden animate-slide-in-right" style={{ animationName: 'slide-in-right', transform: 'translateX(0)' }}>
            <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between">
              <Link href="/" className="font-black text-lg text-white uppercase">Foot<span className="text-[#FF6B00]">Bubr</span></Link>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <AdminNav view={view} setView={(v) => { setView(v); setSidebarOpen(false); }} setForm={setForm} setEditingId={setEditingId} productsCount={products.length} ordersCount={orders.length} onLogout={() => setAuthed(false)} />
          </aside>
        </>
      )}

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-56 bg-[#0c0c0c] border-r border-neutral-800/80 flex-col fixed h-full z-10">
          <div className="p-5 border-b border-neutral-800/80">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-black text-lg text-white uppercase">Foot<span className="text-[#FF6B00]">Bubr</span></span>
            </Link>
            <p className="text-xs text-neutral-600 mt-0.5">Panel admina</p>
          </div>
          <AdminNav view={view} setView={setView} setForm={setForm} setEditingId={setEditingId} productsCount={products.length} ordersCount={orders.length} onLogout={() => setAuthed(false)} />
        </aside>

        {/* Main */}
        <main className="lg:ml-56 flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* Products list */}
          {view === 'products' && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Produkty</h2>
                  <p className="text-neutral-500 text-sm">{products.filter((p) => p.status === 'available').length} dostępnych, {products.filter((p) => p.status === 'sold').length} sprzedanych, {draftCount} szkiców</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowProductModal(true); }}
                    className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-bold px-3 sm:px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_15px_rgba(255,107,0,0.25)] text-sm"
                  >
                    + Dodaj produkt
                  </button>
                  <button
                    onClick={() => setShowPublishModal(true)}
                    disabled={draftCount === 0}
                    className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 font-bold px-3 sm:px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-4 h-4" />
                    Opublikuj drop
                    {draftCount > 0 && (
                      <span className="bg-emerald-500 text-black text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">{draftCount}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowDropModal(true)}
                    className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/40 text-blue-400 hover:bg-blue-500/25 font-bold px-3 sm:px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    Zaplanuj drop
                  </button>
                </div>
              </div>

              {/* Scheduled drops list */}
              {scheduledDrops.length > 0 && (
                <div className="mb-6 space-y-2">
                  {scheduledDrops.map((d) => {
                    const dropProductCount = products.filter((p) => p.drop_id === d.id).length;
                    return (
                      <div key={d.id} className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                        <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{d.name}</p>
                          {d.description && <p className="text-xs text-neutral-500 truncate">{d.description}</p>}
                          <p className="text-xs text-blue-400 mt-0.5">
                            {new Date(d.scheduled_at).toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            {dropProductCount > 0 && <span className="text-neutral-500"> · {dropProductCount} {dropProductCount === 1 ? 'produkt' : dropProductCount < 5 ? 'produkty' : 'produktów'}</span>}
                          </p>
                        </div>
                        <button onClick={() => handleDeleteDrop(d.id)} className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors active:scale-90">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 sm:gap-4 bg-[#141414] border border-neutral-800/80 rounded-2xl p-3 sm:p-4 hover:border-neutral-700 transition-all">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/5 border border-neutral-800 flex-shrink-0">
                        {p.images[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">Brak</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">{p.brand}</span>
                          <span className="text-xs text-neutral-500">EU {p.size_eu}</span>
                          {p.drop_id && dropNameById(p.drop_id) && (
                            <span className="text-xs text-blue-400 flex items-center gap-1 truncate max-w-[120px]">
                              <Sparkles className="w-3 h-3" />
                              {dropNameById(p.drop_id)}
                            </span>
                          )}
                          {p.drop_scheduled_at && p.status === 'draft' && !p.drop_id && (
                            <span className="text-xs text-blue-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(p.drop_scheduled_at).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-white text-sm truncate">{p.name}</p>
                        <p className="text-sm font-bold text-white mt-0.5">{formatPrice(p.price)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <div className="relative">
                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value)}
                            className={cn(
                              'appearance-none text-xs font-bold px-2 sm:px-3 py-2 pr-7 rounded-lg border cursor-pointer focus:outline-none transition-all [&>option]:bg-[#1a1a1a] [&>option]:text-neutral-100',
                              p.status === 'available' && 'text-emerald-400 border-emerald-400/30 bg-[#1a1a1a]',
                              p.status === 'sold' && 'text-red-400 border-red-400/30 bg-[#1a1a1a]',
                              p.status === 'draft' && 'text-blue-400 border-blue-400/30 bg-[#1a1a1a]',
                            )}
                          >
                            <option value="available">Dostępny</option>
                            <option value="sold">Wyprzedany</option>
                            <option value="draft">Szkic</option>
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                        </div>
                        <button onClick={() => handleEdit(p)} className="p-2 text-neutral-500 hover:text-white bg-white/5 rounded-xl transition-all hover:bg-white/10 active:scale-90">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 text-neutral-500 hover:text-red-400 bg-white/5 rounded-xl transition-all hover:bg-red-400/10 active:scale-90">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <div className="text-center py-16 text-neutral-600">
                      <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>Brak produktów. Dodaj pierwszy produkt!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Add / Edit product modal */}
          {showProductModal && (
            <>
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-backdrop-in"
                onClick={() => { setShowProductModal(false); setForm(EMPTY_FORM); setEditingId(null); }}
              />
              <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 overflow-y-auto pointer-events-none">
                <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-2xl my-4 sm:my-8 animate-scale-in pointer-events-auto shadow-2xl">
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-neutral-800 bg-[#111] rounded-t-2xl">
                    <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">{editingId ? 'Edytuj produkt' : 'Dodaj nowy produkt'}</h2>
                    <button
                      onClick={() => { setShowProductModal(false); setForm(EMPTY_FORM); setEditingId(null); }}
                      className="p-2 text-neutral-500 hover:text-white bg-white/5 rounded-xl transition-all active:scale-90"
                      aria-label="Zamknij"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Basic info */}
                <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-1">Podstawowe informacje</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className={inp} placeholder="Marka *" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                    <input className={inp} placeholder="Model *" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                  </div>
                  <input className={inp} placeholder="Pełna nazwa produktu *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className={inp} placeholder="Rozmiar EU *" type="number" step="0.5" value={form.size_eu} onChange={(e) => setForm({ ...form, size_eu: e.target.value })} />
                    <input className={inp} placeholder="Długość wkładki (cm)" type="number" step="0.5" value={form.insole_length_cm} onChange={(e) => setForm({ ...form, insole_length_cm: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className={inp} placeholder="Cena PLN *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                    <input className={inp} placeholder="Cena katalogowa PLN" type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} />
                  </div>
                </div>

                {/* Product details */}
                <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-1">Specyfikacja</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <select className={sel} value={form.surface_type} onChange={(e) => setForm({ ...form, surface_type: e.target.value })}>
                        <option value="FG">FG — Lanki</option>
                        <option value="SG">SG — Wkręty/Mixy</option>
                        <option value="AG">AG — Sztuczna trawa</option>
                        <option value="TF">TF — Turfy</option>
                        <option value="IC">IC — Halówki</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select className={sel} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                        {PRODUCT_LEVELS.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="relative">
                    <select className={sel} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                      <option value="Nowe z metką">Nowe z metką</option>
                      <option value="Nowe bez metki">Nowe bez metki / Outlet</option>
                      <option value="Używane 9/10">Używane 9/10</option>
                      <option value="Używane 8/10">Używane 8/10</option>
                      <option value="Używane 7/10">Używane 7/10</option>
                      <option value="Używane 6/10">Używane 6/10</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  </div>
                  <textarea
                    className={`${inp} resize-none`}
                    rows={2}
                    placeholder="Szczegółowy opis stanu (np. drobne ślady na podeszwie)"
                    value={form.condition_detail}
                    onChange={(e) => setForm({ ...form, condition_detail: e.target.value })}
                  />
                </div>

                {/* Images & extras */}
                <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-1">Zdjęcia i dodatki</h3>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">URL zdjęć (każdy w nowej linii)</p>
                    <textarea
                      className={`${inp} resize-none font-mono text-xs`}
                      rows={4}
                      placeholder="https://images.pexels.com/..."
                      value={form.images}
                      onChange={(e) => setForm({ ...form, images: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.box_included} onChange={(e) => setForm({ ...form, box_included: e.target.checked })} className="w-4 h-4 accent-[#FF6B00]" />
                      <span className="text-sm text-neutral-300">Oryginalne pudełko</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.bag_included} onChange={(e) => setForm({ ...form, bag_included: e.target.checked })} className="w-4 h-4 accent-[#FF6B00]" />
                      <span className="text-sm text-neutral-300">Worek / torba</span>
                    </label>
                  </div>
                  <textarea
                    className={`${inp} resize-none`}
                    rows={2}
                    placeholder="Opis dodatków (opcjonalnie)"
                    value={form.extras_description}
                    onChange={(e) => setForm({ ...form, extras_description: e.target.value })}
                  />
                </div>

                {/* Status & Drop Assignment */}
                <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Status i drop</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(['available', 'sold', 'draft'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setForm({ ...form, status: s })}
                        className={cn(
                          'px-4 py-2 rounded-xl text-sm font-semibold transition-all border active:scale-95',
                          form.status === s
                            ? s === 'available' ? 'bg-emerald-400/15 border-emerald-400/40 text-emerald-400'
                              : s === 'sold' ? 'bg-red-400/15 border-red-400/40 text-red-400'
                              : 'bg-blue-400/15 border-blue-400/40 text-blue-400'
                            : 'bg-white/5 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                        )}
                      >
                        {s === 'available' ? 'Dostępny' : s === 'sold' ? 'Wyprzedany' : 'Szkic'}
                      </button>
                    ))}
                  </div>

                  {/* Drop Assignment */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Przypisz do utworzonego dropu
                    </label>
                    <div className="relative">
                      <select
                        className={sel}
                        value={form.drop_id || 'none'}
                        onChange={(e) => {
                          const dropId = e.target.value === 'none' ? '' : e.target.value;
                          setForm({ ...form, drop_id: dropId, status: dropId ? 'draft' : form.status });
                        }}
                      >
                        <option value="none">Brak / Samodzielny drop</option>
                        {scheduledDrops.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    </div>

                    {/* Individual scheduled drop — only when no drop campaign is selected and status is draft */}
                    {(form.drop_id || 'none') === 'none' && form.status === 'draft' && (
                      <div className="animate-fade-in space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Indywidualna data publikacji
                        </label>
                        <input
                          type="datetime-local"
                          value={form.drop_scheduled_at}
                          onChange={(e) => setForm({ ...form, drop_scheduled_at: e.target.value })}
                          className={`${inp} [&::-webkit-calendar-picker-indicator]:invert`}
                        />
                        <p className="text-xs text-neutral-600">
                          Gdy timer osiągnie 0, produkt automatycznie zmieni status na "Dostępny". Pozostaw puste dla ręcznej publikacji.
                        </p>
                      </div>
                    )}

                    {/* Drop campaign info */}
                    {form.drop_id && form.drop_id !== 'none' && (
                      <div className="animate-fade-in bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
                        Produkt zostanie opublikowany automatycznie, gdy timer dropu osiągnie zero.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.name || !form.price || !form.size_eu}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(255,107,0,0.25)]"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editingId ? 'Zapisz zmiany' : 'Dodaj produkt'}
                  </button>
                  <button
                    onClick={() => { setShowProductModal(false); setForm(EMPTY_FORM); setEditingId(null); }}
                    className="px-6 py-3 rounded-xl text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 font-medium text-sm transition-all active:scale-95"
                  >
                    Anuluj
                  </button>
                </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Orders */}
          {view === 'orders' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Zamówienia</h2>
                <p className="text-neutral-500 text-sm">{orders.length} łącznie</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-neutral-600">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>Brak zamówień</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 hover:border-neutral-700 transition-all">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-mono text-neutral-500">#{o.id.slice(0, 8).toUpperCase()}</span>
                            <span className={cn(
                              'text-xs font-bold px-2 py-0.5 rounded-full',
                              o.status === 'pending' && 'bg-yellow-400/15 text-yellow-400',
                              o.status === 'paid' && 'bg-emerald-400/15 text-emerald-400',
                              o.status === 'shipped' && 'bg-blue-400/15 text-blue-400',
                              o.status === 'completed' && 'bg-white/10 text-neutral-400',
                              o.status === 'cancelled' && 'bg-red-400/15 text-red-400',
                            )}>
                              {o.status === 'pending' ? 'Oczekuje' : o.status === 'paid' ? 'Opłacone' : o.status === 'shipped' ? 'Wysłane' : o.status === 'completed' ? 'Zakończone' : 'Anulowane'}
                            </span>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-white font-semibold">{o.customer_name}</p>
                              <p className="text-neutral-500 truncate">{o.customer_email}</p>
                              {o.customer_phone && <p className="text-neutral-500">{o.customer_phone}</p>}
                            </div>
                            <div>
                              <p className="text-neutral-400 text-xs sm:text-sm">
                                {o.shipping_method === 'paczkomat' ? `Paczkomat: ${o.paczkomat_code}` : `Kurier: ${o.shipping_address}`}
                              </p>
                              <p className="text-neutral-400 text-xs sm:text-sm">Płatność: {o.payment_method === 'blik' ? 'BLIK' : o.payment_method === 'card' ? 'Karta' : o.payment_method}</p>
                              {o.product && (
                                <p className="text-[#FF6B00] font-medium mt-1 text-xs sm:text-sm">{o.product.name} · EU {o.product.size_eu}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-white text-base sm:text-lg">{formatPrice(o.total_price)}</p>
                          <p className="text-xs text-neutral-600">{new Date(o.created_at).toLocaleDateString('pl-PL')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function AdminNav({
  view, setView, setForm, setEditingId, productsCount, ordersCount, onLogout,
}: {
  view: View;
  setView: (v: View) => void;
  setForm: (f: ProductForm) => void;
  setEditingId: (id: string | null) => void;
  productsCount: number;
  ordersCount: number;
  onLogout: () => void;
}) {
  return (
    <>
      <nav className="flex-1 p-3 space-y-1">
        <button
          onClick={() => { setView('products'); setForm(EMPTY_FORM); setEditingId(null); }}
          className={cn('flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95', view === 'products' ? 'bg-[#FF6B00]/15 text-[#FF6B00]' : 'text-neutral-400 hover:text-white hover:bg-white/5')}
        >
          <Package className="w-4 h-4" /> Produkty
          <span className="ml-auto text-xs bg-white/10 text-neutral-400 px-1.5 py-0.5 rounded-full">{productsCount}</span>
        </button>
        <button
          onClick={() => setView('orders')}
          className={cn('flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95', view === 'orders' ? 'bg-[#FF6B00]/15 text-[#FF6B00]' : 'text-neutral-400 hover:text-white hover:bg-white/5')}
        >
          <ShoppingCart className="w-4 h-4" /> Zamówienia
          <span className="ml-auto text-xs bg-white/10 text-neutral-400 px-1.5 py-0.5 rounded-full">{ordersCount}</span>
        </button>
      </nav>
      <div className="p-3 border-t border-neutral-800/80">
        <button onClick={onLogout} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-neutral-500 hover:text-white/80 hover:bg-white/5 transition-all active:scale-95">
          <LogOut className="w-4 h-4" /> Wyloguj
        </button>
      </div>
    </>
  );
}
