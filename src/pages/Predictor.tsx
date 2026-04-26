import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Award, CheckCircle2, FileDown, Filter, GitCompare, X, Eye, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { categories, exams, states, quotas, exportToExcel } from '../constants';
import { College, ExamType, Category, QuotaType } from '../types';
import { cn } from '../lib/utils';

export default function Predictor() {
  const [formData, setFormData] = React.useState({
    rank: '',
    category: Category.GENERAL,
    domicile: 'Maharashtra',
    examType: ExamType.NEET,
    quota: QuotaType.AIQ
  });
  const [results, setResults] = React.useState<College[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filterType, setFilterType] = React.useState<'All' | 'Medical' | 'Engineering'>('All');
  const [filterQuota, setFilterQuota] = React.useState<'All' | QuotaType>('All');
  const [selectedForCompare, setSelectedForCompare] = React.useState<College[]>([]);
  const [showComparison, setShowComparison] = React.useState(false);
  const [expandedTrends, setExpandedTrends] = React.useState<string | null>(null);

  const toggleTrends = (id: string) => {
    setExpandedTrends(expandedTrends === id ? null : id);
  };

  const toggleCompare = (college: College) => {
    setSelectedForCompare(prev => {
      const isSelected = prev.find(c => c.id === college.id);
      if (isSelected) {
        return prev.filter(c => c.id !== college.id);
      }
      if (prev.length >= 3) return prev; // Limit to 3
      return [...prev, college];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rank: parseInt(formData.rank)
        }),
      });
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = React.useMemo(() => {
    return results.filter(c => {
      const typeMatch = filterType === 'All' || c.type === filterType;
      const quotaMatch = filterQuota === 'All' || c.quota === filterQuota;
      return typeMatch && quotaMatch;
    });
  }, [results, filterType, filterQuota]);

  const handleDownload = () => {
    const exportData = filteredResults.map(c => ({
      'College Name': c.name,
      'City': c.city,
      'State': c.state,
      'Type': c.type,
      'Quota': c.quota,
      'General Cutoff': c.cutoffRank[Category.GENERAL],
      'OBC Cutoff': c.cutoffRank[Category.OBC],
      'SC Cutoff': c.cutoffRank[Category.SC],
      'ST Cutoff': c.cutoffRank[Category.ST],
      'EWS Cutoff': c.cutoffRank[Category.EWS],
      'Tuition Fee': c.fees?.tuition || 0,
      'Hostel Fee': c.fees?.hostel || 0,
      'Official Link': c.link
    }));
    exportToExcel(exportData, `PredictedColleges_${formData.rank}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">College Predictor 2026</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Get precise recommendations based on historical cutoff data for NEET and JEE. Our smart engine analyzes AIQ and State quota rankings.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Entrance Exam</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {exams.map((exam) => (
                  <button
                    key={exam}
                    type="button"
                    onClick={() => setFormData({ ...formData, examType: exam })}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all",
                      formData.examType === exam ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {exam}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Quota Type</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {quotas.map((quota) => (
                  <button
                    key={quota}
                    type="button"
                    onClick={() => setFormData({ ...formData, quota: quota })}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all",
                      formData.quota === quota ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {quota}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Rank (AIR)</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="number"
                  placeholder="Enter your rank"
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Domicile State</label>
              <select
                value={formData.domicile}
                onChange={(e) => setFormData({ ...formData, domicile: e.target.value })}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none cursor-pointer"
              >
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Find Colleges"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 space-y-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Recommended Institutions</h2>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl w-fit">
                  {(['All', 'Medical', 'Engineering'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition",
                        filterType === type ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl w-fit">
                  {(['All', QuotaType.AIQ, QuotaType.STATE] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setFilterQuota(q)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition",
                        filterQuota === q ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
            >
              <FileDown className="h-5 w-5" />
              <span>Colleges List (Excel)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredResults.map((college, idx) => (
              <motion.div
                key={college.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-blue-300 transition group relative overflow-hidden flex flex-col shadow-sm"
              >
                <div className="absolute top-0 right-0 p-6 flex flex-col items-end space-y-2">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                    college.type === 'Medical' ? "bg-red-50 text-red-600" : "bg-cyan-50 text-cyan-600"
                  )}>
                    {college.type}
                  </span>
                  <button
                    onClick={() => toggleCompare(college)}
                    className={cn(
                        "flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition",
                        selectedForCompare.find(c => c.id === college.id)
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    <GitCompare className="h-3 w-3" />
                    <span>{selectedForCompare.find(c => c.id === college.id) ? 'Selected' : 'Compare'}</span>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-blue-100 transition">
                      <Award className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1 pr-12">
                      <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{college.name}</h3>
                      <p className="text-sm text-slate-500 flex items-center mb-3">
                        <MapPin className="h-4 w-4 mr-1.5" />
                        {college.city}, {college.state}
                      </p>
                      {college.link && (
                        <a 
                          href={college.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:underline flex items-center w-fit"
                        >
                          Official College Website
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Historical Cutoff Ranks</h4>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                      {Object.entries(college.cutoffRank).map(([cat, rank]) => (
                        <div key={cat} className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{cat}</span>
                          <span className="text-sm font-black text-slate-900">
                            {rank.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Estimated Fees (Annual)</h4>
                      <span className="text-[10px] text-slate-400 italic">*Approximate</span>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="flex items-center space-x-3">
                        <div className="w-1 h-8 bg-blue-500 rounded-full" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Tuition Fee</p>
                          <p className="text-base font-black text-slate-900">₹{college.fees?.tuition.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-1 h-8 bg-orange-500 rounded-full" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Hostel Fee</p>
                          <p className="text-base font-black text-slate-900">₹{college.fees?.hostel.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-bold text-slate-700">Possible</span>
                      </div>
                      {college.historicalTrends?.[formData.category as Category] && (
                        <button
                          onClick={() => toggleTrends(college.id)}
                          className={cn(
                            "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition",
                            expandedTrends === college.id ? "bg-slate-900 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          )}
                        >
                          <TrendingUp className="h-3 w-3" />
                          <span>{expandedTrends === college.id ? 'Hide Trends' : 'View Trends'}</span>
                        </button>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs px-3 py-1 rounded-lg font-black uppercase tracking-widest",
                      college.quota === QuotaType.AIQ ? "bg-orange-50 text-orange-600" : "bg-purple-50 text-purple-600"
                    )}>
                      {college.quota}
                    </span>
                  </div>

                  <AnimatePresence>
                    {expandedTrends === college.id && college.historicalTrends?.[formData.category as Category] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-2" />
                            {formData.category} Cutoff Trend (5 Years)
                          </h4>
                          <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={college.historicalTrends?.[formData.category as Category]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                  dataKey="year" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                  dy={10}
                                />
                                <YAxis 
                                  hide 
                                  domain={['auto', 'auto']}
                                />
                                <Tooltip 
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      return (
                                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-white/10">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Year {payload[0].payload.year}</p>
                                          <p className="text-sm font-black">Rank: {payload[0].value?.toLocaleString()}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="rank" 
                                  stroke="#2563eb" 
                                  strokeWidth={3} 
                                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-4 italic">
                            * Note: Lower rank indicates higher competitiveness. Data based on round-1 results.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredResults.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
              <Filter className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Matches Found</h3>
              <p className="text-slate-500">Try changing your filters (Type: {filterType}, Quota: {filterQuota}) or Rank.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Floating Compare Bar */}
      <AnimatePresence>
        {selectedForCompare.length > 0 && (
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
            >
                <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-xl">
                    <div className="flex items-center space-x-4">
                        <div className="bg-blue-500 p-2 rounded-xl">
                            <GitCompare className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">{selectedForCompare.length} Colleges selected</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Limit 3 colleges</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => setSelectedForCompare([])}
                            className="text-xs font-bold text-slate-400 hover:text-white transition"
                        >
                            Clear
                        </button>
                        <button 
                            onClick={() => setShowComparison(true)}
                            className="bg-white text-slate-900 px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition"
                        >
                            Compare Now
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowComparison(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900">College Comparison</h2>
                            <p className="text-sm text-slate-500">Comparing {selectedForCompare.length} selected institutions</p>
                        </div>
                        <button 
                            onClick={() => setShowComparison(false)}
                            className="p-3 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-auto p-8">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-6 text-left bg-slate-50 rounded-tl-3xl border-b border-slate-100 w-48">Criteria</th>
                                    {selectedForCompare.map(college => (
                                        <th key={college.id} className="p-6 text-left border-b border-slate-100 min-w-[250px]">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className="bg-blue-50 p-2 rounded-lg">
                                                    <Award className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                                    college.type === 'Medical' ? "bg-red-50 text-red-600" : "bg-cyan-50 text-cyan-600"
                                                )}>
                                                    {college.type}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900 leading-tight">{college.name}</h4>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Location</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6 border-b border-slate-50">
                                            <div className="flex items-center text-slate-700 font-bold">
                                                <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                                                {college.city}, {college.state}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Quota</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6 border-b border-slate-50">
                                            <span className={cn(
                                                "px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest",
                                                college.quota === QuotaType.AIQ ? "bg-orange-100 text-orange-600" : "bg-purple-100 text-purple-600"
                                            )}>
                                                {college.quota}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                                {Object.values(Category).map(cat => (
                                    <tr key={cat}>
                                        <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">{cat} Cutoff</td>
                                        {selectedForCompare.map(college => (
                                            <td key={college.id} className="p-6 border-b border-slate-50 font-black text-slate-900 text-base">
                                                {college.cutoffRank[cat].toLocaleString()}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Tuition Fee</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6 border-b border-slate-50">
                                            <div className="text-lg font-black text-slate-900">₹{college.fees?.tuition.toLocaleString()}</div>
                                            <p className="text-[10px] text-slate-400 italic">Per annum</p>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Hostel Fee</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6 border-b border-slate-50">
                                            <div className="text-lg font-black text-slate-900">₹{college.fees?.hostel.toLocaleString()}</div>
                                            <p className="text-[10px] text-slate-400 italic">Approximate</p>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 rounded-bl-3xl">Action</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6">
                                            <button 
                                                onClick={() => toggleCompare(college)}
                                                className="text-red-500 font-bold hover:underline"
                                            >
                                                Remove from comparison
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
