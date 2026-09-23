import { Card, CardContent } from "@/components/ui/card";
import { ListView } from "@/components/refine-ui/views/list-view";
import { ArrowUpRight, BookOpen, Building2, MoreHorizontal, Users } from "lucide-react";

const departments = [
  { code: "CS", name: "Computer Science", subjects: 18, students: 684, color: "bg-indigo-500" },
  { code: "MATH", name: "Mathematics", subjects: 12, students: 412, color: "bg-amber-500" },
  { code: "ENG", name: "English", subjects: 9, students: 296, color: "bg-rose-500" },
  { code: "PHY", name: "Physics", subjects: 8, students: 188, color: "bg-emerald-500" },
];

export default function DepartmentsList() {
  return <ListView className="gap-6"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Catalog</p><h1 className="page-title">Departments</h1><p className="mt-1 text-sm text-muted-foreground">Organize subjects and classes by academic department.</p></div><button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Add department</button></div><div className="grid gap-4 md:grid-cols-2">{departments.map((department) => <Card key={department.code} className="group transition-shadow hover:shadow-md"><CardContent className="p-5"><div className="flex items-start justify-between"><div className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white ${department.color}`}>{department.code.slice(0, 2)}</div><button className="text-muted-foreground"><MoreHorizontal className="h-5 w-5" /></button></div><h2 className="mt-5 text-lg font-semibold">{department.name}</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-lg bg-muted/50 p-3"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> Subjects</p><p className="mt-1 text-xl font-bold">{department.subjects}</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Students</p><p className="mt-1 text-xl font-bold">{department.students}</p></div></div><button className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">View department <ArrowUpRight className="h-4 w-4" /></button></CardContent></Card>)}</div></ListView>;
}
