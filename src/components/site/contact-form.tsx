"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Send, X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { ENQUIRE_EVENT, type EnquireDetail } from "./client-helpers";
import { whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/ui/icon";
import { useLocationSearch } from "@/lib/hooks";

type Props = {
  serviceOptions: string[];
  budgetOptions: string[];
  referralOptions: string[];
  successMessage: string;
  whatsappNumber: string;
  whatsappMessage: string;
};

export function ContactForm({ serviceOptions, budgetOptions, referralOptions, successMessage, whatsappNumber, whatsappMessage }: Props) {
  // Prefill from ?service= / ?project= (links from other pages); user edits override it.
  const search = useLocationSearch();
  const params = new URLSearchParams(search);
  const [serviceOverride, setService] = useState<string | null>(null);
  const [projectOverride, setProject] = useState<string | null>(null);
  const service = serviceOverride ?? (params.get("service") ?? "").slice(0, 120);
  const project = projectOverride ?? (params.get("project") ?? "").slice(0, 160);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const startedAt = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    const onEnquire = (e: Event) => {
      const d = (e as CustomEvent<EnquireDetail>).detail;
      if (d.service) setService(d.service);
      if (d.project) setProject(d.project);
      setStatus("idle");
      window.setTimeout(() => formRef.current?.querySelector<HTMLInputElement>("input[name=name]")?.focus({ preventScroll: true }), 700);
    };
    window.addEventListener(ENQUIRE_EVENT, onEnquire);
    return () => window.removeEventListener(ENQUIRE_EVENT, onEnquire);
  }, []);

  const allServices = service && !serviceOptions.includes(service) ? [service, ...serviceOptions] : serviceOptions;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;
    const errs: Record<string, string> = {};
    if (!data.name?.trim()) errs.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? "")) errs.email = "Please enter a valid email address.";
    if ((data.message ?? "").trim().length < 10) errs.message = "Please describe your project (at least 10 characters).";
    setErrors(errs);
    if (Object.keys(errs).length) {
      formRef.current?.querySelector<HTMLElement>(`[name=${Object.keys(errs)[0]}]`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, project, elapsed: Date.now() - startedAt.current }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "We couldn't send your enquiry. Please try again.");
      setStatus("sent");
      toast(successMessage, "success");
      formRef.current?.reset();
      setService("");
      setProject("");
    } catch (err) {
      setStatus("idle");
      toast(err instanceof Error ? err.message : "Something went wrong.", "error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center" role="status">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand/15 text-brand">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h3 className="mt-6 font-display text-2xl font-semibold text-white">Enquiry received</h3>
        <p className="mt-3 max-w-md text-white/65">{successMessage}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={whatsappLink(whatsappNumber, whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <WhatsAppIcon className="h-4 w-4" /> Continue on WhatsApp
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => setStatus("idle")}>
            Send another enquiry
          </button>
        </div>
      </div>
    );
  }

  const err = (name: string) =>
    errors[name] ? (
      <p id={`${name}-error`} className="mt-1.5 text-xs text-red-400">
        {errors[name]}
      </p>
    ) : null;
  const aria = (name: string) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur sm:p-8"
      aria-label="Project enquiry form"
    >
      {project && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm">
          <span>
            <span className="text-white/60">Enquiring about: </span>
            <strong className="text-white">{project}</strong>
          </span>
          <button type="button" onClick={() => setProject("")} aria-label="Remove project reference" className="text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="field-label">
            Name <span className="text-brand">*</span>
          </label>
          <input id="c-name" name="name" autoComplete="name" required maxLength={120} className="field" {...aria("name")} />
          {err("name")}
        </div>
        <div>
          <label htmlFor="c-email" className="field-label">
            Email <span className="text-brand">*</span>
          </label>
          <input id="c-email" name="email" type="email" autoComplete="email" required maxLength={200} className="field" {...aria("email")} />
          {err("email")}
        </div>
        <div>
          <label htmlFor="c-phone" className="field-label">
            Phone
          </label>
          <input id="c-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} className="field" />
        </div>
        <div>
          <label htmlFor="c-service" className="field-label">
            Service required
          </label>
          <select id="c-service" name="service" className="field" value={service} onChange={(e) => setService(e.target.value)}>
            <option value="">Select a service</option>
            {allServices.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-date" className="field-label">
            Preferred date
          </label>
          <input id="c-date" name="preferredDate" type="date" className="field [color-scheme:dark]" />
        </div>
        <div>
          <label htmlFor="c-budget" className="field-label">
            Budget range
          </label>
          <select id="c-budget" name="budget" className="field" defaultValue="">
            <option value="">Select a range</option>
            {budgetOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-message" className="field-label">
            Project description <span className="text-brand">*</span>
          </label>
          <textarea
            id="c-message"
            name="message"
            rows={5}
            required
            maxLength={4000}
            placeholder="Tell us about the occasion, location, number of days, and the story you want to tell…"
            className="field resize-y"
            {...aria("message")}
          />
          {err("message")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-referral" className="field-label">
            How did you hear about us?
          </label>
          <select id="c-referral" name="referral" className="field" defaultValue="">
            <option value="">Select an option</option>
            {referralOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {/* Honeypot — hidden from people, tempting for bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="c-website">Website</label>
          <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
      </div>
      <div className="mt-7 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/45">We only use your details to respond to this enquiry.</p>
        <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
          {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          {status === "sending" ? "Sending…" : "Send project enquiry"}
        </button>
      </div>
    </form>
  );
}
