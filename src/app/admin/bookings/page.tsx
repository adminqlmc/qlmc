"use client";

import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Card, Tabs, App, Select } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, HistoryOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import styles from './bookings.module.css';

interface Booking {
  id: string;
  userId: string;
  user: {
    userID: string;
    fullName: string;
    email: string;
  };
  projectorId: string;
  projector: {
    name: string;
    model: string;
    serialNumber: string;
    room: string;
    building: string;
  };
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
}

export default function BookingsManagementPage() {
  const { modal, message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  // Fetch bookings
  const fetchBookings = async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status !== 'all' 
        ? `/api/admin/bookings?status=${status}`
        : '/api/admin/bookings';
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      } else {
        message.error('Không thể tải danh sách lịch đặt');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(activeTab);
  }, [activeTab]);

  // Approve or reject booking
  const handleUpdateStatus = async (bookingId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        message.success(
          status === 'approved' 
            ? 'Đã phê duyệt lịch đặt thành công!' 
            : 'Đã từ chối lịch đặt!'
        );
        fetchBookings(activeTab);
      } else {
        const data = await res.json();
        message.error(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi xử lý yêu cầu');
    }
  };

  // Status config
  const statusConfig: Record<string, { color: string; text: string }> = {
    pending: { color: 'warning', text: 'Chờ duyệt' },
    approved: { color: 'success', text: 'Đã duyệt' },
    rejected: { color: 'error', text: 'Từ chối' },
    completed: { color: 'default', text: 'Hoàn thành' },
  };

  // Base columns
  const baseColumns: ColumnsType<Booking> = [
    {
      title: 'Người đặt',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <div>
          <div><strong>{record.user.fullName}</strong></div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{record.user.userID}</div>
        </div>
      ),
    },
    {
      title: 'Thiết bị',
      key: 'projector',
      width: 250,
      render: (_, record) => (
        <div>
          <div><strong>{record.projector.name}</strong></div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {record.projector.room} - {record.projector.building}
          </div>
        </div>
      ),
    },
    {
      title: 'Thời gian sử dụng',
      key: 'time',
      width: 200,
      render: (_, record) => (
        <div>
          <div><strong>Từ:</strong> {dayjs(record.startTime).format('DD/MM/YYYY HH:mm')}</div>
          <div><strong>Đến:</strong> {dayjs(record.endTime).format('DD/MM/YYYY HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Mục đích',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  // Pending bookings columns with actions
  const pendingColumns: ColumnsType<Booking> = [
    ...baseColumns,
    {
      title: 'Thao tác',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleUpdateStatus(record.id, 'approved')}
          >
            Duyệt
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleUpdateStatus(record.id, 'rejected')}
          >
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

  // Tabs items
  const tabItems = [
    {
      key: 'pending',
      label: (
        <span>
          <ClockCircleOutlined />
          Chờ duyệt ({bookings.filter(b => b.status === 'pending').length})
        </span>
      ),
      children: (
        <Table
          columns={pendingColumns}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} lịch đặt`,
          }}
        />
      ),
    },
    {
      key: 'approved',
      label: (
        <span>
          <CheckCircleOutlined />
          Đã duyệt
        </span>
      ),
      children: (
        <Table
          columns={baseColumns}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} lịch đặt`,
          }}
        />
      ),
    },
    {
      key: 'rejected',
      label: (
        <span>
          <CloseCircleOutlined />
          Đã từ chối
        </span>
      ),
      children: (
        <Table
          columns={baseColumns}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} lịch đặt`,
          }}
        />
      ),
    },
    {
      key: 'completed',
      label: (
        <span>
          <HistoryOutlined />
          Hoàn thành
        </span>
      ),
      children: (
        <Table
          columns={baseColumns}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} lịch đặt`,
          }}
        />
      ),
    },
    {
      key: 'all',
      label: (
        <span>
          <ReloadOutlined />
          Tất cả
        </span>
      ),
      children: (
        <Table
          columns={[...baseColumns]}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} lịch đặt`,
          }}
        />
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý lịch đặt mượn</h1>
          <p className={styles.description}>Phê duyệt và quản lý các yêu cầu đặt mượn thiết bị</p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchBookings(activeTab)}
          loading={loading}
          size="large"
        >
          Làm mới
        </Button>
      </div>

      <Card className={styles.card}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
}
