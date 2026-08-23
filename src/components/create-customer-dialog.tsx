import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCustomer, type CreatedCustomer } from "@/lib/customers";

type Props = {
  companyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (customer: CreatedCustomer) => void | Promise<void>;
};

const emptyForm = {
  display_name: "",
  phone: "",
  email: "",
  address: "",
  postal_code: "",
  preferred_language: "de",
};

export function CreateCustomerDialog({ companyId, open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setError(null);
    if (!companyId) {
      setError("Ihrem Konto ist noch kein Betrieb zugeordnet.");
      return;
    }
    if (!form.display_name.trim()) {
      setError("Bitte einen Kundennamen angeben.");
      return;
    }

    setSaving(true);
    const result = await createCustomer(companyId, form);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setForm(emptyForm);
    onOpenChange(false);
    await onCreated?.(result.customer);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setForm(emptyForm);
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kunde anlegen</DialogTitle>
          <DialogDescription>
            Legt einen echten Kundenstammsatz an. Die Kundennummer wird automatisch vergeben.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="customer-name">Name *</Label>
            <Input
              id="customer-name"
              value={form.display_name}
              onChange={(event) => update("display_name", event.target.value)}
              placeholder="z. B. Familie Müller"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Telefon</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email">E-Mail</Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-address">Adresse</Label>
            <Input
              id="customer-address"
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="customer-plz">PLZ</Label>
              <Input
                id="customer-plz"
                value={form.postal_code}
                onChange={(event) => update("postal_code", event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-language">Sprache</Label>
              <Select
                value={form.preferred_language}
                onValueChange={(value) => update("preferred_language", value)}
              >
                <SelectTrigger id="customer-language">
                  <SelectValue placeholder="Sprache wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">Englisch</SelectItem>
                  <SelectItem value="tr">Türkisch</SelectItem>
                  <SelectItem value="ar">Arabisch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving || !form.display_name.trim()}>
            {saving ? "Wird angelegt …" : "Kunde anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
