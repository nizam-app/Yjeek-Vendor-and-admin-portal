import { createDuration, createOperatorNumber } from './adminAutomationDispatchRules.mock'

/** Frontend mock source for Automation → Stacking. */

export function createStackingEditableDefaults() {
  return {
    dropZoneRadiusKm: createOperatorNumber('≤', 2),
    longDistanceThresholdKm: createOperatorNumber('≥', 10),
    holdWindow: createDuration('≤', 0, 1, 30),
    reevaluateAtStage3: true,
    interVendorPickupRadiusKm: createOperatorNumber('≤', 4),
    trigger3Enabled: true,
  }
}

export function getStackingMock() {
  return {
    header: {
      title: 'Stacking Engine',
      subtitle: 'Configure multi-order assignment triggers · free Champ always has priority over stacking',
    },
    corePrinciple: {
      label: 'Core principle',
      body: 'Free Champ always takes priority. Stacking is a controlled exception triggered by three specific conditions below. Every proposed stack is validated by Google Maps Directions API before confirming. Delivery sequence is locked in the Champ app — cannot be reordered by the Champ.',
    },
    vehicleCapacity: {
      title: 'Vehicle stacking capacity',
      columns: ['Vehicle', 'Max active orders', 'Trigger 1', 'Trigger 2', 'Trigger 3'],
      rows: [
        {
          id: 'bike',
          vehicle: 'Bike',
          maxActiveOrders: { kind: 'value', text: '2' },
          trigger1: { kind: 'pill', text: 'Off at launch', tone: 'off' },
          trigger2: { kind: 'no', text: '✗' },
          trigger3: { kind: 'no', text: '✗' },
        },
        {
          id: 'car',
          vehicle: 'Car',
          maxActiveOrders: { kind: 'value', text: '3' },
          trigger1: { kind: 'yes', text: '✓ up to 3' },
          trigger2: { kind: 'yes', text: '✓ up to 3' },
          trigger3: { kind: 'yes', text: '✓ up to 3' },
        },
        {
          id: 'cargo',
          vehicle: 'Cargo Van',
          maxActiveOrders: { kind: 'phase2', text: 'TBD Phase 2' },
          trigger1: { kind: 'phase2', text: 'Phase 2' },
          trigger2: { kind: 'phase2', text: 'Phase 2' },
          trigger3: { kind: 'phase2', text: 'Phase 2' },
          phase2: true,
        },
      ],
    },
    trigger1: {
      title: 'Trigger 1 — Same Vendor / Same Drop Zone',
      subtitle: 'Fires even when free Champs are available — same vendor same zone is always more efficient',
      status: 'Always Active',
      statusTone: 'on',
      dropZoneLabel: 'Same drop zone radius',
      dropZoneUnit: 'km between any pair of drops',
      bikeStackingLabel: 'Bike stacking under Trigger 1',
      bikeStackingBadge: 'Off at launch — enable when policy defined',
      multiVendorLabel: 'Multi-vendor scheduled cart (max 3 vendors)',
      multiVendorToggleLabel: 'Disabled — enable when ready',
    },
    trigger2: {
      title: 'Trigger 2 — Long Distance Economics',
      subtitle: 'Activates 90s hold window on orders beyond the distance threshold · car only',
      status: 'Active',
      statusTone: 'on',
      longDistanceLabel: 'Long distance threshold',
      longDistanceUnit: 'km from vendor to drop',
      holdWindowLabel: 'Hold window before solo dispatch',
      reevaluateLabel: 'Re-evaluate at expansion Stage 3+',
      reevaluateToggleLabel: 'Check companion bundling when radius hits 12km',
    },
    trigger3: {
      title: 'Trigger 3 — Supply Shortage Fallback',
      subtitle:
        'Fires before broadcast after Offer 1 + Offer 2 both time out · last resort before open broadcast',
      status: 'Fallback only',
      statusTone: 'warn',
      pickupRadiusLabel: 'Inter-vendor pickup radius',
      pickupRadiusUnit: 'km between all vendor pickups',
      enabledLabel: 'Trigger 3 enabled',
      enabledToggleLabel: 'Active',
    },
    editable: createStackingEditableDefaults(),
  }
}

export function cloneStackingEditable(editable) {
  return structuredClone(editable)
}
