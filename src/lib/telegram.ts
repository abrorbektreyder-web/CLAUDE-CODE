import { Bot } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;
export const bot = token ? new Bot(token) : null;
import { formatSum } from './utils';

export async function sendTelegramMessage(chatId: string | number | bigint, message: string) {
  if (!bot) {
    console.warn('Telegram bot is not configured.');
    return;
  }

  try {
    await bot.api.sendMessage(chatId.toString(), message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error(`Failed to send Telegram message to ${chatId}:`, error);
  }
}

export async function sendTelegramAlert(tenantId: string, message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (chatId) {
    await sendTelegramMessage(chatId, message);
  } else {
    console.log('TELEGRAM_ADMIN_CHAT_ID is not set, could not send alert.');
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
