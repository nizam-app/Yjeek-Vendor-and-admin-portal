import { apiClient } from '../../api/client'
import { isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminCreateUserRequest,
  mapAdminUpdateUserRequest,
  mapAdminUserDetailResponse,
  mapAdminUsersListResponse,
  mapAdminUsersMetaResponse,
  mapAdminUsersSummaryResponse,
} from '../../mappers/admin/mapAdminUsers'
import {
  mapAdminActivityListParams,
  mapAdminActivityListResponse,
  mapAdminActivityMetaResponse,
} from '../../mappers/admin/mapAdminActivity'
import {
  mapAdminCreateRoleRequest,
  mapAdminRoleDetailResponse,
  mapAdminRolesListResponse,
  mapAdminRolesMetaResponse,
} from '../../mappers/admin/mapAdminRoles'

/**
 * Admin panel Users & Roles — staff accounts + roles.
 *
 * Confirmed users:
 *   GET /admin/users/summary|meta|list|/:id
 *   POST /admin/users
 *   PATCH /admin/users/:id
 *   POST /admin/users/:id/reset-password|resend-invite|suspend|unsuspend
 *   GET /admin/activity|/activity/meta|/activity/export
 * Confirmed roles:
 *   GET /admin/roles/meta
 *   GET /admin/roles
 *   GET /admin/roles/:roleId
 *
 * Feature flag: `users`
 */
