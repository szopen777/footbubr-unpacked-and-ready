import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useRef } from 'react';
import { supabase, Product, Order, DropSettings, PRODUCT_LEVELS, formatOrderNumber } from '@/lib/supabase';

import { formatPrice, INPUT_CLASS, SELECT_CLASS, cn } from '@/lib/utils';
import { 
  Package, ShoppingCart, LogOut, Eye, EyeOff, Loader as Loader2, Trash2, 
  CreditCard as Edit2, X, Check, CircleAlert as AlertCircle, ArrowLeft, 
  ChevronDown, Zap, Calendar, Menu, Sparkles, Copy, Truck, MapPin, 
  Plus, Minus, FileText, Clock, Layers, Upload, Footprints 
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

type View = 'products' | 'orders' | 'drop-settings';
type CustomProductStatus = 'available' | 'draft' | 'drop' | 'sold';
type DropTypeChoice = 'global' | 'custom';
type ProductTypeChoice = 'boot' | 'accessory';

const ADMIN_PASSWORD = '123';

function toLocalDatetimeInput(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ProductForm {
  productType: ProductTypeChoice;
  name: string;
  brand: string;
  model: string;
  size_eu: string;
  accessory_type: string;
  insole_length_cm: string;
  price: string;
  original_price: string;
  stock_quantity: string;
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

const EMPTY_BOOT_FORM: ProductForm = {
  productType: 'boot',
  name: '', brand: 'Nike', model: '', size_eu: '', accessory_type: 'Skarpety antypoślizgowe', insole_length_cm: '',
  price: '', original_price: '', stock_quantity: '1', surface_type: 'FG', level: 'Profesjonalny',
  condition: 'Nowe z metką', condition_detail: '', images: '',
  box_included: false, bag_included: false, extras_description: '',
  status: 'available', drop_type: 'global', drop_scheduled_at: '',
};

const EMPTY_ACCESSORY_FORM: ProductForm = {
  productType: 'accessory',
  name: 'Skarpety antypoślizgowe FOOTBUBR Białe', brand: 'FOOTBUBR', model: 'Skarpety', size_eu: 'One Size (41-45)', accessory_type: 'Skarpety antypoślizgowe', insole_length_cm: '',
  price: '39', original_price: '59', stock_quantity: '100', surface_type: 'FG', level: 'Amatorski',
  condition: 'Nowe z metką', condition_detail: 'Rozmiar uniwersalny', images: '',
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
  const [form, setForm] = useState<ProductForm>(EMPTY_BOOT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const nowIso = new Date().toISOString();

    await supabase
      .from('products')
      .update({ status: 'available', drop_scheduled_at: null })
      .eq('status', 'draft')
      .lte('drop_scheduled_at', nowIso);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${Date.now()}_${cleanName}`;
      const filePath = `products/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Błąd uploadu Supabase:', uploadError);
        showToast(`Błąd: ${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    if (uploadedUrls.length > 0) {
      setForm((prev) => {
        const existing = prev.images.trim();
        const combined = existing ? `${existing}\n${uploadedUrls.join('\n')}` : uploadedUrls.join('\n');
        return { ...prev, images: combined };
      });
      showToast(`Wgrano ${uploadedUrls.length} zdjęć!`);
    }

    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = async (indexToRemove: number) => {
    const imageList = form.images.split('\n').map((s) => s.trim()).filter(Boolean);
    const urlToRemove = imageList[indexToRemove];

    if (urlToRemove && urlToRemove.includes('product-images')) {
      try {
        const parts = urlToRemove.split('/product-images/');
        if (parts.length > 1) {
          const filePath = parts[1];
          await supabase.storage.from('product-images').remove([filePath]);
        }
      } catch (err) {
        console.error('Błąd usuwania pliku ze Storage:', err);
      }
    }

    const updated = imageList.filter((_, idx) => idx !== indexToRemove);
    setForm((prev) => ({ ...prev, images: updated.join('\n') }));
    showToast('Zdjęcie usunięte');
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
        drop_date: toLocalDatetimeInput(s.drop_date),
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
    if (!form.name || !form.price || !form.size_eu) return;
    setSaving(true);

    let dbStatus: 'available' | 'draft' | 'sold' = 'available';
    let finalDropDate: string | null = null;

    if (form.status === 'available') {
      dbStatus = 'available';
      finalDropDate = null;
    } else if (form.status === 'draft') {
      dbStatus = 'draft';
      finalDropDate = null;
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

    const isAcc = form.productType === 'accessory';

    // Jeśli to akcesorium, upewniamy się, że nazwa/model zawiera odpowiednie słowa kluczowe, aby filtr na stronie głównej je złapał
    let accName = form.name;
    if (isAcc) {
      if (form.accessory_type === 'Mini ochraniacze' && !accName.toLowerCase().includes('ochraniacze')) {
        accName = `${accName} - Mini ochraniacze`;
      } else if (form.accessory_type === 'Taśmy / Cohesive Tape' && !accName.toLowerCase().includes('taśma') && !accName.toLowerCase().includes('tape')) {
        accName = `${accName} - Taśma`;
      } else if (form.accessory_type === 'Zestawy FOOTBUBR' && !accName.toLowerCase().includes('zestaw')) {
        accName = `${accName} - Zestaw`;
      }
    }

    const payload: any = {
      name: accName,
      brand: isAcc ? 'FOOTBUBR' : form.brand,
      model: isAcc ? form.accessory_type : (form.model || form.name),
      size_eu: form.size_eu,
      accessory_type: isAcc ? form.accessory_type : null,
      insole_length_cm: isAcc ? null : (form.insole_length_cm ? parseFloat(form.insole_length_cm) : null),
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      stock_quantity: isAcc ? (form.stock_quantity ? parseInt(form.stock_quantity, 10) : 100) : 1,
      surface_type: isAcc ? 'FG' : form.surface_type as any,
      level: isAcc ? 'Amatorski' : form.level as any,
      condition: form.condition as any,
      condition_detail: form.condition_detail || null,
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
      box_included: isAcc ? false : form.box_included,
      bag_included: isAcc ? false : form.bag_included,
      extras_description: form.extras_description || null,
      status: dbStatus,
      drop_scheduled_at: finalDropDate,
    };

    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (error) {
        showToast(`Błąd zapisu: ${error.message}`);
        setSaving(false);
        return;
      }
      showToast('Produkt zaktualizowany');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) {
        showToast(`Błąd dodawania: ${error.message}`);
        setSaving(false);
        return;
      }
      showToast('Produkt dodany');
    }

    await loadProducts();
    setForm(EMPTY_BOOT_FORM);
    setEditingId(null);
    setShowProductModal(false);
    setView('products');
    setSaving(false);
  };

  const handleEdit = (p: Product & { stock_quantity?: number; accessory_type?: string }) => {
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

    const isAcc = p.brand?.toLowerCase() === 'footbubr' || p.name?.toLowerCase().includes('skarpety') || p.name?.toLowerCase().includes('ochraniacze');

    setForm({
      productType: isAcc ? 'accessory' : 'boot',
      name: p.name, brand: p.brand, model: p.model,
      size_eu: String(p.size_eu), accessory_type: p.accessory_type || 'Skarpety antypoślizgowe', insole_length_cm: p.insole_length_cm ? String(p.insole_length_cm) : '',
      price: String(p.price), original_price: p.original_price ? String(p.original_price) : '',
      stock_quantity: String(p.stock_quantity ?? (isAcc ? 100 : 1)),
      surface_type: p.surface_type, level: p.level, condition: p.condition,
      condition_detail: p.condition_detail || '', images: p.images.join('\n'),
      box_included: p.box_included, bag_included: p.bag_included,
      extras_description: p.extras_description || '',
      status: customStatus,
      drop_type: dType,
      drop_scheduled_at: toLocalDatetimeInput(p.drop_scheduled_at),
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
    const updates: any = {};
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
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#FF6B00] text-black font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in-up">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

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
                Czy na pewno chcesz opublikować wszystkie <span className="text-[#FF6B00] font-bold">{dropProducts.length}</span> produkty z zaplanowanego dropu?
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

      <div className="lg:hidden sticky top-0 z-30 bg-[#0c0c0c] border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-black text-lg text-white uppercase">Foot<span className="text-[#FF6B00]">Bubr</span></Link>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-neutral-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
      </div>

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
        <aside className="hidden lg:flex w-56 bg-[#0c0c0c] border-r border-neutral-800/80 flex-col fixed h-full z-10">
          <div className="p-5 border-b border-neutral-800/80">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-black text-lg text-white uppercase">Foot<span className="text-[#FF6B00]">Bubr</span></span>
            </Link>
            <p className="text-xs text-neutral-600 mt-0.5">Panel admina</p>
          </div>
          <AdminNav view={view} setView={setView} setForm={setForm} setEditingId={setEditingId} productsCount={products.length} ordersCount={orders.length} onLogout={() => setAuthed(false)} />
        </aside>

        <main className="lg:ml-56 flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
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
                    onClick={() => { setForm(EMPTY_BOOT_FORM); setEditingId(null); setShowProductModal(true); }}
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
                  {products.map((p: any) => {
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
                            <span className="text-xs text-neutral-500">Rozmiar: {p.size_eu}</span>
                            {p.accessory_type && (
                              <span className="text-xs text-neutral-400 bg-white/5 border border-neutral-800 px-2 py-0.5 rounded-full">
                                {p.accessory_type}
                              </span>
                            )}
                            <span className="text-xs font-bold text-neutral-300 bg-white/5 border border-neutral-700 px-2 py-0.5 rounded-full">
                              Magazyn: {p.stock_quantity ?? 1} szt.
                            </span>
                            
                            {isDraft && (
                              <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                <FileText className="w-3 h-3" /> Szkic
                              </span>
                            )}

                            {isDrop && (
                              <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3" /> W dropie: {new Date(p.drop_scheduled_at!).toLocaleString('pl-PL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
                onClick={() => { setShowProductModal(false); setForm(EMPTY_BOOT_FORM); setEditingId(null); }}
              />
              <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 overflow-y-auto pointer-events-none">
                <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-2xl my-4 sm:my-8 animate-scale-in pointer-events-auto shadow-2xl">
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-neutral-800 bg-[#111] rounded-t-2xl">
                    <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">{editingId ? 'Edytuj produkt' : 'Dodaj nowy produkt'}</h2>
                    <button
                      onClick={() => { setShowProductModal(false); setForm(EMPTY_BOOT_FORM); setEditingId(null); }}
                      className="p-2 text-neutral-500 hover:text-white bg-white/5 rounded-xl transition-all active:scale-90"
                      aria-label="Zamknij"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    
                    {/* PRZEŁĄCZNIK TYPU PRODUKTU */}
                    {!editingId && (
                      <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-2">
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 px-2">Wybierz typ dodawanego produktu:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setForm(EMPTY_BOOT_FORM)}
                            className={cn(
                              'py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all',
                              form.productType === 'boot'
                                ? 'bg-[#FF6B00] text-black shadow-[0_4px_15px_rgba(255,107,0,0.3)]'
                                : 'bg-white/5 text-neutral-400 hover:text-white'
                            )}
                          >
                            <Footprints className="w-4 h-4" /> Korki 1 of 1 (Buty)
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(EMPTY_ACCESSORY_FORM)}
                            className={cn(
                              'py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all',
                              form.productType === 'accessory'
                                ? 'bg-[#FF6B00] text-black shadow-[0_4px_15px_rgba(255,107,0,0.3)]'
                                : 'bg-white/5 text-neutral-400 hover:text-white'
                            )}
                          >
                            <Package className="w-4 h-4" /> Akcesoria / Ochraniacze
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Basic info */}
                    <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                      <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-1">
                        {form.productType === 'boot' ? 'Informacje o korkach' : 'Informacje o akcesorium'}
                      </h3>

                      {form.productType === 'boot' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Marka</label>
                            <input className={inp} placeholder="np. Nike" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Model</label>
                            <input className={inp} placeholder="np. Mercurial Vapor" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-white/5 rounded-xl border border-neutral-800 text-xs text-neutral-300">
                            Marka ustawiona automatycznie jako <span className="text-[#FF6B00] font-bold">FOOTBUBR</span>.
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Rodzaj akcesorium (do filtrów) *</label>
                            <div className="relative">
                              <select 
                                className={sel} 
                                value={form.accessory_type} 
                                onChange={(e) => setForm({ ...form, accessory_type: e.target.value })}
                              >
                                <option value="Skarpety antypoślizgowe">Skarpety antypoślizgowe</option>
                                <option value="Mini ochraniacze">Mini ochraniacze</option>
                                <option value="Taśmy / Cohesive Tape">Taśmy / Cohesive Tape</option>
                                <option value="Zestawy FOOTBUBR">Zestawy FOOTBUBR</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Pełna nazwa produktu *</label>
                        <input className={inp} placeholder="np. Nike Mercurial Elite 1 of 1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                            {form.productType === 'boot' ? 'Rozmiar EU *' : 'Rozmiar (np. One Size (41-45), S, M) *'}
                          </label>
                          <input className={inp} placeholder={form.productType === 'boot' ? '42.5' : 'One Size (41-45)'} type="text" value={form.size_eu} onChange={(e) => setForm({ ...form, size_eu: e.target.value })} />
                        </div>
                        {form.productType === 'boot' && (
                          <div>
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Długość wkładki (cm)</label>
                            <input className={inp} placeholder="27.0" type="number" step="0.5" value={form.insole_length_cm} onChange={(e) => setForm({ ...form, insole_length_cm: e.target.value })} />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Cena PLN *</label>
                          <input className={inp} placeholder="399" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Cena katalogowa PLN</label>
                          <input className={inp} placeholder="799" type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} />
                        </div>
                      </div>

                      {form.productType === 'accessory' && (
                        <div>
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Ilość sztuk w magazynie *</label>
                          <input className={inp} placeholder="100" type="number" min="1" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
                        </div>
                      )}
                    </div>

                    {/* Product details (Tylko dla butów) */}
                    {form.productType === 'boot' && (
                      <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-1">Specyfikacja butów</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Nawierzchnia</label>
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
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Poziom zaawansowania</label>
                            <div className="relative">
                              <select className={sel} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                                {PRODUCT_LEVELS.map(({ value, label }) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Stan obuwia</label>
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
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Opis stanu</label>
                          <textarea
                            className={`${inp} resize-none`}
                            rows={2}
                            placeholder="Szczegółowy opis stanu"
                            value={form.condition_detail}
                            onChange={(e) => setForm({ ...form, condition_detail: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Images & extras */}
                    <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Zdjęcia produktu</h3>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="flex items-center gap-1.5 text-xs font-bold text-black bg-[#FF6B00] hover:bg-[#FF7A00] px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          Wgraj z urządzenia
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          multiple
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">URL zdjęć</label>
                        <textarea
                          className={`${inp} resize-none font-mono text-xs`}
                          rows={3}
                          placeholder="https://..."
                          value={form.images}
                          onChange={(e) => setForm({ ...form, images: e.target.value })}
                        />
                      </div>

                      {form.images.trim() && (
                        <div className="flex gap-3 overflow-x-auto py-2">
                          {form.images.split('\n').filter(Boolean).map((url, i) => (
                            <div key={i} className="relative group w-20 h-20 rounded-xl border border-neutral-800 overflow-hidden flex-shrink-0 bg-black/40">
                              <img src={url.trim()} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(i)}
                                className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 active:scale-90"
                              >
                                <Trash2 className="w-5 h-5 mb-0.5" />
                                <span className="text-[9px] font-bold uppercase">Usuń</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {form.productType === 'boot' && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-2 border-t border-neutral-800/60">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.box_included} onChange={(e) => setForm({ ...form, box_included: e.target.checked })} className="w-4 h-4 accent-[#FF6B00]" />
                            <span className="text-sm text-neutral-300">Oryginalne pudełko</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.bag_included} onChange={(e) => setForm({ ...form, bag_included: e.target.checked })} className="w-4 h-4 accent-[#FF6B00]" />
                            <span className="text-sm text-neutral-300">Worek / torba</span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Status selection */}
                    <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                      <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-1">Status produktu</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, status: 'available' })}
                          className={cn('p-2.5 rounded-xl text-center border font-bold text-xs transition-all active:scale-95', form.status === 'available' ? 'bg-emerald-400/15 border-emerald-400/40 text-emerald-400' : 'bg-white/5 border-neutral-800 text-neutral-400')}
                        >
                          Dostępny
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, status: 'draft' })}
                          className={cn('p-2.5 rounded-xl text-center border font-bold text-xs transition-all active:scale-95', form.status === 'draft' ? 'bg-neutral-400/20 border-neutral-400 text-white' : 'bg-white/5 border-neutral-800 text-neutral-400')}
                        >
                          Szkic
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, status: 'drop' })}
                          className={cn('p-2.5 rounded-xl text-center border font-bold text-xs transition-all active:scale-95', form.status === 'drop' ? 'bg-blue-400/15 border-blue-400/40 text-blue-400' : 'bg-white/5 border-neutral-800 text-neutral-400')}
                        >
                          W dropie
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, status: 'sold' })}
                          className={cn('p-2.5 rounded-xl text-center border font-bold text-xs transition-all active:scale-95', form.status === 'sold' ? 'bg-red-400/15 border-red-400/40 text-red-400' : 'bg-white/5 border-neutral-800 text-neutral-400')}
                        >
                          Wyprzedany
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSave}
                        disabled={saving || !form.name || !form.price || !form.size_eu}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 shadow-[0_4px_15px_rgba(255,107,0,0.25)]"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {editingId ? 'Zapisz zmiany' : 'Dodaj produkt'}
                      </button>
                      <button
                        onClick={() => { setShowProductModal(false); setForm(EMPTY_BOOT_FORM); setEditingId(null); }}
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
                              <p className="text-neutral-400 text-xs sm:text-sm">Płatność: {o.payment_method}</p>
                              {o.tracking_number && (
                                <p className="text-blue-400 text-xs sm:text-sm mt-0.5 flex items-center gap-1">
                                  <Truck className="w-3 h-3" />
                                  {o.tracking_number}
                                </p>
                              )}
                              {o.product && (
                                <p className="text-[#FF6B00] font-medium mt-1 text-xs sm:text-sm">{o.product.name} · Rozmiar: {o.product.size_eu}</p>
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

                    <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4">
                      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        Numer śledzenia przesyłki
                      </h3>
                      <div className="flex gap-2">
                        <input
                          className={cn(inp, 'flex-1')}
                          placeholder="np. INPOST123456789"
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
                          <p className="text-white">{selectedOrder.customer_phone || '—'}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-neutral-800">
                        <p className="text-neutral-500 text-xs mb-1">
                          {selectedOrder.shipping_method === 'paczkomat' ? 'Kod paczkomatu' : 'Adres dostawy'}
                        </p>
                        {selectedOrder.shipping_method === 'paczkomat' ? (
                          <p className="text-white font-mono font-bold text-lg">{selectedOrder.paczkomat_code}</p>
                        ) : (
                          <p className="text-white">{selectedOrder.shipping_address || '—'}</p>
                        )}
                      </div>
                    </div>

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

          {view === 'drop-settings' && (
            <div className="animate-fade-in max-w-3xl space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Ustawienia dropu</h2>
                <p className="text-neutral-500 text-sm">Zarządzanie czasem i banerem nadchodzącego dropu</p>
              </div>

              <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Status dropu</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setSettingsForm({ ...settingsForm, is_tbd: true })}
                      className={cn('flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border active:scale-95', settingsForm.is_tbd ? 'bg-blue-400/15 border-blue-400/40 text-blue-400' : 'bg-white/5 border-neutral-800 text-neutral-500')}
                    >
                      Brak ustalonej daty / Wkrótce
                    </button>
                    <button
                      onClick={() => setSettingsForm({ ...settingsForm, is_tbd: false })}
                      className={cn('flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border active:scale-95', !settingsForm.is_tbd ? 'bg-emerald-400/15 border-emerald-400/40 text-emerald-400' : 'bg-white/5 border-neutral-800 text-neutral-500')}
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
                    <input className={inp} value={settingsForm.title} onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Podtytuł / opis</label>
                    <input className={inp} value={settingsForm.subtitle} onChange={(e) => setSettingsForm({ ...settingsForm, subtitle: e.target.value })} />
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
          onClick={() => { setView('products'); setForm(EMPTY_BOOT_FORM); setEditingId(null); }}
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
