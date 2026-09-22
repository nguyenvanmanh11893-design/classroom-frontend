import { useEffect, useState, type FormEvent } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { Link, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import BACKEND_BASE_URL from '@/constants';
import { classSchema } from '@/lib/schema';
import { useI18n, translateError } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UploadWidget from '@/components/upload-widget';

type Draft = z.infer<typeof classSchema>;
type Option = { id: number | string; name: string; isActive?: boolean };
const initial: Draft = { name: '', description: '', subjectId: 0, semesterId: 0, teacherId: '', capacity: 50, lifecycleStatus: 'draft', schedules: [] };
async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, { ...init, credentials: 'include' });
  const body = await response.json();
  if (!response.ok) throw new Error(translateError(body.error?.code, body.error?.message));
  return body;
}
async function options(path: string): Promise<Option[]> {
  const rows: Option[] = [];
  for (let page = 1; ; page++) {
    const body = await request(`${path}${path.includes('?') ? '&' : '?'}page=${page}&pageSize=100&sort=name&order=asc`);
    rows.push(...body.data);
    if (page >= (body.pagination?.totalPages ?? 1)) return rows;
  }
}
export default function ClassesCreate() {
  const { id } = useParams(); const navigate = useNavigate(); const { t } = useI18n();
  const { data: identity } = useGetIdentity<{ role: string }>();
  const [draft, setDraft] = useState<Draft>(initial);
  const [choices, setChoices] = useState<{ subjects: Option[]; semesters: Option[]; teachers: Option[] }>({ subjects: [], semesters: [], teachers: [] });
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (identity?.role !== 'admin') return;
    let disposed = false; setLoading(true); setError('');
    Promise.all([options('subjects'), options('semesters'), options('users?role=teacher'), id ? request(`classes/${id}`) : Promise.resolve(null)])
      .then(([subjects, semesters, teachers, current]) => {
        if (disposed) return;
        setChoices({ subjects, semesters, teachers: teachers.filter(row => row.isActive !== false) });
        if (current) {
          const row = current.data;
          setDraft({ name: row.name, description: row.description ?? '', subjectId: row.subjectId, semesterId: row.semesterId ?? 0, teacherId: row.teacherId, capacity: row.capacity, lifecycleStatus: row.lifecycleStatus,
            ...(row.bannerUrl ? { bannerUrl: row.bannerUrl, bannerCldPubId: row.bannerCldPubId ?? '' } : {}),
            schedules: row.schedules.map((s: Draft['schedules'][number]) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })) });
        } else setDraft(initial);
      }).catch(e => { if (!disposed) setError(e.message); }).finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [id, identity?.role, reload]);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(old => ({ ...old, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    const parsed = classSchema.safeParse(draft);
    if (!parsed.success) { setError(t('classForm.invalid', { field: parsed.error.issues[0]?.path.join('.') })); return; }
    setBusy(true);
    try {
      const result = await request(id ? `classes/${id}` : 'classes', { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
      navigate(`/classes/show/${result.data.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : t('errors.unknown')); }
    finally { setBusy(false); }
  };
  if (!identity || loading && identity.role === 'admin') return <p>{t('common.loading')}</p>;
  if (identity.role !== 'admin') return <p role="alert">{t('errors.FORBIDDEN')}</p>;
  const missingOptions = !choices.subjects.length || !choices.semesters.length || !choices.teachers.length;
  return <main className="mx-auto w-full max-w-3xl space-y-5 p-4">
    <h1 className="page-title">{t(id ? 'classForm.edit' : 'classForm.create')}</h1>
    {error && <div role="alert" className="text-destructive">{error} <Button variant="outline" onClick={() => setReload(n => n + 1)}>{t('common.retry')}</Button></div>}
    {missingOptions && <p>{t('classForm.noOptions')} <Link className="underline" to="/semesters">{t('resources.semesters')}</Link></p>}
    <form onSubmit={submit} className="space-y-5">
      <UploadWidget disabled={busy} value={draft.bannerUrl ? { url: draft.bannerUrl, publicId: draft.bannerCldPubId ?? '' } : null}
        onChange={file => { if (file) setDraft(old => ({ ...old, bannerUrl: file.url, bannerCldPubId: file.publicId })); }} />
      <label className="block">{t('classForm.name')}<Input required minLength={2} maxLength={255} value={draft.name} onChange={e => set('name', e.target.value)} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        {(['subjectId', 'semesterId', 'teacherId'] as const).map(key => {
          const rows = key === 'subjectId' ? choices.subjects : key === 'semesterId' ? choices.semesters : choices.teachers;
          return <label key={key} className="block">{t(`classForm.${key === 'subjectId' ? 'subject' : key === 'semesterId' ? 'semester' : 'teacher'}`)}
            <select required className="w-full rounded border bg-background p-2" value={draft[key] || ''} onChange={e => key === 'teacherId' ? set(key, e.target.value) : set(key, Number(e.target.value))}>
              <option value="">{t('classForm.select')}</option>{rows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select></label>;
        })}
        <label>{t('classForm.capacity')}<Input type="number" min={1} max={100000} required value={draft.capacity} onChange={e => set('capacity', Number(e.target.value))} /></label>
        <label>{t('classForm.status')}<select className="w-full rounded border bg-background p-2" value={draft.lifecycleStatus} onChange={e => set('lifecycleStatus', e.target.value as Draft['lifecycleStatus'])}>
          {(['draft', 'open', 'closed', 'completed', 'cancelled'] as const).map(value => <option key={value} value={value}>{t(`classForm.${value}`)}</option>)}
        </select></label>
      </div>
      <label className="block">{t('classForm.description')}<textarea className="w-full rounded border bg-background p-2" maxLength={5000} value={draft.description} onChange={e => set('description', e.target.value)} /></label>
      <fieldset className="space-y-3"><legend>{t('classForm.schedules')}</legend>
        {draft.schedules.map((schedule, index) => <div key={index} className="grid gap-2 rounded border p-3 sm:grid-cols-4">
          <label>{t('classForm.day')}<Input required type="number" min={1} max={7} value={schedule.dayOfWeek} onChange={e => set('schedules', draft.schedules.map((s, i) => i === index ? { ...s, dayOfWeek: Number(e.target.value) } : s))} /></label>
          {(['startTime', 'endTime'] as const).map(key => <label key={key}>{t(key === 'startTime' ? 'classForm.start' : 'classForm.end')}<Input required type="time" value={schedule[key]} onChange={e => set('schedules', draft.schedules.map((s, i) => i === index ? { ...s, [key]: e.target.value } : s))} /></label>)}
          <Button type="button" variant="outline" onClick={() => set('schedules', draft.schedules.filter((_, i) => i !== index))}>{t('classForm.remove')}</Button>
        </div>)}
        <Button type="button" variant="outline" disabled={draft.schedules.length >= 14} onClick={() => set('schedules', [...draft.schedules, { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }])}>{t('classForm.add')}</Button>
      </fieldset>
      <div className="flex gap-3"><Button disabled={busy || missingOptions} type="submit">{t('common.save')}</Button><Button asChild variant="outline"><Link to={id ? `/classes/show/${id}` : '/classes'}>{t('common.cancel')}</Link></Button></div>
    </form>
  </main>;
}
