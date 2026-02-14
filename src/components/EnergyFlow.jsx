import React, { useEffect, useState } from 'react';
import { Sun, Moon, Battery, Zap, Home, Cpu, TrendingUp } from 'lucide-react';

const EnergyFlow = ({ hourlyData }) => {
    // Cycle through hours
    const [currentHour, setCurrentHour] = useState(12);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentHour(h => (h + 1) % 24);
            }, 3000); // 3.0s per hour
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const data = hourlyData[currentHour] || hourlyData[0];

    // Flow Logic
    const isDaytime = currentHour >= 6 && currentHour <= 18;
    const isSolarProducing = data.solar > 0;
    const isBatteryCharging = data.batteryFlow > 0;
    const isBatteryDischarging = data.batteryFlow < 0;
    const isGridActive = data.gridImport > 0;
    const isGridExporting = data.gridExport > 0;

    // Helper for line animation duration
    const getSpeed = (watts) => Math.max(0.4, 2 - (Math.abs(watts) / 800));

    // Dynamic Summary Text
    const getSummary = () => {
        if (isGridExporting) return `Surplus solar (${data.gridExport}W) is being exported/wasted while battery is full.`;
        if (isSolarProducing && isBatteryCharging) return `Solar is powering the load (${data.load}W) and charging battery (+${data.batteryFlow}W).`;
        if (!isSolarProducing && isBatteryDischarging) return `Night mode: Battery is covering the load (-${Math.abs(data.batteryFlow)}W).`;
        if (isGridActive && isBatteryDischarging) return `Peak Load! Battery and Grid combined are supplying ${data.load}W.`;
        if (isGridActive) return `Grid is supplying ${data.gridImport}W (Solar/Battery depleted).`;
        return "System standby.";
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{
                background: isDaytime ? 'linear-gradient(to bottom, #0f172a, #1e293b)' : 'linear-gradient(to bottom, #020617, #0f172a)',
                color: 'white', overflow: 'hidden', position: 'relative', border: '1px solid #334155', transition: 'background 1s ease'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', zIndex: 10, position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>System Simulation</h3>
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                            {isPlaying ? 'PAUSE' : 'PLAY'}
                        </button>
                    </div>
                    <div style={{ padding: '0.25rem 0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', fontFamily: 'monospace', border: '1px solid #475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isDaytime ? <Sun size={14} color="#fbbf24" /> : <Moon size={14} color="#94a3b8" />}
                        {data.hour}
                    </div>
                </div>

                {/* Diagram Container */}
                <div style={{ height: '350px', position: 'relative', margin: '0 1rem' }}>

                    {/* SVG Connections Layer */}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'visible' }}>
                        <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Solar -> Inverter */}
                        <path d="M 100 80 L 100 180 L 260 180" stroke="#475569" strokeWidth={isSolarProducing ? 4 : 2} strokeOpacity={isSolarProducing ? 1 : 0.3} fill="none" strokeLinecap="round" />
                        {isSolarProducing && (
                            <circle r="4" fill="#fbbf24" filter="url(#glow)">
                                <animateMotion dur={`${getSpeed(data.solar)}s`} repeatCount="indefinite" path="M 100 80 L 100 180 L 260 180" />
                            </circle>
                        )}

                        {/* Grid -> Inverter */}
                        <path d="M 100 320 L 100 220 L 260 220" stroke="#475569" strokeWidth={isGridActive || isGridExporting ? 4 : 2} strokeOpacity={isGridActive || isGridExporting ? 1 : 0.3} fill="none" strokeLinecap="round" />
                        {isGridActive && (
                            <circle r="4" fill="#ef4444" filter="url(#glow)">
                                <animateMotion dur={`${getSpeed(data.gridImport)}s`} repeatCount="indefinite" path="M 100 320 L 100 220 L 260 220" />
                            </circle>
                        )}
                        {isGridExporting && (
                            <circle r="4" fill="#22c55e">
                                <animateMotion dur="1s" repeatCount="indefinite" path="M 260 220 L 100 220 L 100 320" />
                            </circle>
                        )}

                        {/* Inverter -> Battery */}
                        <path d="M 340 220 L 460 220 L 460 300" stroke="#475569" strokeWidth={isBatteryCharging || isBatteryDischarging ? 4 : 2} strokeOpacity={isBatteryCharging || isBatteryDischarging ? 1 : 0.3} fill="none" strokeLinecap="round" />
                        {isBatteryCharging && (
                            <circle r="4" fill="#22c55e" filter="url(#glow)">
                                <animateMotion dur={`${getSpeed(data.batteryFlow)}s`} repeatCount="indefinite" path="M 340 220 L 460 220 L 460 300" />
                            </circle>
                        )}
                        {isBatteryDischarging && (
                            <circle r="4" fill="#4ade80" filter="url(#glow)">
                                <animateMotion dur={`${getSpeed(data.batteryFlow)}s`} repeatCount="indefinite" path="M 460 300 L 460 220 L 340 220" />
                            </circle>
                        )}

                        {/* Inverter -> Home */}
                        <path d="M 340 180 L 460 180 L 460 80" stroke="#475569" strokeWidth="4" fill="none" strokeLinecap="round" />
                        <circle r="4" fill="#3b82f6" filter="url(#glow)">
                            <animateMotion dur={`${getSpeed(data.load)}s`} repeatCount="indefinite" path="M 340 180 L 460 180 L 460 80" />
                        </circle>

                        {/* Inverter Box */}
                        <rect x="260" y="160" width="80" height="80" rx="8" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
                    </svg>

                    {/* Components Layout */}

                    {/* 1. Solar Array (Top Left) */}
                    <div style={{ position: 'absolute', top: '20px', left: '60px', width: '80px', textAlign: 'center' }}>
                        <div style={{
                            background: '#0f172a', border: `2px solid ${isSolarProducing ? '#fbbf24' : '#334155'}`,
                            borderRadius: '12px', padding: '10px', transition: 'all 0.3s'
                        }}>
                            {isDaytime ? <Sun color={isSolarProducing ? '#fbbf24' : '#64748b'} size={32} /> : <Moon color="#64748b" size={32} />}
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#94a3b8' }}>PV Array</div>
                        <div style={{ fontWeight: 'bold', color: isSolarProducing ? '#fbbf24' : '#64748b' }}>{data.solar} W</div>
                    </div>

                    {/* 2. Grid (Bottom Left) */}
                    <div style={{ position: 'absolute', bottom: '20px', left: '60px', width: '80px', textAlign: 'center' }}>
                        <div style={{
                            background: '#0f172a', border: `2px solid ${isGridActive ? '#ef4444' : (isGridExporting ? '#22c55e' : '#334155')}`,
                            borderRadius: '12px', padding: '10px', transition: 'all 0.3s'
                        }}>
                            <Zap color={isGridActive ? '#ef4444' : (isGridExporting ? '#22c55e' : '#64748b')} size={32} />
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#94a3b8' }}>Grid</div>
                        {isGridExporting ?
                            <div style={{ fontWeight: 'bold', color: '#22c55e' }}>-{data.gridExport} W</div> :
                            <div style={{ fontWeight: 'bold', color: isGridActive ? '#ef4444' : '#64748b' }}>{data.gridImport} W</div>
                        }
                    </div>

                    {/* 3. Inverter (Center) */}
                    <div style={{ position: 'absolute', top: '50%', left: '300px', transform: 'translate(-50%, -50%)', zIndex: 5, textAlign: 'center' }}>
                        <div style={{
                            background: '#1e293b', border: '2px solid #3b82f6',
                            borderRadius: '8px', padding: '15px', width: '80px', height: '80px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 30px rgba(59, 130, 246, 0.15)'
                        }}>
                            <Cpu color="#60a5fa" size={32} />
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '8px', color: '#cbd5e1', background: '#0f172a', padding: '2px 8px', borderRadius: '4px' }}>Inverter</div>
                    </div>

                    {/* 4. Home (Top Right) */}
                    <div style={{ position: 'absolute', top: '20px', right: '60px', width: '80px', textAlign: 'center' }}>
                        <div style={{
                            background: '#0f172a', border: '2px solid #3b82f6',
                            borderRadius: '12px', padding: '10px', transition: 'all 0.3s'
                        }}>
                            <Home color="#60a5fa" size={32} />
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#94a3b8' }}>Load</div>
                        <div style={{ fontWeight: 'bold', color: '#60a5fa' }}>{data.load} W</div>
                    </div>

                    {/* 5. Battery (Bottom Right) */}
                    <div style={{ position: 'absolute', bottom: '20px', right: '60px', width: '80px', textAlign: 'center' }}>
                        <div style={{
                            background: '#0f172a', border: `2px solid ${isBatteryCharging ? '#22c55e' : (isBatteryDischarging ? '#4ade80' : '#334155')}`,
                            borderRadius: '12px', padding: '10px', position: 'relative', overflow: 'hidden'
                        }}>
                            <Battery color={isBatteryCharging || isBatteryDischarging ? '#4ade80' : '#64748b'} size={32} />
                            {/* Fill Level */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, width: '100%',
                                height: `${data.batteryState}%`, background: '#22c55e', opacity: 0.2,
                                transition: 'height 0.5s'
                            }}></div>
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#94a3b8' }}>Battery</div>
                        <div style={{ fontWeight: 'bold', color: '#4ade80' }}>{data.batteryState}%</div>
                    </div>
                </div>

                {/* Status Bar */}
                <div style={{
                    padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid #334155',
                    fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <TrendingUp size={16} color="var(--color-primary)" />
                    {getSummary()}
                </div>
            </div>

            {/* Daily Energy Summary & Recommendation (Static Analysis) */}
            <div className="card" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                <h4 style={{ fontSize: '1rem', color: 'white', marginBottom: '0.5rem' }}>Daily Energy Snapshot</h4>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                    Based on your load profile, your system relies heavily on battery storage during the evening peak.
                    <strong style={{ color: '#fbbf24' }}> Recommendation:</strong> Consider shifting high-power usage (like water pumps or laundry) to mid-day (11:00 - 15:00) when solar production is at its peak to reduce battery strain and grid dependency.
                </p>
            </div>
        </div>
    );
};

export default EnergyFlow;
