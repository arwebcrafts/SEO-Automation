import { Search, Filter, Download } from "lucide-react";

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExport?: () => void;
}

export function FilterToolbar({ searchQuery, onSearchChange, onExport }: FilterToolbarProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by domain or URL..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 text-sm"
        />
      </div>
      <button className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm text-slate-700 dark:text-slate-300">
        <Filter className="w-4 h-4" />
        Filters
      </button>
      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm text-slate-700 dark:text-slate-300"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      )}
    </div>
  );
}
