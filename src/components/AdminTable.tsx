'use client';

import { useState } from 'react';
import { toggleAttended, updateNotes } from '@/app/actions';
import { Check, X, Users, Search } from 'lucide-react';
import type { Registration } from '@/server/db/schema';

export default function AdminTable({ data }: { data: Registration[] }) {
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesTemp, setNotesTemp] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  const filteredData = data.filter((row) => {
    const q = searchQuery.toLowerCase();
    return (
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.phone.toLowerCase().includes(q) ||
      row.status.toLowerCase().includes(q)
    );
  });

  async function handleToggleAttended(id: number, currentStatus: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      await toggleAttended(id, currentStatus);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div>
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-b-lg border-x border-b border-gray-200 shadow">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name / Contact</th>
              <th className="px-4 py-3 text-center">Attended</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Companions</th>
              <th className="px-4 py-3">Equipment</th>
              <th className="px-4 py-3">Admin Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => {
            const isLoading = loadingIds.has(row.id);

            return (
            <tr key={row.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{row.id}</td>
              <td className="px-4 py-3">
                <div className="font-semibold text-gray-900">{row.name}</div>
                <div className="text-xs text-gray-500">{row.email}</div>
                <div className="text-xs text-gray-500">{row.phone}</div>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => {
                    void handleToggleAttended(row.id, row.attended);
                  }}
                  aria-busy={isLoading}
                  className={`p-2 rounded-full transition-colors ${
                    isLoading
                      ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                      : row.attended
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {row.attended ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs ${
                  row.status === 'local' ? 'bg-blue-100 text-blue-800' :
                  row.status === 'thai_tourist' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-3 text-center font-medium">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  {row.companions}
                </div>
              </td>
              <td className="px-4 py-3">
                {row.equipment === 'none' ? <span className="text-gray-400">None</span> : 
                 row.equipment === 'telescope' ? 'Telescope' : 'Camera Stand'}
              </td>
              <td className="px-4 py-3 min-w-[200px]">
                {editingNotesId === row.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={notesTemp}
                      onChange={(e) => setNotesTemp(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Add note..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateNotes(row.id, notesTemp);
                          setEditingNotesId(null);
                        } else if (e.key === 'Escape') {
                          setEditingNotesId(null);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        updateNotes(row.id, notesTemp);
                        setEditingNotesId(null);
                      }}
                      className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setEditingNotesId(row.id);
                      setNotesTemp(row.adminNotes || '');
                    }}
                    className="cursor-pointer p-2 rounded hover:bg-gray-100 min-h-[36px] text-gray-700"
                  >
                    {row.adminNotes ? (
                      <span>{row.adminNotes}</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Click to add note...</span>
                    )}
                  </div>
                )}
              </td>
            </tr>
          );
          })}
          {filteredData.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                No registrations found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
