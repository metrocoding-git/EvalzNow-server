export default function LineChart({ title }) {
  return (
    <div className="border p-2 rounded shadow">
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-xs">[Chart Placeholder]</span>
      </div>
    </div>
  );
}
