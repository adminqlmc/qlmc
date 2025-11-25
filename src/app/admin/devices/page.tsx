"use client";

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Tag, Card, Tabs, Descriptions, Badge, App, DatePicker } from 'antd';
import { LaptopOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, InfoCircleOutlined, CheckCircleOutlined, HistoryOutlined, ToolOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import styles from './devices.module.css';

interface Projector {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  room: string;
  building: string;
  status: 'available' | 'maintenance' | 'broken';
  purchaseDate: string;
  warrantyExpiry: string;
  timeUsed: number;
  lastMaintenanceDate: string | null;
}

interface Booking {
  id: string;
  userId: string;
  user: {
    fullName: string;
    userID: string;
  };
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
}

export default function DevicesPage() {
  const { modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [projectors, setProjectors] = useState<Projector[]>([]);
  const [filteredProjectors, setFilteredProjectors] = useState<Projector[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingProjector, setEditingProjector] = useState<Projector | null>(null);
  const [selectedProjector, setSelectedProjector] = useState<Projector | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [maintenanceForm] = Form.useForm();

  // Fetch projectors
  const fetchProjectors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projectors/list');
      if (res.ok) {
        const data = await res.json();
        setProjectors(data.projectors);
        setFilteredProjectors(data.projectors);
      } else {
        modal.error({
          title: 'Lỗi tải dữ liệu',
          content: 'Không thể tải danh sách thiết bị',
          centered: true,
        });
      }
    } catch (error) {
      modal.error({
        title: 'Lỗi hệ thống',
        content: 'Có lỗi xảy ra khi tải dữ liệu',
        centered: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings for selected projector
  const fetchBookings = async (projectorId: string) => {
    try {
      const res = await fetch(`/api/projectors/${projectorId}/bookings`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  useEffect(() => {
    fetchProjectors();
  }, []);

  // Filter projectors based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredProjectors(projectors);
    } else {
      const search = searchText.toLowerCase();
      const filtered = projectors.filter(proj => 
        proj.name.toLowerCase().includes(search) ||
        proj.model.toLowerCase().includes(search) ||
        proj.serialNumber.toLowerCase().includes(search) ||
        proj.room.toLowerCase().includes(search) ||
        proj.building.toLowerCase().includes(search)
      );
      setFilteredProjectors(filtered);
    }
  }, [searchText, projectors]);

  // Open modal for create/edit
  const showModal = (projector?: Projector) => {
    if (projector) {
      setEditingProjector(projector);
      form.setFieldsValue({
        ...projector,
        purchaseDate: projector.purchaseDate ? dayjs(projector.purchaseDate) : null,
        warrantyExpiry: projector.warrantyExpiry ? dayjs(projector.warrantyExpiry) : null,
      });
    } else {
      setEditingProjector(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // Close modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingProjector(null);
    form.resetFields();
  };

  // Open detail modal
  const showDetailModal = async (projector: Projector) => {
    setSelectedProjector(projector);
    setIsDetailModalOpen(true);
    await fetchBookings(projector.id);
  };

  // Close detail modal
  const handleDetailCancel = () => {
    setIsDetailModalOpen(false);
    setSelectedProjector(null);
    setBookings([]);
    maintenanceForm.resetFields();
  };

  // Create or update projector
  const handleSubmit = async (values: any) => {
    try {
      const url = editingProjector ? `/api/projectors/${editingProjector.id}` : '/api/projectors/create';
      const method = editingProjector ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          purchaseDate: values.purchaseDate?.format('YYYY-MM-DD'),
          warrantyExpiry: values.warrantyExpiry?.format('YYYY-MM-DD'),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        handleCancel();
        fetchProjectors();
        
        modal.success({
          title: editingProjector ? 'Cập nhật thành công!' : 'Thêm mới thành công!',
          content: editingProjector 
            ? `Thiết bị ${data.projector?.name || ''} đã được cập nhật.`
            : `Thiết bị ${data.projector?.name || ''} đã được thêm vào hệ thống.`,
          centered: true,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        });
      } else {
        const data = await res.json();
        modal.error({
          title: 'Thao tác thất bại',
          content: data.message || 'Có lỗi xảy ra',
          centered: true,
        });
      }
    } catch (error) {
      modal.error({
        title: 'Lỗi hệ thống',
        content: 'Có lỗi xảy ra khi xử lý yêu cầu',
        centered: true,
      });
    }
  };

  // Delete projector
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/projectors/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProjectors();
        modal.success({
          title: 'Xóa thành công!',
          content: 'Thiết bị đã được xóa khỏi hệ thống.',
          centered: true,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        });
      } else {
        const data = await res.json();
        modal.error({
          title: 'Xóa thất bại',
          content: data.message || 'Có lỗi xảy ra',
          centered: true,
        });
      }
    } catch (error) {
      modal.error({
        title: 'Lỗi hệ thống',
        content: 'Có lỗi xảy ra khi xử lý yêu cầu',
        centered: true,
      });
    }
  };

  // Approve or reject booking
  const handleUpdateBookingStatus = async (bookingId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        if (selectedProjector) {
          fetchBookings(selectedProjector.id);
        }
        modal.success({
          title: status === 'approved' ? 'Đã phê duyệt!' : 'Đã từ chối!',
          content: status === 'approved' 
            ? 'Lịch đặt đã được phê duyệt thành công.' 
            : 'Lịch đặt đã bị từ chối.',
          centered: true,
        });
      } else {
        const data = await res.json();
        modal.error({
          title: 'Thao tác thất bại',
          content: data.message || 'Có lỗi xảy ra',
          centered: true,
        });
      }
    } catch (error) {
      modal.error({
        title: 'Lỗi hệ thống',
        content: 'Có lỗi xảy ra',
        centered: true,
      });
    }
  };

  // Delete booking
  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (selectedProjector) {
          fetchBookings(selectedProjector.id);
        }
        modal.success({
          title: 'Xóa thành công!',
          content: 'Lịch đặt đã được xóa.',
          centered: true,
        });
      } else {
        modal.error({
          title: 'Xóa thất bại',
          content: 'Có lỗi xảy ra',
          centered: true,
        });
      }
    } catch (error) {
      modal.error({
        title: 'Lỗi hệ thống',
        content: 'Có lỗi xảy ra',
        centered: true,
      });
    }
  };

  // Schedule maintenance
  const handleScheduleMaintenance = async (values: any) => {
    if (!selectedProjector) return;

    try {
      const res = await fetch(`/api/projectors/${selectedProjector.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceDate: values.maintenanceDate.format('YYYY-MM-DD'),
          notes: values.notes,
        }),
      });

      if (res.ok) {
        fetchProjectors();
        maintenanceForm.resetFields();
        modal.success({
          title: 'Đặt lịch bảo trì thành công!',
          content: 'Lịch bảo trì đã được ghi nhận.',
          centered: true,
        });
      } else {
        modal.error({
          title: 'Đặt lịch thất bại',
          content: 'Có lỗi xảy ra',
          centered: true,
        });
      }
    } catch (error) {
      modal.error({
        title: 'Lỗi hệ thống',
        content: 'Có lỗi xảy ra',
        centered: true,
      });
    }
  };

  // Status config
  const statusConfig: Record<string, { color: string; text: string }> = {
    available: { color: 'success', text: 'Sẵn sàng' },
    maintenance: { color: 'warning', text: 'Bảo trì' },
    broken: { color: 'error', text: 'Hỏng' },
  };

  // Table columns
  const columns: ColumnsType<Projector> = [
    {
      title: 'Tên thiết bị',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: 'Số seri',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 150,
    },
    {
      title: 'Vị trí',
      key: 'location',
      width: 180,
      render: (_, record) => `${record.room} - ${record.building}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: 'Sẵn sàng', value: 'available' },
        { text: 'Bảo trì', value: 'maintenance' },
        { text: 'Hỏng', value: 'broken' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<InfoCircleOutlined />}
            onClick={() => showDetailModal(record)}
          >
            Chi tiết
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa thiết bị"
            description="Bạn có chắc chắn muốn xóa thiết bị này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Booking columns for tabs
  const bookingColumns: ColumnsType<Booking> = [
    {
      title: 'Người đặt',
      key: 'user',
      render: (_, record) => (
        <div>
          <div><strong>{record.user.fullName}</strong></div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{record.user.userID}</div>
        </div>
      ),
    },
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
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'warning', text: 'Chờ duyệt' },
          approved: { color: 'success', text: 'Đã duyệt' },
          rejected: { color: 'error', text: 'Từ chối' },
          completed: { color: 'default', text: 'Hoàn thành' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  // Detail tabs
  const detailTabs = [
    {
      key: '1',
      label: <span><InfoCircleOutlined /> Chi tiết</span>,
      children: selectedProjector && (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Tên thiết bị" span={2}>
            <strong>{selectedProjector.name}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Model">{selectedProjector.model}</Descriptions.Item>
          <Descriptions.Item label="Số seri">{selectedProjector.serialNumber}</Descriptions.Item>
          <Descriptions.Item label="Phòng">{selectedProjector.room}</Descriptions.Item>
          <Descriptions.Item label="Tòa nhà">{selectedProjector.building}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={2}>
            <Badge 
              status={statusConfig[selectedProjector.status]?.color as any} 
              text={statusConfig[selectedProjector.status]?.text}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Ngày mua">
            {dayjs(selectedProjector.purchaseDate).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Hết bảo hành">
            {dayjs(selectedProjector.warrantyExpiry).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian sử dụng" span={2}>
            {selectedProjector.timeUsed} giờ
          </Descriptions.Item>
          {selectedProjector.lastMaintenanceDate && (
            <Descriptions.Item label="Bảo trì lần cuối" span={2}>
              {dayjs(selectedProjector.lastMaintenanceDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
          )}
        </Descriptions>
      ),
    },
    {
      key: '2',
      label: <span><CheckCircleOutlined /> Chờ duyệt</span>,
      children: (
        <Table
          columns={[
            ...bookingColumns,
            {
              title: 'Thao tác',
              key: 'action',
              width: 200,
              render: (_, record) => (
                <Space>
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => handleUpdateBookingStatus(record.id, 'approved')}
                  >
                    Duyệt
                  </Button>
                  <Button 
                    danger 
                    size="small"
                    onClick={() => handleUpdateBookingStatus(record.id, 'rejected')}
                  >
                    Từ chối
                  </Button>
                  <Popconfirm
                    title="Xóa lịch đặt"
                    description="Bạn có chắc chắn muốn xóa?"
                    onConfirm={() => handleDeleteBooking(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button type="link" danger size="small">Xóa</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          dataSource={bookings.filter(b => b.status === 'pending')}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ),
    },
    {
      key: '3',
      label: <span><ClockCircleOutlined /> Đã duyệt</span>,
      children: (
        <Table
          columns={bookingColumns}
          dataSource={bookings.filter(b => b.status === 'approved')}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      ),
    },
    {
      key: '4',
      label: <span><HistoryOutlined /> Lịch sử</span>,
      children: (
        <Table
          columns={bookingColumns}
          dataSource={bookings.filter(b => ['completed', 'rejected'].includes(b.status))}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      ),
    },
    {
      key: '5',
      label: <span><ToolOutlined /> Bảo trì</span>,
      children: (
        <div className={styles.maintenanceTab}>
          <Form
            form={maintenanceForm}
            layout="vertical"
            onFinish={handleScheduleMaintenance}
          >
            <Form.Item
              label="Ngày bảo trì"
              name="maintenanceDate"
              rules={[{ required: true, message: 'Vui lòng chọn ngày bảo trì!' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày bảo trì"
              />
            </Form.Item>
            <Form.Item
              label="Ghi chú"
              name="notes"
            >
              <Input.TextArea 
                rows={4}
                placeholder="Nhập ghi chú về nội dung bảo trì..."
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<ToolOutlined />}>
                Đặt lịch bảo trì
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý thiết bị</h1>
          <p className={styles.description}>Quản lý máy chiếu và thiết bị trong hệ thống</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => showModal()}
          className={styles.addButton}
        >
          Thêm thiết bị
        </Button>
      </div>

      <Card className={styles.card}>
        <div className={styles.toolbar}>
          <Input
            placeholder="Tìm kiếm theo tên, model, số seri, vị trí..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={styles.searchInput}
            allowClear
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchProjectors}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredProjectors}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} thiết bị`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingProjector ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Tên thiết bị"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị!' }]}
          >
            <Input placeholder="Nhập tên thiết bị" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="Model"
              name="model"
              rules={[{ required: true, message: 'Vui lòng nhập model!' }]}
            >
              <Input placeholder="Nhập model" />
            </Form.Item>

            <Form.Item
              label="Số seri"
              name="serialNumber"
              rules={[{ required: true, message: 'Vui lòng nhập số seri!' }]}
            >
              <Input placeholder="Nhập số seri" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="Phòng"
              name="room"
              rules={[{ required: true, message: 'Vui lòng nhập phòng!' }]}
            >
              <Input placeholder="Nhập phòng (VD: A101)" />
            </Form.Item>

            <Form.Item
              label="Tòa nhà"
              name="building"
              rules={[{ required: true, message: 'Vui lòng nhập tòa nhà!' }]}
            >
              <Input placeholder="Nhập tòa nhà (VD: Nhà A)" />
            </Form.Item>
          </div>

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="available">Sẵn sàng</Select.Option>
              <Select.Option value="maintenance">Bảo trì</Select.Option>
              <Select.Option value="broken">Hỏng</Select.Option>
            </Select>
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="Ngày mua"
              name="purchaseDate"
              rules={[{ required: true, message: 'Vui lòng chọn ngày mua!' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày mua"
              />
            </Form.Item>

            <Form.Item
              label="Hết bảo hành"
              name="warrantyExpiry"
              rules={[{ required: true, message: 'Vui lòng chọn ngày hết bảo hành!' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày hết bảo hành"
              />
            </Form.Item>
          </div>

          <Form.Item className={styles.formButtons}>
            <Space>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingProjector ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal with Tabs */}
      <Modal
        title={`Chi tiết: ${selectedProjector?.name || ''}`}
        open={isDetailModalOpen}
        onCancel={handleDetailCancel}
        footer={null}
        width={900}
      >
        <Tabs items={detailTabs} />
      </Modal>
    </div>
  );
}
