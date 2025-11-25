"use client";

import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Calendar, Badge, List, App, Divider } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, LaptopOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import HomePageContent from '@/components/HomePageContent';

interface BookingStats {
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

interface UpcomingBooking {
  id: string;
  projector: { name: string };
  startTime: string;
  endTime: string;
  status: string;
}

export default function TeacherPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BookingStats>({ pending: 0, approved: 0, rejected: 0, completed: 0 });
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/teacher/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUpcomingBookings(data.upcomingBookings || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getListData = (value: Dayjs) => {
    const bookingsOnDate = upcomingBookings.filter(b => 
      dayjs(b.startTime).isSame(value, 'day')
    );
    return bookingsOnDate.map(b => ({
      type: b.status === 'approved' ? 'success' : 'warning',
      content: `${dayjs(b.startTime).format('HH:mm')} - ${b.projector.name}`,
    }));
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type as any} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ padding: 24 }}>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chờ duyệt"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã duyệt"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Từ chối"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={stats.completed}
              prefix={<LaptopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>
      {/* Carousel and Info Section */}
      <HomePageContent />

      <Row gutter={[16, 16]}>
        {/* Calendar */}
        <Col xs={24} lg={16}>
          <Card title="Lịch đặt mượn" loading={loading}>
            <Calendar cellRender={dateCellRender} />
          </Card>
        </Col>

        {/* Upcoming Bookings */}
        <Col xs={24} lg={8}>
          <Card title="Lịch sắp tới" loading={loading}>
            <List
              dataSource={upcomingBookings.slice(0, 5)}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.projector.name}
                    description={
                      <div>
                        <div>{dayjs(item.startTime).format('DD/MM/YYYY')}</div>
                        <div>{dayjs(item.startTime).format('HH:mm')} - {dayjs(item.endTime).format('HH:mm')}</div>
                      </div>
                    }
                  />
                  <Badge 
                    status={item.status === 'approved' ? 'success' : 'warning'} 
                    text={item.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: '32px 0' }} />


    </div>
  );
}
