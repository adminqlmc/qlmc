"use client";

import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { HomeOutlined } from '@ant-design/icons';

export default function NotFound() {
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
        title="404"
        subTitle="Xin lỗi, trang bạn truy cập không tồn tại."
        extra={
          <Button 
            type="primary" 
            icon={<HomeOutlined />}
            onClick={() => router.push('/')}
          >
            Về trang chủ
          </Button>
        }
      />
    </div>
  );
}
