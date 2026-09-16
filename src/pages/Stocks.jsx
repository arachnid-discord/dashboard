import React, { useEffect, useState } from "react";
import { Card, CardHeader, Field, TextInput, Select, Button, EmptyState, LoadingScreen } from "../components/ui";
import { getStocksMarket, getStocksPortfolio, getStocksLeaderboard, stocksTrade } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Stocks() {
  const { user } = useAuth();
  const { push } = useToast();
  const [market, setMarket] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [form, setForm] = useState({ symbol: "", action: "buy", amount: "" });
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    getStocksMarket().then((r) => setMarket(r.market || r)).catch(() => setMarket([]));
    if (user) getStocksPortfolio(user.id).then(setPortfolio).catch(() => setPortfolio(null));
    getStocksLeaderboard().then((r) => setLeaderboard(r.leaderboard || r)).catch(() => setLeaderboard([]));
  };

  useEffect(refresh, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await stocksTrade({ ...form, user_id: user?.id, amount: Number(form.amount) });
      push({ type: "success", message: res.status || "Trade executed." });
      setForm({ symbol: "", action: "buy", amount: "" });
      refresh();
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Stocks</h1>

      <Card>
        <CardHeader title="Trade" />
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Field label="Symbol">
            <TextInput value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} required />
          </Field>
          <Field label="Action">
            <Select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </Select>
          </Field>
          <Field label="Shares">
            <TextInput type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </Field>
          <Button type="submit" disabled={busy}>{busy ? "Trading…" : "Submit"}</Button>
        </form>
      </Card>

      {portfolio && (
        <Card>
          <CardHeader title="Your portfolio" description={`Balance: ${portfolio.balance ?? "—"}`} />
          {(!portfolio.holdings || portfolio.holdings.length === 0) ? <EmptyState>No holdings yet.</EmptyState> : (
            <div className="divide-y divide-white/[0.05]">
              {portfolio.holdings.map((h, i) => (
                <div key={i} className="py-2 flex items-center gap-3 text-[13px]">
                  <span className="text-white/70 font-mono flex-1">{h.symbol}</span>
                  <span className="text-white/40">{h.shares} shares</span>
                  <span className="text-white/30">{h.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Market" />
          {!market ? <LoadingScreen /> : market.length === 0 ? <EmptyState>No listings.</EmptyState> : (
            <div className="divide-y divide-white/[0.05]">
              {market.slice(0, 15).map((m, i) => (
                <div key={i} className="py-2 flex items-center gap-3 text-[13px]">
                  <span className="text-white/70 font-mono">{m.symbol}</span>
                  <span className="text-white/40 truncate flex-1">{m.name}</span>
                  <span className="text-white/70">{m.price}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Leaderboard" />
          {!leaderboard ? <LoadingScreen /> : leaderboard.length === 0 ? <EmptyState>No traders yet.</EmptyState> : (
            <div className="divide-y divide-white/[0.05]">
              {leaderboard.slice(0, 15).map((l, i) => (
                <div key={i} className="py-2 flex items-center gap-3 text-[13px]">
                  <span className="text-white/25 font-mono w-5">{i + 1}</span>
                  <span className="text-white/70 truncate flex-1">{l.username || l.name}</span>
                  <span className="text-white/30">{l.net_worth ?? l.balance}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
