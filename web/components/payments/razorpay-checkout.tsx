'use client'

import { useState } from 'react'
import Script from 'next/script'
import { createRazorpayOrder, verifyRazorpayPayment } from '@/lib/api/services'
import { toast } from 'sonner'

interface RazorpayCheckoutProps {
  studentId: string
  feeId: string
  amount: number
  onSuccess?: () => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export function RazorpayCheckout({ studentId, feeId, amount, onSuccess }: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [scriptReady, setScriptReady] = useState(
    typeof window !== 'undefined' && !!window.Razorpay,
  )

  const handlePay = async () => {
    if (!scriptReady || !window.Razorpay) {
      toast.error('Payment gateway is loading. Please try again.')
      return
    }
    setLoading(true)
    try {
      const order = await createRazorpayOrder({ studentId, amount, feeId })
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'CoachingOS',
        description: `Fee payment — ${feeId}`,
        order_id: order.orderId,
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            await verifyRazorpayPayment({
              studentId,
              amount,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('Payment successful')
            onSuccess?.()
          } catch (err: unknown) {
            const e = err as { message?: string }
            toast.error(e?.message || 'Payment verification failed')
          }
        },
        theme: { color: '#1e40af' },
      })
      rzp.open()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message || 'Could not start payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-4 disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Pay Online'}
      </button>
    </>
  )
}
