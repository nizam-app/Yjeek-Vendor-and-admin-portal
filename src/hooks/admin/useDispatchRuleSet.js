import { useCallback, useState } from 'react'
import { useApiResource } from '../useApiResource'
import { useApiMutation } from '../useApiMutation'
import { isAutomationRealApi } from '../../services/admin/dispatchAutomationFeature'
import { adminDispatchRulesService } from '../../services/admin/dispatchRulesService'
import { adminDispatchAutomationService } from '../../services/admin/dispatchAutomationService'

/**
 * Load working DispatchRuleSet (active preferred) for Automation screens.
 * Does NOT depend on overview succeeding — overview id is best-effort only.
 * Auto-creates a default DRAFT rule set when the list is empty.
 */
export function useDispatchRuleSet() {
  const enabled = isAutomationRealApi()
  const [creating, setCreating] = useState(false)

  const resource = useApiResource(() => {
    if (!enabled) {
      return Promise.resolve({ data: null, meta: null })
    }

    // Prefer active id from overview when available; never fail the whole page if overview fails.
    return adminDispatchAutomationService
      .getOverview()
      .then((overviewResult) => overviewResult?.data?.activeRuleSet?.id ?? null)
      .catch(() => null)
      .then((overviewActiveId) =>
        adminDispatchRulesService.getWorkingOrCreate({ overviewActiveId }),
      )
  }, [enabled])

  const patchMutation = useApiMutation((ruleSetId, fullConfig) =>
    adminDispatchRulesService.updateDraft(ruleSetId, fullConfig),
  )
  const mergePatchMutation = useApiMutation((ruleSetId, applyEdits, editable) =>
    adminDispatchRulesService.mergeLatestAndPatch(ruleSetId, applyEdits, editable),
  )
  const activateMutation = useApiMutation((ruleSetId, note) =>
    adminDispatchRulesService.activate(ruleSetId, note),
  )
  const simulateMutation = useApiMutation((ruleSetId, input) =>
    adminDispatchRulesService.simulate(ruleSetId, input),
  )
  const simulateStackingMutation = useApiMutation((ruleSetId, input) =>
    adminDispatchRulesService.simulateStacking(ruleSetId, input),
  )
  const testModeMutation = useApiMutation((ruleSetId) =>
    adminDispatchRulesService.enterTestMode(ruleSetId),
  )
  const pauseMutation = useApiMutation((ruleSetId) => adminDispatchRulesService.pause(ruleSetId))
  const rollbackMutation = useApiMutation((ruleSetId, input) =>
    adminDispatchRulesService.rollback(ruleSetId, input),
  )

  const applyServerResult = useCallback(
    (result) => {
      if (result?.data) {
        resource.setData?.(result.data)
      }
      return result
    },
    [resource],
  )

  const createDefault = useCallback(async () => {
    setCreating(true)
    try {
      const template = await adminDispatchRulesService.getTemplate()
      const result = await adminDispatchRulesService.create({
        name: 'Platform default dispatch rules',
        config: template.data,
      })
      applyServerResult(result)
      return result
    } finally {
      setCreating(false)
    }
  }, [applyServerResult])

  const requireId = () => {
    const id = resource.data?.rule?.id
    if (!id) throw new Error('No dispatch rule set loaded.')
    return id
  }

  return {
    enabled,
    isLoading: resource.isLoading,
    error: resource.error,
    refetch: resource.refetch,
    rule: resource.data?.rule ?? null,
    meta: resource.data?.meta ?? null,
    draftConfig: resource.data?.draftConfig ?? null,
    empty: Boolean(resource.data?.empty),
    createDefault,
    isCreating: creating,
    patchDraft: async (fullConfig) => {
      const result = await patchMutation.mutate(requireId(), fullConfig)
      return applyServerResult(result)
    },
    /**
     * Preferred Save Changes path: re-fetch latest draft, apply section edits, PATCH.
     */
    mergeAndPatch: async (applyEdits, editable) => {
      const result = await mergePatchMutation.mutate(requireId(), applyEdits, editable)
      return applyServerResult(result)
    },
    activate: async (note) => {
      const result = await activateMutation.mutate(requireId(), note)
      return applyServerResult(result)
    },
    enterTestMode: async () => {
      const result = await testModeMutation.mutate(requireId())
      return applyServerResult(result)
    },
    pause: async () => {
      const result = await pauseMutation.mutate(requireId())
      return applyServerResult(result)
    },
    rollback: async (input) => {
      const result = await rollbackMutation.mutate(requireId(), input)
      return applyServerResult(result)
    },
    simulate: async (input) => {
      return simulateMutation.mutate(requireId(), input)
    },
    simulateStacking: async (input) => {
      return simulateStackingMutation.mutate(requireId(), input)
    },
    isSaving: patchMutation.isLoading || mergePatchMutation.isLoading,
    isActivating: activateMutation.isLoading,
    isSimulating: simulateMutation.isLoading,
    isSimulatingStacking: simulateStackingMutation.isLoading,
    isEnteringTestMode: testModeMutation.isLoading,
    isPausing: pauseMutation.isLoading,
    isRollingBack: rollbackMutation.isLoading,
    patchError: patchMutation.error || mergePatchMutation.error,
    activateError: activateMutation.error,
    simulateError: simulateMutation.error || simulateStackingMutation.error,
    lifecycleError:
      testModeMutation.error || pauseMutation.error || rollbackMutation.error || null,
  }
}
