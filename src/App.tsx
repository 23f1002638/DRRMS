import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthSystem, User } from './components/AuthSystem';
import { Header } from './components/Header';
import { AdminDashboard } from './components/AdminDashboard.refactored';
import { DonorDashboard } from './components/DonorDashboard';
import { VolunteerDashboard } from './components/VolunteerDashboard';
import { VictimDashboard } from './components/VictimDashboard';
import { AnalyticsView } from './components/AnalyticsView';
import { MapView } from './components/MapView';
import { AidRequestForm } from './components/AidRequestForm';
import { VolunteerManagement } from './components/VolunteerManagement';
import { InventoryManagement } from './components/InventoryManagement';
import { AIAssistant } from './components/AIAssistant';
import { ThemeProvider } from './components/ThemeProvider';
import { LandingPage } from './components/LandingPage';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

export type ActiveView =
  | 'dashboard'
  | 'analytics'
  | 'map'
  | 'aid-request'
  | 'volunteer-management'
  | 'inventory';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthSystem, setShowAuthSystem] = useState(false);

  // Listen to auth state changes and fetch user profile
  useEffect(() => {
    // Check current session on mount
    checkSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setShowAuthSystem(false);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        const userData: User = {
          id: profile.id,
          name: profile.full_name,
          email: profile.email,
          role: profile.role,
        };
        setUser(userData);
        console.log('User profile loaded:', userData.role);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setActiveView('dashboard');
    console.log('User logged in:', userData.role);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

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
    try {
      switch (user.role) {
        case 'admin':
          return <AdminDashboard user={user} />;
        case 'donor':
          return <DonorDashboard user={user} />;
        case 'volunteer':
          return <VolunteerDashboard user={user} />;
        case 'victim':
          return <VictimDashboard user={user} />;
        default:
          return <VictimDashboard user={user} />;
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
    try {
      switch (activeView) {
        case 'dashboard':
          return renderDashboard();
        case 'analytics':
          return <AnalyticsView user={user} />;
        case 'map':
          return <MapView user={user} />;
        case 'aid-request':
          return <AidRequestForm user={user} onSuccess={() => setActiveView('dashboard')} />;
        case 'volunteer-management':
          return <VolunteerManagement user={user} />;
        case 'inventory':
          return <InventoryManagement user={user} />;
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
          user={user}
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={handleLogout}
        />
        <main className="pt-16">
          {renderActiveView()}
        </main>
        <AIAssistant />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;