'use client';

import { Result, Button } from 'antd';
import { ToolOutlined, HomeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f5f5f5'
    }}>
      <Result
        status="404"
        title="Trang Cài Đặt"
        subTitle="Tính năng này đang được phát triển và sẽ sớm ra mắt."
        icon={<ToolOutlined style={{ fontSize: 72, color: '#1890ff' }} />}
        extra={
          <Button 
            type="primary" 
            icon={<HomeOutlined />}
            onClick={() => router.push('/admin')}
            size="large"
          >
            Quay về trang chủ
          </Button>
        }
      />
    </div>
  );
}
