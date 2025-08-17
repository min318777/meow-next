import './globals.css';

export const metadata = {
  title: 'meow',
  description: '고양이를 사랑하는 모든 분들을 위한 커뮤니티',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
