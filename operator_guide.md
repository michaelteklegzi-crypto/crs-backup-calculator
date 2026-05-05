# CRS Field Audit Module: Standard Operating Procedure (SOP)

This guide provides step-by-step instructions for Field Operators using the CRS Field Audit Module on-site.

## Overview
The Field Audit Module is designed as a guided "Wizard". You must complete each step sequentially before finalizing the audit. The data you enter here will directly determine the system sizing and cost proposals for the client.

---

## Step 1: Site Information
This step captures the basic administrative and location details.
1. Click **"New Site Audit"** from the main dashboard.
2. Enter the **Client Name** and **Branch Name** (e.g., "Awash Bank", "Bole Branch").
3. Enter the **Voltage**. For standard Ethiopian grids, use `220V` (Single-Phase) or `380V` (Three-Phase).
4. Select the correct **Phase Type** from the dropdown. This is critical for the engineering engine to accurately size the inverters.
5. Click **"Next Step"**.

## Step 2: Electrical Parameters (Measurements)
This is where you input data gathered from your clamp meter or power analyzer.
1. **Phase Data:**
   - If **Single Phase**: Enter the current (Amps) on the live line.
   - If **Three Phase**: Enter the current (Amps) for the R, S, and T phases. The system will automatically calculate the phase imbalance. > [!WARNING] If phase imbalance is >20%, a warning will appear. Note this in the general notes, as phase balancing may be required before installation.
2. **Load Scenarios:**
   - Record the **Normal Load**, **Peak Load** (e.g., when motors or ACs start up), and **Full Load** (if all equipment is forcibly turned on).
   - *Note: You only need to enter Amperage. The system calculates kW automatically.*
3. Click **"Next Step"**.

## Step 3: Equipment Inventory
Conduct a physical walkthrough of the site and document all critical loads.
1. Click **"Add Item"** for each new equipment group.
2. Enter the Category, Type, Quantity, Power rating (in Watts), and estimated operating hours per day.
3. The system will calculate the total kW load and daily kWh energy consumption.
4. Click **"Next Step"**.

## Step 4: Finalize & Submit
In this final step, you have three options:
1. **Save as Draft**: If you are missing data or need to finish the audit later, click this. The site will be saved as "Draft" on the dashboard.
2. **Export PDF Report**: If the client requires an immediate on-site summary of your findings, click this to download a professionally branded PDF.
3. **Submit Final Audit**: Click this when the audit is 100% complete. This locks the status to "Submitted" and makes it available to the Admins for the final CRS Proposal generation.

> [!IMPORTANT]
> Ensure all your measurements and equipment totals align closely. If the measured peak is drastically different from the equipment inventory total, re-verify your clamp meter readings or look for hidden equipment you missed on-site.
