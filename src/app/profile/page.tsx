"use client";

import { useState, useEffect, Suspense } from 'react';
import { Card, Form, Input, Button, Avatar, Upload, Spin, Tabs, App, Space, Alert } from 'antd';
import { UserOutlined, MailOutlined, IdcardOutlined, LockOutlined, UploadOutlined, SaveOutlined, GoogleOutlined, LinkOutlined, DisconnectOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import styles from './profile.module.css';
import { useSearchParams } from 'next/navigation';

function ProfileContent() {
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [googleLinking, setGoogleLinking] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Load user info
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const googleEmail = searchParams?.get('google_email');
    const googleId = searchParams?.get('google_id');
    if (googleEmail && googleId) {
      handleLinkGoogle(googleEmail, googleId);
    }
  }, [searchParams]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/auth/check');
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data.user);
        setAvatarUrl(data.user.avatar || '');
        form.setFieldsValue({
          userID: data.user.userID,
          fullName: data.user.fullName,
        });
      }
    } catch (error) {
      message.error('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Initiate Google OAuth
  const handleStartGoogleLink = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      message.error('Chưa cấu hình Google OAuth');
      return;
    }
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const scope = 'email profile';
    const state = userInfo?.id || 'unknown';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
    window.location.href = authUrl;
  };

  // Link Google account
  const handleLinkGoogle = async (googleEmail: string, googleId: string) => {
    setGoogleLinking(true);
    try {
      const res = await fetch('/api/user/link-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleEmail, googleId }),
      });
      if (res.ok) {
        message.success('Liên kết Google thành công!');
        await fetchUserProfile();
        window.history.replaceState({}, '', '/profile');
      } else {
        const data = await res.json();
        message.error(data.message || 'Liên kết thất bại');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setGoogleLinking(false);
    }
  };

  // Unlink Google
  const handleUnlinkGoogle = async () => {
    try {
      const res = await fetch('/api/user/link-google', { method: 'DELETE' });
      if (res.ok) {
        message.success('Hủy liên kết thành công!');
        await fetchUserProfile();
      } else {
        const data = await res.json();
        message.error(data.message);
      }
    } catch (error) {
      message.error('Có lỗi xảy ra');
    }
  };

  // Update profile info
  const handleUpdateProfile = async (values: any) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: values.fullName,
          avatar: avatarUrl,
        }),
      });

      if (res.ok) {
        message.success('Cập nhật thông tin thành công!');
        fetchUserProfile();
      } else {
        const data = await res.json();
        message.error(data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setUpdating(false);
    }
  };

  // Change password
  const handleChangePassword = async (values: any) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (res.ok) {
        message.success('Đổi mật khẩu thành công!');
        passwordForm.resetFields();
      } else {
        const data = await res.json();
        message.error(data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setUpdating(false);
    }
  };

  // Upload avatar
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/upload/avatar',
    onChange(info) {
      if (info.file.status === 'done') {
        message.success('Tải ảnh lên thành công');
        setAvatarUrl(info.file.response.url);
      } else if (info.file.status === 'error') {
        message.error('Tải ảnh lên thất bại');
      }
    },
  };

  if (loading || !userInfo) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Hồ sơ của tôi</h1>
      <p className={styles.pageDesc}>Quản lý thông tin cá nhân và cài đặt bảo mật</p>

      <div className={styles.profileLayout}>
        {/* Left Side - Avatar Card */}
        <Card className={styles.avatarCard}>
          <div className={styles.avatarSection}>
            <Avatar 
              size={120} 
              src={avatarUrl || undefined} 
              icon={<UserOutlined />}
              className={styles.avatar}
            />
            <h2 className={styles.userName}>{userInfo?.fullName}</h2>
            <p className={styles.userRole}>
              {userInfo?.role === 'admin' ? 'Quản trị viên' : 
               userInfo?.role === 'teacher' ? 'Giáo viên' : 'Kỹ thuật viên'}
            </p>
            <Upload {...uploadProps} showUploadList={false}>
              <Button icon={<UploadOutlined />} className={styles.uploadButton}>
                Thay đổi ảnh đại diện
              </Button>
            </Upload>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <IdcardOutlined className={styles.infoIcon} />
              <div>
                <div className={styles.infoLabel}>Mã người dùng</div>
                <div className={styles.infoValue}>{userInfo?.userID}</div>
              </div>
            </div>
            <div className={styles.infoItem}>
              <MailOutlined className={styles.infoIcon} />
              <div>
                <div className={styles.infoLabel}>Email</div>
                <div className={styles.infoValue}>
                  {userInfo?.googleEmail || userInfo?.email || 'Chưa liên kết'}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Side - Edit Forms */}
        <Card className={styles.formCard}>
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: 'Thông tin cá nhân',
                forceRender: true,
                children: (
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    className={styles.form}
                  >
                    <Form.Item
                      label="Mã người dùng"
                      name="userID"
                    >
                      <Input 
                        disabled 
                        prefix={<IdcardOutlined />}
                        className={styles.input}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Họ và tên"
                      name="fullName"
                      rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                    >
                      <Input 
                        prefix={<UserOutlined />}
                        placeholder="Nhập họ và tên"
                        className={styles.input}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Email"
                      help={userInfo?.googleEmail ? "Email từ Google đã liên kết" : "Chưa liên kết email"}
                    >
                      <Input 
                        value={userInfo?.googleEmail || userInfo?.email || "Chưa có email"}
                        disabled
                        prefix={<MailOutlined />}
                        className={styles.input}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={updating}
                        icon={<SaveOutlined />}
                        className={styles.submitButton}
                        block
                      >
                        Lưu thay đổi
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: '2',
                label: 'Đổi mật khẩu',
                forceRender: true,
                children: (
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    className={styles.form}
                  >
                    <Form.Item
                      label="Mật khẩu hiện tại"
                      name="currentPassword"
                      rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined />}
                        placeholder="Nhập mật khẩu hiện tại"
                        className={styles.input}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Mật khẩu mới"
                      name="newPassword"
                      rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
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
                              : Promise.reject(
                                  new Error('Mật khẩu ≥8 ký tự, gồm chữ hoa, thường, số, ký tự đặc biệt')
                                );
                          },
                        },
                      ]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined />}
                        placeholder="Nhập mật khẩu mới"
                        className={styles.input}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Xác nhận mật khẩu mới"
                      name="confirmPassword"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined />}
                        placeholder="Xác nhận mật khẩu mới"
                        className={styles.input}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={updating}
                        icon={<SaveOutlined />}
                        className={styles.submitButton}
                        block
                      >
                        Đổi mật khẩu
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: '3',
                label: 'Liên kết Google',
                forceRender: true,
                children: (
                  <div className={styles.form}>
                    <Alert
                      message="Liên kết tài khoản Google"
                      description="Liên kết với tài khoản Google để sử dụng email Google khi quên mật khẩu."
                      type="info"
                      showIcon
                      style={{ marginBottom: 24 }}
                    />
                    {userInfo?.googleEmail ? (
                      <div>
                        <div style={{ marginBottom: 16 }}>
                          <strong>Email Google đã liên kết:</strong>
                          <div style={{ fontSize: 16, color: '#1890ff', marginTop: 8 }}>
                            <MailOutlined /> {userInfo.googleEmail}
                          </div>
                        </div>
                        <Button 
                          danger 
                          icon={<DisconnectOutlined />}
                          onClick={handleUnlinkGoogle}
                        >
                          Hủy liên kết
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ marginBottom: 16 }}>
                          Bạn chưa liên kết tài khoản Google. Liên kết ngay để dễ dàng khôi phục mật khẩu.
                        </p>
                        <Button 
                          type="primary"
                          icon={<GoogleOutlined />}
                          onClick={handleStartGoogleLink}
                          loading={googleLinking}
                        >
                          Liên kết với Google
                        </Button>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
