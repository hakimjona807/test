import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TestTakingPage } from './pages/TestTakingPage';
import { TestResultPage } from './pages/TestResultPage';
import { NotFoundPage } from './pages/NotFoundPage';

function MainAppContent() {
  const { currentUser, isAuthenticated } = useAuth();

  // Parse current route from window.location
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const path = window.location.pathname;
    return path || '/';
  });

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Automatic routing based on authentication & path
  useEffect(() => {
    if (currentPath === '/' || currentPath === '') {
      if (isAuthenticated) {
        navigate(currentUser?.role === 'student' ? '/student' : '/teacher');
      } else {
        navigate('/login');
      }
    }
  }, [currentPath, isAuthenticated, currentUser?.role]);

  // Extract params
  const isLoginPage = currentPath === '/login';
  const isStudentPage = currentPath === '/student';
  const isStudentResultsPage = currentPath === '/student-results';
  const isTeacherPage = currentPath.startsWith('/teacher');
  const isTestTaking = currentPath.startsWith('/test/');
  const isResultPage = currentPath.startsWith('/result/');

  const activeTestId = isTestTaking ? currentPath.replace('/test/', '') : null;
  const activeResultId = isResultPage ? currentPath.replace('/result/', '') : null;

  // Query param tab for teacher
  const searchParams = new URLSearchParams(window.location.search);
  const teacherTab = (searchParams.get('tab') as any) || 'overview';

  // Render view
  const renderView = () => {
    if (isLoginPage) {
      return <LoginPage onNavigate={navigate} />;
    }

    if (!isAuthenticated) {
      return <LoginPage onNavigate={navigate} />;
    }

    if (isTestTaking && activeTestId) {
      return (
        <TestTakingPage
          testId={activeTestId}
          onFinish={(resId) => navigate(`/result/${resId}`)}
          onCancel={() => navigate(currentUser?.role === 'student' ? '/student' : '/teacher')}
        />
      );
    }

    if (isResultPage && activeResultId) {
      return (
        <TestResultPage
          resultId={activeResultId}
          onBackToDashboard={() => navigate(currentUser?.role === 'student' ? '/student' : '/teacher')}
          onRetakeTest={(testId) => navigate(`/test/${testId}`)}
        />
      );
    }

    if (isStudentPage || isStudentResultsPage) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <StudentDashboard
            onNavigate={navigate}
            onStartTest={(testId) => navigate(`/test/${testId}`)}
            onViewResult={(resId) => navigate(`/result/${resId}`)}
          />
        </div>
      );
    }

    if (isTeacherPage) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <TeacherDashboard
            initialTab={teacherTab}
            onNavigate={navigate}
            onViewResult={(resId) => navigate(`/result/${resId}`)}
            onTakeTest={(testId) => navigate(`/test/${testId}`)}
          />
        </div>
      );
    }

    // Friendly 404 fallback page in Uzbek
    return (
      <NotFoundPage
        onNavigateHome={() =>
          navigate(currentUser?.role === 'student' ? '/student' : '/teacher')
        }
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Navbar shown except when on login page or actively taking test */}
      {!isLoginPage && !isTestTaking && (
        <Navbar
          currentPath={currentPath}
          onNavigate={navigate}
          showSidebarToggle={isTeacherPage}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">{renderView()}</main>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <MainAppContent />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
