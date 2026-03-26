import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Search, BookOpen, X, Tag, Brain, FileCode, Globe, FileText, Clock, Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SearchResult {
  id: string;
  title: string;
  url: string;
  doc_type: string;
  snippet: string;
  keyphrases: string[];
  rank: number;
  created_at: string;
}

interface ContentInsight {
  id: string;
  title: string;
  url: string;
  doc_type: string;
  keyphrases: string[];
  topic?: { primary: string; confidence: number };
  entities?: Array<{ text: string; label: string }>;
  word_count: number;
  reading_time_seconds: number;
  language: string;
  complexity: number;
  text_snippet: string;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const DOC_ICONS: Record<string, React.ReactNode> = {
  webpage: <Globe size={13} />,
  pdf: <FileText size={13} />,
  docx: <FileText size={13} />,
  code: <FileCode size={13} />,
};

function complexityLabel(c: number) {
  if (c < 0.3) return { label: 'Easy', color: 'text-green-400' };
  if (c < 0.6) return { label: 'Medium', color: 'text-yellow-400' };
  return { label: 'Complex', color: 'text-red-400' };
}

// ============================================================================
// SEARCH RESULT ITEM
// ============================================================================

function ResultItem({
  result,
  selected,
  onClick,
}: {
  result: SearchResult;
  selected: boolean;
  onClick: () => void;
}) {
  const domain = result.url
    ? (() => { try { return new URL(result.url).hostname; } catch { return result.doc_type; } })()
    : result.doc_type;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
        selected
          ? 'bg-indigo-500/20 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-slate-400">{DOC_ICONS[result.doc_type] || <Globe size={13} />}</span>
        <span className="text-xs font-medium text-white truncate flex-1">{result.title || 'Untitled'}</span>
      </div>
      <p className="text-[11px] text-slate-500 truncate">{domain}</p>
      {result.snippet && (
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{result.snippet}</p>
      )}
      <p className="text-[10px] text-slate-600 mt-1">
        {new Date(result.created_at).toLocaleDateString()}
      </p>
    </button>
  );
}

// ============================================================================
// CONTENT INSIGHT PANEL
// ============================================================================

function InsightPanel({ item }: { item: ContentInsight | null }) {
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-600 p-8">
        <Brain size={40} className="mb-3 opacity-30" />
        <p className="text-sm">Select a result to view content insights</p>
      </div>
    );
  }

  const cpx = complexityLabel(item.complexity || 0);
  const readMin = Math.max(1, Math.ceil((item.reading_time_seconds || 0) / 60));
  const entityGroups: Record<string, string[]> = {};
  (item.entities || []).slice(0, 15).forEach(e => {
    if (!entityGroups[e.label]) entityGroups[e.label] = [];
    entityGroups[e.label].push(e.text);
  });

  return (
    <div className="p-5 space-y-5 overflow-y-auto h-full">
      {/* Title + meta */}
      <div>
        <h2 className="text-sm font-semibold text-white leading-snug">{item.title || 'Untitled'}</h2>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-indigo-400 hover:text-indigo-300 truncate block mt-0.5"
          >
            {item.url.substring(0, 60)}{item.url.length > 60 ? '…' : ''}
          </a>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: '📝', val: (item.word_count || 0).toLocaleString(), label: 'words' },
          { icon: '⏱', val: `${readMin}m`, label: 'read' },
          { icon: '🧠', val: cpx.label, label: 'level', cls: cpx.color },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-2.5 text-center border border-white/10">
            <div className="text-base">{s.icon}</div>
            <div className={`text-sm font-bold ${s.cls || 'text-white'}`}>{s.val}</div>
            <div className="text-[10px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Topic */}
      {item.topic && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Topic</p>
          <span className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {item.topic.primary}
          </span>
        </div>
      )}

      {/* Key Phrases */}
      {(item.keyphrases || []).length > 0 && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Tag size={10} /> Key Phrases
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.keyphrases.map(kp => (
              <span key={kp} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-700/60 text-slate-300 border border-white/10 hover:border-white/20 transition-colors cursor-default">
                {kp}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Entities */}
      {Object.keys(entityGroups).length > 0 && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Entities</p>
          <div className="space-y-2">
            {Object.entries(entityGroups).map(([label, texts]) => (
              <div key={label}>
                <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                <div className="flex flex-wrap gap-1">
                  {texts.map(t => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snippet */}
      {item.text_snippet && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Preview</p>
          <p className="text-[11px] text-slate-400 leading-relaxed bg-white/5 rounded-xl p-3 border border-white/10">
            {item.text_snippet}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function Knowledge() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [insight, setInsight] = useState<ContentInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Local SQLite FTS5 search via Tauri command
  const runLocalSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await invoke<SearchResult[]>('search_local', { query: q, limit: 30 });
      setResults(res);
    } catch {
      // fallback to API search
      try {
        const r = await fetch(`${API_BASE}/api/v1/content/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, limit: 20 }),
        });
        if (r.ok) {
          const data = await r.json();
          setResults(data.results || []);
        }
      } catch (_) {}
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => runLocalSearch(query), 300);
  }, [query, runLocalSearch]);

  // Fetch full insight from API on selection
  useEffect(() => {
    if (!selected) { setInsight(null); return; }
    setLoadingInsight(true);
    fetch(`${API_BASE}/api/v1/content/${selected.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setInsight(data))
      .catch(() => setInsight(null))
      .finally(() => setLoadingInsight(false));
  }, [selected]);

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Left Panel — Search */}
      <div className="w-80 flex-shrink-0 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} className="text-indigo-400" />
            <h1 className="text-sm font-bold">Knowledge Search</h1>
          </div>
          {/* Search input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            {searching && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />}
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search locally…"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none text-xs text-white placeholder-slate-500 transition-all"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!query.trim() ? (
            <div className="text-center py-12 text-slate-600">
              <Search size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Type to search captured content</p>
              <p className="text-[10px] mt-1">Works offline · SQLite FTS5</p>
            </div>
          ) : results.length === 0 && !searching ? (
            <div className="text-center py-10 text-slate-600">
              <BookOpen size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No results found</p>
            </div>
          ) : (
            results.map(r => (
              <ResultItem
                key={r.id}
                result={r}
                selected={selected?.id === r.id}
                onClick={() => setSelected(r)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Panel — Insight */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Panel header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <Tag size={14} /> Content Insights
          </h2>
          {selected && (
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5">
              <X size={14} />
            </button>
          )}
        </div>

        {loadingInsight ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 size={24} className="text-indigo-400 animate-spin" />
          </div>
        ) : (
          <InsightPanel item={insight} />
        )}
      </div>
    </div>
  );
}
