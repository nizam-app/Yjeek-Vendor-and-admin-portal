import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../../components/admin/cn'
import { useAdminSettings } from '../../../hooks/admin/useAdminSettings'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { adminSettingsService } from '../../../services/admin/settingsService'

const TABS = [
  { id: 'general', label: 'General', title: 'General', topbar: 'Settings · General' },
  {
    id: 'localization',
    label: 'Localization',
    title: 'Localization & regions',
    topbar: 'Settings · Localization & regions',
  },
  { id: 'notifications', label: 'Notifications', title: 'Notifications', topbar: 'Settings · Notifications' },
  { id: 'security', label: 'Security', title: 'Security', topbar: 'Settings · Security' },
  { id: 'integrations', label: 'Integrations', title: 'Integrations', topbar: 'Settings · Integrations' },
]

const COUNTRIES = ['Bahrain', 'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Oman']
const LANGUAGES = ['English', 'العربية']

const labelClass = 'mb-1.5 block text-[12.5px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[42px] w-full rounded-[10px] border border-[#e3e6e3] bg-white px-3.5 text-[13px] font-semibold text-[#17231c] outline-none transition focus:border-[#1aa054]'

const DEFAULT_STATE = {
  general: {
    companyName: 'Yjeek',
    supportEmail: 'support@yjeek.com',
    supportPhone: '+973 1700 0000',
    timeFormat: '24-hour',
    appVersion: 'v3.2.1',
    maintenanceMode: false,
  },
  localization: {
    activeCountries: ['Bahrain'],
    defaultCountry: 'Bahrain',
    timezone: 'Asia/Bahrain (GMT+3)',
    distanceUnit: 'Kilometers',
    dateFormat: 'DD MMM YYYY',
    currency: 'BHD',
    languages: ['English', 'العربية'],
    rtlSupport: true,
    commission: '12',
    gatewayFee: '2.5',
    vat: '10',
    payoutCycle: 'Weekly',
    minPayout: 'BHD 10.000',
    payoutDay: 'Sunday',
  },
  notifications: {
    push: true,
    sms: true,
    email: true,
    inApp: true,
    incidentEscalation: true,
    dailySummary: true,
  },
  security: {
    enforce2fa: true,
    passwordPolicy: 'Strong (12+ chars)',
    sessionTimeout: '30 min',
    auditRetention: '12 months',
    ipAllowlist: 'Disabled',
    loginAlerts: true,
  },
  integrations: [
    { id: 'maps', title: 'Maps & geocoding', subtitle: 'Google Maps', status: 'Connected' },
    { id: 'sms', title: 'SMS provider', subtitle: 'Twilio', status: 'Connected' },
    { id: 'payments', title: 'Payment gateway', subtitle: 'Benefit pay / Apple pay / etc …', status: 'Connected' },
    { id: 'analytics', title: 'Analytics', subtitle: 'GA4 + Mixpanel', status: 'Connected' },
    { id: 'pos', title: 'POS', subtitle: 'Point of sale — Foodics / Square', status: 'Connected' },
    { id: 'webhooks', title: 'Webhooks', subtitle: 'Custom endpoints', status: 'Not connected' },
    { id: 'erp', title: 'ERP', subtitle: 'Odoo / Oracle NetSuite', status: 'Not connected' },
  ],
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[26px] w-[46px] shrink-0 rounded-full transition',
        checked ? 'bg-[#1aa054]' : 'bg-[#e3e6e3]',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.15)] transition',
          checked ? 'left-[23px]' : 'left-[3px]',
        )}
      />
    </button>
  )
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-4">
      {title ? <h3 className="mb-3.5 text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
      {children}
    </section>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <select
          className={cn(inputClass, 'appearance-none pr-9')}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a948e]"
        />
      </div>
    </label>
  )
}

function TextField({ label, value, onChange }) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}</span>
      <input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function PillToggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-[30px] items-center rounded-full border px-3 text-[12px] font-semibold transition',
        active
          ? 'border-[#1aa054] bg-white text-[#137333]'
          : 'border-[#e3e6e3] bg-white text-[#637068] hover:border-[#cfd6d1]',
      )}
    >
      {children}
    </button>
  )
}

