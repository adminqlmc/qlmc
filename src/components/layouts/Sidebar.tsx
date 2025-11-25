"use client";

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Spin, App } from 'antd';
import { HomeOutlined, LaptopOutlined, UserOutlined, BarChartOutlined, BugOutlined, SettingOutlined, QuestionCircleOutlined, LogoutOutlined, ExclamationCircleOutlined, MessageOutlined, BulbOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';

const { Sider } = Layout;

// Menu items based on role
const getMenuItems = (role?: string, handleLogout?: () => void) => {
  // Menu chung cho tất cả role - trang chủ tùy theo role
  const getCommonItems = () => {
    if (role === 'admin') {
      return [{ key: '/admin', icon: <HomeOutlined />, label: <Link href="/admin">Trang chủ</Link> }];
    } else if (role === 'teacher') {
      return [{ key: '/teacher', icon: <HomeOutlined />, label: <Link href="/teacher">Trang chủ</Link> }];
    } else if (role === 'technician') {
      return [{ key: '/technician', icon: <HomeOutlined />, label: <Link href="/technician">Trang chủ</Link> }];
    }
    return [{ key: '/admin', icon: <HomeOutlined />, label: <Link href="/admin">Trang chủ</Link> }];
  };

  const commonItems = getCommonItems();
  
  // Menu riêng cho Admin
  const adminItems = [
    { type: 'divider' as const },
    { key: 'manage', label: 'QUẢN LÝ', type: 'group' as const, children: [
      { key: '/admin/devices', icon: <LaptopOutlined />, label: <Link href="/admin/devices">Quản lý thiết bị</Link> },
      { key: '/admin/bookings', icon: <BarChartOutlined />, label: <Link href="/admin/bookings">Quản lý lịch đặt</Link> },
      { key: '/admin/users', icon: <UserOutlined />, label: <Link href="/admin/users">Quản lý người dùng</Link> },
    ]},
    { type: 'divider' as const },
    { key: 'reports', label: 'BÁO CÁO & THỐNG KÊ', type: 'group' as const, children: [
      { key: '/admin/statistics', icon: <BarChartOutlined />, label: <Link href="/admin/statistics">Tần suất sử dụng thiết bị</Link> },
      { key: '/admin/incidents', icon: <BugOutlined />, label: <Link href="/admin/incidents">Báo cáo sự cố</Link> },
    ]},
    { type: 'divider' as const },
    { key: 'ai', label: 'TRÍ TUỆ NHÂN TẠO', type: 'group' as const, children: [
      { key: '/admin/train', icon: <QuestionCircleOutlined />, label: <Link href="/admin/train">Huấn luyện Chatbot</Link> },
      { key: '/admin/ai-feedback', icon: <MessageOutlined />, label: <Link href="/admin/ai-feedback">Thống kê Feedback</Link> },
      { key: '/admin/ai-learning-history', icon: <BulbOutlined />, label: <Link href="/admin/ai-learning-history">AI Tự Học</Link> },
    ]},
  ];
  
  // Menu riêng cho Teacher
  const teacherItems = [
    { type: 'divider' as const },
    { key: 'devices', label: 'THIẾT BỊ', type: 'group' as const, children: [
      { key: '/teacher/booking', icon: <LaptopOutlined />, label: <Link href="/teacher/booking">Đặt mượn</Link> },
      { key: '/teacher/schedule', icon: <BarChartOutlined />, label: <Link href="/teacher/schedule">Thời gian biểu</Link> },
      { key: '/teacher/review', icon: <BugOutlined />, label: <Link href="/teacher/review">Đánh giá thiết bị</Link> },
    ]},
    { type: 'divider' as const },
    { key: 'support', label: 'BÁO CÁO & HỖ TRỢ', type: 'group' as const, children: [
      { key: '/teacher/support', icon: <BugOutlined />, label: <Link href="/teacher/support">Yêu cầu hỗ trợ kỹ thuật</Link> },
      { key: '/teacher/ai-assistant', icon: <QuestionCircleOutlined />, label: <Link href="/teacher/ai-assistant">Trợ lý AI</Link> },
    ]},
  ];
  
  // Menu riêng cho Technician
  const technicianItems = [
    { type: 'divider' as const },
    { key: 'work', label: 'CÔNG VIỆC', type: 'group' as const, children: [
      { key: '/technician/assignments', icon: <ExclamationCircleOutlined />, label: <Link href="/technician/assignments">Yêu cầu được phân công</Link> },
      { key: '/technician/schedule', icon: <BarChartOutlined />, label: <Link href="/technician/schedule">Lịch bảo trì</Link> },
      { key: '/technician/history', icon: <BugOutlined />, label: <Link href="/technician/history">Lịch sử công việc</Link> },
    ]},
    { type: 'divider' as const },
    { key: 'devices', label: 'THIẾT BỊ', type: 'group' as const, children: [
      { key: '/technician/devices', icon: <LaptopOutlined />, label: <Link href="/technician/devices">Quản lý thiết bị</Link> },
    ]},
    { type: 'divider' as const },
    { key: 'ai', label: 'TRÍ TUỆ NHÂN TẠO', type: 'group' as const, children: [
      { key: '/technician/train', icon: <QuestionCircleOutlined />, label: <Link href="/technician/train">Huấn luyện Chatbot</Link> },
    ]},
  ];
  
  // Menu hệ thống - chung cho tất cả role (luôn ở cuối)
  const systemItems = [
    { type: 'divider' as const },
    { key: 'system', label: 'HỆ THỐNG', type: 'group' as const, children: [
      { key: '/admin/settings', icon: <SettingOutlined />, label: <Link href="/admin/settings">Cài đặt</Link> },
      { key: '/help', icon: <QuestionCircleOutlined />, label: <Link href="/help">Trợ giúp</Link> },
      { key: '/profile', icon: <UserOutlined />, label: <Link href="/profile">Hồ sơ của bạn</Link> },
      { 
        key: '/logout', 
        icon: <LogoutOutlined />, 
        label: <span onClick={handleLogout}>Đăng xuất</span>,
        onClick: handleLogout,
      },
    ]},
  ];

  // Kết hợp menu theo role
  if (role === 'admin') {
    return [...commonItems, ...adminItems, ...systemItems];
  } else if (role === 'teacher') {
    return [...commonItems, ...teacherItems, ...systemItems];
  } else if (role === 'technician') {
    return [...commonItems, ...technicianItems, ...systemItems];
  }
  // Default
  return [...commonItems, ...systemItems];
};

interface SidebarProps {
  collapsed: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ role: string; fullName?: string; name?: string; email?: string; avatar?: string } | null>(null);

  // Fetch user info from API
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (res.ok) {
          const data = await res.json();
          setUserInfo(data.user);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  // Handle logout with confirmation
  const handleLogout = () => {
    modal.confirm({
      title: 'Xác nhận đăng xuất',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          // Call logout API
          const res = await fetch('/api/auth/logout', {
            method: 'POST',
          });
          
          if (res.ok) {
            // Redirect to login page
            router.push('/login');
          }
        } catch (error) {
          console.error('Logout error:', error);
        }
      },
    });
  };

  // Use API data for user information
  const currentRole = userInfo?.role || 'admin';
  const currentUserName = userInfo?.fullName || 'Loading...';
  const currentUserRole = (
    userInfo?.role === 'admin' ? 'Quản trị viên' : 
    userInfo?.role === 'teacher' ? 'Giáo viên' : 
    userInfo?.role === 'technician' ? 'Kỹ thuật viên' : 'Người dùng'
  );
  const avatarUrl = userInfo?.avatar;

  const menuItems = getMenuItems(currentRole, handleLogout);
  
  // Find selected key based on current pathname
  const findSelectedKey = (): string[] => {
    // Exact match first
    const exactMatch = menuItems.find((m) => m.key === pathname);
    if (exactMatch && exactMatch.key) return [exactMatch.key];
    
    // Check in children groups
    for (const item of menuItems) {
      if ('children' in item && item.children) {
        const childMatch = item.children.find((c) => c.key === pathname);
        if (childMatch && childMatch.key) return [childMatch.key];
        
        // Partial match for nested routes
        const partialMatch = item.children.find((c) => c.key && pathname.startsWith(c.key));
        if (partialMatch && partialMatch.key) return [partialMatch.key];
      }
    }
    
    // Default based on role
    if (currentRole === 'teacher') return ['/teacher'];
    if (currentRole === 'technician') return ['/technician'];
    return ['/admin'];
  };
  
  const selectedKeys = findSelectedKey();

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={onCollapse}
      collapsedWidth={64} 
      width={240} 
      trigger={null}
      className={`${styles.sider} ${collapsed ? styles.collapsed : ''}`}
    >

      {/* User Profile Section */}
      <div className={styles.profileCard}>
        {loading ? (
          <Spin size="small" />
        ) : (
          <>
            <Avatar 
              size={collapsed ? 40 : 64} 
              className={styles.avatar} 
              src={avatarUrl || undefined}
              icon={<UserOutlined />} 
            />
            {!collapsed && (
              <>
                <div className={styles.userName}>{currentUserName}</div>
                <div className={styles.userRole}>{currentUserRole}</div>
              </>
            )}
          </>
        )}
      </div>

      {/* Main Menu */}
      <Menu 
        mode="inline" 
        selectedKeys={selectedKeys} 
        items={menuItems} 
        className={styles.menu} 
      />
    </Sider>
  );
}
