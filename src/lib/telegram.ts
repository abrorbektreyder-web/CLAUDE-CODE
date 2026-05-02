import { Bot } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;
export const bot = token ? new Bot(token) : null;
import { formatSum } from './utils';

export async function sendTelegramAlert(tenantId: string, message: string) {
  if (!bot) {
    console.warn('Telegram bot is not configured (TELEGRAM_BOT_TOKEN missing).');
    return;
  }

  try {
    // In a real app, you would fetch the tenant's configured Telegram Chat ID from the DB.
    // For now, we will use a fallback or a default admin group ID if provided in env.
    // Let's assume the owner has a specific chat ID stored in their settings, or we use a global one for the MVP.
    // Since we don't have the chat ID passed yet, we will log it.
    // You should add the specific CHAT_ID here or fetch it from tenant settings.
    
    // As a placeholder for the MVP, we can look for an env variable:
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    
    if (chatId) {
      await bot.api.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } else {
      console.log('TELEGRAM_ADMIN_CHAT_ID is not set, could not send message:', message);
    }
  } catch (error) {
    console.error('Failed to send Telegram alert:', error);
  }
}

export function formatSaleMessage(
  sale: any, 
  items: any[], 
  cashierName: string, 
  branchName: string,
  customerData?: { fullName: string, phone: string },
  paymentDetails?: { debtMonths?: number, paidAmount?: number, debtAmount?: number }
): string {
  const date = new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0');
  const formatMoney = (amount: number) => formatSum(amount, false) + " so'm";
  const totalStr = formatMoney(sale.total);
  
  let itemsStr = '';
  items.forEach((item, index) => {
    itemsStr += `${index + 1}. ${item.productName}\n    ${formatMoney(item.unitPrice)} x ${item.quantity} = ${formatMoney(item.total)}\n`;
  });

  let paymentStr = '';
  if (sale.paymentMethod === 'credit') {
    paymentStr = `💳 <b>To'lov turi:</b> Nasiya (${paymentDetails?.debtMonths || 0} oyga)\n`;
    paymentStr += `💰 <b>Boshlang'ich to'lov:</b> ${formatMoney(paymentDetails?.paidAmount || 0)}\n`;
    paymentStr += `📊 <b>Qolgan qarz:</b> ${formatMoney(paymentDetails?.debtAmount || 0)}`;
  } else if (sale.paymentMethod === 'card') {
    paymentStr = `💳 <b>To'lov turi:</b> Karta`;
  } else {
    paymentStr = `💵 <b>To'lov turi:</b> Naqd pul`;
  }

  let customerStr = customerData?.fullName ? `👥 <b>Mijoz:</b> ${customerData.fullName} (${customerData.phone})` : '';

  return `🛒 <b>YANGI SAVDO #${sale.receiptNumber || '0000'}</b>
━━━━━━━━━━━━━━━━━
📍 <b>Filial:</b> ${branchName}
👤 <b>Kassir:</b> ${cashierName}
🕐 <b>Vaqt:</b> ${date}
${customerStr ? customerStr + '\n' : ''}
📦 <b>Mahsulotlar:</b>
${itemsStr}━━━━━━━━━━━━━━━━━
🧾 <b>JAMI SUMMA:</b> ${totalStr}
${paymentStr}`;
}
