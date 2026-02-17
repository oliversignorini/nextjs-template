'use client'

import { useState, useMemo } from 'react'
import { useDestinations } from '@/lib/api'
import { destinationTypeBadgeClass, formatBudget } from '@/lib/badge-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'
import type { DestinationType } from '@/types'

type SortField = 'name' | 'country' | 'continent' | 'type' | 'averageDailyCost'
type SortDirection = 'asc' | 'desc'

const ALL_TYPES: DestinationType[] = [
  'City',
  'Beach',
  'Mountain',
  'Cultural',
  'Adventure',
  'Island',
  'Countryside',
]

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 w-1/4 rounded bg-border" />
          <div className="h-4 w-1/4 rounded bg-muted" />
          <div className="h-4 w-1/6 rounded bg-muted" />
          <div className="h-4 w-1/6 rounded bg-muted" />
          <div className="h-4 w-1/6 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

function SortIndicator({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField
  sortField: SortField | null
  sortDirection: SortDirection
}) {
  if (sortField !== field) {
    return <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />
  }
  return sortDirection === 'asc' ? (
    <ChevronUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3" />
  )
}

export function DestinationsTable() {
  const { data: destinations, isLoading, error } = useDestinations()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSorted = useMemo(() => {
    if (!destinations) return []

    let result = [...destinations]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) => d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q),
      )
    }

    if (typeFilter) {
      result = result.filter((d) => d.type === typeFilter)
    }

    if (sortField) {
      result.sort((a, b) => {
        let cmp: number
        if (sortField === 'averageDailyCost') {
          cmp = a.averageDailyCost - b.averageDailyCost
        } else {
          cmp = a[sortField].localeCompare(b[sortField])
        }
        return sortDirection === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [destinations, search, typeFilter, sortField, sortDirection])

  if (isLoading) return <LoadingSkeleton />

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-destructive">
          Failed to load destinations. Please try again later.
        </CardContent>
      </Card>
    )
  }

  if (!destinations || destinations.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No destinations found.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">All Types</option>
          {ALL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filteredAndSorted.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No matching destinations found.
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('name')}
              >
                Name
                <SortIndicator field="name" sortField={sortField} sortDirection={sortDirection} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('country')}
              >
                Country
                <SortIndicator
                  field="country"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('continent')}
              >
                Continent
                <SortIndicator
                  field="continent"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('type')}
              >
                Type
                <SortIndicator field="type" sortField={sortField} sortDirection={sortDirection} />
              </TableHead>
              <TableHead>Best Season</TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort('averageDailyCost')}
              >
                Avg Daily Cost
                <SortIndicator
                  field="averageDailyCost"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </TableHead>
              <TableHead>Visited</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((dest) => (
              <TableRow key={dest.id}>
                <TableCell className="font-medium">{dest.name}</TableCell>
                <TableCell>{dest.country}</TableCell>
                <TableCell>{dest.continent}</TableCell>
                <TableCell>
                  <Badge className={destinationTypeBadgeClass(dest.type)}>{dest.type}</Badge>
                </TableCell>
                <TableCell>{dest.bestSeason}</TableCell>
                <TableCell className="text-right">{formatBudget(dest.averageDailyCost)}</TableCell>
                <TableCell>
                  {dest.isVisited ? (
                    <Badge className="border-transparent bg-emerald-100 text-emerald-600">
                      Visited
                    </Badge>
                  ) : (
                    <Badge className="border-transparent bg-brand-grey-300 text-brand-grey-600">
                      Not Yet
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
