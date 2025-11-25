import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp } from "antd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hệ thống quản lý máy chiếu",
  description: "Giám sát trạng thái, lịch sử sử dụng và bảo trì máy chiếu thông minh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress Ant Design warnings
              const originalWarn = console.warn;
              console.warn = function(...args) {
                const msg = args[0]?.toString?.() || '';
                if (msg.includes('antd v5 support React is 16 ~ 18') ||
                    msg.includes('Static function can not consume context')) {
                  return;
                }
                originalWarn.apply(console, args);
              };
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`} style={{ background: '#f7f9fb' }}>
        <AntdRegistry>
          <AntdApp>
            {children}
          </AntdApp>
        </AntdRegistry>
      </body>
    </html>
  );
}
