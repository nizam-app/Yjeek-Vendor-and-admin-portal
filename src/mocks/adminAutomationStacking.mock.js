import { createDuration, createOperatorNumber } from './adminAutomationDispatchRules.mock'

/** Frontend mock source for Automation → Stacking. */

export function createStackingEditableDefaults() {
  return {
    dropZoneRadiusKm: createOperatorNumber('≤', 2),
    companionDropKm: createOperatorNumber('≤', 2),
    longDistanceThresholdKm: createOperatorNumber('≥', 10),
    holdWindow: createDuration('≤', 0, 1, 30),
    reevaluateAtStage3: true,
    interVendorPickupRadiusKm: createOperatorNumber('≤', 4),
    requiredFailedOffers: createOperatorNumber('≥', 2),
    maxCarOrders: createOperatorNumber('≤', 3),
    trigger1Enabled: true,
    trigger2Enabled: true,
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
      maxCarOrdersLabel: 'Car max active orders (stacking.maxCarOrders)',
      maxCarOrdersUnit: 'orders (2–3)',
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
      title: 'Trigger 1 · Same Vendor · Same Drop Zone',
      subtitle: 'Fires even when free Champs are available — same vendor same zone is always more efficient',
      status: 'Always Active',
      statusTone: 'on',
      enabledLabel: 'Trigger 1 enabled',
      enabledToggleLabel: 'Active',
      dropZoneLabel: 'Same drop zone radius',
      dropZoneUnit: 'km between any pair of drops',
      bikeStackingLabel: 'Bike stacking under Trigger 1',
      bikeStackingBadge: 'Off at launch — enable when policy defined',
      multiVendorLabel: 'Multi-vendor scheduled cart (max 3 vendors)',
      multiVendorToggleLabel: 'Disabled — enable when ready',
    },
    trigger2: {
      title: 'Trigger 2 · Long Distance Economics',
      subtitle: 'Activates hold window on orders beyond the distance threshold · car only',
      status: 'Active',
      statusTone: 'on',
      enabledLabel: 'Trigger 2 enabled',
      enabledToggleLabel: 'Active',
      longDistanceLabel: 'Long distance threshold',
      longDistanceUnit: 'km from vendor to drop',
      companionDropLabel: 'Companion drop radius',
      companionDropUnit: 'km from primary drop',
      holdWindowLabel: 'Hold window before solo dispatch',
      reevaluateLabel: 'Re-evaluate at expansion Stage 3+',
      reevaluateToggleLabel: 'Check companion bundling when radius hits 12km',
    },
    trigger3: {
      title: 'Trigger 3 · Supply Shortage Fallback',
      subtitle:
        'Fires before broadcast after Offer 1 + Offer 2 both time out · last resort before open broadcast',
      status: 'Fallback only',
      statusTone: 'warn',
      pickupRadiusLabel: 'Inter-vendor pickup radius',
      pickupRadiusUnit: 'km between all vendor pickups',
      requiredFailedOffersLabel: 'Required failed direct offers',
      requiredFailedOffersUnit: 'offers before T3',
      enabledLabel: 'Trigger 3 enabled',
      enabledToggleLabel: 'Active',
    },
    dryRun: {
      title: 'Stacking dry-run',
      subtitle:
        'Evaluates T1/T2/T3 against recent same-vendor order pools. Side-effect free — no offers, holds, or RoutePlans.',
      buttonLabel: 'Run stacking dry-run',
    },
    activity: {
      title: 'Recent stacking activity',
      empty: 'No stacking RoutePlans yet (expected while liveEnabled=false).',
    },
    editable: createStackingEditableDefaults(),
  }
}

export function cloneStackingEditable(editable) {
  return structuredClone(editable)
}
