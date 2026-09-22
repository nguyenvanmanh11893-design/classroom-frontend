import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import type { I18nProvider } from "@refinedev/core";
import { useGetIdentity } from "@refinedev/core";
import en from "./locales/en";
import vi from "./locales/vi";
import BACKEND_BASE_URL from "@/constants";

export type Locale = "en" | "vi";
type Dictionary = Record<string, unknown>;
const dictionaries: Record<Locale, Dictionary> = { en, vi };
const storageKey = "classroom.locale";
const apiBase = BACKEND_BASE_URL;

function readPath(source: Dictionary, key: string): unknown {
  return key.split(".").reduce<unknown>((value, part) => value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined, source);
}

export function translate(locale: Locale, key: string, params: Record<string, unknown> = {}, fallback?: string): string {
  let value: unknown = readPath(dictionaries[locale], key) ?? readPath(en, key) ?? fallback ?? key;
  if (typeof value === "object" && value) value = (Number(params.count) === 1 ? (value as Dictionary).one : (value as Dictionary).other) ?? (value as Dictionary).other;
  return String(value).replace(/{{(\w+)}}/g, (_match, name) => String(params[name] ?? ""));
}
export function translateError(code?: string, fallback?: string): string {
  const locale: Locale = localStorage.getItem(storageKey) === "vi" ? "vi" : "en";
  const key = `errors.${code ?? "unknown"}`;
  const mapped = translate(locale, key);
  return mapped === key ? translate(locale, "errors.unknown", {}, fallback) : mapped;
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale, options?: { persistProfile?: boolean }) => Promise<void>;
  t: (key: string, params?: Record<string, unknown>, fallback?: string) => string;
  formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  applyProfileLocale: (locale: Locale, accountId: string) => void;
};
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setCurrentLocale] = useState<Locale>(() => localStorage.getItem(storageKey) === "vi" ? "vi" : "en");
  const accountRef = useRef<string | undefined>(undefined);
  const manualRef = useRef(false);
  const setLocale = useCallback(async (next: Locale, options: { persistProfile?: boolean } = {}) => {
    setCurrentLocale(next); localStorage.setItem(storageKey, next); if (options.persistProfile !== false) manualRef.current = true;
    if (options.persistProfile !== false) {
      const response = await fetch(`${apiBase.endsWith("/") ? apiBase : `${apiBase}/`}users/me/preferences`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferredLocale: next }),
      });
      if (!response.ok) throw new Error("PREFERENCE_SAVE_FAILED");
    }
  }, []);
  const applyProfileLocale = useCallback((next: Locale, accountId: string) => {
    if (accountRef.current !== accountId) { accountRef.current = accountId; manualRef.current = false; }
    if (!manualRef.current) { setCurrentLocale(next); localStorage.setItem(storageKey, next); }
  }, []);
  const value = useMemo<I18nContextValue>(() => ({
    locale, setLocale, t: (key, params, fallback) => translate(locale, key, params, fallback),
    formatDate: (value, options) => new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { timeZone: "Asia/Bangkok", ...options }).format(new Date(value)),
    formatNumber: (value, options) => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", options).format(value),
    applyProfileLocale,
  }), [locale, setLocale, applyProfileLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() { const value = useContext(I18nContext); if (!value) throw new Error("I18nProvider is required"); return value; }
export function ProfileLocaleSync() {
  const { data } = useGetIdentity<{ id: string; preferredLocale?: Locale }>();
  const { applyProfileLocale } = useI18n();
  useEffect(() => { if (data?.id) applyProfileLocale(data.preferredLocale === "vi" ? "vi" : "en", data.id); }, [data?.id, data?.preferredLocale, applyProfileLocale]);
  return null;
}
export function useRefineI18nProvider(): I18nProvider {
  const { locale, setLocale, t } = useI18n();
  return useMemo(() => ({
    getLocale: () => locale,
    changeLocale: async (next: string) => { if (next === "en" || next === "vi") await setLocale(next); },
    translate: (key: string, params?: Record<string, unknown>, fallback?: string) => t(key, params, fallback),
  }), [locale, setLocale, t]);
}
