"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      aria-label="Sign out"
      className="rounded-md p-1.5 text-navy-200 hover:bg-navy-700 hover:text-white"
    >
      <LogOut size={16} />
    </button>
  );
}
