"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Star } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { FEEDBACK_EVENT } from "./client-helpers";
import { prepareImageForUpload } from "@/lib/client-image";
import { cn } from "@/lib/utils";

export function FeedbackDialog({ serviceOptions, successMessage }: { serviceOptions: string[]; successMessage: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [photoName, setPhotoName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const openedAt = useRef(0);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setStatus("idle");
      setErrors({});
      openedAt.current = Date.now();
    };
    window.addEventListener(FEEDBACK_EVENT, onOpen);
    return () => window.removeEventListener(FEEDBACK_EVENT, onOpen);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const errs: Record<string, string> = {};
    if (!String(fd.get("name") ?? "").trim()) errs.name = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(fd.get("email") ?? ""))) errs.email = "Please enter a valid email.";
    if (String(fd.get("message") ?? "").trim().length < 10) errs.message = "Please write at least a sentence (10+ characters).";
    if (!fd.get("consent")) errs.consent = "Please confirm consent so we can display your testimonial.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    fd.set("rating", String(rating));
    fd.set("elapsed", String(Date.now() - openedAt.current));
    const photo = fd.get("photo");
    if (photo instanceof File && photo.size > 0) fd.set("photo", await prepareImageForUpload(photo, 800, 0.85));
    else fd.delete("photo");

    setStatus("sending");
    try {
      const res = await fetch("/api/public/feedback", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "We couldn't submit your feedback. Please try again.");
      setStatus("sent");
      form.reset();
      setRating(5);
      setPhotoName("");
    } catch (err) {
      setStatus("idle");
      toast(err instanceof Error ? err.message : "Something went wrong.", "error");
    }
  }

  const err = (n: string) => (errors[n] ? <p id={`fb-${n}-error`} className="mt-1.5 text-xs text-red-400">{errors[n]}</p> : null);
  const aria = (n: string) => ({ "aria-invalid": errors[n] ? true : undefined, "aria-describedby": errors[n] ? `fb-${n}-error` : undefined });

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Share your experience">
      {status === "sent" ? (
        <div className="flex flex-col items-center px-8 pt-6 pb-12 text-center" role="status">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand/15 text-brand">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </span>
          <p className="mt-6 max-w-sm text-lg text-white">{successMessage}</p>
          <button type="button" className="btn btn-primary mt-8" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="px-6 pt-2 pb-7">
          <p className="mb-6 text-sm text-white/60">
            Tell future clients what it was like working with MIDE MEDIA PRODUCTION. Every testimonial is reviewed before it is published.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="fb-name">Full name <span className="text-brand">*</span></label>
              <input id="fb-name" name="name" className="field" maxLength={120} autoComplete="name" {...aria("name")} />
              {err("name")}
            </div>
            <div>
              <label className="field-label" htmlFor="fb-email">Email <span className="text-brand">*</span></label>
              <input id="fb-email" name="email" type="email" className="field" maxLength={200} autoComplete="email" {...aria("email")} />
              {err("email")}
            </div>
            <div>
              <label className="field-label" htmlFor="fb-phone">Phone number</label>
              <input id="fb-phone" name="phone" type="tel" className="field" maxLength={30} autoComplete="tel" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="fb-service">Service used</label>
              <select id="fb-service" name="service" className="field" defaultValue="">
                <option value="">Select a service</option>
                {serviceOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <fieldset className="sm:col-span-2">
              <legend className="field-label">Rating</legend>
              <div className="flex gap-1" role="radiogroup" aria-label="Rating from 1 to 5 stars" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    className="rounded p-1 transition-transform hover:scale-110"
                  >
                    <Star className={cn("h-7 w-7", (hover || rating) >= n ? "fill-brand text-brand" : "text-white/25")} aria-hidden="true" />
                  </button>
                ))}
                <span className="ml-2 self-center text-sm text-white/60">{rating} / 5</span>
              </div>
            </fieldset>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="fb-message">Testimonial <span className="text-brand">*</span></label>
              <textarea id="fb-message" name="message" rows={5} className="field resize-y" maxLength={2000} {...aria("message")} />
              {err("message")}
            </div>
            <div className="sm:col-span-2">
              <span className="field-label">Optional photo</span>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 px-4 py-3 text-sm text-white/65 transition hover:border-brand focus-within:border-brand">
                <ImagePlus className="h-5 w-5 text-brand" aria-hidden="true" />
                <span className="truncate">{photoName || "Choose a JPG, PNG or WEBP photo"}</span>
                <input
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? "")}
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 text-sm text-white/75">
                <input type="checkbox" name="consent" value="yes" className="mt-1 h-4 w-4 accent-[var(--brand)]" {...aria("consent")} />
                <span>I agree that MIDE MEDIA PRODUCTION may display my testimonial on its website.</span>
              </label>
              {err("consent")}
            </div>
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <input name="website" tabIndex={-1} autoComplete="off" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary mt-7 w-full" disabled={status === "sending"}>
            {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {status === "sending" ? "Submitting…" : "Submit testimonial"}
          </button>
        </form>
      )}
    </Modal>
  );
}
