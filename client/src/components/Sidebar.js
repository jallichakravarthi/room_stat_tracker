import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isCollapsed, isMobile, isOpen, onToggleCollapse, onClose, theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.username) setUser(data);
          else setUser(null);
        })
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, [token]);

  const navItems = [
    {
      section: 'Rooms',
      items: [
        { path: '/room1', label: 'Room 1', icon: 'room1' },
        { path: '/room2', label: 'Room 2', icon: 'room2' },
      ]
    },
    ...(!user ? [{
      section: 'Account',
      items: [
        { path: '/login', label: 'Login', icon: 'settings' },
        { path: '/register', label: 'Register', icon: 'settings' },
      ]
    }] : [])
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Get theme classes
  const bgClass = theme === 'dark' ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-white to-gray-100';
  const textClass = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
  const borderClass = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const hoverClass = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-blue-50';
  const activeClass = theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md';

  return (
    <div className={`fixed inset-y-0 left-0 z-50 transform ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'} ${isCollapsed ? 'w-20' : 'w-64'} ${bgClass} ${textClass} border-r ${borderClass} flex flex-col transition-all duration-300 ease-in-out shadow-xl`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-700">
        {!isCollapsed && (
          <div className="text-xl font-bold text-white flex items-center">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            </div>
            Room Tracker
          </div>
        )}
        <button 
          className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200 transform hover:scale-110"
          onClick={onToggleCollapse}
          aria-label="Toggle sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6 animate-fadeIn" style={{ animationDelay: `${sectionIndex * 0.1}s` }}>
            {!isCollapsed && (
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                {section.section}
              </div>
            )}
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} className="mb-1 transform transition-all duration-200 hover:scale-[1.02]">
                <button
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${isActive(item.path) ? activeClass : ''} ${hoverClass} shadow-sm hover:shadow-md`}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) onClose();
                  }}
                  aria-label={item.label}
                >
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-3 ${isActive(item.path) ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
  {item.icon === 'room1' && (
    <svg width="20" height="20" fill="none" stroke={isActive(item.path) ? '#fff' : '#3b82f6'} strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 10l10-7 10 7"/></svg>
  )}
  {item.icon === 'room2' && (
    <svg width="20" height="20" fill="none" stroke={isActive(item.path) ? '#fff' : '#6366f1'} strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="2"/><circle cx="12" cy="14" r="3"/></svg>
  )}
  {item.icon === 'settings' && (
    <svg width="20" height="20" fill="none" stroke={isActive(item.path) ? '#fff' : '#f59e42'} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 01.33 1.82l-1.45 2.5a1.65 1.65 0 01-2.1.75l-2.12-.85a1.65 1.65 0 00-1.26 0l-2.12.85a1.65 1.65 0 01-2.1-.75l-1.45-2.5a1.65 1.65 0 01.33-1.82l1.7-1.3a1.65 1.65 0 00.58-1.68l-.32-2.21a1.65 1.65 0 01.95-1.72l2.12-.85a1.65 1.65 0 011.26 0l2.12.85a1.65 1.65 0 01.95 1.72l-.32 2.21a1.65 1.65 0 00.58 1.68l1.7 1.3z"/></svg>
  )}
</span>
                  {!isCollapsed && <span className="transition-all duration-200">{item.label}</span>}
                </button>
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {user ? (
          <div className="flex flex-col items-start space-y-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">Logged in as:</div>
            <div className="font-semibold text-gray-900 dark:text-white">{user.username}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">{user.email}</div>
            <button
              className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs"
              onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}
            >Logout</button>
          </div>
        ) : null}
        <button 
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:bg-gradient-to-r from-gray-200 to-gray-300 dark:hover:bg-gradient-to-r from-gray-700 to-gray-600 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 mt-4"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mr-3 transition-transform duration-300 hover:rotate-12">
            {theme === 'light' ? (
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            ) : (
              <>
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </>
            )}
          </svg>
          {!isCollapsed && <span className="transition-all duration-200">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
