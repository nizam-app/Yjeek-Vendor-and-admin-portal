import { useMemo, useState } from 'react'
import { calcHotFoodSideFee, formatBhd3 } from '../../../utils/hotFoodPerOrderFee'
import { MoneyOrKmInput } from './AdminStoreTypeHotFoodDefaults'

/**
 * Live per-order fee preview — uses trip distance, not max contribution ceiling.
 */
export default function HotFoodPerOrderPreview({ vendor, customer, disabled = false }) {
  const [distanceKm, setDistanceKm] = useState('8')
  const [itemsNet, setItemsNet] = useState('5')

  const vendorPreview = useMemo(
    () =>
      calcHotFoodSideFee({
        distanceKm,
        radiusKm: vendor.radiusKm,
        maxDistanceKm: vendor.maxDistanceKm,
        contribution: vendor.contribution,
        extraPerKm: vendor.extraPerKm,
      }),
    [vendor, distanceKm],
  )

  const customerPreview = useMemo(
    () =>
      calcHotFoodSideFee({
        distanceKm,
        radiusKm: customer.radiusKm,
        maxDistanceKm: vendor.maxDistanceKm,
        contribution: customer.contribution,
        extraPerKm: customer.extraPerKm,
      }),
    [vendor.maxDistanceKm, customer, distanceKm],
  )

  const freeOver = Number(vendor.freeDeliveryOver)
  const freeEnabled = Boolean(vendor.freeDeliveryEnabled)
  const items = Number(itemsNet)
  const customerWaived =
    freeEnabled &&
    Number.isFinite(freeOver) &&
    Number.isFinite(items) &&
    items >= freeOver &&
    customerPreview &&
    !customerPreview.outOfRange

  return (
    <div className="rounded-[12px] border border-[#d4e8dc] bg-[#f4fbf7] p-4">
      <div className="mb-3">
        <h4 className="text-[13.5px] font-bold text-[#17231c]">Per-order fee preview</h4>
        <p className="mt-0.5 text-[12px] leading-[16px] text-[#5c665f]">
          Uses actual trip distance: contribution + (billable extra km × extra per km). This is not
          the same as <strong>Max contribution</strong>, which is only the worst-case ceiling at max
          distance.
        </p>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-3 max-[700px]:grid-cols-1">
        <label className="block text-[12px] font-medium text-[#455249]">
          Sample distance (km)
          <MoneyOrKmInput
            className="mt-1"
            value={distanceKm}
            onChange={(event) => setDistanceKm(event.target.value)}
            disabled={disabled}
            inputMode="decimal"
          />
        </label>
        <label className="block text-[12px] font-medium text-[#455249]">
          Sample cart net (BHD)
          <MoneyOrKmInput
            className="mt-1"
            value={itemsNet}
            onChange={(event) => setItemsNet(event.target.value)}
            disabled={disabled}
            inputMode="decimal"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
        <PreviewCard
          title="Vendor contribution"
          preview={vendorPreview}
          waived={false}
        />
        <PreviewCard
          title="Customer delivery fee"
          preview={customerPreview}
          waived={customerWaived}
        />
      </div>
    </div>
  )
}

function PreviewCard({ title, preview, waived }) {
  if (!preview) {
    return (
      <div className="rounded-[8px] border border-[#eceeec] bg-white px-3 py-2.5 text-[12px] text-[#7c8780]">
        <p className="font-semibold text-[#17231c]">{title}</p>
        <p className="mt-1">Fill radius, max distance, contribution, and extra per km to preview.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[8px] border border-[#eceeec] bg-white px-3 py-2.5 text-[12px] text-[#455249]">
      <p className="font-semibold text-[#17231c]">{title}</p>
      {preview.outOfRange ? (
        <p className="mt-1 text-[#c8423b]">Outside delivery area (distance &gt; max distance).</p>
      ) : null}
      <ul className="mt-2 space-y-1 font-mono text-[11.5px]">
        <li>
          Billable extra km: <strong>{preview.extraKm.toFixed(2)}</strong>
        </li>
        <li>
          Base: BHD {formatBhd3(preview.base)} + extra: BHD {formatBhd3(preview.extraFee)}
        </li>
        <li>
          Total:{' '}
          <strong>
            {waived ? 'BHD 0.000 (free delivery)' : `BHD ${formatBhd3(preview.total)}`}
          </strong>
        </li>
      </ul>
    </div>
  )
}
