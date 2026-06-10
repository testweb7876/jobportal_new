import { Link } from 'react-router-dom'
import { Briefcase, Twitter, Linkedin, Github, Mail } from 'lucide-react'

const links = {
  'For Job Seekers': [
    { label: 'Browse Jobs', href: '/jobs' },
    { label: 'Companies', href: '/companies' },
    { label: 'Create Resume', href: '/jobseeker/resumes' },
    { label: 'Job Alerts', href: '/jobseeker/alerts' },
  ],
  'For Employers': [
    { label: 'Post a Job', href: '/employer/jobs/post' },
    { label: 'Browse Candidates', href: '/employer/candidates' },
    { label: 'Pricing', href: '/employer/packages' },
    { label: 'Company Profile', href: '/employer/company' },
  ],
  'Company': [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-gray-400">
      <div className="container-custom py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <Briefcase size={18} className="text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                Job<span className="text-primary-400">Portal</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              Connect talented professionals with amazing companies. Your career journey starts here.
            </p>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-9 h-9 rounded-xl bg-dark-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                  <Icon size={16} className="text-gray-400 hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item.label}>
                    <Link to={item.href} className="text-sm hover:text-white transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-dark-700 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">© {new Date().getFullYear()} JobPortal. All rights reserved.</p>
          <p className="text-xs">Built with ❤️ for career growth</p>
        </div>
      </div>
    </footer>
  )
}
