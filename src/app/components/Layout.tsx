import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Code2, BookOpen, FileText, Youtube,
  Map, BarChart2, RefreshCw, Trophy, Swords,
  MessageSquare, Flame, ChevronLeft, ChevronRight,
  Bell, Search, Zap, Star, Brain, Target, Menu, X,
  Eye, AlertTriangle, Shield, Shuffle, Users, Activity, Dna,
  ChevronDown, Sparkles, Lightbulb
} from "lucide-react";
import { userStats } from "../data/mockData";

const mainNav = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", color: "#ff6500" },
  { icon: Code2, label: "Problems", path: "/problems", color: "#00d4ff" },
  { icon: Map, label: "My Roadmap", path: "/roadmap", color: "#ff6500" },
  { icon: BookOpen, label: "Sheets", path: "/sheets", color: "#a855f7" },
  { icon: FileText, label: "Notes", path: "/notes", color: "#22c55e" },
  { icon: Youtube, label: "Playlists", path: "/playlists", color: "#ef4444" },
  { icon: BarChart2, label: "Analytics", path: "/analytics", color: "#00d4ff" },
  { icon: Lightbulb, label: "CS Fundamentals Quiz", path: "/quiz", color: "#ec4899" },
  { icon: RefreshCw, label: "Revision", path: "/revision", color: "#f59e0b" },
  { icon: Trophy, label: "Daily Challenge", path: "/daily", color: "#ff6500" },
  { icon: Swords, label: "Mock Interview", path: "/mock-interview", color: "#a855f7" },
  { icon: MessageSquare, label: "AI Chatbot", path: "/chatbot", color: "#00d4ff" },
  { icon: Brain, label: "ELI5 Mode", path: "/eli5", color: "#ec4899" },
];

