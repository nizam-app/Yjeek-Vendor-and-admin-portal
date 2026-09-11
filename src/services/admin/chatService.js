import { apiClient } from '../../api/client'
import { isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import { ApiError } from '../../api/errors'
import {
  mapAdminChatReadResponse,
  mapAdminConversationResponse,
  mapAdminSentChatMessage,
} from '../../mappers/admin/mapAdminConversation'

/**
 * Admin chat conversation service.
 *
 * Confirmed:
 * - GET /admin/chats/:conversationId
 * - POST /admin/chats/:conversationId/read
 * - POST /admin/chats/:conversationId/messages  body: { body }
 */
export const adminChatService = {
  /**
   * GET /admin/chats/:conversationId
   * @param {string} conversationId
   */
  async getConversation(conversationId, options = {}) {
    const id = String(conversationId || '').trim()
    if (!id) {
      throw new ApiError({ message: 'Conversation id is required.' })
    }

    if (!isAdminRealApiFeature('dashboard')) {
      throw new ApiError({
        message: 'Admin chat conversation requires the dashboard real-API feature.',
      })
    }

    const response = await apiClient.get(endpoints.admin.chats.conversation(id), {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminConversationResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * POST /admin/chats/:conversationId/read (no body)
   * @param {string} conversationId
   */
  async markRead(conversationId, options = {}) {
    const id = String(conversationId || '').trim()
    if (!id) {
      throw new ApiError({ message: 'Conversation id is required.' })
    }

    const response = await apiClient.post(endpoints.admin.chats.read(id), null, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminChatReadResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * POST /admin/chats/:conversationId/messages
   * @param {string} conversationId
   * @param {{ body: string }} payload
   */
  async sendMessage(conversationId, payload = {}, options = {}) {
    const id = String(conversationId || '').trim()
    if (!id) {
      throw new ApiError({ message: 'Conversation id is required.' })
    }

    const body = String(payload.body ?? '').trim()
    if (!body) {
      throw new ApiError({ message: 'Message body is required.' })
    }

    const response = await apiClient.post(
      endpoints.admin.chats.messages(id),
      { body },
      {
        ...options,
        scope: 'admin',
        feature: 'dashboard',
      },
    )

    return {
      data: mapAdminSentChatMessage(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * PATCH /admin/chats/:conversationId/status
   */
  async updateStatus(conversationId, payload = {}, options = {}) {
    const id = String(conversationId || '').trim()
    if (!id) {
      throw new ApiError({ message: 'Conversation id is required.' })
    }

    const response = await apiClient.patch(endpoints.admin.chats.status(id), payload, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },
}
