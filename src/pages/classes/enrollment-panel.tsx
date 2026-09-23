import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api, allOptions, mutation } from '@/lib/api';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = { classId: number; role: string; userId: string; enrollment?: { status: string | null }; refresh: () => void };
export default function EnrollmentPanel({ classId, role, userId, enrollment, refresh }: Props) {
  const { t, formatDate } = useI18n(); const [params, setParams] = useSearchParams();
  const [roster, setRoster] = useState<any[]>([]); const [invites, setInvites] = useState<any[]>([]); const [students, setStudents] = useState<any[]>([]);
  const [rosterPages, setRosterPages] = useState(1); const [invitePages, setInvitePages] = useState(1);
  const [studentId, setStudentId] = useState(''); const [code, setCode] = useState(''); const [expiresAt, setExpiresAt] = useState(''); const [maxUses, setMaxUses] = useState('1');
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [revision, setRevision] = useState(0);
  const page = Math.max(1, Number(params.get('rosterPage')) || 1), invitePage = Math.max(1, Number(params.get('invitePage')) || 1);
  const search = params.get('rosterSearch') ?? '';
  const change = (key: string, value: string) => { const next = new URLSearchParams(params); value ? next.set(key,value) : next.delete(key); if (key === 'rosterSearch') next.set('rosterPage','1'); setParams(next,{replace:true}); };
  useEffect(() => {
    if (role === 'student') return;
    let cancelled = false; setLoading(true); setError('');
    Promise.all([api(`classes/${classId}/roster?page=${page}&limit=10&search=${encodeURIComponent(search)}`), api(`classes/${classId}/invites?page=${invitePage}&pageSize=10`), role === 'admin' ? allOptions('users?role=student') : Promise.resolve([])])
      .then(([r,i,s]) => { if (cancelled) return; setRoster(r.data); setRosterPages(r.pagination.totalPages); setInvites(i.data); setInvitePages(i.pagination.totalPages); setStudents(s.filter(row => row.isActive)); })
      .catch(e => { if (!cancelled) setError(e.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [classId, role, page, invitePage, search, revision]);
  const run = async (work: () => Promise<unknown>) => { setBusy(true); setError(''); try { await work(); setRevision(n => n + 1); refresh(); } catch(e) { setError(e instanceof Error ? e.message : t('errors.unknown')); } finally { setBusy(false); } };
  const pager = (key: string, current: number, pages: number) => <div className="flex items-center gap-3"><Button variant="outline" disabled={current <= 1 || busy} onClick={() => change(key,String(current-1))}>{t('core.previous')}</Button><span>{current} / {Math.max(1,pages)}</span><Button variant="outline" disabled={current >= pages || busy} onClick={() => change(key,String(current+1))}>{t('core.next')}</Button></div>;
  return <section className="space-y-5">
    {error && <p role="alert" className="text-destructive">{error} <Button variant="outline" onClick={() => setRevision(n=>n+1)}>{t('common.retry')}</Button></p>}
    {role === 'student' ? <div><h2 className="text-xl font-semibold">{t('core.enrollment')}</h2><p>{t(enrollment?.status === 'active' ? 'core.enrolled' : 'core.notEnrolled')}</p><Button disabled={busy} onClick={() => { if (enrollment?.status === 'active' && !window.confirm(t('core.confirmCancel'))) return; void run(() => enrollment?.status === 'active' ? mutation(`classes/${classId}/enrollments/${encodeURIComponent(userId)}`,'DELETE') : mutation(`classes/${classId}/enrollments`,'POST',{studentId:userId})); }}>{t(enrollment?.status === 'active' ? 'core.cancelEnrollment' : 'core.join')}</Button></div> : <>
      <section className="space-y-3 rounded border p-4"><h2 className="text-xl font-semibold">{t('core.roster')}</h2>
        {role === 'admin' && <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void run(async () => { await mutation(`classes/${classId}/enrollments`,'POST',{studentId}); setStudentId(''); }); }}><select required aria-label={t('core.student')} className="rounded border bg-background p-2" value={studentId} onChange={e=>setStudentId(e.target.value)}><option value="">{t('classForm.select')}</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} — {s.email}</option>)}</select><Button disabled={busy || !studentId}>{t('core.addStudent')}</Button></form>}
        <Input aria-label={t('core.search')} placeholder={t('core.search')} value={search} onChange={e=>change('rosterSearch',e.target.value)} />
        {loading ? <p>{t('common.loading')}</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th>{t('core.name')}</th><th>{t('core.status')}</th><th>{t('core.enrolledAt')}</th>{role==='admin' && <th>{t('core.actions')}</th>}</tr></thead><tbody>{roster.map(s=><tr className="border-t" key={s.studentId}><td className="py-3">{s.name}</td><td>{t(`core.${s.status}`)}</td><td>{s.enrolledAt ? formatDate(s.enrolledAt) : t('core.legacy')}</td>{role==='admin' && <td>{s.status==='active' && <Button variant="outline" disabled={busy} onClick={()=>{if(window.confirm(t('core.confirmCancel'))) void run(()=>mutation(`classes/${classId}/enrollments/${encodeURIComponent(s.studentId)}`,'DELETE'));}}>{t('core.cancelEnrollment')}</Button>}</td>}</tr>)}</tbody></table>{!roster.length && <p>{t('common.noData')}</p>}</div>}{pager('rosterPage',page,rosterPages)}
      </section>
      <section className="space-y-3 rounded border p-4"><h2 className="text-xl font-semibold">{t('core.invites')}</h2>
        <form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();void run(async()=>{const body=await mutation(`classes/${classId}/invites`,'POST',{...(expiresAt?{expiresAt:new Date(expiresAt).toISOString()}:{}),...(maxUses?{maxUses:Number(maxUses)}:{})});setCode(body.data.code);});}}><label>{t('core.expiresAt')}<Input type="datetime-local" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} /></label><label>{t('core.maxUses')}<Input type="number" min={1} max={100000} value={maxUses} onChange={e=>setMaxUses(e.target.value)} /></label><Button disabled={busy}>{t('core.createInvite')}</Button></form>
        {code && <div className="space-y-2 rounded bg-muted p-3"><p>{t('core.copyOnce')}</p><Input aria-label={t('core.inviteCode')} readOnly value={code} onFocus={e=>e.target.select()} /><Button variant="outline" onClick={()=>{navigator.clipboard.writeText(code).catch(()=>setError(t('core.copyError')));}}>{t('core.copy')}</Button><Button variant="ghost" onClick={()=>setCode('')}>{t('core.dismiss')}</Button></div>}
        <ul className="divide-y">{invites.map(invite=><li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p>{formatDate(invite.createdAt)} · {invite.usedCount}/{invite.maxUses ?? '∞'}</p><p className="text-sm text-muted-foreground">{invite.expiresAt ? formatDate(invite.expiresAt,{dateStyle:'short',timeStyle:'short'}) : t('core.noExpiry')} · {t(invite.revokedAt ? 'core.revoked' : invite.expiresAt && new Date(invite.expiresAt)<=new Date() ? 'core.expired' : 'core.active')}</p></div>{!invite.revokedAt && <div className="flex gap-2">{['rotate','revoke'].map(action=><Button key={action} disabled={busy} variant="outline" onClick={()=>{if(window.confirm(t('core.confirmInvite')))void run(async()=>{const result=await mutation(`classes/${classId}/invites/${invite.id}/${action}`,'POST');if(result.data.code)setCode(result.data.code);else setCode('');});}}>{t(`core.${action}`)}</Button>)}</div>}</li>)}</ul>{!invites.length && <p>{t('common.noData')}</p>}{pager('invitePage',invitePage,invitePages)}
      </section>
    </>}
  </section>;
}
