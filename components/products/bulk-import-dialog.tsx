"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { BulkProductInput } from "@/lib/types";
import { bulkImportSchema, type BulkImportFormValues } from "@/lib/validators/product";

function parseLineCSV(payload: string): BulkProductInput[] {
  const lines = payload
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) throw new Error("Le CSV doit contenir un en-tete et au moins une ligne produit.");

  const headers = lines[0].split(",").map((item) => item.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((item) => item.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, cols[index] ?? ""]));
    return {
      name: row.name,
      description: row.description,
      category: row.category,
      price: row.price ? Number(row.price) : null,
      currency: row.currency || "MAD",
      stock_status: (row.stock_status as BulkProductInput["stock_status"]) || "in_stock",
      variants: row.variants ? row.variants.split("|").map((item) => item.trim()).filter(Boolean) : [],
    };
  });
}

function parseBulkPayload(payload: string): BulkProductInput[] {
  const trimmed = payload.trim();

  if (trimmed.startsWith("[")) {
    const data = JSON.parse(trimmed);
    if (!Array.isArray(data)) throw new Error("Le JSON doit etre un tableau.");
    return data.map((item) => ({
      name: String(item.name ?? ""),
      description: item.description ? String(item.description) : "",
      category: item.category ? String(item.category) : "",
      price: item.price == null ? null : Number(item.price),
      currency: item.currency ? String(item.currency) : "MAD",
      stock_status: (item.stock_status as BulkProductInput["stock_status"]) ?? "in_stock",
      variants: Array.isArray(item.variants) ? item.variants.map(String) : [],
    }));
  }

  return parseLineCSV(trimmed);
}

const csvTemplate = `name,description,category,price,currency,stock_status,variants
Djellaba safran,Djellaba satin premium,Djellabas,459,MAD,in_stock,Taille M|Taille L
Sac cuir sable,Sac structure a finitions dorees,Sacs,329,MAD,low_stock,Unique`;

export function BulkImportDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (items: BulkProductInput[]) => Promise<void>;
  isSubmitting: boolean;
}) {
  const form = useForm<BulkImportFormValues>({
    resolver: zodResolver(bulkImportSchema),
    defaultValues: { payload: "" },
  });
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<BulkProductInput[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setItems([]);
      setSuccessCount(0);
      form.reset({ payload: "" });
    }
  }, [form, open]);

  function downloadTemplate() {
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "zakbot-produits-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function nextStep(values: BulkImportFormValues) {
    try {
      const parsed = parseBulkPayload(values.payload);
      setItems(parsed);
      setStep(2);
    } catch (error) {
      form.setError("payload", {
        type: "validate",
        message: error instanceof Error ? error.message : "Format invalide.",
      });
    }
  }

  async function confirmImport() {
    await onSubmit(items);
    setSuccessCount(items.length);
    setStep(3);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importer en masse</DialogTitle>
          <DialogDescription>
            Importez vos produits en 3 etapes : modele, verification, confirmation.
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form className="space-y-4" onSubmit={form.handleSubmit(nextStep)}>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="mb-2 font-medium">Etape 1 : preparez vos produits</div>
              <p className="mb-4 text-sm text-muted-foreground">
                Telechargez le modele CSV ou collez un tableau JSON/CSV dans le champ ci-dessous.
              </p>
              <Button type="button" variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4" />
                Telecharger le modele CSV
              </Button>
            </div>
            <FormField label="JSON ou CSV" error={form.formState.errors.payload?.message}>
              <Textarea
                {...form.register("payload")}
                className="min-h-[260px] font-mono text-xs"
                placeholder={csvTemplate}
              />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">
                <Upload className="h-4 w-4" />
                Verifier les lignes
              </Button>
            </DialogFooter>
          </form>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="font-medium">Etape 2 : apercu de l&apos;import</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Verifiez les {Math.min(items.length, 10)} premieres lignes avant de confirmer.
              </p>
            </div>
            <div className="max-h-[320px] overflow-auto rounded-2xl border border-border/70">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Categorie</th>
                    <th className="px-4 py-3">Prix</th>
                    <th className="px-4 py-3">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 10).map((item, index) => (
                    <tr key={`${item.name}-${index}`} className="border-t border-border/70">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.category || "-"}</td>
                      <td className="px-4 py-3">{item.price ?? "-"}</td>
                      <td className="px-4 py-3">{item.stock_status ?? "in_stock"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button type="button" onClick={confirmImport} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Importer {items.length} produits
              </Button>
            </DialogFooter>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/8 p-6 text-center">
              <div className="font-medium text-primary">Import termine</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {successCount} produits ont ete importes. Pensez a mettre a jour votre assistant.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
