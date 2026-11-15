import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { StoreProvider } from "@/components/store-provider";
import { StoreShell } from "@/components/storefront";
import "./globals.css";
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
export const metadata: Metadata = {
  title: { default: "Ahmed — Light, considered.", template: "%s — Ahmed" },
  description:
    "Thoughtfully chosen lighting for everyday living. Explore pendants, floor lamps, table lamps and architectural lighting.",
  icons: { icon: "/assets/ahmed-logo.jpg" },
};
export const viewport: Viewport = { themeColor: "#f5f2eb" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${dmSans.variable} ${manrope.variable}`}
    >
      <head>
        <link rel="stylesheet" href="/vendor/pannellum/pannellum.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const clean = function(el) {
                    if (!el || !el.attributes) return;
                    const remove = [];
                    for (let i = 0; i < el.attributes.length; i++) {
                      const name = el.attributes[i].name;
                      if (name && (name.startsWith('bis_') || name.startsWith('__processed_'))) {
                        remove.push(name);
                      }
                    }
                    for (let j = 0; j < remove.length; j++) {
                      el.removeAttribute(remove[j]);
                    }
                  };
                  const obs = new MutationObserver(function(mutations) {
                    for (let i = 0; i < mutations.length; i++) {
                      const m = mutations[i];
                      if (m.type === 'attributes') {
                        const name = m.attributeName;
                        if (name && (name.startsWith('bis_') || name.startsWith('__processed_'))) {
                          m.target.removeAttribute(name);
                        }
                      } else if (m.type === 'childList') {
                        for (let j = 0; j < m.addedNodes.length; j++) {
                          const node = m.addedNodes[j];
                          if (node.nodeType === 1) {
                            clean(node);
                          }
                        }
                      }
                    }
                  });
                  obs.observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    childList: true,
                  });
                  if (document.body) clean(document.body);
                  document.addEventListener("DOMContentLoaded", function() {
                    try {
                      document.querySelectorAll("[bis_skin_checked], [bis_register]").forEach(clean);
                    } catch (e) {}
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <StoreProvider>
          <StoreShell>{children}</StoreShell>
        </StoreProvider>
      </body>
    </html>
  );
}
