import React from "react";

export default function LoadTable() {
  return (
    <table className="table-auto w-full text-sm border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-2 py-1">PP ID</th>
          <th className="border px-2 py-1">Target (Proficiency/Growth)</th>
          <th className="border px-2 py-1">Cognitive Load - Frontal Lobe (L)</th>
          <th className="border px-2 py-1">Cognitive Load - Occipital Lobe (L)</th>
          <th className="border px-2 py-1">Cognitive Load - Parietal Lobe (L)</th>
          <th className="border px-2 py-1">Cognitive Load - Temporal Lobe (L)</th>
          <th className="border px-2 py-1">Cognitive Load - Frontal Lobe (R)</th>
          <th className="border px-2 py-1">Cognitive Load - Occipital Lobe (R)</th>
          <th className="border px-2 py-1">Cognitive Load - Parietal Lobe (R)</th>
          <th className="border px-2 py-1">Cognitive Load - Temporal Lobe (R)</th>
        </tr>
      </thead>
      <tbody>
        {/* Example row – replace with dynamic data later */}
        <tr>
          <td className="border px-2 py-1">PP102</td>
          <td className="border px-2 py-1">78 / 72</td>
          <td className="border px-2 py-1">12.5</td>
          <td className="border px-2 py-1">10.9</td>
          <td className="border px-2 py-1">9.4</td>
          <td className="border px-2 py-1">11.2</td>
          <td className="border px-2 py-1">13.1</td>
          <td className="border px-2 py-1">12.3</td>
          <td className="border px-2 py-1">10.1</td>
          <td className="border px-2 py-1">9.8</td>
        </tr>
        {/* Add more rows as needed */}
      </tbody>
    </table>
  );
}
