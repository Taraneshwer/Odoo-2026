// ============================================================
// SMART DISPATCH SERVICE
// Constraint-aware dispatch recommendation engine
// ============================================================

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
}

export interface SmartDispatchInput {
  source: string;
  destination: string;
  plannedDistance: number;
  cargoWeight: number;
}

export interface ScoreBreakdown {
  fuelEfficiency: number;
  tripCost: number;
  capacityFit: number;
  driverSafety: number;
  vehicleUtilization: number;
}

export type RecommendationReasonType =
  | 'EFFICIENCY'
  | 'COST'
  | 'CAPACITY'
  | 'SAFETY'
  | 'UTILIZATION';

export interface DispatchRecommendationReason {
  type: RecommendationReasonType;
  message: string;
}

export interface DispatchRecommendation {
  rank: number;
  score: number;
  vehicle: Vehicle;
  driver: Driver;
  estimatedTripCost: number;
  scoreBreakdown: ScoreBreakdown;
  reasons: DispatchRecommendationReason[];
}

export interface ExcludedResource {
  id: string;
  type: 'VEHICLE' | 'DRIVER';
  name: string;
  reason: string;
}

export interface SmartDispatchResponse {
  recommendations: DispatchRecommendation[];
  excludedResources: ExcludedResource[];
  totalEligibleVehicles: number;
  totalEligibleDrivers: number;
}

// Configuration
const FUEL_PRICE_PER_LITER = 106; // INR per liter
const VEHICLE_FUEL_EFFICIENCY: Record<string, number> = {
  'Van-05': 12.4,
  'Van-08': 11.2,
  'Van-03': 11.8,
  'Mini Truck-02': 10.1,
  'Truck-12': 8.7,
  'Truck-09': 7.82,
};

// Helper: Get fuel efficiency for a vehicle
function getFuelEfficiency(vehicle: Vehicle): number {
  return VEHICLE_FUEL_EFFICIENCY[vehicle.name] || 10;
}

// Helper: Calculate estimated trip cost
function calculateEstimatedTripCost(
  plannedDistance: number,
  fuelEfficiency: number
): number {
  const estimatedFuelRequired = plannedDistance / fuelEfficiency;
  const estimatedFuelCost = estimatedFuelRequired * FUEL_PRICE_PER_LITER;
  return Math.round(estimatedFuelCost);
}

// Hard constraint: Is vehicle valid?
function isEligibleVehicle(vehicle: Vehicle, cargoWeight: number): boolean {
  // Status must be AVAILABLE
  if (vehicle.status !== 'AVAILABLE') return false;
  // Capacity must support cargo
  if (cargoWeight > vehicle.maxLoadCapacity) return false;
  return true;
}

// Hard constraint: Is driver valid?
function isEligibleDriver(driver: Driver, today: string): boolean {
  // Status must be AVAILABLE
  if (driver.status !== 'AVAILABLE') return false;
  // Licence must not be expired
  const licenseExpiry = new Date(driver.licenseExpiryDate);
  const todayDate = new Date(today);
  if (licenseExpiry < todayDate) return false;
  return true;
}

// Normalize score to 0–100
function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

// Calculate fuel efficiency score (higher efficiency = higher score)
function calculateFuelEfficiencyScore(
  fuelEfficiency: number,
  allEfficiencies: number[]
): number {
  const min = Math.min(...allEfficiencies);
  const max = Math.max(...allEfficiencies);
  return normalizeScore(fuelEfficiency, min, max);
}

// Calculate trip cost score (lower cost = higher score)
function calculateTripCostScore(
  estimatedCost: number,
  allCosts: number[]
): number {
  const min = Math.min(...allCosts);
  const max = Math.max(...allCosts);
  // Invert: lower cost should have higher score
  return 100 - normalizeScore(estimatedCost, min, max);
}

// Calculate capacity fit score (reward appropriate utilization)
function calculateCapacityFitScore(cargoWeight: number, maxCapacity: number): number {
  const utilizationRatio = cargoWeight / maxCapacity;
  // Ideal is 80-95% utilization
  if (utilizationRatio >= 0.8 && utilizationRatio <= 0.95) return 100;
  if (utilizationRatio >= 0.7 && utilizationRatio < 0.8) return 90;
  if (utilizationRatio > 0.95 && utilizationRatio <= 1.0) return 85;
  if (utilizationRatio >= 0.5 && utilizationRatio < 0.7) return 70;
  // Over-capacity is prevented by hard constraints
  return 50; // Very low utilization
}

// Calculate driver safety score (normalize 0-100 to 0-100)
function calculateDriverSafetyScore(safetyScore: number): number {
  return Math.min(100, Math.max(0, safetyScore));
}

// Calculate vehicle utilization score (based on odometer)
function calculateVehicleUtilizationScore(
  odometer: number,
  allOdometers: number[]
): number {
  const min = Math.min(...allOdometers);
  const max = Math.max(...allOdometers);
  // Higher odometer (more used) gets higher score
  return normalizeScore(odometer, min, max);
}

