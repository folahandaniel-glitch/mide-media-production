"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Phone, Search, Trash2, X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { WhatsAppIcon } from "@/components/ui/icon";
import { cn, formatDate, whatsappLink } from "@/lib/utils";
import { api, confirmAction } from "./client";
import { Badge, Card, PageHeader, SkeletonRows, Spinner } from "./ui";

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  preferredDate: string;
  budget: string;
  message: string;
  referral: string;
  project: string;
  status: "new" | "contacted" | "in_progress" | "completed" | "closed";
  isRead: boolean;
  notes: string;
  createdAt: string | number;
};

const STATUSES: Enquiry["status"][] = ["new", "contacted", "in_progress", "completed", "closed"];

export function EnquiriesManager({ initialOpen, initialUnread }: { initialOpen?: string; initialUnread?: boolean }) {
  const [rows, setRows] = useState<Enquiry[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [unread, setUnread] = useState(Boolean(initialUnread));
  const [openId, setOpenId] = useState<string | null>(initialOpen ?? null);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (unread) p.set("unread", "1");
    try {
      const res = await api<{ rows: Enquiry[] }>(`/api/admin/enquiries?${p}`);
      setRows(res.rows);
      // Opened via a dashboard link: mark it as read.
      const linked = initialOpen ? res.rows.find((r) => r.id === initialOpen && !r.isRead) : null;
      if (linked) void patch(linked.id, { isRead: true }, true);
    } catch (e) {
      toast((e as Error).message, "error");
      setRows([]);
    }
  }, [q, status, unread, initialOpen]);

  useEffect(() => {
    const t = window.setTimeout(load, q ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [load, q]);

  const open = rows?.find((r) => r.id === openId) ?? null;

  function select(r: Enquiry) {
    setOpenId(r.id);
    if (!r.isRead) void patch(r.id, { isRead: true }, true);
  }

  async function patch(id: string, body: Partial<Enquiry>, silent = false) {
    try {
      const res = await api<{ row: Enquiry }>(`/api/admin/enquiries/${id}`, { method: "PATCH", body });
      setRows((rs) => rs?.map((r) => (r.id === id ? res.row : r)) ?? null);
      if (!silent) toast("Enquiry updated.");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function remove(e: Enquiry) {
    const ok = await confirmAction({
      title: "Delete enquiry?",
      message: `The enquiry from ${e.name} will be permanently deleted.`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api(`/api/admin/enquiries/${e.id}`, { method: "DELETE" });
      setRows((rs) => rs?.filter((r) => r.id !== e.id) ?? null);
      setOpenId(null);
      toast("Enquiry deleted.");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <div>
      <PageHeader title="Contact Enquiries" description="Every project enquiry submitted through the website. Update the status as you follow up." />
      <div className={cn("grid gap-6", open && "xl:grid-cols-[minmax(0,1fr)_420px]")}>
        <Card className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] p-3">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, service…" className="field !py-2 !pl-9 text-sm" aria-label="Search enquiries" />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="field !w-auto !py-2 text-sm" aria-label="Filter by status">
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-2 text-sm text-white/70">
              <input type="checkbox" checked={unread} onChange={(e) => setUnread(e.target.checked)} className="accent-[var(--brand)]" /> Unread only
            </label>
          </div>
          {rows === null ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <p className="px-6 py-16 text-center text-white/55">No enquiries found.</p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => select(r)}
                    className={cn("flex w-full items-start gap-4 px-4 py-4 text-left transition hover:bg-white/[0.03]", openId === r.id && "bg-white/[0.05]")}
                    aria-current={openId === r.id}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", r.isRead ? "bg-transparent" : "bg-brand")} aria-label={r.isRead ? undefined : "Unread"} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={cn("text-sm text-white", !r.isRead && "font-semibold")}>{r.name}</span>
                        <Badge value={r.status} />
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-white/50">
                        {[r.service, r.budget, r.preferredDate && `Date: ${formatDate(r.preferredDate)}`].filter(Boolean).join(" · ") || r.email}
                      </span>
                      <span className="mt-1 line-clamp-1 block text-sm text-white/65">{r.message}</span>
                    </span>
                    <span className="shrink-0 text-xs text-white/40">{formatDate(r.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {open && (
          <Card className="h-fit p-6 xl:sticky xl:top-24">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">{open.name}</h2>
                <p className="mt-1 text-xs text-white/45">Received {formatDate(open.createdAt, { dateStyle: "medium" } as Intl.DateTimeFormatOptions)}</p>
              </div>
              <button type="button" className="adm-icon-btn" onClick={() => setOpenId(null)} aria-label="Close enquiry">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`mailto:${open.email}?subject=${encodeURIComponent("Your enquiry — MIDE MEDIA PRODUCTION")}`} className="adm-btn adm-btn-sm">
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
              {open.phone && (
                <>
                  <a href={`tel:${open.phone.replace(/[^\d+]/g, "")}`} className="adm-btn adm-btn-sm">
                    <Phone className="h-3.5 w-3.5" /> Call
                  </a>
                  <a href={whatsappLink(open.phone, `Hello ${open.name}, thank you for contacting MIDE MEDIA PRODUCTION.`)} target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn-sm">
                    <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </>
              )}
            </div>
            <dl className="mt-6 grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 text-sm">
              {[
                ["Email", open.email],
                ["Phone", open.phone],
                ["Service", open.service],
                ["Preferred date", open.preferredDate && formatDate(open.preferredDate)],
                ["Budget", open.budget],
                ["Heard via", open.referral],
                ["Project ref.", open.project],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-white/45">{k}</dt>
                    <dd className="break-words text-white">{v}</dd>
                  </div>
                ))}
            </dl>
            <div className="mt-6">
              <h3 className="field-label">Message</h3>
              <p className="rounded-xl bg-white/[0.03] p-4 text-sm leading-relaxed whitespace-pre-line text-white/80">{open.message}</p>
            </div>
            <div className="mt-6">
              <label className="field-label" htmlFor="enq-status">Status</label>
              <select id="enq-status" className="field" value={open.status} onChange={(e) => patch(open.id, { status: e.target.value as Enquiry["status"] })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <NotesEditor
              key={open.id}
              enquiry={open}
              onSave={(notes) => patch(open.id, { notes })}
              onDelete={() => remove(open)}
              onMarkUnread={() => patch(open.id, { isRead: false })}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

function NotesEditor({
  enquiry,
  onSave,
  onDelete,
  onMarkUnread,
}: {
  enquiry: Enquiry;
  onSave: (notes: string) => Promise<void>;
  onDelete: () => void;
  onMarkUnread: () => void;
}) {
  const [notes, setNotes] = useState(enquiry.notes);
  const [saving, setSaving] = useState(false);
  return (
    <>
      <div className="mt-4">
        <label className="field-label" htmlFor="enq-notes">Internal notes</label>
        <textarea id="enq-notes" className="field resize-y" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Only visible to administrators" />
      </div>
      <div className="mt-4 flex justify-between gap-2">
        <button type="button" className="adm-btn adm-btn-danger" onClick={onDelete}>
          <Trash2 className="h-4 w-4" /> Delete
        </button>
        <div className="flex gap-2">
          <button type="button" className="adm-btn" onClick={onMarkUnread}>
            Mark unread
          </button>
          <button
            type="button"
            className="adm-btn adm-btn-primary"
            disabled={saving || notes === enquiry.notes}
            onClick={async () => {
              setSaving(true);
              await onSave(notes);
              setSaving(false);
            }}
          >
            {saving && <Spinner />} Save notes
          </button>
        </div>
      </div>
    </>
  );
}
