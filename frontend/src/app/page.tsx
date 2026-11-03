import { redirect } from 'next/navigation';

// Login has been removed: the site opens straight into the dashboard.
export default function Home() {
  redirect('/dashboard');
}
