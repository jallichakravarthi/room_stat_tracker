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

  // Track previous isMobile to only update sidebar when device type changes
  const prevIsMobile = React.useRef();
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (prevIsMobile.current === undefined) {
        // On first mount, set sidebar based on device
        if (mobile) {
          setIsCollapsed(false);
          setIsSidebarOpen(false);
        } else {
          setIsSidebarOpen(true);
        }
      } else if (prevIsMobile.current !== mobile) {
        // Only update when device type changes
        if (mobile) {
          setIsCollapsed(false);
          setIsSidebarOpen(false);
        } else {
          setIsSidebarOpen(true);
        }
      }
      prevIsMobile.current = mobile;
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
          {/* Floating hamburger button for mobile */}
          {isMobile && !isSidebarOpen && (
            <button
              className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white bg-opacity-80 shadow-md hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ width: 44, height: 44 }}
              aria-label="Open sidebar menu"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          )}
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
