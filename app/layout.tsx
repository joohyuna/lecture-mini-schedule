import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "미니다이어리",
  description: "한눈에 보이는 미니 다이어리",
};

// 첫 페인트 전에 테마 클래스를 적용해 깜빡임 방지
const themeScript = `
(function(){
  try {
    var raw = localStorage.getItem('mini-diary:v1:theme');
    var t = raw ? JSON.parse(raw) : 'system';
    var dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-neutral-50 text-neutral-800 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  );
}
