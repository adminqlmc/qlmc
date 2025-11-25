'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, App, Button, Divider } from 'antd';
import { 
  ExclamationCircleOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  ToolOutlined,
  CalendarOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import styles from './technician.module.css';
import HomePageContent from '@/components/HomePageContent';

interface SupportRequest {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  createdAt: string;
  respondedAt: string | null;
  user: {
    userID: string;
    fullName: string;
    email: string;
  };
  projector: {
    id: string;
    name: string;
    room: string;
    building: string;
    status: string;
  } | null;
}

interface Statistics {
  pending: number;
  inProgress: number;
  resolved: number;
  todayScheduled: number;
}

export default function TechnicianDashboard() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics>({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    todayScheduled: 0,
  });
  const [urgentRequests, setUrgentRequests] = useState<SupportRequest[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<SupportRequest[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/technician/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStatistics(data.statistics);
        setUrgentRequests(data.urgentRequests);
        setTodaySchedule(data.todaySchedule);
      } else {
        message.error('Không thể tải dữ liệu dashboard');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Khẩn cấp';
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return priority;
    }
  };

  const urgentColumns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Người yêu cầu',
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
      render: (projector: any) => projector ? (
        <div>
          <div>{projector.name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {projector.room} - {projector.building}
          </div>
        </div>
      ) : <span style={{ color: '#999' }}>Không có</span>,
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{getPriorityText(priority)}</Tag>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: SupportRequest) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => router.push('/technician/assignments')}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const scheduleColumns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Thiết bị',
      dataIndex: 'projector',
      key: 'projector',
      render: (projector: any) => projector ? (
        <div>
          <div>{projector.name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {projector.room} - {projector.building}
          </div>
        </div>
      ) : <span style={{ color: '#999' }}>Không có</span>,
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_: any, record: SupportRequest) => (
        <div>
          {record.scheduledStartTime && record.scheduledEndTime ? (
            <>
              <div>{dayjs(record.scheduledStartTime).format('HH:mm')} - {dayjs(record.scheduledEndTime).format('HH:mm')}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {dayjs(record.scheduledStartTime).format('DD/MM/YYYY')}
              </div>
            </>
          ) : (
            <span style={{ color: '#999' }}>Chưa lên lịch</span>
          )}
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: SupportRequest) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => router.push('/technician/schedule')}
        >
          Xem lịch
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>

      <Spin spinning={loading}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className={styles.statsRow}>
          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.statCard}>
              <Statistic
                title="Đang chờ xử lý"
                value={statistics.pending}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.statCard}>
              <Statistic
                title="Đang xử lý"
                value={statistics.inProgress}
                prefix={<ToolOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.statCard}>
              <Statistic
                title="Đã hoàn thành"
                value={statistics.resolved}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.statCard}>
              <Statistic
                title="Lịch hôm nay"
                value={statistics.todayScheduled}
                prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <HomePageContent />

        {/* Urgent Requests */}
        {urgentRequests.length > 0 && (
          <Card 
            title={
              <span>
                <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                Yêu cầu khẩn cấp
              </span>
            }
            className={styles.section}
            extra={
              <Button type="link" onClick={() => router.push('/technician/assignments')}>
                Xem tất cả
              </Button>
            }
          >
            <Table
              columns={urgentColumns}
              dataSource={urgentRequests}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        )}

        {/* Today's Schedule */}
        {todaySchedule.length > 0 && (
          <Card 
            title={
              <span>
                <CalendarOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                Lịch bảo trì hôm nay
              </span>
            }
            className={styles.section}
            extra={
              <Button type="link" onClick={() => router.push('/technician/schedule')}>
                Xem lịch đầy đủ
              </Button>
            }
          >
            <Table
              columns={scheduleColumns}
              dataSource={todaySchedule}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        )}

        {urgentRequests.length === 0 && todaySchedule.length === 0 && !loading && (
          <Card className={styles.emptyCard}>
            <div className={styles.emptyState}>
              <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
              <h3>Tuyệt vời! Không có công việc khẩn cấp</h3>
              <p>Bạn đã hoàn thành tốt công việc của mình</p>
            </div>
          </Card>
        )}

        <Divider style={{ margin: '32px 0' }} />

        {/* Carousel and Info Section */}
      </Spin>
    </div>
  );
}

