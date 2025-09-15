import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import ProjectManagement from '../pages/ProjectManagement';
import { SettingsPage } from '../pages/SettingsPage';

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'settings'>('projects');

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <ProjectManagement />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ProjectManagement />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {renderContent()}
      </div>
    </div>
  );
};