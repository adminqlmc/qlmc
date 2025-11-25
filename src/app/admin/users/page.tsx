"use client";

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Tag, Avatar, Card, App } from 'antd';
import { UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, MailOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import styles from './users.module.css';

interface User {
  id: string;
  userID: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
}

export default function UsersPage() {
  const { modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/list');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else {
        modal.error({
          title: 'Lỗi tải dữ liệu',
          content: 'Không thể tải danh sách người dùng',
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

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredUsers(users);
    } else {
      const search = searchText.toLowerCase();
      const filtered = users.filter(user => 
        user.userID.toLowerCase().includes(search) ||
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
      setFilteredUsers(filtered);
    }
  }, [searchText, users]);

  // Open modal for create/edit
  const showModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({
        userID: user.userID,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // Close modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  // Create or update user
  const handleSubmit = async (values: any) => {
    try {
      const url = editingUser ? `/api/user/${editingUser.id}` : '/api/user/create';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        const data = await res.json();
        handleCancel();
        fetchUsers();
        
        // Show success modal
        modal.success({
          title: editingUser ? 'Cập nhật thành công!' : 'Thêm mới thành công!',
          content: editingUser 
            ? `Thông tin người dùng ${data.user?.fullName || ''} đã được cập nhật.`
            : `Người dùng ${data.user?.fullName || ''} đã được thêm vào hệ thống với mã ${data.user?.userID || ''}.`,
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

  // Delete user
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/user/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchUsers();
        modal.success({
          title: 'Xóa thành công!',
          content: 'Người dùng đã được xóa khỏi hệ thống.',
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

  // Toggle user status
  const handleToggleStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/user/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          isActive: !user.isActive,
        }),
      });

      if (res.ok) {
        fetchUsers();
        modal.success({
          title: 'Cập nhật trạng thái thành công!',
          content: `Đã ${user.isActive ? 'vô hiệu hóa' : 'kích hoạt'} người dùng ${user.fullName}.`,
          centered: true,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        });
      } else {
        modal.error({
          title: 'Cập nhật thất bại',
          content: 'Có lỗi xảy ra khi cập nhật trạng thái',
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

  // Table columns
  const columns: ColumnsType<User> = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string) => (
        <Avatar size={40} src={avatar || undefined} icon={<UserOutlined />} />
      ),
    },
    {
      title: 'Mã người dùng',
      dataIndex: 'userID',
      key: 'userID',
      width: 150,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 250,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: string) => {
        const roleConfig: Record<string, { color: string; text: string }> = {
          admin: { color: 'red', text: 'Quản trị viên' },
          teacher: { color: 'blue', text: 'Giáo viên' },
          technician: { color: 'green', text: 'Kỹ thuật viên' },
        };
        const config = roleConfig[role] || { color: 'default', text: role };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: 'Quản trị viên', value: 'admin' },
        { text: 'Giáo viên', value: 'teacher' },
        { text: 'Kỹ thuật viên', value: 'technician' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean, record: User) => (
        <Tag 
          color={isActive ? 'success' : 'default'}
          style={{ cursor: 'pointer' }}
          onClick={() => handleToggleStatus(record)}
        >
          {isActive ? 'Hoạt động' : 'Vô hiệu'}
        </Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Vô hiệu', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa người dùng"
            description="Bạn có chắc chắn muốn xóa người dùng này?"
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý người dùng</h1>
          <p className={styles.description}>Quản lý tài khoản và phân quyền người dùng trong hệ thống</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => showModal()}
          className={styles.addButton}
        >
          Thêm người dùng
        </Button>
      </div>

      <Card className={styles.card}>
        <div className={styles.toolbar}>
          <Input
            placeholder="Tìm kiếm theo mã, tên hoặc email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={styles.searchInput}
            allowClear
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchUsers}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} người dùng`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          {editingUser && (
            <Form.Item
              label="Mã người dùng"
              name="userID"
            >
              <Input 
                prefix={<UserOutlined />} 
                disabled
                style={{ color: '#64748b', fontWeight: 600 }}
              />
            </Form.Item>
          )}

          {!editingUser && (
            <div style={{ 
              padding: '12px 16px', 
              background: '#e6f0ff', 
              borderRadius: '8px', 
              marginBottom: '24px',
              border: '1px solid #1677ff'
            }}>
              <div style={{ fontSize: '13px', color: '#1677ff', fontWeight: 600, marginBottom: '4px' }}>
                ℹ️ Mã người dùng tự động
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                Mã người dùng sẽ được tự động tạo theo định dạng <strong>QNUxxxxxxx</strong> (7 chữ số ngẫu nhiên)
              </div>
            </div>
          )}

          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select placeholder="Chọn vai trò">
              <Select.Option value="admin">Quản trị viên</Select.Option>
              <Select.Option value="teacher">Giáo viên</Select.Option>
              <Select.Option value="technician">Kỹ thuật viên</Select.Option>
            </Select>
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const lengthOk = value.length >= 8;
                    const upperOk = /[A-Z]/.test(value);
                    const lowerOk = /[a-z]/.test(value);
                    const numberOk = /[0-9]/.test(value);
                    const specialOk = /[^A-Za-z0-9]/.test(value);
                    return lengthOk && upperOk && lowerOk && numberOk && specialOk
                      ? Promise.resolve()
                      : Promise.reject(new Error('Mật khẩu ≥8 ký tự, gồm chữ hoa, thường, số, ký tự đặc biệt'));
                  },
                },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}

          <Form.Item
            label="Trạng thái"
            name="isActive"
            initialValue={true}
          >
            <Select>
              <Select.Option value={true}>Hoạt động</Select.Option>
              <Select.Option value={false}>Vô hiệu hóa</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item className={styles.formButtons}>
            <Space>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
