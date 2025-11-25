"use client";

import React, { useState } from 'react';
import { Layout, ConfigProvider, App } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './DashboardLayout.module.css';

const { Content, Footer } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff', // blue
          colorBgLayout: '#f7f9fb', // very light blue-gray
          colorBorder: '#e6e9ef',
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#ffffff',
            bodyBg: '#f7f9fb',
          },
        },
      }}
    >
      <App>
        <Layout className={styles.layout}>
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout>
          <Header
            title="HỆ THỐNG QUẢN LÝ MÁY CHIẾU"
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
          <Content className={styles.content}>
            <div className={styles.contentWrapper}>
              {children}
            </div>
          </Content>
          <Footer className={styles.footer}>
            QLMC © {new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
      </App>
    </ConfigProvider>
  );
}
