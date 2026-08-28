import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase, Product, Order, DropSettings, PRODUCT_LEVELS, formatOrderNumber } from '@/lib/supabase';

import { formatPrice, INPUT_CLASS, SELECT_CLASS, cn } from '@/lib/utils';
import { Package, ShoppingCart, LogOut, Eye, EyeOff, Loader as Loader2, Trash2, CreditCard as Edit2, X, Check, CircleAlert as AlertCircle, ArrowLeft, ChevronDown, Zap, Calendar, Menu, Sparkles, Copy, Truck, MapPin, Plus, Minus, FileText, Clock, Layers } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { Database } from '@/integrations/supabase/types';

type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

const ADMIN_PASSWORD = '123';

type View = 'products' | 'orders' | 'drop-settings';
type CustomProductStatus = 'available' | 'draft' | 'drop' | 'sold';
type DropTypeChoice = 'global' | 'custom';

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
  status: CustomProductStatus;
  drop_type: DropTypeChoice;
  drop_scheduled_at: string;
}

const EMPTY_FORM: ProductForm = {
  name: '', brand: '', model: '', size_eu: '', insole_length_cm: '',
  price: '', original_price: '', surface_type: 'FG', level: 'Profesjonalny',
  condition: 'Nowe z metką', condition_detail: '', images: '',
  box_included: false, bag_included: false, extras_description: '',
  status: 'available', drop_type: 'global', drop_scheduled_at: '',
};

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [view, setView] = useState<View>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<(Order & { product?: Product })[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { product?: Product }) | null>(null);
  const [orderTrackingInput, setOrderTrackingInput] = useState('');
  const [orderSaving, setOrderSaving] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [dropSettings, setDropSettings] = useState<DropSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    drop_date: '',
    is_tbd: true,
    featured_product_id: 'none',
    title: 'Nowy drop',
    subtitle: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Filtrowanie produktów
  const availableProducts = products.filter((p) => p.status === 'available');
  const draftProducts = products.filter((p) => p.status === 'draft' && !p.drop_scheduled_at);
  const dropProducts = products.filter((p) => p.status === 'draft' && p.drop_scheduled_at !== null);
  const soldProducts = products.filter((p) => p.status === 'sold');

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

  const handleOrderStatusChange = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      showToast(`Błąd: ${error.message}`);
      return;
    }
    await loadOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => prev ? { ...prev, status: status as Order['status'] } : prev);
    }
    showToast('Status zamówienia zaktualizowany');
  };

  const handleSaveTracking = async () => {
    if (!selectedOrder) return;
    setOrderSaving(true);
    const { error } = await supabase
      .from('orders')
      .update({ tracking_number: orderTrackingInput.trim() || null })
      .eq('id', selectedOrder.id);
    setOrderSaving(false);
    if (error) {
      showToast(`Błąd: ${error.message}`);
      return;
    }
    await loadOrders();
    setSelectedOrder((prev) => prev ? { ...prev, tracking_number: orderTrackingInput.trim() || null } : prev);
    showToast('Numer śledzenia zapisany');
  };

  const handleDeleteOrder = async (orderId: string, productId?: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to zamówienie?')) return;
    setDeletingOrder(true);

    const { error } = await supabase.from('orders').delete().eq('id', orderId);

    if (error) {
      setDeletingOrder(false);
      showToast(`Błąd usuwania: ${error.message}`);
      return;
    }

    if (productId) {
      const restore = confirm('Czy chcesz przywrócić ten produkt jako "Dostępny" w sklepie?');
      if (restore) {
        await supabase.from('products').update({ status: 'available' }).eq('id', productId);
        await loadProducts();
      }
    }

    setDeletingOrder(false);
    setSelectedOrder(null);
    await loadOrders();
    showToast('Zamówienie zostało usunięte');
  };

  const openOrderDetail = (order: Order & { product?: Product }) => {
    setSelectedOrder(order);
    setOrderTrackingInput(order.tracking_number || '');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Skopiowano: ${label}`);
    });
  };

  const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: 'Nowe',
    paid: 'Opłacone',
    processing: 'W realizacji',
    shipped: 'Wysłane',
    completed: 'Zakończone',
    cancelled: 'Anulowane',
  };

  const ORDER_STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-400/15 text-yellow-400',
    paid: 'bg-emerald-400/15 text-emerald-400',
    processing: 'bg-orange-400/15 text-orange-400',
    shipped: 'bg-blue-400/15 text-blue-400',
    completed: 'bg-white/10 text-neutral-400',
    cancelled: 'bg-red-400/15 text-red-400',
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

  const loadDropSettings = async () => {
    const { data } = await supabase
      .from('drop_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (data) {
      const s = data as DropSettings;
      setDropSettings(s);
      setSettingsForm({
        drop_date: s.drop_date ? new Date(s.drop_date).toISOString().slice(0, 16) : '',
        is_tbd: s.is_tbd,
        featured_product_id: s.featured_product_id || 'none',
        title: s.title,
        subtitle: s.subtitle,
      });
    }
  };

  const handleSaveDropSettings = async () => {
    setSavingSettings(true);
    const dropDateIso = settingsForm.is_tbd || !settingsForm.drop_date
      ? null
      : new Date(settingsForm.drop_date).toISOString();

    const payload: Record<string, unknown> = {
      id: 1,
      is_tbd: settingsForm.is_tbd,
      drop_date: dropDateIso,
      featured_product_id: settingsForm.featured_product_id !== 'none' ? settingsForm.featured_product_id : null,
      title: settingsForm.title || 'Nowy drop',
      subtitle: settingsForm.subtitle || '',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('drop_settings').upsert(payload).eq('id', 1);

    setSavingSettings(false);
    if (error) {
      console.error('Drop settings save failed:', error);
      showToast(`Błąd zapisu ustawień: ${error.message}`);
      return;
    }
    showToast('Ustawienia dropu zapisane');
    await Promise.all([loadDropSettings(), loadProducts()]);
  };

  useEffect(() => {
    if (!authed) return;
    const boot = async () => {
      await Promise.all([loadProducts(), loadOrders(), loadDropSettings()]);
    };
    boot();
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

    let dbStatus: 'available' | 'draft' | 'sold' = 'available';
    let finalDropDate: string | null = null;

    if (form.status === 'available') {
      dbStatus = 'available';
      finalDropDate = null;
    } else if (form.status === 'draft') {
      dbStatus = 'draft';
      finalDropDate = null; // Czysty szkic w panelu
    } else if (form.status === 'drop') {
      dbStatus = 'draft';
      if (form.drop_type === 'global') {
        finalDropDate = dropSettings?.drop_date && !dropSettings.is_tbd
          ? dropSettings.drop_date
          : new Date().toISOString();
      } else {
        finalDropDate = form.drop_scheduled_at
          ? new Date(form.drop_scheduled_at).toISOString()
          : new Date().toISOString();
      }
    } else if (form.status === 'sold') {
      dbStatus = 'sold';
      finalDropDate = null;
    }

    const payload: ProductInsert = {
      name: form.name,
      brand: form.brand,
      model: form.model || form.name,
      size_eu: parseFloat(form.size_eu),
      insole_length_cm: form.insole_length_cm ? parseFloat(form.insole_length_cm) : null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      surface_type: form.surface_type as any,
      level: form.level as any,
      condition: form.condition as any,
      condition_detail: form.condition_detail || null,
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
      box_included: form.box_included,
      bag_included: form.bag_included,
      extras_description: form.extras_description || null,
      status: dbStatus,
      drop_scheduled_at: finalDropDate,
    };

    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (error) {
        console.error('Product update failed:', error);
        showToast(`Błąd zapisu: ${error.message}`);
        setSaving(false);
        return;
      }
      showToast('Produkt zaktualizowany');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) {
        console.error('Product insert failed:', error);
        showToast(`Błąd dodawania: ${error.message}`);
        setSaving(false);
        return;
      }
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
    let customStatus: CustomProductStatus = 'available';
    let dType: DropTypeChoice = 'global';

    if (p.status === 'sold') {
      customStatus = 'sold';
    } else if (p.status === 'draft') {
      if (p.drop_scheduled_at) {
        customStatus = 'drop';
        const isGlobal = Boolean(dropSettings?.drop_date && p.drop_scheduled_at === dropSettings.drop_date);
        dType = isGlobal ? 'global' : 'custom';
      } else {
        customStatus = 'draft';
      }
    }

    setForm({
      name: p.name, brand: p.brand, model: p.model,
      size_eu: String(p.size_eu), insole_length_cm: p.insole_length_cm ? String(p.insole_length_cm) : '',
      price: String(p.price), original_price: p.original_price ? String(p.original_price) : '',
      surface_type: p.surface_type, level: p.level, condition: p.condition,
      condition_detail: p.condition_detail || '', images: p.images.join('\n'),
      box_included: p.box_included, bag_included: p.bag_included,
      extras_description: p.extras_description || '',
      status: customStatus,
      drop_type: dType,
      drop_scheduled_at: p.drop_scheduled_at ? new Date(p.drop_scheduled_at).toISOString().slice(0, 16) : '',
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

  const handleQuickStatusChange = async (id: string, newStatus: CustomProductStatus) => {
    const updates: ProductUpdate = {};
    if (newStatus === 'available') {
      updates.status = 'available';
      updates.drop_scheduled_at = null;
    } else if (newStatus === 'draft') {
      updates.status = 'draft';
      updates.drop_scheduled_at = null;
    } else if (newStatus === 'drop') {
      updates.status = 'draft';
      updates.drop_scheduled_at = dropSettings?.drop_date && !dropSettings.is_tbd ? dropSettings.drop_date : new Date().toISOString();
    } else if (newStatus === 'sold') {
      updates.status = 'sold';
      updates.drop_scheduled_at = null;
    }

    const { error } = await supabase.from('products').update(updates).eq('id', id);
    await loadProducts();
    if (error) {
      showToast(`Błąd: ${error.message}`);
      return;
    }
    showToast('Status zmieniony');
  };

  const handlePublishAllDrop = async () => {
    setPublishing(true);
    const { data } = await supabase
      .from('products')
      .update({ status: 'available', drop_scheduled_at: null })
      .eq('status', 'draft')
      .not('drop_scheduled_at', 'is', null)
      .select('id');
    setShowPublishModal(false);
    setPublishing(false);
    if (data) {
      showToast(`Opublikowano ${data.length} produktów z dropu`);
      await loadProducts();
    }
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
            <Link to="/" className="flex items-center justify-center gap-1.5 text-sm text-neutral-500 hover:text-white/80 transition-colors">
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
                Czy na pewno chcesz opublikować wszystkie <span className="text-[#FF6B00] font-bold">{dropProducts.length}</span> produkty z zaplanowanego dropu? Zmienią status na "Dostępny" w sklepie. Produkty ze statusem "Szkic" pozostaną niewidoczne w panelu.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handlePublishAllDrop}
                  disabled={publishing || dropProducts.length === 0}
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

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#0c0c0c] border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-black text-lg text-white uppercase">Foot<span className="text-[#FF6B00]">Bubr</span></Link>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-neutral-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-backdrop-in" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-[#0c0c0c] border-r border-neutral-800/80 flex flex-col z-40 lg:hidden animate-slide-in-right">
            <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between">
              <Link to="/" className="font-black text-lg text-white uppercase">Foot<span className="text-[#FF6B00]">Bubr</span></Link>
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
            <Link to="/" className="flex items-center gap-2">
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
                  <p className="text-neutral-500 text-sm">
                    {availableProducts.length} dostępnych · {draftProducts.length} szkiców · {dropProducts.length} w dropie · {soldProducts.length} wyprzedanych
                  </p>
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
                    disabled={dropProducts.length === 0}
                    className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 font-bold px-3 sm:px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-4 h-4" />
                    Opublikuj drop ({dropProducts.length})
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => {
                    const isDrop = p.status === 'draft' && p.drop_scheduled_at !== null;
                    const isDraft = p.status === 'draft' && p.drop_scheduled_at === null;

                    let currentCustomStatus: CustomProductStatus = 'available';
                    if (p.status === 'sold') currentCustomStatus = 'sold';
                    else if (isDraft) currentCustomStatus = 'draft';
                    else if (isDrop) currentCustomStatus = 'drop';

                    return (
                      <div key={p.id} className="flex items-center gap-3 sm:gap-4 bg-[#141414] border border-neutral-800/80 rounded-2xl p-3 sm:p-4 hover:border-neutral-700 transition-all">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/5 border border-neutral-800 flex-shrink-0">
                          {p.images[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">Brak</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">{p.brand}</span>
                            <span className="text-xs text-neutral-500">EU {p.size_eu}</span>
                            
                            {isDraft && (
                              <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                <FileText className="w-3 h-3" /> Szkic
                              </span>
                            )}

                            {isDrop && (
                              <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3" /> W dropie
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-white text-sm truncate">{p.name}</p>
                          <p className="text-sm font-bold text-white mt-0.5">{formatPrice(p.price)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <div className="relative">
                            <select
                              value={currentCustomStatus}
                              onChange={(e) => handleQuickStatusChange(p.id, e.target.value as CustomProductStatus)}
                              className={cn(
                                'appearance-none text-xs font-bold px-2 sm:px-3 py-2 pr-7 rounded-lg border cursor-pointer focus:outline-none transition-all [&>option]:bg-[#1a1a1a] [&>option]:text-neutral-100',
                                currentCustomStatus === 'available' && 'text-emerald-400 border-emerald-400/30 bg-[#1a1a1a]',
                                currentCustomStatus === 'draft' && 'text-neutral-300 border-neutral-700 bg-[#1a1a1a]',
                                currentCustomStatus === 'drop' && 'text-blue-400 border-blue-400/30 bg-[#1a1a1a]',
                                currentCustomStatus === 'sold' && 'text-red-400 border-red-400/30 bg-[#1a1a1a]',
                              )}
                            >
                              <option value="available">Dostępny</option>
                              <option value="draft">Szkic</option>
                              <option value="drop">W dropie</option>
                              <option value="sold">Wyprzedany (archiwum)</option>
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
                    );
                  })}
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

                    {/* Status selection */}
                    <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                      <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-1">Status produktu</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                        {/* 1. Dostępny */}
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, status: 'available' })}
                          className={cn(
                            'p-2.5 rounded-xl text-center border font-bold text-xs transition-all active:scale-95',
                            form.status === 'available'
                              ? 'bg-emerald-400/15 border-emerald-400/40 text-emerald-400'
                              : 'bg-white/5 border-neutral-800 text-neutral-400 hover:text-white'
                          )}
                        >
                          Dostępny
                        </button>

                        {/* 2. Szkic */}
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, status: 'draft' })}
                          className={cn(
                            'p-2.5 rounded-xl text-center border font-bold text-xs transition-all active:scale-95',
                            form.status === 'draft'
                              ? 'bg-neutral-400/20 border-neutral-400 text-white'
                              : 'bg-white/5 border-neutral-800 text-neutral-400 hover:text-white'
                          )}
                        >
                          Szkic
                        </button>

                        {/* 3. W dropie */}
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, status: 'drop' })}
                          className={cn(
                            'p-2.5 rounded-xl text-center border font-bold text-xs transition-all active:scale-95',
                            form.status === 'drop'
                              ? 'bg-blue-400/15 border-blue-400/40 text-blue-400'
                              : 'bg-white/5 border-neutral-800 text-neutral-400 hover:text-white'
                          )}
                        >
                          W dropie
                        </button>

                        {/* 4. Wyprzedany (archiwum) */}
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, status: 'sold' })}
                          className={cn(
                            'p-2.5 rounded-xl text-center border font-bold text-xs transition-all active:scale-95',
                            form.status === 'sold'
                              ? 'bg-red-400/15 border-red-400/40 text-red-400'
                              : 'bg-white/5 border-neutral-800 text-neutral-400 hover:text-white'
                          )}
                        >
                          Wyprzedany (archiwum)
                        </button>
                      </div>

                      {/* Drop configuration */}
                      {form.status === 'drop' && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-3 animate-fade-in">
                          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            Wybór dropu dla tego produktu
                          </p>

                          <div className="space-y-2">
                            {/* Drop główny */}
                            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-black/40 transition-all">
                              <input
                                type="radio"
                                name="dropTypeChoice"
                                checked={form.drop_type === 'global'}
                                onChange={() => setForm({ ...form, drop_type: 'global' })}
                                className="accent-[#FF6B00]"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-semibold text-white block">Drop główny (ze zrobionych)</span>
                                <span className="text-xs text-neutral-400 block mt-0.5">
                                  {dropSettings?.title || 'Nowy drop'} — {dropSettings?.drop_date && !dropSettings.is_tbd
                                    ? new Date(dropSettings.drop_date).toLocaleString('pl-PL')
                                    : 'Brak ustalonej daty / Wkrótce'}
                                </span>
                              </div>
                            </label>

                            {/* Drop indywidualny */}
                            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-black/40 transition-all">
                              <input
                                type="radio"
                                name="dropTypeChoice"
                                checked={form.drop_type === 'custom'}
                                onChange={() => setForm({ ...form, drop_type: 'custom' })}
                                className="accent-[#FF6B00]"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-semibold text-white block">Drop indywidualny</span>
                                <span className="text-xs text-neutral-400 block mt-0.5">Ustaw własną datę i godzinę tylko dla tego produktu</span>
                              </div>
                            </label>
                          </div>

                          {form.drop_type === 'custom' && (
                            <div className="pt-2 animate-fade-in space-y-1">
                              <label className="text-xs text-neutral-400 block">Wybierz własną datę i godzinę publikacji:</label>
                              <input
                                type="datetime-local"
                                value={form.drop_scheduled_at}
                                onChange={(e) => setForm({ ...form, drop_scheduled_at: e.target.value })}
                                className={`${inp} [&::-webkit-calendar-picker-indicator]:invert`}
                              />
                            </div>
                          )}
                        </div>
                      )}
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
                    <div
                      key={o.id}
                      className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 hover:border-neutral-700 transition-all cursor-pointer"
                      onClick={() => openOrderDetail(o)}
                    >
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-neutral-300">{formatOrderNumber(o)}</span>
                            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', ORDER_STATUS_STYLES[o.status] || 'bg-white/10 text-neutral-400')}>
                              {ORDER_STATUS_LABELS[o.status] || o.status}
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
                              <p className="text-neutral-400 text-xs sm:text-sm">Płatność: {o.payment_method === 'blik' ? 'BLIK' : o.payment_method === 'card' ? 'Karta' : o.payment_method === 'transfer' ? 'Przelew' : o.payment_method}</p>
                              {o.tracking_number && (
                                <p className="text-blue-400 text-xs sm:text-sm mt-0.5 flex items-center gap-1">
                                  <Truck className="w-3 h-3" />
                                  {o.tracking_number}
                                </p>
                              )}
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

          {/* Order detail modal */}
          {selectedOrder && (
            <>
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-backdrop-in"
                onClick={() => setSelectedOrder(null)}
              />
              <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 overflow-y-auto pointer-events-none">
                <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-2xl my-4 sm:my-8 animate-scale-in pointer-events-auto shadow-2xl">
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-neutral-800 bg-[#111] rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">{formatOrderNumber(selectedOrder)}</h2>
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', ORDER_STATUS_STYLES[selectedOrder.status] || 'bg-white/10 text-neutral-400')}>
                        {ORDER_STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="p-2 text-neutral-500 hover:text-white bg-white/5 rounded-xl transition-all active:scale-90"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4 sm:p-6 space-y-5">
                    {/* Status changer */}
                    <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4">
                      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Zmień status</h3>
                      <div className="flex flex-wrap gap-2">
                        {(['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleOrderStatusChange(selectedOrder.id, s)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border active:scale-95',
                              selectedOrder.status === s
                                ? ORDER_STATUS_STYLES[s] + ' border-current'
                                : 'bg-white/5 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                            )}
                          >
                            {ORDER_STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tracking number */}
                    <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4">
                      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        Numer śledzenia przesyłki
                      </h3>
                      <div className="flex gap-2">
                        <input
                          className={cn(inp, 'flex-1')}
                          placeholder="np. INPOST123456789 / DPD123456789"
                          value={orderTrackingInput}
                          onChange={(e) => setOrderTrackingInput(e.target.value)}
                        />
                        <button
                          onClick={handleSaveTracking}
                          disabled={orderSaving}
                          className="flex items-center gap-1.5 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 text-sm disabled:opacity-40"
                        >
                          {orderSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Zapisz
                        </button>
                      </div>
                    </div>

                    {/* Customer details */}
                    <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Dane klienta</h3>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-neutral-500 text-xs">Imię i nazwisko</p>
                          <p className="text-white font-semibold">{selectedOrder.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 text-xs">E-mail</p>
                          <p className="text-white">{selectedOrder.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 text-xs">Telefon</p>
                          <div className="flex items-center gap-2">
                            <p className="text-white">{selectedOrder.customer_phone || '—'}</p>
                            {selectedOrder.customer_phone && (
                              <button
                                onClick={() => copyToClipboard(selectedOrder.customer_phone!, 'telefon')}
                                className="p-1 text-neutral-500 hover:text-[#FF6B00] transition-colors active:scale-90"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-neutral-800">
                        <p className="text-neutral-500 text-xs mb-1">
                          {selectedOrder.shipping_method === 'paczkomat' ? 'Kod paczkomatu' : 'Adres dostawy'}
                        </p>
                        {selectedOrder.shipping_method === 'paczkomat' ? (
                          <div className="flex items-center gap-2">
                            <p className="text-white font-mono font-bold text-lg">{selectedOrder.paczkomat_code}</p>
                            <button
                              onClick={() => copyToClipboard(selectedOrder.paczkomat_code!, 'paczkomat')}
                              className="p-1 text-neutral-500 hover:text-[#FF6B00] transition-colors active:scale-90"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                            <p className="text-white">{selectedOrder.shipping_address || '—'}</p>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Metoda płatności</span>
                        <span className="text-white font-semibold">
                          {selectedOrder.payment_method === 'blik' ? 'BLIK' : selectedOrder.payment_method === 'card' ? 'Karta' : selectedOrder.payment_method === 'transfer' ? 'Przelew' : selectedOrder.payment_method}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Kwota</span>
                        <span className="text-white font-black text-lg">{formatPrice(selectedOrder.total_price)}</span>
                      </div>
                    </div>

                    {/* Product */}
                    {selectedOrder.product && (
                      <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Zakupiony produkt</h3>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/5 border border-neutral-800 flex-shrink-0">
                            {selectedOrder.product.images[0] ? (
                              <img src={selectedOrder.product.images[0]} alt={selectedOrder.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">Brak</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{selectedOrder.product.name}</p>
                            <p className="text-xs text-neutral-500">{selectedOrder.product.brand} · EU {selectedOrder.product.size_eu}</p>
                            <p className="text-[#FF6B00] font-bold text-sm mt-0.5">{formatPrice(selectedOrder.product.price)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delete Order Button */}
                    <div className="pt-3 border-t border-neutral-800 flex justify-end">
                      <button
                        onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.product_id)}
                        disabled={deletingOrder}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 text-sm disabled:opacity-40"
                      >
                        {deletingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Usuń zamówienie
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Drop Settings */}
          {view === 'drop-settings' && (
            <div className="animate-fade-in max-w-3xl space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Ustawienia dropu</h2>
                <p className="text-neutral-500 text-sm">Zarządzanie czasem, banerem i zawartością nadchodzącego dropu</p>
              </div>

              {/* General drop settings */}
              <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Status dropu</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setSettingsForm({ ...settingsForm, is_tbd: true })}
                      className={cn(
                        'flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border active:scale-95',
                        settingsForm.is_tbd
                          ? 'bg-blue-400/15 border-blue-400/40 text-blue-400'
                          : 'bg-white/5 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                      )}
                    >
                      Brak ustalonej daty / Wkrótce
                    </button>
                    <button
                      onClick={() => setSettingsForm({ ...settingsForm, is_tbd: false })}
                      className={cn(
                        'flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border active:scale-95',
                        !settingsForm.is_tbd
                          ? 'bg-emerald-400/15 border-emerald-400/40 text-emerald-400'
                          : 'bg-white/5 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                      )}
                    >
                      Ustaw datę dropu
                    </button>
                  </div>
                </div>

                {!settingsForm.is_tbd && (
                  <div className="animate-fade-in">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Data i godzina dropu</label>
                    <input
                      type="datetime-local"
                      className={`${inp} [&::-webkit-calendar-picker-indicator]:invert`}
                      value={settingsForm.drop_date}
                      onChange={(e) => setSettingsForm({ ...settingsForm, drop_date: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Tytuł</label>
                    <input
                      className={inp}
                      placeholder="Nowy drop"
                      value={settingsForm.title}
                      onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Podtytuł / opis</label>
                    <input
                      className={inp}
                      placeholder="Krótki opis dropu"
                      value={settingsForm.subtitle}
                      onChange={(e) => setSettingsForm({ ...settingsForm, subtitle: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Wyróżniony produkt (główny w Hero)</label>
                  <div className="relative">
                    <select
                      className={sel}
                      value={settingsForm.featured_product_id}
                      onChange={(e) => setSettingsForm({ ...settingsForm, featured_product_id: e.target.value })}
                    >
                      <option value="none">Brak wyróżnionego produktu</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (EU {p.size_eu}) — {p.status}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveDropSettings}
                    disabled={savingSettings}
                    className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 shadow-[0_4px_15px_rgba(255,107,0,0.25)]"
                  >
                    {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Zapisz ustawienia
                  </button>
                </div>
              </div>

              {/* Products in drop */}
              <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
                <h3 className="font-bold text-white uppercase tracking-tight text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF6B00]" />
                  Produkty przypisane do zaplanowanego dropu ({dropProducts.length})
                </h3>

                <div className="space-y-2">
                  {dropProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 border border-neutral-800 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-neutral-800 flex-shrink-0">
                          {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{p.name}</p>
                          <p className="text-xs text-neutral-500">{p.brand} · EU {p.size_eu} · {formatPrice(p.price)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleQuickStatusChange(p.id, 'draft')}
                        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" /> Przenieś do szkiców
                      </button>
                    </div>
                  ))}

                  {dropProducts.length === 0 && (
                    <p className="text-xs text-neutral-600 py-4 text-center">Brak produktów przypisanych do dropu.</p>
                  )}
                </div>

                {/* Dodaj ze szkiców do dropu */}
                {draftProducts.length > 0 && (
                  <div className="pt-4 border-t border-neutral-800/80">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Dodaj ze szkiców do dropu:</h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {draftProducts.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 bg-black/30 border border-neutral-800/60 rounded-xl">
                          <div className="min-w-0">
                            <p className="text-neutral-300 text-xs font-semibold truncate">{p.name}</p>
                            <p className="text-[11px] text-neutral-500">EU {p.size_eu} · {formatPrice(p.price)}</p>
                          </div>
                          <button
                            onClick={() => handleQuickStatusChange(p.id, 'drop')}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-400/10 hover:bg-blue-400/20 px-2.5 py-1 rounded-lg transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" /> Dołącz do dropu
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
        <button
          onClick={() => setView('drop-settings')}
          className={cn('flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95', view === 'drop-settings' ? 'bg-[#FF6B00]/15 text-[#FF6B00]' : 'text-neutral-400 hover:text-white hover:bg-white/5')}
        >
          <Sparkles className="w-4 h-4" /> Ustawienia dropu
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

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: 'Panel administracyjny — FootBubr' },
      { name: 'description', content: 'Zarządzanie produktami, dropami i zamówieniami sklepu FootBubr.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Panel administracyjny — FootBubr' },
      { property: 'og:description', content: 'Zarządzanie produktami, dropami i zamówieniami FootBubr.' },
    ],
  }),
});
