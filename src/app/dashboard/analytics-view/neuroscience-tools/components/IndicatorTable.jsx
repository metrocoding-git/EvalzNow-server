export default function IndicatorTable() {
  return (
    <table className="table-auto w-full text-sm border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-2 py-1">PP ID</th>
          <th className="border px-2 py-1">Target (Proficiency/Growth)</th>
          <th className="border px-2 py-1">RMS - Frontal Lobe (L)</th>
          {/* Add other lobes */}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border px-2 py-1">PP101</td>
          <td className="border px-2 py-1">90 / 85</td>
          <td className="border px-2 py-1">0.78</td>
        </tr>
        {/* Repeat rows */}
      </tbody>
    </table>
  );
}