const newFeatures = [
  { icon: Eye, label: "Code Visualizer", path: "/visualizer", color: "#00d4ff", badge: "NEW" },
  { icon: AlertTriangle, label: "Mistake Patterns", path: "/mistakes", color: "#f59e0b", badge: "NEW" },
  { icon: Shield, label: "Boss Battle", path: "/boss-battle", color: "#ef4444", badge: "NEW" },
  { icon: Shuffle, label: "Reverse Mode", path: "/reverse", color: "#a855f7", badge: "NEW" },
  { icon: Users, label: "Interview Persona", path: "/personality", color: "#22c55e", badge: "NEW" },
  { icon: Activity, label: "Live Heatmap", path: "/heatmap", color: "#00d4ff", badge: "NEW" },
  { icon: Dna, label: "Code DNA Profile", path: "/dna", color: "#ec4899", badge: "NEW" },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newFeaturesOpen, setNewFeaturesOpen] = useState(true);
  const navigate = useNavigate();

  const streakPct = (userStats.xp / userStats.nextLevelXp) * 100;

  // Open Web Dev Playground
  const openPlayground = () => {
    window.location.href = "/playground.html";
  };

  const NavItem = ({ icon: Icon, label, path, color, badge }: { icon: any; label: string; path: string; color: string; badge?: string }) => (
    <NavLink
      to={path}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative cursor-pointer
        ${isActive
          ? "bg-[#ff6500]/10 border border-[#ff6500]/20"
          : "border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
              style={{ background: color, boxShadow: `0 0 8px ${color}` }}
            />
          )}
          <div
            className={`flex-shrink-0 p-1 rounded-md transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
            style={isActive ? { backgroundColor: `${color}20` } : {}}
          >
            <Icon
              className="w-[16px] h-[16px]"
              style={{ color: isActive ? color : undefined }}
            />
          </div>
          {!collapsed && (
            <>
              <span
                className={`flex-1 truncate transition-colors duration-200`}
                style={{
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: isActive ? color : '#8b949e',
                }}
              >
                {label}
              </span>
              {badge && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                  style={{
                    background: `${color}20`,
                    color: color,
                    border: `1px solid ${color}40`
                  }}
                >
                  {badge}
                </span>
              )}
              {isActive && !badge && (
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 pulse-animation"
                  style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                />
              )}
            </>
          )}
          {collapsed && (
            <div
              className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl"
              style={{
                fontSize: '12px',
                fontWeight: 500,
                background: '#0f1628',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff'
              }}
            >
              {label}
              {badge && <span className="ml-2" style={{ color }}>{badge}</span>}
            </div>
          )}
        </>
      )}
    </NavLink>
  );

  // Playground Button Component
  const PlaygroundButton = () => {
    const [isHovered, setIsHovered] = useState(false);
    const color = "#6366f1";

    return (
      <button
        onClick={openPlayground}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative cursor-pointer w-full
          border ${isHovered ? 'bg-white/[0.04] border-white/[0.06]' : 'border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]'}`}
      >
        {isHovered && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
        )}
        <div
          className={`flex-shrink-0 p-1 rounded-md transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
          style={isHovered ? { backgroundColor: `${color}20` } : {}}
        >
          <Lightbulb
            className="w-[16px] h-[16px]"
            style={{ color: isHovered ? color : undefined }}
          />
        </div>
        {!collapsed && (
          <>
            <span
              className={`flex-1 truncate transition-colors duration-200`}
              style={{
                fontSize: '12.5px',
                fontWeight: 500,
                color: isHovered ? color : '#8b949e',
              }}
            >
              Web Dev Playground
            </span>
            {isHovered && (
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 pulse-animation"
                style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
              />
            )}
          </>
        )}
        {collapsed && (
          <div
            className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl"
            style={{
              fontSize: '12px',
              fontWeight: 500,
              background: '#0f1628',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff'
            }}
          >
            Web Dev Playground
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080b14' }}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`
          fixed lg:relative z-50 flex flex-col h-full
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          background: 'linear-gradient(180deg, #0a0e1a 0%, #080b14 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          transition: 'transform 0.3s ease, width 0.25s ease'
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', minHeight: '64px' }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, #ff6500, #ff9500)',
              boxShadow: '0 0 15px rgba(255,101,0,0.5), 0 0 30px rgba(255,101,0,0.2)'
            }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="shimmer-text" style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px' }}>AlgoAI</div>
                <div style={{ fontSize: '10px', color: '#4a5568', fontWeight: 500 }}>Smart DSA Platform</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {/* Main Navigation */}
          {mainNav.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}

          {/* Divider */}
          <div className="my-2 mx-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

          {/* New Features Section */}
          {!collapsed && (
            <button
              onClick={() => setNewFeaturesOpen(!newFeaturesOpen)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/[0.03]"
            >
              <Sparkles className="w-3 h-3" style={{ color: '#ff6500' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#ff6500', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                New Features
              </span>
              <ChevronDown
                className={`w-3 h-3 ml-auto transition-transform ${newFeaturesOpen ? 'rotate-180' : ''}`}
                style={{ color: '#ff6500' }}
              />
            </button>
          )}
          {collapsed && <div className="mx-1 my-1 h-px" style={{ background: 'rgba(255,101,0,0.2)' }} />}

          <AnimatePresence>
            {(newFeaturesOpen || collapsed) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-0.5 overflow-hidden"
              >
                {newFeatures.map((item) => (
                  <NavItem key={item.path} {...item} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider before Tools */}
          <div className="my-2 mx-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

          {/* Web Dev Playground */}
          <PlaygroundButton />
        </nav>

        {/* User Section */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #ff6500, #a855f7)',
                      boxShadow: '0 0 12px rgba(255,101,0,0.4)'
                    }}
                  >
                    <span className="text-white" style={{ fontSize: '10px', fontWeight: 800 }}>{userStats.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white truncate" style={{ fontSize: '12px', fontWeight: 700 }}>{userStats.name}</div>
                    <div style={{ fontSize: '10px', color: '#4a5568' }}>{userStats.level}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Flame className="w-3.5 h-3.5" style={{ color: '#ff6500' }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#ff6500' }}>{userStats.streak}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: '10px', color: '#4a5568' }}>Level Progress</span>
                    <span style={{ fontSize: '10px', color: '#ff6500', fontWeight: 600 }}>{userStats.xp}/{userStats.nextLevelXp} XP</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${streakPct}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #ff6500, #ff9500)',
                        boxShadow: '0 0 8px rgba(255,101,0,0.6)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center py-3 flex-shrink-0 transition-colors"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            color: '#4a5568',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ff6500')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a5568')}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </motion.aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Nav */}
        <header
          className="flex items-center gap-3 px-4 lg:px-6 py-3 flex-shrink-0"
          style={{
            background: 'rgba(8,11,20,0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            minHeight: '64px'
          }}
        >
          <button
            className="lg:hidden transition-colors"
            style={{ color: '#4a5568' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff6500')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4a5568')}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a5568' }} />
            <input
              type="text"
              placeholder="Search problems, topics..."
              className="w-full rounded-xl pl-9 pr-4 py-2 text-white placeholder-[#4a5568] focus:outline-none transition-all"
              style={{
                fontSize: '13px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(255,101,0,0.4)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,101,0,0.08)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Streak Badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-1.5"
              style={{
                background: 'rgba(255,101,0,0.08)',
                border: '1px solid rgba(255,101,0,0.2)',
                boxShadow: '0 0 12px rgba(255,101,0,0.1)'
              }}
            >
              <Flame className="w-4 h-4" style={{ color: '#ff6500' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ff6500' }}>{userStats.streak}d</span>
            </div>

            {/* XP */}
            <div
              className="hidden md:flex items-center gap-1.5 rounded-xl px-3 py-1.5"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <Star className="w-4 h-4" style={{ color: '#f59e0b' }} />
              <span className="text-white" style={{ fontSize: '12px', fontWeight: 600 }}>{userStats.totalSolved} solved</span>
            </div>

            <button
              onClick={() => navigate("/onboarding")}
              className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cyber-btn"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #ff6500, #ff9500)',
                color: 'white',
                boxShadow: '0 0 15px rgba(255,101,0,0.3)'
              }}
            >
              <Target className="w-4 h-4" />
              Roadmap
            </button>

            {/* Bell */}
            <button
              className="relative p-2 rounded-xl transition-all"
              style={{ color: '#4a5568', background: 'rgba(255,255,255,0.03)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#ff6500';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,101,0,0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#4a5568';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
              }}
            >
              <Bell className="w-4 h-4" />
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full pulse-animation"
                style={{ background: '#ff6500', boxShadow: '0 0 6px #ff6500' }}
              />
            </button>

            {/* Avatar */}
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                background: 'linear-gradient(135deg, #ff6500, #a855f7)',
                boxShadow: '0 0 12px rgba(255,101,0,0.4)'
              }}
            >
              <span className="text-white" style={{ fontSize: '10px', fontWeight: 800 }}>{userStats.avatar}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto cyber-grid">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}