function SettingRow({ title, subtitle, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e7ebe8] bg-[#F9FAFB] px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[13.5px] font-bold text-[#17231c]">{title}</p>
        <p className="mt-0.5 text-[12px] text-[#8a948e]">{subtitle}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  )
}

function GeneralTab({ form, setField }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Company">
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
            <TextField
              label="Company name"
              value={form.companyName}
              onChange={(value) => setField('companyName', value)}
            />
            <TextField
              label="Support email"
              value={form.supportEmail}
              onChange={(value) => setField('supportEmail', value)}
            />
          </div>
          <TextField
            label="Support phone"
            value={form.supportPhone}
            onChange={(value) => setField('supportPhone', value)}
          />
          <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
            <SelectField
              label="Time format"
              value={form.timeFormat}
              onChange={(value) => setField('timeFormat', value)}
              options={['24-hour', '12-hour']}
            />
            <TextField
              label="App version"
              value={form.appVersion}
              onChange={(value) => setField('appVersion', value)}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="System">
        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e7ebe8] bg-[#F9FAFB] px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-[#17231c]">Maintenance mode</p>
            <p className="mt-0.5 text-[12px] text-[#8a948e]">Temporarily disable customer ordering</p>
          </div>
          <Toggle
            checked={form.maintenanceMode}
            onChange={(value) => setField('maintenanceMode', value)}
            label="Maintenance mode"
          />
        </div>
      </SectionCard>
    </div>
  )
}

