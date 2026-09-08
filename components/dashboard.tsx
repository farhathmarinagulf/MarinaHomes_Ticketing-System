"use client";
import Brand from "./brand";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Plus,
  Search,
  Ticket,
  Users,
  X,
  Paperclip,
  Send,
  RefreshCw,
} from "lucide-react";
import type { User } from "@/lib/auth";
import Modal from "./modal";
import TicketFields from "./ticket-fields";
import {
  statuses,
  filterStatuses,
  ticketReference,
  categoryOptions,
} from "@/lib/ticket-options";
type TicketRow = {
  id: number;
  subject: string;
  description: string;
  category: string;
  subcategory: string | null;
  other_note: string | null;
  reference: string | null;
  priority: string;
  status: string;
  assignee: string | null;
  name: string;
  email: string;
  employee_code: string;
  created_at: string;
  updated_at: string;
};
type Detail = {
  ticket: TicketRow;
  comments: {
    id: string;
    name: string;
    role: string;
    body: string;
    created_at: string;
  }[];
  events: { id: string; name: string; body: string; created_at: string }[];
  attachments: { id: string; name: string }[];
};
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error("Please sign in.");
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}
export default function Dashboard({ user }: { user: User }) {
  const admin = user.role === "admin";
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const data = await api(
          `/api/tickets?q=${encodeURIComponent(search)}&status=${status}&page=${page}`,
          { signal },
        );
        setTickets(data.tickets);
        setTotal(data.total);
        setStats(
          Object.fromEntries(
            data.stats.map((s: { status: string; count: number }) => [
              s.status,
              s.count,
            ]),
          ),
        );
        setError("");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [search, status, page],
  );
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void refresh(controller.signal);
    const timer = setInterval(() => void refresh(controller.signal), 15000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [refresh]);
  async function signOut() {
    try {
      await api("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand href="/dashboard" />
        <div className="workspace-label">WORKSPACE</div>
        <button
          className="nav-item active"
          onClick={() => {
            setStatus("");
            setQuery("");
            setPage(1);
          }}
        >
          <LayoutDashboard size={19} />
          {admin ? "Overview" : "My dashboard"}
        </button>
        <button
          className="nav-item"
          onClick={() => {
            setStatus("");
            setPage(1);
            document
              .getElementById("ticket-list")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <Ticket size={19} />
          {admin ? "All tickets" : "My tickets"}
          <span className="nav-count">
            {Object.values(stats).reduce((a, b) => a + b, 0)}
          </span>
        </button>
        <div className="sidebar-help">
          <span className="help-icon">
            <LifeBuoy size={24} />
          </span>
          <h3>Let’s get it sorted.</h3>
          <p>Your support team is here to make your workday easier.</p>
          <button onClick={() => setCreating(true)}>
            Create a ticket <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="online-dot" /> Internal staff portal{" "}
          <span>v1.0</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Workspace <ChevronRight size={14} />{" "}
            <strong>{admin ? "Admin overview" : "My dashboard"}</strong>
          </span>
          <div className="user-menu">
            <span className="role-label">
              {admin ? "Administrator" : "Staff member"}
            </span>
            <span className="avatar">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.employee_code}</small>
            </div>
            <button
              className="icon-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={signOut}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">MARINA HOMES SUPPORT</div>
              <h1>
                {admin
                  ? "Helpdesk overview"
                  : `Hello, ${user.name.split(" ")[0]}`}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {admin
                  ? "A clear view of every request. Keep your team moving."
                  : "Have something on your mind? We’re here to help."}
              </p>
            </div>
            <button className="primary" onClick={() => setCreating(true)}>
              <Plus size={18} />
              Create ticket
            </button>
          </div>
          <div className="stat-grid">
            {[
              {
                label: "Total tickets",
                value: Object.values(stats).reduce((a, b) => a + b, 0),
                icon: Ticket,
                color: "blue",
                filter: "",
              },
              {
                label: "New",
                value: stats.New ?? 0,
                icon: Clock3,
                color: "amber",
                filter: "New",
              },
              {
                label: "Assigned",
                value: stats.Assigned ?? 0,
                icon: Users,
                color: "purple",
                filter: "Assigned",
              },
              {
                label: "Resolved",
                value: stats.Resolved ?? 0,
                icon: CheckCheck,
                color: "green",
                filter: "Resolved",
              },
            ].map((s) => (
              <button
                key={s.label}
                className={`stat-card ${status === s.filter ? "stat-selected" : ""}`}
                onClick={() => {
                  setStatus(s.filter);
                  setPage(1);
                }}
              >
                <div>
                  <span>{s.label}</span>
                  <strong>{loading ? "—" : s.value}</strong>
                  <small>
                    {s.filter === "Resolved"
                      ? "Resolved and ready"
                      : s.filter === "Assigned"
                        ? "Being taken care of"
                        : s.filter === "New"
                          ? "Awaiting a helping hand"
                          : "All your requests, in one place"}
                  </small>
                </div>
                <span className={`stat-icon ${s.color}`}>
                  <s.icon size={22} />
                </span>
              </button>
            ))}
          </div>
          <section className="ticket-panel" id="ticket-list">
            <div className="panel-heading">
              <div>
                <h2>
                  {admin ? "All tickets" : "Your tickets"}{" "}
                  <span className="count-pill">{total}</span>
                </h2>
                <p>
                  {admin
                    ? "Manage, assign, and resolve staff requests."
                    : "Every request, from first message to resolution."}
                </p>
              </div>
              <span className="live-label">
                <span className="online-dot" /> Updates every 15s
              </span>
            </div>
            <div className="table-toolbar">
              <div className="filter-tabs">
                {[
                  "",
                  ...filterStatuses.filter(
                    (s) => !["Pending", "Completed"].includes(s) || stats[s],
                  ),
                ].map((s) => (
                  <button
                    key={s}
                    className={status === s ? "selected" : ""}
                    onClick={() => {
                      setStatus(s);
                      setPage(1);
                    }}
                  >
                    {s || "All tickets"}
                  </button>
                ))}
              </div>
              <div className="search-box">
                <Search size={17} />
                <input
                  aria-label="Search tickets"
                  placeholder={
                    admin
                      ? "Search tickets, staff, employee code…"
                      : "Search your tickets…"
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <div className="error" role="alert">
                {error} <button onClick={() => void refresh()}>Retry</button>
              </div>
            )}
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Ticket / Subject</th>
                    {admin && <th>Requested by</th>}
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {!loading &&
                    tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <button
                            className="ticket-title"
                            onClick={() => setSelected(ticket.id)}
                          >
                            <span>{ticketReference(ticket)}</span>
                            <strong>{ticket.subject}</strong>
                          </button>
                        </td>
                        {admin && (
                          <td data-label="Requested by">
                            <strong>{ticket.name}</strong>
                            <small>{ticket.employee_code}</small>
                          </td>
                        )}
                        <td data-label="Category">{ticket.category}</td>
                        <td data-label="Priority">
                          <span>
                            <span
                              className={`priority ${ticket.priority.toLowerCase()}`}
                            >
                              ●
                            </span>{" "}
                            {ticket.priority}
                          </span>
                        </td>
                        <td data-label="Status">
                          <Badge status={ticket.status} />
                        </td>
                        <td data-label="Updated" className="date-cell">
                          {date(ticket.updated_at)}
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            aria-label={`Open ${ticketReference(ticket)}`}
                            onClick={() => setSelected(ticket.id)}
                          >
                            <ArrowUpRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {loading ? (
              <div className="empty-state">
                <RefreshCw size={30} />
                <h3>Loading your tickets…</h3>
              </div>
            ) : (
              tickets.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">
                    <Ticket size={32} />
                  </span>
                  <h3>
                    {search || status
                      ? "No matching tickets"
                      : "A fresh start. We’re ready to help."}
                  </h3>
                  <p>
                    {search || status
                      ? "Try another search or status filter."
                      : "Create your first ticket and track its progress here."}
                  </p>
                  {!search && !status && (
                    <button
                      className="secondary"
                      onClick={() => setCreating(true)}
                    >
                      <Plus size={16} />
                      Create your first ticket
                    </button>
                  )}
                </div>
              )
            )}
            <div className="table-footer">
              <span>
                {total
                  ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} of ${total} tickets`
                  : "0 tickets"}
              </span>
              <div>
                <button
                  className="icon-button"
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={17} />
                </button>
                <span>Page {page}</span>
                <button
                  className="icon-button"
                  aria-label="Next page"
                  disabled={page * 20 >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </section>
          <div className="bottom-note">
            <ShieldIcon /> A dedicated space for your workplace support.
            <span>Marina Homes Helpdesk</span>
          </div>
        </main>
      </div>
      {creating && (
        <CreateTicket
          user={user}
          close={() => setCreating(false)}
          created={(id) => {
            setCreating(false);
            setSelected(id);
            void refresh();
          }}
        />
      )}
      {selected !== null && (
        <TicketDetail
          id={selected}
          admin={admin}
          close={() => setSelected(null)}
          changed={() => void refresh()}
        />
      )}
    </div>
  );
}
function ShieldIcon() {
  return <LifeBuoy size={15} />;
}
function Badge({ status }: { status: string }) {
  return (
    <span className={`badge ${status.toLowerCase().replaceAll(" ", "-")}`}>
      <span /> {status}
    </span>
  );
}
function CreateTicket({
  user,
  close,
  created,
}: {
  user: User;
  close: () => void;
  created: (id: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/api/tickets", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      created(result.id);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <Modal title="Create a ticket" close={close}>
      <form onSubmit={submit} className="modal-body">
        <p className="muted">
          Tell us what’s happening. We’ll help take it from here.
        </p>
        <div className="identity-card">
          <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <small>
              {user.email} · {user.employee_code}
            </small>
          </div>
        </div>
        <TicketFields />
        <label>
          Status
          <select disabled value="New">
            <option>New</option>
          </select>
          <small>
            Your administrator will update this as your request progresses.
          </small>
        </label>
        <label>
          Problem / comments
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={10000}
            rows={5}
            placeholder="Describe the problem and include any details that could help us…"
          />
        </label>
        <label className="upload-label">
          <Paperclip size={22} />
          <strong>Attach supporting images</strong>
          <span>PNG, JPEG or WebP · Up to 3 images · 5 MB each</span>
          <input
            name="images"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const items = Array.from(e.target.files ?? []);
              if (
                items.length > 3 ||
                items.some((f) => f.size > 5 * 1024 * 1024)
              ) {
                setError("Choose up to 3 images, each 5 MB or smaller.");
                e.target.value = "";
                setFiles([]);
              } else {
                setFiles(items.map((f) => f.name));
                setError("");
              }
            }}
          />
          {files.map((name) => (
            <small key={name}>{name}</small>
          ))}
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={close}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Submitting…" : "Submit ticket"}
            <ArrowUpRight size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
function TicketDetail({
  id,
  admin,
  close,
  changed,
}: {
  id: number;
  admin: boolean;
  close: () => void;
  changed: () => void;
}) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setData(await api(`/api/tickets/${id}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [load]);
  async function submit(
    e: React.FormEvent<HTMLFormElement>,
    method: "POST" | "PATCH",
  ) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/tickets/${id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (method === "POST") form.reset();
      setNotice(method === "POST" ? "Comment added." : "Ticket updated.");
      await load();
      changed();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={data ? ticketReference(data.ticket) : "Ticket details"}
      close={close}
      wide
    >
      <div className="modal-body">
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="success">
            {notice}
          </p>
        )}
        {!data ? (
          <p>Loading ticket…</p>
        ) : (
          <>
            <div className="detail-heading">
              <Badge status={data.ticket.status} />
              <span className="muted">
                Created {date(data.ticket.created_at)}
              </span>
            </div>
            <h2>{data.ticket.subject}</h2>
            <div className="detail-meta">
              <span>{data.ticket.category}</span>
              <span>{data.ticket.priority} priority</span>
              <span>
                {data.ticket.assignee
                  ? `Assigned to ${data.ticket.assignee}`
                  : "Unassigned"}
              </span>
            </div>
            <div className="identity-card">
              <div>
                <strong>{data.ticket.name}</strong>
                <small>
                  {data.ticket.email} · {data.ticket.employee_code}
                </small>
              </div>
            </div>
            {data.ticket.subcategory && (
              <div className="ticket-classification">
                <strong>
                  {categoryOptions[data.ticket.category]?.label ??
                    "Subcategory"}
                </strong>
                <p>{data.ticket.subcategory}</p>
              </div>
            )}
            {data.ticket.other_note && (
              <div className="other-note">
                <strong>Other — details</strong>
                <p className="description">{data.ticket.other_note}</p>
              </div>
            )}
            <p className="description">{data.ticket.description}</p>
            {data.attachments.length > 0 && (
              <div className="attachment-grid">
                {data.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={`/api/attachments/${file.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={`/api/attachments/${file.id}`} alt={file.name} />
                    <small>{file.name}</small>
                  </a>
                ))}
              </div>
            )}
            {admin && (
              <form
                onSubmit={(e) => void submit(e, "PATCH")}
                className="admin-controls"
                key={`${data.ticket.status}-${data.ticket.assignee}`}
              >
                <h3>Manage ticket</h3>
                <div className="form-grid">
                  <label>
                    Status
                    <select name="status" defaultValue={data.ticket.status}>
                      {[
                        ...statuses,
                        ...(["Pending", "Completed"].includes(
                          data.ticket.status,
                        )
                          ? [data.ticket.status]
                          : []),
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Assign to
                    <input
                      name="assignee"
                      defaultValue={data.ticket.assignee ?? ""}
                      maxLength={100}
                      placeholder="Person or team name"
                    />
                  </label>
                </div>
                <button className="primary" disabled={busy}>
                  Save changes
                </button>
              </form>
            )}
            <h3 className="section-title">Conversation</h3>
            {!data.comments.length && (
              <p className="muted">
                No comments yet. Add a detail or ask for an update.
              </p>
            )}
            {data.comments.map((c) => (
              <div
                key={c.id}
                className={`comment ${c.role === "admin" ? "admin-comment" : ""}`}
              >
                <div>
                  <strong>{c.name}</strong>
                  {c.role === "admin" && (
                    <span className="count-pill">Support</span>
                  )}
                  <small>{date(c.created_at)}</small>
                </div>
                <p>{c.body}</p>
              </div>
            ))}
            <form onSubmit={(e) => void submit(e, "POST")}>
              <label className="sr-only" htmlFor="reply">
                Add a comment
              </label>
              <textarea
                id="reply"
                name="body"
                placeholder="Write a comment…"
                required
                maxLength={5000}
                rows={3}
              />
              <div className="form-actions">
                <button className="primary" disabled={busy}>
                  <Send size={16} />
                  Send comment
                </button>
              </div>
            </form>
            <h3 className="section-title">Activity</h3>
            <div className="timeline">
              {data.events.map((event) => (
                <div key={event.id}>
                  <span className="timeline-dot" />
                  <strong>{event.body}</strong>
                  <small>
                    {event.name} · {date(event.created_at)}
                  </small>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
