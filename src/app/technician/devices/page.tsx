'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Input, Select, Button, Modal, Form, Spin, App } from 'antd';
import { SearchOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import styles from './devices.module.css';

const { Option } = Select;

interface Projector {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  room: string;
  building: string;
  status: string;
  purchaseDate: string;
  warrantyExpiry: string;
  timeUsed: number;
  lastMaintenanceDate: string | null;
}

export default function TechnicianDevicesPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<Projector[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Projector[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<Projector | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    filterDevices();
  }, [devices, searchText, statusFilter]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/technician/devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices);
      } else {
        message.error('Không thể tải danh sách thiết bị');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filterDevices = () => {
    let filtered = [...devices];

    // Search filter
    if (searchText) {
      filtered = filtered.filter((device) =>
        device.name.toLowerCase().includes(searchText.toLowerCase()) ||
        device.model.toLowerCase().includes(searchText.toLowerCase()) ||
        device.room.toLowerCase().includes(searchText.toLowerCase()) ||
        device.building.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((device) => device.status === statusFilter);
    }

    setFilteredDevices(filtered);
  };

  const handleUpdateStatus = async (values: any) => {
    if (!selectedDevice) return;

    try {
      const res = await fetch(`/api/technician/devices/${selectedDevice.id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: values.status,
          lastMaintenanceDate: values.status === 'available' ? new Date().toISOString() : undefined,
        }),
      });

      if (res.ok) {
        message.success('Cập nhật trạng thái thiết bị thành công');
        setUpdateModalVisible(false);
        form.resetFields();
        fetchDevices();
      } else {
        const data = await res.json();
        message.error(data.error || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'maintenance': return 'warning';
      case 'broken': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Sẵn sàng';
      case 'maintenance': return 'Bảo trì';
      case 'broken': return 'Hỏng';
      default: return status;
    }
  };

  const columns: ColumnsType<Projector> = [
    {
      title: 'Tên thiết bị',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Số Serial',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
    },
    {
      title: 'Vị trí',
      key: 'location',
      render: (_: any, record: Projector) => (
        <div>
          <div>{record.room}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.building}</div>
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
    {
      title: 'Thời gian sử dụng',
      dataIndex: 'timeUsed',
      key: 'timeUsed',
      render: (hours: number) => `${hours} giờ`,
    },
    {
      title: 'Bảo trì lần cuối',
      dataIndex: 'lastMaintenanceDate',
      key: 'lastMaintenanceDate',
      render: (date: string | null) =>
        date ? dayjs(date).format('DD/MM/YYYY') : <span style={{ color: '#999' }}>Chưa có</span>,
    },
    {
      title: 'Bảo hành',
      dataIndex: 'warrantyExpiry',
      key: 'warrantyExpiry',
      render: (date: string) => {
        const isExpired = dayjs(date).isBefore(dayjs());
        return (
          <span style={{ color: isExpired ? '#ff4d4f' : '#52c41a' }}>
            {dayjs(date).format('DD/MM/YYYY')}
            {isExpired && ' (Hết hạn)'}
          </span>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Projector) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setSelectedDevice(record);
            form.setFieldsValue({ status: record.status });
            setUpdateModalVisible(true);
          }}
        >
          Cập nhật
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý thiết bị</h1>
        <p>Xem và cập nhật trạng thái thiết bị</p>
      </div>

      <Card className={styles.card}>
        <div className={styles.filters}>
          <Input
            placeholder="Tìm kiếm thiết bị..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="available">Sẵn sàng</Option>
            <Option value="maintenance">Bảo trì</Option>
            <Option value="broken">Hỏng</Option>
          </Select>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredDevices}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} thiết bị`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="Cập nhật trạng thái thiết bị"
        open={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        {selectedDevice && (
          <div className={styles.deviceInfo}>
            <p><strong>Thiết bị:</strong> {selectedDevice.name}</p>
            <p><strong>Vị trí:</strong> {selectedDevice.room} - {selectedDevice.building}</p>
            <p><strong>Trạng thái hiện tại:</strong> <Tag color={getStatusColor(selectedDevice.status)}>{getStatusText(selectedDevice.status)}</Tag></p>
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item
            name="status"
            label="Trạng thái mới"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Option value="available">Sẵn sàng</Option>
              <Option value="maintenance">Bảo trì</Option>
              <Option value="broken">Hỏng</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
