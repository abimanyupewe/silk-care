'use client';

import Link from 'next/link';
import { CalendarClock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { addMonths } from '@/lib/months';
import type { SubscriptionSnapshot } from './LanggananPanel';

function remaining(endsAt: string, now: number) {
  const end = new Date(endsAt);
  const current = new Date(now);
  let months =
    (end.getUTCFullYear() - current.getUTCFullYear()) * 12 +
    end.getUTCMonth() -
    current.getUTCMonth();
  const afterMonths = addMonths(current, months);
  if (afterMonths > end) months -= 1;

  const monthBoundary = addMonths(current, Math.max(0, months));
  const totalHours = Math.max(0, Math.ceil((end.getTime() - monthBoundary.getTime()) / 3_600_000));
  const remainingDays = Math.max(0, Math.ceil((end.getTime() - now) / 86_400_000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return { months: Math.max(0, months), days, hours, remainingDays };
}

function shouldShowModal(endsAt: string, days: number) {
  if (days > 30) return false;
  const key = `silk-trial-reminder:${endsAt}`;
  if (days <= 1) return !window.sessionStorage.getItem(key);
  const lastShown = Number(window.localStorage.getItem(key) ?? 0);
  const cooldown = days <= 7 ? 24 * 3_600_000 : 7 * 24 * 3_600_000;

  return Date.now() - lastShown >= cooldown;
}

export function SubscriptionTrialNotice({
  subscription,
  langgananHref
}: {
  subscription: SubscriptionSnapshot | undefined;
  langgananHref: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [modalOpen, setModalOpen] = useState(false);
  const trial = subscription?.plan === 'FREE_TRIAL' && subscription.status === 'ACTIVE';
  const time = trial ? remaining(subscription.endsAt, now) : null;
  const remainingDays = time?.remainingDays;

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (trial && remainingDays != null && shouldShowModal(subscription.endsAt, remainingDays)) {
      setModalOpen(true);
      const key = `silk-trial-reminder:${subscription.endsAt}`;
      if (remainingDays <= 1) window.sessionStorage.setItem(key, 'shown');
      else window.localStorage.setItem(key, String(Date.now()));
    }
  }, [remainingDays, subscription?.endsAt, trial]);

  if (!trial || !time) return null;

  const countdown = `${time.months ? `${time.months} bulan ` : ''}${time.days} hari ${time.hours} jam`;

  return (
    <>
      <section
        className="border-b border-amber bg-amber-tint px-4 py-3"
        aria-label="Status masa gratis"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-amber-ink">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium sm:text-base">
              <span className="font-bold">Masa gratis aktif.</span> Sisa {countdown} sebelum profil
              perlu diperpanjang.
            </p>
          </div>
          <Link
            href={langgananHref}
            className="btn h-11 min-h-11 border-amber-ink bg-transparent px-4 text-sm font-semibold text-amber-ink hover:bg-white"
          >
            Lihat langganan
          </Link>
        </div>
      </section>

      {modalOpen ? (
        <div
          className="modal modal-open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trial-modal-title"
        >
          <div className="modal-box max-w-md rounded-none border border-border bg-white p-6 shadow-none">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-square btn-ghost absolute right-3 top-3 min-h-11 rounded-none"
              aria-label="Tutup pengingat"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <CalendarClock className="h-6 w-6 text-amber-ink" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-amber-ink">Masa gratis hampir berakhir</p>
            <h2 id="trial-modal-title" className="mt-1 pr-10 text-xl font-bold text-ink">
              Sisa {countdown}
            </h2>
            <p className="mt-2 text-base text-ink-muted">
              Perpanjang lebih awal agar profil layanan Anda tetap tampil di direktori SILK.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={langgananHref}
                className="btn min-h-11 rounded-none border-primary bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Perpanjang sekarang
              </Link>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn min-h-11 rounded-none border-border-strong bg-white px-4 text-sm font-semibold text-ink hover:bg-surface"
              >
                Ingatkan nanti
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            onClick={() => setModalOpen(false)}
            aria-label="Tutup pengingat"
          />
        </div>
      ) : null}
    </>
  );
}
