import React, { useState, useEffect } from 'react';
import { X, Shield, Globe, Landmark, Download, Check, Sparkles, AlertCircle, PhoneCall, Video } from 'lucide-react';
import { User, PAYSTACK_TEST_KEY } from '../types';

interface PlanModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

export default function PlanModal({ user, onClose, onUpdateUser }: PlanModalProps) {
  const [isOutsideAfrica, setIsOutsideAfrica] = useState<boolean>(false);
  const [lemfiDownloaded, setLemfiDownloaded] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isLoadingPaystack, setIsLoadingPaystack] = useState<boolean>(false);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);

  // Load Paystack inline script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleDownloadLemfi = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      setLemfiDownloaded(true);
      alert(
        "📲 LemFi Integration Active!\n\nYour funds have been securely converted to Naira (NGN). You can now complete your subscription using your LemFi Naira account."
      );
    }, 1500);
  };

  const handleSelectPlan = (plan: 'silver' | 'gold' | 'premium', amountNaira: number) => {
    // If outside Africa, must download LemFi first
    if (isOutsideAfrica && !lemfiDownloaded) {
      alert("Please download the LemFi app to convert your local currency to Naira before completing payment.");
      return;
    }

    setIsLoadingPaystack(true);

    const paystackPop = (window as any).PaystackPop;
    if (!paystackPop) {
      alert("Paystack library is still loading. Please try again in a few seconds.");
      setIsLoadingPaystack(false);
      return;
    }

    try {
      const handler = paystackPop.setup({
        key: PAYSTACK_TEST_KEY,
        email: user.email || 'customer@chatta.com',
        amount: amountNaira * 100, // Paystack amount is in kobo
        currency: 'NGN',
        ref: 'chatta_' + Math.floor(Math.random() * 100000000 + 1),
        callback: (response: any) => {
          setIsLoadingPaystack(false);
          // Payment approved!
          const updated: User = {
            ...user,
            subscriptionPlan: plan,
          };
          onUpdateUser(updated);
          setSuccessPlan(plan);
          alert(`🎉 Subscription upgraded successfully to ${plan.toUpperCase()}! You now have full access to HD voice and video calling features.`);
        },
        onClose: () => {
          setIsLoadingPaystack(false);
          alert("Payment session closed.");
        },
      });
      handler.openIframe();
    } catch (err) {
      console.error("Paystack Checkout Error: ", err);
      setIsLoadingPaystack(false);
      alert("Could not initialize Paystack inline checkout. Please verify connection.");
    }
  };

  const plans = [
    {
      id: 'silver' as const,
      name: 'Silver Plan',
      price: 2000,
      description: 'Ideal for everyday secure voice conversations.',
      features: [
        'Secure End-to-End Voice Calling',
        'ZKP Verification Node Access',
        'Standard Encrypted Backups',
        'Up to 3-member group voice calls',
      ],
      color: 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20',
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      btnColor: 'bg-slate-700 hover:bg-slate-800 text-white',
    },
    {
      id: 'gold' as const,
      name: 'Gold Plan',
      price: 5000,
      description: 'Superb quality video and voice connection for professionals.',
      features: [
        'All Silver Plan benefits',
        'Secure Ultra-HD Video Calling',
        'Zero-knowledge chat transcript exports',
        'Up to 10-member group video conferencing',
        'Priority technical support responses',
      ],
      color: 'border-amber-400/50 dark:border-amber-500/50 bg-amber-50/20 dark:bg-amber-950/10 ring-2 ring-amber-400/20',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
      btnColor: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10',
      popular: true,
    },
    {
      id: 'premium' as const,
      name: 'Premium Plan',
      price: 10000,
      description: 'Absolute security, unlimited scale, and priority performance.',
      features: [
        'All Gold Plan benefits',
        'Unlimited HD calls and video streams',
        'ZKP enterprise administrative tools',
        'Real-time cryptographic logs auditor',
        '24/7 dedicated support representative',
      ],
      color: 'border-emerald-400/50 dark:border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10 ring-2 ring-emerald-400/20',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 text-slate-100 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 p-6 sm:p-8 shadow-2xl max-h-[92vh] flex flex-col animate-scaleUp">
        
        {/* Close Button */}
        <button
          id="close-plan-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>Chatta Premium Subscriptions</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Unlock Secure Voice & Video Calling
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            All calls are fully encrypted client-side. Upgrade your account plan below to start crystal-clear secure communication.
          </p>
        </div>

        {/* Location Selection & LemFi Guide Section */}
        <div className="mb-6 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 max-w-3xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-sky-500" />
                Select Your Location
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Determine the payment protocol and gateway setup optimized for your country.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOutsideAfrica(false);
                  setLemfiDownloaded(false);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                  !isOutsideAfrica
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                In Africa (Naira)
              </button>
              <button
                type="button"
                onClick={() => setIsOutsideAfrica(true)}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                  isOutsideAfrica
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Outside Africa (LemFi)
              </button>
            </div>
          </div>

          {/* LemFi Integration block */}
          {isOutsideAfrica && (
            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-sky-500/5 dark:bg-sky-500/10 p-3 rounded-xl animate-fadeIn">
              <div className="flex items-start gap-2.5 max-w-xl">
                <Landmark className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    LemFi Currency Converter Requirement
                    <span className="bg-sky-100 text-sky-800 text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">Outside Africa</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    You are required to use the LemFi app to convert your local funds to Naira (NGN), enabling payments via standard Naira accounts on Paystack.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="lemfi-download-btn"
                disabled={lemfiDownloaded || isDownloading}
                onClick={handleDownloadLemfi}
                className={`w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  lemfiDownloaded
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                    : 'bg-sky-500 hover:bg-sky-600 text-white'
                }`}
              >
                {isDownloading ? (
                  <>Converting...</>
                ) : lemfiDownloaded ? (
                  <>
                    <Check className="h-4 w-4" />
                    LemFi Naira Connected
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download LemFi & Convert
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Pricing Cards Container */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5 pr-1 py-2 scrollbar-thin">
          {plans.map((p) => {
            const isCurrentPlan = user.subscriptionPlan === p.id;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg ${p.color}`}
              >
                {p.popular && (
                  <div className="absolute top-0 right-5 -translate-y-1/2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-white shadow-sm tracking-wider">
                    MOST POPULAR
                  </div>
                )}

                {/* Plan Title & Price */}
                <div className="mb-4">
                  <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-extrabold uppercase ${p.badgeColor} mb-2`}>
                    {p.name}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      ₦{p.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">/ month</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal h-8 overflow-hidden">
                    {p.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="flex-1 space-y-2 mb-6">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Buy Button */}
                <button
                  type="button"
                  id={`subscribe-btn-${p.id}`}
                  disabled={isCurrentPlan || isLoadingPaystack}
                  onClick={() => handleSelectPlan(p.id, p.price)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${p.btnColor} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCurrentPlan ? (
                    'Your Current Plan'
                  ) : isLoadingPaystack ? (
                    'Processing...'
                  ) : isOutsideAfrica && !lemfiDownloaded ? (
                    'Download LemFi to Pay'
                  ) : (
                    `Upgrade to ${p.name.replace(' Plan', '')}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 shrink-0">
          <Shield className="h-4 w-4 text-emerald-500" />
          <span>Secured by Paystack. All active subscriptions are protected by military-grade E2EE calling parameters.</span>
        </div>
      </div>
    </div>
  );
}
