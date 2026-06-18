import Link from 'next/link';
import { db } from '@/server/db';
import { registrations } from '@/server/db/schema';
import { asc } from 'drizzle-orm';
import StatsChart from '@/components/StatsChart';
import type { StatsRegistrationRecord } from '@/types/stats';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const allData = await db
    .select()
    .from(registrations)
    .orderBy(asc(registrations.createdAt));

  const totalRegistrations = allData.length;
  const totalCompanions = allData.reduce((acc, row) => acc + (row.companions ?? 0), 0);
  const totalPeople = totalRegistrations + totalCompanions;
  const checkedInPeople = allData
    .filter((row) => row.attended)
    .reduce((acc, row) => acc + 1 + (row.companions ?? 0), 0);
  const notYetCheckedInPeople = Math.max(totalPeople - checkedInPeople, 0);
  const chartSource: StatsRegistrationRecord[] = allData.map((row) => ({
    id: row.id,
    companions: row.companions ?? 0,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Registration Stats & Forecast</h1>
            <p className="text-gray-500">
              Track expected attendance by hour and extrapolate future totals from the historical average trend.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-sm font-medium text-gray-500">Total Registrations</div>
            <div className="text-3xl font-bold text-indigo-600">{totalRegistrations}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-sm font-medium text-gray-500">Total Companions</div>
            <div className="text-3xl font-bold text-indigo-600">{totalCompanions}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-sm font-medium text-gray-500">Total Expected People</div>
            <div className="text-3xl font-bold text-green-600">{totalPeople}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-sm font-medium text-gray-500">Checked In</div>
            <div className="text-3xl font-bold text-green-600">{checkedInPeople}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-sm font-medium text-gray-500">Not Yet Checked In</div>
            <div className="text-3xl font-bold text-amber-600">{notYetCheckedInPeople}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-sm font-medium text-gray-500">Average People Per Registration</div>
            <div className="text-3xl font-bold text-indigo-600">
              {totalRegistrations === 0 ? '0.0' : (totalPeople / totalRegistrations).toFixed(1)}
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Expected Attendance by Hour</h2>
            <p className="text-sm text-gray-500">
              Bars show hourly expected people. Solid lines are actual totals and dashed lines show projection.
            </p>
          </div>
          <StatsChart data={chartSource} />
        </section>
      </div>
    </div>
  );
}
