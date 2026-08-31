import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bot,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardList,
  Contact,
  CreditCard,
  FileText,
  CircleHelp,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  PlugZap,
  Receipt,
  Settings,
  UserRoundCog,
  Users,
} from "lucide-react";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";

import { GlobalSearch } from "@/components/global-search";
import { BrandMark } from "@/components/brand-mark";
import { NotificationsBell } from "@/components/notifications-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { applyStoredTheme, applyTheme } from "@/lib/theme";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/unternehmen", label: "Unternehmensprofil", icon: Building2 },
  { to: "/ki-mitarbeiter", label: "KI-Mitarbeiter", icon: Bot },
  { to: "/installation", label: "Widget installieren", icon: PlugZap },
  { to: "/team", label: "Team und Benutzer", icon: UserRoundCog },
  { to: "/hilfe", label: "Hilfe und Support", icon: CircleHelp },
  { to: "/konversationen", label: "Konversationen", icon: MessageSquare },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/kunden", label: "Kunden", icon: Contact },
  { to: "/angebote", label: "Angebote", icon: FileText },
  { to: "/auftraege", label: "Aufträge", icon: ClipboardList },
  { to: "/rechnungen", label: "Rechnungen", icon: Receipt },
  { to: "/abonnement", label: "Abo und Zahlungen", icon: CreditCard },
  { to: "/aufgaben", label: "Aufgaben", icon: CheckSquare },
  { to: "/termine", label: "Termine", icon: Calendar },
  { to: "/einstellungen", label: "Einstellungen", icon: Settings },
] as const;

const byPath = <T extends (typeof navigation)[number]["to"]>(path: T) =>
  navigation.find((item) => item.to === path)!;

const navigationSections = [
  { label: "Übersicht", items: [byPath("/dashboard")] },
  {
    label: "Kundenkontakt",
    items: [byPath("/konversationen"), byPath("/leads"), byPath("/kunden")],
  },
  {
    label: "Geschäft",
    items: [
      byPath("/angebote"),
      byPath("/auftraege"),
      byPath("/rechnungen"),
      byPath("/abonnement"),
      byPath("/aufgaben"),
      byPath("/termine"),
    ],
  },
  {
    label: "Konfiguration",
    items: [
      byPath("/unternehmen"),
      byPath("/ki-mitarbeiter"),
      byPath("/installation"),
      byPath("/team"),
      byPath("/einstellungen"),
      byPath("/hilfe"),
    ],
  },
] as const;

