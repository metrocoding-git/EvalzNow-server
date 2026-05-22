"use client";
import { useClient } from "@/context/ClientContext";
import { useFormStatus } from "@/context/FormStatusContext";
import { getAllCandidates } from "@/services/candidateService";
import { getAllEthinicities } from "@/services/ethinictyService";
import { getAllIncomes } from "@/services/incomeService";
import { ListFilterPlus, Plus, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const genderOptions = ["Female", "Male", "Non-Disclosed", "Other"];
const religionOptions = [
  "African Diaspora Religions", "Agnosticism", "Atheism", "Buddhism", "Christianity", "Confucianism",
  "Druze", "Gnosticism", "Hinduism", "Indigenous American Religions", "Islam", "Jainism", "Judaism",
  "Non-disclosed", "Other", "Rastafarianism", "Shinto", "Sikhism", "Strictly Spiritual",
  "Traditional African Religions", "Zoroastrianism"
];

const nationalities = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. 'Swaziland')", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
  "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan",
  "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand",
  "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe", "Non-disclosed"
];
const maritalStatusOptions = ["Married", "Non-disclosed", "Other", "Separated", "Single"];
const jobTypeOptions = ["Contractor", "Employee", "Non-disclosed", "Other", "Student", "Trainee", "Trainer"];
const irregularityOptions = ["Disability", "Special Needs", "Other"];


