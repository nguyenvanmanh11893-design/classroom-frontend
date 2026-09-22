import { useCreate, useDelete, useList, useUpdate } from '@refinedev/core';
import { useSearchParams } from 'react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';

type Props = { resource: 'departments' | 'semesters' | 'users'; title: string };
const fields = {
  departments: ['code', 'name', 'description'],
  semesters: ['code', 'name', 'startsOn', 'endsOn', 'registrationStartsOn', 'registrationEndsOn', 'status'],
  users: ['name', 'email', 'password', 'role', 'preferredLocale'],
} as const;

/** Small admin CRUD surface. Query parameters are the source of truth for search/page. */
export default function AdminCrud({ resource, title }: Props) {
  const { t } = useI18n(); const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState<Record<string, string>>({}); const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1); const search = params.get('search') ?? '';
  const { query } = useList<Record<string, unknown>>({ resource, pagination: { currentPage: page, pageSize: 10 }, filters: search ? [{ field: 'search', operator: 'contains', value: search }] : [] });
  const create = useCreate(); const update = useUpdate(); const remove = useDelete(); const rows = query.data?.data ?? [];
  const change = (key: string, value: string) => setDraft((old) => ({ ...old, [key]: value }));
  const submit = () => {
    const values = { ...draft }; if (resource === 'semesters' && !values.status) values.status = 'draft';
    if (editing?.id) update.mutate({ resource, id: editing.id as string, values }, { onSuccess: () => { setEditing(null); setDraft({}); } });
    else create.mutate({ resource, values }, { onSuccess: () => setDraft({}) });
  };
  const setSearch = (value: string) => setParams(value ? { search: value, page: '1' } : {});
  return <main className="space-y-4"><h1 className="page-title">{title}</h1>
    <Input aria-label={`${title} search`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
    <section className="grid gap-2">{fields[resource].map((key) => <Input key={key} type={key.endsWith('On') ? 'date' : key === 'password' ? 'password' : 'text'} placeholder={key} value={draft[key] ?? ''} onChange={(e) => change(key, e.target.value)} />)}
      <Button onClick={submit}>{editing ? t('common.save') : 'Create'}</Button></section>
    {query.isLoading ? <p>{t('common.loading')}</p> : rows.length === 0 ? <p>{t('common.noData')}</p> : <ul className="space-y-2">{rows.map((row) => <li key={String(row.id)} className="flex gap-2 border p-2"><span className="flex-1">{String(row.name ?? row.email ?? row.code)}</span><Button variant="outline" onClick={() => { setEditing(row); setDraft(Object.fromEntries(fields[resource].filter((x) => x !== 'password').map((x) => [x, String(row[x] ?? '')]))); }}>Edit</Button><Button variant="destructive" onClick={() => window.confirm('Delete this record?') && remove.mutate({ resource, id: row.id as string })}>Delete</Button></li>)}</ul>}
  </main>;
}
