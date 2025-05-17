import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import './globals.css';
import { AuthProvider } from './components/auth/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Business Directory',
  description: 'Business Directory Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AntdRegistry>{children}</AntdRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}