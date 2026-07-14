import { User } from '../types';
import { Users, Shield, User as UserIcon, Eye } from 'lucide-react';

interface RoleSwitcherProps {
  currentUser: User | null;
  users: User[];
  onUserChange: (user: User | null) => void;
}

export default function RoleSwitcher({ currentUser, users, onUserChange }: RoleSwitcherProps) {
  return (
    <div className="bg-slate-900 border-b border-amber-500/20 text-white text-xs py-2 px-4 shadow-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-300">لوحة محاكاة الحسابات والأدوار:</span>
          {currentUser ? (
            <span className="font-bold text-amber-400 flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
              {currentUser.role === 'admin' && <Shield className="w-3 w-3 text-red-400" />}
              {currentUser.role === 'moderator' && <Shield className="w-3 w-3 text-orange-400" />}
              {currentUser.role === 'user' && <UserIcon className="w-3 w-3 text-blue-400" />}
              {currentUser.name} ({currentUser.role === 'admin' ? 'مدير' : currentUser.role === 'moderator' ? 'مشرف' : 'عضو مسجل'})
            </span>
          ) : (
            <span className="font-bold text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              <Eye className="w-3 w-3 text-slate-400" />
              زائر مجهول (تصفح فقط)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 ml-1">اختر الحساب للتجربة:</span>
          
          {/* Guest / Visitor option */}
          <button
            onClick={() => onUserChange(null)}
            className={`px-2.5 py-1 rounded transition-all text-[11px] cursor-pointer ${
              currentUser === null
                ? 'bg-slate-700 text-white font-bold ring-1 ring-slate-500'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            👤 زائر مجهول
          </button>

          {/* Map through default users */}
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onUserChange(user)}
              className={`px-2.5 py-1 rounded transition-all text-[11px] flex items-center gap-1 cursor-pointer ${
                currentUser?.id === user.id
                  ? 'bg-amber-500 text-slate-950 font-bold ring-1 ring-amber-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{user.role === 'admin' ? '👑' : user.role === 'moderator' ? '🛡️' : '🏪'}</span>
              <span>{user.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
