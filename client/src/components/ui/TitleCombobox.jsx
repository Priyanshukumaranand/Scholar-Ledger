import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Clock } from "lucide-react";
import { buildSuggestions } from "../../utils/credentialPresets";

function TitleCombobox({
  label = "Credential Title",
  placeholder = "e.g. Bachelor of Science in Computer Science",
  value,
  onChange,
  issuerAddr,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef(null);

  const suggestions = useMemo(
    () => buildSuggestions(issuerAddr, value),
    [issuerAddr, value]
  );

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const apply = (label) => {
    onChange(label);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      apply(suggestions[activeIndex].label);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <label className="label">{label}</label>
      <input
        type="text"
        className="input"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls="title-combobox-list"
      />
      {showList && (
        <ul
          id="title-combobox-list"
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-ink-200 bg-white py-1 shadow-elevated dark:border-ink-700 dark:bg-ink-900"
        >
          {suggestions.map((s, i) => {
            const Icon = s.kind === "recent" ? Clock : Sparkles;
            const accent =
              s.kind === "recent"
                ? "text-amber-500"
                : s.kind === "combination"
                ? "text-violet-500"
                : "text-brand-500";
            const active = i === activeIndex;
            return (
              <li
                key={`${s.kind}-${s.label}`}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  apply(s.label);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                  active
                    ? "bg-brand-50 text-ink-900 dark:bg-brand-950/50 dark:text-ink-100"
                    : "text-ink-700 dark:text-ink-300"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${accent}`} />
                <span className="truncate">{s.label}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wide text-ink-400">
                  {s.kind === "recent" ? "Recent" : s.kind === "combination" ? "Suggested" : "Common"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default TitleCombobox;
