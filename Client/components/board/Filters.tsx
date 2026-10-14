"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PRIORITIES, type User } from "@/lib/types";
import { useBoardStore } from "@/stores/boardStore";

export function Filters({ members }: { members: User[] }) {
  const {
    query,
    priorityFilter,
    assigneeFilter,
    setFilters,
  } = useBoardStore();

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          className="pl-9"
          placeholder="Search tasks…"
          value={query}
          onChange={(e) => setFilters({ query: e.target.value })}
        />
      </div>
      <Select
        className="sm:w-40"
        value={priorityFilter}
        onChange={(e) => setFilters({ priorityFilter: e.target.value })}
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </Select>
      <Select
        className="sm:w-48"
        value={assigneeFilter}
        onChange={(e) => setFilters({ assigneeFilter: e.target.value })}
      >
        <option value="">All assignees</option>
        {members.map((m) => (
          <option key={m._id} value={m._id}>
            {m.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
