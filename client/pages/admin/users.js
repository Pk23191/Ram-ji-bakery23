import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminGuard from "../../components/AdminGuard";
import Seo from "../../components/Seo";
import Sidebar from "../../components/admin/Sidebar";
import SectionHeader from "../../components/SectionHeader";
import api from "../../utils/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted");
      loadUsers();
    } catch (err) {
      toast.error("Unable to delete user");
    }
  };

  return (
    <AdminGuard>
      <Seo title="Users - Admin" path="/admin/users" />
      <section className="section-shell py-12">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside>
            <Sidebar />
          </aside>
          <main>
            <SectionHeader eyebrow="Users" title="All users" description="View and manage registered users." />

            <div className="mt-6 rounded-lg border bg-white/85 p-4">
              <div className="w-full overflow-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-left text-xs text-mocha/60">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-t">
                        <td className="p-3 align-top">{u.name || u.fullName || "-"}</td>
                        <td className="p-3 align-top">{u.email || u.username || "-"}</td>
                        <td className="p-3 align-top">
                          <div className="flex gap-2">
                            <button className="rounded-full border border-rose/30 px-3 py-2 text-sm font-semibold text-rose-600" onClick={() => handleDelete(u._id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </section>
    </AdminGuard>
  );
}
