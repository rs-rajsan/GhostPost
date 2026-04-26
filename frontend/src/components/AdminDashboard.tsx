import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  BarChart3, 
  Activity, 
  DollarSign, 
  Cpu, 
  Clock, 
  Zap, 
  TrendingUp, 
  AlertCircle,
  Database,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/admin';

const AdminDashboard: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['adminMetrics'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/metrics`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--void-base)]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="text-[var(--plasma)] animate-spin" size={32} />
          <p className="text-[12px] text-[var(--text-2)] font-medium">Syncing with Clickhouse analytics...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--void-base)]">
        <div className="flex flex-col items-center gap-4 max-w-xs text-center">
          <AlertCircle className="text-[var(--error)]" size={40} />
          <h2 className="text-[16px] font-semibold text-[var(--text-1)]">Observability Offline</h2>
          <p className="text-[12px] text-[var(--text-3)] leading-relaxed">
            We couldn't connect to the analytical database. Make sure Helicone and Clickhouse services are running.
          </p>
          <button 
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-[var(--plasma)] text-[var(--void-base)] text-[12px] font-bold rounded-[4px] hover:opacity-90 transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} /> Try Reconnecting
          </button>
        </div>
      </div>
    );
  }

  // Map backend data safely
  const metrics = data?.kpis || {
    total_requests: 0,
    avg_latency: 0,
    total_tokens: 0,
    total_cost: 0,
    success_rate: 100
  };

  const kpis = [
    { label: 'Total Requests', value: (metrics.total_requests || 0).toLocaleString(), change: '+0%', icon: Zap, color: 'text-[var(--info)]' },
    { label: 'Avg Latency', value: `${metrics.avg_latency || 0}s`, change: '-0%', icon: Clock, color: 'text-[var(--success)]' },
    { label: 'Estimated Cost', value: `$${parseFloat(metrics.total_cost || 0).toFixed(4)}`, change: '+0%', icon: DollarSign, color: 'text-amber-400' },
    { label: 'Total Tokens', value: ((metrics.total_tokens || 0) / 1000000).toFixed(2) + 'M', change: '+0%', icon: Cpu, color: 'text-purple-400' },
  ];

  const recentLogs = data?.logs || [];
  const modelDist = data?.models || [];
  const volumeData = data?.volume || [];

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[var(--void-base)]">
      {/* Topbar */}
      <header className="border-b border-[var(--border)] px-6 py-4 flex justify-between items-center bg-[var(--void-base)]/80 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h1 className="text-[14px] font-semibold text-[var(--text-1)]">Admin Observability</h1>
          <p className="text-[11px] text-[var(--text-3)] font-geist">Helicone-powered LLM metrics & KPIs</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[4px] text-[11px] text-[var(--text-2)] hover:text-[var(--text-1)] transition-all"
          >
            <RefreshCw size={12} className={`${isFetching ? 'animate-spin text-[var(--plasma)]' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[6px] text-[11px] text-[var(--text-2)]">
            <Database size={12} className="text-[var(--plasma)]" />
            <span>Clickhouse: Online</span>
          </div>
          <button className="px-3 py-1.5 bg-[var(--plasma)] text-[var(--void-base)] text-[11px] font-semibold rounded-[4px] hover:opacity-90 transition-opacity">
            Export Report
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-[var(--void-surface)] border border-[var(--border)] p-4 rounded-[8px] hover:border-[var(--plasma)]/30 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-[6px] bg-white/[0.03] ${kpi.color}`}>
                  <kpi.icon size={18} />
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${kpi.change.startsWith('+') ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--info)]/10 text-[var(--info)]'}`}>
                  {kpi.change}
                </span>
              </div>
              <div className="text-[20px] font-semibold text-[var(--text-1)] mb-1">{kpi.value}</div>
              <div className="text-[11px] text-[var(--text-3)] font-medium uppercase tracking-wider">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Charts & Details Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Placeholder */}
          <div className="lg:col-span-2 bg-[var(--void-surface)] border border-[var(--border)] rounded-[12px] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--border)] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[var(--plasma)]" />
                <h2 className="text-[13px] font-semibold">Request Volume (24h)</h2>
              </div>
              <div className="flex gap-1">
                {['1h', '24h', '7d', '30d'].map(t => (
                  <button key={t} className={`px-2 py-1 text-[10px] rounded ${t === '24h' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-[260px] relative flex items-center justify-center p-6">
              {/* Live Chart Illustration */}
              <div className="w-full h-full flex items-end gap-1.5 opacity-20">
                {volumeData.length > 0 ? volumeData.map((v: any, i: number) => {
                  const max = Math.max(...volumeData.map((d: any) => d.count)) || 1;
                  const h = (v.count / max) * 100;
                  return <div key={i} className="flex-1 bg-[var(--plasma)] rounded-t-[2px]" style={{ height: `${Math.max(5, h)}%` }}></div>;
                }) : Array.from({length: 24}).map((_, i) => (
                  <div key={i} className="flex-1 bg-[var(--plasma)] rounded-t-[2px] opacity-10" style={{ height: `${Math.random() * 20 + 5}%` }}></div>
                ))}
              </div>
              {volumeData.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <BarChart3 size={32} className="text-[var(--text-3)] mb-3 opacity-40" />
                  <p className="text-[12px] text-[var(--text-2)] font-medium">Metric visualization pending data sync</p>
                  <p className="text-[10px] text-[var(--text-3)] mt-1">Connect to Clickhouse database to enable live charts</p>
                </div>
              )}
            </div>
          </div>

          {/* Model Distribution */}
          <div className="bg-[var(--void-surface)] border border-[var(--border)] rounded-[12px] flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-[13px] font-semibold">Model Distribution</h2>
            </div>
            <div className="p-5 flex-1 space-y-4">
              {modelDist.length > 0 ? modelDist.map((model: any, i: number) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-2)]">{model.model}</span>
                    <span className="text-[var(--text-1)] font-mono">{model.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                    <div className={`h-full bg-[var(--plasma)]`} style={{ width: `${model.percentage}%` }}></div>
                  </div>
                </div>
              )) : (
                <div className="text-[11px] text-[var(--text-3)] text-center py-10 italic">No model data available</div>
              )}
              <div className="pt-4 mt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 text-[var(--success)] mb-2">
                  <TrendingUp size={14} />
                  <span className="text-[11px] font-semibold">Cost Efficiency: High</span>
                </div>
                <p className="text-[10px] text-[var(--text-3)] leading-relaxed font-geist">
                  Your current model mix is optimized for performance. GPT-4o handles 65% of critical tasks while cost-effective models handle secondary logic.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests Table */}
        <div className="bg-[var(--void-surface)] border border-[var(--border)] rounded-[12px] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex justify-between items-center">
            <h2 className="text-[13px] font-semibold">Recent Requests (Live)</h2>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 bg-[var(--void-base)] border border-[var(--border)] rounded-[4px] text-[10px]">
                <Search size={10} className="text-[var(--text-3)]" />
                <input type="text" placeholder="Search logs..." className="bg-transparent outline-none w-24 text-[var(--text-2)]" />
              </div>
              <button className="p-1.5 hover:bg-white/[0.05] rounded transition-colors text-[var(--text-3)]">
                <Filter size={12} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-white/[0.01]">
                  <th className="px-5 py-3 text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Request ID</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Model</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Tokens</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Cost</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log: any, i: number) => (
                  <tr key={i} className="border-b border-[var(--border)] hover:bg-white/[0.02] transition-colors group cursor-pointer">
                    <td className="px-5 py-3 text-[11px] font-mono text-[var(--text-2)] group-hover:text-[var(--plasma)] transition-colors">{log.id}</td>
                    <td className="px-5 py-3 text-[11px] text-[var(--text-1)]">{log.model}</td>
                    <td className="px-5 py-3 text-[11px] text-[var(--text-2)]">{log.tokens.toLocaleString()}</td>
                    <td className="px-5 py-3 text-[11px] text-[var(--text-2)] font-mono">{log.cost}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider ${log.status === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--error)]/10 text-[var(--error)]'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-[var(--text-3)]">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-white/[0.01] flex justify-center">
            <button className="text-[10px] text-[var(--text-3)] hover:text-[var(--plasma)] font-semibold transition-colors">
              View All Interaction Logs
            </button>
          </div>
        </div>

        {/* System Health Footer */}
        <div className="flex items-center justify-between text-[10px] text-[var(--text-3)] px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse"></div>
              <span className="text-[10px] text-[var(--text-2)] font-geist uppercase tracking-widest">LIVE DATA SYNC</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></div>
              <span>OpenAI API: Operational</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 hover:text-[var(--text-2)] cursor-pointer transition-colors">
            <AlertCircle size={10} />
            <span>Diagnostic Report #284-A</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
