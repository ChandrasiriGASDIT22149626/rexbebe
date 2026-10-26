'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Building2,
  Navigation as NavigationIcon,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { fetchApi } from '../../services/api';

interface SubmissionSuccess {
  referenceId: string;
  receivedAt: string;
  recipient: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    hp_code: '', // Anti-spam honeypot
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<SubmissionSuccess | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneClean = formData.phone.replace(/[^\d+]/g, '');

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = 'Please enter your full name (at least 2 characters).';
    }
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formData.phone.trim() || phoneClean.length < 7) {
      errors.phone = 'Please enter a valid phone number with at least 7 digits.';
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 3) {
      errors.subject = 'Please provide an inquiry subject.';
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errors.message = 'Please write a message with at least 10 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Spam honeypot check
    if (formData.hp_code.trim()) {
      setErrorMessage('Spam activity detected. Your message was not processed.');
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchApi<SubmissionSuccess>('/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setSubmitSuccess(response);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        hp_code: '',
      });
      setValidationErrors({});
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setErrorMessage(
        err.message ||
          'Failed to send message. Please verify your connection or contact our team directly via WhatsApp at 0760162181.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp quick text generator
  const getWhatsAppMessageUrl = () => {
    const text = encodeURIComponent(
      `Hello REXBEBE / Classen Holdings,\nI would like to enquire regarding: ${formData.subject || 'Customer Enquiry'}\nName: ${formData.fullName || 'Customer'}`
    );
    return `https://wa.me/94760162181?text=${text}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/60 dark:bg-slate-950 text-stone-900 dark:text-stone-100 antialiased selection:bg-pink-100 selection:text-pink-900">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-14 sm:py-20 bg-gradient-to-b from-[#FAF7F2] via-pink-50/25 to-stone-50/60 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950 border-b border-stone-200/60 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-6">
              <Link href="/" className="hover:text-pink-600 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-stone-900 dark:text-stone-200 font-bold">Contact Us</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Headline */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-pink-200/80 dark:border-pink-900/50 text-pink-700 dark:text-pink-300 text-xs font-extrabold tracking-wider uppercase shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                  <span>Concierge &amp; Customer Care</span>
                </div>

                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                  We’re Here for Every Question &amp; Little Moment
                </h1>

                <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                  Whether you have questions regarding sizing, gift orders, delivery status, or corporate
                  partnerships with <strong className="font-semibold text-stone-900 dark:text-white">Classen Holdings</strong>,
                  our concierge team is ready to assist you promptly.
                </p>

                {/* Direct Contact Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="https://wa.me/94760162181"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp: 0760162181</span>
                  </a>

                  <a
                    href="tel:0332315777"
                    className="inline-flex items-center space-x-2 px-5 py-3 rounded-full bg-white dark:bg-slate-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-slate-700 text-xs font-extrabold uppercase tracking-wider hover:bg-stone-100 dark:hover:bg-slate-700 transition-all shadow-xs hover:scale-105 active:scale-95"
                  >
                    <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Call 033 2315777</span>
                  </a>

                  <a
                    href="mailto:info@classen.lk"
                    className="inline-flex items-center space-x-2 px-5 py-3 rounded-full bg-white dark:bg-slate-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-slate-700 text-xs font-extrabold uppercase tracking-wider hover:bg-stone-100 dark:hover:bg-slate-700 transition-all shadow-xs hover:scale-105 active:scale-95"
                  >
                    <Mail className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                    <span>info@classen.lk</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Hero Visual Concierge Lounge Image */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-[4/3] sm:aspect-[16/11]">
                  <Image
                    src="/images/contact-hero.jpg"
                    alt="REXBEBE Concierge and Customer Care Lounge"
                    fill
                    priority
                    className="object-cover object-center transform transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-white/60 dark:border-slate-700 shadow-lg">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Concierge Desk Active</span>
                    </p>
                    <p className="text-xs font-medium text-stone-700 dark:text-stone-300 mt-0.5">
                      Classen Holdings &amp; REXBEBE boutique customer care team.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 CONTACT DETAILS CARDS */}
        <section className="py-12 bg-white dark:bg-slate-900 border-b border-stone-200/60 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: WhatsApp / Mobile */}
              <div className="p-6 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 space-y-3 relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 fill-emerald-500/20" />
                </div>
                <h3 className="font-heading text-sm font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                  WhatsApp &amp; Direct Mobile
                </h3>
                <div className="space-y-1">
                  <a
                    href="tel:0760162181"
                    className="text-lg font-black text-emerald-950 dark:text-white hover:text-emerald-600 transition-colors block"
                  >
                    0760162181
                  </a>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-400">
                    Fast response for customer inquiries, sizing advice &amp; orders.
                  </p>
                </div>
                <a
                  href="https://wa.me/94760162181"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 transition-colors"
                >
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Card 2: Company Telephone */}
              <div className="p-6 rounded-3xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50 space-y-3 relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-sm font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                  Telephone Lines
                </h3>
                <div className="space-y-1">
                  <a
                    href="tel:0332315777"
                    className="text-lg font-black text-purple-950 dark:text-white hover:text-purple-600 transition-colors block"
                  >
                    033 2315777
                  </a>
                  <p className="text-xs text-purple-800/80 dark:text-purple-400 font-medium">
                    Additional:{' '}
                    <a href="tel:0772303334" className="hover:underline">077 2303334</a>
                    {' / '}
                    <a href="tel:0703540988" className="hover:underline">070 3540988</a>
                  </p>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1">
                  Classen Holdings Corporate Line
                </p>
              </div>

              {/* Card 3: Email Support */}
              <div className="p-6 rounded-3xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200/80 dark:border-pink-800/50 space-y-3 relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-900/60 text-pink-600 dark:text-pink-300 flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-sm font-extrabold uppercase tracking-wider text-pink-900 dark:text-pink-300">
                  Email Enquiries
                </h3>
                <div className="space-y-1">
                  <a
                    href="mailto:info@classen.lk"
                    className="text-base sm:text-lg font-black text-pink-950 dark:text-white hover:text-pink-600 transition-colors block truncate"
                    title="info@classen.lk"
                  >
                    info@classen.lk
                  </a>
                  <p className="text-xs text-pink-800/80 dark:text-pink-400">
                    Official correspondence for REXBEBE &amp; Classen Holdings.
                  </p>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1">
                  Average response: &lt; 24 hours
                </p>
              </div>

              {/* Card 4: Corporate Address */}
              <div className="p-6 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 space-y-3 relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-sm font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Head Office Address
                </h3>
                <div className="space-y-0.5 text-xs text-stone-700 dark:text-stone-300">
                  <p className="font-bold text-stone-900 dark:text-white">Classen Holdings</p>
                  <p>62B, Meniklanda,</p>
                  <p>Pepiliyawala, Sri Lanka</p>
                </div>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=62B,+Meniklanda,+Pepiliyawala,+Sri+Lanka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 transition-colors"
                >
                  <span>Get Directions</span>
                  <NavigationIcon className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: CONTACT FORM & INTERACTIVE GOOGLE MAP */}
        <section className="py-16 sm:py-24 bg-stone-50/60 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
              
              {/* LEFT COLUMN (COL 1-7): CONTACT FORM */}
              <div className="lg:col-span-7">
                <div className="bg-white dark:bg-slate-900 rounded-4xl p-6 sm:p-10 border border-stone-200/80 dark:border-slate-800 shadow-xl space-y-6">
                  
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-pink-600 dark:text-pink-400 block mb-1">
                      Send a Message
                    </span>
                    <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
                      How Can We Help You Today?
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 font-normal">
                      Fill out the form below. Messages are recorded securely in our store management system and sent
                      directly to the store management team.
                    </p>
                  </div>

                  {/* SUCCESS ALERT */}
                  {submitSuccess && (
                    <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 space-y-3 animate-in fade-in">
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                            Enquiry Received Successfully!
                          </p>
                          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                            Thank you! Your message has been safely delivered to our store management team at{' '}
                            <strong>{submitSuccess.recipient}</strong>. We have logged your request and our concierge
                            will reply promptly.
                          </p>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono pt-1">
                            Reference ID: <span className="font-bold">{submitSuccess.referenceId}</span>
                          </p>
                        </div>
                      </div>

                      {/* Direct WhatsApp Forward Button */}
                      <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70 flex flex-wrap items-center gap-3">
                        <a
                          href={getWhatsAppMessageUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          <span>Forward copy to WhatsApp (0760162181)</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setSubmitSuccess(null)}
                          className="text-xs text-emerald-800 dark:text-emerald-300 hover:underline font-semibold"
                        >
                          Send another message
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ERROR ALERT */}
                  {errorMessage && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 flex items-start space-x-3 text-xs text-rose-800 dark:text-rose-200">
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <p className="font-bold">Message Submission Error</p>
                        <p>{errorMessage}</p>
                        <div className="pt-2">
                          <a
                            href="https://wa.me/94760162181"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-xs font-bold text-rose-900 dark:text-rose-100 underline"
                          >
                            <span>Reach us immediately on WhatsApp (0760162181)</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FORM FIELDS */}
                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {/* Anti-spam honeypot (hidden from human users) */}
                    <div className="hidden" aria-hidden="true">
                      <label htmlFor="hp_code">Do not fill this field</label>
                      <input
                        type="text"
                        id="hp_code"
                        name="hp_code"
                        value={formData.hp_code}
                        onChange={handleChange}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    {/* Field 1: Full Name */}
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                      >
                        Full Name <span className="text-pink-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. Amanda Silva"
                        required
                        className={`w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.fullName
                            ? 'border-rose-400 focus:ring-rose-400/30'
                            : 'border-stone-200 dark:border-slate-700 focus:ring-pink-400/30 focus:border-pink-500'
                        }`}
                      />
                      {validationErrors.fullName && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{validationErrors.fullName}</p>
                      )}
                    </div>

                    {/* Field 2 & 3: Email Address and Phone Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                        >
                          Email Address <span className="text-pink-600">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="name@example.com"
                          required
                          className={`w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 transition-all ${
                            validationErrors.email
                              ? 'border-rose-400 focus:ring-rose-400/30'
                              : 'border-stone-200 dark:border-slate-700 focus:ring-pink-400/30 focus:border-pink-500'
                          }`}
                        />
                        {validationErrors.email && (
                          <p className="text-[11px] text-rose-600 mt-1 font-medium">{validationErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                        >
                          Phone Number <span className="text-pink-600">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="e.g. 0760162181 or +94 77..."
                          required
                          className={`w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 transition-all ${
                            validationErrors.phone
                              ? 'border-rose-400 focus:ring-rose-400/30'
                              : 'border-stone-200 dark:border-slate-700 focus:ring-pink-400/30 focus:border-pink-500'
                          }`}
                        />
                        {validationErrors.phone && (
                          <p className="text-[11px] text-rose-600 mt-1 font-medium">{validationErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Field 4: Subject */}
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                      >
                        Subject <span className="text-pink-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="e.g. Sizing Consultation / Order Inquiry / Corporate Enquiry"
                        required
                        className={`w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.subject
                            ? 'border-rose-400 focus:ring-rose-400/30'
                            : 'border-stone-200 dark:border-slate-700 focus:ring-pink-400/30 focus:border-pink-500'
                        }`}
                      />
                      {validationErrors.subject && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{validationErrors.subject}</p>
                      )}
                    </div>

                    {/* Field 5: Message */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                      >
                        Message <span className="text-pink-600">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Write your message or inquiry here..."
                        required
                        className={`w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 transition-all resize-y ${
                          validationErrors.message
                            ? 'border-rose-400 focus:ring-rose-400/30'
                            : 'border-stone-200 dark:border-slate-700 focus:ring-pink-400/30 focus:border-pink-500'
                        }`}
                      />
                      {validationErrors.message && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{validationErrors.message}</p>
                      )}
                    </div>

                    {/* Submit Message Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-950 to-stone-900 hover:from-purple-900 hover:to-stone-800 text-white font-extrabold uppercase tracking-wider text-xs sm:text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Delivering Message...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Message</span>
                          <Send className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  </form>

                </div>
              </div>

              {/* RIGHT COLUMN (COL 8-12): INTERACTIVE GOOGLE MAP & LOCATION */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Location Map Card */}
                <div className="bg-white dark:bg-slate-900 rounded-4xl p-6 border border-stone-200/80 dark:border-slate-800 shadow-xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 block">
                        Interactive Location Map
                      </span>
                      <h3 className="font-heading text-lg font-extrabold text-stone-900 dark:text-white">
                        Classen Holdings Headquarters
                      </h3>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Address Summary */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-700/70 text-xs text-stone-700 dark:text-stone-300 space-y-1">
                    <p className="font-bold text-stone-900 dark:text-white">Classen Holdings</p>
                    <p>62B, Meniklanda, Pepiliyawala, Sri Lanka</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Parent company &amp; central operations for REXBEBE babywear.
                    </p>
                  </div>

                  {/* Interactive Google Map Embed */}
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-slate-700 shadow-inner aspect-[4/3] bg-stone-100 dark:bg-slate-800">
                    <iframe
                      title="Classen Holdings Location Map - 62B Meniklanda, Pepiliyawala, Sri Lanka"
                      src="https://maps.google.com/maps?q=62B,+Meniklanda,+Pepiliyawala,+Sri+Lanka&t=&z=15&ie=UTF8&iwloc=&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>

                  {/* Get Directions Link Button */}
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=62B,+Meniklanda,+Pepiliyawala,+Sri+Lanka"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-extrabold uppercase tracking-wider transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2"
                  >
                    <NavigationIcon className="w-4 h-4" />
                    <span>Get Directions to Pepiliyawala</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Operating Hours & Fast Response Card */}
                <div className="bg-gradient-to-br from-pink-50/70 via-purple-50/70 to-sky-50/70 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl p-6 border border-stone-200/80 dark:border-slate-700/80 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading text-sm font-bold text-stone-900 dark:text-white">
                        Customer Service Hours
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300">
                        Monday – Saturday: 9:00 AM – 6:00 PM (IST)
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    Online orders on REXBEBE are accepted 24/7. Inquiries submitted outside business hours are answered
                    first thing the following morning.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
