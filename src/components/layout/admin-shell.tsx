"use client";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Blocks,
  ChevronRight,
  CircleHelp,
  FlaskConical,
  LayoutDashboard,
  Layers3,
  Menu,
  Settings2,
  Upload,
  X,
} from "lucide-react";
const navigation = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/importacoes", label: "Importações", icon: Upload },
  { href: "/prototipos", label: "Protótipos", icon: Layers3 },
  { href: "/templates", label: "Templates", icon: Blocks },
  { href: "/configuracoes", label: "Configurações", icon: Settings2 },
];
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    if (!open && !help) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const container = document.querySelector<HTMLElement>(
      help ? ".modal" : ".sidebar",
    );
    const focusable = () =>
      Array.from(
        container?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,select,[tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
    focusable()[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHelp(false);
        setOpen(false);
      }
      if (event.key === "Tab") {
        const elements = focusable();
        const first = elements[0];
        const last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, help]);
  const active = navigation.find((item) => item.href === path);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Fechar navegação"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${open ? "is-open" : ""}`}
        aria-label="Navegação principal"
      >
        <div className="brand">
          <span className="brand-symbol">
            l<span>↗</span>
          </span>
          <div>
            <b>
              loung<span className="brand-period">.</span>
            </b>
            <small>PROTOTYPE STUDIO</small>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace">
          <span className="workspace-icon">
            <Layers3 size={18} />
          </span>
          <div>
            <strong>Workspace Loung</strong>
            <small>Seu espaço de criação</small>
          </div>
          <span className="workspace-tag">01</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              className={`nav-link ${path === href ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              {label}
              {path === href && <span className="nav-active-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="phase-card">
            <FlaskConical size={20} />
            <span className="phase-tag">FASE 2.1</span>
            <strong>
              Grandes ideias.
              <br />
              Primeiros passos.
            </strong>
            <p>A fundação para transformar leads em novas possibilidades.</p>
            <Link href="/templates" onClick={() => setOpen(false)}>
              Explore os templates <ArrowUpRight size={15} />
            </Link>
          </div>
          <button className="help-button" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            Sobre este ambiente
            <ArrowUpRight size={15} />
          </button>
          <LogoutButton />
          <div className="user-profile">
            <span className="avatar">LT</span>
            <div>
              <strong>Loung Tech</strong>
              <small>Workspace demonstrativo</small>
            </div>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Abrir menu"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{active?.label ?? "Studio"}</strong>
          </div>
          <div className="header-right">
            <span className="demo-pill">
              <span />
              Modo demonstração
            </span>
            <span className="header-divider" />
            <span className="mini-avatar">LT</span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="footer">
          <span>© 2026 Loung Tech</span>
          <span>
            Feito para transformar possibilidades.
            <span className="footer-mark">↗</span>
          </span>
        </footer>
      </div>
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Sobre este ambiente"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="icon-button modal-close"
              aria-label="Fechar"
              onClick={() => setHelp(false)}
            >
              <X />
            </button>
            <FlaskConical size={28} />
            <h2>Um primeiro olhar para o Studio</h2>
            <p>
              Esta é a Fase 2.1. Empresas, importações e publicações são
              exemplos fictícios. A busca e os filtros já funcionam; geração,
              edição, publicação e processamento de planilhas chegam nas
              próximas fases.
            </p>
            <p>
              O acesso utiliza Supabase Auth e autorização administrativa. O
              painel continua demonstrativo; importação e geração reais ainda
              não estão disponíveis.
            </p>
            <button className="button primary" onClick={() => setHelp(false)}>
              Entendi
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
