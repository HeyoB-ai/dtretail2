export interface QbtecTelemetry {
  status: 'operational' | 'warning' | 'maintenance' | 'offline';
  productionRate: number;      // orders/hr
  machineTemp: number;         // °C
  energyLoad: number;          // kW
  defectRate: number;          // %
  activeOperators: number;
  ordersInQueue: number;
  laserPressure: number;       // bar
}

export interface WoerdenTelemetry {
  status: 'operational' | 'warning' | 'maintenance' | 'offline';
  trafficCongestion: number;   // %
  drainageLevel: number;       // %
  urbanHeatIndex: number;      // index out of 10
  parkingVacancy: number;      // spots
  co2Level: number;            // ppm
  energyGridLoad: number;      // %
  rainIntensity: number;       // mm/hr
}

export interface RetailTelemetry {
  status: 'operational' | 'warning' | 'maintenance' | 'offline';
  aisleTraffic: number;        // people
  checkoutQueueLength: number; // people
  averageBasketValue: number;  // EUR
  refrigerationTemp: number;   // °C
  stockLevel: number;          // %
  energyConsumption: number;   // kW
  promoActive: boolean;
}

export type TwinType = 'qbtec' | 'woerden' | 'retail';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}
