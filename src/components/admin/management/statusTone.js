export function statusTone(status) {
  if (['Active', 'Open', 'Available', 'Ready', 'On delivery'].includes(status)) return 'green'
  if (['Pending', 'Under review', 'Scheduled', 'Draft', 'Busy'].includes(status)) return 'yellow'
  if (['Offline', 'Paused', 'Inactive', 'Suspended'].includes(status)) return 'red'
  return 'gray'
}
