import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Search, SlidersHorizontal, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

const users = [
  { name: "Olivia Rhye", email: "olivia@university.edu", role: "admin", status: "active", joined: "Sep 12, 2025" },
  { name: "Phoenix Baker", email: "phoenix@university.edu", role: "teacher", status: "active", joined: "Sep 18, 2025" },
  { name: "Lana Steiner", email: "lana@university.edu", role: "student", status: "active", joined: "Oct 02, 2025" },
  { name: "Demi Wilkinson", email: "demi@university.edu", role: "student", status: "inactive", joined: "Oct 09, 2025" },
  { name: "Candice Wu", email: "candice@university.edu", role: "teacher", status: "active", joined: "Oct 11, 2025" },
];

const roleStyles: Record<string, string> = {
  admin: "bg-violet-50 text-violet-700 border-violet-200",
  teacher: "bg-blue-50 text-blue-700 border-blue-200",
  student: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function UsersList() {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  return (
    <ListView className="gap-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Administration</p><h1 className="page-title">Users</h1><p className="mt-1 text-sm text-muted-foreground">Manage access and permissions across your classroom.</p></div>
        <button className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm sm:block">Add user</button>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3 border-b p-4">
            <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" className="pl-9" /></div>
            <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-6 py-3">User</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Joined</th><th className="px-6 py-3 text-right">Action</th></tr></thead><tbody className="divide-y">{filtered.map((user) => <tr key={user.email} className="hover:bg-muted/20"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{user.name.split(" ").map((part) => part[0]).join("")}</div><div><p className="font-semibold">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div></div></td><td className="px-6 py-4"><Badge variant="outline" className={roleStyles[user.role]}>{user.role}</Badge></td><td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 text-xs font-medium"><span className={`h-2 w-2 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />{user.status}</span></td><td className="px-6 py-4 text-muted-foreground">{user.joined}</td><td className="px-6 py-4 text-right"><button className="text-sm font-semibold text-primary">View</button></td></tr>)}</tbody></table></div>
          <div className="flex items-center justify-between border-t px-6 py-3 text-xs text-muted-foreground"><span>Showing {filtered.length} of 248 users</span><span>Page 1 of 25</span></div>
        </CardContent>
      </Card>
    </ListView>
  );
}
