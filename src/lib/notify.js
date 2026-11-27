// Notifications + WhatsApp fallback.
// In-app notifications are live (notifications table). Email / SMS sending
// is NOT live — it needs a provider key (Resend / SendGrid / Twilio) and a
// server-side sender; nothing in this file sends email or SMS.
// WhatsApp is click-to-chat (wa.me) only. WhatsApp Business API needs a
// Meta Business Portfolio and approval (usually 5-10 days) and is NOT live.
import { supabase } from './supabase'

// Insert a notification for a user. Never throws — callers must not break
// the main flow (order / appointment) if notifications fail.
export async function createNotification(userId, title, message, type = 'info') {
  try {
    if (!userId) return null
    const { data, error } = await supabase.from('notifications').insert({
      user_id: userId, title, message: message || '', type,
    }).select().single()
    if (error) return null
    return data
  } catch { return null }
}

// Click-to-chat WhatsApp link. `phone` is the clinic number without '+',
// e.g. '923000000000'. `message` is pre-filled text for the chat.
export function sendWhatsAppLink(phone, message) {
  const num = String(phone || '923000000000').replace(/[^0-9]/g, '')
  const text = encodeURIComponent(message || '')
  return `https://wa.me/${num}${text ? `?text=${text}` : ''}`
}
