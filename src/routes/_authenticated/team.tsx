import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Loader2, MailPlus, Shield, Trash2, UserRoundCog, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { asRecord, str } from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team – ZunftEcho" },
      {
        name: "description",
        content: "Mitarbeiter einladen und Rollen im ZunftEcho-Arbeitsbereich verwalten.",
      },
    ],
  }),
  component: TeamPage,
});

type TeamMember = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  is_current_user: boolean;
};

const roleLabels: Record<string, string> = {
  owner: "Eigentümer",
  admin: "Administrator",
  member: "Mitarbeiter",
};

function initials(member: TeamMember) {
  const label = member.full_name || member.email || "?";
  return label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [myRole, setMyRole] = useState("member");
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadTeam() {
    const [{ data: userData }, membersResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase.rpc("get_team_members"),
    ]);

    if (membersResult.error) {
      setError(`Team konnte nicht geladen werden: ${membersResult.error.message}`);
      setMembers([]);
      setLoading(false);
      return;
    }

    const loaded = (membersResult.data ?? []) as TeamMember[];
    setMembers(loaded);
    setMyRole(loaded.find((member) => member.user_id === userData.user?.id)?.role ?? "member");
    setLoading(false);
  }

  useEffect(() => {
    void loadTeam();
  }, []);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inviting || !inviteEmail.trim()) return;

    setInviting(true);
    setError(null);
    setSuccess(null);
    setInviteUrl("");

    const { data, error: inviteError } = await supabase.rpc("create_company_invite", {
      p_email: inviteEmail.trim(),
      p_role: inviteRole,
      p_expires_days: 7,
    });
    setInviting(false);

    if (inviteError) {
      setError(`Einladung konnte nicht erstellt werden: ${inviteError.message}`);
      return;
    }

    const payload = asRecord(data);
    setInviteUrl(str(payload["invite_url"]) ?? "");
    setSuccess("Einladung wurde erstellt und per E-Mail in die Versandwarteschlange gestellt.");
    setInviteEmail("");
  }

  async function handleRoleChange(userId: string, role: string) {
    setBusyUserId(userId);
    setError(null);
    setSuccess(null);
    const { error: roleError } = await supabase.rpc("set_team_member_role", {
      p_user_id: userId,
      p_role: role,
    });
    setBusyUserId(null);
    if (roleError) {
      setError(`Rolle konnte nicht geändert werden: ${roleError.message}`);
      return;
    }
    setMembers((current) =>
      current.map((member) => (member.user_id === userId ? { ...member, role } : member)),
    );
    setSuccess("Rolle wurde aktualisiert.");
  }

  async function handleRemove(userId: string) {
    setBusyUserId(userId);
    setError(null);
    setSuccess(null);
    const { error: removeError } = await supabase.rpc("remove_company_member", {
      p_user_id: userId,
    });
    setBusyUserId(null);
    setPendingRemoval(null);
    if (removeError) {
      setError(`Teammitglied konnte nicht entfernt werden: ${removeError.message}`);
      return;
    }
    setMembers((current) => current.filter((member) => member.user_id !== userId));
    setSuccess("Teammitglied wurde aus dem Arbeitsbereich entfernt.");
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const canAdminister = myRole === "owner" || myRole === "admin";

  return (
    <AppShell>
      <PageHeader
        title="Team und Benutzer"
        description="Laden Sie Mitarbeiter ein und steuern Sie, wer Konfigurationen ändern darf."
      />

      {error ? (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" /> Aktive Teammitglieder
            </CardTitle>
            <CardDescription>
              Eigentümer verwalten Rollen; Administratoren können Mitglieder einladen und entfernen.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {loading ? (
              <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Team wird geladen …
              </p>
            ) : members.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Keine Teammitglieder gefunden.
              </p>
            ) : (
              members.map((member) => (
                <div key={member.user_id} className="flex flex-wrap items-center gap-3 py-4">
                  <Avatar>
                    <AvatarFallback>{initials(member)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {member.full_name || member.email || "Teammitglied"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email || "Keine E-Mail"}
                    </p>
                  </div>
                  {member.is_current_user ? <Badge variant="secondary">Sie</Badge> : null}
                  {member.role === "owner" || myRole !== "owner" || member.is_current_user ? (
                    <Badge variant="outline">{roleLabels[member.role] ?? member.role}</Badge>
                  ) : (
                    <Select
                      value={member.role}
                      disabled={busyUserId === member.user_id}
                      onValueChange={(role) => void handleRoleChange(member.user_id, role)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="member">Mitarbeiter</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {canAdminister && !member.is_current_user && member.role !== "owner" ? (
                    pendingRemoval === member.user_id ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyUserId === member.user_id}
                          onClick={() => void handleRemove(member.user_id)}
                        >
                          Entfernen
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setPendingRemoval(null)}>
                          Abbrechen
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Teammitglied entfernen"
                        onClick={() => setPendingRemoval(member.user_id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailPlus className="size-5" /> Teammitglied einladen
            </CardTitle>
            <CardDescription>Die Einladung ist sieben Tage gültig.</CardDescription>
          </CardHeader>
          <CardContent>
            {canAdminister ? (
              <form className="space-y-4" onSubmit={handleInvite}>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">E-Mail-Adresse</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Rolle</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Mitarbeiter</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={inviting}>
                  {inviting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MailPlus className="size-4" />
                  )}
                  Einladung senden
                </Button>
                {inviteUrl ? (
                  <div className="space-y-2 rounded-md border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      Falls die E-Mail verzögert ist, können Sie den Link direkt weitergeben.
                    </p>
                    <Button type="button" variant="outline" className="w-full" onClick={copyInvite}>
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied ? "Kopiert" : "Einladungslink kopieren"}
                    </Button>
                  </div>
                ) : null}
              </form>
            ) : (
              <div className="flex gap-3 rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                <Shield className="mt-0.5 size-4 shrink-0" />
                Nur Eigentümer und Administratoren können Einladungen erstellen.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRoundCog className="size-4" /> Rollen im Überblick
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            ["Eigentümer", "Vollzugriff inklusive Rollenverwaltung."],
            ["Administrator", "Konfiguration, Einladungen und operative Bearbeitung."],
            [
              "Mitarbeiter",
              "Operative Daten ansehen und bearbeiten, ohne kritische Konfiguration.",
            ],
          ].map(([title, description]) => (
            <div key={title} className="rounded-md border p-4">
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
