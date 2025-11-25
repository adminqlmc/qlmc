"use client";

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, DatePicker, Input, Space, Tag, Card, Tabs, App, TimePicker } from 'antd';
import { PlusOutlined, HistoryOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

interface Projector {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  room: string;
  building: string;
  status: string;
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  createdAt: string;
}

export default function TeacherBookingPage() {
  const { modal, message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [projectors, setProjectors] = useState<Projector[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedProjector, setSelectedProjector] = useState<Projector | null>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjectors();
  }, []);

  const fetchProjectors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/projectors');
      if (res.ok) {
        const data = await res.json();
        setProjectors(data.projectors);
      }
    } catch (error) {
      message.error('Không thể tải danh sách thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async (projectorId: string) => {
    try {
      const res = await fetch(`/api/teacher/bookings/${projectorId}`);
      if (res.ok) {
        const data = await res.json();
        setMyBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const showBookingModal = (projector: Projector) => {
    setSelectedProjector(projector);
    setIsBookingModalOpen(true);
    form.resetFields();
  };

  const showHistoryModal = async (projector: Projector) => {
    setSelectedProjector(projector);
    await fetchMyBookings(projector.id);
    setIsHistoryModalOpen(true);
  };

  const handleBooking = async (values: any) => {
    if (!selectedProjector) return;

    const startTime = values.date.hour(values.startTime.hour()).minute(values.startTime.minute());
    const endTime = values.date.hour(values.endTime.hour()).minute(values.endTime.minute());

    // Validate time range 6h-22h
    const startHour = startTime.hour();
    const endHour = endTime.hour();

    if (startHour < 6 || startHour >= 22 || endHour < 6 || endHour > 22) {
      message.error('Thời gian mượn phải trong khoảng 6h - 22h!');
      return;
    }

    if (startTime.isAfter(endTime) || startTime.isSame(endTime)) {
      message.error('Thời gian kết thúc phải sau thời gian bắt đầu!');
      return;
    }

    try {
      const res = await fetch('/api/teacher/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectorId: selectedProjector.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          purpose: values.purpose,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        modal.success({
          title: 'Đặt lịch thành công!',
          content: 'Yêu cầu của bạn đã được gửi và đang chờ duyệt.',
          centered: true,
        });
        setIsBookingModalOpen(false);
        form.resetFields();
        fetchProjectors();
      } else {
        message.error(data.message || 'Đặt lịch thất bại');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi đặt lịch');
    }
  };

  const statusConfig: Record<string, { color: string; text: string }> = {
    available: { color: 'success', text: 'Sẵn sàng' },
    maintenance: { color: 'warning', text: 'Bảo trì' },
    broken: { color: 'error', text: 'Hỏng' },
  };

  const bookingStatusConfig: Record<string, { color: string; text: string }> = {
    pending: { color: 'warning', text: 'Chờ duyệt' },
    approved: { color: 'success', text: 'Đã duyệt' },
    rejected: { color: 'error', text: 'Từ chối' },
    completed: { color: 'default', text: 'Hoàn thành' },
  };

  const columns: ColumnsType<Projector> = [
    {
      title: 'Tên thiết bị',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Vị trí',
      key: 'location',
      render: (_, record) => `${record.room} - ${record.building}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showBookingModal(record)}
            disabled={record.status !== 'available'}
          >
            Đặt lịch
          </Button>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => showHistoryModal(record)}
          >
            Lịch sử
          </Button>
        </Space>
      ),
    },
  ];

  const bookingColumns: ColumnsType<Booking> = [
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => (
        <div>
          <div>Từ: {dayjs(record.startTime).format('DD/MM/YYYY HH:mm')}</div>
          <div>Đến: {dayjs(record.endTime).format('DD/MM/YYYY HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Mục đích',
      dataIndex: 'purpose',
      key: 'purpose',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = bookingStatusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const historyTabs = [
    {
      key: 'pending',
      label: 'Chờ duyệt',
      children: (
        <Table
          columns={bookingColumns}
          dataSource={myBookings.filter(b => b.status === 'pending')}
          rowKey="id"
          pagination={false}
        />
      ),
    },
    {
      key: 'history',
      label: 'Lịch sử',
      children: (
        <Table
          columns={bookingColumns}
          dataSource={myBookings.filter(b => ['approved', 'completed'].includes(b.status))}
          rowKey="id"
          pagination={false}
        />
      ),
    },
  ];

  const disabledDate = (current: Dayjs) => {
    return current && current.isBefore(dayjs().startOf('day'));
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 24 }}>Đặt mượn thiết bị</h1>

      <Card>
        <Table
          columns={columns}
          dataSource={projectors}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Booking Modal */}
      <Modal
        title={`Đặt lịch mượn: ${selectedProjector?.name || ''}`}
        open={isBookingModalOpen}
        onCancel={() => setIsBookingModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBooking}
        >
          <Form.Item
            label="Ngày mượn"
            name="date"
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              disabledDate={disabledDate}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              label="Giờ bắt đầu (6h-22h)"
              name="startTime"
              rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu!' }]}
            >
              <TimePicker
                style={{ width: '100%' }}
                format="HH:mm"
                minuteStep={30}
                showNow={false}
              />
            </Form.Item>

            <Form.Item
              label="Giờ kết thúc (6h-22h)"
              name="endTime"
              rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc!' }]}
            >
              <TimePicker
                style={{ width: '100%' }}
                format="HH:mm"
                minuteStep={30}
                showNow={false}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Mục đích sử dụng"
            name="purpose"
            rules={[{ required: true, message: 'Vui lòng nhập mục đích!' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập mục đích sử dụng thiết bị..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setIsBookingModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                Đặt lịch
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* History Modal */}
      <Modal
        title={`Lịch sử đặt mượn: ${selectedProjector?.name || ''}`}
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        footer={null}
        width={800}
      >
        <Tabs items={historyTabs} />
      </Modal>
    </div>
  );
}
