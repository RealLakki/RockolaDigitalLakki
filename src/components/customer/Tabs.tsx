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
        background: 'rgba(255, 255, 255, 0.75)',
        border: '1px solid rgba(94, 195, 194, 0.30)',
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
                    background: 'linear-gradient(135deg, #FFA0C4 0%, #FF6AAA 50%, #C82F6F 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    boxShadow: '0 0 14px rgba(255, 106, 170, 0.45)',
                  }
                : { color: '#6A8590', fontWeight: 500 }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
