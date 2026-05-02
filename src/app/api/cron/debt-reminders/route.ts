import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/db/queries';
import { sendTelegramMessage } from '@/lib/telegram';
import { formatSum } from '@/lib/utils';

export async function GET(request: NextRequest) {
  // Security check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && request.nextUrl.searchParams.get('test') !== 'true') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = await getSupabase();
  const today = new Date();
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(today);
  
  const inTwoDays = new Date(today);
  inTwoDays.setDate(today.getDate() + 2);
  const inTwoDaysStr = formatDate(inTwoDays);


  try {
    // 1. Fetch schedules due today or in 2 days
    const { data: schedules, error } = await supabase
      .from('debt_schedules')
      .select(`
        id,
        due_date,
        expected_amount,
        paid_amount,
        debts (
          id,
          tenant_id,
          reminder_count,
          customers (
            id,
            full_name,
            phone_last_four,
            telegram_chat_id
          )
        )
      `)
      .in('due_date', [todayStr, inTwoDaysStr]);

    if (error) throw error;

    const results = {
      today: 0,
      upcoming: 0,
      total_sent: 0,
    };

    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    for (const schedule of (schedules || [])) {
      // Filter out paid installments
      if (Number(schedule.paid_amount) >= Number(schedule.expected_amount)) continue;

      const debt = Array.isArray(schedule.debts) ? schedule.debts[0] : schedule.debts;
      if (!debt) continue;

      const isToday = schedule.due_date === todayStr;
      
      // Rate limit logic:
      // - If today: allow twice a day (check if last was > 4 hours ago)
      // - If 2 days before: only once a day (check if last was > 20 hours ago)
      const lastReminder = debt.last_reminder_at ? new Date(debt.last_reminder_at) : null;
      const limitHours = isToday ? 4 : 20;
      const limitMs = limitHours * 60 * 60 * 1000;
      const timeSinceLast = lastReminder ? Date.now() - lastReminder.getTime() : Infinity;
      
      // Allow bypass via query param for testing: ?test=true
      const isTest = request.nextUrl.searchParams.get('test') === 'true';

      if (timeSinceLast < limitMs && !isTest) {
        continue;
      }

      const customer = Array.isArray(debt.customers) ? debt.customers[0] : debt.customers;
      if (!customer) continue;

      const amount = Number(schedule.expected_amount) - Number(schedule.paid_amount);
      const formattedAmount = formatSum(amount);

      let sentToCustomer = false;

      // A. Notify Customer if they have telegramChatId
      if (customer.telegram_chat_id) {
        let message = '';
        if (isToday) {
          message = `<b>Hurmatli ${customer.full_name}!</b>\n\nBugun sizning <b>${formattedAmount}</b> to'lov kuningiz. Iltimos, to'lovni amalga oshirish uchun do'konga keling yoki karta orqali o'tkazing. 😊`;
        } else {
          message = `<b>Salom ${customer.full_name}!</b>\n\nSizning <b>${formattedAmount}</b> to'lov muddatingizga <b>2 kun</b> qoldi. O'z vaqtida to'lashni unutmang. Rahmat!`;
        }

        await sendTelegramMessage(customer.telegram_chat_id, message);
        sentToCustomer = true;
      }

      // B. Notify Admin if it's Today (Only in the morning run to avoid double admin alerts)
      const currentHour = new Date().getHours();
      const isMorning = currentHour < 12;

      if (isToday && adminChatId && isMorning) {
        const adminMsg = `📌 <b>TO'LOV KUNI:</b>\n\nBugun <b>${customer.full_name}</b> (+998 ** *** ** ${customer.phone_last_four}) <b>${formattedAmount}</b> to'lashi kerak.`;
        await sendTelegramMessage(adminChatId, adminMsg);
        results.today++;
      } else if (!isToday) {
        results.upcoming++;
      }

      if (sentToCustomer) results.total_sent++;

      // Update last reminder status in DB
      await supabase
        .from('debts')
        .update({
          last_reminder_at: new Date().toISOString(),
          last_reminder_channel: 'telegram',
          reminder_count: (debt.reminder_count || 0) + 1
        })
        .eq('id', debt.id);
    }

    return NextResponse.json({ 
      success: true, 
      processed: (schedules || []).length,
      stats: results
    });
  } catch (error: any) {
    console.error('Debt reminder cron failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
