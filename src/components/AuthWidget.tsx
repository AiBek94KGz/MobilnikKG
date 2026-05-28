"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useStore } from "@/context/store-context";

interface AuthWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthWidget({ isOpen, onClose }: AuthWidgetProps) {
  const { data: session } = useSession();
  const store = useStore();
  const [authMethod, setAuthMethod] = useState<null | "email" | "telegram">(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authInputValue, setAuthInputValue] = useState(""); // For telegram simulation
  const [tgAuthSessionCode, setTgAuthSessionCode] = useState<string | null>(null);
  const [isPollingTgAuth, setIsPollingTgAuth] = useState(false);

  useEffect(() => {
    if (authMethod === "telegram") {
      const generatedCode = "AUTH_" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setTgAuthSessionCode(generatedCode);
      setIsPollingTgAuth(true);
    } else {
      setTgAuthSessionCode(null);
      setIsPollingTgAuth(false);
    }
  }, [authMethod]);

  useEffect(() => {
    if (!isPollingTgAuth || !tgAuthSessionCode) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/tg-poll?code=${tgAuthSessionCode}`);
        const data = await res.json();
        
        if (data.success && data.verified) {
          clearInterval(intervalId);
          setIsPollingTgAuth(false);
          // Pass telegramId if available, fallback to username
          const identifier = data.telegramId || data.username;
          store.loginTelegram(identifier);
          setAuthMethod(null);
          onClose();
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isPollingTgAuth, tgAuthSessionCode, store, onClose]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // Pass password as well
      store.loginEmail(email.trim(), password.trim());
      onClose();
    }
  };

  const handleTelegramSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (authInputValue.trim()) {
      store.loginTelegram(authInputValue.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal open" id="auth-modal">
      <div className="modal-header">
        <h3>Аутентификация</h3>
        <span className="drawer-close" onClick={() => {
          onClose();
          setAuthMethod(null);
          setAuthInputValue("");
        }}>&times;</span>
      </div>
      <div className="modal-content">
        <div style={{ marginBottom: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", backgroundColor: "var(--background)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
          {session?.user ? (
            <div>
              <p><strong>Пользователь:</strong> {session.user.name}</p>
              <p><strong>ID Индекс:</strong> <code style={{ backgroundColor: "var(--accent)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem" }}>{(session.user as any).userIndex}</code></p>
              <p><strong>Уровень:</strong> {((session.user as any).role || "client").toUpperCase()}</p>
              <button onClick={() => {
                store.logout();
                setAuthMethod(null);
                setAuthInputValue("");
              }} style={{ color: "var(--danger)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline", marginTop: "0.5rem", display: "block" }}>
                Выйти из профиля
              </button>
            </div>
          ) : (
            <div>Войдите, чтобы сайт определил ваш уровень доступа для показа цен и функций администрирования.</div>
          )}
        </div>
        
        {!session?.user && (
          <>
            {authMethod === "email" && (
              <form onSubmit={handleEmailLogin}>
                <div className="form-group">
                  <label htmlFor="auth-email">Email адрес</label>
                  <input
                    type="email"
                    id="auth-email"
                    className="form-input"
                    placeholder="mail@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="auth-password">Пароль</label>
                  <input
                    type="password"
                    id="auth-password"
                    className="form-input"
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px", display: "block" }}>
                    Для новых клиентов пароль не требуется. Для админов и магазинов — обязателен.
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" }} onClick={() => { setAuthMethod(null); setEmail(""); setPassword(""); }}>
                    Назад
                  </button>
                  <button type="submit" className="btn-submit" style={{ flex: 1, marginTop: 0, padding: "0.5rem" }}>
                    Войти
                  </button>
                </div>
              </form>
            )}

            {authMethod === null && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <button 
                  className="tg-login-btn" 
                  style={{ 
                    display: "flex", alignItems: "center", justifyContent: "center", 
                    background: "#0088cc", color: "#ffffff", padding: "0.8rem", 
                    borderRadius: "8px", cursor: "pointer", fontWeight: 600, border: "none" 
                  }} 
                  onClick={() => { setAuthMethod("telegram"); }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "10px" }}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.03.22z"/>
                  </svg>
                  Войти через Telegram
                </button>

                <button className="google-login-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", padding: "0.8rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }} onClick={() => { setAuthMethod("email"); setEmail(""); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "10px" }}>
                    <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.4-2.4C17.3 1.7 14.9 1 12.24 1c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.73 0 9.54-4.03 9.54-9.71 0-.66-.08-1.3-.23-1.85a42.92 42.92 0 0 0-9.31-.155z"/>
                  </svg>
                  Войти по Email
                </button>
              </div>
            )}

            {authMethod === "telegram" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "rgba(0, 136, 204, 0.08)", border: "1px solid rgba(0, 136, 204, 0.2)", borderRadius: "8px", padding: "1rem", color: "var(--text-primary)" }}>
                  <h4 style={{ margin: "0 0 0.5rem 0", color: "#0088cc", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.95rem" }}>
                    Войти через Telegram-бота
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.8rem", lineHeight: "1.5", color: "var(--text-secondary)" }}>
                    <li>Нажмите синюю кнопку <b>«Открыть Telegram»</b> ниже</li>
                    <li>В чате с ботом нажмите <b>«Запустить»</b> (или кнопку <b>Start</b>)</li>
                    <li>После этого страница автоматически обновится</li>
                  </ol>
                </div>

                {tgAuthSessionCode ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
                    <a 
                      href={`https://t.me/MobilnikKGBot?start=${tgAuthSessionCode}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="tg-login-btn" 
                      style={{ 
                        display: "flex", alignItems: "center", justifyContent: "center", 
                        background: "#0088cc", color: "#ffffff", padding: "0.85rem 1.5rem", 
                        borderRadius: "8px", cursor: "pointer", fontWeight: 600, border: "none",
                        textDecoration: "none", width: "100%", textAlign: "center",
                        boxShadow: "0 4px 12px rgba(0,136,204,0.3)", transition: "all 0.2s"
                      }}
                    >
                      Открыть Telegram
                    </a>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    Генерация ссылки авторизации...
                  </div>
                )}

                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed var(--border)" }}>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.5rem", textAlign: "center", textTransform: "uppercase", letterSpacing: "1px" }}>Быстрый вход (Платформа):</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
                    <button onClick={() => store.loginTelegram("M4328912312")} style={{ fontSize: "0.65rem", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600 }}>Магазин (M)</button>
                    <button onClick={() => store.loginTelegram("O775123456")} style={{ fontSize: "0.65rem", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600 }}>Оптовик (O)</button>
                    <button onClick={() => store.loginTelegram("C995506066")} style={{ fontSize: "0.65rem", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600 }}>Клиент (C)</button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" }} onClick={() => { setAuthMethod(null); setAuthInputValue(""); }}>
                    Назад
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
