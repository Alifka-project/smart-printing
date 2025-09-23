'use client';

import { Check } from 'lucide-react';
import type { FC } from 'react';

// --- Tipe Data untuk Props ---
interface StepIndicatorProps {
    activeStep: number;
}

// --- Komponen Indikator Tahap ---
const StepIndicator: FC<StepIndicatorProps> = ({ activeStep }) => {
    const steps = [
        { number: 1, label: "Create A Quote" },
        { number: 2, label: "Customer Detail" },
        { number: 3, label: "Product Spec" },
        { number: 4, label: "Operational" },
        { number: 5, label: "Quotation" },
    ];

    return (
        <div className="flex items-center justify-center w-full">
            <div className="flex items-center">
                {steps.map((step, index) => {
                    const isActive = step.number === activeStep;
                    const isCompleted = step.number < activeStep;
                    
                    return (
                        <div key={step.number} className="flex items-center">
                            {/* Step Circle and Label */}
                            <div className="flex flex-col items-center">
                                {/* Step Circle */}
                                <div className={`group relative flex items-center justify-center w-16 h-16 rounded-full font-bold text-xl transition-all duration-300 hover:scale-110 ${
                                    isCompleted 
                                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200 cursor-pointer" 
                                        : isActive 
                                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200" 
                                        : "bg-gray-200 text-gray-700 shadow-md"
                                }`}>
                                    {isCompleted ? <Check className="h-8 w-8" /> : step.number}
                                    
                                    {/* Active Step Glow Effect */}
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
                                    )}
                                    
                                    {/* Hover Glow for Completed Steps */}
                                    {isCompleted && (
                                        <div className="absolute inset-0 rounded-full bg-green-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                                    )}
                                </div>
                                
                                {/* Step Label */}
                                <p className={`text-base text-center font-semibold mt-3 transition-all duration-300 ${
                                    isActive 
                                        ? 'text-blue-700 scale-105' 
                                        : isCompleted 
                                        ? 'text-green-700 group-hover:scale-105' 
                                        : 'text-gray-600'
                                }`}>
                                    {step.label}
                                </p>
                            </div>
                            
                            {/* Connecting Line (except for last step) */}
                            {index < steps.length - 1 && (
                                <div className={`w-20 h-0.5 mx-6 transition-all duration-300 ${
                                    isCompleted 
                                        ? 'bg-green-400' 
                                        : 'bg-gray-300'
                                }`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StepIndicator;
