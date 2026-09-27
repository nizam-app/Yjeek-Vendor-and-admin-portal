import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getCommissionInheritanceState,
  mapAdminUpdateVendorCommissionRequest,
  mapAdminVendorCommissionResponse,
  mapAdminWizardCommissionRequest,
} from '../src/mappers/admin/mapAdminVendorCommission.js'

describe('mapAdminVendorCommission — D08 Batch 5', () => {
  it('maps inheritance + seededFromStoreType and formats VAT as auto', () => {
    const mapped = mapAdminVendorCommissionResponse({
      model: 'PERCENT_OF_ORDER',
      commissionRate: 15,
      flatFeePerOrder: null,
      commissionTiers: [],
      customFees: [],
      platformServiceFee: 0.3,
      vatOnCommissionPct: 10,
      currency: 'BHD',
      gatewayFees: {
        fixedPct: 1,
        debitPct: 0.5,
        creditPct: 2,
        applePayPct: 1.5,
        googleWalletPct: 1.5,
        otherChargesPct: 0.5,
        fixedCharge: 0.05,
      },
      inheritance: {
        model: { state: 'inherited', defaultValue: 'PERCENT_OF_ORDER' },
        commissionRate: { state: 'overridden', defaultValue: 12 },
        gatewayFees: {
          fixedPct: { state: 'inherited', defaultValue: 1 },
        },
      },
      seededFromStoreType: true,
    })

    assert.equal(mapped.vatOnCommission, '10% (auto)')
    assert.equal(mapped.currency, 'BHD')
    assert.equal(mapped.seededFromStoreType, true)
    assert.equal(mapped.inheritance.commissionRate.state, 'overridden')
    assert.equal(getCommissionInheritanceState(mapped.inheritance, 'commissionRate'), 'overridden')
    assert.equal(
      getCommissionInheritanceState(mapped.inheritance, 'gatewayFees.fixedPct'),
      'inherited',
    )
  })

  it('wizard + modal PATCH bodies omit platformServiceFee and vatOnCommissionPct', () => {
    const wizardBody = mapAdminWizardCommissionRequest(
      {
        commissionModel: '% of order',
        commissionRate: '12',
        serviceFee: '0.300',
        vatOnCommission: '10% (auto)',
        currency: 'BHD',
        fixedPct: '1.000',
        debitPct: '0.500',
        creditPct: '2.000',
        applePayPct: '1.500',
        googleWalletPct: '1.500',
        otherChargesPct: '0.500',
        fixedCharge: '0.050',
      },
      { customFees: [{ name: 'Packaging', amount: 0.25, type: 'BHD' }] },
    )

    assert.equal(wizardBody.model, 'PERCENT_OF_ORDER')
    assert.equal(wizardBody.commissionRate, 12)
    assert.equal('platformServiceFee' in wizardBody, false)
    assert.equal('vatOnCommissionPct' in wizardBody, false)
    assert.equal('currency' in wizardBody, false)
    assert.deepEqual(wizardBody.gatewayFees.fixedPct, 1)
    assert.equal(wizardBody.customFees.length, 1)

    const modalBody = mapAdminUpdateVendorCommissionRequest({
      model: '% of order',
      rate: '10',
      platformServiceFee: '0.300',
      vatOnCommission: '10% (auto)',
      currency: 'BHD',
      gatewayFees: {
        fixedPct: '1.000',
        debitPct: '0.500',
        creditPct: '2.000',
        applePayPct: '1.500',
        googleWalletPct: '1.500',
        otherChargesPct: '0.500',
        fixedCharge: '0.050',
      },
      customFees: [{ name: 'Packaging', amount: 0.25, type: 'BHD' }],
    })

    assert.equal(modalBody.commissionRate, 10)
    assert.equal('platformServiceFee' in modalBody, false)
    assert.equal('vatOnCommissionPct' in modalBody, false)
    assert.equal(modalBody.customFees.length, 1)
  })
})
