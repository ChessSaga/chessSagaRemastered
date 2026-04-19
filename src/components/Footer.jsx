import {Link} from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-slate-100">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-200">Chess Saga</h2>
          <p className="mt-3 text-sm text-slate-300">
            Structured online chess coaching for kids and teens with FIDE-rated mentors.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-200">Quick Links</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li><Link to="/programs" className="hover:text-white">Programs</Link></li>
            <li><Link to="/trial" className="hover:text-white">Book Trial</Link></li>
            <li><Link to="/enroll" className="hover:text-white">Enroll</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-200">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <a href="mailto:chesssaga64@gmail.com" className="hover:text-white">
                chesssaga64@gmail.com
              </a>
            </li>
            <li>
              <a href="https://wa.me/917303746548" target="_blank" rel="noreferrer" className="hover:text-white">
                WhatsApp: +91 73037 46548
              </a>
            </li>
            <li>Office Hours: Mon-Sat, 9 AM - 7 PM IST</li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-200">Follow</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li><a href="https://www.instagram.com/chesssaga/" target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a></li>
            <li><a href="https://www.youtube.com/@ChessSaga" target="_blank" rel="noreferrer" className="hover:text-white">YouTube</a></li>
            <li><a href="https://www.facebook.com/p/Chess-Saga-100085311832249/" target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a></li>
          </ul>
        </section>
      </div>

      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Chess Saga. All rights reserved.
      </div>
    </footer>
  )
}
