import React from 'react';
import { AdminDashboard } from '../components/AdminDashboard';

export const AdminPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-theme-bg text-theme-text p-4 md:p-8">
      <AdminDashboard />
    </main>
  );
};

export default AdminPage;
