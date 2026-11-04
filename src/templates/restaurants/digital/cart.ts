import type {
  RestaurantDesign,
  RestaurantItem,
} from "../../../lib/generation/restaurant-design";
import { digitalCopy } from "../../../lib/generation/restaurant-design";
import { whatsappLink } from "../../clinics/shared/adapter";
export type CartEntry = { id: string; quantity: number };
export const MAX_NOTES = 500;
export function priceInCents(price: number | null): number | null {
  if (price == null || !Number.isFinite(price) || price < 0 || price > 1000000)
    return null;
  const cents = Math.round(price * 100);
  return Number.isSafeInteger(cents) && Math.abs(price * 100 - cents) < 0.000001
    ? cents
    : null;
}
export function formatCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
export function digitalCatalog(d: RestaurantDesign | undefined) {
  const hidden = new Set(
    d?.categories?.filter((c) => c.hidden).map((c) => c.id),
  );
  return [...(d?.items ?? [])]
    .filter((i) => !i.categoryId || !hidden.has(i.categoryId))
    .sort(
      (a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order,
    );
}
export function canOrder(item: RestaurantItem | undefined) {
  return Boolean(
    item &&
    item.available &&
    !item.demonstration &&
    priceInCents(item.price) !== null,
  );
}
export function reconcileCart(
  entries: readonly CartEntry[],
  d: RestaurantDesign | undefined,
): CartEntry[] {
  const catalog = digitalCatalog(d),
    limit = d?.digital?.maxQuantity ?? 20,
    seen = new Set<string>();
  return entries.flatMap((entry) => {
    const item = catalog.find((i) => i.id === entry.id);
    if (
      seen.has(entry.id) ||
      !canOrder(item) ||
      !Number.isSafeInteger(entry.quantity) ||
      entry.quantity <= 0
    )
      return [];
    seen.add(entry.id);
    return [{ id: entry.id, quantity: Math.min(entry.quantity, limit) }];
  });
}
export function changeCart(
  entries: readonly CartEntry[],
  id: string,
  delta: number,
  d: RestaurantDesign | undefined,
): CartEntry[] {
  const current = reconcileCart(entries, d),
    item = digitalCatalog(d).find((i) => i.id === id);
  if (!canOrder(item) || !Number.isSafeInteger(delta)) return current;
  const existing = current.find((e) => e.id === id),
    quantity = Math.min(
      d?.digital?.maxQuantity ?? 20,
      (existing?.quantity ?? 0) + delta,
    );
  if (quantity <= 0) return current.filter((e) => e.id !== id);
  return existing
    ? current.map((e) => (e.id === id ? { id, quantity } : e))
    : [...current, { id, quantity }];
}
export function cartSummary(
  entries: readonly CartEntry[],
  d: RestaurantDesign | undefined,
) {
  const catalog = digitalCatalog(d);
  const lines = reconcileCart(entries, d).map((entry) => {
    const item = catalog.find((i) => i.id === entry.id)!;
    const unitCents = priceInCents(item.price)!;
    return { ...entry, item, unitCents, lineCents: unitCents * entry.quantity };
  });
  return {
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: lines.reduce((n, l) => n + l.lineCents, 0),
    totalCents: lines.reduce((n, l) => n + l.lineCents, 0),
  };
}
export function cleanNotes(value: string) {
  return value
    .toWellFormed()
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/g, "")
    .slice(0, MAX_NOTES)
    .toWellFormed();
}
export function whatsappOrder(
  phone: string | null,
  entries: readonly CartEntry[],
  d: RestaurantDesign | undefined,
  notes: string,
): { ok: true; url: string; message: string } | { ok: false; reason: string } {
  const base = whatsappLink(phone);
  if (!base)
    return {
      ok: false,
      reason: "WhatsApp não configurado. Consulte outro canal confirmado.",
    };
  const current = reconcileCart(entries, d);
  if (!current.length)
    return { ok: false, reason: "Adicione produtos disponíveis ao pedido." };
  if (
    current.length !== entries.length ||
    current.some(
      (e, i) => e.id !== entries[i].id || e.quantity !== entries[i].quantity,
    )
  )
    return {
      ok: false,
      reason: "O cardápio mudou. Revise os itens e quantidades.",
    };
  if (notes !== cleanNotes(notes))
    return {
      ok: false,
      reason: "Revise as observações (até 500 caracteres de texto simples).",
    };
  const summary = cartSummary(current, d),
    copy = { ...digitalCopy, ...d?.digital?.copy };
  const message = [
    copy.whatsappIntroduction,
    "",
    ...summary.lines.map(
      (l) => `${l.quantity}x ${l.item.name} — ${formatCents(l.lineCents)}`,
    ),
    "",
    ...(d?.digital?.showSubtotal === false
      ? []
      : [`Subtotal estimado: ${formatCents(summary.subtotalCents)}`]),
    `Total estimado: ${formatCents(summary.totalCents)}`,
    ...(notes.trim() ? ["", `Observações: ${notes.trim()}`] : []),
    "",
    copy.whatsappConfirmation,
    "Estimativa sujeita à confirmação do restaurante; abrir o WhatsApp não confirma o pedido.",
  ]
    .join("\n")
    .toWellFormed();
  const url = `${base}?text=${encodeURIComponent(message)}`;
  if (url.length > 12000)
    return {
      ok: false,
      reason: "Resumo muito longo. Reduza os itens ou as observações.",
    };
  return { ok: true, url, message };
}
