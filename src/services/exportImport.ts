import { Question, TestResult, User } from '../types';

/**
 * Generates and downloads a CSV file with BOM for Excel UTF-8 compatibility
 */
export const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const escapeCell = (cell: string | number): string => {
    const str = String(cell ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Microsoft Excel
    [
      headers.map(escapeCell).join(','),
      ...rows.map(row => row.map(escapeCell).join(',')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportResultsToExcel = (results: TestResult[], testTitle?: string) => {
  const headers = [
    'O\'quvchi Ismi',
    'Guruh',
    'Test Nomi',
    'Fan',
    'Ball',
    'Jami savollar',
    'Foiz (%)',
    'Holat',
    'Sarflangan vaqt (daq:son)',
    'Oynadan chiqish (marta)',
    'Topshirilgan sana'
  ];

  const rows = results.map(r => {
    const mins = Math.floor(r.timeSpentSeconds / 60);
    const secs = r.timeSpentSeconds % 60;
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    return [
      r.studentName,
      r.studentGroup,
      r.testTitle,
      r.subject,
      r.score,
      r.totalQuestions,
      `${r.percentage}%`,
      r.passed ? 'O\'tdi' : 'Yiqildi',
      timeStr,
      r.tabSwitchCount,
      new Date(r.completedAt).toLocaleString('uz-UZ'),
    ];
  });

  const filename = testTitle
    ? `Natijalar_${testTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`
    : `Barcha_Natijalar_${new Date().toISOString().slice(0, 10)}`;

  downloadCSV(filename, headers, rows);
};

export const exportStudentsToExcel = (students: User[], results: TestResult[]) => {
  const headers = [
    'F.I.SH',
    'Email / Login',
    'Guruh',
    'Telefon',
    'Topshirgan testlar soni',
    'O\'rtacha ball (%)',
    'Ro\'yxatdan o\'tgan sana'
  ];

  const rows = students.map(s => {
    const studentResults = results.filter(r => r.studentId === s.id);
    const avgScore = studentResults.length
      ? Math.round(studentResults.reduce((acc, curr) => acc + curr.percentage, 0) / studentResults.length)
      : 0;

    return [
      s.name,
      s.email,
      s.groupName || 'Biriktirilmagan',
      s.phone || 'Kiritilmagan',
      studentResults.length,
      `${avgScore}%`,
      new Date(s.createdAt).toLocaleDateString('uz-UZ')
    ];
  });

  downloadCSV(`Oquvchilar_Royxati_${new Date().toISOString().slice(0, 10)}`, headers, rows);
};

/**
 * Parses raw text copied from Microsoft Word / TXT / Google Docs into structured questions
 * Example format:
 * 1. O'zbekiston Respublikasi Konstitutsiyasi qachon qabul qilingan?
 * A) 1991-yil 1-sentyabr
 * B) 1992-yil 8-dekabr
 * C) 1993-yil 2-iyul
 * D) 1990-yil 24-mart
 * Javob: B
 * Izoh: 1992-yil 8-dekabrda qabul qilingan.
 */
export const parseWordOrTextQuestions = (rawText: string, defaultSubject = 'Umumiy'): Question[] => {
  const questions: Question[] = [];
  const blocks = rawText
    .split(/\n\s*(?=\d+[\.\)])/)
    .map(b => b.trim())
    .filter(Boolean);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    // First line or lines before options is the question text
    let questionText = lines[0].replace(/^\d+[\.\)]\s*/, '').trim();
    const options: { id: string; text: string }[] = [];
    let correctLetter = 'A';
    let explanation = '';

    const optionRegex = /^([A-DА-Яa-dа-я])[\)\.\-]\s*(.+)$/i;
    const answerRegex = /^(?:Javob|To'g'ri javob|Answer|Ответ)[\s\:\=]+([A-DА-Яa-dа-я])/i;
    const explanationRegex = /^(?:Izoh|Tushuntirish|Explanation|Пояснение)[\s\:\=]+(.+)$/i;

    let readingQuestionText = true;

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      const ansMatch = line.match(answerRegex);
      const explMatch = line.match(explanationRegex);
      const optMatch = line.match(optionRegex);

      if (ansMatch) {
        correctLetter = ansMatch[1].toUpperCase();
        readingQuestionText = false;
      } else if (explMatch) {
        explanation = explMatch[1].trim();
        readingQuestionText = false;
      } else if (optMatch) {
        readingQuestionText = false;
        const letter = optMatch[1].toUpperCase();
        const text = optMatch[2].trim();
        options.push({
          id: letter,
          text
        });
      } else if (readingQuestionText) {
        questionText += ' ' + line;
      }
    }

    if (options.length >= 2) {
      questions.push({
        id: `imp-${Date.now()}-${i}`,
        text: questionText,
        options,
        correctOptionId: correctLetter,
        explanation: explanation || undefined,
        subject: defaultSubject,
        difficulty: 'orta',
        points: 1
      });
    }
  }

  return questions;
};
