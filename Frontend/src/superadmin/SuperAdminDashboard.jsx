import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SuperAdminSideBar from './SuperAdminSideBar';
import SDashboard from './SDashboard';
import Applications from './Applications';
import './SuperAdminDashboard.css';
import AdminManagement from './AdminManagement';
import SoloParentManagement from './SoloParentManagement';
import Events from './Events';
import ForumManagement from './ForumManagement';

const SuperAdminDashboard = () => {
  return (
    <div className="super-admin-dashboard">
      <SuperAdminSideBar />
      <div className="super-admin-container">
        <div className="super-admin-content">
        <Routes caseSensitive={false}>
          <Route path="sdashboard" element={<SDashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="admin-management" element={<AdminManagement />} />
          <Route path="solo-parent-management" element={<SoloParentManagement />} />
          <Route path="events" element={<Events />} />
          <Route path="forum-management" element={<ForumManagement />} />
        </Routes>

        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
