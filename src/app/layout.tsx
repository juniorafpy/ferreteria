import type { Metadata } from 'next';
import { SCRIPT_TEMA } from '@/lib/ui/tema';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Ferre ERP', template: '%s · Ferre ERP' },
  description: 'ERP ferretero: compras, ventas, inventario, contabilidad y facturación electrónica SIFEN.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PY" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
