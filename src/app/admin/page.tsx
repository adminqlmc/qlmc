"use client";

import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Divider } from 'antd';
import { 
  UserOutlined, 
  LaptopOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  WarningOutlined,
  ToolOutlined
} from '@ant-design/icons';
import HomePageContent from '@/components/HomePageContent';
import dayjs from 'dayjs';

interface DashboardStats {
  totalUsers: number;
  totalProjectors: number;
  pendingBookings: number;
  completedBookings: number;
  maintenanceDevices: number;
  brokenDevices: number;
}

interface RecentBooking {
  id: string;
  user: {
    fullName: string;
    userID: string;
  };
  projector: {
    name: string;
    room: string;
  };
  startTime: string;
  endTime: string;
  status: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProjectors: 0,
    pendingBookings: 0,
    completedBookings: 0,
    maintenanceDevices: 0,
    brokenDevices: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch admin statistics
      const statsRes = await fetch('/api/admin/dashboard-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Fetch recent bookings
      const bookingsRes = await fetch('/api/admin/bookings?limit=5');
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setRecentBookings(bookingsData.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'blue';
      case 'completed': return 'green';
      case 'rejected': return 'red';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'completed': return 'Hoàn thành';
      case 'rejected': return 'Từ chối';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const columns = [
    {
      title: 'Người đặt',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => (
        <div>
          <div>{user.fullName}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{user.userID}</div>
        </div>
      ),
    },
    {
      title: 'Thiết bị',
      dataIndex: 'projector',
      key: 'projector',
      render: (projector: any) => (
        <div>
          <div>{projector.name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{projector.room}</div>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (record: RecentBooking) => (
        <div>
          <div>{dayjs(record.startTime).format('DD/MM/YYYY HH:mm')}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            đến {dayjs(record.endTime).format('HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>

      <Spin spinning={loading}>
        {/* Combined Statistics Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Tổng số người dùng"
                value={stats.totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Tổng thiết bị"
                value={stats.totalProjectors}
                prefix={<LaptopOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Lịch đặt chờ duyệt"
                value={stats.pendingBookings}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Hoàn thành trong tuần"
                value={stats.completedBookings}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Đang bảo trì"
                value={stats.maintenanceDevices}
                prefix={<ToolOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Hỏng hóc"
                value={stats.brokenDevices}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Carousel and Info Section */}
        <HomePageContent />

        <Divider style={{ margin: '32px 0' }} />

        {/* Recent Bookings Table */}
        <Card title="Lịch đặt gần đây">
          <Table
            columns={columns}
            dataSource={recentBookings}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: 'Chưa có lịch đặt nào' }}
          />
        </Card>
      </Spin>
    </div>
  );
}
