import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { exportResultsToExcel, exportStudentsToExcel, parseWordOrTextQuestions } from '../services/exportImport';
import { sendTelegramMessage } from '../services/telegram';
import { Question } from '../types';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Database,
  BarChart3,
  FileSpreadsheet,
  HelpCircle,
  Settings,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';

type SidebarTab =
  | 'overview'
  | 'groups'
  | 'students'
  | 'tests'
  | 'questions'
  | 'results'
  | 'analytics'
  | 'excel'
  | 'guide'
  | 'settings';

interface TeacherDashboardProps {
  initialTab?: SidebarTab;
  onNavigate: (path: string) => void;
  onViewResult: (resultId: string) => void;
  onTakeTest: (testId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  initialTab = 'overview',
  onViewResult,
  onTakeTest,
}) => {
  const { currentUser } = useAuth();
  const {
    tests,
    results,
    groups,
    students,
    questionsBank,
    telegramConfig,
    addTest,
    deleteTest,
    addQuestion,
    addQuestionsBatch,
    deleteQuestion,
    addGroup,
    deleteGroup,
    addStudent,
    deleteStudent,
    saveTelegramConfig,
    resetAllData,
  } = useData();
  const { addToast } = useToast();

  const [currentTab, setCurrentTab] = useState<SidebarTab>(initialTab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');

  // Modals
  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false);
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'test' | 'question' | 'group' | 'student';
    id: string;
    title: string;
  }>({
    isOpen: false,
    type: 'test',
    id: '',
    title: '',
  });

  // Form states: New Test
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestSubject, setNewTestSubject] = useState('Matematika');
  const [newTestDescription, setNewTestDescription] = useState('');
  const [newTestDuration, setNewTestDuration] = useState(20);
  const [newTestPassingScore, setNewTestPassingScore] = useState(70);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Form states: New Question
  const [newQText, setNewQText] = useState('');
  const [newQSubject, setNewQSubject] = useState('Matematika');
  const [newQDifficulty, setNewQDifficulty] = useState<'oson' | 'orta' | 'qiyin'>('orta');
  const [newQOptA, setNewQOptA] = useState('');
  const [newQOptB, setNewQOptB] = useState('');
  const [newQOptC, setNewQOptC] = useState('');
  const [newQOptD, setNewQOptD] = useState('');
  const [newQCorrect, setNewQCorrect] = useState('A');
  const [newQExplanation, setNewQExplanation] = useState('');

  // Form states: New Group
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Form states: New Student
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentGroup, setNewStudentGroup] = useState(groups[0]?.name || '9-A Guruh');
  const [newStudentPhone, setNewStudentPhone] = useState('');

  // Form states: Word / TXT Import
  const [importRawText, setImportRawText] = useState('');
  const [importSubject, setImportSubject] = useState('Matematika');

  // Form states: Telegram Settings
  const [tgBotToken, setTgBotToken] = useState(telegramConfig.botToken);
  const [tgChatId, setTgChatId] = useState(telegramConfig.chatId);
  const [tgEnabled, setTgEnabled] = useState(telegramConfig.enabled);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  // Aggregated analytics metrics
  const totalStudents = students.length;
  const totalTests = tests.length;
  const totalResults = results.length;
  const passedResults = results.filter(r => r.passed).length;
  const avgPercentage = totalResults
    ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / totalResults)
    : 0;

  // Handlers
  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim()) {
      addToast('Test nomini kiriting', 'error');
      return;
    }

    const testQuestions = questionsBank.filter(q =>
      selectedQuestionIds.length > 0 ? selectedQuestionIds.includes(q.id) : q.subject === newTestSubject
    );

    if (testQuestions.length === 0) {
      addToast("Ushbu fandan savollar mavjud emas. Avval Savollar bankiga savol qo'shing.", 'warning');
      return;
    }

    addTest({
      title: newTestTitle.trim(),
      description: newTestDescription.trim() || `${newTestSubject} fani bo'yicha nazorat testi`,
      subject: newTestSubject,
      category: 'Akademik',
      durationMinutes: Number(newTestDuration),
      passingScore: Number(newTestPassingScore),
      questions: testQuestions,
      targetGroups: groups.map(g => g.id),
      isActive: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      showResultsImmediately: true,
      createdByTeacherName: currentUser?.name || "O'qituvchi",
    });

    addToast('Yangi test muvaffaqiyatli yaratildi!', 'success');
    setIsCreateTestOpen(false);
    setNewTestTitle('');
    setNewTestDescription('');
    setSelectedQuestionIds([]);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || !newQOptA.trim() || !newQOptB.trim()) {
      addToast("Savol matni va kamida 2 ta variantni to'ldiring", 'error');
      return;
    }

    addQuestion({
      text: newQText.trim(),
      subject: newQSubject,
      difficulty: newQDifficulty,
      options: [
        { id: 'A', text: newQOptA.trim() },
        { id: 'B', text: newQOptB.trim() },
        { id: 'C', text: newQOptC.trim() || "Noto'g'ri variant" },
        { id: 'D', text: newQOptD.trim() || "Noto'g'ri variant" },
      ],
      correctOptionId: newQCorrect,
      explanation: newQExplanation.trim() || undefined,
      points: 1,
    });

    addToast("Savollar bankiga yangi savol qo'shildi!", 'success');
    setIsCreateQuestionOpen(false);
    setNewQText('');
    setNewQOptA('');
    setNewQOptB('');
    setNewQOptC('');
    setNewQOptD('');
    setNewQExplanation('');
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      addToast('Guruh nomini kiriting', 'error');
      return;
    }
    addGroup({
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || "Yangi o'quv guruhi",
    });
    addToast('Yangi guruh muvaffaqiyatli saqlandi!', 'success');
    setIsCreateGroupOpen(false);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) {
      addToast("F.I.SH va emailni to'liq kiriting", 'error');
      return;
    }
    addStudent({
      name: newStudentName.trim(),
      email: newStudentEmail.trim().toLowerCase(),
      groupName: newStudentGroup,
      phone: newStudentPhone.trim() || undefined,
    });
    addToast("O'quvchi ro'yxatga qo'shildi!", 'success');
    setIsCreateStudentOpen(false);
    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentPhone('');
  };

  const handleImportQuestions = () => {
    if (!importRawText.trim()) {
      addToast('Import qilish uchun matn kiriting', 'error');
      return;
    }
    const parsed = parseWordOrTextQuestions(importRawText, importSubject);
    if (parsed.length === 0) {
      addToast(
        "Savollarni aniqlab bo'lmadi. Iltimos namunadagi formatda kiriting (1. Savol... A)... B)... Javob: A)",
        'warning'
      );
      return;
    }

    addQuestionsBatch(parsed);
    addToast(`${parsed.length} ta savol Savollar bankiga muvaffaqiyatli yuklandi!`, 'success');
    setIsImportModalOpen(false);
    setImportRawText('');
  };

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    saveTelegramConfig({
      botToken: tgBotToken.trim(),
      chatId: tgChatId.trim(),
      enabled: tgEnabled,
      sendOnTestComplete: true,
    });
    addToast('Telegram sozlamalari saqlandi!', 'success');
  };

  const handleTestTelegramConnection = async () => {
    if (!tgBotToken || !tgChatId) {
      addToast('Telegram Bot Token va Chat ID kiritilishi shart', 'error');
      return;
    }
    setIsTestingTelegram(true);
    const res = await sendTelegramMessage(
      tgBotToken,
      tgChatId,
      `🔔 <b>TestHub Pro Aloqa Tekshiruvi</b>\n\nTelegram boti bilan muvaffaqiyatli ulandi! Endi barcha test natijalari ushbu chatga avtomatik yetkaziladi.\n\nSana: ${new Date().toLocaleString('uz-UZ')}`
    );
    setIsTestingTelegram(false);

    if (res.success) {
      addToast(res.message, 'success', 'Ulanish tasdiqlandi');
    } else {
      addToast(res.message, 'error', 'Ulanish xatosi');
    }
  };

  const handleExecuteDelete = () => {
    if (deleteConfirm.type === 'test') {
      deleteTest(deleteConfirm.id);
      addToast("Test o'chirildi", 'info');
    } else if (deleteConfirm.type === 'question') {
      deleteQuestion(deleteConfirm.id);
      addToast("Savol o'chirildi", 'info');
    } else if (deleteConfirm.type === 'group') {
      deleteGroup(deleteConfirm.id);
      addToast("Guruh o'chirildi", 'info');
    } else if (deleteConfirm.type === 'student') {
      deleteStudent(deleteConfirm.id);
      addToast("O'quvchi ro'yxatdan o'chirildi", 'info');
    }
    setDeleteConfirm({ isOpen: false, type: 'test', id: '', title: '' });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-6rem)]">
      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title="O'chirishni tasdiqlang"
        message={`Haqiqatan ham "${deleteConfirm.title}" elementini butunlay o'chirmoqchimisiz?`}
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        isDestructive
      />

      {/* MODAL: Create Test */}
      <Modal
        isOpen={isCreateTestOpen}
        onClose={() => setIsCreateTestOpen(false)}
        title="Yangi test yaratish"
        description="O'quvchilar uchun yangi nazorat testini shakllantiring"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveTest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Test nomi
            </label>
            <input
              type="text"
              required
              value={newTestTitle}
              onChange={e => setNewTestTitle(e.target.value)}
              placeholder="Masalan: 1-chorak yakuniy nazorati"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fan
              </label>
              <select
                value={newTestSubject}
                onChange={e => setNewTestSubject(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="Matematika">Matematika</option>
                <option value="Informatika">Informatika</option>
                <option value="Ingliz tili">Ingliz tili</option>
                <option value="Fizika">Fizika</option>
                <option value="Kimyo">Kimyo</option>
                <option value="Ona tili">Ona tili</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Davomiyligi (daqiqa)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                required
                value={newTestDuration}
                onChange={e => setNewTestDuration(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              O'tish bali (%)
            </label>
            <input
              type="number"
              min={30}
              max={100}
              required
              value={newTestPassingScore}
              onChange={e => setNewTestPassingScore(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Test tavsifi (ixtiyoriy)
            </label>
            <textarea
              rows={2}
              value={newTestDescription}
              onChange={e => setNewTestDescription(e.target.value)}
              placeholder="Test mavzulari va ko'rsatmalar..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateTestOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              Testni saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Create Question */}
      <Modal
        isOpen={isCreateQuestionOpen}
        onClose={() => setIsCreateQuestionOpen(false)}
        title="Savollar bankiga yangi savol qo'shish"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fan</label>
              <select
                value={newQSubject}
                onChange={e => setNewQSubject(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="Matematika">Matematika</option>
                <option value="Informatika">Informatika</option>
                <option value="Ingliz tili">Ingliz tili</option>
                <option value="Fizika">Fizika</option>
                <option value="Kimyo">Kimyo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Qiyinchilik</label>
              <select
                value={newQDifficulty}
                onChange={e => setNewQDifficulty(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="oson">Oson</option>
                <option value="orta">O'rta</option>
                <option value="qiyin">Qiyin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Savol matni</label>
            <textarea
              required
              rows={2}
              value={newQText}
              onChange={e => setNewQText(e.target.value)}
              placeholder="Savolni kiriting..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Variant A</label>
              <input
                required
                type="text"
                value={newQOptA}
                onChange={e => setNewQOptA(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Variant B</label>
              <input
                required
                type="text"
                value={newQOptB}
                onChange={e => setNewQOptB(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Variant C</label>
              <input
                type="text"
                value={newQOptC}
                onChange={e => setNewQOptC(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Variant D</label>
              <input
                type="text"
                value={newQOptD}
                onChange={e => setNewQOptD(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">To'g'ri javob</label>
              <select
                value={newQCorrect}
                onChange={e => setNewQCorrect(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold"
              >
                <option value="A">A varianti</option>
                <option value="B">B varianti</option>
                <option value="C">C varianti</option>
                <option value="D">D varianti</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tushuntirish / Izoh (ixtiyoriy)</label>
              <input
                type="text"
                value={newQExplanation}
                onChange={e => setNewQExplanation(e.target.value)}
                placeholder="Yechim yoki qoida..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateQuestionOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              Savolni saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Word / Text Question Import */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Word / TXT hujjatidan savollarni import qilish"
        description="Microsoft Word yoki matnli fayldan nusxa olingan savollarni bir zumda Savollar bankiga yuklang"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fan yo'nalishi
            </label>
            <select
              value={importSubject}
              onChange={e => setImportSubject(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mb-2"
            >
              <option value="Matematika">Matematika</option>
              <option value="Informatika">Informatika</option>
              <option value="Ingliz tili">Ingliz tili</option>
              <option value="Fizika">Fizika</option>
              <option value="Kimyo">Kimyo</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Savollar matni
              </label>
              <span className="text-[11px] text-slate-400">
                Namunaviy format avtomatik tahlil qilinadi
              </span>
            </div>
            <textarea
              rows={8}
              value={importRawText}
              onChange={e => setImportRawText(e.target.value)}
              placeholder={`1. O'zbekiston poytaxti qaysi shahar?\nA) Samarqand\nB) Toshkent\nC) Buxoro\nD) Xiva\nJavob: B\nIzoh: Toshkent O'zbekistonning poytaxti.\n\n2. Qaysi algoritm O(log n) murakkablikka ega?\nA) Linear search\nB) Binary search\nJavob: B`}
              className="w-full font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
            <strong>Format talabi:</strong> Har bir savol raqam bilan (masalan: 1.), variantlar esa harf bilan (A), B), C), D) boshlanishi va oxirida "Javob: B" qatori bo'lishi kifoya.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleImportQuestions}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Savollarni tahlil qilish va saqlash</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Create Group */}
      <Modal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        title="Yangi guruh ochish"
        maxWidth="md"
      >
        <form onSubmit={handleSaveGroup} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Guruh nomi
            </label>
            <input
              type="text"
              required
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="Masalan: 10-A Guruh"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Guruh tavsifi
            </label>
            <input
              type="text"
              value={newGroupDesc}
              onChange={e => setNewGroupDesc(e.target.value)}
              placeholder="Yo'nalish va fanlar..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              Guruhni saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Create Student */}
      <Modal
        isOpen={isCreateStudentOpen}
        onClose={() => setIsCreateStudentOpen(false)}
        title="Yangi o'quvchi qo'shish"
        maxWidth="md"
      >
        <form onSubmit={handleSaveStudent} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              F.I.SH
            </label>
            <input
              type="text"
              required
              value={newStudentName}
              onChange={e => setNewStudentName(e.target.value)}
              placeholder="Alisher Navoiy"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email / Login
            </label>
            <input
              type="email"
              required
              value={newStudentEmail}
              onChange={e => setNewStudentEmail(e.target.value)}
              placeholder="alisher@testhub.uz"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Biriktirilgan guruh
            </label>
            <select
              value={newStudentGroup}
              onChange={e => setNewStudentGroup(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              {groups.map(g => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Telefon raqami (ixtiyoriy)
            </label>
            <input
              type="text"
              value={newStudentPhone}
              onChange={e => setNewStudentPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateStudentOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              O'quvchini saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* SIDEBAR (Desktop permanent 240px-280px + Mobile drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-1">
          <div className="px-3 py-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Boshqaruv menyusi
            </span>
          </div>

          {[
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'groups', label: 'Guruhlar', icon: Users, badge: groups.length },
            { id: 'students', label: "O'quvchilar", icon: GraduationCap, badge: students.length },
            { id: 'tests', label: 'Testlar', icon: FileText, badge: tests.length },
            { id: 'questions', label: 'Savollar banki', icon: Database, badge: questionsBank.length },
            { id: 'results', label: 'Natijalar', icon: CheckCircle2, badge: results.length },
            { id: 'analytics', label: 'Statistika', icon: BarChart3 },
            { id: 'excel', label: 'Excel & Import', icon: FileSpreadsheet },
            { id: 'guide', label: "Qo'llanma", icon: HelpCircle },
            { id: 'settings', label: 'Sozlamalar', icon: Settings },
          ].map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id as SidebarTab);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {typeof item.badge === 'number' && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs">
          <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 mb-0.5">
            TestHub Pro Enterprise
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Versiya 2.4 · Barcha huquqlar himoyalangan
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-x-hidden">
        {/* Mobile menu toggle bar */}
        <div className="lg:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex items-center gap-2 text-xs font-semibold text-indigo-600"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Menyuni ochish ({currentTab})</span>
          </button>
        </div>

        {/* 1. OVERVIEW / DASHBOARD TAB */}
        {currentTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  O'qituvchi Boshqaruv Markazi
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Platformaning umumiy faoliyati va asosiy ko'rsatkichlar
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateTestOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yangi test yaratish</span>
                </button>
              </div>
            </div>

            {/* Top Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Jami o'quvchilar"
                value={totalStudents}
                icon={<GraduationCap className="w-5 h-5 text-indigo-600" />}
                hint={`${groups.length} ta guruh bo'yicha`}
              />
              <StatCard
                label="Faol testlar"
                value={totalTests}
                icon={<FileText className="w-5 h-5 text-emerald-600" />}
                hint="Sinovlar ochiq"
              />
              <StatCard
                label="Topshirilgan testlar"
                value={totalResults}
                icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
                hint={`${passedResults} tasi muvaffaqiyatli`}
              />
              <StatCard
                label="O'rtacha o'zlashtirish"
                value={avgPercentage}
                suffix="%"
                icon={<BarChart3 className="w-5 h-5 text-amber-600" />}
                hint="Umumiy o'quvchilar balansi"
              />
            </div>

            {/* Quick Overview Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Results */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    So'nggi topshirilgan natijalar
                  </h3>
                  <button
                    onClick={() => setCurrentTab('results')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Barchasi ({results.length})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {results.slice(0, 4).map(res => (
                    <div
                      key={res.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {res.studentName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {res.testTitle.slice(0, 24)}... · {res.studentGroup}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold block ${
                            res.passed ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {res.percentage}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {res.score}/{res.totalQuestions} to'g'ri
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Tests */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Mavjud nazorat testlari
                  </h3>
                  <button
                    onClick={() => setCurrentTab('tests')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Barchasi ({tests.length})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {tests.slice(0, 4).map(t => (
                    <div
                      key={t.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {t.title}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {t.subject} · {t.durationMinutes} daqiqa · {t.questions.length} savol
                        </span>
                      </div>
                      <button
                        onClick={() => onTakeTest(t.id)}
                        className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                      >
                        Sinash
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. GURUHLAR (GROUPS) TAB */}
        {currentTab === 'groups' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Guruhlar Boshqaruvi
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mavjud guruhlar va ulardagi o'quvchilar tarkibi
                </p>
              </div>
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yangi guruh ochish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {groups.map(group => {
                const groupStudents = students.filter(s => s.groupName === group.name);

                return (
                  <div
                    key={group.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {group.name}
                        </span>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              type: 'group',
                              id: group.id,
                              title: group.name,
                            })
                          }
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Guruhni o'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                        {group.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        O'quvchilar: <strong className="font-mono text-slate-800 dark:text-slate-200">{groupStudents.length} nafar</strong>
                      </span>
                      <button
                        onClick={() => {
                          setSelectedGroupFilter(group.name);
                          setCurrentTab('students');
                        }}
                        className="text-indigo-600 hover:underline font-semibold"
                      >
                        Ro'yxatni ko'rish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. O'QUVCHILAR (STUDENTS) TAB */}
        {currentTab === 'students' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  O'quvchilar Ro'yxati
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Platformada ro'yxatdan o'tgan barcha o'quvchilar
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportStudentsToExcel(students, results)}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel yuklash</span>
                </button>
                <button
                  onClick={() => setIsCreateStudentOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>O'quvchi qo'shish</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="F.I.SH yoki email bo'yicha qidirish..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={selectedGroupFilter}
                onChange={e => setSelectedGroupFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">Barcha guruhlar</option>
                {groups.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Students Table (Responsive card view on mobile, table on desktop) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-semibold">
                      <th className="py-3 px-4">F.I.SH</th>
                      <th className="py-3 px-4">Guruh</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Topshirgan testlar</th>
                      <th className="py-3 px-4">O'rtacha ball</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {students
                      .filter(s => {
                        const matchesSearch =
                          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesGroup =
                          selectedGroupFilter === 'all' || s.groupName === selectedGroupFilter;
                        return matchesSearch && matchesGroup;
                      })
                      .map(student => {
                        const studentResults = results.filter(r => r.studentId === student.id);
                        const avg = studentResults.length
                          ? Math.round(
                              studentResults.reduce((acc, c) => acc + c.percentage, 0) /
                                studentResults.length
                            )
                          : 0;

                        return (
                          <tr
                            key={student.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                              {student.name}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              {student.groupName || 'Biriktirilmagan'}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">
                              {student.email}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                              {studentResults.length} ta
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {avg}%
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    isOpen: true,
                                    type: 'student',
                                    id: student.id,
                                    title: student.name,
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                title="O'quvchini o'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. TESTLAR (TESTS) TAB */}
        {currentTab === 'tests' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Nazorat Testlari
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mavjud testlarni tahrirlash, sinash va boshqarish
                </p>
              </div>

              <button
                onClick={() => setIsCreateTestOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yangi test yaratish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map(test => (
                <div
                  key={test.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {test.subject}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {test.durationMinutes} daqiqa
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                      {test.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                      <span>Savollar soni: <strong className="font-mono text-slate-800 dark:text-slate-200">{test.questions.length} ta</strong></span>
                      <span>·</span>
                      <span>O'tish bali: <strong className="font-mono text-slate-800 dark:text-slate-200">{test.passingScore}%</strong></span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          isOpen: true,
                          type: 'test',
                          id: test.id,
                          title: test.title,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Testni o'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onTakeTest(test.id)}
                        className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-semibold hover:bg-indigo-100"
                      >
                        O'quvchi sifatida sinash
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SAVOLLAR BANKI (QUESTIONS BANK) TAB */}
        {currentTab === 'questions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Savollar Banki ({questionsBank.length} ta)
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fanlar bo'yicha markazlashgan savollar bazasi
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Word / TXT import</span>
                </button>
                <button
                  onClick={() => setIsCreateQuestionOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Savol qo'shish</span>
                </button>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-3">
              {questionsBank.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                        #{idx + 1}
                      </span>
                      <span>·</span>
                      <span className="font-medium">{q.subject}</span>
                      <span>·</span>
                      <span className="capitalize">{q.difficulty}</span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                      {q.text}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {q.options.map(opt => (
                        <div
                          key={opt.id}
                          className={`p-2 rounded-xl border ${
                            opt.id === q.correctOptionId
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-medium'
                              : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <strong className="font-mono">{opt.id})</strong> {opt.text}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 italic">
                        Izoh: {q.explanation}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        type: 'question',
                        id: q.id,
                        title: q.text.slice(0, 30) + '...',
                      })
                    }
                    className="p-1.5 text-slate-400 hover:text-rose-600 self-end sm:self-start transition-colors"
                    title="Savolni o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. NATIJALAR (RESULTS) TAB */}
        {currentTab === 'results' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Topshirilgan Test Natijalari
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Barcha o'quvchilarning ballari, sarflangan vaqti va oynadan chiqish holatlari
                </p>
              </div>

              <button
                onClick={() => exportResultsToExcel(results)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Natijalarni Excelga yuklash</span>
              </button>
            </div>

            {/* Results Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-semibold">
                      <th className="py-3 px-4">O'quvchi</th>
                      <th className="py-3 px-4">Guruh</th>
                      <th className="py-3 px-4">Test</th>
                      <th className="py-3 px-4">Ball</th>
                      <th className="py-3 px-4">Foiz</th>
                      <th className="py-3 px-4">Holat</th>
                      <th className="py-3 px-4">Vaqt</th>
                      <th className="py-3 px-4">Oynadan chiqish</th>
                      <th className="py-3 px-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {results.map(res => {
                      const mins = Math.floor(res.timeSpentSeconds / 60);
                      const secs = res.timeSpentSeconds % 60;
                      const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                      return (
                        <tr
                          key={res.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {res.studentName}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {res.studentGroup}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                            {res.testTitle}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold">
                            {res.score} / {res.totalQuestions}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {res.percentage}%
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                res.passed
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {res.passed ? "O'tdi" : "Yiqildi"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {timeStr}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span
                              className={
                                res.tabSwitchCount > 0
                                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }
                            >
                              {res.tabSwitchCount} marta
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onViewResult(res.id)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="To'liq tahlilni ko'rish"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 7. STATISTIKA (ANALYTICS) TAB */}
        {currentTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Chuqur Tahlil va Statistika
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                O'quvchilar va guruhlar bo'yicha ko'rsatkichlar taqsimoti
              </p>
            </div>

            {/* Metric widgets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="O'rtacha foiz"
                value={avgPercentage}
                suffix="%"
                icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
              />
              <StatCard
                label="Muvaffaqiyatli (O'tganlar)"
                value={passedResults}
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              />
              <StatCard
                label="O'ta olmaganlar"
                value={totalResults - passedResults}
                icon={<XCircle className="w-5 h-5 text-rose-600" />}
              />
              <StatCard
                label="Jami sinovlar soni"
                value={totalResults}
                icon={<FileText className="w-5 h-5 text-blue-600" />}
              />
            </div>

            {/* Performance charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Group Comparison Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Guruhlar bo'yicha o'rtacha o'zlashtirish
                </h3>
                <p className="text-xs text-slate-500 mb-6">Har bir guruhning natijadorlik darajasi</p>

                <div className="space-y-4">
                  {groups.map(g => {
                    const groupResults = results.filter(r => r.studentGroup === g.name);
                    const avg = groupResults.length
                      ? Math.round(groupResults.reduce((acc, c) => acc + c.percentage, 0) / groupResults.length)
                      : 0;

                    return (
                      <div key={g.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{g.name}</span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{avg}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${avg}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Integrity & Anti-cheat breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Akademik halollik va intizom
                </h3>
                <p className="text-xs text-slate-500 mb-6">Test davomida oynadan chiqish tahlili</p>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                        Namuna (0 marta chiqish)
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Oynadan umuman chiqmaganlar
                      </span>
                    </div>
                    <span className="text-lg font-bold font-mono text-emerald-800 dark:text-emerald-300">
                      {results.filter(r => r.tabSwitchCount === 0).length} nafar
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                        Yengil ogohlantirish (1-2 marta)
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400">
                        Qisqa muddatga oynadan chiqqanlar
                      </span>
                    </div>
                    <span className="text-lg font-bold font-mono text-amber-800 dark:text-amber-300">
                      {results.filter(r => r.tabSwitchCount >= 1 && r.tabSwitchCount <= 2).length} nafar
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                        Shubhali holat (3+ marta)
                      </span>
                      <span className="text-[11px] text-rose-700 dark:text-rose-400">
                        Ko'p marta boshqa ilovaga o'tganlar
                      </span>
                    </div>
                    <span className="text-lg font-bold font-mono text-rose-800 dark:text-rose-300">
                      {results.filter(r => r.tabSwitchCount >= 3).length} nafar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. EXCEL & IMPORT TAB */}
        {currentTab === 'excel' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Excel & Hujjatlar bilan ishlash
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Ma'lumotlarni eksport qilish va tashqi manbalardan savollarni qabul qilish
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Excel Export Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Natijalarni Excel formatida yuklash
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    Barcha o'quvchilar natijalari, ballari, foizlari, o'tish holati va topshirilgan sanasini Microsoft Excel dasturiga mos UTF-8 formatida yuklab oling.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => exportResultsToExcel(results)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Barcha natijalarni yuklab olish (.csv / Excel)</span>
                  </button>
                  <button
                    onClick={() => exportStudentsToExcel(students, results)}
                    className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>O'quvchilar ro'yxatini yuklab olish</span>
                  </button>
                </div>
              </div>

              {/* Word / TXT Import Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-4">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Word va Matnli fayllardan savollar importi
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    Mavjud Word (.docx), Google Docs yoki TXT testlaringizni qo'lda kiritib o'tirmasdan bir vaqtning o'zida yuzlab savollarni bazaga avtomatik joylang.
                  </p>
                </div>

                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Savollar matnini joylashtirish</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 9. QO'LLANMA (GUIDE) TAB */}
        {currentTab === 'guide' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                O'qituvchi va Admin Qo'llanmasi
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Platformadan professional darajada foydalanish yo'riqnomasi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>1. Qanday qilib yangi test yaratiladi?</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  "Testlar" bo'limiga o'ting va "Yangi test yaratish" tugmasini bosing. Fan nomi, vaqt me'yori (daqiqalarda) va o'tish balini kiriting. Tizim avtomatik ravishda Savollar bankidan tegishli fanga doir savollarni test tarkibiga biriktiradi.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>2. Word hujjatidan import qilish qoidalari</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Word yoki TXT faylingizdagi savollar quyidagi oddiy ko'rinishda bo'lishi kifoya: raqam (1.), variantlar (A, B, C, D) va oxirida "Javob: B" qatori. Tizim avtomatik tahlil qilib bazaga joylaydi.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>3. Anti-cheat (Oynadan chiqish) qanday ishlaydi?</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  O'quvchi test sahifasidan chiqib boshqa ilovaga yoki yangi tabga o'tgan zahoti tizim ogohlantirish beradi va har bir chiqish sonini sanab, o'qituvchiga natijalar jadvalida aks ettiradi.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>4. Telegram xabarnomalarini sozlash</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  "Sozlamalar" bo'limida Telegram bot tokeni va Chat ID sini kiriting. Har bir o'quvchi testni tugatgan onda sizning Telegram profilingizga yoki guruhga batafsil hisobot boradi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 10. SOZLAMALAR (SETTINGS) TAB */}
        {currentTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Tizim Sozlamalari
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Telegram bot integratsiyasi va doimiy saqlash holati
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Telegram Integration Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Telegram Bot Integratsiyasi
                    </h3>
                    <span className="text-xs text-slate-400">
                      Test natijalarini to'g'ridan-to'g'ri Telegramga yuborish
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveTelegram} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Telegram Bot Token
                    </label>
                    <input
                      type="text"
                      value={tgBotToken}
                      onChange={e => setTgBotToken(e.target.value)}
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="w-full font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Chat ID (Shaxsiy yoki Guruh)
                    </label>
                    <input
                      type="text"
                      value={tgChatId}
                      onChange={e => setTgChatId(e.target.value)}
                      placeholder="123456789 yoki -100123456789"
                      className="w-full font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="tg-enabled"
                      checked={tgEnabled}
                      onChange={e => setTgEnabled(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="tg-enabled" className="text-xs text-slate-700 dark:text-slate-300">
                      Test tugaganda avtomatik xabar yuborish
                    </label>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={isTestingTelegram || !tgBotToken || !tgChatId}
                      onClick={handleTestTelegramConnection}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {isTestingTelegram ? 'Ulanmoqda...' : 'Aloqani tekshirish'}
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Sozlamalarni saqlash
                    </button>
                  </div>
                </form>
              </div>

              {/* Data Reset & Storage Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-4">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Xotira va Baza holati
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Barcha ma'lumotlar brauzerning xavfsiz doimiy xotirasida saqlanadi. Agar namunaviy holatga qaytarmoqchi bo'lsangiz, quyidagi tugmadan foydalanishingiz mumkin.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      if (window.confirm("Barcha ma'lumotlarni boshlang'ich holatga qaytarishni tasdiqlaysizmi?")) {
                        resetAllData();
                        addToast("Ma'lumotlar qayta tiklandi", 'info');
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Boshlang'ich namunaviy ma'lumotlarga qaytarish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
