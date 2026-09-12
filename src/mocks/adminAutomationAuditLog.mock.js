/** Frontend mock source for Automation → Audit Log. Read-only / permanent / non-deletable. */

export function getAuditLogMock() {
  return {
    header: {
      title: 'Audit Log',
      subtitle: 'All automation rule changes · permanent · non-deletable',
    },
    metadata: {
      permanent: true,
      deletable: false,
    },
    exportFilename: 'yjeek-automation-audit-log.csv',
    vendorAcceptance: {
      title: 'Vendor acceptance log — today',
      columns: ['Order', 'Vendor', 'Type', 'Placed at', 'Accepted at', 'Elapsed', 'Status'],
      rows: [
        {
          id: 'yjk-4201',
          order: 'YJK-4201',
          vendor: 'Green Kitchen',
          type: 'On-demand',
          placedAt: '14:20:00',
          acceptedAt: '14:20:38',
          elapsed: '38s',
          statusLabel: '✓ On time',
          statusTone: 'onTime',
        },
        {
          id: 'yjk-4200',
          order: 'YJK-4200',
          vendor: 'Burger Boss',
          type: 'On-demand',
          placedAt: '14:12:00',
          acceptedAt: '14:13:11',
          elapsed: '71s',
          statusLabel: '⚠ Late',
          statusTone: 'late',
        },
        {
          id: 'yjk-4197',
          order: 'YJK-4197',
          vendor: 'TechHub',
          type: 'Same Day',
          placedAt: '11:42:00',
          acceptedAt: '11:44:28',
          elapsed: '148s',
          statusLabel: '⚠ Late · dispatcher resolved',
          statusTone: 'late',
        },
        {
          id: 'yjk-4190',
          order: 'YJK-4190',
          vendor: 'Vapeology',
          type: 'On-demand',
          placedAt: '10:55:00',
          acceptedAt: '—',
          elapsed: '120s+',
          statusLabel: '✗ No response · cancelled',
          statusTone: 'none',
        },
      ],
    },
    ruleChanges: {
      title: 'Rule change audit log',
      columns: [
        'Timestamp',
        'Module',
        'Field changed',
        'Changed by',
        'From',
        'To',
        'Reason',
      ],
      rows: [
        {
          id: 'rc-1',
          timestamp: 'Today 09:14',
          module: 'Stacking · T2',
          fieldChanged: 'Hold window',
          changedBy: 'ops@yjeek.com',
          from: '120s',
          to: '90s',
          reason: 'Reduce customer wait on long-distance',
        },
        {
          id: 'rc-2',
          timestamp: 'Yesterday 16:30',
          module: 'Scoring',
          fieldChanged: 'ETA weight',
          changedBy: 'ops@yjeek.com',
          from: '35%',
          to: '40%',
          reason: 'Pickup speed priority increased',
        },
        {
          id: 'rc-3',
          timestamp: 'Yesterday 11:02',
          module: 'Expansion',
          fieldChanged: 'Stage 2 radius',
          changedBy: 'admin@yjeek.com',
          from: '10km',
          to: '8km',
          reason: 'Too many long-distance offers in Riffa',
        },
        {
          id: 'rc-4',
          timestamp: '2 days ago',
          module: 'Dispatch',
          fieldChanged: 'Active order cap',
          changedBy: 'ops@yjeek.com',
          from: '4',
          to: '3',
          reason: 'Excessive stacking complaints',
        },
      ],
    },
  }
}

function csvEscape(value) {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/** Build a client-side CSV of currently displayed Audit Log columns only. */
export function buildAuditLogCsv(catalog = getAuditLogMock()) {
  const lines = []

  lines.push('Vendor acceptance log — today')
  lines.push(catalog.vendorAcceptance.columns.map(csvEscape).join(','))
  catalog.vendorAcceptance.rows.forEach((row) => {
    lines.push(
      [
        row.order,
        row.vendor,
        row.type,
        row.placedAt,
        row.acceptedAt,
        row.elapsed,
        row.statusLabel,
      ]
        .map(csvEscape)
        .join(','),
    )
  })

  lines.push('')
  lines.push('Rule change audit log')
  lines.push(catalog.ruleChanges.columns.map(csvEscape).join(','))
  catalog.ruleChanges.rows.forEach((row) => {
    lines.push(
      [
        row.timestamp,
        row.module,
        row.fieldChanged,
        row.changedBy,
        row.from,
        row.to,
        row.reason,
      ]
        .map(csvEscape)
        .join(','),
    )
  })

  return `${lines.join('\n')}\n`
}

export function downloadAuditLogCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
