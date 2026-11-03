import Link from 'next/link';

const SUPPORT_ISSUES_URL = 'https://github.com/SHASHWAT-MISHRA-997/SHARVAGYA.AI/issues';

export const metadata = {
  title: 'Support | SHARVAGYA.AI',
  description: 'Support and security reporting information for SHARVAGYA.AI.',
};

export default function SupportPage() {
  return (
    <main className="auth-container">
      <article className="auth-card" style={{ maxWidth: 760 }}>
        <h1 className="brand-wordmark brand-wordmark-auth">SHARVAGYA.AI</h1>
        <h2 style={{ marginTop: 18 }}>Support</h2>
        <p>
          For product questions, sign-in problems, and feature requests, open a support issue with a clear
          description, the page where the problem occurred, and the steps needed to reproduce it.
        </p>
        <p>
          <a className="btn btn-primary" href={SUPPORT_ISSUES_URL} target="_blank" rel="noreferrer">
            Open support request
          </a>
        </p>
        <h3>Security reports</h3>
        <p>
          Do not post passwords, API keys, access tokens, or exploitable vulnerability details in a public issue.
          Use the repository owner&apos;s private contact method for sensitive reports.
        </p>
        <h3>Before contacting support</h3>
        <p>
          Confirm that your browser is current, then include the approximate time of the issue and any error
          message. This helps reproduce and resolve problems without requesting unnecessary personal data.
        </p>
        <p style={{ marginTop: 24 }}>
          <Link href="/privacy" className="btn btn-ghost">Privacy</Link>{' '}
          <Link href="/login" className="btn btn-ghost">Return to sign in</Link>
        </p>
      </article>
    </main>
  );
}
