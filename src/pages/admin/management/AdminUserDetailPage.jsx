import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronLeft } from 'lucide-react'
import { formatApiErrorMessage } from '../../../api/errors'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { cn } from '../../../components/admin/cn'

const roleToneClass = {
  purple: 'bg-[#f1eafe] text-[#7752a8]',
  blue: 'bg-[#eaf2fc] text-[#2b66a5]',
  green: 'bg-[#e8f7ed] text-[#147940]',
  orange: 'bg-[#fff1e4] text-[#c4841a]',
  cyan: 'bg-[#e8f6fb] text-[#2a7a96]',
  gray: 'bg-[#eff2f0] text-[#637068]',
}

const statusStyle = {
  Active: { pill: 'bg-[#e8f7ed] text-[#147940]', dot: 'bg-[#1aa054]', text: 'text-[#147940]' },
  Pending: { pill: 'bg-[#fff5d9] text-[#9a6510]', dot: 'bg-[#d79a1c]', text: 'text-[#9a6510]' },
  Suspended: { pill: 'bg-[#fdebea] text-[#bf3c36]', dot: 'bg-[#d6453d]', text: 'text-[#bf3c36]' },
}

const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export',
}

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      {title ? <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
      {subtitle ? <p className="mt-0.5 text-[12px] text-[#7c8780]">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function InfoItem({ label, value, valueClass }) {
  return (
    <div className="min-w-0">
      <p className="text-[11.5px] text-[#7c8780]">{label}</p>
      <p className={cn('mt-1 truncate text-[13px] font-medium text-[#17231c]', valueClass)}>{value}</p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="min-w-0 block">
      <span className="text-[11.5px] text-[#7c8780]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputClass =
  'h-9 w-full rounded-[10px] border border-[#dfe4e0] bg-white px-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]'

function PermissionMark({ granted, label }) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        'grid h-[17px] w-[17px] place-items-center rounded-[4px] border',
        granted ? 'border-[#1aa054] bg-[#1aa054] text-white' : 'border-[#dfe4e0] bg-[#f6f8f6]',
      )}
    >
      {granted ? <Check size={12} strokeWidth={3} /> : null}
    </span>
  )
}

function tabPath(item) {
  if (item === 'Roles') return '/admin/users/roles'
  if (item === 'Activity log') return '/admin/users/activity'
  return '/admin/users'
}

function blankEditForm(detail) {
  return {
    fullName: detail?.fullNameValue || '',
    jobTitle: detail?.jobTitleValue || '',
    phone: detail?.phoneValue || '',
    countryCode: detail?.countryCode || '+973',
  }
}

