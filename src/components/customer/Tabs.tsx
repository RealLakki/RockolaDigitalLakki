interface Props<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}

export function Tabs<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div
      className="flex gap-1 rounded-xl p-1"
      style={{
        background: 'rgba(28, 18, 9, 0.80)',
        border: '1px solid rgba(232, 184, 0, 0.22)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-heading uppercase tracking-wider transition-all"
            style={
              active
                ? {
                    background: 'linear-gradient(135deg, #FFD633 0%, #E8B800 50%, #A88600 100%)',
                    color: '#0F0A06',
                    fontWeight: 700,
                    boxShadow: '0 0 14px rgba(232, 184, 0, 0.55)',
                  }
                : { color: '#8A7A60', fontWeight: 500 }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
