import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "../lib/cart-context";
import TopAnnouncementBar from "../components/TopAnnouncementBar";
import Footer from "../components/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FootBubr — Unikalne Korki Piłkarskie 1 of 1 & Akcesoria" },
      {
        name: "description",
        content:
          "Limitowane pary korków piłkarskich 1 of 1, skarpety antypoślizgowe i akcesoria. Oryginalne modele Nike, Adidas, Puma.",
      },
      { name: "theme-color", content: "#0c0c0c" },

      // Open Graph (Messenger, Facebook, Instagram, WhatsApp, Discord, iMessage)
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://footbubr-unpacked-and-ready.vercel.app/" },
      { property: "og:site_name", content: "FootBubr" },
      { property: "og:title", content: "FootBubr — Unikalne Korki Piłkarskie 1 of 1" },
      {
        property: "og:description",
        content: "Limitowane pary korków 1 of 1 oraz profesjonalne akcesoria piłkarskie. Sprawdź najnowszy drop!",
      },
      { property: "og:image", content: "https://footbubr-unpacked-and-ready.vercel.app/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "pl_PL" },

      // Twitter / X Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:url", content: "https://footbubr-unpacked-and-ready.vercel.app/" },
      { name: "twitter:title", content: "FootBubr — Unikalne Korki Piłkarskie 1 of 1" },
      {
        name: "twitter:description",
        content: "Limitowane pary korków 1 of 1 oraz profesjonalne akcesoria piłkarskie. Sprawdź najnowszy drop!",
      },
      { name: "twitter:image", content: "https://footbubr-unpacked-and-ready.vercel.app/og-image.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
      { rel: "icon", href: "/logoPNG.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pl" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TopAnnouncementBar />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Footer />
        <Toaster
          position="bottom-center"
          theme="dark"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              border: "1px solid #333",
              color: "#e5e5e5",
            },
          }}
        />
      </CartProvider>
    </QueryClientProvider>
  );
}
