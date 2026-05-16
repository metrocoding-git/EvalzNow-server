"use client";
import { useState } from "react";
import { Edit, X } from "lucide-react";

const ClientEditor = ({ onClose }) => {
  const [material, setMaterial] = useState({
    name: "material1",
    id: 1,
    color: "#A05252",
    defined: true,
    cardImage: "MAT1",
    comments: "Hide In Menu/Export",
    E: 210000.0,
    G: 80769.2,
    NU: "",
    RHO: "7.85e-09",
    A: "",
    TREF: "",
    GE: "",
    ST: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMaterial({
      ...material,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (

    <div className="border-2 border-blue-500 rounded-md flex flex-col">
      <div className="flex justify-between items-center bg-blue-100 px-4 py-2 border-b border-blue-300">
        <div className="flex items-center gap-2 text-blue-800 font-semibold">
          <Edit className="w-5 h-5" />
          Entity Editor - Client
        </div>
        <button onClick={onClose} className="text-red-500 hover:text-red-700 text-sm hover:bg-red-100 rounded-full p-1 cursor-pointer">
          <X className="w-4 h-4 " />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs p-2">
        <label className="col-span-1">Solver Keyword:</label>
        <input
          disabled
          value="MAT1"
          className="col-span-1 border px-2 py-1 bg-gray-100"
        />

        <label>Name:</label>
        <input
          name="name"
          value={material.name}
          onChange={handleChange}
          className="border px-2 py-1"
        />

        <label>ID:</label>
        <input
          name="id"
          value={material.id}
          onChange={handleChange}
          type="number"
          className="border px-2 py-1"
        />

        <label>Color:</label>
        <input
          name="color"
          value={material.color}
          onChange={handleChange}
          type="color"
          className="h-8"
        />

        <label>Include:</label>
        <input
          value="[Main Model]"
          disabled
          className="border px-2 py-1 bg-gray-100"
        />

        <label>Defined:</label>
        <input
          id="defined"
          type="checkbox"
          name="defined"
          checked={material.defined}
          onChange={handleChange}
          className="w-4 h-4 mt-0.5"
        />

        <label>Card Image:</label>
        <select
          name="cardImage"
          value={material.cardImage}
          onChange={handleChange}
          className="border px-2 py-1"
        >
          <option value="MAT1">MAT1</option>
        </select>

        <label>User Comments:</label>
        <input
          name="comments"
          value={material.comments}
          onChange={handleChange}
          className="border px-2 py-1"
        />

        <label>E:</label>
        <input
          name="E"
          value={material.E}
          onChange={handleChange}
          className="border px-2 py-1"
        />

        <label>G:</label>
        <input
          name="G"
          value={material.G}
          onChange={handleChange}
          className="border px-2 py-1"
        />

        <label>NU:</label>
        <input
          name="NU"
          value={material.NU}
          onChange={handleChange}
          className="border px-2 py-1"
        />

        <label>RHO:</label>
        <input
          name="RHO"
          value={material.RHO}
          onChange={handleChange}
          className="border px-2 py-1"
        />

        <label>A:</label>
        <input
          name="A"
          value={material.A}
          onChange={handleChange}
          className="border px-2 py-1"
        />

        <label>TREF:</label>
        <input
          name="TREF"
          value={material.TREF}
          onChange={handleChange}
          className="border px-2 py-1"
        />

        <label>GE:</label>
        <input
          name="GE"
          value={material.GE}
          onChange={handleChange}
          className="border px-2 py-1"
        />

        <label>ST:</label>
        <input
          name="ST"
          value={material.ST}
          onChange={handleChange}
          className="border px-2 py-1"
        />
      </div>

    </div>
  );
};

export default ClientEditor;
