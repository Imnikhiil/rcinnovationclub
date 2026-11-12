import AdminShell from "@/components/admin/AdminShell";
import RoleGate from "@/components/admin/RoleGate";
import ContentHub from "@/components/admin/ContentHub";

export default function ContentPage() {
  return (
    <AdminShell>
      <RoleGate roles={["super", "content"]}>
        <ContentHub />
      </RoleGate>
    </AdminShell>
  );
}