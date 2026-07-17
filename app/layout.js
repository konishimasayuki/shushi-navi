export const metadata = {
  title: "収支管理システム",
  description: "パチンコ・パチスロ収支管理システム",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
