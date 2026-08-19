import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information-we-collect', title: '2. Information We Collect' },
  { id: 'how-we-use', title: '3. How We Use Your Information' },
  { id: 'how-we-share', title: '4. How We Share Your Information' },
  { id: 'cookies', title: '5. Cookies & Tracking Technologies' },
  { id: 'data-retention', title: '6. Data Retention' },
  { id: 'your-rights', title: '7. Your Rights & Choices' },
  { id: 'data-security', title: '8. Data Security' },
  { id: 'international-transfers', title: '9. International Data Transfers' },
  { id: 'children', title: "10. Children's Privacy" },
  { id: 'third-party-links', title: '11. Third-Party Links' },
  { id: 'changes', title: '12. Changes to This Policy' },
  { id: 'contact', title: '13. Contact Us' },
]

export default function PrivacyPolicyPage() {
  const [activeId, setActiveId] = useState(sections[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-100px 0px -70% 0px' }
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="pt-32 pb-12 border-b border-gray-100 dark:border-dark-700">
        <div className="container-custom">
          <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-5">
            <Shield size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="page-title mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: August 19, 2026
          </p>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
            This Privacy Policy explains how JobPortal ("JobPortal", "we", "us", or "our")
            collects, uses, shares, and protects information when you use our website,
            applications, and related services (together, the "Services"). It applies to job
            seekers, employers, recruiters, and visitors alike.
          </p>
        </div>
      </section>

      <div className="container-custom">
        <div className="grid lg:grid-cols-[220px_1fr] gap-12 py-16">

          {/* ── Table of contents ─────────────────────────────────────── */}
          <nav className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                On this page
              </p>
              <ul className="space-y-2 border-l border-gray-200 dark:border-dark-700">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={
                        'block pl-4 -ml-px border-l text-sm py-0.5 transition-colors ' +
                        (activeId === s.id
                          ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-medium'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')
                      }
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* ── Content ──────────────────────────────────────────────── */}
          <div className="min-w-0 space-y-14 text-gray-600 dark:text-gray-300 leading-relaxed">

            <section id="introduction" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                1. Introduction
              </h2>
              <p className="mb-3">
                JobPortal operates an online marketplace that connects job seekers with employers.
                We take your privacy seriously and are committed to being transparent about the
                data we collect and why we collect it.
              </p>
              <p>
                By creating an account or otherwise using the Services, you agree to the
                collection and use of information in accordance with this Policy. If you do not
                agree with any part of this Policy, please do not use the Services.
              </p>
            </section>

            <section id="information-we-collect" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                2. Information We Collect
              </h2>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2.1 Account information</h3>
              <p className="mb-4">
                When you register, we collect your name, email address, password (stored in
                hashed form), and account type (job seeker, employer, or admin). If you sign in
                using Google or LinkedIn, we receive basic profile information from that provider
                as authorized by you.
              </p>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2.2 Profile and resume data</h3>
              <p className="mb-4">
                Job seekers may provide work history, education, skills, certifications, salary
                expectations, location, and uploaded resume or CV files. This information is used
                to build your profile and to match you with relevant opportunities.
              </p>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2.3 Application and hiring data</h3>
              <p className="mb-4">
                When you apply for a job, we collect the application materials you submit, your
                communications with employers through our messaging tools, interview scheduling
                details, and status updates (e.g., shortlisted, interviewing, hired, rejected).
              </p>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2.4 Employer and company data</h3>
              <p className="mb-4">
                Employers provide company details, verification documents, job listing content,
                billing information, and information about the candidates they review or contact
                through the Services.
              </p>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2.5 Usage and device data</h3>
              <p>
                We automatically collect certain information when you use the Services, including
                IP address, browser type, device identifiers, pages viewed, search queries, and
                timestamps. This helps us secure accounts, diagnose problems, and improve the
                product.
              </p>
            </section>

            <section id="how-we-use" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                3. How We Use Your Information
              </h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Create and maintain your account, and verify your identity</li>
                <li>Match job seekers with relevant job listings and vice versa</li>
                <li>Enable applications, messaging, interview scheduling, and hiring workflows</li>
                <li>Process payments for employer packages and subscriptions</li>
                <li>Send service notifications, job alerts, and — where you've opted in — marketing communications</li>
                <li>Detect, investigate, and prevent fraud, abuse, and violations of our Terms of Service</li>
                <li>Analyze usage patterns to improve matching quality and platform performance</li>
                <li>Comply with legal obligations and respond to lawful requests from public authorities</li>
              </ul>
            </section>

            <section id="how-we-share" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                4. How We Share Your Information
              </h2>
              <p className="mb-3">We do not sell your personal information. We share information only in the following circumstances:</p>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4.1 With employers, when you apply</h3>
              <p className="mb-4">
                When you apply to a job or make your resume visible for search, the relevant
                employer or recruiter can see the profile and application details you've chosen
                to share. Job seekers control the visibility of their resume through profile
                settings.
              </p>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4.2 With service providers</h3>
              <p className="mb-4">
                We share information with vendors who perform services on our behalf, such as
                cloud hosting, payment processing, email delivery, and analytics. These providers
                are contractually bound to use your information only to provide services to us.
              </p>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4.3 For legal reasons</h3>
              <p className="mb-4">
                We may disclose information if required by law, regulation, legal process, or
                governmental request, or when we believe disclosure is necessary to protect the
                rights, property, or safety of JobPortal, our users, or the public.
              </p>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4.4 Business transfers</h3>
              <p>
                If JobPortal is involved in a merger, acquisition, financing, or sale of assets,
                your information may be transferred as part of that transaction. We will notify
                you of any change in ownership or use of your personal information.
              </p>
            </section>

            <section id="cookies" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                5. Cookies & Tracking Technologies
              </h2>
              <p className="mb-3">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Keep you signed in and remember your preferences (e.g., dark mode)</li>
                <li>Understand how the Services are used, so we can improve them</li>
                <li>Prevent fraudulent activity and protect account security</li>
              </ul>
              <p>
                You can control cookies through your browser settings. Disabling cookies may
                limit some features of the Services, such as staying signed in between sessions.
              </p>
            </section>

            <section id="data-retention" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                6. Data Retention
              </h2>
              <p>
                We retain personal information for as long as your account is active or as needed
                to provide the Services. If you delete your account, we delete or anonymize your
                personal information within a reasonable period, except where we are required to
                retain it to comply with legal obligations, resolve disputes, enforce our
                agreements, or maintain accurate financial and hiring records.
              </p>
            </section>

            <section id="your-rights" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                7. Your Rights & Choices
              </h2>
              <p className="mb-3">Depending on where you live, you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Access the personal information we hold about you</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Restrict or object to certain processing of your information</li>
                <li>Request a portable copy of your data</li>
                <li>Withdraw consent for marketing communications at any time</li>
              </ul>
              <p className="mb-3">
                You can exercise most of these rights directly from your account settings, or by
                contacting us as described in Section 13.
              </p>
              <p>
                If you are located in the European Economic Area or the United Kingdom, you have
                rights under the General Data Protection Regulation (GDPR). If you are a
                California resident, you have rights under the California Consumer Privacy Act
                (CCPA), including the right to know what personal information we collect and the
                right to opt out of the sale or sharing of personal information — which we do not
                engage in.
              </p>
            </section>

            <section id="data-security" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                8. Data Security
              </h2>
              <p>
                We use industry-standard safeguards to protect your information, including
                encryption in transit, hashed password storage, access controls, and regular
                security reviews. However, no method of transmission or storage is completely
                secure, and we cannot guarantee absolute security of your information.
              </p>
            </section>

            <section id="international-transfers" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                9. International Data Transfers
              </h2>
              <p>
                JobPortal operates globally, and your information may be transferred to, stored,
                and processed in countries other than your own, including countries that may have
                different data protection laws. Where required, we rely on appropriate safeguards,
                such as standard contractual clauses, to protect information transferred
                internationally.
              </p>
            </section>

            <section id="children" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                10. Children's Privacy
              </h2>
              <p>
                The Services are not directed to individuals under the age of 16, and we do not
                knowingly collect personal information from children. If we become aware that we
                have collected personal information from a child without verified parental
                consent, we will take steps to delete that information.
              </p>
            </section>

            <section id="third-party-links" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                11. Third-Party Links
              </h2>
              <p>
                The Services may contain links to third-party websites, such as company career
                pages or social media profiles. We are not responsible for the privacy practices
                of these third parties, and we encourage you to review their privacy policies
                before providing any information to them.
              </p>
            </section>

            <section id="changes" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                12. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our
                practices or for legal, operational, or regulatory reasons. We will post the
                updated policy on this page and revise the "Last updated" date above. Material
                changes will be communicated via email or an in-app notice before they take
                effect.
              </p>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                13. Contact Us
              </h2>
              <p className="mb-3">
                If you have questions about this Privacy Policy or how we handle your
                information, please contact us:
              </p>
              <div className="card p-5 not-prose">
                <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">JobPortal Privacy Team</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">privacy@jobportal.com</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}