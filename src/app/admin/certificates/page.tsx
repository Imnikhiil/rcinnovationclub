import AdminShell from "@/components/admin/AdminShell";
import RoleGate from "@/components/admin/RoleGate";
import CertificatesManager from "@/components/admin/CertificatesManager";

export default function CertificatesPage() {
  return (
    <AdminShell>
      <RoleGate roles={["super", "membership"]}>
        <CertificatesManager />
      </RoleGate>
    </AdminShell>
  );
}