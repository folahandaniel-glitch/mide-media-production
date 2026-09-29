"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, GripVertical, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { getResource, type Row } from "@/lib/admin/resources";
import { cn, formatDate } from "@/lib/utils";
import { api, confirmAction } from "./client";
import { Badge, Card, PageHeader, SkeletonRows, Spinner, Switch } from "./ui";

export function ResourceList({ resourceKey, initialFilter = "" }: { resourceKey: string; initialFilter?: string }) {
  const resource = getResource(resourceKey)!;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [relations, setRelations] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filter) params.set("filter", filter);
    try {
      const res = await api<{ rows: Row[] }>(`/api/admin/r/${resourceKey}?${params}`);
      setRows(res.rows);
    } catch (e) {
      toast((e as Error).message, "error");
      setRows([]);
    }
  }, [resourceKey, q, filter]);

  useEffect(() => {
    const t = window.setTimeout(load, q ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [load, q]);

  const relationCol = resource.columns.find((c) => c.kind === "relation");
  const relationResource = relationCol ? resource.fields.find((f) => f.name === relationCol.field)?.relation : undefined;
  useEffect(() => {
    if (!relationResource) return;
    api<{ rows: Row[] }>(`/api/admin/r/${relationResource}`)
      .then((r) => setRelations(Object.fromEntries(r.rows.map((x) => [x.id, String(x.name ?? x.title ?? x.id)]))))
      .catch(() => {});
  }, [relationResource]);

  const canReorder = Boolean(resource.sortable && !q && !filter);

  async function patch(row: Row, body: Record<string, unknown>, message = "Updated.") {
    setBusyId(row.id);
    try {
      const res = await api<{ row: Row }>(`/api/admin/r/${resourceKey}/${row.id}`, { method: "PATCH", body });
      setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, ...res.row } : r)) ?? null);
      toast(message);
      if (filter && resource.filter && body[resource.filter.field] !== undefined) void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: Row) {
    if (resource.canDelete && !resource.canDelete(row)) {
      toast(resource.deleteBlockedReason ?? "This item cannot be deleted.", "info");
      return;
    }
    const title = String(row[resource.titleField] || resource.singular);
    const ok = await confirmAction({
      title: `Delete ${resource.singular.toLowerCase()}?`,
      message: `“${title.slice(0, 80)}” will be permanently deleted. This cannot be undone.`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(row.id);
    try {
      await api(`/api/admin/r/${resourceKey}/${row.id}`, { method: "DELETE" });
      setRows((rs) => rs?.filter((r) => r.id !== row.id) ?? null);
      toast(`${resource.singular} deleted.`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusyId(null);
    }
  }

  async function saveOrder(next: Row[]) {
    const prev = rows;
    setRows(next);
    try {
      await api(`/api/admin/r/${resourceKey}/reorder`, { method: "PUT", body: { ids: next.map((r) => r.id) } });
      toast("Order saved.");
    } catch (e) {
      setRows(prev);
      toast((e as Error).message, "error");
    }
  }

  function move(from: number, to: number) {
    if (!rows || to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    void saveOrder(next);
  }

  const counts = useMemo(() => rows?.length ?? 0, [rows]);

  return (
    <div>
      <PageHeader
        title={resource.label}
        description={resource.description}
        actions={
          resource.canCreate !== false && (
            <Link href={`/admin/r/${resourceKey}/new`} className="adm-btn adm-btn-primary">
              <Plus className="h-4 w-4" /> Add {resource.singular.toLowerCase()}
            </Link>
          )
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] p-3">
          {resource.searchFields && (
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${resource.label.toLowerCase()}…`} className="field !py-2 !pl-9 text-sm" aria-label="Search" />
            </div>
          )}
          {resource.filter && (
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="field !w-auto !py-2 text-sm" aria-label={`Filter by ${resource.filter.label}`}>
              <option value="">All {resource.filter.label.toLowerCase()}es</option>
              {resource.filter.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          <span className="ml-auto px-2 text-xs text-white/45">
            {counts} item{counts === 1 ? "" : "s"}
            {canReorder && counts > 1 && " · drag rows to reorder"}
          </span>
        </div>

        {rows === null ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-white/55">{q || filter ? "No items match your search." : resource.emptyText ?? `No ${resource.label.toLowerCase()} yet.`}</p>
            {resource.canCreate !== false && !q && !filter && (
              <Link href={`/admin/r/${resourceKey}/new`} className="adm-btn adm-btn-primary mt-5">
                <Plus className="h-4 w-4" /> Add the first one
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-left text-[0.7rem] tracking-[0.12em] text-white/45 uppercase">
                  {canReorder && <th className="w-16 px-3 py-3" scope="col"><span className="sr-only">Order</span></th>}
                  {resource.columns.map((c) => (
                    <th key={c.field} scope="col" className={cn("px-3 py-3 font-medium", c.kind === "image" && "w-20")}>
                      {c.label || <span className="sr-only">Image</span>}
                    </th>
                  ))}
                  {resource.toggle && <th className="px-3 py-3 font-medium" scope="col">{resource.toggle.on}</th>}
                  <th className="px-3 py-3 text-right font-medium" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    draggable={canReorder}
                    onDragStart={() => setDragId(row.id)}
                    onDragOver={(e) => canReorder && e.preventDefault()}
                    onDrop={() => {
                      const from = rows.findIndex((r) => r.id === dragId);
                      if (from >= 0) move(from, i);
                      setDragId(null);
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={cn("border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.025]", dragId === row.id && "opacity-40")}
                  >
                    {canReorder && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-0.5 text-white/35">
                          <GripVertical className="h-4 w-4 cursor-grab" aria-hidden="true" />
                          <span className="flex flex-col">
                            <button type="button" onClick={() => move(i, i - 1)} className="hover:text-brand" aria-label="Move up" disabled={i === 0}>
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => move(i, i + 1)} className="hover:text-brand" aria-label="Move down" disabled={i === rows.length - 1}>
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </div>
                      </td>
                    )}
                    {resource.columns.map((c, ci) => {
                      const v = row[c.field];
                      return (
                        <td key={c.field} className="max-w-xs px-3 py-3">
                          {c.kind === "image" ? (
                            v ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={String(v)} alt="" className="h-11 w-16 rounded-md object-cover" loading="lazy" />
                            ) : (
                              <span className="block h-11 w-16 rounded-md bg-white/5" />
                            )
                          ) : c.kind === "bool" ? (
                            v ? <span className="text-emerald-400">Yes</span> : <span className="text-white/35">No</span>
                          ) : c.kind === "badge" ? (
                            v ? <Badge value={String(v)} /> : null
                          ) : c.kind === "date" ? (
                            <span className="text-white/60">{formatDate(v as string)}</span>
                          ) : c.kind === "stars" ? (
                            <span className="flex items-center gap-1 text-brand" aria-label={`${v} of 5 stars`}>
                              <Star className="h-3.5 w-3.5 fill-brand" aria-hidden="true" /> {String(v)}
                            </span>
                          ) : c.kind === "relation" ? (
                            <span className="text-white/70">{relations[String(v)] ?? "—"}</span>
                          ) : ci === resource.columns.findIndex((x) => !x.kind || x.kind === "text") ? (
                            <Link href={`/admin/r/${resourceKey}/${row.id}`} className="line-clamp-2 font-medium text-white hover:text-brand">
                              {String(v ?? "") || "(untitled)"}
                            </Link>
                          ) : (
                            <span className="line-clamp-2 text-white/65">{String(v ?? "")}</span>
                          )}
                        </td>
                      );
                    })}
                    {resource.toggle && (
                      <td className="px-3 py-3">
                        <Switch
                          checked={Boolean(row[resource.toggle.field])}
                          onChange={(val) => patch(row, { [resource.toggle!.field]: val }, val ? `${resource.toggle!.on}.` : `${resource.toggle!.off}.`)}
                          label={`${resource.toggle.on}: ${String(row[resource.titleField] ?? "")}`}
                          disabled={busyId === row.id}
                        />
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {busyId === row.id && <Spinner className="mr-1 text-brand" />}
                        {resource.quickActions
                          ?.filter((a) => !a.when || a.when(row))
                          .map((a) => (
                            <button
                              key={a.label}
                              type="button"
                              onClick={() => patch(row, a.patch, `${a.label} — done.`)}
                              className={cn(
                                "adm-btn adm-btn-sm",
                                a.tone === "success" && "!border-emerald-500/40 !text-emerald-300",
                                a.tone === "danger" && "!border-red-500/40 !text-red-300",
                              )}
                              disabled={busyId === row.id}
                            >
                              {a.label}
                            </button>
                          ))}
                        {resource.viewPath?.(row) && (
                          <a href={resource.viewPath(row)!} target="_blank" rel="noopener noreferrer" className="adm-icon-btn" aria-label="View on website" title="View on website">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Link href={`/admin/r/${resourceKey}/${row.id}`} className="adm-icon-btn" aria-label="Edit" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        {(!resource.canDelete || resource.canDelete(row)) && (
                          <button type="button" onClick={() => remove(row)} className="adm-icon-btn hover:!text-red-400" aria-label="Delete" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
