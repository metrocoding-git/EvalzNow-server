"use client";
import { useState } from "react";

const fields = [
  { label: "Solver Keyword:", value: "MAT1", type: "text", disabled: true },
  { label: "Name:", value: "material1", type: "text" },
  { label: "ID:", value: "1", type: "text" },
  { label: "Color:", type: "color" },
  { label: "Include:", type: "select", options: ["[Main Model]"] },
  { label: "Defined:", type: "checkbox" },
  { label: "Card Image:", type: "select", options: ["MAT1"] },
  { label: "User Comments:", type: "select", options: ["Hide In Menu/Export"] },
  { label: "E:", type: "text" },
  { label: "G:", type: "text" },
  { label: "NU:", type: "text" },
  { label: "RHO:", type: "text" },
  { label: "A:", type: "text" },
  { label: "TREF:", type: "text" },
  { label: "GE:", type: "text" },
  { label: "ST:", type: "text" },
  { label: "SC:", type: "text" },
  { label: "SS:", type: "text" },
];

const checkboxFields = [
  "MODULI",
  "RAYL",
  "MATS1",
  "MAT1",
  "MAT4",
  "MAT5",
  "MATFT",
  "MATX",
  "MATVP",
  "MATVE",
  "MATVF",
  "MATC",
  "MICRON",
  "MATVEC",
];

export default function CreateMaterialForm({ onClose }) {
  const [form, setForm] = useState({});
  const [visible, setVisible] = useState(true);

  const handleChange = (label, value) => {
    setForm((prev) => ({ ...prev, [label]: value }));
  };

  if(!visible) return null;

  return (
    <div className="fixed right-4 top-4 w-[350px] h-[90vh] bg-white text-black border shadow-lg rounded p-3 overflow-y-auto z-50">
      <h2 className="text-lg font-semibold mb-2">Create Material</h2>
      <div className="text-xs">
        {fields.map(
          ({ label, type, value = "", options = [], disabled }, idx) => (
            <div key={idx} className="flex items-center mb-2">
              <label className="w-32 pr-2 text-left text-gray-700">
                {label}
              </label>
              {type === "text" && (
                <input
                  type="text"
                  defaultValue={value}
                  disabled={disabled}
                  className="flex-1 border px-2 py-0.5 rounded bg-white"
                />
              )}
              {type === "color" && (
                <input
                  type="color"
                  className="w-8 h-6"
                  onChange={(e) => handleChange(label, e.target.value)}
                />
              )}
              {type === "select" && (
                <select className="flex-1 border px-2 py-1 rounded">
                  {options.map((opt, i) => (
                    <option key={i}>{opt}</option>
                  ))}
                </select>
              )}
              {type === "checkbox" && (
                <input type="checkbox" className="w-5 h-5" />
              )}
            </div>
          )
        )}

        {/* Checkbox grid */}
        <div className="mt-4">
          {checkboxFields.map((field, idx) => (
            <div key={idx} className="flex items-center mb-1">
              <label className="w-32 pr-2 text-left text-gray-700">
                {field}:
              </label>
              <input type="checkbox" className="w-5 h-5" />
            </div>
          ))}
        </div>

        {/* Collapsible section */}
        <div className="mt-4 border-t pt-2">
          <h3 className="font-semibold mb-2 text-gray-800">Library Data</h3>
          <div className="flex items-center mb-2">
            <label className="w-32 pr-2 text-right text-gray-700">
              Revision:
            </label>
            <input type="text" className="flex-1 border px-2 py-1 rounded" />
          </div>
        </div>
      </div>

      <div className="flex flex-row-reverse gap-2">
        <button
          onClick={() => setVisible(false)}
          className="px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          Close
        </button>
        <button
          type="submit"
          className="px-3 py-1 text-sm bg-blue-600 text-white border border-blue-700 rounded hover:bg-blue-700 flex items-center gap-1"
        >
          Create
        </button>
      </div>
    </div>
  );
}
