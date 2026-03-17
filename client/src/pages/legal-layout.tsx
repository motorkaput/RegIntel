export default function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)" }}>
      {/* Header */}
      <header className="border-b py-4 px-6" style={{ background: "var(--ds-surface)", borderColor: "var(--ds-border)" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ background: "var(--ds-gold)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--ds-imperial)" }}>R</span>
            </div>
            <span className="brand-name text-[15px]" style={{ color: "var(--ds-text)" }}>RegIntel</span>
          </a>
          <div className="flex items-center gap-4 text-[12px]" style={{ color: "var(--ds-text-muted)" }}>
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/pricing" className="hover:underline">Pricing</a>
            <a href="/contact" className="hover:underline">Contact</a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "var(--ds-text)" }}>
            {title}
          </h1>
          <div
            className="rounded-lg border p-8 space-y-6 text-[15px] leading-relaxed"
            style={{
              background: "var(--ds-surface)",
              borderColor: "var(--ds-border)",
              color: "var(--ds-text-secondary)",
            }}
          >
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ background: "var(--ds-deep-navy)" }}>
        <div className="max-w-3xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <span className="text-[12px]" style={{ color: "var(--ds-text-on-dark-muted)" }}>Dark Street Tech</span>
          <div className="flex items-center gap-4 text-[12px]" style={{ color: "var(--ds-text-on-dark-muted)" }}>
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/refund" className="hover:underline">Refund</a>
            <a href="/contact" className="hover:underline">Contact</a>
            <a href="/pricing" className="hover:underline">Pricing</a>
          </div>
          <span className="text-[12px]" style={{ color: "var(--ds-text-on-dark-muted)" }}>darkstreet.tech</span>
        </div>
      </footer>
    </div>
  );
}
