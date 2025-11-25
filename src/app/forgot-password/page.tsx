"use client";
import { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Steps, App } from 'antd';
import { MailOutlined, ArrowLeftOutlined, SafetyOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../login/login.module.css'; // Use same styles as login

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { message: antMessage, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [emailForm] = Form.useForm();
  const [codeForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Countdown timer for code expiration
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Step 1: Send verification code
  const handleSendCode = async (values: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await res.json();

      if (res.ok) {
        setEmail(values.email);
        setCurrentStep(1);
        setCountdown(60); // Start 60 second countdown
        
        // Show code in development mode
        if (data.code) {
          modal.info({
            title: 'Development Mode',
            content: `Mã xác thực của bạn là: ${data.code}`,
            centered: true,
          });
        } else {
          antMessage.success('Mã xác thực đã được gửi đến email của bạn!');
        }
      } else {
        setError(data.message || 'Không thể gửi mã xác thực');
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (values: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/forgot-password/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: values.code,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerificationCode(values.code);
        setCurrentStep(2);
        antMessage.success('Mã xác thực hợp lệ!');
      } else {
        setError(data.message || 'Mã xác thực không đúng');
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (values: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: verificationCode,
          newPassword: values.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        modal.success({
          title: 'Đặt lại mật khẩu thành công!',
          content: 'Bạn có thể đăng nhập bằng mật khẩu mới.',
          centered: true,
          onOk: () => router.push('/login'),
        });
      } else {
        setError(data.message || 'Đặt lại mật khẩu thất bại');
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = () => {
    emailForm.submit();
  };

  return (
    <div className={styles.container}>
      <div className={styles.modalCard}>
        {/* Left Side - Form */}
        <div className={styles.formSection}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>ĐẶT LẠI MẬT KHẨU</h3>
            <p className={styles.formSubtitle}>
              {currentStep === 0 && 'Nhập email để nhận mã xác thực'}
              {currentStep === 1 && 'Nhập mã xác thực đã gửi đến email'}
              {currentStep === 2 && 'Nhập mật khẩu mới của bạn'}
            </p>
          </div>

          {/* Progress Steps */}
          <div style={{ marginBottom: 24 }}>
            <Steps current={currentStep} size="small">
              <Steps.Step title="Email" icon={<MailOutlined />} />
              <Steps.Step title="Xác thực" icon={<SafetyOutlined />} />
              <Steps.Step title="Mật khẩu mới" icon={<LockOutlined />} />
            </Steps>
          </div>
          
          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              closable 
              onClose={() => setError(null)} 
              style={{ marginBottom: 24 }} 
            />
          )}

          {/* Step 0: Enter Email */}
          {currentStep === 0 && (
            <Form form={emailForm} onFinish={handleSendCode} layout="vertical" size="large">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined className={styles.inputIcon} />} 
                  placeholder="Địa chỉ email"
                  className={styles.input}
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  className={styles.submitButton}
                  block
                >
                  Gửi mã xác thực
                </Button>
              </Form.Item>
            </Form>
          )}

          {/* Step 1: Enter Verification Code */}
          {currentStep === 1 && (
            <Form form={codeForm} onFinish={handleVerifyCode} layout="vertical" size="large">
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <p style={{ marginBottom: 8 }}>Mã xác thực đã được gửi đến:</p>
                <strong style={{ color: '#1890ff' }}>{email}</strong>
              </div>

              <Form.Item
                name="code"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã xác thực!' },
                  { len: 6, message: 'Mã xác thực phải có 6 chữ số!' }
                ]}
              >
                <Input 
                  prefix={<SafetyOutlined className={styles.inputIcon} />} 
                  placeholder="Nhập mã 6 chữ số"
                  className={styles.input}
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: 20, letterSpacing: 5 }}
                />
              </Form.Item>

              {countdown > 0 && (
                <div style={{ textAlign: 'center', marginBottom: 16, color: '#ff4d4f' }}>
                  Mã sẽ hết hạn sau {countdown} giây
                </div>
              )}
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  className={styles.submitButton}
                  block
                >
                  Xác thực
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Button 
                  type="link" 
                  onClick={handleResendCode}
                  disabled={countdown > 0 || loading}
                >
                  Gửi lại mã
                </Button>
                <span style={{ margin: '0 8px' }}>|</span>
                <Button 
                  type="link" 
                  onClick={() => {
                    setCurrentStep(0);
                    setCountdown(0);
                    codeForm.resetFields();
                  }}
                >
                  Thay đổi email
                </Button>
              </div>
            </Form>
          )}

          {/* Step 2: Enter New Password */}
          {currentStep === 2 && (
            <Form form={passwordForm} onFinish={handleResetPassword} layout="vertical" size="large">
              <Form.Item
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
                  prefix={<LockOutlined className={styles.inputIcon} />} 
                  placeholder="Mật khẩu mới"
                  className={styles.input}
                />
              </Form.Item>

              <Form.Item
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
                  prefix={<CheckCircleOutlined className={styles.inputIcon} />} 
                  placeholder="Xác nhận mật khẩu"
                  className={styles.input}
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  className={styles.submitButton}
                  block
                >
                  Đặt lại mật khẩu
                </Button>
              </Form.Item>
            </Form>
          )}
          
          <div className={styles.backLink}>
            <Link href="/login">
              <ArrowLeftOutlined /> Quay lại đăng nhập
            </Link>
          </div>
          
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
