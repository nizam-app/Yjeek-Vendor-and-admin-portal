import {
  mapAdminOpsIncidentBoardItem,
  mapAdminOpsIncidentBoardResponse,
} from './mapAdminOpsIncidentBoard'

export const mapAdminDineInBoardItem = mapAdminOpsIncidentBoardItem

/**
 * Map confirmed GET /admin/dashboard/boards/dine_in `data` into IncidentBoard UI shape.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminDineInBoardResponse(data) {
  return mapAdminOpsIncidentBoardResponse(data, {
    board: 'dine_in',
    activeLabel: 'active dine-in',
    invalidMessage: 'Invalid dine-in board response from the server.',
  })
}
