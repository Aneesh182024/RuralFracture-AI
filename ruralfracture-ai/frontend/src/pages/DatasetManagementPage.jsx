import React, { useEffect, useState } from 'react';
import { FolderKanban, Download, Database, FileText } from 'lucide-react';
import { datasetAPI } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';

const DatasetManagementPage = () => {
  const [sampleData, setSampleData] = useState([]);

  useEffect(() => {
    fetchSample();
  }, []);

  const fetchSample = async () => {
    try {
      const res = await datasetAPI.sample();
      setSampleData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch sample dataset:', err);
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['patient_id,name,age,gender,hospital_name,body_region,fracture_status,fracture_type,image_filename'];
    const rows = sampleData.map(
      (r) => `${r.patient_id},${r.name},${r.age},${r.gender},${r.hospital_name},${r.body_region},${r.fracture_status},${r.fracture_type},${r.image_filename}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_ruralfracture_dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-cyan-400" />
            Dataset Management & Structure Browser
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse imported clinical datasets, view directory schemas, and download sample CSV templates
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg text-xs"
        >
          <Download className="w-4 h-4" />
          <span>Download Sample CSV Template</span>
        </button>
      </div>

      <DisclaimerBanner />

      {/* Recommended Dataset Directory Structure (Item 5) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          Standard Dataset Directory Architecture
        </h3>

        <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-cyan-300 border border-slate-800 leading-relaxed">
{`dataset/
│
├── metadata/
│   ├── patients.csv
│   └── cases.csv
│
├── images/
│   ├── fracture/
│   │   ├── RF001.jpg
│   │   └── RF002.jpg
│   │
│   └── no_fracture/
│       ├── RF101.jpg
│       └── RF102.jpg
│
└── annotations/
    ├── RF001.txt (YOLO optional bounding boxes)
    └── RF002.txt`}
        </pre>
      </div>

      {/* Sample Dataset Preview Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100">Sample Metadata Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase bg-slate-950/50">
                <th className="p-3">patient_id</th>
                <th className="p-3">name</th>
                <th className="p-3">age</th>
                <th className="p-3">gender</th>
                <th className="p-3">hospital_name</th>
                <th className="p-3">body_region</th>
                <th className="p-3">fracture_status</th>
                <th className="p-3">fracture_type</th>
                <th className="p-3">image_filename</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {sampleData.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="p-3 text-cyan-300 font-bold">{r.patient_id}</td>
                  <td className="p-3 font-sans text-slate-200">{r.name}</td>
                  <td className="p-3">{r.age}</td>
                  <td className="p-3">{r.gender}</td>
                  <td className="p-3 font-sans">{r.hospital_name}</td>
                  <td className="p-3 font-sans text-teal-300 font-semibold">{r.body_region}</td>
                  <td className="p-3 font-sans text-rose-300 font-bold">{r.fracture_status}</td>
                  <td className="p-3 font-sans">{r.fracture_type}</td>
                  <td className="p-3 text-cyan-400">{r.image_filename}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default DatasetManagementPage;
