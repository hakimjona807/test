import { TestResult, TelegramConfig } from '../types';

export const sendTelegramMessage = async (
  token: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; message: string }> => {
  if (!token || !chatId) {
    return {
      success: false,
      message: "Telegram Bot Token yoki Chat ID kiritilmagan",
    };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true, message: 'Telegramga xabar muvaffaqiyatli yuborildi!' };
    } else {
      return { success: false, message: `Telegram xatosi: ${data.description || 'Xatolik'}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Tarmoq xatosi';
    return { success: false, message: `Telegramga ulanishda xatolik: ${msg}` };
  }
};

export const sendResultToTelegram = async (
  result: TestResult,
  config: TelegramConfig
): Promise<{ success: boolean; message: string }> => {
  if (!config.enabled || !config.botToken || !config.chatId) {
    return { success: false, message: 'Telegram xabarnomasi sozlanmagan' };
  }

  const minutes = Math.floor(result.timeSpentSeconds / 60);
  const seconds = result.timeSpentSeconds % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const statusText = result.passed ? '✅ <b>Muvaffaqiyatli topshirdi</b>' : '❌ <b>Topshira olmadi</b>';

  const text = `
🎯 <b>Yangi test natijasi!</b>

👤 <b>O'quvchi:</b> ${result.studentName}
🏫 <b>Guruh:</b> ${result.studentGroup}
📝 <b>Test:</b> ${result.testTitle}
📚 <b>Fan:</b> ${result.subject}

📊 <b>Ball:</b> ${result.score} / ${result.totalQuestions} (${result.percentage}%)
⏱ <b>Sarflangan vaqt:</b> ${timeFormatted}
⚠️ <b>Oynadan chiqish:</b> ${result.tabSwitchCount} marta
Holat: ${statusText}

🕒 Sana: ${new Date(result.completedAt).toLocaleString('uz-UZ')}
  `.trim();

  return sendTelegramMessage(config.botToken, config.chatId, text);
};
