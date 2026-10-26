'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings2,
  Truck,
  DollarSign,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  ShieldAlert,
  Percent,
  MapPin,
  RefreshCw,
  ArrowRight,
  ArrowRightLeft,
  X,
  Edit2,
  Info,
  Building,
  HelpCircle,
  Check,
  Eye,
} from 'lucide-react';
import { AdminSidebar } from '../../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../../components/layout/AdminHeader';
import {
  deliveryService,
  DeliverySettingsData,
  DeliveryZone,
  UnsupportedAddressPolicy,
  SRI_LANKA_DISTRICTS,
  CourierProviderConfig,
} from '../../../../services/deliveryService';
import { formatCurrency } from '../../../../utils/formatCurrency';

export default function AdminDeliverySettingsPage() {
  const [settings, setSettings] = useState<DeliverySettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active section tab
  const [activeTab, setActiveTab] = useState<'ZONES' | 'POLICY' | 'SIMULATOR' | 'GENERAL'>('ZONES');

  // Search & Filter
  const [townSearch, setTownSearch] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('ALL');

  // Inline Add Town state: map of zoneId -> new town input string
  const [newTownInputs, setNewTownInputs] = useState<Record<string, string>>({});

  // Modals state
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [isEditZoneModalOpen, setIsEditZoneModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedZoneForEdit, setSelectedZoneForEdit] = useState<DeliveryZone | null>(null);

  // New Zone Form
  const [newZoneForm, setNewZoneForm] = useState<{
    name: string;
    code: string;
    district: string;
    deliveryFee: number;
    returnFee: number;
    estimatedDays: string;
    description: string;
    townsText: string;
  }>({
    name: '',
    code: '',
    district: 'Gampaha',
    deliveryFee: 450,
    returnFee: 300,
    estimatedDays: '1–2 Business Days',
    description: '',
    townsText: '',
  });

  // Reassign Town Form
  const [reassignForm, setReassignForm] = useState({
    town: '',
    fromZoneId: '',
    toZoneId: '',
  });

  // Simulator / Test Calculator State
  const [simDistrict, setSimDistrict] = useState('Gampaha');
  const [simTown, setSimTown] = useState('');
  const [simResult, setSimResult] = useState<{
    matchedZone: DeliveryZone | null;
    isUnmapped: boolean;
    requiresReview: boolean;
    notice?: string;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await deliveryService.getSettings();
      setSettings(data);
    } catch (e) {
      showToast('Failed to load delivery settings from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const updated = await deliveryService.updateSettings(settings);
      setSettings(updated);
      showToast('Delivery zones and settings updated successfully! 🚀');
    } catch (e: any) {
      showToast(e.message || 'Failed to update delivery settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Zone active
  const toggleZoneActive = (zoneId: string) => {
    if (!settings?.deliveryZones) return;
    const updatedZones = settings.deliveryZones.map((z) =>
      z.id === zoneId ? { ...z, active: !z.active } : z
    );
    setSettings({ ...settings, deliveryZones: updatedZones });
  };

  // Update zone field directly in settings
  const updateZoneField = (zoneId: string, field: keyof DeliveryZone, val: any) => {
    if (!settings?.deliveryZones) return;
    const updatedZones = settings.deliveryZones.map((z) =>
      z.id === zoneId ? { ...z, [field]: val } : z
    );
    setSettings({ ...settings, deliveryZones: updatedZones });
  };

  // Inline Add Town to a Zone
  const handleInlineAddTown = async (zoneId: string) => {
    const townName = (newTownInputs[zoneId] || '').trim();
    if (!townName) return;

    try {
      const updatedZone = await deliveryService.addTownToZone(zoneId, townName);
      if (settings?.deliveryZones) {
        setSettings({
          ...settings,
          deliveryZones: settings.deliveryZones.map((z) =>
            z.id === zoneId ? updatedZone : { ...z, towns: z.towns.filter((t) => t.toLowerCase() !== townName.toLowerCase()) }
          ),
        });
      }
      setNewTownInputs({ ...newTownInputs, [zoneId]: '' });
      showToast(`Town "${townName}" added to zone!`);
    } catch (e: any) {
      showToast(e.message || 'Failed to add town.');
    }
  };

  // Remove Town from a Zone
  const handleRemoveTown = async (zoneId: string, townName: string) => {
    try {
      const updatedZone = await deliveryService.removeTownFromZone(zoneId, townName);
      if (settings?.deliveryZones) {
        setSettings({
          ...settings,
          deliveryZones: settings.deliveryZones.map((z) =>
            z.id === zoneId ? updatedZone : z
          ),
        });
      }
      showToast(`Town "${townName}" removed from zone.`);
    } catch (e: any) {
      showToast(e.message || 'Failed to remove town.');
    }
  };

  // Create New Delivery Zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneForm.name.trim()) {
      showToast('Zone name is required.');
      return;
    }

    try {
      const townsArray = newZoneForm.townsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await deliveryService.createZone({
        name: newZoneForm.name.trim(),
        code: newZoneForm.code.trim() || newZoneForm.name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        district: newZoneForm.district,
        deliveryFee: Number(newZoneForm.deliveryFee),
        returnFee: Number(newZoneForm.returnFee),
        estimatedDays: newZoneForm.estimatedDays,
        description: newZoneForm.description,
        towns: townsArray,
        active: true,
      });

      if (settings) {
        setSettings({
          ...settings,
          deliveryZones: [...(settings.deliveryZones || []), created],
        });
      }
      setIsAddZoneModalOpen(false);
      setNewZoneForm({
        name: '',
        code: '',
        district: 'Gampaha',
        deliveryFee: 450,
        returnFee: 300,
        estimatedDays: '1–2 Business Days',
        description: '',
        townsText: '',
      });
      showToast(`Delivery Zone "${created.name}" created successfully! 🎉`);
    } catch (e: any) {
      showToast(e.message || 'Failed to create zone.');
    }
  };

  // Open Edit Zone Modal
  const handleOpenEditZone = (zone: DeliveryZone) => {
    setSelectedZoneForEdit({ ...zone });
    setIsEditZoneModalOpen(true);
  };

  // Save Edited Zone
  const handleSaveEditZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZoneForEdit) return;

    try {
      const updated = await deliveryService.updateZone(selectedZoneForEdit.id, selectedZoneForEdit);
      if (settings?.deliveryZones) {
        setSettings({
          ...settings,
          deliveryZones: settings.deliveryZones.map((z) =>
            z.id === updated.id ? updated : z
          ),
        });
      }
      setIsEditZoneModalOpen(false);
      showToast(`Zone "${updated.name}" updated successfully!`);
    } catch (e: any) {
      showToast(e.message || 'Failed to update zone.');
    }
  };

  // Delete Zone
  const handleDeleteZone = async (zoneId: string, zoneName: string) => {
    if (!confirm(`Are you sure you want to delete delivery zone "${zoneName}"?`)) return;

    try {
      await deliveryService.deleteZone(zoneId);
      if (settings?.deliveryZones) {
        setSettings({
          ...settings,
          deliveryZones: settings.deliveryZones.filter((z) => z.id !== zoneId),
        });
      }
      showToast(`Zone "${zoneName}" deleted.`);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete zone.');
    }
  };

  // Open Reassign Town Modal
  const handleOpenReassignModal = (town?: string, fromZoneId?: string) => {
    setReassignForm({
      town: town || '',
      fromZoneId: fromZoneId || settings?.deliveryZones?.[0]?.id || '',
      toZoneId: settings?.deliveryZones?.[1]?.id || '',
    });
    setIsReassignModalOpen(true);
  };

  // Execute Reassign Town
  const handleReassignTownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignForm.town.trim() || !reassignForm.fromZoneId || !reassignForm.toZoneId) {
      showToast('Please fill all town re-assignment fields.');
      return;
    }
    if (reassignForm.fromZoneId === reassignForm.toZoneId) {
      showToast('Origin zone and destination zone must be different.');
      return;
    }

    try {
      const result = await deliveryService.reassignTown(
        reassignForm.town.trim(),
        reassignForm.fromZoneId,
        reassignForm.toZoneId
      );

      if (settings?.deliveryZones) {
        setSettings({
          ...settings,
          deliveryZones: settings.deliveryZones.map((z) => {
            if (z.id === result.fromZone.id) return result.fromZone;
            if (z.id === result.toZone.id) return result.toZone;
            return z;
          }),
        });
      }
      setIsReassignModalOpen(false);
      showToast(`Town "${reassignForm.town}" reassigned to "${result.toZone.name}"!`);
    } catch (e: any) {
      showToast(e.message || 'Failed to reassign town.');
    }
  };

  // Test / Simulate Town Zone Resolution
  const handleSimulate = async () => {
    if (!simTown.trim()) {
      showToast('Please type a town name to test zone matching.');
      return;
    }
    setIsSimulating(true);
    try {
      const res = await deliveryService.lookupZone(simDistrict, simTown.trim());
      setSimResult(res);
    } catch (e: any) {
      showToast(e.message || 'Lookup failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Filtered zones based on district filter
  const filteredZones = useMemo(() => {
    if (!settings?.deliveryZones) return [];
    return settings.deliveryZones.filter((z) => {
      const matchDistrict =
        selectedDistrictFilter === 'ALL' ||
        z.district.toLowerCase() === selectedDistrictFilter.toLowerCase() ||
        (selectedDistrictFilter === 'OTHER' && z.district !== 'Gampaha');

      const matchTown =
        !townSearch.trim() ||
        z.name.toLowerCase().includes(townSearch.toLowerCase()) ||
        z.towns.some((t) => t.toLowerCase().includes(townSearch.toLowerCase()));

      return matchDistrict && matchTown;
    });
  }, [settings?.deliveryZones, selectedDistrictFilter, townSearch]);

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Delivery Zones & Charges"
          subtitle="Configure regional delivery zones, town mappings, islandwide shipping rates, and policies for unsupported addresses."
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Rates Disclaimer Banner */}
          <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start space-x-3 text-amber-900 text-xs shadow-2xs">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Initial Configuration Values Notice</p>
              <p className="text-amber-800 leading-relaxed">
                The rates configured below (<strong>Nearby towns in Gampaha District: LKR 400</strong>,{' '}
                <strong>Other towns in Gampaha District: LKR 450</strong>, <strong>Outstation: LKR 500</strong>) are initial configuration values supplied by the business, not verified official Koombiyo merchant rates.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-stone-500 font-bold flex items-center justify-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
              <span>Loading delivery zones &amp; configurations...</span>
            </div>
          ) : settings ? (
            <>
              {/* Action Bar & Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ZONES')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      activeTab === 'ZONES'
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Delivery Zones ({settings.deliveryZones?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('POLICY')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      activeTab === 'POLICY'
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Unsupported Address Policy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('SIMULATOR')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      activeTab === 'SIMULATOR'
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Town Rate Sandbox</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('GENERAL')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      activeTab === 'GENERAL'
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>General &amp; Couriers</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenReassignModal()}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    title="Correct town assignment"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
                    <span>Move Town</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddZoneModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Zone</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: DELIVERY ZONES */}
              {activeTab === 'ZONES' && (
                <div className="space-y-6">
                  {/* Filter Toolbar */}
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2 flex-1 max-w-md">
                      <div className="relative w-full">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Search zone or town name..."
                          value={townSearch}
                          onChange={(e) => setTownSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-500">Filter:</span>
                      <select
                        value={selectedDistrictFilter}
                        onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800"
                      >
                        <option value="ALL">All Zones ({settings.deliveryZones?.length || 0})</option>
                        <option value="Gampaha">Gampaha District Zones</option>
                        <option value="OTHER">Outstation &amp; Other Districts</option>
                      </select>
                    </div>
                  </div>

                  {/* Zones Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredZones.map((zone) => (
                      <div
                        key={zone.id}
                        className={`bg-white rounded-3xl border transition-all overflow-hidden flex flex-col shadow-2xs ${
                          zone.active
                            ? 'border-stone-200/90'
                            : 'border-stone-200 bg-stone-50/50 opacity-70'
                        }`}
                      >
                        {/* Zone Header */}
                        <div className="p-5 border-b border-stone-100 flex items-start justify-between bg-stone-50/40">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-serif text-base font-bold text-stone-900">{zone.name}</h4>
                              {zone.isInitialRate && (
                                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                  Initial Business Rate
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 font-mono">
                              Code: <strong>{zone.code}</strong> • District: <strong>{zone.district}</strong>
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditZone(zone)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                              title="Edit Zone Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleZoneActive(zone.id)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border ${
                                zone.active
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-stone-200 text-stone-600 border-stone-300'
                              }`}
                            >
                              {zone.active ? 'Active' : 'Disabled'}
                            </button>
                          </div>
                        </div>

                        {/* Zone Fee Configuration */}
                        <div className="p-5 border-b border-stone-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-stone-50/20">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                              Delivery Fee (LKR)
                            </label>
                            <input
                              type="number"
                              value={zone.deliveryFee}
                              onChange={(e) =>
                                updateZoneField(zone.id, 'deliveryFee', parseInt(e.target.value) || 0)
                              }
                              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 font-black text-stone-900 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                              Return Fee (LKR)
                            </label>
                            <input
                              type="number"
                              value={zone.returnFee}
                              onChange={(e) =>
                                updateZoneField(zone.id, 'returnFee', parseInt(e.target.value) || 0)
                              }
                              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 font-bold text-stone-900 bg-white"
                            />
                          </div>

                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                              Transit Time
                            </label>
                            <input
                              type="text"
                              value={zone.estimatedDays}
                              onChange={(e) => updateZoneField(zone.id, 'estimatedDays', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-stone-900 bg-white"
                            />
                          </div>
                        </div>

                        {/* Assigned Towns Management */}
                        <div className="p-5 flex-1 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-stone-800">
                              Assigned Towns ({zone.towns.length})
                            </span>
                            <span className="text-[10px] text-stone-400">
                              Click &times; to remove town
                            </span>
                          </div>

                          {/* Town tags / chips */}
                          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 border border-stone-100 rounded-2xl bg-stone-50/30">
                            {zone.towns.length === 0 ? (
                              <p className="text-xs text-stone-400 italic p-2">
                                No towns assigned yet. Add towns below.
                              </p>
                            ) : (
                              zone.towns.map((town) => (
                                <span
                                  key={town}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-white text-stone-800 border border-stone-200 shadow-3xs group hover:border-amber-300"
                                >
                                  <span>{town}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTown(zone.id, town)}
                                    className="p-0.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors"
                                    title={`Remove ${town}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>

                          {/* Inline Add Town Form */}
                          <div className="flex items-center space-x-2 pt-2">
                            <input
                              type="text"
                              placeholder="Add town name..."
                              value={newTownInputs[zone.id] || ''}
                              onChange={(e) =>
                                setNewTownInputs({ ...newTownInputs, [zone.id]: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleInlineAddTown(zone.id);
                                }
                              }}
                              className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleInlineAddTown(zone.id)}
                              className="px-3 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>

                        {/* Zone Footer */}
                        {zone.description && (
                          <div className="px-5 py-2.5 bg-stone-50/60 border-t border-stone-100 text-[10px] text-stone-500 italic">
                            {zone.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: UNSUPPORTED ADDRESS POLICY */}
              {activeTab === 'POLICY' && (
                <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-6 max-w-4xl">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center space-x-2">
                      <ShieldAlert className="w-5 h-5 text-amber-700" />
                      <span>Delivery Policy for Unsupported Addresses</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Determine how REXBEBE handles customer addresses with towns not mapped to any pre-configured delivery zone.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Policy Option 1: Require Review (Recommended) */}
                    <label
                      className={`p-4 rounded-2xl border transition-all cursor-pointer block ${
                        settings.unsupportedAddressPolicy === 'REQUIRE_REVIEW'
                          ? 'border-amber-700 bg-amber-50/30 shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name="unsupportedPolicy"
                          value="REQUIRE_REVIEW"
                          checked={settings.unsupportedAddressPolicy === 'REQUIRE_REVIEW'}
                          onChange={() =>
                            setSettings({
                              ...settings,
                              unsupportedAddressPolicy: 'REQUIRE_REVIEW',
                            })
                          }
                          className="mt-0.5 text-amber-800 focus:ring-amber-500"
                        />
                        <div className="space-y-1">
                          <span className="font-bold text-stone-900 text-sm flex items-center space-x-2">
                            <span>Request Concierge Review (Strict Requirement)</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900">
                              Recommended
                            </span>
                          </span>
                          <p className="text-stone-600 leading-relaxed">
                            Do not guess town mappings. If a town has no configured zone, the system flags the order for administrator concierge review instead of applying an arbitrary fee. Delivery fee is kept transparent and confirmed by phone prior to warehouse handoff.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Policy Option 2: Block Checkout */}
                    <label
                      className={`p-4 rounded-2xl border transition-all cursor-pointer block ${
                        settings.unsupportedAddressPolicy === 'BLOCK_CHECKOUT'
                          ? 'border-amber-700 bg-amber-50/30 shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name="unsupportedPolicy"
                          value="BLOCK_CHECKOUT"
                          checked={settings.unsupportedAddressPolicy === 'BLOCK_CHECKOUT'}
                          onChange={() =>
                            setSettings({
                              ...settings,
                              unsupportedAddressPolicy: 'BLOCK_CHECKOUT',
                            })
                          }
                          className="mt-0.5 text-amber-800 focus:ring-amber-500"
                        />
                        <div className="space-y-1">
                          <span className="font-bold text-stone-900 text-sm">
                            Block Checkout for Unmapped Towns
                          </span>
                          <p className="text-stone-600 leading-relaxed">
                            Prevent customers from placing orders if their town is not in a configured delivery zone, instructing them to pick a recognized nearby hub or contact support.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Customer Notice Text */}
                    <div className="pt-4 border-t border-stone-100 space-y-2">
                      <label className="block font-bold text-stone-800">
                        Notice Displayed to Customers when Town is Unmapped:
                      </label>
                      <textarea
                        rows={3}
                        value={settings.unsupportedAddressNotice}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            unsupportedAddressNotice: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Policy</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: TOWN RATE SIMULATOR / SANDBOX */}
              {activeTab === 'SIMULATOR' && (
                <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-6 max-w-4xl">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center space-x-2">
                      <Search className="w-5 h-5 text-amber-700" />
                      <span>Delivery Zone &amp; Fee Sandbox</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Test how the logistics engine resolves any Sri Lankan address without placing an actual order.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-stone-700 font-bold mb-1">
                        Select District
                      </label>
                      <select
                        value={simDistrict}
                        onChange={(e) => setSimDistrict(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900"
                      >
                        {SRI_LANKA_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d} District
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-bold mb-1">
                        Enter Town Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Wattala, Minuwangoda, Kandy, or any town..."
                        value={simTown}
                        onChange={(e) => setSimTown(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSimulate();
                          }
                        }}
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleSimulate}
                      disabled={isSimulating}
                      className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>{isSimulating ? 'Evaluating...' : 'Test Zone Resolution'}</span>
                    </button>

                    {/* Quick test buttons */}
                    <span className="text-[10px] text-stone-400 font-bold">Quick test:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSimDistrict('Gampaha');
                        setSimTown('Wattala');
                      }}
                      className="text-[10px] underline text-stone-600 hover:text-amber-800 font-medium"
                    >
                      Wattala (Gampaha Nearby)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimDistrict('Gampaha');
                        setSimTown('Minuwangoda');
                      }}
                      className="text-[10px] underline text-stone-600 hover:text-amber-800 font-medium"
                    >
                      Minuwangoda (Gampaha Other)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimDistrict('Kandy');
                        setSimTown('Kandy');
                      }}
                      className="text-[10px] underline text-stone-600 hover:text-amber-800 font-medium"
                    >
                      Kandy (Outstation)
                    </button>
                  </div>

                  {/* Simulator Results */}
                  {simResult && (
                    <div className="pt-4 border-t border-stone-100">
                      {simResult.matchedZone ? (
                        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                          <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Zone Match Found!</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Zone Name</span>
                              <span className="font-black text-stone-900">{simResult.matchedZone.name}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Delivery Charge</span>
                              <span className="font-black text-stone-900">LKR {simResult.matchedZone.deliveryFee}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Return Fee</span>
                              <span className="font-bold text-stone-900">LKR {simResult.matchedZone.returnFee}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Transit Time</span>
                              <span className="font-bold text-stone-900">{simResult.matchedZone.estimatedDays}</span>
                            </div>
                          </div>
                        </div>
                      ) : simResult.isUnmapped ? (
                        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-3">
                          <div className="flex items-center space-x-2 text-amber-800 font-bold">
                            <AlertCircle className="w-4 h-4 text-amber-700" />
                            <span>Town Unmapped — Concierge Review Triggered</span>
                          </div>
                          <p className="text-amber-900 leading-relaxed">
                            Town &ldquo;{simTown}&rdquo; has no configured delivery zone. Per store policy, the delivery fee is set to <strong>Pending Review</strong> instead of applying an arbitrary guess.
                          </p>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenReassignModal(simTown, undefined);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Assign &ldquo;{simTown}&rdquo; to a Zone Now</span>
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: GENERAL SETTINGS & COURIERS */}
              {activeTab === 'GENERAL' && (
                <div className="space-y-6">
                  {/* General Pricing Rules Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Default Delivery Fee */}
                    <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
                      <div className="flex items-center space-x-2 text-stone-700">
                        <Truck className="w-5 h-5 text-amber-600" />
                        <h4 className="font-bold text-sm">Default Delivery Fee</h4>
                      </div>
                      <p className="text-xs text-stone-500">
                        Fallback charge applied when address has no matched zone.
                      </p>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-stone-400">LKR</span>
                        <input
                          type="number"
                          value={settings.defaultDeliveryFee}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              defaultDeliveryFee: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full pl-12 pr-4 py-2 rounded-xl border border-stone-200 text-sm font-black text-stone-900 bg-stone-50 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Free Delivery Threshold */}
                    <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
                      <div className="flex items-center space-x-2 text-stone-700">
                        <Percent className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-bold text-sm">Free Delivery Threshold</h4>
                      </div>
                      <p className="text-xs text-stone-500">
                        Orders with subtotal at or above this receive free standard delivery.
                      </p>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-stone-400">LKR</span>
                        <input
                          type="number"
                          value={settings.freeDeliveryThreshold}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              freeDeliveryThreshold: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full pl-12 pr-4 py-2 rounded-xl border border-stone-200 text-sm font-black text-stone-900 bg-stone-50 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* COD Handling Fee */}
                    <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
                      <div className="flex items-center space-x-2 text-stone-700">
                        <DollarSign className="w-5 h-5 text-amber-700" />
                        <h4 className="font-bold text-sm">COD Handling Fee</h4>
                      </div>
                      <p className="text-xs text-stone-500">
                        Extra fee added for Cash on Delivery (set to 0 for Free COD handling).
                      </p>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-stone-400">LKR</span>
                        <input
                          type="number"
                          value={settings.codHandlingFee}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              codHandlingFee: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full pl-12 pr-4 py-2 rounded-xl border border-stone-200 text-sm font-black text-stone-900 bg-stone-50 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Couriers Integration List */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
                    <h4 className="font-bold text-sm text-stone-900">Supported Courier Partners (Sri Lanka)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {settings.activeCouriers.map((courier) => (
                        <div
                          key={courier.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            courier.active
                              ? 'border-amber-300 bg-amber-50/20 shadow-2xs'
                              : 'border-stone-200 bg-stone-50/50 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-black text-stone-900 text-sm">{courier.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                courier.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {courier.active ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-stone-500 truncate mb-1">
                            Code: <strong>{courier.code}</strong> • {courier.contactPhone || 'No contact'}
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono truncate">
                            Tracking: {courier.trackingUrlPattern}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD DELIVERY ZONE */}
      {/* ========================================================= */}
      {isAddZoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateZone}
            className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Add Delivery Zone
                </h3>
                <p className="text-xs text-stone-500">Configure new regional shipping rates and towns</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddZoneModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Zone Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Express Zone"
                  value={newZoneForm.name}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-bold focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newZoneForm.district}
                    onChange={(e) => setNewZoneForm({ ...newZoneForm, district: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold"
                  >
                    <option value="Gampaha">Gampaha</option>
                    <option value="Outstation">Outstation (All Other)</option>
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Delivery Fee (LKR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newZoneForm.deliveryFee}
                    onChange={(e) =>
                      setNewZoneForm({ ...newZoneForm, deliveryFee: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-black text-stone-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Return Fee (LKR)
                  </label>
                  <input
                    type="number"
                    value={newZoneForm.returnFee}
                    onChange={(e) =>
                      setNewZoneForm({ ...newZoneForm, returnFee: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Estimated Transit Days
                  </label>
                  <input
                    type="text"
                    value={newZoneForm.estimatedDays}
                    onChange={(e) =>
                      setNewZoneForm({ ...newZoneForm, estimatedDays: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Initial Towns (Comma-separated)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. TownA, TownB, TownC..."
                  value={newZoneForm.townsText}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, townsText: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAddZoneModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-xs"
              >
                Create Zone
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT DELIVERY ZONE */}
      {/* ========================================================= */}
      {isEditZoneModalOpen && selectedZoneForEdit && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveEditZone}
            className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Edit Zone: {selectedZoneForEdit.name}
                </h3>
                <p className="text-xs text-stone-500">Update zone name, charges, and transit timing</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditZoneModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Zone Name
                </label>
                <input
                  type="text"
                  value={selectedZoneForEdit.name}
                  onChange={(e) =>
                    setSelectedZoneForEdit({ ...selectedZoneForEdit, name: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Delivery Fee (LKR)
                  </label>
                  <input
                    type="number"
                    value={selectedZoneForEdit.deliveryFee}
                    onChange={(e) =>
                      setSelectedZoneForEdit({
                        ...selectedZoneForEdit,
                        deliveryFee: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-black text-stone-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Return Fee (LKR)
                  </label>
                  <input
                    type="number"
                    value={selectedZoneForEdit.returnFee}
                    onChange={(e) =>
                      setSelectedZoneForEdit({
                        ...selectedZoneForEdit,
                        returnFee: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Estimated Transit Time
                </label>
                <input
                  type="text"
                  value={selectedZoneForEdit.estimatedDays}
                  onChange={(e) =>
                    setSelectedZoneForEdit({
                      ...selectedZoneForEdit,
                      estimatedDays: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Description / Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={selectedZoneForEdit.description || ''}
                  onChange={(e) =>
                    setSelectedZoneForEdit({
                      ...selectedZoneForEdit,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-stone-100">
              {!selectedZoneForEdit.isInitialRate ? (
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteZone(selectedZoneForEdit.id, selectedZoneForEdit.name)
                  }
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Zone</span>
                </button>
              ) : (
                <span className="text-[10px] text-stone-400 italic">Initial Zone (Cannot be deleted)</span>
              )}

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditZoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CORRECT TOWN ASSIGNMENT / REASSIGN TOWN */}
      {/* ========================================================= */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <form
            onSubmit={handleReassignTownSubmit}
            className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center space-x-2">
                  <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                  <span>Correct Town Assignment</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Move a town from its current zone to another zone (e.g. from Other Gampaha to Nearby Gampaha)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReassignModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Town Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Negombo or Wattala"
                  value={reassignForm.town}
                  onChange={(e) => setReassignForm({ ...reassignForm, town: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Origin Zone (Move From)
                </label>
                <select
                  value={reassignForm.fromZoneId}
                  onChange={(e) => setReassignForm({ ...reassignForm, fromZoneId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold"
                  required
                >
                  {settings?.deliveryZones?.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} (LKR {z.deliveryFee})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Destination Zone (Move To) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reassignForm.toZoneId}
                  onChange={(e) => setReassignForm({ ...reassignForm, toZoneId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-amber-900"
                  required
                >
                  {settings?.deliveryZones?.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} (LKR {z.deliveryFee})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsReassignModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-xs"
              >
                Move Town
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