function LocalizationTab({ form, setField, toggleInList }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Regions">
        <div className="space-y-3.5">
          <div>
            <span className={labelClass}>Active countries</span>
            <div className="flex flex-wrap gap-1.5">
              {COUNTRIES.map((country) => (
                <PillToggle
                  key={country}
                  active={form.activeCountries.includes(country)}
                  onClick={() => toggleInList('activeCountries', country)}
                >
                  {country}
                </PillToggle>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
            <SelectField
              label="Default country"
              value={form.defaultCountry}
              onChange={(value) => setField('defaultCountry', value)}
              options={COUNTRIES}
            />
            <SelectField
              label="Timezone"
              value={form.timezone}
              onChange={(value) => setField('timezone', value)}
              options={['Asia/Bahrain (GMT+3)', 'Asia/Riyadh (GMT+3)', 'Asia/Dubai (GMT+4)']}
            />
            <SelectField
              label="Distance unit"
              value={form.distanceUnit}
              onChange={(value) => setField('distanceUnit', value)}
              options={['Kilometers', 'Miles']}
            />
            <SelectField
              label="Date format"
              value={form.dateFormat}
              onChange={(value) => setField('dateFormat', value)}
              options={['DD MMM YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']}
            />
          </div>

          <SelectField
            label="Currency"
            value={form.currency}
            onChange={(value) => setField('currency', value)}
            options={['BHD', 'SAR', 'AED', 'KWD', 'QAR', 'OMR']}
          />

          <div>
            <span className={labelClass}>Languages</span>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((language) => (
                <PillToggle
                  key={language}
                  active={form.languages.includes(language)}
                  onClick={() => toggleInList('languages', language)}
                >
                  {language}
                </PillToggle>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e7ebe8] bg-[#F9FAFB] px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-[#17231c]">RTL support</p>
              <p className="mt-0.5 text-[12px] text-[#8a948e]">Right-to-left layout for Arabic</p>
            </div>
            <Toggle
              checked={form.rtlSupport}
              onChange={(value) => setField('rtlSupport', value)}
              label="RTL support"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Commission & fees">
        <div className="space-y-3.5">
          <div className="grid grid-cols-3 gap-4 max-[800px]:grid-cols-1">
            <TextField
              label="Default commission %"
              value={form.commission}
              onChange={(value) => setField('commission', value)}
            />
            <TextField
              label="Online gateway fee %"
              value={form.gatewayFee}
              onChange={(value) => setField('gatewayFee', value)}
            />
            <TextField label="VAT %" value={form.vat} onChange={(value) => setField('vat', value)} />
          </div>
          <div className="grid grid-cols-3 gap-4 max-[800px]:grid-cols-1">
            <SelectField
              label="Payout cycle"
              value={form.payoutCycle}
              onChange={(value) => setField('payoutCycle', value)}
              options={['Weekly', 'Bi-weekly', 'Monthly']}
            />
            <TextField
              label="Min payout"
              value={form.minPayout}
              onChange={(value) => setField('minPayout', value)}
            />
            <SelectField
              label="Payout day"
              value={form.payoutDay}
              onChange={(value) => setField('payoutDay', value)}
              options={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function NotificationsTab({ form, setField }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Channels">
        <div className="space-y-2">
          <SettingRow
            title="Push notifications"
            subtitle="Mobile app push"
            checked={form.push}
            onChange={(value) => setField('push', value)}
          />
          <SettingRow
            title="SMS"
            subtitle="Order & OTP messages"
            checked={form.sms}
            onChange={(value) => setField('sms', value)}
          />
          <SettingRow
            title="Email"
            subtitle="Receipts & marketing"
            checked={form.email}
            onChange={(value) => setField('email', value)}
          />
          <SettingRow
            title="In-app"
            subtitle="Banners & inbox"
            checked={form.inApp}
            onChange={(value) => setField('inApp', value)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Operational alerts">
        <div className="space-y-2">
          <SettingRow
            title="Incident escalation"
            subtitle="Notify ops on SLA breach"
            checked={form.incidentEscalation}
            onChange={(value) => setField('incidentEscalation', value)}
          />
          <SettingRow
            title="Daily summary email"
            subtitle="End-of-day report to admins"
            checked={form.dailySummary}
            onChange={(value) => setField('dailySummary', value)}
          />
        </div>
      </SectionCard>
    </div>
  )
}

function SecurityTab({ form, setField }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Access & authentication">
        <div className="space-y-3.5">
          <SettingRow
            title="Enforce 2FA for admins"
            subtitle="Require two-factor for all staff"
            checked={form.enforce2fa}
            onChange={(value) => setField('enforce2fa', value)}
          />
          <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
            <SelectField
              label="Password policy"
              value={form.passwordPolicy}
              onChange={(value) => setField('passwordPolicy', value)}
              options={['Strong (12+ chars)', 'Medium (8+ chars)', 'Basic (6+ chars)']}
            />
            <SelectField
              label="Session timeout"
              value={form.sessionTimeout}
              onChange={(value) => setField('sessionTimeout', value)}
              options={['15 min', '30 min', '1 hour', '4 hours']}
            />
            <SelectField
              label="Audit log retention"
              value={form.auditRetention}
              onChange={(value) => setField('auditRetention', value)}
              options={['3 months', '6 months', '12 months', '24 months']}
            />
            <SelectField
              label="IP allowlist"
              value={form.ipAllowlist}
              onChange={(value) => setField('ipAllowlist', value)}
              options={['Disabled', 'Enabled']}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Data">
        <SettingRow
          title="Login alerts"
          subtitle="Email admins on new-device login"
          checked={form.loginAlerts}
          onChange={(value) => setField('loginAlerts', value)}
        />
      </SectionCard>
    </div>
  )
}

function IntegrationsTab({ services }) {
  return (
    <SectionCard title="Connected services">
      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e7ebe8] bg-[#F9FAFB] px-3.5 py-3"
          >
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-[#17231c]">{service.title}</p>
              <p className="mt-0.5 text-[12px] text-[#8a948e]">{service.subtitle}</p>
            </div>
            <span
              className={cn(
                'inline-flex shrink-0 rounded-full px-2.5 py-[3px] text-[11px] font-bold',
                service.status === 'Connected'
                  ? 'bg-[#e8f7ed] text-[#147940]'
                  : 'bg-[#eff2f0] text-[#637068]',
              )}
            >
              {service.status}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export default function AdminSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabId = searchParams.get('tab') || 'general'
  const activeTab = TABS.find((item) => item.id === tabId) || TABS[0]

  const [state, setState] = useState(DEFAULT_STATE)
  const [saveMessage, setSaveMessage] = useState(null)
  const { pageData, error, isLoading, enabled, refetch } = useAdminSettings()
  const { mutate: saveSettings, isLoading: isSaving, error: saveError, reset: resetSave } = useApiMutation(
    ({ tabId: saveTabId, form }) => adminSettingsService.saveTab(saveTabId, form),
  )

  useEffect(() => {
    if (!pageData) return
    setState((prev) => ({
      ...prev,
      general: pageData.general ? { ...prev.general, ...pageData.general } : prev.general,
      localization: pageData.localization
        ? { ...prev.localization, ...pageData.localization }
        : prev.localization,
      notifications: pageData.notifications
        ? { ...prev.notifications, ...pageData.notifications }
        : prev.notifications,
      security: pageData.security ? { ...prev.security, ...pageData.security } : prev.security,
    }))
  }, [pageData])

  const visibleTabs = useMemo(() => {
    const apiTabs = pageData?.tabs
    if (!Array.isArray(apiTabs) || apiTabs.length === 0) return TABS
    const allowed = new Set(apiTabs)
    const filtered = TABS.filter((tab) => allowed.has(tab.id))
    return filtered.length > 0 ? filtered : TABS
  }, [pageData])

  const canSave = activeTab.id !== 'integrations'

  const setTabField = (section, key, value) => {
    setState((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  const toggleInList = (section, key, value) => {
    setState((prev) => {
      const list = prev[section][key]
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: next,
        },
      }
    })
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaveMessage(null)
    resetSave()

    const sectionKey = activeTab.id
    const form = state[sectionKey]
    if (!form || typeof form !== 'object') return

    try {
      const result = await saveSettings({ tabId: sectionKey, form })
      if (result?.data && typeof result.data === 'object') {
        setState((prev) => ({
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            ...result.data,
          },
        }))
      }
      setSaveMessage('Settings saved.')
      refetch()
    } catch {
      // error surfaced via saveError
    }
  }

  const content = useMemo(() => {
    if (activeTab.id === 'general') {
      return (
        <GeneralTab
          form={state.general}
          setField={(key, value) => setTabField('general', key, value)}
        />
      )
    }
    if (activeTab.id === 'localization') {
      return (
        <LocalizationTab
          form={state.localization}
          setField={(key, value) => setTabField('localization', key, value)}
          toggleInList={(key, value) => toggleInList('localization', key, value)}
        />
      )
    }
    if (activeTab.id === 'notifications') {
      return (
        <NotificationsTab
          form={state.notifications}
          setField={(key, value) => setTabField('notifications', key, value)}
        />
      )
    }
    if (activeTab.id === 'security') {
      return (
        <SecurityTab
          form={state.security}
          setField={(key, value) => setTabField('security', key, value)}
        />
      )
    }
    return <IntegrationsTab services={state.integrations} />
  }, [activeTab.id, state])

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#17231c]">{activeTab.title}</h2>
        {canSave ? (
          <button
            type="button"
            disabled={!enabled || isSaving}
            onClick={handleSave}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {visibleTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSaveMessage(null)
              resetSave()
              setSearchParams(item.id === 'general' ? {} : { tab: item.id })
            }}
            className={cn(
              'inline-flex h-[32px] items-center rounded-full border px-3.5 text-[12.5px] font-semibold transition',
              activeTab.id === item.id
                ? 'border-[#bfe4cc] bg-[#e8f7ed] text-[#137333]'
                : 'border-[#e3e6e3] bg-white text-[#455249] hover:border-[#cfd6d1]',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {enabled && isLoading && !pageData ? (
        <p className="mb-3 text-[13px] text-[#8a948e]">Loading settings…</p>
      ) : null}
      {enabled && error ? (
        <p className="mb-3 text-[13px] text-[#c91a24]">
          {error.message || 'Unable to load settings.'}{' '}
          <button type="button" className="underline" onClick={refetch}>
            Retry
          </button>
        </p>
      ) : null}
      {saveError ? (
        <p className="mb-3 text-[13px] text-[#c91a24]">
          {saveError.message || 'Unable to save settings.'}
        </p>
      ) : null}
      {saveMessage ? <p className="mb-3 text-[13px] text-[#147940]">{saveMessage}</p> : null}

      {content}
    </div>
  )
}

export const SETTINGS_TAB_TITLES = Object.fromEntries(TABS.map((tab) => [tab.id, tab.topbar]))
