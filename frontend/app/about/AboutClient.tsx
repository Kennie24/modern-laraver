"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Target,
  Eye,
  ShieldCheck,
  Truck,
  Award,
  HeartHandshake,
  Users,
} from "lucide-react";
import type { AboutData, TeamMember } from "./page";

const STATS = [
  { value: "3", label: "Locations" },
  { value: "10K+", label: "Products" },
  { value: "50K+", label: "Happy Customers" },
  { value: "10+", label: "Years of Service" },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Quality Guaranteed",
    body: "Every product we stock is sourced from verified manufacturers and comes with a full warranty.",
  },
  {
    icon: HeartHandshake,
    title: "Customer First",
    body: "We build lasting relationships with our customers through honest advice and after-sales support.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    body: "Same-day and next-day delivery available across Kampala and major towns in Uganda.",
  },
  {
    icon: Award,
    title: "Best Prices",
    body: "We work directly with brands to offer competitive prices without compromising on quality.",
  },
];

export default function AboutClient({ data }: { data: AboutData }) {
  return (
    <main className="min-h-screen bg-white">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-[#111827]">
        {/* Background image if set */}
        {data.hero_image && (
          <div className="absolute inset-0">
            <Image
              src={data.hero_image}
              alt="About Us hero"
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/80 to-transparent" />
          </div>
        )}

        <div className="relative mx-auto w-[98%] px-4 py-16 md:py-24">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-[13px] text-gray-400">
            <Link href="/" className="hover:text-[#f6c400] transition">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">About Us</span>
          </nav>

          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f6c400]/30 bg-[#f6c400]/10 px-4 py-1.5">
              <Users className="h-3.5 w-3.5 text-[#f6c400]" />
              <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#f6c400]">
                Our Story
              </span>
            </div>

            <h1 className="text-[26px] sm:text-[36px] md:text-[52px] font-black leading-tight tracking-tight text-white">
              {data.hero_title}
            </h1>
            <p className="mt-4 text-[17px] font-medium leading-relaxed text-gray-300">
              {data.hero_subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="flex items-center gap-2 rounded-full border border-[#fcd200] bg-[#ffd814] px-6 py-3 text-[14px] font-bold text-[#0f1111] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)] hover:bg-[#f7ca00] transition"
              >
                Get in Touch
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-[14px] font-medium text-white transition hover:bg-white/10"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5">
          <div className="mx-auto w-[98%] px-4">
            <div className="grid grid-cols-2 divide-x divide-y divide-white/10 md:grid-cols-4 md:divide-y-0">
              {STATS.map((s) => (
                <div key={s.label} className="px-6 py-5 text-center">
                  <p className="text-[28px] font-black text-[#f6c400]">{s.value}</p>
                  <p className="mt-0.5 text-[13px] font-medium text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ MISSION & VISION ══════════════════════════════════════════════════ */}
      <section className="w-full bg-[#f7f7f8] py-14">
        <div className="mx-auto w-[98%] px-4">
          <div className="grid gap-6 md:grid-cols-2">

            {/* Mission */}
            <div className="rounded-[18px] border border-[#d5d9d9] bg-white px-8 py-8 shadow-[0_8px_24px_rgba(15,17,17,0.08)]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#114f8f]">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-[22px] font-black text-[#0f1111]">
                {data.mission_title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#565959]">
                {data.mission_body}
              </p>
            </div>

            {/* Vision */}
            <div className="rounded-[18px] border border-[#d5d9d9] bg-white px-8 py-8 shadow-[0_8px_24px_rgba(15,17,17,0.08)]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6c400]">
                <Eye className="h-6 w-6 text-[#0f1111]" />
              </div>
              <h2 className="text-[22px] font-black text-[#0f1111]">
                {data.vision_title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#565959]">
                {data.vision_body}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ══ OUR VALUES ════════════════════════════════════════════════════════ */}
      <section className="w-full bg-white py-14">
        <div className="mx-auto w-[98%] px-4">
          <div className="mb-8 flex items-center gap-4">
            <span className="h-3 w-10 shrink-0 rounded-full bg-[#114f8f]"></span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#565959]">
                What We Stand For
              </p>
              <h2 className="mt-0.5 text-[26px] font-black text-[#0f1111]">Our Values</h2>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-[18px] border border-[#d5d9d9] bg-white p-6 shadow-[0_8px_24px_rgba(15,17,17,0.06)] transition hover:shadow-[0_14px_32px_rgba(15,17,17,0.11)] hover:-translate-y-1"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf0fb]">
                  <v.icon className="h-5 w-5 text-[#114f8f]" />
                </div>
                <h3 className="text-[15px] font-black text-[#0f1111]">{v.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#565959]">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TEAM ══════════════════════════════════════════════════════════════ */}
      {data.team_members.length > 0 && (
        <section className="w-full bg-[#f7f7f8] py-14">
          <div className="mx-auto w-[98%] px-4">
            <div className="mb-8 flex items-center gap-4">
              <span className="h-3 w-10 shrink-0 rounded-full bg-[#f6c400]"></span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#565959]">
                  The People
                </p>
                <h2 className="mt-0.5 text-[26px] font-black text-[#0f1111]">
                  {data.team_heading}
                </h2>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.team_members.map((member: TeamMember) => (
                <TeamCard key={member.name} member={member} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ CTA BANNER ════════════════════════════════════════════════════════ */}
      <section className="w-full bg-[#114f8f] py-14">
        <div className="mx-auto w-[98%] px-4 text-center">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/60">
            Ready to shop?
          </p>
          <h2 className="mt-2 text-[30px] font-black text-white md:text-[36px]">
            Explore Our Full Collection
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[16px] text-white/70">
            Thousands of genuine electronics, spare parts, and accessories — delivered fast across Uganda.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="rounded-full border border-[#fcd200] bg-[#ffd814] px-8 py-3.5 text-[15px] font-bold text-[#0f1111] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)] hover:bg-[#f7ca00] transition"
            >
              Shop Now
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/20 bg-white/10 px-8 py-3.5 text-[15px] font-medium text-white transition hover:bg-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  const initials = member.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#d5d9d9] bg-white shadow-[0_8px_24px_rgba(15,17,17,0.08)] transition hover:shadow-[0_14px_32px_rgba(15,17,17,0.13)] hover:-translate-y-1">
      {member.avatar ? (
        <div className="relative h-52 w-full bg-[#f7f7f8]">
          <Image
            src={member.avatar}
            alt={member.name}
            fill
            className="object-cover object-top"
          />
        </div>
      ) : (
        <div className="flex h-52 w-full items-center justify-center bg-[#eaf0fb]">
          <span className="text-[40px] font-black text-[#114f8f]">{initials}</span>
        </div>
      )}
      <div className="px-5 py-4">
        <p className="text-[15px] font-black text-[#0f1111]">{member.name}</p>
        <p className="mt-0.5 text-[13px] font-medium text-[#007185]">{member.role}</p>
      </div>
    </div>
  );
}
