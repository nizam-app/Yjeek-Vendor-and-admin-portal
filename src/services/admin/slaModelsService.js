import { apiClient } from '../../api/client'
import { apiConfig } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminSlaModelList,
  mapAdminSlaModelRecord,
  mapAdminSlaTemplate,
  mapSlaConfigToForm,
  mapSlaFormToConfig,
  pickWorkingSlaModel,
} from '../../mappers/admin/mapAdminSlaModels'

const DEFAULT_MODEL_NAME = 'Platform default SLA'

function requestOptions(options = {}) {
  return {
    ...options,
    scope: 'admin',
    feature: 'sla-models',
    forceReal: !apiConfig.adminUseMockApi,
  }
}

function readConfig(model) {
  return model?.config && typeof model.config === 'object' ? model.config : {}
}

/**
 * Admin SLA Models page.
 *
 * Confirmed:
 *   GET  /admin/sla-models/template
 *   GET  /admin/sla-models
 *   GET  /admin/sla-models/:id
 *   POST /admin/sla-models
 *   PATCH /admin/sla-models/:id
 *   POST /admin/sla-models/:id/publish
   *   POST /admin/sla-models/:id/set-default
   *   POST /admin/sla-models/:id/reset
 *
 * Feature flag: `sla-models` (also on when VITE_ADMIN_USE_MOCK_API=false)
 */
