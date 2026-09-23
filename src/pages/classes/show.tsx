import { useGetIdentity, useShow } from '@refinedev/core';
import { Link } from 'react-router';
import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { mutation } from '@/lib/api';
import EnrollmentPanel from './enrollment-panel';
export default function ClassesShow() {
  const { t } = useI18n(); const { query } = useShow<any>({ resource: 'classes' });
  const { data: user } = useGetIdentity<{id:string;role:string}>(); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const row=query.data?.data;
  if(query.isLoading)return <p>{t('common.loading')}</p>;
  if(query.isError || !row)return <div role="alert">{t('errors.unknown')}<Button onClick={()=>query.refetch()}>{t('common.retry')}</Button></div>;
  return <main className="mx-auto w-full max-w-5xl space-y-6 p-4"><header className="flex flex-wrap justify-between gap-3"><div><h1 className="page-title">{row.name}</h1><p>{t(`classForm.${row.lifecycleStatus}`)} {row.archivedAt && `· ${t('core.archived')}`}</p></div><div className="flex gap-2"><Button asChild variant="outline"><Link to="/classes">{t('core.back')}</Link></Button>{user?.role==='admin' && <Button asChild><Link to={`/classes/edit/${row.id}`}>{t('core.edit')}</Link></Button>}</div></header>
    {row.bannerUrl && <img src={row.bannerUrl} alt={row.name} className="max-h-64 w-full rounded object-cover" />}
    <section className="space-y-3 rounded border p-5"><p>{row.description}</p><dl className="grid gap-4 sm:grid-cols-3">{[['subject',row.subject?.name],['teacher',row.teacher?.name],['semester',row.semesterId ?? '—']].map(([key,value])=><div key={key}><dt className="text-muted-foreground">{t(`classForm.${key}`)}</dt><dd>{value}</dd></div>)}</dl><p>{t('core.occupancy',{count:row.activeEnrollmentCount,capacity:row.capacity})}</p>{row.activeEnrollmentCount/row.capacity>=.8 && <p className="font-semibold text-amber-700">{t(row.activeEnrollmentCount>=row.capacity?'core.full':'core.near')}</p>}<h2 className="font-semibold">{t('classForm.schedules')}</h2>{row.schedules?.length ? <ul>{row.schedules.map((s:any)=><li key={s.id}>{t('core.weekday',{day:s.dayOfWeek})}: {s.startTime}–{s.endTime}</li>)}</ul>:<p>{t('common.noData')}</p>}
      {error && <p role="alert">{error}</p>}{user?.role==='admin' && !row.archivedAt && <Button variant="outline" disabled={busy} onClick={async()=>{if(!window.confirm(t('core.confirmArchive')))return;setBusy(true);setError('');try{await mutation(`classes/${row.id}`,'PATCH',{archive:true});await query.refetch();}catch(e){setError(e instanceof Error?e.message:t('errors.unknown'));}finally{setBusy(false);}}}>{t('core.archive')}</Button>}
    </section>
    {user && <EnrollmentPanel classId={row.id} role={user.role} userId={user.id} enrollment={row.enrollment} refresh={()=>{void query.refetch();}} />}
  </main>;
}
