import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getLoadAnalysis, getMeasurements } from '../integrations/solarman/analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Battery, Zap, AlertTriangle, RefreshCw } from 'lucide-react';

export default function SolarmanDashboard() {
    const [plants, setPlants] = useState([]);
    const [selectedPlantId, setSelectedPlantId] = useState('');
    const [dateRange, setDateRange] = useState('7d'); // '1d', '7d', '30d'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [loadStats, setLoadStats] = useState(null);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        // Fetch plants
        const fetchPlants = async () => {
            const { data, error } = await supabase.from('solarman_plants').select('*');
            if (data) {
                setPlants(data);
                if (data.length > 0) {
                    setSelectedPlantId(data[0].id);
                }
            }
        };
        fetchPlants();
    }, []);

    useEffect(() => {
        if (!selectedPlantId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const now = new Date();
                let start = new Date();
                if (dateRange === '1d') start.setDate(now.getDate() - 1);
                if (dateRange === '7d') start.setDate(now.getDate() - 7);
                if (dateRange === '30d') start.setDate(now.getDate() - 30);
                
                const startTimeStr = start.toISOString();
                const endTimeStr = now.toISOString();

                const stats = await getLoadAnalysis(supabase, selectedPlantId, startTimeStr, endTimeStr);
                setLoadStats(stats);

                // Fetch data for chart
                const measurements = await getMeasurements(supabase, selectedPlantId, startTimeStr, endTimeStr, [
                    'timestamp', 'consumption_power_kw', 'pv_power_kw', 'battery_soc_percent'
                ]);
                
                // Format for Recharts
                const formatted = measurements.map(m => ({
                    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fullDate: new Date(m.timestamp).toLocaleString(),
                    load: m.consumption_power_kw ? parseFloat(m.consumption_power_kw) : 0,
                    pv: m.pv_power_kw ? parseFloat(m.pv_power_kw) : 0,
                    soc: m.battery_soc_percent ? parseFloat(m.battery_soc_percent) : null,
                }));
                
                setChartData(formatted);

            } catch (err) {
                console.error("Dashboard error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedPlantId, dateRange]);

    return (
        <div className="p-6 bg-slate-900 min-h-screen text-slate-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-blue-500" /> CRS Energy Intelligence
                    </h1>
                    <p className="text-sm text-slate-400">Powered by SOLARMAN Data</p>
                </div>
                
                <div className="flex gap-4">
                    <select 
                        value={selectedPlantId} 
                        onChange={(e) => setSelectedPlantId(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white rounded px-4 py-2"
                    >
                        {plants.length === 0 && <option value="">No plants found...</option>}
                        {plants.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <select 
                        value={dateRange} 
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white rounded px-4 py-2"
                    >
                        <option value="1d">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded mb-6 flex items-center gap-2">
                    <AlertTriangle /> {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64 text-slate-400">
                    <RefreshCw className="animate-spin mr-2" /> Loading telemetry...
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
                            <div className="text-sm text-slate-400 mb-1">Peak Load</div>
                            <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                                {loadStats?.peakLoad?.toFixed(2)} <span className="text-sm font-normal text-slate-400">kW</span>
                            </div>
                            {loadStats?.peakTime && (
                                <div className="text-xs text-slate-500 mt-1">
                                    At: {new Date(loadStats.peakTime).toLocaleString()}
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
                            <div className="text-sm text-slate-400 mb-1">Average Load</div>
                            <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                                {loadStats?.averageLoad?.toFixed(2)} <span className="text-sm font-normal text-slate-400">kW</span>
                            </div>
                        </div>

                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
                            <div className="text-sm text-slate-400 mb-1">Data Quality</div>
                            <div className="text-2xl font-bold text-white">
                                {loadStats?.dataQuality}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {loadStats?.totalRecords} measured records
                            </div>
                        </div>

                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                            <Battery className="text-green-500 mb-2" size={24} />
                            <div className="text-sm font-semibold text-white">View Battery Analytics</div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Power Flow Analysis (kW)</h3>
                        <div style={{ height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="time" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                        labelStyle={{ color: '#94a3b8' }}
                                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                                    />
                                    <Legend />
                                    <Area type="monotone" name="Consumption (kW)" dataKey="load" stroke="#ef4444" fillOpacity={1} fill="url(#colorLoad)" />
                                    <Area type="monotone" name="Solar PV (kW)" dataKey="pv" stroke="#eab308" fillOpacity={1} fill="url(#colorPv)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
