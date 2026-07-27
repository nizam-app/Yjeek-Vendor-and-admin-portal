import {
  mapAdminOpsIncidentBoardItem,
  mapAdminOpsIncidentBoardResponse,
} from './mapAdminOpsIncidentBoard'

/** @deprecated Prefer mapAdminOpsIncidentBoardItem — kept for existing imports. */
export const mapAdminPickupBoardItem = mapAdminOpsIncidentBoardItem

/**
 * Map confirmed GET /admin/dashboard/boards/pickup `data` into IncidentBoard UI shape.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminPickupBoardResponse(data) {
  return mapAdminOpsIncidentBoardResponse(data, {
    board: 'pickup',
    activeLabel: 'active pickups',
    invalidMessage: 'Invalid pickup board response from the server.',
  })
}