export const adminUserService = {
  async getUsersSummary(options = {}) {
    if (!isAdminRealApiFeature('users')) {
      return { data: { stats: [], summary: {} }, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.users.summary, {
      ...options,
      scope: 'admin',
      feature: 'users',
    })

    return {
      data: mapAdminUsersSummaryResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async getUsersMeta(options = {}) {
    if (!isAdminRealApiFeature('users')) {
      return {
        data: { roles: [], countries: [], zones: [], modules: [], suggestedTemporaryPassword: '' },
        meta: null,
      }
    }

    const response = await apiClient.get(endpoints.admin.users.meta, {
      ...options,
      scope: 'admin',
      feature: 'users',
    })

    return {
      data: mapAdminUsersMetaResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * List admin users (Users tab).
   * Confirmed query: search, page, limit.
   * Also sends roleId / country / status when UI filters are set (backend may ignore).
   */
  async listUsers(options = {}) {
    const {
      search = '',
      page = 1,
      limit = 20,
      roleId = '',
      country = '',
      status = '',
      ...requestOptions
    } = options

    if (!isAdminRealApiFeature('users')) {
      return apiClient.get('/admin/management', {
        ...requestOptions,
        params: { type: 'users', ...(requestOptions.params || {}) },
        scope: 'admin',
      })
    }

    const params = {
      search: String(search || '').trim(),
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    }
    if (roleId) params.roleId = roleId
    if (country) params.country = country
    if (status) params.status = status

    const response = await apiClient.get(endpoints.admin.users.list, {
      ...requestOptions,
      params,
      scope: 'admin',
      feature: 'users',
    })

    return {
      data: mapAdminUsersListResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Create / invite admin user.
   * Confirmed: POST /admin/users → 201 + user detail (+ invitation)
   */
  async createUser(form = {}, options = {}) {
    if (!isAdminRealApiFeature('users')) {
      throw new Error('Real users API is required to create a user.')
    }

    const body = mapAdminCreateUserRequest(form)

    const response = await apiClient.post(endpoints.admin.users.create, body, {
      ...options,
      scope: 'admin',
      feature: 'users',
    })

    return {
      data: mapAdminUserDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Update user.
   * Confirmed: PATCH /admin/users/:id { jobTitle } (+ other account fields)
   */
  async updateUser(userId, form = {}, options = {}) {
    const id = String(userId || '').trim()
    if (!id) throw new Error('User id is required.')
    if (!isAdminRealApiFeature('users')) {
      throw new Error('Real users API is required to update a user.')
    }

    const body = mapAdminUpdateUserRequest(form)
    const response = await apiClient.patch(endpoints.admin.users.detail(id), body, {
      ...options,
      scope: 'admin',
      feature: 'users',
    })

    return {
      data: mapAdminUserDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Reset password — omit body password to auto-generate.
   * Confirmed: POST …/reset-password {} → { reset, temporaryPassword }
   */
  async resetUserPassword(userId, options = {}) {
    const id = String(userId || '').trim()
    if (!id) throw new Error('User id is required.')
    if (!isAdminRealApiFeature('users')) {
      throw new Error('Real users API is required to reset a password.')
    }

    const response = await apiClient.post(
      endpoints.admin.users.resetPassword(id),
      {},
      {
        ...options,
        scope: 'admin',
        feature: 'users',
      },
    )

    const raw = response?.data || {}
    return {
      data: {
        reset: Boolean(raw.reset ?? true),
        temporaryPassword: raw.temporaryPassword || null,
      },
      meta: response?.meta ?? null,
    }
  },

  async resendUserInvite(userId, options = {}) {
    const id = String(userId || '').trim()
    if (!id) throw new Error('User id is required.')
    if (!isAdminRealApiFeature('users')) {
      throw new Error('Real users API is required to resend an invite.')
    }

    const response = await apiClient.post(
      endpoints.admin.users.resendInvite(id),
      null,
      {
        ...options,
        scope: 'admin',
        feature: 'users',
      },
    )

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Suspend user. Confirmed 400 for PENDING invitations.
   */
  async suspendUser(userId, options = {}) {
    const id = String(userId || '').trim()
    if (!id) throw new Error('User id is required.')
    if (!isAdminRealApiFeature('users')) {
      throw new Error('Real users API is required to suspend a user.')
    }

    const response = await apiClient.post(
      endpoints.admin.users.suspend(id),
      null,
      {
        ...options,
        scope: 'admin',
        feature: 'users',
      },
    )

    return {
      data: response?.data ? mapAdminUserDetailResponse(response.data) : null,
      meta: response?.meta ?? null,
    }
  },

  async unsuspendUser(userId, options = {}) {
    const id = String(userId || '').trim()
    if (!id) throw new Error('User id is required.')
    if (!isAdminRealApiFeature('users')) {
      throw new Error('Real users API is required to unsuspend a user.')
    }

    const response = await apiClient.post(
      endpoints.admin.users.unsuspend(id),
      null,
      {
        ...options,
        scope: 'admin',
        feature: 'users',
      },
    )

    return {
      data: response?.data ? mapAdminUserDetailResponse(response.data) : null,
      meta: response?.meta ?? null,
    }
  },

  async getUserDetail(userId, options = {}) {
    const id = String(userId || '').trim()
    if (!id) {
      throw new Error('User id is required.')
    }

    if (!isAdminRealApiFeature('users')) {
      const response = await apiClient.get('/admin/management', {
        ...options,
        params: { type: 'users' },
        scope: 'admin',
      })
      const blob = response?.data || {}
      const row = (blob.rows || []).find((item) => String(item.id) === id)
      const detail = blob.details?.[id]
      if (!row || !detail) {
        throw new Error('User not found.')
      }
      return {
        data: {
          viewTabs: blob.viewTabs || ['Users', 'Roles', 'Activity log'],
          permissionActions: blob.permissionActions || ['view', 'create', 'edit', 'delete', 'approve'],
          row,
          detail: {
            ...detail,
            permissions: blob.rolePermissions?.[detail.roleFull] || [],
            activity: detail.activity || [],
            roleInheritedFrom: `Inherited from role — ${detail.roleFull}`,
          },
        },
        meta: response?.meta ?? null,
      }
    }

    const response = await apiClient.get(endpoints.admin.users.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'users',
    })

    return {
      data: mapAdminUserDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async getRolesMeta(options = {}) {
    if (!isAdminRealApiFeature('users')) {
      return {
        data: mapAdminRolesMetaResponse({
          modules: [],
          actions: [],
          scopeLevels: [],
          templates: [],
        }),
        meta: null,
      }
    }

    const response = await apiClient.get(endpoints.admin.roles.meta, {
      ...options,
      scope: 'admin',
      feature: 'users',
    })

    return {
      data: mapAdminRolesMetaResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async listRoles(options = {}) {
    if (!isAdminRealApiFeature('users')) {
      return apiClient.get('/admin/management', {
        ...options,
        params: { type: 'users' },
        scope: 'admin',
      })
    }

    const response = await apiClient.get(endpoints.admin.roles.list, {
      ...options,
      scope: 'admin',
      feature: 'users',
    })

    return {
      data: mapAdminRolesListResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async getRoleDetail(roleId, options = {}) {
    const id = String(roleId || '').trim()
    if (!id) {
      throw new Error('Role id is required.')
    }

    if (!isAdminRealApiFeature('users')) {
      throw new Error('Real users API is required to load role detail.')
    }

    const response = await apiClient.get(endpoints.admin.roles.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'users',
    })

    return {
      data: mapAdminRoleDetailResponse(response?.data, id),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Create role.
   * Confirmed: POST /admin/roles → 201 + role object
   */
  async createRole(form = {}, options = {}) {
    if (!isAdminRealApiFeature('users')) {
      throw new Error('Real users API is required to create a role.')
    }

    const body = mapAdminCreateRoleRequest(form)

    const response = await apiClient.post(endpoints.admin.roles.create, body, {
      ...options,
      scope: 'admin',
      feature: 'users',
    })

    return {
      data: mapAdminRoleDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Activity filters metadata.
   * Confirmed: GET /admin/activity/meta → users[], modules[], actionTypes[]
   */
  async getActivityMeta(options = {}) {
    if (!isAdminRealApiFeature('users')) {
      return {
        data: mapAdminActivityMetaResponse({ users: [], modules: [], actionTypes: [] }),
        meta: null,
      }
    }

    const response = await apiClient.get(endpoints.admin.activity.meta, {
      ...options,
      scope: 'admin',
      feature: 'users',
    })

    return {
      data: mapAdminActivityMetaResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Activity log list (+ optional meta for filters).
   * Confirmed: GET /admin/activity?search=&module=&actionType=&from=&to=&page=&limit=
   * Empty items[] is valid.
   */
  async listActivity(filters = {}, options = {}) {
    if (!isAdminRealApiFeature('users')) {
      throw new Error('Real users API is required for the activity log.')
    }

    const params = mapAdminActivityListParams(filters)
    const includeMeta = filters.includeMeta !== false

    const [listResponse, metaResult] = await Promise.all([
      apiClient.get(endpoints.admin.activity.list, {
        ...options,
        params,
        scope: 'admin',
        feature: 'users',
      }),
      includeMeta
        ? this.getActivityMeta(options)
        : Promise.resolve({ data: null, meta: null }),
    ])

    return {
      data: mapAdminActivityListResponse(listResponse?.data, metaResult?.data),
      meta: listResponse?.meta ?? null,
    }
  },

  /**
   * Export activity CSV.
   * Confirmed: GET /admin/activity/export?from=&to=
   * Response is CSV text (headers: Time, User, Action, Module, Type, Target, IP)
   */
  async exportActivity(filters = {}, options = {}) {
    if (!isAdminRealApiFeature('users')) {
      throw new Error('Real users API is required to export activity.')
    }

    const params = {}
    const from = String(filters.from || '').trim()
    const to = String(filters.to || '').trim()
    if (from) params.from = from
    if (to) params.to = to

    const response = await apiClient.get(endpoints.admin.activity.export, {
      ...options,
      params,
      scope: 'admin',
      feature: 'users',
    })

    const csv =
      typeof response?.data === 'string'
        ? response.data
        : response?.data == null
          ? ''
          : String(response.data)

    return { data: csv, meta: response?.meta ?? null }
  },
}
