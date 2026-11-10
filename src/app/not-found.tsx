import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <section className="section-y">
      <div className="container-x text-center">
        <p className="font-display text-7xl font-extrabold text-gradient">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">The page you are looking for does not exist or has been moved.</p>
        <Link href="/" className="btn btn-primary mt-8 inline-flex"><ArrowLeft size={18} /> Back to Home</Link>
      </div>
    </section>
  );
}