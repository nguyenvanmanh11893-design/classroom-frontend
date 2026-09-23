import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useGetIdentity } from '@refinedev/core';
import { api, allOptions, mutation } from '@/lib/api';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Resource = 'users' | 'departments' | 'subjects' | 'semesters';
type Row = Record<string, any>;
const formFields: Record<Resource, string[]> = {
  departments: ['code', 'name', 'description'], subjects: ['code', 'name', 'departmentId', 'description'],
  semesters: ['code', 'name', 'startsOn', 'endsOn', 'registrationStartsOn', 'registrationEndsOn', 'status'],
  users: ['name', 'email', 'password', 'role', 'preferredLocale'],
};
export default function AdminCrud({ resource }: { resource: Resource; title?: string }) {
  const { t, formatDate } = useI18n(); const { data: identity } = useGetIdentity<{ role: string }>();
  const { id } = useParams(); const location = useLocation(); const navigate = useNavigate(); const [params, setParams] = useSearchParams();
  const mode = location.pathname.includes('/create') ? 'create' : location.pathname.includes('/edit/') ? 'edit' : id ? 'show' : 'list';
  const admin = identity?.role === 'admin';
  const [rows, setRows] = useState<Row[]>([]); const [row, setRow] = useState<Row>(); const [draft, setDraft] = useState<Row>({});
  const [departments, setDepartments] = useState<Row[]>([]); const [pages, setPages] = useState(0); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [revision, setRevision] = useState(0);
  const page = Math.max(1, Number(params.get('page')) || 1);
  useEffect(() => {
    if (!identity) return;
    const controller = new AbortController(); setError(''); setLoading(true); setRow(undefined);
    const load = async () => {
      if (mode === 'list') {
        const query = new URLSearchParams(params); query.set('page', String(page)); query.set('pageSize', '10');
        const result = await api(`${resource}?${query}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setRows(result.data); setPages(result.pagination.totalPages); setTotal(result.pagination.total);
      } else {
        const result = id ? await api(`${resource}/${encodeURIComponent(id)}`, { signal: controller.signal }) : null;
        if (controller.signal.aborted) return;
        const value = result?.data;
        setRow(value);
        setDraft(value ? Object.fromEntries(formFields[resource].filter(key => key !== 'password').map(key => [key, key === 'departmentId' ? value.department?.id ?? value.departmentId : key.endsWith('On') ? value[key]?.slice(0, 10) : value[key] ?? ''])) : { status: 'draft', role: 'student', preferredLocale: 'vi' });
        if (resource === 'subjects' && mode !== 'show') { const options = await allOptions('departments'); if (!controller.signal.aborted) setDepartments(options); }
      }
    };
    load().catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [resource, id, mode, params.toString(), revision, identity?.role]);
  const changeFilter = (name: string, value: string) => { const next = new URLSearchParams(params); value ? next.set(name, value) : next.delete(name); next.set('page', '1'); setParams(next, { replace: true }); };
  const run = async (work: () => Promise<unknown>) => { setBusy(true); setError(''); try { await work(); } catch (e) { setError(e instanceof Error ? e.message : t('errors.unknown')); } finally { setBusy(false); } };
  const submit = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    const fields = resource === 'users' && mode === 'edit' ? ['name', 'preferredLocale'] : formFields[resource];
    const body = Object.fromEntries(fields.filter(key => draft[key] !== undefined).map(key => [key, key === 'departmentId' ? Number(draft[key]) : draft[key]]));
    const result = await mutation(mode === 'edit' ? `${resource}/${id}` : resource, mode === 'edit' ? 'PATCH' : 'POST', body);
    navigate(`/${resource}/show/${result.data.id}`);
  }); };
  const remove = () => { if (!window.confirm(t('core.confirmDelete'))) return; void run(async () => { await mutation(`${resource}/${id}`, 'DELETE'); navigate(`/${resource}`); }); };
  if (identity && !admin && (resource === 'users' || mode === 'create' || mode === 'edit')) return <p role="alert">{t('errors.FORBIDDEN')}</p>;
  const visibleFields = resource === 'users' && mode === 'edit' ? ['name', 'preferredLocale'] : formFields[resource];
  const field = (key: string) => {
    const options = key === 'role' ? ['student', 'teacher', 'admin'] : key === 'preferredLocale' ? ['vi', 'en'] : key === 'status' ? ['draft', 'active', 'archived'] : null;
    return <label className="grid gap-1" key={key}>{t(`core.${key}`)}{key === 'departmentId' ? <select required className="rounded border bg-background p-2" value={draft[key] ?? ''} onChange={e => setDraft(old => ({ ...old, [key]: e.target.value }))}><option value="">{t('classForm.select')}</option>{departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : options ? <select className="rounded border bg-background p-2" value={draft[key] ?? options[0]} onChange={e => setDraft(old => ({ ...old, [key]: e.target.value }))}>{options.map(value => <option key={value} value={value}>{t(`core.${value}`)}</option>)}</select> : <Input required={key !== 'description'} type={key.endsWith('On') ? 'date' : key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'} minLength={key === 'password' ? 8 : undefined} maxLength={key === 'description' ? 255 : key === 'password' ? 128 : key === 'code' ? 50 : 255} autoComplete={key === 'password' ? 'new-password' : undefined} value={draft[key] ?? ''} onChange={e => setDraft(old => ({ ...old, [key]: e.target.value }))} />}</label>;
  };
  return <main className="mx-auto w-full max-w-6xl space-y-5 p-4">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="page-title">{t(`resources.${resource}`)}</h1>{mode === 'list' && admin ? <Button asChild><Link to={`/${resource}/create`}>{t('core.create')}</Link></Button> : <Button variant="outline" asChild><Link to={`/${resource}`}>{t('core.back')}</Link></Button>}</header>
    {error && <div role="alert" className="rounded border border-destructive p-3 text-destructive">{error} <Button variant="outline" onClick={() => setRevision(n => n + 1)}>{t('common.retry')}</Button></div>}
    {mode === 'list' && <div className="flex flex-wrap gap-3"><Input className="max-w-sm" aria-label={t('core.search')} placeholder={t('core.search')} value={params.get('search') ?? ''} onChange={e => changeFilter('search', e.target.value)} /><select aria-label={t('core.sort')} className="rounded border bg-background p-2" value={params.get('sort') ?? 'createdAt'} onChange={e => changeFilter('sort', e.target.value)}>{['createdAt', 'name', ...(resource === 'users' ? ['email'] : ['code'])].map(key => <option key={key} value={key}>{t(`core.${key}`)}</option>)}</select><select aria-label={t('core.order')} className="rounded border bg-background p-2" value={params.get('order') ?? 'desc'} onChange={e => changeFilter('order', e.target.value)}><option value="asc">{t('core.asc')}</option><option value="desc">{t('core.desc')}</option></select>{resource === 'users' && <select aria-label={t('core.role')} className="rounded border bg-background p-2" value={params.get('role') ?? ''} onChange={e => changeFilter('role', e.target.value)}><option value="">{t('core.all')}</option>{['admin','teacher','student'].map(role => <option key={role} value={role}>{t(`core.${role}`)}</option>)}</select>}</div>}
    {loading ? <p aria-busy="true">{t('common.loading')}</p> : mode === 'list' ? <>
      <div className="overflow-x-auto rounded border"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr>{['name', resource === 'users' ? 'email' : 'code', 'createdAt', 'actions'].map(key => <th className="p-3" key={key}>{t(`core.${key}`)}</th>)}</tr></thead><tbody>{rows.map(item => <tr key={item.id} className="border-t"><td className="p-3 font-medium">{item.name}</td><td className="p-3">{resource === 'users' ? item.email : item.code}</td><td className="p-3">{item.createdAt ? formatDate(item.createdAt) : '—'}</td><td className="p-3"><Link className="text-primary underline" to={`/${resource}/show/${item.id}`}>{t('core.view')}</Link></td></tr>)}</tbody></table>{!rows.length && <p className="p-6">{t('common.noData')}</p>}</div>
      <nav className="flex items-center justify-between gap-3" aria-label={t('core.pagination')}><Button variant="outline" disabled={page <= 1} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(page - 1)); setParams(next); }}>{t('core.previous')}</Button><span>{t('core.page', { page, pages: Math.max(1, pages), total })}</span><Button variant="outline" disabled={page >= pages} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(page + 1)); setParams(next); }}>{t('core.next')}</Button></nav>
    </> : mode === 'show' ? row && <section className="space-y-4 rounded border p-5"><h2 className="text-xl font-semibold">{row.name}</h2><dl className="grid gap-4 sm:grid-cols-2">{formFields[resource].filter(key => key !== 'password').map(key => <div key={key}><dt className="text-sm text-muted-foreground">{t(`core.${key}`)}</dt><dd>{key === 'departmentId' ? row.department?.name ?? row.departmentId : key.endsWith('On') ? row[key]?.slice(0,10) : ['role','status','preferredLocale'].includes(key) ? t(`core.${row[key]}`) : row[key] || '—'}</dd></div>)}</dl>{admin && <div className="flex flex-wrap gap-3"><Button asChild><Link to={`/${resource}/edit/${id}`}>{t('core.edit')}</Link></Button>{resource !== 'users' ? <Button variant="destructive" disabled={busy} onClick={remove}>{t('core.delete')}</Button> : <><Button variant="outline" disabled={busy} onClick={() => { if (window.confirm(t('core.confirmAccess'))) void run(async () => { await mutation(`users/${id}/access`, 'PATCH', { isActive: !row.isActive }); setRevision(n => n + 1); }); }}>{t(row.isActive ? 'core.deactivate' : 'core.activate')}</Button><label>{t('core.role')}<select className="ml-2 rounded border bg-background p-2" disabled={busy} value={row.role} onChange={e => { const role = e.target.value; if (window.confirm(t('core.confirmAccess'))) void run(async () => { await mutation(`users/${id}/access`, 'PATCH', { role }); setRevision(n => n + 1); }); }}>{['admin','teacher','student'].map(value => <option key={value} value={value}>{t(`core.${value}`)}</option>)}</select></label><span>{t(row.isActive ? 'core.active' : 'core.inactive')}</span></>}</div>}</section> : !error && <form onSubmit={submit} className="max-w-2xl space-y-4 rounded border p-5"><div className="grid gap-4 sm:grid-cols-2">{visibleFields.map(field)}</div><Button type="submit" disabled={busy}>{t('common.save')}</Button></form>}
  </main>;
}
