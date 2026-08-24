import AdminConsole from "../../components/AdminConsole";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}