// Generate reasons for recommendation
function generateReasons(
  breakdown: ScoreBreakdown,
  vehicle: Vehicle,
  driver: Driver,
  cargoWeight: number
): DispatchRecommendationReason[] {
  const reasons: DispatchRecommendationReason[] = [];

  // Fuel efficiency reason
  if (breakdown.fuelEfficiency >= 90) {
    reasons.push({
      type: 'EFFICIENCY',
      message: `Excellent fuel efficiency (${getFuelEfficiency(vehicle).toFixed(1)} km/L) among eligible vehicles`,
    });
  } else if (breakdown.fuelEfficiency >= 70) {
    reasons.push({
      type: 'EFFICIENCY',
      message: `Good fuel efficiency (${getFuelEfficiency(vehicle).toFixed(1)} km/L)`,
    });
  }

  // Capacity reason
  const utilizationRatio = (cargoWeight / vehicle.maxLoadCapacity) * 100;
  if (utilizationRatio >= 80 && utilizationRatio <= 95) {
    reasons.push({
      type: 'CAPACITY',
      message: `Strong capacity fit — ${utilizationRatio.toFixed(0)}% of available capacity`,
    });
  }

  // Cost reason
  if (breakdown.tripCost >= 85) {
    reasons.push({
      type: 'COST',
      message: 'Lower estimated trip cost among eligible options',
    });
  }

  // Safety reason
  if (driver.safetyScore >= 85) {
    reasons.push({
      type: 'SAFETY',
      message: `Driver has strong safety record (${driver.safetyScore}/100)`,
    });
  }

  // Utilization reason
  if (breakdown.vehicleUtilization >= 70) {
    reasons.push({
      type: 'UTILIZATION',
      message: 'Vehicle with good operational history',
    });
  }

  return reasons;
}

// Main service function
export function getSmartDispatchRecommendations(
  input: SmartDispatchInput,
  vehicles: Vehicle[],
  drivers: Driver[],
  today: string = new Date().toISOString().split('T')[0]
): SmartDispatchResponse {
  const excludedResources: ExcludedResource[] = [];

  // Step 1: Filter eligible vehicles
  const eligibleVehicles = vehicles.filter(v => isEligibleVehicle(v, input.cargoWeight));
  const ineligibleVehicles = vehicles.filter(
    v => !isEligibleVehicle(v, input.cargoWeight)
  );

  // Record ineligible vehicles
  ineligibleVehicles.forEach(v => {
    if (v.status !== 'AVAILABLE') {
      excludedResources.push({
        id: v.id,
        type: 'VEHICLE',
        name: v.name,
        reason: `Vehicle is currently ${v.status.replace(/_/g, ' ')}`,
      });
    } else {
      excludedResources.push({
        id: v.id,
        type: 'VEHICLE',
        name: v.name,
        reason: `Cargo exceeds maximum capacity by ${input.cargoWeight - v.maxLoadCapacity} kg`,
      });
    }
  });

  // Step 2: Filter eligible drivers
  const eligibleDrivers = drivers.filter(d => isEligibleDriver(d, today));
  const ineligibleDrivers = drivers.filter(
    d => !isEligibleDriver(d, today)
  );

  // Record ineligible drivers
  ineligibleDrivers.forEach(d => {
    if (d.status !== 'AVAILABLE') {
      excludedResources.push({
        id: d.id,
        type: 'DRIVER',
        name: d.name,
        reason: `Driver is currently ${d.status.replace(/_/g, ' ')}`,
      });
    } else {
      excludedResources.push({
        id: d.id,
        type: 'DRIVER',
        name: d.name,
        reason: `Driving licence expired on ${d.licenseExpiryDate}`,
      });
    }
  });

  // Step 3: Generate valid combinations
  const recommendations: DispatchRecommendation[] = [];

  if (eligibleVehicles.length === 0 || eligibleDrivers.length === 0) {
    // No valid combinations
    return {
      recommendations: [],
      excludedResources,
      totalEligibleVehicles: eligibleVehicles.length,
      totalEligibleDrivers: eligibleDrivers.length,
    };
  }

  // Pre-calculate metrics for normalization
  const fuelEfficiencies = eligibleVehicles.map(v => getFuelEfficiency(v));
  const tripCosts = eligibleVehicles.map(v =>
    calculateEstimatedTripCost(input.plannedDistance, getFuelEfficiency(v))
  );
  const odometers = eligibleVehicles.map(v => v.odometer);

  // Step 4: Score all combinations
  eligibleVehicles.forEach(vehicle => {
    eligibleDrivers.forEach(driver => {
      const fuelEfficiency = getFuelEfficiency(vehicle);
      const estimatedTripCost = calculateEstimatedTripCost(
        input.plannedDistance,
        fuelEfficiency
      );

      const scoreBreakdown: ScoreBreakdown = {
        fuelEfficiency: calculateFuelEfficiencyScore(fuelEfficiency, fuelEfficiencies),
        tripCost: calculateTripCostScore(estimatedTripCost, tripCosts),
        capacityFit: calculateCapacityFitScore(
          input.cargoWeight,
          vehicle.maxLoadCapacity
        ),
        driverSafety: calculateDriverSafetyScore(driver.safetyScore),
        vehicleUtilization: calculateVehicleUtilizationScore(
          vehicle.odometer,
          odometers
        ),
      };

      // Calculate weighted dispatch score
      const dispatchScore =
        scoreBreakdown.fuelEfficiency * 0.3 +
        scoreBreakdown.tripCost * 0.25 +
        scoreBreakdown.capacityFit * 0.2 +
        scoreBreakdown.driverSafety * 0.15 +
        scoreBreakdown.vehicleUtilization * 0.1;

      const reasons = generateReasons(
        scoreBreakdown,
        vehicle,
        driver,
        input.cargoWeight
      );

      recommendations.push({
        rank: 0, // Will be set after sorting
        score: Math.round(dispatchScore * 10) / 10, // Round to 1 decimal place
        vehicle,
        driver,
        estimatedTripCost,
        scoreBreakdown,
        reasons,
      });
    });
  });

  // Step 5: Rank by score (descending)
  recommendations.sort((a, b) => b.score - a.score);
  recommendations.forEach((rec, idx) => {
    rec.rank = idx + 1;
  });

  return {
    recommendations,
    excludedResources,
    totalEligibleVehicles: eligibleVehicles.length,
    totalEligibleDrivers: eligibleDrivers.length,
  };
}
