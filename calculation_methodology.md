# CRS System Calculation Methodology

This document outlines the core mathematical logic used by the CRS engine to size solar PV arrays, battery storage, and specifically the inverter sizing.

## 1. Load Profiling & Coincidence Factor
The system first calculates the total raw power of all appliances running simultaneously. Since it's rare for every appliance to run at the exact same moment, we apply a **Coincidence Factor**:
- **0.85 (85%)** for setups with 1-3 appliances.
- **0.70 (70%)** for setups with > 3 appliances.

To ensure safety, the system checks the single largest appliance (e.g., a heavy motor). The final `Peak Power` is the *greater* of either the coincident peak or the single largest load.

## 2. Inverter Sizing & 25% Buffer
Once the `Peak Power` is established, the inverter is sized using the following steps:

1. **Calculate Required Rating**:
   `Required Inverter kW = Peak Power (kW) × 1.25`
   *(This adds a strict 25% safety buffer for inductive startup surges)*

2. **Step-Rounding to Commercial Unit Sizes**:
   Inverters are not manufactured in infinite sizes (e.g., you can't buy a 5.27kW inverter). The system rounds up to the nearest commercially available unit size based on the phase type:
   - **Single-Phase**: Rounded UP to the nearest **5kW** increment.
   - **Three-Phase**: Rounded UP to the nearest **10kW** increment.

### Example Walkthrough (Why your sizing was 10kW)
If your load profile had a calculated peak continuous load of **4,221W (4.22kW)** on a **Three-Phase** system:

1. **Apply 25% Buffer**: 
   `4.22kW × 1.25 = 5.27kW` (Required Inverter Rating)
2. **Phase Rounding**: 
   Because it is a 3-Phase system, the engine steps up to the nearest 10kW commercial unit block.
   `5.27kW -> rounds up to 10kW`

This results in a **10kW Inverter** being recommended for a 4.22kW load, which creates a **5.7kW headroom buffer**.

## 3. Battery Storage Sizing
The battery bank is sized based on the user's required outage autonomy (e.g., 4h, 8h, 12h) and the Peak Power.

1. `Total Required Energy = Peak Power (kW) × Outage Hours`
2. **Depth of Discharge (DoD) Buffer**: We divide by `0.90` (assuming 90% usable capacity for Lithium-Ion).
3. **Step-Rounding**: Finally, the system rounds up to the nearest **5kWh** battery module increment.

## 4. Solar PV Sizing
1. **Calculate Daily Energy**: `Total Daily kWh = Sum of all (Watts × Hours)`
2. **Raw PV Sizing**: `Daily kWh / (5.5 Peak Sun Hours × 0.85 System Efficiency)`
3. **Step-Rounding**: The engine calculates the required number of 550W panels and ensures the total PV array is a realistic number of panels (rounding up to ensure full charge capability).
