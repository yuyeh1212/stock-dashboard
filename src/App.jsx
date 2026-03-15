import { useState, useEffect, useRef } from "react";
import "./App.css";
import api from "./api/client";

function useAuth() {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState("loading");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    const error = urlParams.get("error");

    if (error === "user_not_found") {
      alert("找不到你的 LINE 帳號，請先完成 身分登記");
      window.history.replaceState({}, "", window.location.pathname);
      setAuthStatus("unbound");
      return;
    }

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
      window.history.replaceState({}, "", window.location.pathname);
      setUser({ token: accessToken });
      setAuthStatus("bound");
      return;
    }

    // 相容舊的 bind_token
    const storedToken =
      localStorage.getItem("access_token") ||
      localStorage.getItem("bind_token");

    if (!storedToken) {
      setAuthStatus("unbound");
      return;
    }

    setUser({ token: storedToken });
    setAuthStatus("bound");
  }, []);

  return { user, authStatus };
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="clock">
      {time.toLocaleTimeString("zh-TW", { hour12: false })}
    </span>
  );
}

function StatCard({ value, label, highlight }) {
  return (
    <div className="stat-card">
      <div className={`stat-value ${highlight ? "highlight" : ""}`}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function LogConsole({ logs }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);
  return (
    <div className="log-console" ref={ref}>
      {logs.length === 0 ? (
        <span className="log-empty">等待系統訊息...</span>
      ) : (
        logs.map((log, i) => (
          <div key={i} className={`log-line ${log.type}`}>
            <span className="log-time">{log.time}</span>
            <span className="log-msg">{log.msg}</span>
          </div>
        ))
      )}
    </div>
  );
}

function QuotePanel({ quotes, isMonitoring }) {
  if (!isMonitoring || quotes.length === 0) {
    return (
      <div className="quote-empty">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          className="radar-svg"
        >
          <circle cx="40" cy="40" r="35" stroke="#1a3a3a" strokeWidth="2" />
          <circle cx="40" cy="40" r="22" stroke="#1a3a3a" strokeWidth="1.5" />
          <circle
            cx="40"
            cy="40"
            r="10"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.5"
          />
          <line
            x1="40"
            y1="40"
            x2="40"
            y2="5"
            stroke="#00ff88"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M40 40 L65 20"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.3"
          />
        </svg>
        <p>載入自選股後自動啟動監控</p>
      </div>
    );
  }

  return (
    <div className="quote-grid">
      {quotes.map((q, i) => (
        <div
          key={i}
          className={`quote-card ${parseFloat(q.change) > 0 ? "up" : parseFloat(q.change) < 0 ? "down" : ""}`}
        >
          <div className="quote-header">
            <span className="quote-symbol">{q.symbol}</span>
            {q.limitUp && <span className="limit-badge">漲停</span>}
          </div>
          <div className="quote-price">{q.price}</div>
          <div className="quote-change">
            {parseFloat(q.change) > 0
              ? "▲"
              : parseFloat(q.change) < 0
                ? "▼"
                : "─"}{" "}
            {Math.abs(parseFloat(q.change))}%
          </div>
        </div>
      ))}
    </div>
  );
}

function WatchlistPanel({ watchlist, onAdd, onDelete, loading }) {
  const [input, setInput] = useState("");
  const [type, setType] = useState("stock");
  const [tradeMode, setTradeMode] = useState("long_term");

  const handleAdd = () => {
    const symbol = input.trim().toUpperCase();
    if (!symbol) return;
    onAdd({ symbol, type, trade_mode: tradeMode });
    setInput("");
  };

  return (
    <section className="panel">
      <div className="panel-label">自選股管理</div>
      <div className="watchlist-add watchlist-add-row1">
        <input
          className="symbol-input-inline"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入股票代號"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
      </div>
      <div className="watchlist-add watchlist-add-row2">
        <select
          className="select-input select-grow"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="stock">個股</option>
          <option value="etf">ETF</option>
        </select>
        <select
          className="select-input select-grow"
          value={tradeMode}
          onChange={(e) => setTradeMode(e.target.value)}
        >
          <option value="long_term">長期</option>
          <option value="day_trade">當沖</option>
        </select>
        <button className="btn-add" onClick={handleAdd}>
          +
        </button>
      </div>

      {loading ? (
        <div className="log-empty">載入中...</div>
      ) : watchlist.length === 0 ? (
        <div className="log-empty">尚未新增自選股</div>
      ) : (
        <ul className="watchlist-list">
          {watchlist.map((item) => (
            <li key={item.id} className="watchlist-item">
              <span className="watchlist-symbol">{item.symbol}</span>
              <span className="watchlist-meta">
                {item.type} / {item.trade_mode}
              </span>
              <button
                className="btn-delete"
                onClick={() => onDelete(item.symbol)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function App() {
  const { user, authStatus } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState({
    watchCount: 0,
    alertCount: 0,
    lastUpdate: "--",
    nextUpdate: "--",
  });

  const addLog = (msg, type = "info") => {
    const time = new Date().toLocaleTimeString("zh-TW", { hour12: false });
    setLogs((prev) => [...prev.slice(-99), { time, msg, type }]);
  };

  const intervalRef = useRef(null);

  // 載入 watchlist
  const loadWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      const { data } = await api.get("/watchlist/");
      setWatchlist(data.watchlist);
    } catch (e) {
      addLog(`載入自選股失敗：${e.message}`, "error");
    } finally {
      setWatchlistLoading(false);
    }
  };

  // 新增自選股
  const handleAddWatchlist = async ({ symbol, type, trade_mode }) => {
    try {
      await api.post("/watchlist/", { symbol, type, trade_mode });
      addLog(`新增 ${symbol}`, "success");
      await loadWatchlist();
    } catch (e) {
      addLog(`新增失敗：${e.message}`, "error");
    }
  };

  // 刪除自選股
  const handleDeleteWatchlist = async (symbol) => {
    try {
      await api.delete(`/watchlist/${symbol}`);
      addLog(`移除 ${symbol}`, "warn");
      await loadWatchlist();
    } catch (e) {
      addLog(`刪除失敗：${e.message}`, "error");
    }
  };

  // 登入後自動載入
  useEffect(() => {
    if (authStatus === "bound") loadWatchlist();
  }, [authStatus]);

  // watchlist 更新後自動重啟監控
  useEffect(() => {
    if (watchlist.length === 0) return;
    const symbols = watchlist.map((w) => w.symbol);
    if (isMonitoring) {
      clearInterval(intervalRef.current);
      fetchQuotes(symbols);
      intervalRef.current = setInterval(() => fetchQuotes(symbols), 60000);
    }
  }, [watchlist]);

  const fetchQuotes = async (list) => {
    try {
      const { data } = await api.get("/stocks/quotes", {
        params: { symbols: list.join(",") },
      });
      const qs = data.quotes.filter((q) => !q.error);
      setQuotes(qs);
      const now = new Date();
      const next = new Date(now.getTime() + 60000);
      setStats({
        watchCount: list.length,
        alertCount: qs.filter((q) => q.limitUp).length,
        lastUpdate: now.toLocaleTimeString("zh-TW", { hour12: false }),
        nextUpdate: next.toLocaleTimeString("zh-TW", { hour12: false }),
      });
    } catch (e) {
      addLog(`取得報價失敗：${e.message}`, "error");
    }
  };

  const handleStart = async () => {
    const list = watchlist.map((w) => w.symbol);
    if (list.length === 0) {
      addLog("請先新增自選股", "warn");
      return;
    }
    setIsMonitoring(true);
    addLog(`開始監控 ${list.length} 檔：${list.join(", ")}`, "success");
    await fetchQuotes(list);
    intervalRef.current = setInterval(() => fetchQuotes(list), 60000);
  };

  const handleStop = () => {
    setIsMonitoring(false);
    clearInterval(intervalRef.current);
    addLog("監控已停止", "warn");
  };

  if (authStatus === "loading") {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>驗證身份中...</p>
      </div>
    );
  }

  if (authStatus === "unbound") {
    return (
      <div className="unbound-screen">
        <div className="unbound-content">
          <div className="unbound-icon">⚡</div>
          <h1>漲停雷達</h1>
          <p>請先透過 LINE 官方帳號完成頁面綁定</p>
          <div className="unbound-steps">
            <div className="step">
              <span className="step-num">1</span>加入 LINE 官方帳號
            </div>
            <div className="step">
              <span className="step-num">2</span>點選「身分登記」
            </div>
            <div className="step">
              <span className="step-num">3</span>點選「頁面綁定」取得連結
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className={`status-dot ${isMonitoring ? "active" : ""}`} />
          <h1 className="logo">
            漲停雷達 <span className="bolt">⚡</span>
          </h1>
          <span className="logo-sub">LIMIT-UP SCANNER</span>
        </div>
        <Clock />
      </header>

      <main className="main">
        <aside className="sidebar">
          <WatchlistPanel
            watchlist={watchlist}
            onAdd={handleAddWatchlist}
            onDelete={handleDeleteWatchlist}
            loading={watchlistLoading}
          />

          <div className="btn-group">
            <button
              className={`btn btn-start ${isMonitoring ? "disabled" : ""}`}
              onClick={handleStart}
              disabled={isMonitoring}
            >
              ▶ 啟動監控
            </button>
            <button
              className={`btn btn-stop ${!isMonitoring ? "disabled" : ""}`}
              onClick={handleStop}
              disabled={!isMonitoring}
            >
              ■ 停止
            </button>
          </div>

          <div className="stats-grid">
            <StatCard value={stats.watchCount} label="監控股票" />
            <StatCard value={stats.alertCount} label="漲停警報" highlight />
            <StatCard value={stats.lastUpdate} label="上次更新" />
            <StatCard value={stats.nextUpdate} label="下次更新" />
          </div>

          <section className="panel">
            <div className="panel-label">系統日誌</div>
            <LogConsole logs={logs} />
          </section>
        </aside>

        <section className="quote-panel">
          <div className="quote-panel-header">
            <span>即時報價</span>
            <span className="quote-count">{quotes.length} 檔</span>
          </div>
          <QuotePanel quotes={quotes} isMonitoring={isMonitoring} />
        </section>
      </main>
    </div>
  );
}
