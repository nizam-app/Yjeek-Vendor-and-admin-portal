import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Renders a scannable QR for an otpauth:// TOTP URL (client-side only).
 */
export function TotpQrCode({ otpauthUrl, size = 180, label = 'Scan with authenticator app' }) {
  const [dataUrl, setDataUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDataUrl('')
    setFailed(false)

    if (!otpauthUrl) return undefined

    QRCode.toDataURL(otpauthUrl, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#17231c', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [otpauthUrl, size])

  if (!otpauthUrl) return null

  if (failed) {
    return (
      <p className="text-[12px] font-medium text-[#d64044]">
        Could not generate QR code. Use the secret key below instead.
      </p>
    )
  }

  if (!dataUrl) {
    return (
      <div
        className="grid place-items-center rounded-[10px] border border-[#e4ebe6] bg-white text-[12px] text-[#7c8780]"
        style={{ width: size, height: size }}
      >
        Generating QR…
      </div>
    )
  }

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <p className="text-[11.5px] text-[#7c8780]">{label}</p>
      <img
        src={dataUrl}
        alt="Authenticator QR code"
        width={size}
        height={size}
        className="rounded-[10px] border border-[#e4ebe6] bg-white p-2"
      />
    </div>
  )
}
