'use client';

import { useState, useMemo } from 'react';
import { Candidate } from '@/types';
import { CandidateRow } from './CandidateRow';

interface CandidateTableProps {
  candidates: Candidate[];
  onUpdateCandidate: (id: string, updates: Partial<Candidate>) => void;
  selectedCandidateId?: string;
}

type SortField = 'rank' | 'name' | 'overallScore' | 'skillsMatch' | 'experience' | 'education' | 'gpa';
type SortDirection = 'asc' | 'desc';

export function CandidateTable({ candidates, onUpdateCandidate, selectedCandidateId }: CandidateTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('overallScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState({
    minScore: 0,
    topN: 0, // 0 means show all
    skillsFilter: ''
  });

  // Expand selected candidate when it changes
  useMemo(() => {
    if (selectedCandidateId) {
      setExpandedIds(prev => new Set([...Array.from(prev), selectedCandidateId]));
    }
  }, [selectedCandidateId]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedAndFilteredCandidates = useMemo(() => {
    let result = [...candidates];

    // Apply filters
    if (filters.minScore > 0) {
      result = result.filter(c => c.overallScore >= filters.minScore);
    }

    if (filters.skillsFilter) {
      const skillsLower = filters.skillsFilter.toLowerCase();
      result = result.filter(c =>
        c.keySkills.some(skill => skill.toLowerCase().includes(skillsLower))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'overallScore':
          comparison = a.overallScore - b.overallScore;
          break;
        case 'skillsMatch':
          comparison = a.scores.skillsMatch - b.scores.skillsMatch;
          break;
        case 'experience':
          comparison = a.scores.experience - b.scores.experience;
          break;
        case 'education':
          comparison = a.scores.education - b.scores.education;
          break;
        case 'gpa':
          comparison = (a.gpa || 0) - (b.gpa || 0);
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Apply top N limit
    if (filters.topN > 0) {
      result = result.slice(0, filters.topN);
    }

    return result;
  }, [candidates, sortField, sortDirection, filters]);

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Min Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={filters.minScore || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) || 0 }))}
            placeholder="0"
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Show Top N</label>
          <select
            value={filters.topN}
            onChange={(e) => setFilters(prev => ({ ...prev, topN: parseInt(e.target.value) }))}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value={0}>All</option>
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Skill</label>
          <input
            type="text"
            value={filters.skillsFilter}
            onChange={(e) => setFilters(prev => ({ ...prev, skillsFilter: e.target.value }))}
            placeholder="e.g., Python"
            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>

        <div className="flex items-end">
          <span className="text-sm text-gray-500">
            Showing {sortedAndFilteredCandidates.length} of {candidates.length} candidates
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                #
              </th>
              <SortHeader field="name" label="Candidate" />
              <SortHeader field="overallScore" label="Score" />
              <SortHeader field="skillsMatch" label="Skills" />
              <SortHeader field="experience" label="Exp" />
              <SortHeader field="education" label="Edu" />
              <SortHeader field="gpa" label="GPA" />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Key Skills
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pages
              </th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredCandidates.map((candidate, index) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                rank={index + 1}
                isExpanded={expandedIds.has(candidate.id)}
                onToggleExpand={() => toggleExpand(candidate.id)}
                onUpdate={(updates) => onUpdateCandidate(candidate.id, updates)}
              />
            ))}
          </tbody>
        </table>

        {sortedAndFilteredCandidates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No candidates match the current filters
          </div>
        )}
      </div>
    </div>
  );
}
