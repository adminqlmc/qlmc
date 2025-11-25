"use client";
import { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(values: any) {
    setLoading(true);
    setError(null);
    
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    
    setLoading(false);
    
    if (res.ok) {
      const data = await res.json();
      const userRole = data.user?.role;
      
      // Redirect based on user role
      if (userRole === 'admin') {
        window.location.href = '/admin';
      } else if (userRole === 'teacher') {
        window.location.href = '/teacher';
      } else if (userRole === 'technician') {
        window.location.href = '/technician';
      } else {
        window.location.href = '/admin'; // default fallback
      }
    } else {
      const data = await res.json();
      setError(data.message || 'Đăng nhập thất bại');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.modalCard}>
        {/* Left Side - Login Form */}
        <div className={styles.formSection}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>ĐĂNG NHẬP</h3>
            <p className={styles.formSubtitle}>Nhập thông tin đăng nhập của bạn để tiếp tục</p>
          </div>
          
          {error && (
            <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 24 }} />
          )}
          
          <Form onFinish={onSubmit} layout="vertical" size="large">
            <Form.Item
              name="userID"
              rules={[{ required: true, message: 'Vui lòng nhập mã người dùng!' }]}
            >
              <Input 
                prefix={<UserOutlined className={styles.inputIcon} />} 
                placeholder="Mã người dùng (UserID)"
                className={styles.input}
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password 
                prefix={<LockOutlined className={styles.inputIcon} />} 
                placeholder="Mật khẩu"
                className={styles.input}
              />
            </Form.Item>
            
            <div className={styles.forgotLink}>
              <Link href="/forgot-password">Quên mật khẩu?</Link>
            </div>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className={styles.submitButton}
                block
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
          
          <div className={styles.footer}>
            <p>© 2025 QLMC System</p>
          </div>
        </div>
        
        {/* Right Side - Image */}
        <div className={styles.imageSection}>
          <div className={styles.imageOverlay}>
          </div>
        </div>
      </div>
    </div>
  );
}
