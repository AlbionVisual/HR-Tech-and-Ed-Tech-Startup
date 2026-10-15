import type { PageId } from "../config";
import { config, publicUrl } from "../config";

const icons: Record<string, { active: string; inactive: string }> = {
  tests: {
    active: publicUrl("icons/tests-active.png"),
    inactive: publicUrl("icons/tests-inactive.png"),
  },
  resume: {
    active: publicUrl("icons/resume-active.png"),
    inactive: publicUrl("icons/resume-inactive.png"),
  },
  interview: {
    active: publicUrl("icons/interview-active.png"),
    inactive: publicUrl("icons/interview-inactive.png"),
  },
  //   profile: {
  //     active: publicUrl('icons/profile-active.png'),
  //     inactive: publicUrl('icons/profile-inactive.png'),
  //   },
};

type Props = {
  active: PageId;
  onChange: (id: PageId) => void;
};

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="
        relative flex items-center justify-around w-full max-w-md mx-auto bg-[#f5f3ef] px-3 py-2 rounded-t-3xl shadow-lg border-t border-line
        sm:grid sm:grid-cols-3 sm:max-w-none sm:mx-0 sm:rounded-none sm:px-2 sm:py-2 sm:shadow-none
      "
      aria-label="Навигация">
      {config.app.pages.map((page) => {
        const isActive = active === page.id;
        const pageIcons = icons[page.id] || { active: "", inactive: "" };

        return (
          <button
            key={page.id}
            type="button"
            onClick={() => onChange(page.id)}
            className={`
              relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 
              py-2 px-3 sm:px-4 rounded-2xl transition-all duration-200 border-0 font-sans text-xs sm:text-sm cursor-pointer
              ${
                isActive ?
                  "bg-white sm:bg-bg-panel font-semibold text-[#ff5722] sm:text-ink shadow-sm"
                : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-black/5"
              }
            `}>
            <img
              src={isActive ? pageIcons.active : pageIcons.inactive}
              alt={page.title}
              className="w-6 h-6 sm:w-5 sm:h-5 object-contain transition-transform"
            />

            <span className="truncate">{page.title}</span>
          </button>
        );
      })}
    </nav>
  );
}
