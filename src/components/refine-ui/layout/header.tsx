import {
  useRefineOptions,
  useActiveAuthProvider,
  useLogout,
} from "@refinedev/core";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle";
import { UserAvatar } from "@/components/refine-ui/layout/user-avatar";
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { translate, useI18n } from "@/i18n";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import BACKEND_BASE_URL from "@/constants";

export const Header = () => {
  const { isMobile } = useSidebar();

  return <>{isMobile ? <MobileHeader /> : <DesktopHeader />}</>;
};

function DesktopHeader() {
  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-16",
        "shrink-0",
        "items-center",
        "gap-4",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-end",
        "z-40"
      )}
    >
      <GlobalSearch />
      <ThemeToggle />
      <LocaleSwitcher />
      <UserDropdown />
    </header>
  );
}

function MobileHeader() {
  const { open, isMobile } = useSidebar();

  const { title } = useRefineOptions();

  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-12",
        "shrink-0",
        "items-center",
        "gap-2",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-between",
        "z-40"
      )}
    >
      <SidebarTrigger
        className={cn("text-muted-foreground", "rotate-180", "ml-1", {
          "opacity-0": open,
          "opacity-100": !open || isMobile,
          "pointer-events-auto": !open || isMobile,
          "pointer-events-none": open && !isMobile,
        })}
      />

      <div
        className={cn(
          "whitespace-nowrap",
          "flex",
          "flex-row",
          "h-full",
          "items-center",
          "justify-start",
          "gap-2",
          "transition-discrete",
          "duration-200",
          {
            "pl-3": !open,
            "pl-5": open,
          }
        )}
      >
        <div>{title.icon}</div>
        <h2
          className={cn(
            "text-sm",
            "font-bold",
            "transition-opacity",
            "duration-200",
            {
              "opacity-0": !open,
              "opacity-100": open,
            }
          )}
        >
          {title.text}
        </h2>
      </div>

      <GlobalSearch />
      <UserDropdown />
      <ThemeToggle className={cn("h-8", "w-8")} />
      <LocaleSwitcher />
    </header>
  );
}

const UserDropdown = () => {
  const { t } = useI18n();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const authProvider = useActiveAuthProvider();

  if (!authProvider?.getIdentity) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            logout();
          }}
        >
          <LogOutIcon
            className={cn("text-destructive", "hover:text-destructive")}
          />
          <span className={cn("text-destructive", "hover:text-destructive")}>
            {isLoggingOut ? t('common.loggingOut') : t('common.logout')}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const change = async (next: 'en' | 'vi') => {
    if (next === locale) return;
    try { await setLocale(next); } catch { toast.error(translate(next, 'errors.PREFERENCE_SAVE_FAILED')); }
  };
  return <div className="flex rounded-md border" aria-label={t('common.language')}>
    <button type="button" aria-pressed={locale === 'en'} className="px-2 py-1 text-sm" onClick={() => change('en')}>{t('common.english')}</button>
    <button type="button" aria-pressed={locale === 'vi'} className="px-2 py-1 text-sm" onClick={() => change('vi')}>{t('common.vietnamese')}</button>
  </div>;
}

function GlobalSearch() {
  const { t } = useI18n(); const [q, setQ] = useState(''); const [rows, setRows] = useState<Array<{ id: string | number; name: string; type: string }>>([]); const [error,setError]=useState(false); const [loading,setLoading]=useState(false);
  useEffect(() => {
    const controller = new AbortController(); setRows([]); setError(false); setLoading(q.trim().length >= 2);
    if (q.trim().length < 2) return () => controller.abort();
    const timer = window.setTimeout(async () => { try {
      const response = await fetch(`${BACKEND_BASE_URL}search?q=${encodeURIComponent(q.trim())}`, { credentials: 'include', signal: controller.signal });
      if (!response.ok) throw new Error(); const data=await response.json(); if(!controller.signal.aborted)setRows(data.data);
    } catch { if(!controller.signal.aborted)setError(true); } finally { if(!controller.signal.aborted)setLoading(false); } }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [q]);
  const resources: Record<string,string> = {class:'classes',subject:'subjects',department:'departments',user:'users'};
  return <div className="relative mr-auto ml-2 min-w-0"><input aria-label={t('dashboard.search')} value={q} onChange={event => setQ(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')setQ('');}} placeholder={t('dashboard.search')} className="w-full max-w-52 border rounded px-2 py-1 text-sm" />{q.trim().length>=2 && <div className="absolute left-0 z-50 mt-1 w-64 max-w-[85vw] max-h-80 overflow-auto rounded border bg-background shadow">{loading?<p className="p-3">{t('common.loading')}</p>:error?<p role="alert" className="p-3">{t('errors.unknown')}</p>:rows.length?<ul>{rows.map(row => <li key={`${row.type}-${row.id}`}><Link className="block px-3 py-2 text-sm hover:bg-muted focus:bg-muted" to={`/${resources[row.type]}/show/${encodeURIComponent(row.id)}`} onClick={()=>setQ('')}>{row.name} <span className="text-muted-foreground">{t(`resources.${resources[row.type]}`)}</span></Link></li>)}</ul>:<p className="p-3">{t('common.noData')}</p>}</div>}</div>;
}

Header.displayName = "Header";
MobileHeader.displayName = "MobileHeader";
DesktopHeader.displayName = "DesktopHeader";
