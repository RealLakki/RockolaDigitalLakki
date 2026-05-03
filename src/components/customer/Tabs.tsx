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
        background: 'rgba(28, 23, 18, 0.7)',
        border: '1px solid rgba(200, 155, 60, 0.2)',
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
                    background: 'linear-gradient(135deg, #F0C060 0%, #C89B3C 50%, #9A7728 100%)',
                    color: '#0F0D0A',
                    fontWeight: 700,
                    boxShadow: '0 0 14px rgba(200, 155, 60, 0.5)',
                  }
                : { color: '#A89A82', fontWeight: 500 }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
