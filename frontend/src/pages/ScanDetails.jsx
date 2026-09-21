import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, ShieldAlert, Bot } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Drawer from '../components/common/Drawer';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { getScanDetails } from '../services/scanService';

export default function ScanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVuln, setSelectedVuln] = useState(null);

  const fetchScan = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getScanDetails(id);
      setScan(data);
    } catch (err) {
      setError(err.message || `Failed to retrieve scan #${id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();
  }, [id]);

  if (loading) return <LoadingState title={`Loading Scan #${id} details...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchScan} />;

  const vulns = scan?.vulnerabilities || [];

  const filteredVulns = vulns.filter((v) => {
    const matchSev = filterSeverity === 'ALL' || v.severity === filterSeverity;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      v.vulnerabilityId?.toLowerCase().includes(q) ||
      v.packageName?.toLowerCase().includes(q) ||
      v.title?.toLowerCase().includes(q);
    return matchSev && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/scans/history" className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Scan History
      </Link>

      {/* Main Header Banner */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-600/20 border border-brand-200 dark:border-brand-500/30 rounded-xl text-brand-600 dark:text-brand-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                <span>Scan Record #{scan?.id}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {scan?.scanTime ? new Date(scan.scanTime).toLocaleString() : 'N/A'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">{scan?.imageName}</h2>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Bot}
            onClick={() => navigate(`/assistant?project=${encodeURIComponent(scan?.imageName || '')}`)}
          >
            Ask AI Assistant
          </Button>
        </div>
      </Card>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/60 rounded-xl text-center shadow-xs">
          <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-semibold">Total Findings</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{scan?.totalVulnerabilities}</p>
        </div>

        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl text-center">
          <span className="text-[10px] uppercase font-mono text-rose-700 dark:text-rose-400 font-bold">Critical</span>
          <p className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1">{scan?.critical}</p>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 rounded-xl text-center">
          <span className="text-[10px] uppercase font-mono text-orange-700 dark:text-orange-400 font-bold">High</span>
          <p className="text-2xl font-bold font-mono text-orange-700 dark:text-orange-400 mt-1">{scan?.high}</p>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-center">
          <span className="text-[10px] uppercase font-mono text-amber-800 dark:text-amber-400 font-bold">Medium</span>
          <p className="text-2xl font-bold font-mono text-amber-800 dark:text-amber-400 mt-1">{scan?.medium}</p>
        </div>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-center">
          <span className="text-[10px] uppercase font-mono text-emerald-800 dark:text-emerald-400 font-bold">Low</span>
          <p className="text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-400 mt-1">{scan?.low}</p>
        </div>
      </div>

      {/* Vulnerabilities Breakdown Table */}
      <Card title="Detailed Vulnerabilities List" subtitle={`Showing ${filteredVulns.length} of ${vulns.length} vulnerabilities`}>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  filterSeverity === sev
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search CVE ID or package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-dark-700/60 rounded-lg">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-700/60 uppercase">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">CVE / Vulnerability ID</th>
                <th className="py-3 px-4">Package Name</th>
                <th className="py-3 px-4">Installed Version</th>
                <th className="py-3 px-4">Fixed Version</th>
                <th className="py-3 px-4">Title</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-dark-700/40">
              {filteredVulns.map((v, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedVuln(v)}
                  className="hover:bg-slate-50 dark:hover:bg-dark-800/60 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <Badge severity={v.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-bold text-brand-600 dark:text-brand-400">{v.vulnerabilityId}</td>
                  <td className="py-3 px-4 text-slate-900 dark:text-slate-200 font-semibold">{v.packageName}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{v.installedVersion || 'N/A'}</td>
                  <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-bold">{v.fixedVersion || 'None'}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 truncate max-w-xs">{v.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Vulnerability Inspector Drawer */}
      <Drawer
        isOpen={Boolean(selectedVuln)}
        onClose={() => setSelectedVuln(null)}
        title={selectedVuln?.vulnerabilityId || 'Vulnerability Detail'}
        subtitle={`Package: ${selectedVuln?.packageName}`}
      >
        {selectedVuln && (
          <div className="space-y-6 font-mono text-xs">
            <div className="flex items-center gap-3">
              <Badge severity={selectedVuln.severity} />
              <span className="text-slate-800 dark:text-slate-300 font-bold">{selectedVuln.packageName}</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans">{selectedVuln.title}</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                {selectedVuln.description || 'No additional description provided in stored scan data.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Installed Version</span>
                <p className="text-slate-900 dark:text-slate-200 font-bold mt-1">{selectedVuln.installedVersion || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Fixed In Version</span>
                <p className="text-emerald-700 dark:text-emerald-400 font-bold mt-1">{selectedVuln.fixedVersion || 'None'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-dark-700">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                icon={Bot}
                onClick={() => {
                  setSelectedVuln(null);
                  navigate(`/assistant?project=${encodeURIComponent(scan?.imageName || '')}&q=${encodeURIComponent(`Explain vulnerability ${selectedVuln.vulnerabilityId} in ${selectedVuln.packageName}`)}`);
                }}
              >
                Ask AI Assistant to Fix This Vulnerability
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
