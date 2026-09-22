import { useGetIdentity, useShow } from '@refinedev/core'
import { useState } from 'react'
import { Link } from 'react-router'
import { useI18n } from '@/i18n'
import BACKEND_BASE_URL from '@/constants'
import { ClassDetails } from '@/types'
import { ShowView, ShowViewHeader } from '@/components/refine-ui/views/show-view'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { bannerPhoto } from '@/lib/cloudinary'
import { AdvancedImage } from '@cloudinary/react'
const Show = () => {
  const { t } = useI18n()
  const { query } = useShow<ClassDetails>({ resource: "classes" })
  const { data: identity } = useGetIdentity<{ id: string; role: string }>()
  const [inviteCode, setInviteCode] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)

  const classDetails = query.data?.data

  const { isLoading, isError } = query

  if(isLoading || isError || !classDetails){
    return (
      <ShowView className="class-view class-show">
        <ShowViewHeader resource="classes" title="Class Details"/>

        <p className="state-message">
          {isLoading ? 'Loading class details...' 
            : isError ? 'Failed to load class details.' 
              : 'Class details not found.'}
        </p>
      </ShowView>
    )
  }
  const teacherName = classDetails.teacher?.name ?? 'Unknown'
  const teachersInitials = 
          teacherName.split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join('')
  const placeholderUrl = `https://placehold.co/600x400?text=${encodeURIComponent(teachersInitials || 'NA')}`
  
  const { name,
      description,
      lifecycleStatus: status,
      capacity,
      bannerUrl,
      bannerCldPubId,
      subject,
      teacher,
      department} = classDetails
  const activeEnrollment = classDetails.enrollment?.status === 'active'
  const enrollSelf = async () => {
    if (!identity || !classDetails.enrollment?.enabled) return
    setBusy(true); setActionError('')
    const response = await fetch(`${BACKEND_BASE_URL}classes/${classDetails.id}/enrollments`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: identity.id, ...(inviteCode ? { inviteCode } : {}) }) })
    setBusy(false)
    if (!response.ok) { const payload = await response.json().catch(() => null); setActionError(payload?.error?.message ?? 'Could not join this class.'); return }
    query.refetch()
  }
  const cancelSelf = async () => {
    if (!identity) return
    setBusy(true); setActionError('')
    const response = await fetch(`${BACKEND_BASE_URL}classes/${classDetails.id}/enrollments/${identity.id}`, { method: 'DELETE', credentials: 'include' })
    setBusy(false)
    if (!response.ok) { setActionError('Could not cancel enrollment.'); return }; query.refetch()
  }
  return (
    <ShowView className="class-view class-show">
      <ShowViewHeader resource="classes" title="Class Details"/>

      {identity?.role === 'admin' && <Button asChild variant="outline"><Link to={`/classes/edit/${classDetails.id}`}>{t('classForm.edit')}</Link></Button>}
      <div className="banner">
        {bannerUrl ? (<AdvancedImage alt = "Class Banner" cldImg={bannerPhoto(bannerCldPubId ?? '', name)} />) : <div className="placeholder" />}
      </div>

      <Card className="details-card">
        <div className="details-header">
          <div> 
            <h1>{name}</h1>
            <p>{description}</p>
          </div>
          <div>
            <Badge variant="outline">{capacity}</Badge>
            <Badge variant={status === "open" ? "default" : "secondary"}
            data-status={status}>
              {status.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="details-grid">
          <div className="instructors">
            <p>Instructors</p>
            <div>
              <img src={teacher?.image ?? placeholderUrl}
              alt={teacherName} />
              <div>
                <p>{teacherName}</p>
                <p>{teacher?.email}</p>
              </div>
            </div>
        </div>
        <div className="department">
          <p>Department</p>
          <div>
            <p>{department?.name}</p>
            <p>{department?.description}</p>
          </div>
        </div>
        </div>

        <Separator/>

        <div className="subject">
          <p>Subject</p>
          <div>
            <Badge variant="outline">Code:{subject?.code}</Badge>
            <p>{subject?.name}</p>
            <p>{subject?.description}</p>
          </div>
        </div>

        <Separator/>
        {classDetails.enrollment?.enabled && <div className="join">
          <h2>Join Class</h2>
          {!activeEnrollment && <input aria-label="Invite code" value={inviteCode} onChange={event => setInviteCode(event.target.value)} placeholder="Invite code (if required)" className="w-full border rounded p-2" />}
          {actionError && <p className="text-destructive" role="alert">{actionError}</p>}
          <Button size="lg" className="w-full" disabled={busy} onClick={activeEnrollment ? cancelSelf : enrollSelf}>{activeEnrollment ? 'Cancel enrollment' : 'Join Class'}</Button>
        </div>}
      </Card>
      </ShowView>
  )     
}

export default Show
