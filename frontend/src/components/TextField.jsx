// Labelled input. `id` is required so the label and input stay linked.
export default function TextField({ id, label, hint, ...inputProps }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} className="input" {...inputProps} />
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
