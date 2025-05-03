import React from 'react';
import { Tabs, Tab } from '@heroui/react';
import { CSVDashboard } from './components/csv-dashboard';
import { KPIRaceDashboard } from './components/kpi-race-dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Tabs aria-label="Dashboard Tabs" className="mb-6">
        <Tab key="csv" title="CSV Explorer">
          <CSVDashboard />
        </Tab>
        <Tab key="kpi" title="KPI Race Dashboard">
          <KPIRaceDashboard />
        </Tab>
      </Tabs>
    </div>
  );
}

export default App;