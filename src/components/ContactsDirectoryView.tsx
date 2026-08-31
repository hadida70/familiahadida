import React, { useState, useMemo } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  Plus,
  Search,
  User,
  Edit2,
  Trash2,
  Copy,
  Check,
  MapPin,
  Navigation,
  Car,
} from 'lucide-react';
import { Contact } from '../types';

interface ContactsDirectoryViewProps {
  contacts: Contact[];
  isAdmin?: boolean;
  onOpenAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
}

export const ContactsDirectoryView: React.FC<ContactsDirectoryViewProps> = ({
  contacts,
  isAdmin = false,
  onOpenAddContact,
  onEditContact,
  onDeleteContact,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Clean phone number for tel:, sms:, and whatsapp links
  const getCleanPhone = (phone: string) => {
    return phone.replace(/[^0-9+]/g, '');
  };

  const getWhatsAppLink = (contact: Contact) => {
    let clean = getCleanPhone(contact.phone);
    if (clean.startsWith('+')) {
      clean = clean.substring(1);
    }
    const greeting = encodeURIComponent(
      `¡Hola ${contact.name}! Te escribo desde la aplicación de la Familia Hadida.`
    );
    return `https://api.whatsapp.com/send?phone=${clean}&text=${greeting}`;
  };

  const filteredContacts = useMemo(() => {
    let list = [...contacts];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => {
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q) || false;
        const matchNotes = c.notes?.toLowerCase().includes(q) || false;
        const matchAddress = c.address?.toLowerCase().includes(q) || false;
        const matchPlace = c.placeName?.toLowerCase().includes(q) || false;
        return matchName || matchPhone || matchEmail || matchNotes || matchAddress || matchPlace;
      });
    }
    // Sort alphabetically by name (A-Z)
    return list.sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base', numeric: true })
    );
  }, [contacts, searchQuery]);

  const handleCopyContact = (contact: Contact) => {
    const text =
      `👤 ${contact.name}\n` +
      `📞 Tel: ${contact.phone}\n` +
      (contact.address ? `📍 Dirección: ${contact.address}\n` : '') +
      (contact.email ? `✉️ Email: ${contact.email}\n` : '') +
      (contact.notes ? `📝 Notas: ${contact.notes}` : '');

    navigator.clipboard.writeText(text);
    setCopiedId(contact.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="contacts-directory-section" className="space-y-4 max-w-4xl mx-auto mb-14">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-600" />
              <span>DIRECTORIO TELEFÓNICO</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Llamadas directas, WhatsApp, SMS, correos electrónicos y direcciones de la familia y allegados.
          </p>
        </div>

        <button
          onClick={onOpenAddContact}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Contacto</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono, dirección, lugar o notas..."
            className="w-full pl-9.5 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Stats Counter */}
      <div className="flex items-center justify-between px-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          Ordenados alfabéticamente (A - Z) • Nombres en color negro
        </span>
        <span>
          {filteredContacts.length} {filteredContacts.length === 1 ? 'contacto' : 'contactos'}
        </span>
      </div>

      {/* Contact Cards List */}
      {filteredContacts.length > 0 ? (
        <div className="space-y-3">
          {filteredContacts.map((contact) => {
            const cleanPhone = getCleanPhone(contact.phone);
            const initials = contact.name
              ? contact.name
                  .split(' ')
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'C';

            const googleMapsUrl = contact.address
              ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address)}`
              : null;

            const wazeUrl = contact.address
              ? `https://waze.com/ul?q=${encodeURIComponent(contact.address)}&navigate=yes`
              : null;

            return (
              <div
                key={contact.id}
                id={`contact-card-${contact.id}`}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:shadow-xs transition-all space-y-3.5"
              >
                {/* Main Row: Avatar + Info + Primary Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                  {/* Left Side: Avatar & Name */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 border border-red-200/50 font-black text-sm sm:text-base shadow-xs">
                      {initials || <User className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Name - strictly black text as requested */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base sm:text-lg font-black text-black leading-tight">
                          {contact.name}
                        </h4>
                        {contact.placeName && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {contact.placeName}
                          </span>
                        )}
                      </div>

                      {/* Phone & Email */}
                      <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-slate-600 dark:text-slate-400 mt-1">
                        <div className="flex items-center gap-1.5 text-black font-extrabold">
                          <Phone className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="font-mono text-xs sm:text-sm tracking-wide">{contact.phone}</span>
                        </div>

                        {contact.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[220px]">{contact.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Communication Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                    {/* Call */}
                    <a
                      href={`tel:${cleanPhone}`}
                      className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-emerald-800 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                      title={`Llamar a ${contact.name}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    {/* WhatsApp */}
                    <a
                      href={getWhatsAppLink(contact)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-green-600 hover:bg-green-600 hover:text-white border border-green-200 dark:border-green-800 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                      title={`Abrir WhatsApp con ${contact.name}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    {/* SMS */}
                    <a
                      href={`sms:${cleanPhone}`}
                      className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                      title={`Enviar SMS a ${contact.name}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>

                    {/* Copy Info */}
                    <button
                      onClick={() => handleCopyContact(contact)}
                      className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                      title="Copiar datos del contacto"
                    >
                      {copiedId === contact.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Edit and Delete (Admin Only) */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => onEditContact(contact)}
                          className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                          title="Editar contacto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteContact(contact.id)}
                          className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                          title="Eliminar contacto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Sub-Section: Address and Navigation Boxes */}
                {contact.address && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-start gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span className="break-words">
                          {contact.address}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {googleMapsUrl && (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          title="Cómo llegar con Google Maps"
                        >
                          <Navigation className="w-3.5 h-3.5 text-red-600" />
                          <span>Google Maps</span>
                        </a>
                      )}

                      {wazeUrl && (
                        <a
                          href={wazeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          title="Navegar con Waze"
                        >
                          <Car className="w-3.5 h-3.5 text-blue-500" />
                          <span>Waze</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {contact.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    📝 {contact.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No se encontraron contactos para &quot;{searchQuery}&quot;
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
          >
            Limpiar Búsqueda
          </button>
        </div>
      )}
    </div>
  );
};

