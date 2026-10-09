import {
  Activity,
  BarChart3,
  Bike,
  Clock3,
  Megaphone,
  PanelTop,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  Workflow,
} from 'lucide-react'

/** @type {Record<string, import('lucide-react').LucideIcon>} */
export const ADMIN_NAV_ICONS = {
  Activity,
  ShoppingBag,
  Store,
  Bike,
  Users,
  Megaphone,
  Clock3,
  Workflow,
  PanelTop,
  ShieldCheck,
  BarChart3,
  Settings,
}

export function adminNavIcon(iconId) {
  return ADMIN_NAV_ICONS[iconId] || Activity
}
