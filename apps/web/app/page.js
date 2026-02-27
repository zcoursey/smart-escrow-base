import EscrowComponent from "./components/EscrowComponent";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-12 px-4 selection:bg-indigo-500/30">
      <header className="mb-12 text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
          Smart Escrow
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Secure, transparent milestone payments for real estate and construction.
        </p>
      </header>

      <main className="w-full max-w-5xl">
        <EscrowComponent />
      </main>

      <footer className="mt-16 text-slate-600 text-sm">
        <p>© 2026 Smart Escrow Platform.</p>
      </footer>
    </div>
  );
}
