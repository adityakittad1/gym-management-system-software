import { Search, Bell, User } from 'lucide-react';

export default function Navbar() {
  return (
    <div className="h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search members, payments, or trainers..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-11 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4 ml-6">
        {/* Notifications */}
        <button className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
          <div className="text-right">
            <p className="text-white text-sm font-medium">Admin User</p>
            <p className="text-zinc-500 text-xs">Super Admin</p>
          </div>
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-black" />
          </div>
        </div>
      </div>
    </div>
  );
}
