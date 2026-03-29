import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

type RootProps = PropsWithChildren;

export default function Root({ children }: RootProps) {
  return (
    <html lang="no">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content="#0F131A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BetABeer" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />

        <style>{`
          html,
          body,
          #root {
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100%;
            background: #0f131a;
          }

          /* Ensure content respects iOS safe areas when launched from home screen. */
          #root {
            padding-top: env(safe-area-inset-top);
            padding-right: env(safe-area-inset-right);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
          }
        `}</style>

        <ScrollViewStyleReset />
        <title>BetABeer</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
