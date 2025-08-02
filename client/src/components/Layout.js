import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, isFullscreen, onToggleFullscreen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(false);
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleCollapse = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Get theme classes
  const bgClass = theme === 'dark' ? 'bg-dashboard-bg-dark' : 'bg-dashboard-bg-light';
  const textClass = theme === 'dark' ? 'text-text-dark' : 'text-text-light';

  // Sync fullscreen state if user exits via Esc or browser UI
  React.useEffect(() => {
    const handleFsChange = () => {
      const fs = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      if (!fs && isFullscreen && typeof onToggleFullscreen === 'function') {
        onToggleFullscreen();
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, [isFullscreen, onToggleFullscreen]);


  return (
    <div className={`flex h-screen ${bgClass} ${textClass} ${isFullscreen ? 'overflow-hidden' : ''}`}>
      {!isFullscreen && (
        <>
          <Sidebar
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            isOpen={isSidebarOpen}
            onToggleCollapse={handleToggleCollapse}
            onClose={handleSidebarClose}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
          {isMobile && isSidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300" 
              onClick={handleSidebarClose}
            />
          )}
        </>
      )}
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isFullscreen ? 'ml-0' : (isMobile ? '' : (isCollapsed ? 'ml-20' : 'ml-64'))}`}>
        {/* Header removed as per user request. Only dashboard children will be rendered. */}
        <> </>

        
        <div className="flex-1 overflow-auto p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
          <div className="max-w-7xl mx-auto transition-all duration-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
