import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, FileText, Edit3, Trash2, Tag,
  Calendar, ChevronRight, BookOpen, X, Save
} from "lucide-react";
import { notes as initialNotes, type Note } from "../data/mockData";

const adminNotes = [
  {
    id: "admin1",
    problemTitle: "Two Pointers - Complete Guide",
    content: "## Two Pointers Technique\n\nUse when array is sorted or you need O(n) from O(n²).\n\n**Classic pattern:**\n```\nleft = 0, right = n - 1\nwhile left < right:\n  if condition: left++\n  else: right--\n```\n\n**Problems:** Two Sum II, 3Sum, Container with Most Water",
    tags: ["technique", "admin", "two-pointers"],
    createdAt: "2026-04-01",
    updatedAt: "2026-04-08",
    isAdmin: true
  },
  {
    id: "admin2",
    problemTitle: "DP Problem Identification",
    content: "## When to use DP?\n\n1. **Optimal substructure** – optimal solution uses optimal sub-solutions\n2. **Overlapping subproblems** – same subproblems computed multiple times\n\n**Common patterns:**\n- 0/1 Knapsack\n- Fibonacci / Climbing Stairs\n- LCS / LIS\n- Matrix chain\n\n**Memoization vs Tabulation:** Top-down vs Bottom-up",
    tags: ["dp", "admin", "patterns"],
    createdAt: "2026-03-28",
    updatedAt: "2026-04-05",
    isAdmin: true
  }
];

export default function Notes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([...initialNotes]);
  const [search, setSearch] = useState("");
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showAdminNotes, setShowAdminNotes] = useState(true);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [showNewNote, setShowNewNote] = useState(false);

  const allNotes = showAdminNotes
    ? [...adminNotes.map(n => ({ ...n, problemId: "" })), ...notes]
    : notes;

  const filtered = allNotes.filter(n =>
    n.problemTitle.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleEdit = () => {
    setEditContent(activeNote?.content || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (activeNote) {
      setNotes(prev => prev.map(n =>
        n.id === activeNote.id ? { ...n, content: editContent, updatedAt: new Date().toISOString().split("T")[0] } : n
      ));
      setActiveNote(prev => prev ? { ...prev, content: editContent } : null);
    }
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  };

  const createNewNote = () => {
    if (!newNoteTitle.trim()) return;
    const newNote: Note = {
      id: `note${Date.now()}`,
      problemId: "",
      problemTitle: newNoteTitle,
      content: "Start writing your notes here...",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      tags: []
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNote(newNote);
    setEditContent(newNote.content);
    setIsEditing(true);
    setShowNewNote(false);
    setNewNoteTitle("");
  };

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Sidebar List */}
      <div className="w-80 flex-shrink-0 border-r border-[#30363d] bg-[#161b22] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#30363d]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white" style={{ fontSize: '16px', fontWeight: 700 }}>Notes</h1>
            <button
              onClick={() => setShowNewNote(true)}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3 py-1.5 transition-colors"
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>

          {/* New Note Input */}
          {showNewNote && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newNoteTitle}
                onChange={e => setNewNoteTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createNewNote()}
                placeholder="Note title..."
                className="flex-1 bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 text-white placeholder-[#8b949e] focus:outline-none focus:border-orange-500/50"
                style={{ fontSize: '12px' }}
                autoFocus
              />
              <button onClick={createNewNote} className="text-green-400 hover:text-green-300 p-1.5">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={() => setShowNewNote(false)} className="text-[#8b949e] hover:text-white p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8b949e]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-[#21262d] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-white placeholder-[#8b949e] focus:outline-none focus:border-orange-500/50"
              style={{ fontSize: '12px' }}
            />
          </div>

          {/* Admin Toggle */}
          <button
            onClick={() => setShowAdminNotes(!showAdminNotes)}
            className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all w-full ${showAdminNotes ? "border-purple-500/30 bg-purple-500/10 text-purple-400" : "border-[#30363d] text-[#8b949e] hover:text-white"}`}
            style={{ fontSize: '11px' }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Admin Notes {showAdminNotes ? "(showing)" : "(hidden)"}
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((note) => {
            const isAdmin = "isAdmin" in note && note.isAdmin;
            return (
              <div
                key={note.id}
                onClick={() => { setActiveNote(note as Note); setIsEditing(false); }}
                className={`p-3 border-b border-[#30363d]/50 cursor-pointer hover:bg-[#21262d] transition-colors ${activeNote?.id === note.id ? "bg-[#21262d]" : ""}`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <FileText className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isAdmin ? "text-purple-400" : "text-orange-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate" style={{ fontSize: '13px', fontWeight: 600 }}>{note.problemTitle}</p>
                    {isAdmin && <span className="text-purple-400 bg-purple-500/10 rounded px-1.5 py-0.5" style={{ fontSize: '10px' }}>Admin</span>}
                  </div>
                </div>
                <p className="text-[#8b949e] truncate pl-6" style={{ fontSize: '11px' }}>
                  {note.content.replace(/[#\n*`]/g, " ").substring(0, 60)}...
                </p>
                <div className="flex items-center gap-2 mt-1.5 pl-6">
                  <Calendar className="w-3 h-3 text-[#8b949e]" />
                  <span className="text-[#8b949e]" style={{ fontSize: '10px' }}>{note.updatedAt}</span>
                  <div className="flex gap-1 ml-auto">
                    {note.tags.slice(0, 2).map(t => (
                      <span key={t} className="bg-[#30363d] text-[#8b949e] rounded px-1.5 py-0.5" style={{ fontSize: '9px' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeNote ? (
          <>
            {/* Note Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#30363d] bg-[#161b22] flex-shrink-0">
              <div className="flex-1">
                <h2 className="text-white" style={{ fontSize: '16px', fontWeight: 700 }}>{activeNote.problemTitle}</h2>
                <div className="flex gap-2 mt-1">
                  {activeNote.tags.map(t => (
                    <span key={t} className="bg-[#21262d] text-[#8b949e] rounded-md px-2 py-0.5 border border-[#30363d]" style={{ fontSize: '10px' }}>
                      <Tag className="w-2.5 h-2.5 inline mr-1" />{t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white rounded-lg px-3 py-1.5 transition-colors"
                    style={{ fontSize: '12px' }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-1.5 transition-colors"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                )}
                {!("isAdmin" in activeNote && activeNote.isAdmin) && (
                  <button
                    onClick={() => handleDelete(activeNote.id)}
                    className="p-1.5 text-[#8b949e] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full h-full bg-[#0d1117] text-[#c9d1d9] p-6 focus:outline-none resize-none"
                  style={{ fontSize: '14px', fontFamily: 'monospace', lineHeight: 1.8 }}
                />
              ) : (
                <div className="p-6 overflow-y-auto h-full">
                  <pre className="text-[#c9d1d9] whitespace-pre-wrap font-sans" style={{ fontSize: '14px', lineHeight: 1.8 }}>
                    {activeNote.content}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8b949e]">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p style={{ fontSize: '16px', fontWeight: 600 }}>Select a note to view</p>
            <p style={{ fontSize: '13px' }}>or create a new one</p>
            <button
              onClick={() => setShowNewNote(true)}
              className="mt-4 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 transition-colors"
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              <Plus className="w-4 h-4" /> Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
