"use client";
import { Minus, Plus, Trash2, ShoppingCart, MessageCircle } from "lucide-react";
import type { RestaurantDesign } from "../../../lib/generation/restaurant-design";
import { digitalCopy } from "../../../lib/generation/restaurant-design";
import {
  cartSummary,
  whatsappOrder,
  formatCents,
  MAX_NOTES,
  type CartEntry,
} from "./cart";
export function CartPanel({
  entries,
  design,
  phone,
  notes,
  onNotes,
  onChange,
  onRemove,
  onClear,
  id,
}: {
  entries: CartEntry[];
  design: RestaurantDesign | undefined;
  phone: string | null;
  notes: string;
  onNotes: (v: string) => void;
  onChange: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  id: string;
}) {
  const summary = cartSummary(entries, design),
    order = whatsappOrder(phone, entries, design, notes),
    copy = { ...digitalCopy, ...design?.digital?.copy };
  return (
    <section className="rdCart" aria-label="Resumo do pedido">
      <h2>{copy.cartTitle}</h2>
      {summary.lines.length ? (
        <>
          <ul>
            {summary.lines.map((line) => (
              <li key={line.id}>
                <div className="rdCartItem">
                  <b>{line.item.name}</b>
                  <small>{formatCents(line.unitCents)} por unidade</small>
                  <strong>{formatCents(line.lineCents)}</strong>
                </div>
                <div className="rdQuantity">
                  <button
                    type="button"
                    onClick={() => onChange(line.id, -1)}
                    aria-label={`Diminuir quantidade de ${line.item.name}`}
                  >
                    <Minus size={14} />
                  </button>
                  <output aria-label={`Quantidade de ${line.item.name}`}>
                    {line.quantity}
                  </output>
                  <button
                    type="button"
                    disabled={
                      line.quantity >= (design?.digital?.maxQuantity ?? 20)
                    }
                    onClick={() => onChange(line.id, 1)}
                    aria-label={`Aumentar quantidade de ${line.item.name}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  className="rdRemove"
                  onClick={() => onRemove(line.id)}
                  aria-label={`Remover ${line.item.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
          <button className="rdClear" type="button" onClick={onClear}>
            Limpar carrinho
          </button>
        </>
      ) : (
        <p className="rdCartEmpty">
          <ShoppingCart />
          Seu carrinho está vazio.
        </p>
      )}
      {design?.digital?.showSubtotal !== false && (
        <div className="rdCartSubtotal">
          <span>Subtotal estimado</span>
          <strong>{formatCents(summary.subtotalCents)}</strong>
        </div>
      )}
      <label className="rdNotes" htmlFor={`${id}-notes`}>
        Observações (opcional)
        <textarea
          id={`${id}-notes`}
          maxLength={MAX_NOTES}
          rows={3}
          placeholder="Preferências sobre os itens selecionados"
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
        />
        <small>
          {notes.length}/{MAX_NOTES} caracteres
        </small>
      </label>
      <div className="rdCartTotal">
        <b>Total estimado</b>
        <strong>{formatCents(summary.totalCents)}</strong>
      </div>
      {order.ok ? (
        <a
          className="rdCheckout"
          target="_blank"
          rel="noopener noreferrer"
          href={order.url}
          onClick={(event) => {
            const fresh = whatsappOrder(phone, entries, design, notes);
            if (!fresh.ok) event.preventDefault();
            else event.currentTarget.href = fresh.url;
          }}
        >
          <MessageCircle size={21} />
          {copy.checkoutCta}
        </a>
      ) : (
        <>
          <button className="rdCheckout" type="button" disabled>
            {copy.checkoutCta}
          </button>
          <p className="rdOrderHint">{order.reason}</p>
        </>
      )}
      <p className="rdEstimate">
        Valores sujeitos à confirmação do restaurante. Abrir o WhatsApp não
        confirma o pedido.
      </p>
    </section>
  );
}
