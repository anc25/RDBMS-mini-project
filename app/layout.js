// app/layout.js
// Root layout: Bootstrap 5.3 from the CDN (CSS only - we do not use
// Bootstrap's JavaScript), Schibsted Grotesk from Google Fonts, the shared
// <Navbar/> and the global toast host.

import "./globals.css";
import Navbar from "@/components/Navbar";
import ToastHost from "@/components/Toast";

export const metadata = {
  title: "Campus Lost & Found",
  description: "Report lost items, browse found items, claim and get them back.",
};

// Applied before first paint so a dark-mode reload has no white flash.
// Static constant string (no user data), so dangerouslySetInnerHTML is safe.
const themeInitScript = `(function(){try{var t=localStorage.getItem("lf-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the theme script runs before React hydrates
    // and may add data-theme="dark" to <html>, so the served HTML and the
    // hydrated DOM differ by design on this one element.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- false positive: App Router layouts are shared, this loads on every page */}
        <link
          href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
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
