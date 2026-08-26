import React, { useState, useEffect } from 'react';
import { SavedAddress, UserProfile } from '../types';
import { getSavedAddresses, saveAddress, deleteSavedAddress, setDefaultAddress, subscribeToAddresses } from '../addresses';
import { MapPin, Plus, Trash2, Check, Home, Briefcase, Car, Tag } from 'lucide-react';

interface SavedAddressesManagerProps {
  userProfile?: UserProfile | null;
  onSelectAddress: (addr: SavedAddress) => void;
  selectedAddressId?: string | null;
}

export const SavedAddressesManager: React.FC<SavedAddressesManagerProps> = ({
  userProfile,
  onSelectAddress,
  selectedAddressId,
}) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>(getSavedAddresses(userProfile?.uid));
  const [showAddForm, setShowAddForm] = useState(false);

  const [labelInput, setLabelInput] = useState('Home');
  const [nameInput, setNameInput] = useState(userProfile?.name || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [addressLineInput, setAddressLineInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [stateInput, setStateInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState('');

  useEffect(() => {
    setAddresses(getSavedAddresses(userProfile?.uid));
    const unsub = subscribeToAddresses((all) => {
      setAddresses(getSavedAddresses(userProfile?.uid));
    });
    return () => unsub();
  }, [userProfile?.uid]);

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !phoneInput.trim() || !addressLineInput.trim()) return;

    const fullAddrString = `${addressLineInput.trim()}${cityInput.trim() ? `, ${cityInput.trim()}` : ''}${stateInput.trim() ? `, ${stateInput.trim()}` : ''}${pincodeInput.trim() ? ` - ${pincodeInput.trim()}` : ''}`;

    const newSaved = saveAddress({
      userId: userProfile?.uid,
      label: labelInput,
      fullName: nameInput.trim(),
      phone: phoneInput.trim(),
      addressLine: addressLineInput.trim(),
      city: cityInput.trim(),
      state: stateInput.trim(),
      pincode: pincodeInput.trim(),
      isDefault: addresses.length === 0,
    });

    onSelectAddress(newSaved);
    setShowAddForm(false);
    setAddressLineInput('');
    setCityInput('');
    setStateInput('');
    setPincodeInput('');
  };

  const getLabelIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('home')) return <Home className="w-3.5 h-3.5" />;
    if (lower.includes('work') || lower.includes('office')) return <Briefcase className="w-3.5 h-3.5" />;
    return <Car className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-2.5 font-mono text-xs text-left">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase text-zinc-600 font-bold flex items-center gap-1">
          <MapPin className="w-3 h-3 text-red-600" />
          <span>Saved Delivery Addresses ({addresses.length})</span>
        </label>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
        >
          {showAddForm ? 'Cancel' : '+ Add New Address'}
        </button>
      </div>

      {/* Address Selector Pills */}
      {addresses.length > 0 && !showAddForm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <div
                key={addr.id}
                onClick={() => onSelectAddress(addr)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-red-50 border-red-500 ring-2 ring-red-200 shadow-xs'
                    : 'bg-white hover:bg-zinc-50 border-zinc-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-bold text-[11px] text-zinc-900">
                      {getLabelIcon(addr.label)}
                      <span>{addr.label}</span>
                    </span>
                    {isSelected && (
                      <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-zinc-900 text-xs truncate">
                    {addr.fullName} • {addr.phone}
                  </div>
                  <div className="text-[10px] text-zinc-500 line-clamp-2 leading-tight font-sans">
                    {addr.addressLine}{addr.city ? `, ${addr.city}` : ''}{addr.pincode ? ` - ${addr.pincode}` : ''}
                  </div>
                </div>

                <div className="pt-2 mt-1 border-t border-zinc-100 flex items-center justify-between text-[10px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAddress(addr);
                    }}
                    className="text-red-600 font-bold hover:underline"
                  >
                    Use This
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedAddress(addr.id);
                    }}
                    className="text-zinc-400 hover:text-red-600 p-0.5"
                    title="Delete address"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Address Form Modal/Panel */}
      {showAddForm && (
        <form onSubmit={handleSaveNew} className="bg-zinc-50 border border-zinc-300 rounded-xl p-3 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800">
            <span>Add New Shipping Address</span>
            <div className="flex gap-1">
              {['Home', 'Office', 'Garage'].map((lbl) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setLabelInput(lbl)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition ${
                    labelInput === lbl ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-300 text-zinc-600'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Full Name"
              className="bg-white border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
            />
            <input
              type="tel"
              required
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="10-digit Phone"
              className="bg-white border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
            />
          </div>

          <textarea
            required
            rows={2}
            value={addressLineInput}
            onChange={(e) => setAddressLineInput(e.target.value)}
            placeholder="Flat/House No, Building, Street, Area"
            className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
          />

          <div className="grid grid-cols-3 gap-1.5">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="City"
              className="bg-white border border-zinc-300 rounded-lg p-1.5 text-xs text-zinc-900"
            />
            <input
              type="text"
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value)}
              placeholder="State"
              className="bg-white border border-zinc-300 rounded-lg p-1.5 text-xs text-zinc-900"
            />
            <input
              type="text"
              value={pincodeInput}
              onChange={(e) => setPincodeInput(e.target.value)}
              placeholder="Pincode"
              className="bg-white border border-zinc-300 rounded-lg p-1.5 text-xs text-zinc-900"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Save & Select Address
          </button>
        </form>
      )}
    </div>
  );
};
