import { SavGuard } from "./SavGuard";
import { SavLayout } from "./SavLayout";
import RegisterView from "@/components/register/RegisterView";
import { SAV_ACCENT } from "@/components/register/registerContext";
import { supabaseSav } from "@/lib/supabase";
import { useSavAuth } from "@/contexts/SavAuthContext";

export default function SavRegister() {
  const { user } = useSavAuth();
  return (
    <SavGuard>
      <SavLayout>
        <RegisterView ctx={{ portal: "sav", sb: supabaseSav, userEmail: user?.email ?? null, base: "/espace-sav", accent: SAV_ACCENT }} />
      </SavLayout>
    </SavGuard>
  );
}
