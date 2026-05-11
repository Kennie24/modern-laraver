"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, Mail, Phone, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { login, signup } from "@/lib/auth";

type AuthModalDetail = {
  mode?: "login" | "register";
  redirect?: string;
  tab?: "login" | "signup";
};

const DEFAULT_REDIRECT = "/user";

export default function AuthOverlay() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [redirect, setRedirect] = useState(DEFAULT_REDIRECT);
  const [tab, setTab] = useState<"login" | "signup">("login");

  // login fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // signup-only fields
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmitLogin = (phone.trim().length > 0 || email.trim().length > 0) && password.length >= 8;
  const canSubmitSignup = fullName.trim().length > 0 && phone.trim().length > 0 && password.length >= 8 && confirmPassword.length > 0;

  const resetState = useCallback(() => {
    setPassword("");
    setConfirmPassword("");
    setError("");
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setBusy(false);
    setPassword("");
    setConfirmPassword("");
    setError("");
    window.dispatchEvent(new Event("auth:modal-close"));
  }, []);

  function switchTab(next: "login" | "signup") {
    setTab(next);
    setError("");
  }

  useEffect(() => {
    const openModal = (detail?: AuthModalDetail) => {
      setRedirect(detail?.redirect || DEFAULT_REDIRECT);
      setTab(detail?.tab || (detail?.mode === "register" ? "signup" : "login"));
      setIsOpen(true);
      resetState();
    };

    const handleModalOpen = (event: Event) => {
      const customEvent = event as CustomEvent<AuthModalDetail>;
      openModal(customEvent.detail);
    };

    const handleLegacyOpen = () => openModal();
    const handleClose = () => closeModal();

    window.addEventListener("auth:modal-open", handleModalOpen as EventListener);
    window.addEventListener("auth:open-overlay", handleLegacyOpen as EventListener);
    window.addEventListener("auth:close-overlay", handleClose);

    return () => {
      window.removeEventListener("auth:modal-open", handleModalOpen as EventListener);
      window.removeEventListener("auth:open-overlay", handleLegacyOpen as EventListener);
      window.removeEventListener("auth:close-overlay", handleClose);
    };
  }, [closeModal, resetState]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeModal, isOpen]);

  const loginRef = useRef(false);
  async function submitLogin() {
    if (loginRef.current) return;
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    loginRef.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await login(email.trim() || phone, password);
      if (!result.ok) { setError(result.error); return; }
      closeModal();
      router.push(redirect);
    } catch {
      setError("Failed to sign in.");
    } finally {
      setBusy(false);
      loginRef.current = false;
    }
  }

  async function submitSignup() {
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!phone.trim()) { setError("Phone number is required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setBusy(true);
    setError("");
    try {
      const result = await signup(fullName.trim(), email.trim(), phone.trim(), password);
      if (!result.ok) { setError(result.error); return; }
      closeModal();
      router.push(redirect);
    } catch {
      setError("Failed to create account.");
    } finally {
      setBusy(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4">
      <button type="button" aria-label="Close" onClick={closeModal} className="absolute inset-0" />

      <div className="relative w-full sm:max-w-[440px] rounded-t-[20px] sm:rounded-[20px] border border-[#d5d9d9] bg-white shadow-[0_-4px_24px_rgba(15,17,17,0.18)] sm:shadow-[0_18px_40px_rgba(15,17,17,0.28)] max-h-[92dvh] overflow-y-auto">
        {/* Close */}
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#565959] hover:bg-[#f3f3f3]"
        >
          <X size={18} />
        </button>

        {/* Drag handle — mobile only */}
        <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-[#d5d9d9] sm:hidden" />

        {/* Tabs */}
        <div className="flex overflow-hidden border-b border-[#eaeded]">
          <button
            type="button"
            onClick={() => switchTab("login")}
            className={`flex-1 py-3.5 text-[13px] sm:text-[14px] font-semibold transition-colors ${
              tab === "login"
                ? "border-b-2 border-[#007185] text-[#007185] bg-white"
                : "text-[#565959] hover:bg-[#f7fafa]"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchTab("signup")}
            className={`flex-1 py-3.5 text-[13px] sm:text-[14px] font-semibold transition-colors ${
              tab === "signup"
                ? "border-b-2 border-[#007185] text-[#007185] bg-white"
                : "text-[#565959] hover:bg-[#f7fafa]"
            }`}
          >
            Create account
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-6">
          {tab === "login" ? (
            <div className="space-y-3">
              <p className="text-[12px] sm:text-[13px] leading-5 text-[#565959]">
                Sign in with your email or phone and password.
              </p>
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<Mail size={16} className="text-[#565959]" />} type="email" />
              <Field label="Phone number" value={phone} onChange={v => setPhone(v.replace(/[^\d+]/g, ""))} placeholder="+256..." icon={<Phone size={16} className="text-[#565959]" />} type="tel" />
              <Field label="Password" value={password} onChange={setPassword} placeholder="Min. 8 characters" icon={<Lock size={16} className="text-[#565959]" />} type="password" />

              {error ? <p className="text-[13px] text-[#b12704]">{error}</p> : null}

              <button
                type="button"
                disabled={busy || !canSubmitLogin}
                onClick={() => void submitLogin()}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#fcd200] bg-[#ffd814] px-4 py-3 text-[14px] font-medium text-[#0f1111] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)] hover:bg-[#f7ca00] disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                Sign in
              </button>

              <p className="text-center text-[12px] sm:text-[13px] text-[#565959]">
                New here?{" "}
                <button type="button" onClick={() => switchTab("signup")} className="font-semibold text-[#007185] underline">
                  Create an account
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[12px] sm:text-[13px] leading-5 text-[#565959]">
                Create a free account to shop, track orders, and save items.
              </p>
              <Field label="Full name" value={fullName} onChange={setFullName} placeholder="John Doe" icon={<User size={16} className="text-[#565959]" />} />
              <Field label="Email (optional)" value={email} onChange={setEmail} placeholder="you@example.com" icon={<Mail size={16} className="text-[#565959]" />} type="email" />
              <Field label="Phone number" value={phone} onChange={v => setPhone(v.replace(/[^\d+]/g, ""))} placeholder="+256..." icon={<Phone size={16} className="text-[#565959]" />} type="tel" />
              <Field label="Password" value={password} onChange={setPassword} placeholder="Min. 8 characters" icon={<Lock size={16} className="text-[#565959]" />} type="password" />
              <Field label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat your password" icon={<Lock size={16} className="text-[#565959]" />} type="password" />

              {error ? <p className="text-[13px] text-[#b12704]">{error}</p> : null}

              <button
                type="button"
                disabled={busy || !canSubmitSignup}
                onClick={() => void submitSignup()}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#fcd200] bg-[#ffd814] px-4 py-3 text-[14px] font-medium text-[#0f1111] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)] hover:bg-[#f7ca00] disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                Create account
              </button>

              <p className="text-center text-[12px] sm:text-[13px] text-[#565959]">
                Already have an account?{" "}
                <button type="button" onClick={() => switchTab("login")} className="font-semibold text-[#007185] underline">
                  Sign in
                </button>
              </p>
            </div>
          )}

          <div className="mt-4 border-t border-[#eaeded] pt-3 pb-safe text-[11px] sm:text-[12px] text-[#565959]">
            By continuing, you agree to our Terms of Service and Privacy Policy.{" "}
            <Link href={tab === "signup" ? "/register" : "/login"} className="hover:underline">
              Open on full page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, icon, type = "tel" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ReactNode; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] sm:text-[13px] font-bold text-[#0f1111]">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-[#a6a6a6] px-3 py-2.5 shadow-[inset_0_1px_2px_rgba(15,17,17,0.06)] focus-within:border-[#007185]">
        {icon}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : type === "tel" ? "tel" : "on"}
          className="w-full bg-transparent text-[16px] text-[#0f1111] outline-none placeholder:text-[#8a8f98]"
        />
      </div>
    </label>
  );
}
