import React, { useState } from 'react';
import { User } from './AuthSystem';
import { AdminDashboard } from './AdminDashboard';
import { DonorDashboard } from './DonorDashboard';
import { VolunteerDashboard } from './VolunteerDashboard';
import { VictimDashboard } from './VictimDashboard';
import { Header } from './Header';
import { Chatbot } from './Chatbot';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeView, setActiveView] = useState('dashboard');

  const renderDashboard = () => {
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user} 
        onLogout={onLogout} 
        activeView={activeView} 
        onViewChange={setActiveView}
      />
      <main className="pt-16">
        {renderDashboard()}
      </main>
      <Chatbot user={user} onNavigate={setActiveView} />
    </div>
  );
}