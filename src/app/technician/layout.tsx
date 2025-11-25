'use client';
import { App } from 'antd';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ChatWidget from '@/components/ChatWidget/ChatWidget';

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  return (
    <App>
      <DashboardLayout>{children}</DashboardLayout>
      <ChatWidget />
    </App>
  );
}
