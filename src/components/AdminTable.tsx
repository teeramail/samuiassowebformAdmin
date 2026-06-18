'use client';

import { useMemo, useState } from 'react';
import { toggleAttended, updateNotes } from '@/app/actions';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, X, Users, Search } from 'lucide-react';
import type { Registration } from '@/server/db/schema';

type SortKey = 'id' | 'name' | 'attended' | 'status' | 'companions' | 'equipment' | 'adminNotes';
type SortDirection = 'asc' | 'desc' | null;
const THAI_CHARACTER_REGEX = /[\u0E00-\u0E7F]/;
const thaiNameCollator = new Intl.Collator('th', {
  numeric: true,
  sensitivity: 'base',
});
const englishNameCollator = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
});

const TABLE_HEADERS: Array<{ key: SortKey; label: string; className?: string }> = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name / Contact' },
  { key: 'attended', label: 'Attended', className: 'text-center' },
  { key: 'status', label: 'Type' },
  { key: 'companions', label: 'Companions' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'adminNotes', label: 'Admin Notes' },
];

function getSortValue(row: Registration, sortKey: SortKey): number | string {
  switch (sortKey) {
    case 'id':
      return row.id;
    case 'name':
      return row.name;
    case 'attended':
      return row.attended ? 1 : 0;
    case 'status':
      return row.status;
    case 'companions':
      return row.companions ?? 0;
    case 'equipment':
      return row.equipment;
    case 'adminNotes':
      return row.adminNotes ?? '';
  }
}

function compareValues(left: number | string, right: number | string, direction: Exclude<SortDirection, null>) {
  const result =
    typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right), undefined, {
          numeric: true,
          sensitivity: 'base',
        });

  return direction === 'asc' ? result : -result;
}

function hasThaiCharacters(value: string) {
  return THAI_CHARACTER_REGEX.test(value);
}

function compareNames(left: string, right: string, direction: Exclude<SortDirection, null>) {
  const leftIsThai = hasThaiCharacters(left);
  const rightIsThai = hasThaiCharacters(right);

  if (leftIsThai !== rightIsThai) {
    return leftIsThai ? -1 : 1;
  }

  const collator = leftIsThai ? thaiNameCollator : englishNameCollator;
  const result = collator.compare(left, right);

  return direction === 'asc' ? result : -result;
}

export default function AdminTable({ data }: { data: Registration[] }) {
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesTemp, setNotesTemp] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const nextRows = data.filter((row) => {
      const email = row.email ?? '';

      return (
        row.name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    });

    if (sortKey == null || sortDirection == null) {
      return nextRows;
    }

    return [...nextRows].sort((left, right) => {
      if (sortKey === 'name') {
        return compareNames(left.name, right.name, sortDirection);
      }

      return compareValues(getSortValue(left, sortKey), getSortValue(right, sortKey), sortDirection);
    });
  }, [data, searchQuery, sortDirection, sortKey]);

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

  function handleSort(columnKey: SortKey) {
    if (sortKey !== columnKey) {
      setSortKey(columnKey);
      setSortDirection('asc');
      return;
    }

    if (sortDirection === 'asc') {
      setSortDirection('desc');
      return;
    }

    if (sortDirection === 'desc') {
      setSortKey(null);
      setSortDirection(null);
      return;
    }

    setSortKey(columnKey);
    setSortDirection('asc');
  }

  function getSortIcon(columnKey: SortKey) {
    if (sortKey !== columnKey || sortDirection == null) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }

    if (sortDirection === 'asc') {
      return <ArrowUp className="h-3.5 w-3.5" />;
    }

    return <ArrowDown className="h-3.5 w-3.5" />;
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
              {TABLE_HEADERS.map((header) => (
                <th
                  key={header.key}
                  aria-sort={
                    sortKey === header.key
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  className={`px-4 py-3 ${header.className ?? ''}`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(header.key)}
                    className={`inline-flex items-center gap-1 font-semibold transition-colors hover:text-indigo-600 ${
                      sortKey === header.key ? 'text-indigo-600' : ''
                    }`}
                  >
                    <span>{header.label}</span>
                    {getSortIcon(header.key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => {
              const isLoading = loadingIds.has(row.id);

              return (
                <tr key={row.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-gray-900">{row.name}</div>
                      {row.isWalkIn && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                          Walk-in
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{row.email ?? 'No email'}</div>
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
                              void updateNotes(row.id, notesTemp);
                              setEditingNotesId(null);
                            } else if (e.key === 'Escape') {
                              setEditingNotesId(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            void updateNotes(row.id, notesTemp);
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
                          setNotesTemp(row.adminNotes ?? '');
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
