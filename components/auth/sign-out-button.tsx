"use client";

import { Loader2, LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      disabled={pending}
      onClick={async () => {
        setPending(true);

        const { error } = await supabase.auth.signOut();

        if (error) {
          toast.error("Impossible de fermer la session.", {
            description: "Reessayez dans un instant.",
          });
          setPending(false);
          return;
        }

        toast.success("Session fermee.");
        router.replace("/login");
        router.refresh();
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Se deconnecter
    </Button>
  );
}
