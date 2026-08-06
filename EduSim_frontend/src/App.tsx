import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import { Toaster } from 'sonner';

const router = getRouter();

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
}
