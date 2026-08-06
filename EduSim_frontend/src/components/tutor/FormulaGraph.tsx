import React, { useMemo, useState } from "react";
import { FormulaDefinition } from "@/data/formulaRegistry";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label
} from "recharts";

interface Props {
  formulaDef?: FormulaDefinition;
}

export default function FormulaGraph({ formulaDef }: Props) {
  const [constantValue, setConstantValue] = useState(5);
  
  const data = useMemo(() => {
    // Generate some mock data based on the formula type for the graph
    const dataPoints = [];
    
    for (let i = 0; i <= 10; i++) {
      let y = 0;
      if (formulaDef?.graph === "parabola") {
        y = constantValue * Math.pow(i, 2);
      } else if (formulaDef?.graph === "inverse") {
        y = i === 0 ? 0 : constantValue / i;
      } else {
        // Default to line (e.g. F=ma, V=IR)
        y = constantValue * i; 
      }
      dataPoints.push({ x: i, y });
    }
    return dataPoints;
  }, [formulaDef, constantValue]);

  if (!formulaDef) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No graph available for this formula.
      </div>
    );
  }

  // Derive axis labels based on formula mapping.
  // For F=ma: x could be a (Acceleration), y could be F (Force), with m as constant.
  const vars = Object.entries(formulaDef.variables);
  const yAxisLabel = vars.length > 0 ? vars[0][1] : "Y";
  const xAxisLabel = vars.length > 2 ? vars[2][1] : "X";
  const constantLabel = vars.length > 1 ? vars[1][1] : "Constant";

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-sm text-muted-foreground">
          Showing: <strong className="text-foreground">{yAxisLabel}</strong> vs <strong className="text-foreground">{xAxisLabel}</strong>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">{constantLabel}: {constantValue}</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={constantValue} 
            onChange={(e) => setConstantValue(Number(e.target.value))}
            className="w-24 accent-violet-500"
          />
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="x" stroke="rgba(255,255,255,0.5)">
              <Label value={xAxisLabel} offset={-10} position="insideBottom" fill="rgba(255,255,255,0.7)" />
            </XAxis>
            <YAxis stroke="rgba(255,255,255,0.5)">
              <Label value={yAxisLabel} angle={-90} position="insideLeft" fill="rgba(255,255,255,0.7)" style={{ textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#c4b5fd' }}
            />
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              activeDot={{ r: 8, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
