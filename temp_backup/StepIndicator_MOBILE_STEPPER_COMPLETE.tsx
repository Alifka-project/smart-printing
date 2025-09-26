'use client';

import { Check, ChevronRight } from 'lucide-react';
import type { FC } from 'react';

// --- Tipe Data untuk Props ---
interface StepIndicatorProps {
    activeStep: number;
}

// --- Komponen Indikator Tahap ---
const StepIndicator: FC<StepIndicatorProps> = ({ activeStep }) => {
    const steps = [
        { number: 1, label: "Create A Quote", shortLabel: "Create" },
        { number: 2, label: "Customer Detail", shortLabel: "Customer" },
        { number: 3, label: "Product Spec", shortLabel: "Product" },
        { number: 4, label: "Operational", shortLabel: "Ops" },
        { number: 5, label: "Quotation", shortLabel: "Quote" },
    ];

    return (
        <div className="flex items-center justify-center w-full">
            {/* Mobile & Tablet Layout - 3-Step Sliding Window */}
            <div className="flex lg:hidden items-center justify-center w-full px-4">
                <div className="flex items-center justify-center w-full">
                    {(() => {
                        // Show 3 steps: previous, current, next
                        const startIndex = Math.max(0, Math.min(activeStep - 2, steps.length - 3));
                        const visibleSteps = steps.slice(startIndex, startIndex + 3);
                        
                        return visibleSteps.map((step, index) => {
                            const actualIndex = startIndex + index;
                            const isActive = step.number === activeStep;
                            const isCompleted = step.number < activeStep;
                            const isPrevious = step.number === activeStep - 1;
                            const isNext = step.number === activeStep + 1;
                            
                            // Determine circle size and styling based on screen size
                            let circleSize = "w-10 h-10"; // Default medium
                            let textSize = "text-sm";
                            let labelSize = "text-sm";
                            let labelWeight = "font-medium";
                            let checkSize = "h-5 w-5";
                            
                            if (isActive) {
                                circleSize = "w-12 h-12 sm:w-14 sm:h-14"; // Large for current, bigger on tablet
                                textSize = "text-base sm:text-lg";
                                labelSize = "text-base sm:text-lg";
                                labelWeight = "font-bold";
                                checkSize = "h-5 w-5 sm:h-6 sm:w-6";
                            } else if (isPrevious || isNext) {
                                circleSize = "w-10 h-10 sm:w-12 sm:h-12"; // Medium for adjacent, bigger on tablet
                                textSize = "text-sm sm:text-base";
                                labelSize = "text-sm sm:text-base";
                                labelWeight = "font-medium";
                                checkSize = "h-4 w-4 sm:h-5 sm:w-5";
                            } else {
                                circleSize = "w-8 h-8 sm:w-10 sm:h-10"; // Small for distant steps
                                textSize = "text-xs sm:text-sm";
                                labelSize = "text-xs sm:text-sm";
                                labelWeight = "font-medium";
                                checkSize = "h-3 w-3 sm:h-4 sm:w-4";
                            }
                            
                            return (
                                <div key={step.number} className="flex flex-col items-center relative flex-1">
                                    {/* Step Circle */}
                                    <div className={`group relative flex items-center justify-center ${circleSize} rounded-full font-bold ${textSize} transition-all duration-300 ${
                                        isCompleted 
                                            ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200" 
                                            : isActive 
                                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200" 
                                            : "bg-gray-200 text-gray-700 shadow-md"
                                    }`}>
                                        {isCompleted ? <Check className={checkSize} /> : step.number}
                                        
                                        {/* Active Step Glow Effect */}
                                        {isActive && (
                                            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
                                        )}
                                    </div>
                                    
                                    {/* Step Label */}
                                    <p className={`${labelSize} ${labelWeight} text-center mt-2 transition-all duration-300 ${
                                        isActive 
                                            ? 'text-blue-700' 
                                            : isCompleted 
                                            ? 'text-green-700' 
                                            : 'text-gray-600'
                                    }`}>
                                        {isActive ? step.label : step.shortLabel}
                                    </p>
                                    
                                    {/* Arrow (except for last visible step) */}
                                    {index < visibleSteps.length - 1 && (
                                        <div className="absolute top-6 sm:top-7 right-0 transform translate-x-1/2">
                                            <ChevronRight className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 ${
                                                isCompleted 
                                                    ? 'text-green-500' 
                                                    : 'text-gray-400'
                                            }`} />
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* Desktop Layout - Original Design */}
            <div className="hidden lg:flex flex-row items-center space-y-0">
                {steps.map((step, index) => {
                    const isActive = step.number === activeStep;
                    const isCompleted = step.number < activeStep;
                    
                    return (
                        <div key={step.number} className="flex flex-row items-center">
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
