import "./globals.css";

export const metadata = {
  title: "aglimitless",
  description: "Professional Typing Portal for Government Exams",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}