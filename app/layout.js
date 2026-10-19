// app/layout.js
// Root layout: Bootstrap 5.3 from the CDN (CSS only - we do not use
// Bootstrap's JavaScript), the shared <Navbar/> and the global toast host.

import "./globals.css";
import Navbar from "@/components/Navbar";
import ToastHost from "@/components/Toast";

export const metadata = {
  title: "Campus Lost & Found",
  description: "Report lost items, browse found items, claim and get them back.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        <main className="container py-4">{children}</main>
        <ToastHost />
      </body>
    </html>
  );
}
