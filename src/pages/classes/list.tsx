import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb"
import { ListView } from "@/components/refine-ui/views/list-view"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateButton } from "@/components/refine-ui/buttons/create"
import { DataTable } from "@/components/refine-ui/data-table/data-table"
import { ClassDetails, Subject, User } from "@/types"
import { useList } from "@refinedev/core"
import { useTable } from "@refinedev/react-table"
import { ColumnDef } from "@tanstack/react-table"
import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { ShowButton } from "@/components/refine-ui/buttons/show"

const ClassesList = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedTeacher, setSelectedTeacher] = useState("all")

  const { query: subjectsQuery } = useList<Subject>({
    resource: "subjects",
    pagination: { pageSize: 100 },
  })
  const { query: teachersQuery } = useList<User>({
    resource: "users",
    filters: [{ field: "role", operator: "eq", value: "teacher" }],
    pagination: { pageSize: 100 },
  })

  const subjects = subjectsQuery.data?.data ?? []
  const teachers = teachersQuery.data?.data ?? []

  const classesTable = useTable<ClassDetails>({
    columns: useMemo<ColumnDef<ClassDetails>[]>(() => [
      {
        id: "bannerUrl",
        accessorKey: "bannerUrl",
        size: 100,
        header: () => <p className="column-title">Banner</p>,
        cell: ({ getValue }) => {
          const bannerUrl = getValue<string | undefined>()
          return bannerUrl ? (
            <img
              src={bannerUrl}
              alt="Class banner"
              className="h-10 w-16 rounded object-cover"
            />
          ) : (
            <span className="text-muted-foreground">No banner</span>
          )
        },
      },
      {
        id: "name",
        accessorKey: "name",
        size: 220,
        header: () => <p className="column-title">Class Name</p>,
        cell: ({ getValue }) => (
          <span className="text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        size: 120,
        header: () => <p className="column-title">Status</p>,
        cell: ({ getValue }) => {
          const status = getValue<ClassDetails["status"]>()
          return (
            <Badge variant={status === "active" ? "default" : "secondary"}>
              {status}
            </Badge>
          )
        },
      },
      {
        id: "subject",
        accessorKey: "subject.name",
        size: 180,
        header: () => <p className="column-title">Subject</p>,
        cell: ({ getValue }) => (
          <span>{getValue<string | undefined>() ?? "—"}</span>
        ),
      },
      {
        id: "teacher",
        accessorKey: "teacher.name",
        size: 180,
        header: () => <p className="column-title">Teacher</p>,
        cell: ({ getValue }) => (
          <span>{getValue<string | undefined>() ?? "—"}</span>
        ),
      },
      {
        id: "capacity",
        accessorKey: "capacity",
        size: 110,
        header: () => <p className="column-title">Capacity</p>,
        cell: ({ getValue }) => <span>{getValue<number>()}</span>,
      },
      {
        id: "details",
        size: 140,
        header: () => <p className="column-title">Details</p>,
        cell: ({ row }) => <ShowButton resource="classes" recordItemId={row.original.id} variant="outline"
        size="sm">View</ShowButton>


      }
    ], []),
    refineCoreProps: {
      resource: "classes",
      pagination: { pageSize: 10, mode: "server" },
      filters: {
        permanent: [
          ...(searchQuery
            ? [{ field: "name", operator: "contains" as const, value: searchQuery }]
            : []),
          ...(selectedSubject !== "all"
            ? [{ field: "subject", operator: "eq" as const, value: selectedSubject }]
            : []),
          ...(selectedTeacher !== "all"
            ? [{ field: "teacher", operator: "eq" as const, value: selectedTeacher }]
            : []),
        ],
      },
      sorters: {
        initial: [{ field: "id", order: "desc" }],
      },
    },
  })

  return (
    <ListView>
      <Breadcrumb />
      <h1 className="page-title">Classes</h1>

      <div className="intro-row">
        <p>Quick access to essential class management tools</p>
        <div className="action-row">
          <div className="search-field">
            <Search className="search-icon" />
            <Input
              type="text"
              placeholder="Search by class name..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.name}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.name}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CreateButton resource="classes" />
          </div>
        </div>
      </div>

      <DataTable table={classesTable} />
    </ListView>
  )
}

export default ClassesList