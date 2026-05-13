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
        background: 'rgba(19, 19, 28, 0.75)',
        border: '1px solid rgba(0, 212, 255, 0.25)',
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
                    background: 'linear-gradient(135deg, #5BE2FF 0%, #00D4FF 50%, #0077BB 100%)',
                    color: '#0A0A0F',
                    fontWeight: 700,
                    boxShadow: '0 0 14px rgba(0, 212, 255, 0.55)',
                  }
                : { color: '#7A8B99', fontWeight: 500 }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
