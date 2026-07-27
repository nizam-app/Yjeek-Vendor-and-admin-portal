import {
  mapAdminOpsIncidentBoardItem,
  mapAdminOpsIncidentBoardResponse,
} from './mapAdminOpsIncidentBoard'

export const mapAdminServicesBoardItem = mapAdminOpsIncidentBoardItem

/**
 * Map confirmed GET /admin/dashboard/boards/services `data` into IncidentBoard UI shape.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminServicesBoardResponse(data) {
  return mapAdminOpsIncidentBoardResponse(data, {
    board: 'services',
    activeLabel: 'active services',
    invalidMessage: 'Invalid services board response from the server.',
  })
}
