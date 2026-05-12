import React from 'react';

export default function InsertScoreWorkfoce() {
  const columns = [
    'Last Name',
    'First Name', 
    'CID',
    'PP ID',
    'Duration',
    'Critical Risk Declaration',
    'Workflow',
    'Assessment',
    'Schedule',
    'Engage Level',
    'Competency',
    'Main Criteria 1-20',
    'Custom Criteria 1-20'
  ];

  const rows = [
    { id: -1 },
    { id: -1 },
    { id: -2 },
    { id: -2 },
    { id: 1 },
    { id: 1 },
    { id: 2 },
    { id: 2 }
  ];

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border-collapse border-2 border-black">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index}
                className="border border-black bg-gray-100 px-3 py-2 text-left text-sm font-medium text-black min-w-24"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="bg-white">
              {columns.map((_, colIndex) => (
                <td 
                  key={colIndex}
                  className="border border-black px-3 py-2 text-sm text-black min-h-8"
                >
                  {colIndex === 2 ? row.id : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}