export default function AdminUserDetailPage() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [actionBusy, setActionBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [tempPassword, setTempPassword] = useState(null)

  const { data, error, isLoading, refetch } = useApiResource(
    () => adminService.getAdminUserDetail(userId),
    [userId],
  )

  useEffect(() => {
    setEditing(false)
    setEditForm(null)
    setActionError('')
    setActionSuccess('')
    setTempPassword(null)
  }, [userId])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const row = data.row
  const detail = data.detail

  if (!row || !detail) {
    return (
      <div className="px-5 py-4 pb-8 max-[700px]:px-3">
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="mb-4 inline-flex h-[34px] items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2} />
          Users
        </button>
        <Card>
          <p className="text-[13px] text-[#7c8780]">User not found.</p>
        </Card>
      </div>
    )
  }

  const status = row.status
  const statusValue = String(row.statusValue || '').toUpperCase()
  const isPending = statusValue === 'PENDING' || status === 'Pending'
  const isSuspended = statusValue === 'SUSPENDED' || status === 'Suspended'
  const tone = statusStyle[status] || statusStyle.Active
  const actions = data.permissionActions || ['view', 'create', 'edit', 'delete', 'approve', 'export']
  const permissions = detail.permissions || []
  const activity = detail.activity || []
  const busy = Boolean(actionBusy)
  const form = editForm || blankEditForm(detail)

  const startEdit = () => {
    setActionError('')
    setActionSuccess('')
    setEditForm(blankEditForm(detail))
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditForm(null)
    setActionError('')
  }

  const saveEdit = async () => {
    setActionBusy('edit')
    setActionError('')
    setActionSuccess('')
    try {
      await adminService.updateAdminUser(userId, {
        fullName: form.fullName,
        jobTitle: form.jobTitle,
        phone: form.phone,
        countryCode: form.countryCode,
      })
      setEditing(false)
      setEditForm(null)
      setActionSuccess('User updated.')
      await refetch()
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Failed to update user.'))
    } finally {
      setActionBusy('')
    }
  }

  const handleResetPassword = async () => {
    setActionBusy('reset')
    setActionError('')
    setActionSuccess('')
    setTempPassword(null)
    try {
      const result = await adminService.resetAdminUserPassword(userId)
      const password = result?.data?.temporaryPassword || null
      setTempPassword(password)
      setActionSuccess(
        password
          ? 'Password reset. Copy the temporary password below.'
          : 'Password reset successfully.',
      )
      await refetch()
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Failed to reset password.'))
    } finally {
      setActionBusy('')
    }
  }

  const handleSuspendToggle = async () => {
    if (isPending) {
      setActionError('Pending invitations cannot be suspended or activated.')
      return
    }

    setActionBusy('suspend')
    setActionError('')
    setActionSuccess('')
    try {
      if (isSuspended) {
        await adminService.unsuspendAdminUser(userId)
        setActionSuccess('User reactivated.')
      } else {
        await adminService.suspendAdminUser(userId)
        setActionSuccess('User suspended.')
      }
      await refetch()
    } catch (err) {
      setActionError(
        formatApiErrorMessage(
          err,
          isSuspended ? 'Failed to reactivate user.' : 'Failed to suspend user.',
        ),
      )
    } finally {
      setActionBusy('')
    }
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
          >
            <ChevronLeft size={15} strokeWidth={2} />
            Users
          </button>

          <div
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-bold',
              roleToneClass[row.roleTone] || roleToneClass.gray,
            )}
          >
            {detail.initials}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{row.name}</h2>
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold',
                  roleToneClass[row.roleTone] || roleToneClass.gray,
                )}
              >
                {row.role}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-bold',
                  tone.pill,
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                {status}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-[#7c8780]">
              <span>{row.email}</span>
              <span>·</span>
              <span>{row.scope}</span>
              <span>·</span>
              <span>last active {row.lastActive}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => (editing ? cancelEdit() : startEdit())}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3.5 text-[12.5px] font-bold text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6] disabled:opacity-60"
          >
            ✎
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleResetPassword}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3.5 text-[12.5px] font-bold text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6] disabled:opacity-60"
          >
            {actionBusy === 'reset' ? 'Resetting…' : 'Reset password'}
          </button>
          <button
            type="button"
            disabled={busy || isPending}
            title={
              isPending
                ? 'Pending invitations cannot be suspended or activated'
                : undefined
            }
            onClick={handleSuspendToggle}
            className={cn(
              'inline-flex h-[34px] items-center rounded-full px-3.5 text-[12.5px] font-bold disabled:cursor-not-allowed disabled:opacity-50',
              isSuspended
                ? 'bg-[#e8f7ed] text-[#147940] hover:bg-[#d8f0e1]'
                : 'bg-[#fdebec] text-[#d64044] hover:bg-[#f9d9da]',
            )}
          >
            {actionBusy === 'suspend'
              ? isSuspended
                ? 'Reactivating…'
                : 'Suspending…'
              : isSuspended
                ? 'Reactivate'
                : 'Suspend'}
          </button>
        </div>
      </div>

      {actionError ? (
        <div className="mb-4 rounded-[12px] border border-[#f3c6c3] bg-[#fdf2f1] px-4 py-3 text-[13px] text-[#bf3c36]">
          {actionError}
        </div>
      ) : null}
      {actionSuccess ? (
        <div className="mb-4 rounded-[12px] border border-[#c6e8d2] bg-[#f1faf4] px-4 py-3 text-[13px] text-[#147940]">
          {actionSuccess}
          {tempPassword ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="rounded-[8px] bg-white px-2.5 py-1 text-[13px] font-bold text-[#17231c] ring-1 ring-[#d7ebe0]">
                {tempPassword}
              </code>
              <button
                type="button"
                onClick={() => {
                  if (navigator?.clipboard?.writeText) {
                    navigator.clipboard.writeText(tempPassword)
                  }
                }}
                className="text-[12px] font-bold text-[#1aa054] hover:underline"
              >
                Copy
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 inline-flex items-center gap-1">
        {(data.viewTabs || ['Users', 'Roles', 'Activity log']).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => navigate(tabPath(item))}
            className={cn(
              'h-[34px] rounded-full px-4 text-[12.5px] font-bold transition',
              item === 'Users'
                ? 'bg-[#e8f7ed] text-[#1aa054]'
                : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4] hover:text-[#455249]',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Card title="Account info">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
                <Field label="Full name">
                  <input
                    className={inputClass}
                    value={form.fullName}
                    onChange={(e) => setEditForm({ ...form, fullName: e.target.value })}
                  />
                </Field>
                <InfoItem label="Email" value={row.email} />
                <Field label="Phone">
                  <div className="flex gap-2">
                    <input
                      className={cn(inputClass, 'w-[88px] shrink-0')}
                      value={form.countryCode}
                      onChange={(e) => setEditForm({ ...form, countryCode: e.target.value })}
                    />
                    <input
                      className={inputClass}
                      value={form.phone}
                      onChange={(e) => setEditForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Job title">
                  <input
                    className={inputClass}
                    value={form.jobTitle}
                    onChange={(e) => setEditForm({ ...form, jobTitle: e.target.value })}
                  />
                </Field>
                <InfoItem label="Created" value={detail.created} />
                <InfoItem label="Created by" value={detail.createdBy} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveEdit}
                  className="inline-flex h-[34px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
                >
                  {actionBusy === 'edit' ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={cancelEdit}
                  className="inline-flex h-[34px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f6f8f6] disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
              <InfoItem label="Full name" value={detail.fullName} />
              <InfoItem label="Email" value={row.email} />
              <InfoItem label="Phone" value={detail.phone} />
              <InfoItem label="Job title" value={detail.jobTitle} />
              <InfoItem label="Created" value={detail.created} />
              <InfoItem label="Created by" value={detail.createdBy} />
            </div>
          )}
        </Card>

        <Card title="Role & scope">
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
            <InfoItem label="Role" value={detail.roleFull} />
            <InfoItem label="Scope level" value={detail.scopeLevel} />
            <InfoItem label="Countries" value={detail.countries} />
            <InfoItem label="Zones" value={detail.zones} />
            <InfoItem label="Status" value={status} valueClass={cn('font-bold', tone.text)} />
            <InfoItem label="2FA" value={row.twoFa} />
          </div>
        </Card>

        <Card
          title="Permissions"
          subtitle={detail.roleInheritedFrom || `Inherited from role — ${detail.roleFull}`}
        >
          <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                    <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]">
                      Module
                    </th>
                    {actions.map((action) => (
                      <th
                        key={action}
                        className="whitespace-nowrap px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                      >
                        {ACTION_LABELS[action] || action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {permissions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={actions.length + 1}
                        className="px-4 py-6 text-[13px] text-[#7c8780]"
                      >
                        No permissions returned.
                      </td>
                    </tr>
                  ) : null}
                  {permissions.map((entry) => (
                    <tr key={entry.moduleKey || entry.module} className="border-b border-[#edf0ee] bg-white last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-[#17231c]">
                        {entry.module}
                      </td>
                      {actions.map((action) => (
                        <td key={action} className="px-4 py-3">
                          <div className="flex justify-center">
                            <PermissionMark
                              granted={Boolean(entry[action])}
                              label={`${ACTION_LABELS[action] || action} ${entry.module}: ${
                                entry[action] ? 'allowed' : 'not allowed'
                              }`}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card title="Recent activity">
          <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                    {['Time', 'Action', 'Module', 'Target / IP'].map((column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {activity.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-[13px] text-[#7c8780]">
                        No recent activity.
                      </td>
                    </tr>
                  ) : null}
                  {activity.map((entry, index) => (
                    <tr
                      key={entry.id || `${entry.time}-${index}`}
                      className="border-b border-[#edf0ee] bg-white last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {entry.time}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-[#17231c]">
                        {entry.action}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {entry.module}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {entry.target}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
