import { useState } from "react";
import { Youtube, Star, Play, Eye, EyeOff, ExternalLink, Gem } from "lucide-react";
import { playlists } from "../data/mockData";

const topics = ["All", "DSA Complete", "LeetCode Patterns", "Graphs", "Dynamic Programming", "Web Dev", "System Design"];

export default function Playlists() {
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [showHidden, setShowHidden] = useState(true);

  const filtered = playlists.filter(p => {
    if (!showHidden && p.isHidden) return false;
    if (selectedTopic !== "All" && p.topic !== selectedTopic) return false;
    return true;
  });

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white mb-1 flex items-center gap-3" style={{ fontSize: '22px', fontWeight: 700 }}>
          <Youtube className="w-6 h-6 text-red-500" />
          Smart Playlist Recommendations
        </h1>
        <p className="text-[#8b949e]" style={{ fontSize: '14px' }}>
          Curated YouTube playlists — including hidden gems you won't find easily!
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-2 overflow-x-auto">
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap border transition-all flex-shrink-0 ${
                selectedTopic === t
                  ? "border-orange-500 bg-orange-500/10 text-orange-400"
                  : "border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white"
              }`}
              style={{ fontSize: '13px' }}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowHidden(!showHidden)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ml-auto ${
            showHidden ? "border-purple-500/30 bg-purple-500/10 text-purple-400" : "border-[#30363d] bg-[#161b22] text-[#8b949e]"
          }`}
          style={{ fontSize: '13px' }}
        >
          {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Hidden Gems
        </button>
      </div>

      {/* Hidden Gems Banner */}
      {showHidden && (
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Gem className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400" style={{ fontSize: '13px', fontWeight: 600 }}>Hidden Gems Section</span>
          </div>
          <p className="text-[#8b949e]" style={{ fontSize: '12px' }}>
            Channels marked with 💎 are underrated but extremely high-quality. Most DSA learners don't know about them!
          </p>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((playlist) => (
          <div key={playlist.id} className={`bg-[#161b22] border rounded-xl overflow-hidden hover:border-orange-500/30 transition-all group ${playlist.isHidden ? "border-purple-500/20" : "border-[#30363d]"}`}>
            {/* Thumbnail */}
            <div className="relative h-36 bg-[#21262d] overflow-hidden">
              <img
                src={playlist.thumbnail}
                alt={playlist.title}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              {playlist.isHidden && (
                <div className="absolute top-2 left-2 bg-purple-500 rounded-full px-2 py-0.5 flex items-center gap-1">
                  <Gem className="w-3 h-3 text-white" />
                  <span className="text-white" style={{ fontSize: '10px', fontWeight: 700 }}>Hidden Gem</span>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-1 flex items-center gap-1">
                <Play className="w-3 h-3 text-white" />
                <span className="text-white" style={{ fontSize: '10px' }}>{playlist.videoCount} videos</span>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className="bg-[#161b22]/80 text-[#8b949e] rounded-md px-2 py-0.5" style={{ fontSize: '10px' }}>{playlist.topic}</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white group-hover:text-orange-400 transition-colors" style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.4 }}>
                  {playlist.title}
                </h3>
                <a href={playlist.url} target="_blank" rel="noopener noreferrer" className="text-[#8b949e] hover:text-white ml-2 flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Youtube className="w-3 h-3 text-red-400" />
                </div>
                <span className="text-[#8b949e]" style={{ fontSize: '12px' }}>{playlist.channel}</span>
              </div>

              <p className="text-[#8b949e] mb-3" style={{ fontSize: '11px', lineHeight: 1.6 }}>{playlist.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(playlist.rating) ? "text-yellow-400 fill-yellow-400" : "text-[#30363d]"}`} />
                  ))}
                  <span className="text-[#8b949e] ml-1" style={{ fontSize: '11px' }}>{playlist.rating}</span>
                </div>
                <a
                  href={playlist.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg px-3 py-1.5 transition-colors"
                  style={{ fontSize: '11px', fontWeight: 600 }}
                >
                  <Play className="w-3 h-3" /> Watch
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
