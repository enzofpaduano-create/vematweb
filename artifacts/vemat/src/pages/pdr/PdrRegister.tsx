import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import RegisterView from "@/components/register/RegisterView";
import { PDR_ACCENT } from "@/components/register/registerContext";
import { supabasePdr } from "@/lib/supabase";
import { usePdrAuth } from "@/contexts/PdrAuthContext";

export default function PdrRegister() {
  const { user } = usePdrAuth();
  return (
    <PdrGuard>
      <PdrLayout>
        <RegisterView ctx={{ portal: "pdr", sb: supabasePdr, userEmail: user?.email ?? null, base: "/espace-pdr", accent: PDR_ACCENT }} />
      </PdrLayout>
    </PdrGuard>
  );
}
