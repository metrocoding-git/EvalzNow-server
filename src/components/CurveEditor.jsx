'use client';


import React, { useState } from 'react';
import { Plus, Trash2, Copy, Search, X } from 'lucide-react';

export default function CurveEditor() {
  const [curves, setCurves] = useState([{ id: 1, name: 'curve1' }]);
  const [selectedCurveId, setSelectedCurveId] = useState(1);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);

  const [points, setPoints] = useState(
    Array.from({ length: 10 }, () => ({ x: '', y: '' }))
  );
  const [visible, setVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('table'); 

  const handlePointChange = (index, field, value) => {
    const updated = [...points];
    updated[index][field] = value;
    setPoints(updated);
  };

  

  const handleDeleteCurve = () => {
    const updated = curves.filter((c) => c.id !== selectedCurveId);
    setCurves(updated);
    if (updated.length > 0) {
      setSelectedCurveId(updated[0].id);
    } else {
      setSelectedCurveId(null);
    }
  };

  if (!visible) return null;

  return (
    <div className="p-3 text-sm text-gray-800 border rounded shadow-md bg-white w-full max-w-3xl mx-auto relative">
      {/* Close Button */}
      <button
        onClick={() => setVisible(false)}
        className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
        title="Close"
      >
        <X size={18} />
      </button>

      <h2 className="text-md font-semibold mb-3 border-b pb-1">
        Curve Editor
      </h2>

      {/* Action Icons */}
      <div className="flex items-center justify-end gap-2 mb-3 px-1 text-gray-700">
        <button onClick={() => setShowCreateMaterial(true)} title="Create Material">
          <Plus className="w-4 h-4 hover:text-green-600" />
        </button>
        <button onClick={handleDeleteCurve} title="Delete Curve">
          <Trash2 className="w-4 h-4 hover:text-red-600" />
        </button>
        <button title="Copy Curve">
          <Copy className="w-4 h-4 hover:text-blue-600" />
        </button>
        <button title="Search Curve">
          <Search className="w-4 h-4 hover:text-gray-500" />
        </button>
      </div>

      {/* Curves Table */}
      <div className="border rounded mb-2">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-1 border">Entities</th>
              <th className="p-1 border">ID</th>
            </tr>
          </thead>
          <tbody>
            {curves.map((curve) => (
              <tr
                key={curve.id}
                className={`cursor-pointer hover:bg-blue-50 ${
                  selectedCurveId === curve.id ? 'bg-blue-100' : ''
                }`}
                onClick={() => setSelectedCurveId(curve.id)}
              >
                <td className="p-1 border">{curve.name}</td>
                <td className="p-1 border">{curve.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tab Buttons  */}
      <div className="flex space-x-2 border-b pb-1 mb-2">
        <button
          className={`px-3 py-1 text-sm rounded-t ${
            activeTab === 'property'
              ? 'bg-blue-100 text-blue-600 font-semibold'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('property')}
        >
          Property Editor
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-t ${
            activeTab === 'table'
              ? 'bg-blue-100 text-blue-600 font-semibold'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('table')}
        >
          Table
        </button>
      </div>

      {/* Tab Content Below */}
      <div className="min-h-[250px]">
        {activeTab === 'table' && (
          <table className="w-full border text-left text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-1 w-10 text-center">#</th>
                <th className="border p-1">X</th>
                <th className="border p-1">Y</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => (
                <tr key={index}>
                  <td className="border p-1 text-center">{index + 1}</td>
                  <td className="border p-1">
                    <input
                      type="text"
                      value={point.x}
                      onChange={(e) =>
                        handlePointChange(index, 'x', e.target.value)
                      }
                      className="w-full border px-2 py-0.5 rounded"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="text"
                      value={point.y}
                      onChange={(e) =>
                        handlePointChange(index, 'y', e.target.value)
                      }
                      className="w-full border px-2 py-0.5 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'property' && (
          <div className="text-sm text-gray-600 mt-2">
            <p className="mb-1">Name: curve{selectedCurveId}</p>
            <p className="mb-1">ID: {selectedCurveId}</p>
            <p className="mb-1">Type: Linear</p>
            <p className="italic text-gray-400 mt-3"> Add More properties here…</p>
          </div>
        )}
      </div>
    </div>
  );
}
