"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

type ContactData = {
  hero_title: string;
  hero_subtitle: string;
  address: string;
  phone: string;
  email: string;
  map_embed_url: string;
  working_hours: string;
  social_links: { platform: string; url: string }[];
};

const LOCATIONS = [
  {
    area: "Bombo Road",
    detail: "Equatorial Mall — Shop No. 1, Bombo Road, Kampala",
    phone: "+256 700 000 001",
    mapSrc:
      "https://maps.google.com/maps?q=Equatorial+Mall+Bombo+Road+Kampala+Uganda&t=&z=16&ie=UTF8&iwloc=&output=embed",
  },
  {
    area: "Kampala Road",
    detail: "Kampala Road, Kampala",
    phone: "+256 700 000 002",
    mapSrc:
      "https://maps.google.com/maps?q=Kampala+Road+Kampala+Uganda&t=&z=16&ie=UTF8&iwloc=&output=embed",
  },
  {
    area: "Lugogo",
    detail: "Lugogo Bypass, Kampala",
    phone: "+256 700 000 003",
    mapSrc:
      "https://maps.google.com/maps?q=Lugogo+Mall+Kampala+Uganda&t=&z=16&ie=UTF8&iwloc=&output=embed",
  },
];

export default function ContactClient({ data }: { data: ContactData }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const json = (await res.json()) as { message?: string };
        throw new Error(json.message ?? "Failed to send message.");
      }
      setStatus("success");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <main className="min-h-screen bg-white">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-[#111827]">
        <div className="mx-auto w-[98%] px-4 py-16 md:py-20">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-[13px] text-gray-400">
            <Link href="/" className="hover:text-[#f6c400] transition">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Contact Us</span>
          </nav>

          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f6c400]/30 bg-[#f6c400]/10 px-4 py-1.5">
              <Mail className="h-3.5 w-3.5 text-[#f6c400]" />
              <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#f6c400]">
                Get in Touch
              </span>
            </div>

            <h1 className="text-[26px] sm:text-[36px] md:text-[52px] font-black leading-tight tracking-tight text-white">
              {data.hero_title}
            </h1>
            <p className="mt-4 text-[17px] font-medium leading-relaxed text-gray-300">
              {data.hero_subtitle}
            </p>

            {/* Quick contact chips */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`tel:${data.phone}`}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[14px] font-medium text-white transition hover:border-[#f6c400]/40 hover:bg-white/10"
              >
                <Phone className="h-4 w-4 text-[#f6c400]" />
                {data.phone}
              </a>
              <a
                href={`mailto:${data.email}`}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[14px] font-medium text-white transition hover:border-[#f6c400]/40 hover:bg-white/10"
              >
                <Mail className="h-4 w-4 text-[#f6c400]" />
                {data.email}
              </a>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[14px] font-medium text-white">
                <Clock className="h-4 w-4 text-[#f6c400]" />
                {data.working_hours}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FORM + INFO ════════════════════════════════════════════════════════ */}
      <section className="w-full bg-[#f7f7f8] py-12">
        <div className="mx-auto w-[98%] px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1fr_1.4fr]">

            {/* Left — info card */}
            <div className="rounded-[18px] border border-[#d5d9d9] bg-white px-7 py-7 shadow-[0_8px_24px_rgba(15,17,17,0.08)]">
              <h2 className="text-[22px] font-black text-[#0f1111]">Contact Information</h2>
              <p className="mt-2 text-[14px] text-[#565959]">
                Reach out through any channel below and we will respond promptly.
              </p>

              <div className="mt-7 space-y-6">
                <InfoRow icon={MapPin} label="Head Office">
                  {data.address}
                </InfoRow>
                <InfoRow icon={Phone} label="Phone">
                  <a href={`tel:${data.phone}`} className="text-[#007185] hover:underline">
                    {data.phone}
                  </a>
                </InfoRow>
                <InfoRow icon={Mail} label="Email">
                  <a href={`mailto:${data.email}`} className="text-[#007185] hover:underline">
                    {data.email}
                  </a>
                </InfoRow>
                <InfoRow icon={Clock} label="Working Hours">
                  {data.working_hours}
                </InfoRow>
              </div>
            </div>

            {/* Right — form card */}
            <div className="rounded-[18px] border border-[#d5d9d9] bg-white px-7 py-7 shadow-[0_8px_24px_rgba(15,17,17,0.08)]">
              <h2 className="text-[22px] font-black text-[#0f1111]">Send Us a Message</h2>
              <p className="mt-2 text-[14px] text-[#565959]">
                Fill in the form and our team will get back to you as soon as possible.
              </p>

              {status === "success" ? (
                <div className="mt-8 flex flex-col items-center gap-4 py-10 text-center">
                  <CheckCircle className="h-14 w-14 text-[#067d62]" />
                  <p className="text-[20px] font-bold text-[#0f1111]">Message Sent!</p>
                  <p className="text-[14px] text-[#565959]">
                    Thank you for reaching out. We will get back to you shortly.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-1 rounded-full border border-[#d5d9d9] bg-[#f7fafa] px-6 py-2.5 text-[14px] font-medium text-[#0f1111] hover:bg-[#eef3f3]"
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {status === "error" && (
                    <div className="flex items-start gap-2 rounded-xl border border-[#f5c6cb] bg-[#fff5f5] px-4 py-3 text-[13px] text-[#b12704]">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      label="Full Name *"
                      type="text"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={(v) => setForm({ ...form, name: v })}
                      icon={<User size={16} className="text-[#565959]" />}
                      required
                    />
                    <InputField
                      label="Email *"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(v) => setForm({ ...form, email: v })}
                      icon={<Mail size={16} className="text-[#565959]" />}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      label="Phone"
                      type="tel"
                      placeholder="+256 7XX XXX XXX"
                      value={form.phone}
                      onChange={(v) => setForm({ ...form, phone: v })}
                      icon={<Phone size={16} className="text-[#565959]" />}
                    />
                    <InputField
                      label="Subject"
                      type="text"
                      placeholder="How can we help?"
                      value={form.subject}
                      onChange={(v) => setForm({ ...form, subject: v })}
                      icon={<MessageSquare size={16} className="text-[#565959]" />}
                    />
                  </div>

                  <div>
                    <span className="mb-1 block text-[13px] font-bold text-[#0f1111]">
                      Message *
                    </span>
                    <textarea
                      required
                      rows={5}
                      placeholder="Write your message here…"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full resize-none rounded-xl border border-[#a6a6a6] px-4 py-3 text-[15px] text-[#0f1111] shadow-[inset_0_1px_2px_rgba(15,17,17,0.08)] outline-none placeholder:text-[#8a8f98] focus:border-[#007185]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[#fcd200] bg-[#ffd814] px-4 py-3 text-[14px] font-medium text-[#0f1111] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)] hover:bg-[#f7ca00] disabled:opacity-60"
                  >
                    {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : null}
                    {status === "loading" ? "Sending…" : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ OUR LOCATIONS ═════════════════════════════════════════════════════ */}
      <section className="w-full bg-white py-12">
        <div className="mx-auto w-[98%] px-4">
          {/* Section heading */}
          <div className="mb-8 flex items-center gap-4">
            <span className="h-3 w-10 shrink-0 rounded-full bg-[#114f8f]"></span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#565959]">
                Find Us
              </p>
              <h2 className="mt-0.5 text-[26px] font-black text-[#0f1111]">Our Locations</h2>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {LOCATIONS.map((loc) => (
              <div
                key={loc.area}
                className="overflow-hidden rounded-[18px] border border-[#d5d9d9] bg-white shadow-[0_8px_24px_rgba(15,17,17,0.08)] transition hover:shadow-[0_14px_32px_rgba(15,17,17,0.13)]"
              >
                {/* Map */}
                <div className="h-[220px] w-full">
                  <iframe
                    src={loc.mapSrc}
                    className="h-full w-full"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map — Modern Electronics ${loc.area}`}
                  />
                </div>

                {/* Info */}
                <div className="px-5 py-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#007185]">
                    {loc.area}
                  </p>
                  <p className="mt-0.5 text-[17px] font-bold text-[#0f1111]">
                    Modern Electronics
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-start gap-2.5 text-[13px] text-[#565959]">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#565959]" />
                      <span>{loc.detail}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px]">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-[#565959]" />
                      <a href={`tel:${loc.phone}`} className="text-[#007185] hover:underline">
                        {loc.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px]">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-[#565959]" />
                      <a href="mailto:info@e-modern.ug" className="text-[#007185] hover:underline">
                        info@e-modern.ug
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}

/* ── Sub-components ── */

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d5d9d9] bg-[#f7fafa]">
        <Icon className="h-4 w-4 text-[#565959]" />
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-wide text-[#565959]">{label}</p>
        <p className="mt-0.5 text-[14px] text-[#0f1111]">{children}</p>
      </div>
    </div>
  );
}

function InputField({
  label,
  type,
  placeholder,
  value,
  onChange,
  icon,
  required,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-bold text-[#0f1111]">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border border-[#a6a6a6] px-3 py-3 shadow-[inset_0_1px_2px_rgba(15,17,17,0.08)] focus-within:border-[#007185]">
        {icon}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full bg-transparent text-[15px] text-[#0f1111] outline-none placeholder:text-[#8a8f98]"
        />
      </div>
    </label>
  );
}
