import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, ShieldCheck, Github } from 'lucide-react';
import BrandLogo from '../../components/shared/BrandLogo';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 mb-6 group transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <BrandLogo size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="w-7 h-7 text-sky-600" />
            Contact & Platform Support
          </h1>
          <p className="text-xs text-slate-500 mt-1">Get in touch with the platform engineering team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <Github className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">GitHub Repository & Issues</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For bug reports, technical inquiries, or feature requests, open an issue directly on our repository.
              </p>
            </div>
            <a
              href="https://github.com/aayushbhakare/interviewprep"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700"
            >
              Visit Repository &rarr;
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Administrative Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For account verification questions or administrative moderation assistance:
              </p>
              <div className="mt-2 text-xs font-mono font-semibold text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200">
                admin@interviewprep.local
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-400">
              Response time within 24–48 operational hours.
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Security & Responsible Disclosure
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            If you have identified a vulnerability or security flaw, please review our{' '}
            <Link to="/security" className="text-sky-600 font-semibold hover:underline">
              Security Policy
            </Link>{' '}
            for responsible disclosure guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
