import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 page-enter">
      <div className="text-center max-w-md mx-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
          <span className="text-3xl font-bold text-slate-400">404</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Page not found</h1>
        <p className="text-sm text-slate-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <a className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
            Go to home
          </a>
        </Link>
      </div>
    </div>
  );
}
