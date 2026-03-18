import { useState, useEffect, useCallback } from 'react';

const formatNumber = (num: number, decimals = 0) => {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

function CustomSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix = '',
  suffix = '',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-medium text-foreground/80">{label}</label>
        <span className="text-lg font-semibold text-foreground">
          {prefix}{formatNumber(value)}{suffix}
        </span>
      </div>
      <div className="slider-container">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="custom-slider"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--muted)) ${percentage}%, hsl(var(--muted)) 100%)`
          }}
        />
      </div>
    </div>
  );
}

export default function ROICalculator() {
  const [units, setUnits] = useState(5);
  const [costPerUnit, setCostPerUnit] = useState(100000);
  const [pricePerPeriod, setPricePerPeriod] = useState(150);
  const [occupancy, setOccupancy] = useState(200);
  const [operationalCost, setOperationalCost] = useState(50);
  const [generalOverhead, setGeneralOverhead] = useState(10000);
  const [years, setYears] = useState(10);
  const [isNightMode, setIsNightMode] = useState(true);

  const [totalInvestment, setTotalInvestment] = useState(0);
  const [paybackPeriod, setPaybackPeriod] = useState(0);
  const [annualProfit, setAnnualProfit] = useState(0);
  const [totalROIEuro, setTotalROIEuro] = useState(0);
  const [totalROIPercent, setTotalROIPercent] = useState(0);

  useEffect(() => {
    const investment = units * costPerUnit;
    const revenue = units * pricePerPeriod * occupancy;
    const opCosts = units * operationalCost * occupancy;
    const annualCosts = opCosts + generalOverhead;
    const netProfit = revenue - annualCosts;
    const payback = netProfit > 0 ? investment / netProfit : 0;
    const totalProfit = netProfit * years;
    const roiEuro = totalProfit - investment;
    const roiPercent = investment > 0 ? (roiEuro / investment) * 100 : 0;

    setTotalInvestment(investment);
    setPaybackPeriod(payback);
    setAnnualProfit(netProfit);
    setTotalROIEuro(roiEuro);
    setTotalROIPercent(roiPercent);
  }, [units, costPerUnit, pricePerPeriod, occupancy, operationalCost, generalOverhead, years]);

  const handleModeToggle = useCallback(() => {
    setIsNightMode(prev => {
      const wasNight = prev;
      setOccupancy(wasNight ? 6 : 200);
      setPricePerPeriod(wasNight ? 2000 : 150);
      setOperationalCost(wasNight ? 800 : 50);
      return !wasNight;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Vacation Rental ROI Calculator
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Calculate your potential return on investment for vacation rental properties
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Inputs */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-card-foreground mb-6">Investment Details</h2>

            <CustomSlider
              label="Number of Units"
              value={units}
              onChange={setUnits}
              min={1}
              max={50}
            />

            <CustomSlider
              label="Cost per Unit"
              value={costPerUnit}
              onChange={setCostPerUnit}
              min={30000}
              max={200000}
              step={5000}
              prefix="€"
            />

            {/* Mode Toggle */}
            <div className="mb-6">
              <label className="text-sm font-medium text-foreground/80 mb-3 block">
                Pricing Mode
              </label>
              <div className="bg-muted rounded-lg p-0.5 inline-flex w-full">
                <button
                  onClick={() => !isNightMode && handleModeToggle()}
                  className={`flex-1 py-1.5 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                    isNightMode
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  Per Night
                </button>
                <button
                  onClick={() => isNightMode && handleModeToggle()}
                  className={`flex-1 py-1.5 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                    !isNightMode
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  Per Month
                </button>
              </div>
            </div>

            <CustomSlider
              label={`Price per ${isNightMode ? 'Night' : 'Month'}`}
              value={pricePerPeriod}
              onChange={setPricePerPeriod}
              min={isNightMode ? 50 : 500}
              max={isNightMode ? 500 : 5000}
              step={isNightMode ? 10 : 50}
              prefix="€"
            />

            <CustomSlider
              label={`Occupancy (${isNightMode ? 'days' : 'months'} per year)`}
              value={occupancy}
              onChange={setOccupancy}
              min={0}
              max={isNightMode ? 365 : 12}
              suffix={isNightMode ? ' days' : ' months'}
            />

            <CustomSlider
              label={`Operational Cost per Unit (per ${isNightMode ? 'night' : 'month'})`}
              value={operationalCost}
              onChange={setOperationalCost}
              min={isNightMode ? 10 : 100}
              max={isNightMode ? 200 : 2000}
              step={isNightMode ? 5 : 50}
              prefix="€"
            />

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-foreground/80">
                  General Overhead (Annual)
                </label>
                <span className="text-lg font-semibold text-foreground">
                  €{formatNumber(generalOverhead)}
                </span>
              </div>
              <input
                type="number"
                value={generalOverhead}
                onChange={(e) => setGeneralOverhead(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                step={1000}
                min={0}
              />
            </div>

            <CustomSlider
              label="Years in Operation"
              value={years}
              onChange={setYears}
              min={1}
              max={25}
              suffix=" years"
            />
          </div>

          {/* Right Column - Results */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 shadow-lg border border-primary/20 transition-all duration-500">
              <div className="text-sm font-medium text-foreground/60 mb-2">Total Investment</div>
              <div className="text-4xl md:text-5xl font-bold text-foreground transition-all duration-300">
                €{formatNumber(totalInvestment)}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border transition-all duration-500">
              <div className="text-sm font-medium text-foreground/60 mb-2">Payback Period</div>
              <div className="text-4xl md:text-5xl font-bold text-foreground transition-all duration-300">
                {paybackPeriod > 0 && paybackPeriod < 100
                  ? formatNumber(paybackPeriod, 1)
                  : paybackPeriod >= 100
                  ? '100+'
                  : '—'}
                {paybackPeriod > 0 && paybackPeriod < 100 && (
                  <span className="text-2xl text-foreground/60 ml-2">years</span>
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border transition-all duration-500">
              <div className="text-sm font-medium text-foreground/60 mb-2">Annual Net Profit</div>
              <div
                className={`text-4xl md:text-5xl font-bold transition-all duration-300 ${
                  annualProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {annualProfit >= 0 ? '+' : ''}€{formatNumber(annualProfit)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-8 shadow-lg border border-green-500/20 transition-all duration-500">
              <div className="text-sm font-medium text-foreground/60 mb-2">
                Total ROI ({years} years)
              </div>
              <div
                className={`text-4xl md:text-5xl font-bold transition-all duration-300 ${
                  totalROIEuro >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {totalROIEuro >= 0 ? '+' : ''}€{formatNumber(totalROIEuro)}
              </div>
              <div
                className={`text-2xl font-semibold mt-2 transition-all duration-300 ${
                  totalROIPercent >= 0 ? 'text-green-600/80' : 'text-red-600/80'
                }`}
              >
                {totalROIPercent >= 0 ? '+' : ''}
                {formatNumber(totalROIPercent, 1)}%
              </div>
            </div>

            {/* CTA */}
            <div className="bg-primary rounded-2xl p-8 shadow-lg text-center">
              <h3 className="text-2xl font-bold text-primary-foreground mb-3">
                Ready to Get Started?
              </h3>
              <p className="text-primary-foreground/90 mb-6">
                Contact us today to discuss your vacation rental investment
              </p>
              <button className="bg-primary-foreground text-primary px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .slider-container {
          position: relative;
          width: 100%;
          height: 24px;
          display: flex;
          align-items: center;
        }
        .custom-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 4px solid hsl(var(--background));
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .custom-slider::-webkit-slider-thumb:active {
          transform: scale(1.05);
        }
        .custom-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 4px solid hsl(var(--background));
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .custom-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .custom-slider::-moz-range-thumb:active {
          transform: scale(1.05);
        }
        .custom-slider::-moz-range-track {
          background: transparent;
        }
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}