"use client";

export default function ChartView({ selectedChart }) {
  return (
    <div className="flex-1 border rounded-lg p-4 bg-white overflow-auto">
      <h2 className="text-sm font-semibold mb-4 text-gray-700">
        {selectedChart}
      </h2>
      <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed ">
        {`[ ${selectedChart} will be rendered here ]`}
      </div>
    </div>
  );
}