export default function CreateCandidateForm({ onClose, onCreate, ethnicities = [], incomes = [] }) {
  const [form, setForm] = useState({
    
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([{ sequenceNumber: 1, type: "", comments: "" }]);
  // const [ethnicities, setEthnicities] = useState([]);
  // const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { formStatus, setFormStatus } = useFormStatus();
  const [dataList, setDataList] = useState([]);
  const [duplicateId, setDuplicateId] = useState(false);
  const { activeClientId, setActiveClientId } = useClient();
  const [localEthnicities, setLocalEthnicities] = useState(ethnicities);
  const [localIncomes, setLocalIncomes] = useState(incomes);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { sequenceNumber: rows.length + 1, type: "", comments: "" }]);
  };

  const handleChange = (label, value) => {
    setForm((prev) => ({ ...prev, [label]: value }));

    if (label === "Candidate ID") {
      const exists = dataList.some(
        (candidate) =>
          candidate.candidateId?.toString().trim().toLowerCase() ===
          value.toString().trim().toLowerCase()
      );
  
      if (exists) {
        toast.error("This Candidate ID already exists!");
        setDuplicateId(true); 
      } else {
        setDuplicateId(false); // clear duplicate flag
      }
    }
  };

  // Check if required fields are filled
  const isFormValid = () => {
    const requiredFields = [
      "Last Name",
      "First Name",
      "Candidate ID",
      "Special ID No.",
      "Date of Birth",
      "Start Date",
      "Nationality",
      "Gender",
      "Ethnicity",
      "Income",
      "Religion",
      "Marital Status",
      "Job Type",
    ];

    return requiredFields.every(
      (field) => form[field] && form[field].toString().trim() !== ""
    );
  };


  // Fetch all candidates on mount
  // useEffect(() => {
  //   const fetchEthnicity = async () => {
  //     try {
  //       setLoading(true);
  //       const data = await getAllEthinicities();
  //       // keep objects instead of just names
  //       setEthnicities(Array.isArray(data) ? data : []);
  //     } catch (err) {
  //       console.error("Failed to fetch ethnicities:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchEthnicity();
  // }, []);

    // ✅ Sync when parent updates
    useEffect(() => {
      setLocalEthnicities(ethnicities);
    }, [ethnicities]);
  
    useEffect(() => {
      setLocalIncomes(incomes);
    }, [incomes]);
  

  // Fetch all candidates on mount
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const data = await getAllCandidates(activeClientId);
        const sortedData = Array.isArray(data)
          ? [...data].sort((a, b) => Number(a.id) - Number(b.id))
          : [];
        setDataList(sortedData);

      } catch (err) {
        console.error("Failed to fetch candidates:", err);
        setError("Failed to load candidates. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [activeClientId]);


  // Fetch all candidates on mount
  // useEffect(() => {
  //   const fetchIncome = async () => {
  //     try {
  //       setLoading(true);
  //       const data = await getAllIncomes();
  //       // keep objects instead of just names
  //       setIncomes(Array.isArray(data) ? data : []);
  //     } catch (err) {
  //       console.error("Failed to fetch incomes:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchIncome();
  // }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dobValue = form["Date of Birth"];
    if (dobValue) {
      const dobDate = new Date(dobValue);
      const today = new Date();
      // Compare dates ignoring time
      dobDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (dobDate > today) {
        toast.error("Date of birth is wrong.");
        setFormStatus("Creating...");
        return; // stop submission
      }
    }

    setIsSubmitting(true);
    setError(null);
    setFormStatus("Processing...");

  
  
    try {
      const candidateData = {
        lastName: form["Last Name"] || "",
        firstName: form["First Name"] || "",
        specialIdNo: form["Special ID No."] || "",
        candidateId: form["Candidate ID"] || "",
        dateOfBirth: form["Date of Birth"] || "",
        startDate: form["Start Date"] || "",
        nationality: form["Nationality"] || "",
        gender: form["Gender"] || "",
        ethnicity: form["Ethnicity"] || "",
        income: form["Income"] || "",
        religion: form["Religion"] || "",
        maritalStatus: form["Marital Status"] || "",
        jobType: form["Job Type"] || "",
        irregularities: rows
          .filter((r) => r.type)
          .map((r, idx) => ({
            type: r.type,
            sequenceNumber: idx + 1,
            comments: r.comments,
          })),
      };
  
      await onCreate(candidateData);
      setFormStatus("Candidate Created");
      onClose();
      
    } catch (err) {
      console.error("Failed to create candidate:", err);
      setError(err.message || "Failed to create candidate");
      setFormStatus("Creating...");
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full w-full bg-white z-20 border shadow-2xl border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 text-black font-semibold">
          <ListFilterPlus className="w-5 h-5" />
          Create Candidate
        </div>

        {/* Close icon */}
        <button
          onClick={() => {
            onClose()
            setFormStatus("Ready..");
          }}
          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      

      {/* Scrollable Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-1 space-y-3 text-sm">
          {/* Basic Info */}
          {[
            "Last Name",
            "First Name",
            "Candidate ID",
            "Special ID No.",
            "Date of Birth",
            "Start Date",
          ].map((label, idx) => (
            <React.Fragment key={idx}>
              <label className="col-span-1 flex items-center text-gray-700">
                {label}:
              </label>
              <input
                type={label.includes("Date") ? "date" : "text"}
                max={label === "Date of Birth" ? todayStr : undefined} // prevents picking future DOB
                className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                onChange={(e) => handleChange(label, e.target.value)}
              />
            </React.Fragment>
          ))}

          {/* Section Header - Socioeconomic Factors */}
          <h3 className="col-span-2 pt-4 pb-2 font-semibold text-gray-800 border-t border-gray-200">
            Socioeconomic Factors
          </h3>

          {[
            { label: "Gender", options: genderOptions },
            { label: "Religion", options: religionOptions },
            { label: "Marital Status", options: maritalStatusOptions },
            { label: "Job Type", options: jobTypeOptions },
          ].map(({ label, options }, idx) => (
            <React.Fragment key={idx}>
              <label className="col-span-1 flex items-center text-gray-700">{label}:</label>
              <select
                className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                onChange={(e) => handleChange(label, e.target.value)}
              >
                <option value="">Select {label}</option>
                {options.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </React.Fragment>
          ))}


          {/* Income handled separately */}
          <label className="col-span-1 flex items-center text-gray-700">Nationality:</label>
          <select
            className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            onChange={(e) => handleChange("Nationality", e.target.value)}
          >
             <option value="">Select Nationality</option>
              {nationalities.map((country, i) => (
                <option key={i} value={country}>
                  {country}
                </option>
              ))}
          </select>

          {/* Income handled separately */}
          <label className="col-span-1 flex items-center text-gray-700">Income:</label>
          <select
            className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            onChange={(e) => handleChange("Income", e.target.value)}
          >
            <option value="">Select Income</option>
            {localIncomes
            .filter((inc) => inc?.name && inc.name.trim() !== "").map((income, i) => (
              <option key={i} value={income.name}>
                {income.name}
              </option>
            ))}
          </select>

          {/* Ethnicity handled separately */}
          <label className="col-span-1 flex items-center text-gray-700">Ethnicity:</label>
          <select
            className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            onChange={(e) => handleChange("Ethnicity", e.target.value)}
          >
            <option value="">Select Ethnicity</option>
            {localEthnicities
            .filter((ethinicity) => ethinicity?.name && ethinicity.name.trim() !== "").map((eth, i) => (
              <option key={i} value={eth.name}>
                {eth.name}
              </option>
            ))}
          </select>


          {/* Section Header - Irregularities */}
          <h3 className="col-span-2 pt-4 pb-2 font-semibold text-gray-800 border-t border-gray-200 ">
            Irregularities
          </h3>

          <div className="col-span-2 overflow-x-auto">
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-100 text-center">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-center">ID</th>
                  <th className="border border-gray-300 px-3 py-2 text-center ">Irregularities</th>
               
                  <th className="border border-gray-300 px-3 py-2 text-center">Comments</th>
                  <th className="border border-gray-300 px-3 py-2 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="even:bg-gray-50 text-center">
                    <td className=" px-2 py-1">
                      <input
                        type="number"
                        min={1}
                        value={index + 1}
                        readOnly
                        onChange={(e) => handleRowChange(index, "id", e.target.value)}
                        className="w-full px-2 py-1 border-0 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <select
                        value={row.type}
                        onChange={(e) => handleRowChange(index, "type", e.target.value)}
                        className="w-full px-2 py-1 border text-center"
                      >
                        <option value="">Select</option>
                        {irregularityOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="text"
                        value={row.comments}
                        maxLength={40}
                        onChange={(e) => handleRowChange(index, "comments", e.target.value)}
                        className="w-full px-2 py-1 border"
                        
                      />
                    </td>

                    <td className="border border-gray-300 px-2 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const updatedRows = rows.filter((_, i) => i !== index);
                          setRows(updatedRows);
                        }}
                        className="px-2 py-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  
                ))}
              </tbody>
            </table>
          </div>

          <div className="col-span-2">
            <button
            type="button"
              onClick={addRow}
              className="flex items-center gap-2 mt-3 px-3 py-1 bg-gray-500 text-white hover:bg-gray-700"
            >
              <Plus size={18} />
              Add Row
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 p-2 pr-6 bg-gray-50 flex-shrink-0">
        <div className="flex justify-end gap-2">
          <button
            disabled={!isFormValid() || isSubmitting || duplicateId}
            // onClick={onClose}
            className={`px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm ${
              !isFormValid() || isSubmitting || duplicateId
                ? "cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            type="submit"
          >
            Close
          </button>
        </div>
      </div>

      <Toaster position="top-right" reverseOrder={false} />
    </form>
  );
}
