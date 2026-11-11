import AdminShell from "@/components/admin/AdminShell";
import RoleGate from "@/components/admin/RoleGate";
import ApplicationsManager from "@/components/admin/ApplicationsManager";

export default function ApplicationsPage() {
  return (
    <AdminShell>
      <RoleGate roles={["super", "membership"]}>
        <ApplicationsManager />
      </RoleGate>
    </AdminShell>
  );
}