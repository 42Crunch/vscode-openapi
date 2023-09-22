export type SelectOption = {
  value: string | number;
  label: string;
};

export default function Select({
  options,
  selected,
  onSelectedItemChange,
}: {
  options: SelectOption[];
  placeholder?: string;
  selected?: SelectOption["value"];
  onSelectedItemChange: (value: SelectOption["value"]) => void;
}) {
  return (
    <select
      value={selected}
      onChange={(e) => {
        const index = parseInt(e.target.value);
        onSelectedItemChange(options[index].value);
      }}
    >
      {options.map((item, index) => (
        <option key={`${item.value}${index}`} value={index}>
          {item.label}
        </option>
      ))}
    </select>
  );
}
