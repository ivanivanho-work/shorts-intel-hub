import { useState } from 'react';
import { Save, RotateCcw, Info } from 'lucide-react';

interface ScoringWeight {
  name: string;
  description: string;
  weight: number;
  min: number;
  max: number;
}

const defaultWeights: ScoringWeight[] = [
  {
    name: 'Velocity of Views',
    description: 'Rate of increase in views over the last 3 days',
    weight: 30,
    min: 0,
    max: 100,
  },
  {
    name: 'Creation Rate',
    description: 'Number of new videos created using this topic/trend',
    weight: 25,
    min: 0,
    max: 100,
  },
  {
    name: 'Watchtime',
    description: 'Total watchtime and rate of increase',
    weight: 25,
    min: 0,
    max: 100,
  },
  {
    name: 'Trend Freshness',
    description: 'How new the trend is (inverse of age)',
    weight: 15,
    min: 0,
    max: 100,
  },
  {
    name: 'Source Reliability',
    description: 'Reliability score based on data source',
    weight: 5,
    min: 0,
    max: 100,
  },
];

export function ScoringSettings() {
  const [weights, setWeights] = useState<ScoringWeight[]>(defaultWeights);
  const [hasChanges, setHasChanges] = useState(false);

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const isValidTotal = totalWeight === 100;

  const handleWeightChange = (index: number, newWeight: number) => {
    const updatedWeights = [...weights];
    updatedWeights[index].weight = newWeight;
    setWeights(updatedWeights);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (isValidTotal) {
      console.log('Saving scoring weights:', weights);
      // In a real app, this would save to backend/localStorage
      setHasChanges(false);
      alert('Scoring weights saved successfully!');
    }
  };

  const handleReset = () => {
    setWeights(defaultWeights);
    setHasChanges(true);
  };

  return (
    <div className="max-w-4xl">
      {/* Info Banner */}
      <div className="mb-6 p-4 bg-card border border-border rounded-lg flex gap-3">
        <Info className="size-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-foreground font-medium mb-1">Scoring Algorithm Configuration</h4>
          <p className="text-muted-foreground text-sm">
            Adjust the weights below to customize how trends are ranked. The total weight must equal 100%. 
            Changes will affect the ranking in both Summary and Deep Dive views.
          </p>
        </div>
      </div>

      {/* Weight Total Indicator */}
      <div className={`mb-6 p-4 rounded-lg border ${
        isValidTotal 
          ? 'bg-card border-green-500/50' 
          : 'bg-card border-orange-500/50'
      }`}>
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">Total Weight:</span>
          <span className={`text-2xl font-bold ${
            isValidTotal ? 'text-green-500' : 'text-orange-500'
          }`}>
            {totalWeight}%
          </span>
        </div>
        {!isValidTotal && (
          <p className="text-sm text-orange-400 mt-2">
            ⚠️ Total must equal 100% to save changes
          </p>
        )}
      </div>

      {/* Weights Configuration */}
      <div className="space-y-6 mb-6">
        {weights.map((weight, index) => (
          <div key={weight.name} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-foreground font-medium mb-1">{weight.name}</h4>
                <p className="text-muted-foreground text-sm">{weight.description}</p>
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-primary">{weight.weight}%</div>
              </div>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{weight.min}%</span>
              <input
                type="range"
                min={weight.min}
                max={weight.max}
                value={weight.weight}
                onChange={(e) => handleWeightChange(index, parseInt(e.target.value))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${weight.weight}%, var(--color-muted) ${weight.weight}%, var(--color-muted) 100%)`,
                }}
              />
              <span className="text-sm text-muted-foreground">{weight.max}%</span>
              <input
                type="number"
                min={weight.min}
                max={weight.max}
                value={weight.weight}
                onChange={(e) => handleWeightChange(index, parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-center"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || !isValidTotal}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-opacity ${
            !hasChanges || !isValidTotal
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          <Save className="size-5" />
          Save Changes
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
        >
          <RotateCcw className="size-5" />
          Reset to Defaults
        </button>
      </div>

      {/* Explanation Section */}
      <div className="mt-8 p-5 bg-muted rounded-lg">
        <h4 className="text-foreground font-medium mb-3">How Scoring Works</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Each trend receives a normalized score (0-100) for each metric</li>
          <li>• The final score is a weighted average based on your configured weights</li>
          <li>• Higher scores appear at the top of the rankings in the Summary view</li>
          <li>• Trends with negative velocity or age {'>'} 3 weeks receive penalties</li>
          <li>• All scores are recalculated weekly when new data is ingested</li>
        </ul>
      </div>
    </div>
  );
}