const mobileNavigation = [
  byPath("/dashboard"),
  byPath("/konversationen"),
  byPath("/leads"),
  byPath("/kunden"),
  byPath("/termine"),
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [profileDraft, setProfileDraft] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  useLayoutEffect(() => {
    applyStoredTheme();
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setEmail(user?.email ?? null);
      setUserId(user?.id ?? null);
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, preferences")
        .eq("id", user.id)
        .maybeSingle();
      const name = profile?.full_name?.trim() ?? "";
      setFullName(name);
      setProfileDraft(name);
      const profilePreferences =
        profile?.preferences && typeof profile.preferences === "object"
          ? (profile.preferences as Record<string, unknown>)
          : null;
      if (profilePreferences && typeof profilePreferences["dark_mode"] === "boolean") {
        applyTheme(profilePreferences["dark_mode"]);
      }
    });
  }, []);

  async function saveProfile() {
    if (!userId || !profileDraft.trim()) return;
    setProfileSaving(true);
    setProfileNotice(null);
    const name = profileDraft.trim().slice(0, 120);
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", userId);
    setProfileSaving(false);
    if (error) {
      setProfileNotice("Profil konnte nicht gespeichert werden.");
      return;
    }
    setFullName(name);
    setProfileNotice("Profil gespeichert.");
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start flex-col overflow-y-auto bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <span className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white/95 p-0.5 shadow-sm">
            <BrandMark className="size-9" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">ZunftEcho</span>
        </div>

        <nav className="flex-1 space-y-4 p-3">
          {navigationSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
                {section.label}
              </p>
              {section.items.map((item) => {
                const active = pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 lg:hidden"
                aria-label="Gesamtes Menü öffnen"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[min(22rem,88vw)] flex-col overflow-y-auto p-0"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Hauptnavigation</SheetTitle>
              </SheetHeader>
              <div className="flex h-16 shrink-0 items-center gap-2 border-b bg-sidebar px-5 text-sidebar-foreground">
                <span className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white/95 p-0.5 shadow-sm">
                  <BrandMark className="size-9" />
                </span>
                <span className="font-display text-lg font-semibold">ZunftEcho</span>
              </div>
              <nav className="flex-1 space-y-4 p-3">
                {navigationSections.map((section) => (
                  <div key={section.label} className="space-y-1">
                    <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      {section.label}
                    </p>
                    {section.items.map((item) => {
                      const active = pathname.startsWith(item.to);
                      return (
                        <SheetClose key={item.to} asChild>
                          <Link
                            to={item.to}
                            className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-foreground/75 hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <item.icon className="size-4" />
                            {item.label}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </div>
                ))}
              </nav>
              <div className="flex flex-wrap gap-3 border-t p-4 text-xs text-muted-foreground">
                <SheetClose asChild>
                  <Link to="/impressum">Impressum</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/datenschutz">Datenschutz</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/agb">AGB</Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2 lg:hidden">
            <BrandMark className="size-8 shrink-0 rounded-lg" />
            <span className="hidden truncate font-display font-semibold min-[390px]:inline">
              ZunftEcho
            </span>
          </Link>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            <NotificationsBell />

            <Badge variant="secondary" className="hidden sm:inline-flex">
              KI aktiv
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto gap-2 px-1.5 py-1"
                  aria-label="Kontomenü öffnen"
                >
                  <Avatar className="size-8">
                    <AvatarFallback>{(email ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden max-w-48 text-left text-xs leading-tight sm:block">
                    <p className="truncate font-medium">{fullName || email || "Angemeldet"}</p>
                    <p className="truncate text-muted-foreground">{email ?? "ZunftEcho Konto"}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-1rem))] p-2">
                <DropdownMenuLabel>Konto und Profil</DropdownMenuLabel>
                <div className="space-y-2 px-2 pb-2" onKeyDown={(event) => event.stopPropagation()}>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                  <Input
                    value={profileDraft}
                    onChange={(event) => setProfileDraft(event.target.value)}
                    placeholder="Vollständiger Name"
                    maxLength={120}
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => void saveProfile()}
                    disabled={profileSaving || !profileDraft.trim()}
                  >
                    {profileSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                    Profil speichern
                  </Button>
                  {profileNotice ? (
                    <p className="text-xs text-muted-foreground">{profileNotice}</p>
                  ) : null}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/einstellungen">
                    <Settings className="size-4" /> Alle Einstellungen
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => void handleSignOut()}
                >
                  <LogOut className="size-4" /> Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 pt-5 pb-24 sm:py-6 lg:px-8 lg:py-8">{children}</main>

        <footer className="hidden items-center justify-end gap-4 border-t bg-card px-8 py-3 text-xs text-muted-foreground lg:flex">
          <Link to="/impressum" className="hover:text-foreground">
            Impressum
          </Link>
          <Link to="/datenschutz" className="hover:text-foreground">
            Datenschutz
          </Link>
          <Link to="/agb" className="hover:text-foreground">
            AGB
          </Link>
        </footer>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-20px_rgba(15,23,42,0.7)] backdrop-blur lg:hidden">
          {mobileNavigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-2 text-[10px] text-muted-foreground data-[status=active]:font-medium data-[status=active]:text-primary"
            >
              <item.icon className="size-4" />
              {item.label.split(" ")[0]}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
