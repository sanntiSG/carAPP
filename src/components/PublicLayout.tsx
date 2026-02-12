import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
}
