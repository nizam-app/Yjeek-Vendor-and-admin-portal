import { toast } from 'sonner'

export function showSuccess(message, options = {}) {
  if (!message) return
  toast.success(message, options)
}

export function showError(message, options = {}) {
  if (!message) return
  toast.error(message, options)
}

export function showInfo(message, options = {}) {
  if (!message) return
  toast.info(message, options)
}

export function showFlashMessage(message, tone = 'success') {
  if (!message) return
  if (tone === 'error') showError(message)
  else if (tone === 'info') showInfo(message)
  else showSuccess(message)
}
