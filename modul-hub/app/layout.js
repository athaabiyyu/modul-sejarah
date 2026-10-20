import './globals.css';

export const metadata = {
  title: 'Modul Hub',
  description: 'Pustaka modul dan dokumen pembelajaran',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
