import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

export interface Step {
  id: number;
  name: string;
}

const steps: Step[] = [
  { id: 1, name: 'Prepare' },
  { id: 2, name: 'Upload' },
  { id: 3, name: 'Analyze' },
  { id: 4, name: 'Download' },
];

interface StepperProps {
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <div className="py-6 w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full"></div>
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary-600 z-0 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2",
                  isCompleted ? "bg-primary-600 border-primary-600 text-white" : 
                  isCurrent ? "bg-white border-primary-600 text-primary-600" : 
                  "bg-white border-slate-300 text-slate-400"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span className={clsx(
                "mt-2 text-xs font-medium uppercase tracking-wider absolute top-12 whitespace-nowrap",
                isCurrent ? "text-primary-700 font-bold" : "text-slate-500"
              )}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
