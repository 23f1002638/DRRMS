import { useState, useEffect } from 'react';
import { api } from './lib/api';
import { AuthSystem, User } from './components/AuthSystem';
import { Header } from './components/Header';
import { AdminDashboard } from './components/AdminDashboard.refactored';
import { DonorDashboard } from './components/DonorDashboard';
import { VolunteerDashboard } from './components/VolunteerDashboard';
import { VictimDashboard } from './components/VictimDashboard';
import { AnalyticsView } from './components/AnalyticsView';
import { MapView } from './components/MapView';
import { AidRequestForm } from './components/AidRequestForm';
import { AidStatusView } from './components/AidStatusView';
import { ResourcesView } from './components/ResourcesView';
import { MyTasksView } from './components/MyTasksView';
import { AvailableTasksView } from './components/AvailableTasksView';
import { VolunteerManagement } from './components/VolunteerManagement';
import { InventoryManagement } from './components/InventoryManagement';
import { AIAssistant } from './components/AIAssistant';
import { ThemeProvider } from './components/ThemeProvider';
import { LandingPage } from './components/LandingPage';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { ProfileView } from './components/ProfileView';

export type ActiveView =
  | 'dashboard'
  | 'analytics'
  | 'map'
  | 'aid-request'
  | 'request'
  | 'status'
  | 'resources'
  | 'available-tasks'
  | 'my-tasks'
  | 'volunteer-management'
  | 'inventory'
  | 'profile';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthSystem, setShowAuthSystem] = useState(false);

  // Check current session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await api.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        console.log('User session loaded:', session.user.role);
      } else {
        setShowAuthSystem(false);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setActiveView('dashboard');
    setShowAuthSystem(false);
    console.log('User logged in:', userData.role);
  };

  const handleLogout = async () => {
    try {
      api.auth.logout();
      setUser(null);
      setActiveView('dashboard');
      setShowAuthSystem(false);
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out');
    }
  };

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading application...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show landing page if user is not logged in and hasn't clicked "Get Started"
  if (!user && !showAuthSystem) {
    return (
      <ThemeProvider>
        <LandingPage onGetStarted={() => setShowAuthSystem(true)} />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show auth system if user clicked "Get Started" but hasn't logged in yet
  if (!user && showAuthSystem) {
    return (
      <ThemeProvider>
        <AuthSystem onLogin={handleLogin} />
        <Toaster />
      </ThemeProvider>
    );
  }

  const renderDashboard = () => {
    if (!user) return null;

    console.log('Rendering dashboard for role:', user.role);

    try {
      switch (user.role) {
        case 'admin':
          return <AdminDashboard user={user} onViewChange={(view) => setActiveView(view as ActiveView)} />;
        case 'donor':
          return <DonorDashboard user={user} />;
        case 'volunteer':
          console.log('Mounting VolunteerDashboard');
          return <VolunteerDashboard user={user} />;
        case 'victim':
          return <VictimDashboard user={user} onViewChange={(view) => setActiveView(view as ActiveView)} />;
        default:
          console.warn('Unknown role, defaulting to VictimDashboard:', user.role);
          return <VictimDashboard user={user} onViewChange={(view) => setActiveView(view as ActiveView)} />;
      }
    } catch (error) {
      console.error('Error rendering dashboard:', error);
      toast.error('Failed to load dashboard');
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Error loading dashboard. Please try refreshing the page.</p>
        </div>
      );
    }
  };

  const renderActiveView = () => {
    if (!user) return null;

    try {
      switch (activeView) {
        case 'dashboard':
          return renderDashboard();
        case 'analytics':
          return <AnalyticsView />;
        case 'map':
          return <MapView user={user} />;
        case 'aid-request':
        case 'request':  // Victim navigation uses 'request'
          return <AidRequestForm onSuccess={() => setActiveView('dashboard')} />;
        case 'status':  // Victim navigation uses 'status'
          return <AidStatusView user={user} />;
        case 'resources':  // Victim navigation uses 'resources'
          return <ResourcesView user={user} />;
        case 'available-tasks':
          return <AvailableTasksView user={user} />;
        case 'my-tasks':
          return <MyTasksView user={user} />;
        case 'volunteer-management':
          return <VolunteerManagement user={user} />;
        case 'inventory':
          return <InventoryManagement user={user} />;
        case 'profile':
          return <ProfileView user={user} />;
        default:
          return renderDashboard();
      }
    } catch (error) {
      console.error('Error rendering view:', error);
      toast.error('Failed to load view');
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Error loading view. Please try again.</p>
        </div>
      );
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <Header
          user={user!}
          activeView={activeView}
          onViewChange={(view: string) => setActiveView(view as ActiveView)}
          onLogout={handleLogout}
        />
        <main className="pt-16">
          {renderActiveView()}
        </main>
        <AIAssistant activeView={activeView} userRole={user?.role} />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;