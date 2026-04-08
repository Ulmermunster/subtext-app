import { useNavigate } from 'react-router-dom';

type Tab = 'send' | 'play' | 'collection';

export default function BottomNav({ active }: { active: Tab }) {
  const navigate = useNavigate();

  const tabs: { id: Tab; label: string; icon: string; path: string }[] = [
    { id: 'send', label: 'Send', icon: 'send', path: '/send' },
    { id: 'play', label: 'Play', icon: 'stadia_controller', path: '/play' },
    { id: 'collection', label: 'Collection', icon: 'library_music', path: '/queue' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-black/80 backdrop-blur-3xl rounded-t-[2rem] border-t border-white/5">
      <div className="w-full flex justify-evenly items-center px-4 py-5">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center py-2 mx-1 rounded-full transition-all duration-300 ease-out active:scale-[0.96] cursor-pointer ${
                isActive
                  ? 'tropical-gradient text-white shadow-xl shadow-pink-500/20'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}
              >
                {tab.icon}
              </span>
              <span className="font-label text-[10px] uppercase tracking-[0.15em] mt-1 font-extrabold">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
