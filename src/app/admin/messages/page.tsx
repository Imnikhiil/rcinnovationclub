import AdminShell from "@/components/admin/AdminShell";
import RoleGate from "@/components/admin/RoleGate";
import MessagesManager from "@/components/admin/MessagesManager";

export default function MessagesPage() {
  return (
    <AdminShell>
      <RoleGate roles={["super", "membership"]}>
        <MessagesManager />
      </RoleGate>
    </AdminShell>
  );
}