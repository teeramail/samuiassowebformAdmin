import Link from 'next/link';
import { db } from '@/server/db';
import { registrations } from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import AdminTable from '@/components/AdminTable';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const allData = await db.select().from(registrations).orderBy(desc(registrations.createdAt));
  
  const totalBookings = allData.length;
  const totalCompanions = allData.reduce((acc, curr) => acc + (curr.companions ?? 0), 0);
  const totalPeople = totalBookings + totalCompanions;
  
  const attendedCount = allData.filter(r => r.attended).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Registration Admin Dashboard</h1>
            <p className="text-gray-500">Manage attendees and track event numbers</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/stats"
              className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50"
            >
              Stats / Forecast
            </Link>
            <a
              href="/api/export/registrations"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Download Excel
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Registrations</div>
            <div className="text-3xl font-bold text-indigo-600">{totalBookings}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Companions</div>
            <div className="text-3xl font-bold text-indigo-600">{totalCompanions}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Total People Expected</div>
            <div className="text-3xl font-bold text-indigo-600">{totalPeople}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Checked In</div>
            <div className="text-3xl font-bold text-green-600">{attendedCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <AdminTable data={allData} />
        </div>
      </div>
    </div>
  );
}
