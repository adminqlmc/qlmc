"use client";

import React from 'react';
import { Layout, Tooltip } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import styles from './Header.module.css';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  title?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Header({ title = 'QL Máy Chiếu', collapsed = false, onToggle }: HeaderProps) {
  return (
    <AntHeader className={styles.header}>
      {onToggle && (
        <Tooltip title={collapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'} placement="bottom">
          <button
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
            className={styles.toggleBtn}
            onClick={onToggle}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </Tooltip>
      )}
      <div className={styles.title}>{title}</div>
    </AntHeader>
  );
}
