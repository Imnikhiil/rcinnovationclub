import AdminShell from "@/components/admin/AdminShell";
import RoleGate from "@/components/admin/RoleGate";
import SubscribersManager from "@/components/admin/SubscribersManager";

export default function SubscribersPage() {
  return (
    <AdminShell>
      <RoleGate roles={["super", "membership"]}>
        <SubscribersManager />
      </RoleGate>
    </AdminShell>
  );
}