export const adminSlaModelsService = {
  async getTemplate(options = {}) {
    const response = await apiClient.get(
      endpoints.admin.slaModels.template,
      requestOptions(options),
    )
    return {
      data: mapAdminSlaTemplate(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async list(options = {}) {
    const { search = '', active = 'all', status, limit = 50, page = 1, ...requestOpts } = options
    const params = {
      search: String(search || '').trim(),
      active,
      limit,
      page,
    }
    if (status) params.status = status

    const response = await apiClient.get(endpoints.admin.slaModels.list, {
      ...requestOptions(requestOpts),
      params,
    })

    const models = mapAdminSlaModelList(response?.data)
    return {
      data: {
        models,
        total: Number(response?.data?.total ?? models.length) || models.length,
        page: Number(response?.data?.page ?? page) || page,
      },
      meta: response?.meta ?? null,
    }
  },

  async getById(slaModelId, options = {}) {
    const id = String(slaModelId || '').trim()
    if (!id) throw new Error('SLA model id is required.')

    const response = await apiClient.get(
      endpoints.admin.slaModels.detail(id),
      requestOptions(options),
    )
    return {
      data: mapAdminSlaModelRecord(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Load the working model for the SLA Models editor:
   * template defaults + existing default/published model (create-ready if none).
   */
  async getForPage(options = {}) {
    const requestOpts = requestOptions(options)
    const [templateResponse, listResponse] = await Promise.all([
      this.getTemplate(requestOpts),
      this.list({ active: 'all', limit: 50, page: 1, ...requestOpts }),
    ])

    const template = templateResponse.data
    let model = pickWorkingSlaModel(listResponse.data?.models || [])

    if (model?.id && (!model.config || Object.keys(model.config).length === 0)) {
      const detail = await this.getById(model.id, requestOpts)
      model = detail.data
    }

    const config = model ? readConfig(model) : readConfig(template)
    const form = mapSlaConfigToForm(config)

    return {
      data: {
        model,
        template,
        form,
        config,
        isNew: !model?.id,
      },
      meta: listResponse.meta,
    }
  },

  async create(payload, options = {}) {
    const response = await apiClient.post(
      endpoints.admin.slaModels.list,
      payload,
      requestOptions(options),
    )
    return {
      data: mapAdminSlaModelRecord(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async update(slaModelId, payload, options = {}) {
    const id = String(slaModelId || '').trim()
    if (!id) throw new Error('SLA model id is required.')

    const response = await apiClient.patch(
      endpoints.admin.slaModels.detail(id),
      payload,
      requestOptions(options),
    )
    return {
      data: mapAdminSlaModelRecord(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async publish(slaModelId, payload = {}, options = {}) {
    const id = String(slaModelId || '').trim()
    if (!id) throw new Error('SLA model id is required.')

    const response = await apiClient.post(
      endpoints.admin.slaModels.publish(id),
      {
        note: payload.note || 'Updated from Admin SLA Models',
        updateActiveAssignments: payload.updateActiveAssignments !== false,
      },
      requestOptions(options),
    )
    return {
      data: mapAdminSlaModelRecord(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async setDefault(slaModelId, options = {}) {
    const id = String(slaModelId || '').trim()
    if (!id) throw new Error('SLA model id is required.')

    const response = await apiClient.post(
      endpoints.admin.slaModels.setDefault(id),
      {},
      requestOptions(options),
    )
    return {
      data: mapAdminSlaModelRecord(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async reset(slaModelId, options = {}) {
    const id = String(slaModelId || '').trim()
    if (!id) throw new Error('SLA model id is required.')

    const response = await apiClient.post(
      endpoints.admin.slaModels.reset(id),
      {},
      requestOptions(options),
    )
    return {
      data: mapAdminSlaModelRecord(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async rollback(slaModelId, payload = {}, options = {}) {
    const id = String(slaModelId || '').trim()
    if (!id) throw new Error('SLA model id is required.')
    const version = Number(payload.version)
    if (!Number.isFinite(version) || version < 1) {
      throw new Error('SLA version is required.')
    }

    const response = await apiClient.post(
      endpoints.admin.slaModels.rollback(id),
      {
        version,
        note: payload.note || `Applied SLA version ${version} from Admin preview`,
        updateActiveAssignments: payload.updateActiveAssignments !== false,
      },
      requestOptions(options),
    )
    return {
      data: mapAdminSlaModelRecord(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async getChangelog(slaModelId, options = {}) {
    const id = String(slaModelId || '').trim()
    if (!id) throw new Error('SLA model id is required.')
    const response = await apiClient.get(endpoints.admin.slaModels.changelog(id), {
      ...requestOptions(options),
        params: { limit: options.limit ?? 100 },
    })
    return {
      data: {
        modelId: response?.data?.modelId ?? id,
        changes: Array.isArray(response?.data?.changes) ? response.data.changes : [],
      },
      meta: response?.meta ?? null,
    }
  },

  async getVersionUsage(slaModelId, options = {}) {
    const id = String(slaModelId || '').trim()
    if (!id) throw new Error('SLA model id is required.')
    const response = await apiClient.get(
      endpoints.admin.slaModels.versionUsage(id),
      requestOptions(options),
    )
    return {
      data: response?.data ?? {
        modelId: id,
        version: 0,
        incidentCount: 0,
        breachCount: 0,
        orderCount: 0,
        message: 'No published version yet.',
      },
      meta: response?.meta ?? null,
    }
  },

  async getVersions(slaModelId, options = {}) {
    const id = String(slaModelId || '').trim()
    if (!id) throw new Error('SLA model id is required.')
    const response = await apiClient.get(
      endpoints.admin.slaModels.versions(id),
      requestOptions(options),
    )
    return {
      data: {
        modelId: response?.data?.modelId ?? id,
        currentVersion: Number(response?.data?.currentVersion ?? 0) || 0,
        versions: Array.isArray(response?.data?.versions) ? response.data.versions : [],
      },
      meta: response?.meta ?? null,
    }
  },

  /**
   * Persist the three-tab form: POST when no model exists, otherwise PATCH.
   * Then publish so the rules go live, and set default on first create.
   */
  async saveForm(
    { model, template, vendorValues, champValues, dispatcherValues, config },
    options = {},
  ) {
    const payloadConfig = mapSlaFormToConfig(
      vendorValues,
      champValues,
      dispatcherValues,
      config || {},
    )
    const name = String(model?.name || template?.name || DEFAULT_MODEL_NAME).trim() || DEFAULT_MODEL_NAME
    const categoryLabel = model?.categoryLabel || template?.categoryLabel || 'Food & Beverage'
    const description = model?.description || template?.description || ''

    let saved
    const created = !model?.id
    if (created) {
      saved = await this.create(
        {
          name,
          categoryLabel,
          description,
          isActive: true,
          config: payloadConfig,
        },
        options,
      )
    } else {
      saved = await this.update(
        model.id,
        { config: payloadConfig },
        options,
      )
    }

    let published = saved
    try {
      published = await this.publish(saved.data.id, {
        note: created ? 'Created from Admin SLA Models' : 'Updated from Admin SLA Models',
        updateActiveAssignments: true,
      }, options)
    } catch (error) {
      error.draftSaved = true
      error.savedModel = saved.data
      throw error
    }

    if (created && !published.data.isDefault) {
      try {
        published = await this.setDefault(published.data.id, options)
      } catch {
        // Publish already succeeded; default flag is optional.
      }
    }

    const nextConfig = readConfig(published.data)
    return {
      data: {
        model: published.data,
        form: mapSlaConfigToForm(nextConfig),
        config: nextConfig,
        isNew: false,
      },
      meta: published.meta,
    }
  },
}
