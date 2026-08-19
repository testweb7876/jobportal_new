import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'eligibility', title: '2. Eligibility & Accounts' },
  { id: 'jobseeker-terms', title: '3. Job Seeker Terms' },
  { id: 'employer-terms', title: '4. Employer Terms' },
  { id: 'fees-payment', title: '5. Fees & Payment' },
  { id: 'content-license', title: '6. Content & License' },
  { id: 'prohibited-conduct', title: '7. Prohibited Conduct' },
  { id: 'intellectual-property', title: '8. Intellectual Property' },
  { id: 'third-party', title: '9. Third-Party Interactions' },
  { id: 'disclaimers', title: '10. Disclaimers' },
  { id: 'liability', title: '11. Limitation of Liability' },
  { id: 'indemnification', title: '12. Indemnification' },
  { id: 'termination', title: '13. Termination' },
  { id: 'disputes', title: '14. Dispute Resolution' },
  { id: 'governing-law', title: '15. Governing Law' },
  { id: 'changes', title: '16. Changes to These Terms' },
  { id: 'contact', title: '17. Contact Us' },
]

export default function TermsOfServicePage() {
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
            <FileText size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="page-title mb-3">Terms of Service</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: August 19, 2026
          </p>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
            These Terms of Service ("Terms") govern your access to and use of JobPortal's
            website, applications, and related services (together, the "Services"). By creating
            an account or otherwise using the Services, you agree to be bound by these Terms. If
            you are using the Services on behalf of a company, you represent that you have the
            authority to bind that company to these Terms.
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

            <section id="acceptance" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="mb-3">
                By accessing or using JobPortal, you agree to these Terms and our Privacy Policy.
                If you do not agree, you must not access or use the Services.
              </p>
              <p>
                We may offer additional terms for specific features (such as employer job
                packages). Where those apply, they supplement these Terms and take precedence in
                case of conflict, solely with respect to that feature.
              </p>
            </section>

            <section id="eligibility" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                2. Eligibility & Accounts
              </h2>
              <p className="mb-3">
                You must be at least 16 years old to use the Services. By registering, you
                confirm that you meet this requirement and that all information you provide is
                accurate and kept up to date.
              </p>
              <p className="mb-3">
                You are responsible for maintaining the confidentiality of your account
                credentials and for all activity that occurs under your account. Notify us
                immediately at support@jobportal.com if you suspect unauthorized access.
              </p>
              <p>
                We reserve the right to suspend or terminate accounts that provide false
                information, impersonate another person or company, or are created for
                fraudulent purposes.
              </p>
            </section>

            <section id="jobseeker-terms" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                3. Job Seeker Terms
              </h2>
              <p className="mb-3">
                Job seekers may create a profile, upload resumes, and apply to job listings posted
                by employers. You are solely responsible for the accuracy of your profile, resume,
                and application content.
              </p>
              <p className="mb-3">
                JobPortal does not guarantee that any application will result in an interview,
                offer, or job placement. We are not a party to any employment relationship, offer,
                or agreement formed between a job seeker and an employer, and we make no
                representations about the legitimacy, conduct, or intentions of employers using
                the Services, beyond the verification steps described in Section 4.
              </p>
              <p>
                You control the visibility of your resume and profile through your account
                settings, and may withdraw an application at any time before it is acted upon by
                the employer.
              </p>
            </section>

            <section id="employer-terms" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                4. Employer Terms
              </h2>
              <p className="mb-3">
                Employers may create a company profile, post job listings, and review, contact,
                and manage candidates through the Services. All job listings must be accurate,
                lawful, and represent genuine, currently available opportunities.
              </p>
              <p className="mb-3">Employers agree not to post listings that:</p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li>Discriminate on the basis of race, color, religion, sex, national origin, age, disability, or any other characteristic protected by applicable law</li>
                <li>Require payment from candidates, or involve pyramid schemes, multi-level marketing recruitment, or similar arrangements</li>
                <li>Misrepresent the job title, compensation, location, or nature of the role</li>
                <li>Advertise unpaid positions where paid employment is legally required</li>
              </ul>
              <p className="mb-3">
                New employer accounts and listings may be subject to a verification review before
                becoming publicly visible. We reserve the right to reject, edit, or remove any
                listing that violates these Terms or applicable law.
              </p>
              <p>
                Access to candidate information obtained through the Services must comply with
                applicable data protection and employment laws. Employers may use candidate data
                solely for legitimate recruiting and hiring purposes, and not for any unrelated
                commercial use.
              </p>
            </section>

            <section id="fees-payment" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                5. Fees & Payment
              </h2>
              <p className="mb-3">
                Job seeker accounts are free. Employers may purchase job posting packages or
                subscriptions as described on our Pricing page. All fees are stated in advance of
                purchase and are due at the time of purchase unless otherwise agreed in writing.
              </p>
              <p className="mb-3">
                Except where required by law or expressly stated at the time of purchase, fees are
                non-refundable. Approved refunds, where applicable, will be processed to the
                original payment method.
              </p>
              <p>
                We may change our fees prospectively at any time. Changes will not affect
                packages already purchased and will apply only to future purchases or renewals.
              </p>
            </section>

            <section id="content-license" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                6. Content & License
              </h2>
              <p className="mb-3">
                "User Content" means any information you submit to the Services, including
                resumes, profile information, job listings, company descriptions, messages, and
                reviews. You retain ownership of your User Content.
              </p>
              <p className="mb-3">
                By submitting User Content, you grant JobPortal a non-exclusive, worldwide,
                royalty-free license to host, store, reproduce, and display that content solely
                for the purpose of operating, providing, and improving the Services — for
                example, showing your resume to an employer you apply to, or displaying a job
                listing to job seekers.
              </p>
              <p>
                You are solely responsible for your User Content and confirm that you have all
                necessary rights to submit it, and that it does not infringe any third party's
                rights or violate any applicable law.
              </p>
            </section>

            <section id="prohibited-conduct" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                7. Prohibited Conduct
              </h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Use the Services for any unlawful purpose or in violation of these Terms</li>
                <li>Post false, misleading, or fraudulent profiles, resumes, reviews, or job listings</li>
                <li>Scrape, harvest, or collect data from the Services using automated means without our prior written consent</li>
                <li>Upload viruses, malware, or attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Harass, threaten, or discriminate against other users</li>
                <li>Circumvent the Services to solicit or transact with a user outside the platform in a manner intended to avoid applicable fees</li>
                <li>Impersonate any person or entity, or misrepresent your affiliation with one</li>
                <li>Interfere with or disrupt the integrity or performance of the Services</li>
              </ul>
            </section>

            <section id="intellectual-property" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                8. Intellectual Property
              </h2>
              <p>
                The Services, including our logos, design, software, and all content we create
                (excluding User Content), are owned by JobPortal or our licensors and are
                protected by intellectual property laws. Except for the limited right to use the
                Services as intended, no rights are granted to you in our intellectual property.
              </p>
            </section>

            <section id="third-party" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                9. Third-Party Interactions
              </h2>
              <p>
                The Services may facilitate interactions between job seekers and employers, and
                may link to third-party websites or services (such as OAuth sign-in providers or
                payment processors). JobPortal is not responsible for the actions, content, or
                policies of any third party, and any dealings you have with third parties through
                the Services are solely between you and that third party.
              </p>
            </section>

            <section id="disclaimers" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                10. Disclaimers
              </h2>
              <p className="mb-3">
                The Services are provided "as is" and "as available," without warranties of any
                kind, whether express or implied, including implied warranties of
                merchantability, fitness for a particular purpose, and non-infringement.
              </p>
              <p>
                We do not warrant that the Services will be uninterrupted, error-free, or secure,
                or that any job listing, application, or candidate information is accurate,
                complete, or current. Any reliance you place on such information is at your own
                risk.
              </p>
            </section>

            <section id="liability" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                11. Limitation of Liability
              </h2>
              <p className="mb-3">
                To the fullest extent permitted by law, JobPortal and its officers, employees,
                and partners will not be liable for any indirect, incidental, special,
                consequential, or punitive damages, or any loss of profits, revenue, data, or
                goodwill, arising from or related to your use of the Services.
              </p>
              <p>
                Our total aggregate liability for any claim arising out of or relating to these
                Terms or the Services will not exceed the greater of (a) the amount you paid to
                JobPortal in the twelve months preceding the claim, or (b) one hundred US dollars
                (USD $100).
              </p>
            </section>

            <section id="indemnification" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                12. Indemnification
              </h2>
              <p>
                You agree to indemnify and hold harmless JobPortal and its officers, employees,
                and partners from any claims, damages, losses, and expenses, including reasonable
                legal fees, arising out of your use of the Services, your User Content, or your
                violation of these Terms or applicable law.
              </p>
            </section>

            <section id="termination" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                13. Termination
              </h2>
              <p className="mb-3">
                You may stop using the Services and delete your account at any time from your
                account settings.
              </p>
              <p>
                We may suspend or terminate your account or access to the Services, with or
                without notice, if we reasonably believe you have violated these Terms, created
                risk or legal exposure for JobPortal, or if we are required to do so by law.
                Sections that by their nature should survive termination — including Sections 6,
                8, 10, 11, 12, 14, and 15 — will survive.
              </p>
            </section>

            <section id="disputes" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                14. Dispute Resolution
              </h2>
              <p className="mb-3">
                We encourage you to contact us first at support@jobportal.com to try to resolve
                any dispute informally. If a dispute cannot be resolved informally within 30 days,
                either party may pursue the dispute through binding arbitration on an individual
                basis, rather than in court, except that either party may bring an individual
                claim in small claims court where eligible.
              </p>
              <p>
                You and JobPortal each waive any right to a jury trial or to participate in a
                class, consolidated, or representative action, to the extent permitted by
                applicable law.
              </p>
            </section>

            <section id="governing-law" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                15. Governing Law
              </h2>
              <p>
                These Terms are governed by the laws of the jurisdiction in which JobPortal is
                incorporated, without regard to its conflict of law principles, except where
                mandatory local consumer protection laws provide otherwise.
              </p>
            </section>

            <section id="changes" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                16. Changes to These Terms
              </h2>
              <p>
                We may update these Terms from time to time. If we make material changes, we will
                notify you by email or through an in-app notice before the changes take effect.
                Continuing to use the Services after changes become effective constitutes
                acceptance of the revised Terms.
              </p>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                17. Contact Us
              </h2>
              <p className="mb-3">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="card p-5 not-prose">
                <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">JobPortal Legal Team</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">legal@jobportal.com</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}