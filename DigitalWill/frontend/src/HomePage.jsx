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
    <div className="min-h-screen bg-[#FFF6EC] text-[#111111]">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16">
        <section className="rounded-[32px] border border-[#f2dfc8] bg-white p-8 shadow-[0_24px_80px_-28px_rgba(17,17,17,0.25)] md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF6B00]">Cybersecurity-first inheritance</p>
          <h1 className="mt-4 text-4xl font-semibold text-[#111111]">Digital Will AI – Secure Digital Asset Inheritance Platform</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            Securely manage digital assets, assign trusted beneficiaries, and automate emergency access through AI-powered verification.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-2xl bg-[#FF6B00] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">Get Started</Link>
            <Link to="/login" className="rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-5 py-3 text-sm font-semibold text-slate-700">Learn More</Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div key={feature} className="rounded-[24px] border border-[#f2dfc8] bg-[#FFF6EC] p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#111111]">{feature}</h2>
              <p className="mt-2 text-sm text-slate-600">A security-first component built for demonstrable inheritance protection.</p>
            </div>
          ))}
        </section>

        <section className="rounded-[32px] border border-[#f2dfc8] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#111111]">How It Works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-[24px] border border-[#f2dfc8] bg-[#FFF6EC] p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-[#FF6B00]">0{index + 1}</p>
                <p className="mt-2 text-base font-medium text-[#111111]">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-[#f2dfc8] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#111111]">Security Foundations</h2>
          <p className="mt-4 text-slate-600">
            AES-256-GCM encryption, AI-based risk detection, RBAC, and immutable audit logging form the backbone of every access decision.
          </p>
        </section>
      </main>

      <footer className="border-t border-[#f2dfc8] bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-slate-600">
          <span className="font-medium text-[#111111]">Digital Will AI</span>
          <div className="flex gap-4">
            <Link to="/register" className="font-semibold text-[#FF6B00]">Get Started</Link>
            <Link to="/login" className="font-semibold text-[#FF6B00]">Login</Link>
            <Link to="/dashboard" className="font-semibold text-[#FF6B00]">Learn More</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
