import { Link } from 'react-router-dom';

const features = [
  'Encrypted Digital Asset Vault',
  'Trusted Beneficiary Management',
  'AI-Assisted Access Verification',
  'Policy-Based Emergency Access',
  'Multi-Factor Authentication (MFA)',
  'Security Audit Logs & Risk Analysis',
  'Privacy-Preserving Digital Inheritance',
];

const steps = ['Create account', 'Add digital assets', 'Assign beneficiaries', 'Protect your digital legacy'];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Cybersecurity-first inheritance</p>
          <h1 className="mt-4 text-4xl font-semibold">Digital Will AI – Secure Digital Asset Inheritance Platform</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">
            Securely manage digital assets, assign trusted beneficiaries, and automate emergency access through AI-powered verification.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register" className="rounded bg-cyan-600 px-5 py-3 text-sm font-semibold text-white">Get Started</Link>
            <Link to="/login" className="rounded border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200">Learn More</Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div key={feature} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-lg font-medium">{feature}</h2>
              <p className="mt-2 text-sm text-slate-400">A security-first component built for demonstrable inheritance protection.</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <h2 className="text-2xl font-semibold">How It Works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">0{index + 1}</p>
                <p className="mt-2 text-base font-medium text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <h2 className="text-2xl font-semibold">Security Foundations</h2>
          <p className="mt-4 text-slate-300">
            AES-256-GCM encryption, AI-based risk detection, RBAC, and immutable audit logging form the backbone of every access decision.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-slate-400">
          <span>Digital Will AI</span>
          <div className="flex gap-4">
            <Link to="/register" className="text-cyan-400">Get Started</Link>
            <Link to="/login" className="text-cyan-400">Login</Link>
            <Link to="/dashboard" className="text-cyan-400">Learn More</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
