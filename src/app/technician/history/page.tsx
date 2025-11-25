'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, DatePicker, Select, Spin, App, Statistic, Row, Col } from 'antd';
import { CheckCircleOutlined, ToolOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import styles from './history.module.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface SupportRequest {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  response: string | null;
  createdAt: string;
  respondedAt: string | null;
  updatedAt: string;
  user: {
    userID: string;
    fullName: string;
  };
  projector: {
    name: string;
    room: string;
    building: string;
  } | null;
}

export default function TechnicianHistoryPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SupportRequest[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<SupportRequest[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    repair: 0,
    maintenance: 0,
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, categoryFilter, dateRange]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/technician/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
        setStatistics({
          total: data.history.length,
          repair: data.history.filter((h: SupportRequest) => h.category === 'repair').length,
          maintenance: data.history.filter((h: SupportRequest) => h.category === 'maintenance').length,
        });
      } else {
        message.error('Không thể tải lịch sử công việc');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    // Date range filter
    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter((item) => {
        const date = dayjs(item.updatedAt);
        return date.isAfter(start.startOf('day')) && date.isBefore(end.endOf('day'));
      });
    }

    setFilteredHistory(filtered);
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

  const columns: ColumnsType<SupportRequest> = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Loại công việc',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={category === 'repair' ? 'red' : 'blue'}>
          {category === 'repair' ? 'Sửa chữa' : 'Bảo trì'}
        </Tag>
      ),
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
      title: 'Ngày nhận',
      dataIndex: 'respondedAt',
      key: 'respondedAt',
      render: (date: string | null) =>
        date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'Ngày hoàn thành',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'response',
      key: 'response',
      render: (text: string | null) => text || <span style={{ color: '#999' }}>Không có</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Lịch sử công việc</h1>
        <p>Xem lịch sử các công việc đã hoàn thành</p>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <Statistic
              title="Tổng công việc"
              value={statistics.total}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <Statistic
              title="Sửa chữa"
              value={statistics.repair}
              prefix={<ToolOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <Statistic
              title="Bảo trì"
              value={statistics.maintenance}
              prefix={<ToolOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className={styles.card}>
        <div className={styles.filters}>
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 200 }}
          >
            <Option value="all">Tất cả loại</Option>
            <Option value="repair">Sửa chữa</Option>
            <Option value="maintenance">Bảo trì</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
          />
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredHistory}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} công việc`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
