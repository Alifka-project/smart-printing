"use client";

import type { FC, Dispatch, SetStateAction } from "react";
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calculator, Settings, BarChart3, Edit3, AlertTriangle, Database, Palette, Info, Clock, DollarSign, Search, Building, Plus } from "lucide-react";
import type { QuoteFormData } from "@/types";

interface Step4Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
}

/** Exact HTML calculation logic */
function calculateMaxItemsPerSheet(sheetLength: number, sheetWidth: number, itemLength: number, itemWidth: number) {
  // Orientation 1: Item length aligned with sheet length, item width with sheet width
  const count1 = Math.floor(sheetLength / itemLength) * Math.floor(sheetWidth / itemWidth);

  // Orientation 2: Item length aligned with sheet width, item width with sheet length (rotated)
  const count2 = Math.floor(sheetLength / itemWidth) * Math.floor(sheetWidth / itemLength);

  if (count1 >= count2) {
    return { count: count1, orientation: 'normal' as const };
  } else {
    return { count: count2, orientation: 'rotated' as const };
  }
}

/** Enhanced layout calculation exactly matching HTML logic */
function computeLayout(
  inputWidth: number | null,  // Sheet width (horizontal)
  inputHeight: number | null, // Sheet height (vertical) 
  outputWidth: number | null, // Item width
  outputHeight: number | null // Item height
) {
  if (!inputWidth || !inputHeight || !outputWidth || !outputHeight) {
    return {
      usableW: 0,
      usableH: 0,
      itemsPerSheet: 0,
      efficiency: 0,
      orientation: 'normal' as 'normal' | 'rotated',
      itemsPerRow: 0,
      itemsPerCol: 0
    };
  }

  // Use exact HTML calculation - treating inputHeight as length, inputWidth as width
  const result = calculateMaxItemsPerSheet(inputHeight, inputWidth, outputHeight, outputWidth);
  
  // Calculate actual items per row and column based on orientation
  let itemsPerRow: number;
  let itemsPerCol: number;
  
  if (result.orientation === 'normal') {
    itemsPerRow = Math.floor(inputWidth / outputWidth);
    itemsPerCol = Math.floor(inputHeight / outputHeight);
  } else {
    // Rotated: item dimensions are swapped
    itemsPerRow = Math.floor(inputWidth / outputHeight);
    itemsPerCol = Math.floor(inputHeight / outputWidth);
  }

  const efficiency = (result.count * outputWidth * outputHeight * 100) / (inputWidth * inputHeight);

  return {
    usableW: inputWidth,
    usableH: inputHeight,
    itemsPerSheet: result.count,
    efficiency: Math.min(100, efficiency),
    orientation: result.orientation,
    itemsPerRow,
    itemsPerCol
  };
}

/**
 * Enhanced multi-sheet visualization showing total sheets needed with premium quality
 */
function drawPrintingPattern(
  canvas: HTMLCanvasElement,
  layout: ReturnType<typeof computeLayout>,
  inputWidth: number | null,
  inputHeight: number | null,
  actualSheetsNeeded: number,
  outputWidth: number | null,
  outputHeight: number | null
) {
  if (!inputWidth || !inputHeight || layout.itemsPerSheet === 0 || !outputWidth || !outputHeight) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high DPI for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // Enable ultra-high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clear with premium background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Calculate scaling to fit ONE sheet with maximum size and proper centering
  const padding = 30; // Increased padding for single sheet display
  const canvasUsableWidth = rect.width - 2 * padding;
  const canvasUsableHeight = rect.height - 2 * padding;
  
  // Calculate scaling to fit ONE sheet with maximum size and proper centering
  const scaleX = canvasUsableWidth / inputWidth;
  const scaleY = canvasUsableHeight / inputHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of max size for better visual balance
  
  const scaledSheetWidth = inputWidth * scale;
  const scaledSheetHeight = inputHeight * scale;
  
  // Center the single sheet in the canvas
  const startX = (rect.width - scaledSheetWidth) / 2;
  const startY = (rect.height - scaledSheetHeight) / 2;

  // Draw professional background grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 0.5;
  const gridSize = 20;
  for (let x = 0; x < rect.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }
  for (let y = 0; y < rect.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }

  // Draw ONE sheet instead of multiple sheets in a grid
  // Draw sheet shadow (multiple layers for depth)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.04)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  // Sheet background with subtle gradient
  const sheetGradient = ctx.createLinearGradient(startX, startY, startX, startY + scaledSheetHeight);
  sheetGradient.addColorStop(0, '#ffffff');
  sheetGradient.addColorStop(1, '#fefefe');
  ctx.fillStyle = sheetGradient;
  ctx.fillRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Premium sheet border
  const borderGradient = ctx.createLinearGradient(startX, startY, startX + scaledSheetWidth, startY + scaledSheetHeight);
  borderGradient.addColorStop(0, '#1e40af');
  borderGradient.addColorStop(0.5, '#3b82f6');
  borderGradient.addColorStop(1, '#6366f1');
  
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeRect(startX + 1.5, startY + 1.5, scaledSheetWidth - 3, scaledSheetHeight - 3);

  // Inner highlight border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(startX + 3, startY + 3, scaledSheetWidth - 6, scaledSheetHeight - 6);

  // Calculate item dimensions based on orientation (exactly like HTML)
  let currentItemWidth = outputWidth;
  let currentItemHeight = outputHeight;

  if (layout.orientation === 'rotated') {
    currentItemWidth = outputHeight;
    currentItemHeight = outputWidth;
  }

  const scaledItemWidth = currentItemWidth * scale;
  const scaledItemHeight = currentItemHeight * scale;

  // Draw items on the single sheet (exactly matching HTML logic)
  const itemsPerRow = layout.itemsPerRow;
  const itemsPerCol = layout.itemsPerCol;

  // Enhanced item rendering on the single sheet
  for (let row = 0; row < itemsPerCol; row++) {
    for (let col = 0; col < itemsPerRow; col++) {
      const x = startX + col * scaledItemWidth;
      const y = startY + row * scaledItemHeight;
      
      // Item background with sophisticated gradient
      const itemGradient = ctx.createRadialGradient(
        x + scaledItemWidth / 2, y + scaledItemHeight / 2, 0,
        x + scaledItemWidth / 2, y + scaledItemHeight / 2, Math.max(scaledItemWidth, scaledItemHeight) / 2
      );
      
      if (layout.orientation === 'rotated') {
        itemGradient.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
        itemGradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.08)');
        itemGradient.addColorStop(1, 'rgba(139, 92, 246, 0.02)');
      } else {
        itemGradient.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
        itemGradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.08)');
        itemGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
      }

      ctx.fillStyle = itemGradient;
      ctx.fillRect(x + 1, y + 1, scaledItemWidth - 2, scaledItemHeight - 2);
      
      // Item border
      ctx.strokeStyle = layout.orientation === 'rotated' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, scaledItemWidth - 2, scaledItemHeight - 2);
      
      // Premium highlight effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x + 2, y + 2, scaledItemWidth - 4, 1.5);
      
      // Corner accent for larger items
      if (scaledItemWidth > 12 && scaledItemHeight > 12) {
        ctx.fillStyle = layout.orientation === 'rotated' ? 'rgba(139, 92, 246, 0.7)' : 'rgba(59, 130, 246, 0.7)';
        ctx.fillRect(x + scaledItemWidth - 6, y + 2, 4, 4);
      }
    }
  }

  // Professional dimension labels (exactly like HTML but enhanced)
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 12px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Width dimension line and label
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  
  const dimensionLineY = startY + scaledSheetHeight + 25;
  ctx.beginPath();
  ctx.moveTo(startX, dimensionLineY);
  ctx.lineTo(startX + scaledSheetWidth, dimensionLineY);
  ctx.stroke();
  
  // Width tick marks
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(startX, dimensionLineY - 5);
  ctx.lineTo(startX, dimensionLineY + 5);
  ctx.moveTo(startX + scaledSheetWidth, dimensionLineY - 5);
  ctx.lineTo(startX + scaledSheetWidth, dimensionLineY + 5);
  ctx.stroke();

  // Width label with background
  const widthText = `${inputWidth.toFixed(1)}cm`;
  const widthMetrics = ctx.measureText(widthText);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    dimensionLineY + 8,
    widthMetrics.width + 16,
    20
  );
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    dimensionLineY + 8,
    widthMetrics.width + 16,
    20
  );
  
  ctx.fillStyle = '#374151';
  ctx.fillText(widthText, startX + scaledSheetWidth / 2, dimensionLineY + 18);

  // Height dimension line and label
  ctx.save();
  ctx.translate(startX - 25, startY + scaledSheetHeight / 2);
  ctx.rotate(-Math.PI / 2);
  
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-scaledSheetHeight / 2, 0);
  ctx.lineTo(scaledSheetHeight / 2, 0);
  ctx.stroke();
  
  // Height tick marks
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(-scaledSheetHeight / 2, -5);
  ctx.lineTo(-scaledSheetHeight / 2, 5);
  ctx.moveTo(scaledSheetHeight / 2, -5);
  ctx.lineTo(scaledSheetHeight / 2, 5);
  ctx.stroke();

  // Height label with background
  const heightText = `${inputHeight.toFixed(1)}cm`;
  const heightMetrics = ctx.measureText(heightText);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  
  ctx.fillStyle = '#374151';
  ctx.fillText(heightText, 0, -8);
  ctx.restore();





  // Sheet information overlay for single sheet display
  if (actualSheetsNeeded > 1) {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.font = 'bold 12px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    
    const infoText = `Layout for 1 of ${actualSheetsNeeded} sheets (same pattern)`;
    const infoMetrics = ctx.measureText(infoText);
    
    // Info background
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(
      rect.width - infoMetrics.width - 15,
      35,
      infoMetrics.width + 10,
      18
    );
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.fillText(infoText, rect.width - 10, 37);
  }

  // Orientation indicator (if rotated)
  if (layout.orientation === 'rotated') {
    ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
    ctx.font = 'bold 11px Inter, system-ui, -apple-system, sans-serif';
    const rotatedText = '↻ Items are rotated for optimal fit';
    const rotatedMetrics = ctx.measureText(rotatedText);
    
    // Rotated indicator background
    ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
    ctx.fillRect(
      startX + scaledSheetWidth - rotatedMetrics.width - 10,
      startY + 5,
      rotatedMetrics.width + 10,
      18
    );
    
    ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(rotatedText, startX + scaledSheetWidth - rotatedMetrics.width - 5, startY + 14);
  }
}

/**
 * Draw cutting layout visualization showing how the large input sheet is cut
 */
function drawCuttingLayout(
  canvas: HTMLCanvasElement,
  inputWidth: number,
  inputHeight: number,
  machineMaxWidth: number,
  machineMaxHeight: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high DPI for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // Clear with premium background
  const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Calculate scaling to fit the input sheet
  const padding = 40;
  const canvasUsableWidth = rect.width - 2 * padding;
  const canvasUsableHeight = rect.height - 2 * padding;
  
  const scaleX = canvasUsableWidth / inputWidth;
  const scaleY = canvasUsableHeight / inputHeight;
  const scale = Math.min(scaleX, scaleY) * 0.85;
  
  const scaledSheetWidth = inputWidth * scale;
  const scaledSheetHeight = inputHeight * scale;
  
  // Center the sheet
  const startX = (rect.width - scaledSheetWidth) / 2;
  const startY = (rect.height - scaledSheetHeight) / 2;

  // Draw background grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 0.5;
  const gridSize = 20;
  for (let x = 0; x < rect.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }
  for (let y = 0; y < rect.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }

  // Draw input sheet with shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 15;

  // Input sheet background
  const sheetGradient = ctx.createLinearGradient(startX, startY, startX, startY + scaledSheetHeight);
  sheetGradient.addColorStop(0, '#ffffff');
  sheetGradient.addColorStop(1, '#f8fafc');
  ctx.fillStyle = sheetGradient;
  ctx.fillRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Input sheet border
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeRect(startX + 2, startY + 2, scaledSheetWidth - 4, scaledSheetHeight - 4);

  // Calculate cutting lines
  const cutPieces = calculateCutPieces(inputWidth, inputHeight, machineMaxWidth, machineMaxHeight);
  
  // Draw cutting lines
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  
  // Vertical cutting lines
  cutPieces.verticalCuts.forEach(cutX => {
    const scaledCutX = startX + (cutX * scale);
    ctx.beginPath();
    ctx.moveTo(scaledCutX, startY);
    ctx.lineTo(scaledCutX, startY + scaledSheetHeight);
    ctx.stroke();
  });
  
  // Horizontal cutting lines
  cutPieces.horizontalCuts.forEach(cutY => {
    const scaledCutY = startY + (cutY * scale);
    ctx.beginPath();
    ctx.moveTo(startX, scaledCutY);
    ctx.lineTo(startX + scaledSheetWidth, scaledCutY);
    ctx.stroke();
  });

  // Reset line dash
  ctx.setLineDash([]);

  // Draw cut piece labels
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  cutPieces.pieces.forEach((piece, index) => {
    const pieceX = startX + (piece.x * scale);
    const pieceY = startY + (piece.y * scale);
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;
    
    // Piece number
    ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
    ctx.fillText(`${index + 1}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2);
    
    // Piece dimensions
    ctx.fillStyle = 'rgba(220, 38, 38, 0.7)';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText(`${piece.width.toFixed(1)}×${piece.height.toFixed(1)}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2 + 15);
  });

  // Draw dimension labels
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Width dimension
  const widthText = `${inputWidth.toFixed(1)}cm`;
  const widthY = startY + scaledSheetHeight + 25;
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(startX, widthY);
  ctx.lineTo(startX + scaledSheetWidth, widthY);
  ctx.stroke();
  
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  const widthMetrics = ctx.measureText(widthText);
  ctx.fillRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    widthY + 8,
    widthMetrics.width + 16,
    20
  );
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    widthY + 8,
    widthMetrics.width + 16,
    20
  );
  
  ctx.fillStyle = '#374151';
  ctx.fillText(widthText, startX + scaledSheetWidth / 2, widthY + 18);

  // Height dimension
  ctx.save();
  ctx.translate(startX - 25, startY + scaledSheetHeight / 2);
  ctx.rotate(-Math.PI / 2);
  
  const heightText = `${inputHeight.toFixed(1)}cm`;
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-scaledSheetHeight / 2, 0);
  ctx.lineTo(scaledSheetHeight / 2, 0);
  ctx.stroke();
  
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  const heightMetrics = ctx.measureText(heightText);
  ctx.fillRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  
  ctx.fillStyle = '#374151';
  ctx.fillText(heightText, 0, -8);
  ctx.restore();

  // Cutting information overlay
  ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const infoText = `Cutting Layout: ${cutPieces.pieces.length} pieces`;
  const infoMetrics = ctx.measureText(infoText);
  
  ctx.fillStyle = 'rgba(220, 38, 38, 0.1)';
  ctx.fillRect(10, 10, infoMetrics.width + 10, 18);
  
  ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
  ctx.fillText(infoText, 15, 12);
}

/**
 * Calculate optimal cutting pieces for the input sheet
 */
function calculateCutPieces(inputWidth: number, inputHeight: number, machineMaxWidth: number, machineMaxHeight: number) {
  // Determine the best cutting strategy
  const strategy1 = calculateCutStrategy(inputWidth, inputHeight, machineMaxWidth, machineMaxHeight);
  const strategy2 = calculateCutStrategy(inputHeight, inputWidth, machineMaxWidth, machineMaxHeight); // Rotated
  
  // Choose the better strategy
  const bestStrategy = strategy1.totalPieces >= strategy2.totalPieces ? strategy1 : strategy2;
  
  return bestStrategy;
}

/**
 * Calculate cutting strategy for given dimensions
 */
function calculateCutStrategy(sheetWidth: number, sheetHeight: number, maxWidth: number, maxHeight: number) {
  const pieces: Array<{x: number, y: number, width: number, height: number}> = [];
  const verticalCuts: number[] = [];
  const horizontalCuts: number[] = [];
  
  // Calculate how many pieces fit horizontally
  const piecesPerRow = Math.floor(sheetWidth / maxWidth);
  const piecesPerCol = Math.floor(sheetHeight / maxHeight);
  
  // Calculate actual piece dimensions
  const pieceWidth = sheetWidth / piecesPerRow;
  const pieceHeight = sheetHeight / piecesPerCol;
  
  // Generate pieces
  for (let row = 0; row < piecesPerCol; row++) {
    for (let col = 0; col < piecesPerRow; col++) {
      pieces.push({
        x: col * pieceWidth,
        y: row * pieceHeight,
        width: pieceWidth,
        height: pieceHeight
      });
    }
  }
  
  // Generate cutting lines
  for (let i = 1; i < piecesPerRow; i++) {
    verticalCuts.push(i * pieceWidth);
  }
  for (let i = 1; i < piecesPerCol; i++) {
    horizontalCuts.push(i * pieceHeight);
  }
  
  return {
    pieces,
    verticalCuts,
    horizontalCuts,
    totalPieces: pieces.length,
    pieceWidth,
    pieceHeight,
    piecesPerRow,
    piecesPerCol
  };
}

/**
 * Draw final printing layout showing the cut pieces
 */
function drawFinalPrintingLayout(
  canvas: HTMLCanvasElement,
  cutPieces: ReturnType<typeof calculateCutPieces>,
  outputWidth: number,
  outputHeight: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high DPI for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // Clear with premium background
  const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bgGradient.addColorStop(0, '#f0f9ff');
  bgGradient.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Calculate scaling to fit all cut pieces
  const padding = 40;
  const canvasUsableWidth = rect.width - 2 * padding;
  const canvasUsableHeight = rect.height - 2 * padding;
  
  // Find the maximum dimensions of cut pieces
  const maxPieceWidth = Math.max(...cutPieces.pieces.map(p => p.width));
  const maxPieceHeight = Math.max(...cutPieces.pieces.map(p => p.height));
  
  const scaleX = canvasUsableWidth / (maxPieceWidth * cutPieces.piecesPerRow);
  const scaleY = canvasUsableHeight / (maxPieceHeight * cutPieces.piecesPerCol);
  const scale = Math.min(scaleX, scaleY) * 0.8;
  
  // Center the layout
  const totalWidth = maxPieceWidth * cutPieces.piecesPerRow * scale;
  const totalHeight = maxPieceHeight * cutPieces.piecesPerCol * scale;
  const startX = (rect.width - totalWidth) / 2;
  const startY = (rect.height - totalHeight) / 2;

  // Draw background grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 0.5;
  const gridSize = 20;
  for (let x = 0; x < rect.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }
  for (let y = 0; y < rect.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }

  // Draw cut pieces
  cutPieces.pieces.forEach((piece, index) => {
    const pieceX = startX + (piece.x * scale);
    const pieceY = startY + (piece.y * scale);
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;
    
    // Piece background with gradient
    const pieceGradient = ctx.createLinearGradient(pieceX, pieceY, pieceX + pieceWidth, pieceY + pieceHeight);
    pieceGradient.addColorStop(0, '#ffffff');
    pieceGradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = pieceGradient;
    ctx.fillRect(pieceX, pieceY, pieceWidth, pieceHeight);
    
    // Piece border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(pieceX + 1, pieceY + 1, pieceWidth - 2, pieceHeight - 2);
    
    // Piece number
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${index + 1}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2);
    
    // Piece dimensions
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillText(`${piece.width.toFixed(1)}×${piece.height.toFixed(1)}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2 + 18);
  });

  // Draw final output items on each piece
  cutPieces.pieces.forEach((piece, pieceIndex) => {
    const pieceX = startX + (piece.x * scale);
    const pieceY = startY + (piece.y * scale);
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;
    
    // Calculate how many output items fit on this piece
    const itemsPerRow = Math.floor(piece.width / outputWidth);
    const itemsPerCol = Math.floor(piece.height / outputHeight);
    
    // Draw output items
    for (let row = 0; row < itemsPerCol; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const itemX = pieceX + col * (outputWidth * scale);
        const itemY = pieceY + row * (outputHeight * scale);
        const itemWidth = outputWidth * scale;
        const itemHeight = outputHeight * scale;
        
        // Item background
        const itemGradient = ctx.createRadialGradient(
          itemX + itemWidth / 2, itemY + itemHeight / 2, 0,
          itemX + itemWidth / 2, itemY + itemHeight / 2, Math.max(itemWidth, itemHeight) / 2
        );
        itemGradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
        itemGradient.addColorStop(0.7, 'rgba(34, 197, 94, 0.1)');
        itemGradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');
        
        ctx.fillStyle = itemGradient;
        ctx.fillRect(itemX + 2, itemY + 2, itemWidth - 4, itemHeight - 4);
        
        // Item border
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(itemX + 2, itemY + 2, itemWidth - 4, itemHeight - 4);
        
        // Item highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(itemX + 3, itemY + 3, itemWidth - 6, 1.5);
      }
    }
  });

  // Draw layout information
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const infoText = `Final Printing Layout: ${cutPieces.totalPieces} cut pieces`;
  const infoMetrics = ctx.measureText(infoText);
  
  ctx.fillStyle = 'rgba(30, 64, 175, 0.1)';
  ctx.fillRect(10, 10, infoMetrics.width + 10, 18);
  
  ctx.fillStyle = 'rgba(30, 64, 175, 0.9)';
  ctx.fillText(infoText, 15, 12);

  // Draw efficiency information
  const totalOutputItems = cutPieces.pieces.reduce((total, piece) => {
    const itemsPerRow = Math.floor(piece.width / outputWidth);
    const itemsPerCol = Math.floor(piece.height / outputHeight);
    return total + (itemsPerRow * itemsPerCol);
  }, 0);
  
  const efficiencyText = `Total Output Items: ${totalOutputItems}`;
  const efficiencyMetrics = ctx.measureText(efficiencyText);
  
  ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
  ctx.fillRect(10, 35, efficiencyMetrics.width + 10, 18);
  
  ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
  ctx.fillText(efficiencyText, 15, 37);
}

const Step4Operational: FC<Step4Props> = ({ formData, setFormData }) => {

  // ===== Debug: Log component mount and initial data =====
  React.useEffect(() => {
    console.log('🚀 Step4Operational: Component mounted with data:', {
      productsLength: formData.products.length,
      operationalPapersLength: formData.operational.papers.length,
      products: formData.products.map(p => ({
        name: p.productName,
        quantity: p.quantity,
        papers: p.papers.length,
        colors: p.colors
      })),
      operationalPapers: formData.operational.papers.map(p => ({
        inputWidth: p.inputWidth,
        inputHeight: p.inputHeight,
        outputWidth: p.outputWidth,
        outputHeight: p.outputHeight,
        selectedColors: p.selectedColors,
        pricePerSheet: p.pricePerSheet,
        pricePerPacket: p.pricePerPacket
      }))
    });
    
    // CRITICAL: Initialize operational data structure for multiple products
    initializeOperationalData();
  }, [formData.products]);

  // ===== Initialize operational data structure for multiple products =====
  const initializeOperationalData = () => {
    console.log('🔄 Step4Operational: Initializing operational data structure...');
    
    // Calculate total papers needed across all products
    const totalPapersNeeded = formData.products.reduce((total, product) => total + product.papers.length, 0);
    
    // If operational papers don't match total papers needed, initialize them
    if (formData.operational.papers.length !== totalPapersNeeded) {
      console.log(`📊 Initializing operational data: ${totalPapersNeeded} papers needed, ${formData.operational.papers.length} currently exist`);
      
      const newOperationalPapers: any[] = [];
      let globalPaperIndex = 0;
      
      formData.products.forEach((product, productIndex) => {
        product.papers.forEach((paper, paperIndex) => {
          // Check if we have existing operational data for this paper
          const existingOpPaper = formData.operational.papers[globalPaperIndex];
          
          if (existingOpPaper) {
            // Use existing data
            newOperationalPapers.push(existingOpPaper);
          } else {
            // Create new operational paper entry
            const newOpPaper = {
              inputWidth: null,
              inputHeight: null,
              pricePerPacket: null,
              pricePerSheet: null,
              sheetsPerPacket: null,
              recommendedSheets: 0,
              enteredSheets: null,
              outputWidth: product.closeSize?.width ?? product.flatSize?.width ?? null,
              outputHeight: product.closeSize?.height ?? product.flatSize?.height ?? null,
              selectedColors: product.colors ? [product.colors.front, product.colors.back].filter((color): color is string => Boolean(color)) : []
            };
            newOperationalPapers.push(newOpPaper);
          }
          
          globalPaperIndex++;
        });
      });
      
      // Update form data with proper operational structure
      setFormData(prev => ({
        ...prev,
        operational: {
          ...prev.operational,
          papers: newOperationalPapers
        }
      }));
      
      console.log('✅ Operational data structure initialized:', newOperationalPapers);
    }
    
    // Initialize output dimensions for all products
      const newOutputDimensions: { [productIndex: number]: { width: number; height: number } } = {};
      formData.products.forEach((product, productIndex) => {
      newOutputDimensions[productIndex] = {
        width: product.closeSize?.width ?? product.flatSize?.width ?? 0,
        height: product.closeSize?.height ?? product.flatSize?.height ?? 0
      };
    });
    setOutputDimensions(newOutputDimensions);
    

  };



  // ===== Output size state management =====
  const [outputDimensions, setOutputDimensions] = React.useState<{
    [productIndex: number]: { width: number; height: number }
  }>(() => {
    const initial: { [productIndex: number]: { width: number; height: number } } = {};
    formData.products.forEach((product, index) => {
      // Check if we have saved operational data for this product
      const hasOperationalData = formData.operational.papers.length > index;
      
      if (hasOperationalData) {
        // Use saved operational data if available
        const opPaper = formData.operational.papers[index];
        initial[index] = {
          width: opPaper?.outputWidth ?? product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: opPaper?.outputHeight ?? product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
      } else {
        // Fall back to product dimensions
        initial[index] = {
          width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
      }
    });
    return initial;
  });



  // ===== New simple color codes state =====
  const [paperColors, setPaperColors] = React.useState<{ [productIndex: number]: { [paperIndex: number]: string[] } }>({});
  const [colorInputs, setColorInputs] = React.useState<{ [productIndex: number]: { [paperIndex: number]: string } }>({});
  const [colorSaveStatus, setColorSaveStatus] = React.useState<{ [productIndex: number]: { [paperIndex: number]: 'idle' | 'saving' | 'saved' | 'error' } }>({});
  const [isColorsLoading, setIsColorsLoading] = React.useState(true);
  const [showColorSavedMessage, setShowColorSavedMessage] = React.useState(false);

  // ===== Enhanced helper function to convert color input to CSS color =====
  const getColorFromInput = (colorInput: string): string => {
    const input = colorInput.trim().toLowerCase();
    
    // Handle hex codes
    if (input.startsWith('#')) {
      // Validate hex format
      if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(input)) {
        return input;
      }
      return 'transparent'; // Invalid hex
    }
    
    // Handle common color names with expanded palette
    const colorMap: { [key: string]: string } = {
      // Basic colors
      'red': '#FF0000',
      'green': '#00FF00',
      'blue': '#0000FF',
      'yellow': '#FFFF00',
      'cyan': '#00FFFF',
      'magenta': '#FF00FF',
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#808080',
      'grey': '#808080',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'lime': '#00FF00',
      'navy': '#000080',
      'teal': '#008080',
      'olive': '#808000',
      'maroon': '#800000',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'violet': '#EE82EE',
      'indigo': '#4B0082',
      'coral': '#FF7F50',
      'turquoise': '#40E0D0',
      'lavender': '#E6E6FA',
      'plum': '#DDA0DD',
      'salmon': '#FA8072',
      'khaki': '#F0E68C',
      'azure': '#F0FFFF',
      'ivory': '#FFFFF0',
      'wheat': '#F5DEB3',
      'tan': '#D2B48C',
      'beige': '#F5F5DC',
      'mint': '#F5FFFA',
      'peach': '#FFE5B4',
      'rose': '#FFE4E1',
      'cream': '#FFFDD0',
      'charcoal': '#36454F',
      'slate': '#708090',
      'steel': '#4682B4',
      
      // Process colors
      'cmyk': '#000000', // Black for CMYK
      'k': '#000000',    // Black key
      'm': '#FF00FF',    // Magenta
      'y': '#FFFF00',    // Yellow
      'c': '#00FFFF',    // Cyan
      
      // Additional professional colors
      'forest': '#228B22',
      'emerald': '#50C878',
      'sapphire': '#0F52BA',
      'ruby': '#E0115F',
      'amber': '#FFBF00',
      'chrome': '#E8F1F8',
      'gunmetal': '#2C3539',
      'platinum': '#E5E4E2',
      'titanium': '#C0C0C0',
      'brass': '#B5A642',
      'aluminum': '#848789',
      'nickel': '#727472',
      'zinc': '#7B8C4D'
    };
    
    if (colorMap[input]) {
      return colorMap[input];
    }
    
    // Handle Pantone-like codes with some common mappings
    if (/^[0-9]{3,4}[A-Z]$/i.test(input)) {
      // Map some common Pantone codes to approximate colors
      const pantoneMap: { [key: string]: string } = {
        '185C': '#C8102E', // Pantone Red
        '286C': '#003DA5', // Pantone Blue
        '354C': '#00A651', // Pantone Green
        '116C': '#FFD100', // Pantone Yellow
        '212C': '#FF6F61', // Pantone Coral
        '2925C': '#7BA7BC', // Pantone Blue Gray
        '7545C': '#425563', // Pantone Dark Blue Gray
        '7546C': '#5B6770', // Pantone Medium Blue Gray
        '7547C': '#8E8F8F', // Pantone Light Blue Gray
        '7548C': '#A7A8AA', // Pantone Very Light Blue Gray
        '7549C': '#C6C7C8', // Pantone Very Light Blue Gray
        '7550C': '#E3E3E3', // Pantone Very Light Blue Gray
        '7551C': '#F0F0F0', // Pantone Very Light Blue Gray
        '7552C': '#F8F8F8', // Pantone Very Light Blue Gray
        '7553C': '#FDFDFD', // Pantone Very Light Blue Gray
        '7554C': '#FFFFFF', // Pantone White
        '7555C': '#000000', // Pantone Black
        '7556C': '#1C1C1C', // Pantone Very Dark Gray
        '7557C': '#2D2D2D', // Pantone Dark Gray
        '7558C': '#3D3D3D', // Pantone Medium Dark Gray
        '7559C': '#4D4D4D', // Pantone Medium Gray
        '7560C': '#5D5D5D', // Pantone Medium Light Gray
        '7561C': '#6D6D6D', // Pantone Light Gray
        '7562C': '#7D7D7D', // Pantone Very Light Gray
        '7563C': '#8D8D8D', // Pantone Very Light Gray
        '7564C': '#9D9D9D', // Pantone Very Light Gray
        '7565C': '#ADADAD', // Pantone Very Light Gray
        '7566C': '#BDBDBD', // Pantone Very Light Gray
        '7567C': '#CDCDCD', // Pantone Very Light Gray
        '7568C': '#DDDDDD', // Pantone Very Light Gray
        '7569C': '#EDEDED', // Pantone Very Light Gray
        '7570C': '#FDFDFD'  // Pantone Very Light Gray
      };
      
      if (pantoneMap[input.toUpperCase()]) {
        return pantoneMap[input.toUpperCase()];
      }
      
      // For unknown Pantone codes, show a pattern
      return 'transparent';
    }
    
    // Try to parse as CSS color
    try {
      // Create a temporary element to test if the color is valid
      const temp = document.createElement('div');
      temp.style.color = input;
      if (temp.style.color !== '') {
        return input;
      }
    } catch (e) {
      // Ignore errors
    }
    
    return 'transparent'; // Unknown color
  };

  // ===== Sync local state with formData changes (important for editing existing quotes) =====
  React.useEffect(() => {
    console.log('🔄 Step4Operational: formData changed, syncing local state...', {
      productsLength: formData.products.length,
      operationalPapersLength: formData.operational.papers.length,
      hasOperationalData: formData.operational.papers.some(p => 
        p.inputWidth !== null || p.inputHeight !== null || 
        p.outputWidth !== null || p.outputHeight !== null
      )
    });

    // Sync colors from formData to local state
    const newPaperColors: { [productIndex: number]: { [paperIndex: number]: string[] } } = {};
    formData.products.forEach((product, productIndex) => {
      product.papers.forEach((paper, paperIndex) => {
        // Calculate global paper index
        const globalPaperIndex = formData.products
          .slice(0, productIndex)
          .reduce((total, p) => total + p.papers.length, 0) + paperIndex;
        
        // Get colors from operational data
        const operationalPaper = formData.operational.papers[globalPaperIndex];
        if (operationalPaper?.selectedColors && operationalPaper.selectedColors.length > 0) {
          if (!newPaperColors[productIndex]) newPaperColors[productIndex] = {};
          newPaperColors[productIndex][paperIndex] = operationalPaper.selectedColors;
        }
      });
    });
    
    // Update local state if colors changed
    if (Object.keys(newPaperColors).length > 0) {
      setPaperColors(newPaperColors);
    }
    
    // Set loading to false after initial sync
    setIsColorsLoading(false);

    // If we have operational data, ensure our local state is in sync
    if (formData.operational.papers.length > 0) {
      // Update outputDimensions from operational data
      const newOutputDimensions: { [productIndex: number]: { width: number; height: number } } = {};
      formData.products.forEach((product, productIndex) => {
        // Find the corresponding operational paper for this product
        let globalPaperIndex = 0;
        for (let pi = 0; pi < productIndex; pi++) {
          globalPaperIndex += formData.products[pi].papers.length;
        }
        
        // Use the first paper's operational data for this product
        const opPaper = formData.operational.papers[globalPaperIndex];
        if (opPaper) {
          newOutputDimensions[productIndex] = {
            width: opPaper.outputWidth ?? product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
            height: opPaper.outputHeight ?? product?.closeSize?.height ?? product?.flatSize?.height ?? 0
          };
          console.log(`📏 Syncing outputDimensions for product ${productIndex}:`, newOutputDimensions[productIndex]);
        } else {
          newOutputDimensions[productIndex] = {
            width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
            height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
          };
        }
      });
      
      setOutputDimensions(newOutputDimensions);
    }
  }, [formData.operational.papers, formData.products]);

  // ===== Debug: Monitor color changes =====


  // ===== Track user edits to enteredSheets =====
  const [userEditedSheets, setUserEditedSheets] = React.useState<Set<string>>(new Set());
  
  // ===== Track user edits to input dimensions =====
  const [userEditedInputDimensions, setUserEditedInputDimensions] = React.useState<Set<string>>(new Set());
  
  // ===== Additional costs state =====
  const [additionalCosts, setAdditionalCosts] = React.useState<Array<{
    id: string;
    description: string;
    cost: number;
    comment: string;
  }>>([]);

  // ===== Supplier database modal =====
  const [showSupplierDB, setShowSupplierDB] = React.useState(false);

  // ===== Update outputDimensions when formData changes (e.g., when existing quote is selected) =====
  React.useEffect(() => {
    console.log('📏 Step4Operational: Updating outputDimensions...', {
      productsLength: formData.products.length,
      operationalPapersLength: formData.operational.papers.length
    });
    
    const newOutputDimensions: { [productIndex: number]: { width: number; height: number } } = {};
    
    formData.products.forEach((product, index) => {
      // Check if we have saved operational data for this product
      const hasOperationalData = formData.operational.papers.length > index;
      
      if (hasOperationalData) {
        // Use saved operational data if available
        const opPaper = formData.operational.papers[index];
        newOutputDimensions[index] = {
          width: opPaper?.outputWidth ?? product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: opPaper?.outputHeight ?? product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
        console.log(`📏 Product ${index}: Using operational data - width: ${opPaper?.outputWidth}, height: ${opPaper?.outputHeight}`);
      } else {
        // Fall back to product dimensions
        newOutputDimensions[index] = {
          width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
        console.log(`📏 Product ${index}: Using product dimensions - width: ${product?.closeSize?.width}, height: ${product?.closeSize?.height}`);
      }
    });
    
    console.log('📏 Final outputDimensions:', newOutputDimensions);
    setOutputDimensions(newOutputDimensions);
  }, [formData.products, formData.operational.papers]);

  // ===== Enhanced calculation exactly matching HTML logic =====
  const perPaperCalc = React.useMemo(() => {
    // Calculate for each product with their own paper indices
    return formData.products.map((product, productIndex) => {
      const qty = product?.quantity ?? 0;
      const productDimensions = outputDimensions[productIndex] || { width: 0, height: 0 };

      // Map through the product's papers (not operational papers)
      return product.papers.map((paper, paperIndex) => {
        // Calculate the global paper index for this product's paper
        let globalPaperIndex = 0;
        for (let pi = 0; pi < productIndex; pi++) {
          globalPaperIndex += formData.products[pi].papers.length;
        }
        globalPaperIndex += paperIndex;
        
        const opPaper = formData.operational.papers[globalPaperIndex];
        const layout = computeLayout(
          opPaper?.inputWidth ?? null,
          opPaper?.inputHeight ?? null,
          productDimensions.width,
          productDimensions.height
        );

        const recommendedSheets =
          layout.itemsPerSheet > 0 ? Math.ceil(qty / layout.itemsPerSheet) : 0;

        // Use custom price per sheet if provided, otherwise calculate from packet pricing
        const pricePerSheet = opPaper?.pricePerSheet != null 
          ? opPaper.pricePerSheet
          : (opPaper?.pricePerPacket != null &&
             opPaper?.sheetsPerPacket != null &&
             opPaper.sheetsPerPacket > 0
            ? opPaper.pricePerPacket / opPaper.sheetsPerPacket
            : null);

        return { layout, recommendedSheets, pricePerSheet, opPaper };
      });
    });
  }, [
    formData.operational.papers.length,
    outputDimensions,
    formData.products.length,
  ]);

  // ===== Initialize enteredSheets with recommended values =====
  React.useEffect(() => {
    // Only run this effect once when the component mounts and perPaperCalc is available
    if (perPaperCalc.length > 0 && perPaperCalc[0]?.length > 0) {
      setFormData((prev) => {
        const nextPapers = prev.operational.papers.map((p, i) => {
          // Find which product and paper index this operational paper corresponds to
          let productIndex = 0;
          let paperIndex = 0;
          let currentPaperCount = 0;
          
          for (let pi = 0; pi < formData.products.length; pi++) {
            if (i >= currentPaperCount && i < currentPaperCount + formData.products[pi].papers.length) {
              productIndex = pi;
              paperIndex = i - currentPaperCount;
              break;
            }
            currentPaperCount += formData.products[pi].papers.length;
          }
          
          // Get the recommended sheets from the correct product's calculation
          const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? p.recommendedSheets;
          const paperKey = `paper-${i}`;
          const hasUserEdited = userEditedSheets.has(paperKey);
          
          // IMPORTANT: Preserve existing data when editing existing quotes
          // Check if this paper has existing data that should be preserved
          const hasExistingData = p.inputWidth !== null || p.inputHeight !== null || 
                                 p.pricePerPacket !== null || p.pricePerSheet !== null ||
                                 p.outputWidth !== null || p.outputHeight !== null;
          
          if (hasUserEdited) {
            // User has manually edited this field, keep their value
            return { ...p, recommendedSheets: rec };
          } else if (hasExistingData && p.enteredSheets !== null) {
            // This paper has existing data from a saved quote, preserve it
            return { ...p, recommendedSheets: rec };
          } else {
            // No existing data, use recommended value as default
            return { ...p, recommendedSheets: rec, enteredSheets: rec };
          }
        });

        const hasChanges = nextPapers.some((p, i) => 
          p.enteredSheets !== prev.operational.papers[i]?.enteredSheets ||
          p.recommendedSheets !== prev.operational.papers[i]?.recommendedSheets
        );

        if (!hasChanges) return prev;

        return {
          ...prev,
          operational: {
            ...prev.operational,
            papers: nextPapers,
          },
        };
      });
    }
  }, [perPaperCalc, setFormData, userEditedSheets, formData.products]);

  // ===== Initialize default input sheet sizes and validate output dimensions =====
  React.useEffect(() => {
    setFormData((prev) => {
      const nextPapers = prev.operational.papers.map((p, i) => {
        const updatedPaper = { ...p };
        const paperKey = `input-dimensions-${i}`;
        const hasUserEdited = userEditedInputDimensions.has(paperKey);
        
        // Only set defaults if user hasn't manually edited these values
        if (!hasUserEdited) {
          if (updatedPaper.inputWidth !== 100) {
            updatedPaper.inputWidth = 100;
          }
          if (updatedPaper.inputHeight !== 70) {
            updatedPaper.inputHeight = 70;
          }
        }
        
        return updatedPaper;
      });

      const hasChanges = nextPapers.some((p, i) => 
        p.inputWidth !== prev.operational.papers[i]?.inputWidth ||
        p.inputHeight !== prev.operational.papers[i]?.inputHeight
      );

      if (!hasChanges) return prev;

      return {
        ...prev,
        operational: {
          ...prev.operational,
          papers: nextPapers,
        },
      };
    });
  }, [setFormData, userEditedInputDimensions]);



  // ===== Plates & Units =====
  const { plates, units } = React.useMemo(() => {
    // Check if we have existing operational data that should be preserved
    const hasExistingOperationalData = formData.operational.plates !== null || 
                                      formData.operational.units !== null ||
                                      formData.operational.papers.some(p => 
                                        p.inputWidth !== null || p.inputHeight !== null ||
                                        p.pricePerPacket !== null || p.pricePerSheet !== null
                                      );
    
    // Use user-entered values if available, otherwise use defaults
    const userPlates = formData.operational.plates;
    const userUnits = formData.operational.units;
    
    // If user has entered values, use them; otherwise use defaults
    if (userPlates !== null || userUnits !== null) {
      return {
        plates: userPlates ?? 4, // Default to 4 plates
        units: userUnits ?? 0
      };
    }
    
    // Calculate total plates and units across all products for new quotes
    let totalPlates = 0;
    let totalUnits = 0;

    // Ensure we have products to calculate from
    if (!formData.products || formData.products.length === 0) {
      return { plates: 0, units: 0 };
    }

    formData.products.forEach((product, productIndex) => {
      const sides = product?.sides ?? "1";
      const printing = product?.printingSelection ?? "Digital";

      const p = printing === "Digital" ? 0 : (sides === "2" ? 2 : 1) * 4;
      totalPlates += p;

      // For units, we need to calculate based on the product's papers
      const productPapers = product.papers || [];
      const totalSheets = productPapers.reduce(
        (acc, paper, paperIndex) => {
          // Get the recommended sheets from the correct product's calculation
          const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? 0;
          
          // Find the corresponding operational paper
          let globalPaperIndex = 0;
          for (let pi = 0; pi < productIndex; pi++) {
            globalPaperIndex += formData.products[pi].papers.length;
          }
          globalPaperIndex += paperIndex;
          
          const opPaper = formData.operational.papers[globalPaperIndex];
          if (opPaper) {
            const entered = opPaper.enteredSheets ?? null;
            return acc + (entered != null ? entered : rec);
          }
          return acc + rec;
        },
        0
      );

      totalUnits += totalSheets * (sides === "2" ? 2 : 1);
    });

    // Ensure calculated values are valid and set defaults
    const finalPlates = Math.max(0, totalPlates);
    const finalUnits = Math.max(0, totalUnits);
    
    // Default to 4 plates if no calculation, and use entered sheets for units
    return { 
      plates: finalPlates > 0 ? finalPlates : 4, 
      units: finalUnits > 0 ? finalUnits : 0 
    };
  }, [
    formData.operational.papers,
    perPaperCalc,
    formData.products,
    formData.operational.plates,
    formData.operational.units,
  ]);

  // ===== Sync to state =====
  React.useEffect(() => {
    setFormData((prev) => {
      const nextPapers = prev.operational.papers.map((p, i) => {
        // Find which product and paper index this operational paper corresponds to
        let productIndex = 0;
        let paperIndex = 0;
        let currentPaperCount = 0;
        
        for (let pi = 0; pi < formData.products.length; pi++) {
          if (i >= currentPaperCount && i < currentPaperCount + formData.products[pi].papers.length) {
            productIndex = pi;
            paperIndex = i - currentPaperCount;
            break;
          }
          currentPaperCount += formData.products[pi].papers.length;
        }
        
        // Get the recommended sheets from the correct product's calculation
        const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? p.recommendedSheets;
        
        // REVISION 1: Force "Enter Sheets" to match recommended sheets by default
        // But preserve user edits if they have manually changed the value
        const paperKey = `paper-${i}`;
        const hasUserEdited = userEditedSheets.has(paperKey);
        
        let enteredSheets: number;
        if (hasUserEdited) {
          // User has manually edited this field, keep their value
          enteredSheets = p.enteredSheets ?? rec;
        } else {
          // No user edit, use recommended value as default
          enteredSheets = rec;
        }
        
        return p.recommendedSheets === rec && p.enteredSheets === enteredSheets
          ? p
          : { ...p, recommendedSheets: rec, enteredSheets };
      });

      const samePapers =
        nextPapers.length === prev.operational.papers.length &&
        nextPapers.every(
          (p, i) =>
            p.recommendedSheets === prev.operational.papers[i].recommendedSheets &&
            p.enteredSheets === prev.operational.papers[i].enteredSheets
        );

      const samePlates = prev.operational.plates === plates;
      const sameUnits = prev.operational.units === units;

      if (samePapers && samePlates && sameUnits) return prev;

      return {
        ...prev,
        operational: {
          ...prev.operational,
          papers: nextPapers,
          plates,
          units,
        },
      };
    });
  }, [perPaperCalc, plates, units, setFormData, userEditedSheets, formData.products]);

  // ===== Sync operational papers with product papers =====
  React.useEffect(() => {
    // This effect ensures that operational.papers array is synchronized with product papers
    // When new papers are added in Step 3, we create corresponding operational entries
    const totalProductPapers = formData.products.reduce((total, product) => total + product.papers.length, 0);
    const currentOperationalPapers = formData.operational.papers.length;
    
    if (totalProductPapers !== currentOperationalPapers) {
      setFormData((prev) => {
        const newOperationalPapers: QuoteFormData["operational"]["papers"] = [];
        
        // Create operational paper entries for each product's papers
        formData.products.forEach((product, productIndex) => {
          product.papers.forEach((paper, paperIndex) => {
            // Calculate the global paper index for this product's paper
            const globalPaperIndex = newOperationalPapers.length;
            const existingOpPaper = prev.operational.papers[globalPaperIndex];
            
            // Get recommended sheets from calculations if available
            // Use the product-specific calculation
            const recommendedSheets = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? 1;
            
            // Create new operational paper entry or use existing one
            // IMPORTANT: Preserve existing data when editing existing quotes
            const newOpPaper: QuoteFormData["operational"]["papers"][0] = existingOpPaper || {
              inputWidth: null,
              inputHeight: null,
              pricePerPacket: null,
              pricePerSheet: null,
              sheetsPerPacket: null,
              recommendedSheets: recommendedSheets,
              enteredSheets: recommendedSheets, // Default to recommended value
              outputWidth: null,
              outputHeight: null,
            };
            
            // Update with latest recommended sheets and ensure enteredSheets matches
            // But preserve existing values if they were set from a saved quote
            newOpPaper.recommendedSheets = recommendedSheets;
            
            // Only override enteredSheets if:
            // 1. No existing operational paper, OR
            // 2. User hasn't manually edited it, OR  
            // 3. The existing value is not from a saved quote (i.e., it's the default)
            if (!existingOpPaper || 
                !userEditedSheets.has(`paper-${globalPaperIndex}`) ||
                existingOpPaper.enteredSheets === existingOpPaper.recommendedSheets) {
              newOpPaper.enteredSheets = recommendedSheets;
            }
            
            newOperationalPapers.push(newOpPaper);
          });
        });
        
        return {
          ...prev,
          operational: {
            ...prev.operational,
            papers: newOperationalPapers,
            plates,
            units,
          },
        };
      });
    }
  }, [formData.products, perPaperCalc, userEditedSheets, setFormData, formData.operational.papers.length]);

  // ===== Validation functions =====
  const validateOutputDimensions = (width: number, height: number, inputWidth: number | null, inputHeight: number | null) => {
    if (!inputWidth || !inputHeight) return null;
    
    const canFitNormal = width <= inputWidth && height <= inputHeight;
    const canFitRotated = width <= inputHeight && height <= inputWidth;
    
    if (!canFitNormal && !canFitRotated) {
      return "Output dimensions are too large for the input sheet size in any orientation";
    }
    return null;
  };

  // ===== handlers =====
  const handlePaperOpChange = (
    index: number,
    field: keyof QuoteFormData["operational"]["papers"][0],
    value: string
  ) => {
    const v: number | null = value === "" ? null : parseFloat(value);
    
    // Track user edits to enteredSheets
    if (field === "enteredSheets") {
      const paperKey = `paper-${index}`;
      if (v !== null) {
        setUserEditedSheets(prev => new Set(prev).add(paperKey));
      } else {
        setUserEditedSheets(prev => {
          const newSet = new Set(prev);
          newSet.delete(paperKey);
          return newSet;
        });
      }
    }
    
    // Track user edits to input dimensions
    if (field === "inputWidth" || field === "inputHeight") {
      const paperKey = `input-dimensions-${index}`;
      if (v !== null) {
        setUserEditedInputDimensions(prev => new Set(prev).add(paperKey));
      } else {
        setUserEditedInputDimensions(prev => {
          const newSet = new Set(prev);
          newSet.delete(paperKey);
          return newSet;
        });
      }
    }
    
    const newPapers = [...formData.operational.papers];
    newPapers[index] = { ...newPapers[index], [field]: v };
    setFormData((prev) => ({
      ...prev,
      operational: { ...prev.operational, papers: newPapers },
    }));
  };

  const handleFinishingCostChange = (name: string, value: string) => {
    // REVISION 2: Allow editing finishing costs for each selection from previous step
    const cost = value === "" ? null : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      operational: {
        ...prev.operational,
        finishing: prev.operational.finishing.map((f) =>
          f.name === name ? { ...f, cost } : f
        ),
      },
    }));
  };

  const handlePlatesChange = (value: string) => {
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        operational: {
          ...prev.operational,
          plates: null,
        },
      }));
      return;
    }
    
    const plates = parseFloat(value);
    if (isNaN(plates) || plates < 0) return;
    
    // Prevent unreasonably large values (likely typos)
    if (plates > 1000) return;
    
    setFormData((prev) => ({
      ...prev,
      operational: {
        ...prev.operational,
        plates,
      },
    }));
  };

  const handleUnitsChange = (value: string) => {
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        operational: {
          ...prev.operational,
          units: null,
        },
      }));
      return;
    }
    
    const units = parseFloat(value);
    if (isNaN(units) || units < 0) return;
    
    // Prevent unreasonably large values (likely typos)
    if (units > 1000000) return;
    
    setFormData((prev) => ({
      ...prev,
      operational: {
        ...prev.operational,
        units,
      },
    }));
  };

  const handleOutputDimensionChange = (productIndex: number, field: 'width' | 'height', value: string) => {
    const v = value === "" ? 0 : parseFloat(value);
    setOutputDimensions(prev => ({
      ...prev,
      [productIndex]: {
        ...prev[productIndex],
        [field]: v
      }
    }));
  };





  // ===== Modal state =====
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);
  const [showPricingLogic, setShowPricingLogic] = React.useState(false);
  const [showPaperPrice, setShowPaperPrice] = React.useState<number | null>(null);
  const [showCostBreakdown, setShowCostBreakdown] = React.useState(false);
  const openData =
    openIdx != null
      ? (() => {
          // Find which product and paper index this global paper index corresponds to
          let productIndex = 0;
          let paperIndex = 0;
          let currentPaperCount = 0;
          
          for (let pi = 0; pi < formData.products.length; pi++) {
            if (openIdx >= currentPaperCount && openIdx < currentPaperCount + formData.products[pi].papers.length) {
              productIndex = pi;
              paperIndex = openIdx - currentPaperCount;
              break;
            }
            currentPaperCount += formData.products[pi].papers.length;
          }
          
          return {
            paper: formData.products[productIndex]?.papers[paperIndex],
            op: formData.operational.papers[openIdx],
            calc: perPaperCalc[productIndex]?.[paperIndex],
          };
        })()
      : null;

  // ===== Supplier Database state =====
  const [suppliers, setSuppliers] = React.useState<any[]>([
    // Initial sample suppliers for dropdown
    {
      id: 'initial-supplier-1',
      name: 'Premium Print Supplies',
      contact: 'Mohammed Al Rashid',
      email: 'mohammed@premiumprint.ae',
      phone: '0505555555',
      country: 'UAE',
      city: 'Dubai'
    },
    {
      id: 'initial-supplier-2',
      name: 'Paper Source LLC',
      contact: 'Ahmed Al Mansouri',
      email: 'ahmed@papersourcellc.ae',
      phone: '0501234567',
      country: 'UAE',
      city: 'Dubai'
    }
  ]);
  const [materials, setMaterials] = React.useState<any[]>([
    // Initial sample data to show something immediately
    {
      id: 'initial-1',
      name: 'Premium Card Stock 300gsm',
      gsm: '300',
      cost: 0.85,
      unit: 'per_sheet',
      supplierName: 'Premium Print Supplies',
      supplierContact: 'Mohammed Al Rashid',
      supplierEmail: 'mohammed@premiumprint.ae',
      supplierPhone: '0505555555',
      supplierCountry: 'UAE',
      supplierCity: 'Dubai'
    },
    {
      id: 'initial-2',
      name: 'Glossy Paper 200gsm',
      gsm: '200',
      cost: 0.35,
      unit: 'per_sheet',
      supplierName: 'Paper Source LLC',
      supplierContact: 'Ahmed Al Mansouri',
      supplierEmail: 'ahmed@papersourcellc.ae',
      supplierPhone: '0501234567',
      supplierCountry: 'UAE',
      supplierCity: 'Dubai'
    }
  ]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = React.useState('');
  const [selectedSupplier, setSelectedSupplier] = React.useState('');
  const [selectedGSM, setSelectedGSM] = React.useState('');

  // ===== Fetch suppliers and materials =====
  const fetchSuppliersAndMaterials = async () => {
    try {
      setIsLoadingSuppliers(true);
      console.log('🔄 Fetching suppliers and materials...');
      
      const response = await fetch('/api/suppliers');
      if (!response.ok) {
        throw new Error(`Failed to fetch suppliers: ${response.status}`);
      }
      
      const suppliersData = await response.json();
      console.log('📊 Suppliers data received:', suppliersData.length, 'suppliers');
      setSuppliers(suppliersData);
      
      // Extract all materials from suppliers
      const allMaterials = suppliersData.reduce((acc: any[], supplier: any) => {
        if (supplier.materials && Array.isArray(supplier.materials)) {
          const materialsWithSupplier = supplier.materials.map((material: any) => ({
            id: material.id,
            materialId: material.materialId,
            name: material.name,
            gsm: material.gsm,
            cost: material.cost,
            unit: material.unit,
            status: material.status,
            supplierName: supplier.name,
            supplierContact: supplier.contact,
            supplierEmail: supplier.email,
            supplierPhone: supplier.phone,
            supplierCountry: supplier.country,
            supplierCity: supplier.city
          }));
          acc.push(...materialsWithSupplier);
        }
        return acc;
      }, []);
      
      console.log('📦 Total materials extracted:', allMaterials.length);
      setMaterials(allMaterials);
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error);
      // Keep the initial sample data if API fails
      console.log('Using fallback data');
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  // ===== Auto-fetch data on component mount =====
  React.useEffect(() => {
    fetchSuppliersAndMaterials();
  }, []);
  
  // ===== Force default input dimensions on component mount =====
  React.useEffect(() => {
    // This effect runs once on mount to ensure defaults are set
    setFormData((prev) => {
      const nextPapers = prev.operational.papers.map((p, i) => {
        const updatedPaper = { ...p };
        
        // Force set to 100x70 on first load
        if (updatedPaper.inputWidth !== 100) {
          updatedPaper.inputWidth = 100;
        }
        if (updatedPaper.inputHeight !== 70) {
          updatedPaper.inputHeight = 70;
        }
        
        return updatedPaper;
      });

      const hasChanges = nextPapers.some((p, i) => 
        p.inputWidth !== prev.operational.papers[i]?.inputWidth ||
        p.inputHeight !== prev.operational.papers[i]?.inputHeight
      );

      if (!hasChanges) return prev;

      return {
        ...prev,
        operational: {
          ...prev.operational,
          papers: nextPapers,
        },
      };
    });
  }, []); // Empty dependency array means this runs only once on mount

  // ===== Filter materials based on search and filters =====
  const filteredMaterials = React.useMemo(() => {
    let filtered = materials;
    
    // Filter by search term
    if (supplierSearchTerm) {
      filtered = filtered.filter(material => 
        material.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
        material.gsm?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
        material.supplierName.toLowerCase().includes(supplierSearchTerm.toLowerCase())
      );
    }
    
    // Filter by supplier
    if (selectedSupplier) {
      filtered = filtered.filter(material => material.supplierName === selectedSupplier);
    }
    
    // Filter by GSM range
    if (selectedGSM) {
      const [min, max] = selectedGSM.split('-').map(Number);
      if (max) {
        filtered = filtered.filter(material => {
          const gsm = parseInt(material.gsm);
          return gsm >= min && gsm <= max;
        });
      } else if (selectedGSM === '400+') {
        filtered = filtered.filter(material => {
          const gsm = parseInt(material.gsm);
          return gsm >= 400;
        });
      }
    }
    
    return filtered;
  }, [materials, supplierSearchTerm, selectedSupplier, selectedGSM]);

  // ===== Currency formatter =====
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);



  // ===== Enhanced pricing calculation with packet + sheet logic =====
  const calculateTotalCost = (opPaper: any, actualSheetsNeeded: number) => {
    if (!opPaper) return 0;
    
    const { pricePerSheet, pricePerPacket, sheetsPerPacket } = opPaper;
    
    // If only packet pricing is available
    if (pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0 && pricePerSheet == null) {
      const packetsNeeded = Math.ceil(actualSheetsNeeded / sheetsPerPacket);
      return packetsNeeded * pricePerPacket;
    }
    
    // If only sheet pricing is available
    if (pricePerSheet != null && (pricePerPacket == null || sheetsPerPacket == null || sheetsPerPacket <= 0)) {
      return actualSheetsNeeded * pricePerSheet;
    }
    
    // If both are available, use packet first, then sheet pricing for remaining
    if (pricePerSheet != null && pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0) {
      const fullPackets = Math.floor(actualSheetsNeeded / sheetsPerPacket);
      const remainingSheets = actualSheetsNeeded % sheetsPerPacket;
      
      const packetCost = fullPackets * pricePerPacket;
      const sheetCost = remainingSheets * pricePerSheet;
      
      return packetCost + sheetCost;
    }
    
    return 0;
  };

  // ===== Calculate plates cost =====
  const calculatePlatesCost = () => {
    const platesCount = formData.operational.plates ?? plates ?? 0;
    // Standard plate cost - can be made configurable later
    const costPerPlate = 25; // $25 per plate
    return platesCount * costPerPlate;
  };

  // ===== Calculate units cost =====
  const calculateUnitsCost = () => {
    const unitsCount = formData.operational.units ?? units ?? 0;
    // Standard unit cost - can be made configurable later
    const costPerUnit = 0.05; // $0.05 per unit
    return unitsCount * costPerUnit;
  };

  // ===== Calculate finishing costs =====
  const calculateFinishingCosts = () => {
    let totalFinishingCost = 0;
    
    formData.products.forEach((product, productIndex) => {
      if (product.finishing && product.finishing.length > 0) {
        const actualSheetsNeeded = formData.operational.papers[productIndex]?.enteredSheets ?? 
                                   perPaperCalc[productIndex]?.[0]?.recommendedSheets ?? 0;
        
        product.finishing.forEach(finishingName => {
          const finishingItem = formData.operational.finishing.find(f => f.name === finishingName);
          if (finishingItem && finishingItem.cost != null) {
            totalFinishingCost += finishingItem.cost * actualSheetsNeeded;
          }
        });
      }
    });
    
    return totalFinishingCost;
  };

  // ===== Calculate total project cost =====
  const calculateTotalProjectCost = () => {
    let totalCost = 0;
    
    // Paper costs
    formData.operational.papers.forEach((opPaper, index) => {
      const actualSheetsNeeded = opPaper.enteredSheets ?? 
                                 perPaperCalc[Math.floor(index / formData.products[0]?.papers.length || 1)]?.[index % (formData.products[0]?.papers.length || 1)]?.recommendedSheets ?? 0;
      totalCost += calculateTotalCost(opPaper, actualSheetsNeeded);
    });
    
    // Plates cost
    totalCost += calculatePlatesCost();
    
    // Units cost
    totalCost += calculateUnitsCost();
    
    // Finishing costs
    totalCost += calculateFinishingCosts();
    
    // Additional costs
    totalCost += additionalCosts.reduce((acc, cost) => acc + cost.cost, 0);
    
    return totalCost;
  };

  // ===== Calculate cost per unit =====
  const calculateCostPerUnit = () => {
    const totalCost = calculateTotalProjectCost();
    const totalQuantity = formData.products.reduce((acc, product) => acc + (product.quantity || 0), 0);
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  // ===== Get pricing breakdown for display =====
  const getPricingBreakdown = (opPaper: any, actualSheetsNeeded: number) => {
    if (!opPaper) return { breakdown: [], totalCost: 0 };
    
    const { pricePerSheet, pricePerPacket, sheetsPerPacket } = opPaper;
    const breakdown: Array<{ type: string; quantity: number; unitPrice: number; total: number; description: string }> = [];
    let totalCost = 0;
    
    // If only packet pricing is available
    if (pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0 && pricePerSheet == null) {
      const packetsNeeded = Math.ceil(actualSheetsNeeded / sheetsPerPacket);
      const cost = packetsNeeded * pricePerPacket;
      breakdown.push({
        type: 'packet',
        quantity: packetsNeeded,
        unitPrice: pricePerPacket,
        total: cost,
        description: `${packetsNeeded} packet(s) × ${fmt(pricePerPacket)}`
      });
      totalCost = cost;
    }
    
    // If only sheet pricing is available
    else if (pricePerSheet != null && (pricePerPacket == null || sheetsPerPacket == null || sheetsPerPacket <= 0)) {
      const cost = actualSheetsNeeded * pricePerSheet;
      breakdown.push({
        type: 'sheet',
        quantity: actualSheetsNeeded,
        unitPrice: pricePerSheet,
        total: cost,
        description: `${actualSheetsNeeded} sheet(s) × ${fmt(pricePerSheet)}`
      });
      totalCost = cost;
    }
    
    // If both are available, use packet first, then sheet pricing for remaining
    else if (pricePerSheet != null && pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0) {
      const fullPackets = Math.floor(actualSheetsNeeded / sheetsPerPacket);
      const remainingSheets = actualSheetsNeeded % sheetsPerPacket;
      
      if (fullPackets > 0) {
        const packetCost = fullPackets * pricePerPacket;
        breakdown.push({
          type: 'packet',
          quantity: fullPackets,
          unitPrice: pricePerPacket,
          total: packetCost,
          description: `${fullPackets} packet(s) × ${fmt(pricePerPacket)}`
        });
        totalCost += packetCost;
      }
      
      if (remainingSheets > 0) {
        const sheetCost = remainingSheets * pricePerSheet;
        breakdown.push({
          type: 'sheet',
          quantity: remainingSheets,
          unitPrice: pricePerSheet,
          total: sheetCost,
          description: `${remainingSheets} sheet(s) × ${fmt(pricePerSheet)}`
        });
        totalCost += sheetCost;
      }
    }
    
    return { breakdown, totalCost };
  };

  // ===== Render =====
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold text-slate-900">Operational Details</h3>
        <p className="text-slate-600">Configure paper specifications, costs, and production details</p>
      </div>



      {formData.products.map((product, productIndex) => (
        <div key={productIndex} className="space-y-8">
          {/* Product Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-blue-800 flex items-center">
                  <Package className="w-6 h-6 mr-3" />
                  Product {productIndex + 1}: {product.productName || `Product ${productIndex + 1}`}
                </h4>
                <div className="mt-2 text-blue-700">
                  Quantity: {product.quantity || 0} | Sides: {product.sides} | Printing: {product.printingSelection}
                </div>
              </div>
              {/* Product Color Summary Badge */}
              {(() => {
                const totalColors = product.papers.reduce((total, _, paperIdx) => {
                  return total + (paperColors[productIndex]?.[paperIdx]?.length || 0);
                }, 0);
                
                if (totalColors > 0) {
                  return (
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 border border-purple-300 rounded-full">
                      <Palette className="w-4 h-4 text-purple-700" />
                      <span className="text-sm font-semibold text-purple-800">
                        {totalColors} color{totalColors !== 1 ? 's' : ''} total
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {product.papers.map((paper, paperIndex) => {
            // Calculate the global paper index for this product's paper
            let globalPaperIndex = 0;
            for (let pi = 0; pi < productIndex; pi++) {
              globalPaperIndex += formData.products[pi].papers.length;
            }
            globalPaperIndex += paperIndex;
            
            const opPaper = formData.operational.papers[globalPaperIndex];
            const { layout, recommendedSheets, pricePerSheet } = perPaperCalc[productIndex]?.[paperIndex] ?? {
              layout: {
                usableW: 0,
                usableH: 0,
                itemsPerSheet: 0,
                efficiency: 0,
                orientation: 'normal' as const,
                itemsPerRow: 0,
                itemsPerCol: 0
              },
              recommendedSheets: 0,
              pricePerSheet: null as number | null,
            };

            const inputWidth = opPaper?.inputWidth ?? null;
            const inputHeight = opPaper?.inputHeight ?? null;
            const qty = product?.quantity ?? 0;
            const enteredSheets = opPaper?.enteredSheets ?? null;

            const sheetsNeeded = layout.itemsPerSheet > 0 ? Math.ceil(qty / layout.itemsPerSheet) : 0;
            const actualSheetsNeeded = enteredSheets ? Math.max(sheetsNeeded, enteredSheets) : sheetsNeeded;
            const totalItemsPossible = actualSheetsNeeded * layout.itemsPerSheet;

            // Validation checks
            const dimensionError = validateOutputDimensions(
              outputDimensions[productIndex]?.width ?? 0, 
              outputDimensions[productIndex]?.height ?? 0, 
              inputWidth, 
              inputHeight
            );

            return (
              <div key={`${productIndex}-${paperIndex}`} className="space-y-6">
                                {/* Paper Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-blue-600" />
                      <span className="text-blue-600">
                        {paper.name ? `${paper.name}${paper.gsm ? ` ${paper.gsm}gsm` : ""}` : `Paper ${paperIndex + 1}${paper.gsm ? ` ${paper.gsm}gsm` : ""}`}
                      </span>
                    </h4>
                    {/* Color Count Badge */}
                    {paperColors[productIndex]?.[paperIndex]?.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full">
                        <Palette className="w-3 h-3 text-purple-600" />
                        <span className="text-xs font-medium text-purple-700">
                          {paperColors[productIndex][paperIndex].length} color{paperColors[productIndex][paperIndex].length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPaperPrice(globalPaperIndex)}
                      className="border-blue-500 text-blue-600 hover:bg-blue-500 rounded-xl"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      View Paper Price
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCostBreakdown(true)}
                      className="border-green-500 text-green-600 hover:bg-green-50 rounded-xl"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Cost Breakdown
                    </Button>
                  </div>
                </div>

            {/* Dimension Validation Warning */}
            {dimensionError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">{dimensionError}</span>
                </div>
              </div>
            )}
            
            {/* Output Dimensions Required Warning */}
            {(!outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                  <div>
                    <span className="text-amber-800 font-medium">Output dimensions required</span>
                    <div className="text-amber-700 text-sm mt-1">
                      Please set the output item dimensions in Step 3 before configuring operational details. 
                      This ensures accurate sheet calculations and cost estimates.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Three Cards Layout */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* CARD 1: Paper Specifications */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-600" />
                    Paper Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Paper Size Section */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <Package className="w-4 h-4 mr-2 text-blue-600" />
                      Input Sheet Size
                      <span className="ml-2 text-xs text-blue-600 font-normal">(Default: 100×70 cm)</span>
                    </h5>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Width (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="100"
                          min={0}
                          step="0.1"
                          value={opPaper?.inputWidth ?? 100}
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10"
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "inputWidth", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Height (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="70"
                          value={opPaper?.inputHeight ?? 70}
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10"
                          min={0}
                          step="0.1"
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "inputHeight", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Output Size Section - Now Editable */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <Edit3 className="w-4 h-4 mr-2 text-blue-600" />
                      Output Item Size
                      <span className="ml-2 text-xs text-blue-600 font-normal">(From Step 3)</span>
                    </h5>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Output Width (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="Width"
                          min={0}
                          step="0.1"
                          className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10 ${
                            dimensionError ? 'border-red-300 bg-red-50' : ''
                          }`}
                          value={outputDimensions[productIndex]?.width || ""}
                          onChange={(e) => handleOutputDimensionChange(productIndex, 'width', e.target.value)}
                        />
                        {!outputDimensions[productIndex]?.width && (
                          <div className="text-amber-600 text-xs mt-1">
                            ⚠️ Please set output dimensions in Step 3 first
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Output Height (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="Height"
                          min={0}
                          step="0.1"
                          className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10 ${
                            dimensionError ? 'border-red-300 bg-red-50' : ''
                          }`}
                          value={outputDimensions[productIndex]?.height || ""}
                          onChange={(e) => handleOutputDimensionChange(productIndex, 'height', e.target.value)}
                        />
                        {!outputDimensions[productIndex]?.height && (
                          <div className="text-amber-600 text-xs mt-1">
                            ⚠️ Please set output dimensions in Step 3 first
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sheet Management Section */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                      Sheet Management
                    </h5>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Recommended Sheets
                        </Label>
                        <Input
                          value={recommendedSheets || ""}
                          readOnly
                          className="bg-slate-100 border-slate-300 rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Enter Sheets
                          {!opPaper?.enteredSheets && (
                            <span className="ml-2 text-xs text-blue-600 font-normal">
                              (Default: {recommendedSheets})
                            </span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          min={recommendedSheets || 0}
                          placeholder={recommendedSheets ? String(recommendedSheets) : "e.g. 125"}
                          className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10 ${
                            !opPaper?.enteredSheets ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                          value={opPaper?.enteredSheets ?? recommendedSheets ?? ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value >= (recommendedSheets || 0)) {
                              handlePaperOpChange(globalPaperIndex, "enteredSheets", e.target.value);
                            }
                          }}
                        />
                        {opPaper?.enteredSheets && opPaper.enteredSheets < recommendedSheets && (
                          <div className="text-red-600 text-xs mt-1">
                            Cannot be less than recommended sheets ({recommendedSheets})
                          </div>
                        )}
                        {/* Enhanced auto-selection info */}
                        {!opPaper?.enteredSheets ? (
                          <div className="text-blue-600 text-xs mt-1">
                            ✓ Using recommended sheets as default ({recommendedSheets})
                          </div>
                        ) : opPaper.enteredSheets === recommendedSheets ? (
                          <div className="text-green-600 text-xs mt-1">
                            ✓ Matches recommended sheets
                          </div>
                        ) : (
                          <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                            <span>⚠ Custom value set (recommended: {recommendedSheets})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const paperKey = `paper-${globalPaperIndex}`;
                                setUserEditedSheets(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(paperKey);
                                  return newSet;
                                });
                                handlePaperOpChange(globalPaperIndex, "enteredSheets", String(recommendedSheets));
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Reset to recommended
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Color Codes Section */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <Palette className="w-4 h-4 mr-2 text-blue-600" />
                      Color Codes
                    </h5>
                    
                    <div className="text-xs text-slate-500 mb-2">
                      Add hex codes, Pantone colors, or color names for this paper
                    </div>
                    
                    {/* Color Input */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 relative">
                        <Input
                          type="text"
                          placeholder="e.g., #FF0000, Pantone 185C, Red"
                          value={colorInputs[productIndex]?.[paperIndex] || ''}
                          onChange={(e) => {
                            const newColorInputs = { ...colorInputs };
                            if (!newColorInputs[productIndex]) newColorInputs[productIndex] = {};
                            newColorInputs[productIndex][paperIndex] = e.target.value;
                            setColorInputs(newColorInputs);
                          }}
                          className="h-8 text-sm pr-10"
                        />
                        {/* Color preview */}
                        {colorInputs[productIndex]?.[paperIndex] && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <div 
                              className="w-4 h-4 rounded border border-slate-300"
                              style={{ 
                                backgroundColor: getColorFromInput(colorInputs[productIndex][paperIndex]),
                                backgroundImage: getColorFromInput(colorInputs[productIndex][paperIndex]) === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                                backgroundSize: '4px 4px'
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const colorValue = colorInputs[productIndex]?.[paperIndex];
                          if (colorValue && colorValue.trim()) {
                            // Set saving status
                            const newColorSaveStatus = { ...colorSaveStatus };
                            if (!newColorSaveStatus[productIndex]) newColorSaveStatus[productIndex] = {};
                            newColorSaveStatus[productIndex][paperIndex] = 'saving';
                            setColorSaveStatus(newColorSaveStatus);
                            
                            // Add the color to the local state
                            const newColors = [...(paperColors[productIndex]?.[paperIndex] || [])];
                            newColors.push(colorValue.trim());
                            
                            const newPaperColors = { ...paperColors };
                            if (!newPaperColors[productIndex]) newPaperColors[productIndex] = {};
                            newPaperColors[productIndex][paperIndex] = newColors;
                            setPaperColors(newPaperColors);
                            
                            // Update the form data to sync with database
                            const globalPaperIndex = formData.products
                              .slice(0, productIndex)
                              .reduce((total, product) => total + product.papers.length, 0) + paperIndex;
                            
                            setFormData(prev => ({
                              ...prev,
                              operational: {
                                ...prev.operational,
                                papers: prev.operational.papers.map((paper, index) => 
                                  index === globalPaperIndex 
                                    ? { ...paper, selectedColors: newColors }
                                    : paper
                                )
                              }
                            }));
                            
                            // Clear input
                            const newColorInputs = { ...colorInputs };
                            newColorInputs[productIndex][paperIndex] = '';
                            setColorInputs(newColorInputs);
                            
                            // Set saved status after a short delay
                            setTimeout(() => {
                              setColorSaveStatus(prev => ({
                                ...prev,
                                [productIndex]: {
                                  ...prev[productIndex],
                                  [paperIndex]: 'saved'
                                }
                              }));
                              
                              // Reset to idle after 2 seconds
                              setTimeout(() => {
                                setColorSaveStatus(prev => ({
                                  ...prev,
                                  [productIndex]: {
                                    ...prev[productIndex],
                                    [paperIndex]: 'idle'
                                  }
                                }));
                              }, 2000);
                            }, 500);
                          }
                        }}
                        className={`h-8 px-3 text-xs transition-all duration-200 ${
                          colorSaveStatus[productIndex]?.[paperIndex] === 'saving' 
                            ? 'bg-blue-100 text-blue-700 border-blue-300' 
                            : colorSaveStatus[productIndex]?.[paperIndex] === 'saved'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : ''
                        }`}
                        disabled={!colorInputs[productIndex]?.[paperIndex]?.trim() || colorSaveStatus[productIndex]?.[paperIndex] === 'saving'}
                      >
                        {colorSaveStatus[productIndex]?.[paperIndex] === 'saving' ? (
                          <div className="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        ) : colorSaveStatus[productIndex]?.[paperIndex] === 'saved' ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          'Add'
                        )}
                      </Button>
                    </div>
                    
                    {/* Display Colors */}
                    {paperColors[productIndex]?.[paperIndex]?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {paperColors[productIndex][paperIndex].map((colorCode, colorIndex) => (
                          <div key={colorIndex} className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-slate-200">
                            <div 
                              className="w-3 h-3 rounded border border-slate-300"
                              style={{ 
                                backgroundColor: getColorFromInput(colorCode),
                                backgroundImage: getColorFromInput(colorCode) === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                                backgroundSize: '3px 3px'
                              }}
                            ></div>
                            <span className="text-xs font-mono text-slate-700">{colorCode}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newColors = [...paperColors[productIndex][paperIndex]];
                                newColors.splice(colorIndex, 1);
                                
                                const newPaperColors = { ...paperColors };
                                newPaperColors[productIndex][paperIndex] = newColors;
                                setPaperColors(newPaperColors);
                                
                                // Update the form data to sync with database
                                const globalPaperIndex = formData.products
                                  .slice(0, productIndex)
                                  .reduce((total, product) => total + product.papers.length, 0) + paperIndex;
                                
                                setFormData(prev => ({
                                  ...prev,
                                  operational: {
                                    ...prev.operational,
                                    papers: prev.operational.papers.map((paper, index) => 
                                      index === globalPaperIndex 
                                        ? { ...paper, selectedColors: newColors }
                                        : paper
                                    )
                                  }
                                }));
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: Pricing */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pricing Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-md font-semibold text-slate-700 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                        Cost Details
                      </h5>
                      <div className="flex items-center">
                        <Info className="w-4 h-4 text-blue-600 mr-1" />
                        <button
                          type="button"
                          onClick={() => setShowPricingLogic(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center"
                        >
                          <Info className="w-3 h-3 mr-1" />
                          View Pricing Logic
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Price per Sheet (Direct)
                        </Label>
                        <Input
                          type="number"
                          placeholder="$ 0.00"
                          step="0.0001"
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10"
                          value={opPaper?.pricePerSheet ?? ""}
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "pricePerSheet", e.target.value)
                          }
                        />
                        <div className="text-xs text-slate-500 mt-1">
                          Leave empty to use packet pricing only
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h6 className="text-sm font-medium text-slate-600 mb-3">Packet Pricing:</h6>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 flex items-center">
                              <Package className="w-4 h-4 mr-2" />
                              Sheets per Packet
                            </Label>
                            <Input
                              type="number"
                              placeholder="e.g. 500"
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10"
                              min={0}
                              value={opPaper?.sheetsPerPacket ?? ""}
                              onChange={(e) =>
                                handlePaperOpChange(
                                  globalPaperIndex,
                                  "sheetsPerPacket",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 flex items-center">
                              <DollarSign className="w-4 h-4 mr-2" />
                              Price per Packet
                            </Label>
                            <Input
                              type="number"
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10"
                              placeholder="$ 0.00"
                              value={opPaper?.pricePerPacket ?? ""}
                              onChange={(e) =>
                                handlePaperOpChange(globalPaperIndex, "pricePerPacket", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Pricing Summary */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                        <h6 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                          <Calculator className="w-4 h-4 mr-2" />
                          Pricing Summary
                        </h6>
                        
                        {(() => {
                          const pricingBreakdown = getPricingBreakdown(opPaper, actualSheetsNeeded);
                          const { breakdown, totalCost } = pricingBreakdown;
                          
                          if (breakdown.length === 0) {
                            return (
                              <div className="text-sm text-slate-600">
                                Enter pricing details above to see cost breakdown
                              </div>
                            );
                          }
                          
                          return (
                            <div className="space-y-3">
                              {breakdown.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600">{item.description}</span>
                                  <span className="font-semibold text-blue-700">{fmt(item.total)}</span>
                                </div>
                              ))}
                              <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-blue-800">Total Cost:</span>
                                  <span className="text-lg font-bold text-blue-800">{fmt(totalCost)}</span>
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  Cost per sheet: {fmt(totalCost / actualSheetsNeeded)}
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                  Cost per item: {fmt(calculateTotalProjectCost() / (product?.quantity || 1))}
                                </div>
                                <div className="text-xs text-slate-500 mt-1 italic">
                                  Note: Cost per item includes all project costs (paper, plates, units, finishing, additional)
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 3: Additional Costs */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                    Additional Costs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Production Costs Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-md font-semibold text-slate-700 flex items-center">
                        <Calculator className="w-4 h-4 mr-2 text-blue-600" />
                        Production Costs
                      </h5>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handlePlatesChange("");
                          handleUnitsChange("");
                        }}
                        className="text-xs h-8 px-3"
                      >
                        <Calculator className="w-3 h-3 mr-1" />
                        Auto-calculate
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          No. of plates
                        </Label>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="e.g. 8"
                          className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10 ${
                            !formData.operational.plates ? 'bg-blue-50 border-blue-200' : 'bg-white'
                          }`}
                          value={formData.operational.plates ?? plates ?? ""} 
                          onChange={(e) => handlePlatesChange(e.target.value)}
                        />
                        {!formData.operational.plates ? (
                          <div className="text-blue-600 text-xs mt-1">
                            ✓ Using calculated value: {plates}
                          </div>
                        ) : (
                          <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                            <span>⚠ Custom value set (calculated: {plates})</span>
                            <button
                              type="button"
                              onClick={() => handlePlatesChange("")}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Reset to calculated
                            </button>
                          </div>
                        )}
                        {formData.operational.plates && plates > 0 && Math.abs(formData.operational.plates - plates) > plates * 0.5 && (
                          <div className="text-orange-600 text-xs mt-1">
                            ⚠️ Warning: Custom value differs significantly from calculated value
                          </div>
                        )}
                        {formData.operational.plates && formData.operational.plates === 0 && plates > 0 && (
                          <div className="text-blue-600 text-xs mt-1">
                            ℹ️ Note: Set to 0 (Digital printing - no plates needed)
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          No. of units
                        </Label>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="e.g. 1000"
                          className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10 ${
                            !formData.operational.units ? 'bg-blue-50 border-blue-200' : 'bg-white'
                          }`}
                          value={formData.operational.units ?? units ?? ""} 
                          onChange={(e) => handleUnitsChange(e.target.value)}
                        />
                        {!formData.operational.units ? (
                          <div className="text-blue-600 text-xs mt-1">
                            ✓ Using calculated value: {units}
                          </div>
                        ) : (
                          <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                            <span>⚠ Custom value set (calculated: {units})</span>
                            <button
                              type="button"
                              onClick={() => handleUnitsChange("")}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Reset to calculated
                            </button>
                          </div>
                        )}
                        {formData.operational.units && Math.abs(formData.operational.units - units) > units * 0.5 && (
                          <div className="text-orange-600 text-xs mt-1">
                            ⚠️ Warning: Custom value differs significantly from calculated value
                          </div>
                        )}
                        {formData.operational.units && formData.operational.units === 0 && units > 0 && (
                          <div className="text-blue-600 text-xs mt-1">
                            ℹ️ Note: Set to 0 (No units specified)
                          </div>
                        )}
                      </div>
                      
                      {/* No. of Impressions Field */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          No. of Impressions
                        </Label>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="e.g. 5000"
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10"
                          value={formData.operational.impressions ?? ""} 
                          onChange={(e) => {
                            const impressions = e.target.value === "" ? null : parseFloat(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              operational: {
                                ...prev.operational,
                                impressions,
                              },
                            }));
                          }}
                        />
                      </div>

                    </div>
                  </div>

                  {/* Dynamic Finishing Costs Section - From Previous Step */}
                  {product.finishing.length > 0 && (
                    <div className="space-y-4">
                      <h5 className="text-md font-semibold text-slate-700 flex items-center">
                        <Settings className="w-4 h-4 mr-2 text-blue-600" />
                        Finishing Costs 
                        <span className="ml-2 text-xs text-slate-500">(Editable)</span>
                      </h5>
                      <div className="space-y-4">
                        {formData.operational.finishing
                          .filter((f) => product.finishing.includes(f.name))
                          .map((item) => (
                            <div key={item.name} className="bg-slate-50 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    placeholder="Cost per unit"
                                    step="0.01"
                                    min="0"
                                    className="w-24 h-8 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                    value={item.cost ?? ""}
                                    onChange={(e) => handleFinishingCostChange(item.name, e.target.value)}
                                  />
                                  <span className="text-xs text-slate-500">per unit</span>
                                </div>
                              </div>
                              <div className="text-xs text-slate-500">
                                Cost per unit: {item.cost != null ? fmt(item.cost) : "Not specified"}
                              </div>
                              <div className="text-xs text-slate-500">
                                Total for {actualSheetsNeeded} sheets: {item.cost != null ? fmt(item.cost * actualSheetsNeeded) : "—"}
                              </div>
                            </div>
                          ))}
                        <div className="border-t pt-3 mt-4">
                          <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                            <span className="font-semibold text-slate-800">Total Finishing Cost:</span>
                            <span className="text-lg font-bold text-green-600">
                              {fmt(
                                formData.operational.finishing
                                  .filter((f) => product.finishing.includes(f.name))
                                  .reduce((acc, f) => acc + ((f.cost ?? 0) * actualSheetsNeeded), 0)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Costs Section */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                      Additional Costs
                      <span className="ml-2 text-xs text-slate-500">(Unique project costs)</span>
                    </h5>
                    <div className="space-y-4">
                      {additionalCosts.map((cost, index) => (
                        <div key={cost.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <Input
                                type="text"
                                placeholder="Cost description"
                                className="w-full mb-2 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                value={cost.description}
                                onChange={(e) => {
                                  const newCosts = [...additionalCosts];
                                  newCosts[index].description = e.target.value;
                                  setAdditionalCosts(newCosts);
                                }}
                              />
                              <Input
                                type="number"
                                placeholder="Cost amount"
                                step="0.01"
                                min="0"
                                className="w-32 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                value={cost.cost}
                                onChange={(e) => {
                                  const newCosts = [...additionalCosts];
                                  newCosts[index].cost = parseFloat(e.target.value) || 0;
                                  setAdditionalCosts(newCosts);
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newCosts = additionalCosts.filter((_, i) => i !== index);
                                setAdditionalCosts(newCosts);
                              }}
                              className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <Input
                            type="text"
                            placeholder="Comment (mandatory)"
                            className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            value={cost.comment}
                            onChange={(e) => {
                              const newCosts = [...additionalCosts];
                              newCosts[index].comment = e.target.value;
                              setAdditionalCosts(newCosts);
                            }}
                          />
                          {!cost.comment && (
                            <div className="text-red-600 text-xs mt-1">
                              ⚠️ Comment is mandatory for additional costs
                            </div>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdditionalCosts([
                            ...additionalCosts,
                            {
                              id: Date.now().toString(),
                              description: '',
                              cost: 0,
                              comment: ''
                            }
                          ]);
                        }}
                        className="w-full border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Additional Cost
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            

            {/* Cutting Layout Visualization */}
            <Card className="border-0 shadow-lg w-full mx-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center">
                  <Settings className="w-7 h-7 mr-3 text-red-600" />
                  Cutting Layout Visualization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full px-2">
                <div className="space-y-3">
                  <h5 className="text-lg font-semibold text-slate-700">How the 100×70cm Input Sheet is Cut for Machine Compatibility</h5>
                  
                  {/* Cutting Layout Canvas */}
                  <div className="w-full h-[500px] bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-1 shadow-lg">
                    <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                      <canvas
                        id={`cutting-canvas-${productIndex}-${paperIndex}`}
                        className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                        ref={(canvas) => {
                          if (canvas && opPaper?.inputWidth && opPaper?.inputHeight) {
                            setTimeout(() => {
                              // Machine constraints: 52x72 or 50x35 cm
                              const machineMaxWidth = 52;
                              const machineMaxHeight = 72;
                              drawCuttingLayout(canvas, opPaper.inputWidth, opPaper.inputHeight, machineMaxWidth, machineMaxHeight);
                            }, 150);
                          }
                        }}
                      />
                      {(!opPaper?.inputWidth || !opPaper?.inputHeight) && (
                        <div className="absolute inset-0 grid place-items-center text-lg text-slate-500 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                          <div className="text-center p-8">
                            <div className="text-red-400 mb-4 text-5xl">✂️</div>
                            <div className="font-semibold text-slate-600 text-xl">Input Dimensions Required</div>
                            <div className="text-sm text-slate-400 mt-3">Set input sheet dimensions to preview cutting layout</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cutting Information Cards */}
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    {/* Cutting Strategy */}
                    <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <Settings className="w-4 h-4 mr-2 text-red-600" />
                        Cutting Strategy
                      </h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Input Sheet:</span>
                          <span className="font-semibold text-red-600">
                            {opPaper?.inputWidth?.toFixed(1) ?? "100"} × {opPaper?.inputHeight?.toFixed(1) ?? "70"} cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Machine Max:</span>
                          <span className="font-semibold text-blue-600">
                            52 × 72 cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Alternative:</span>
                          <span className="font-semibold text-blue-600">
                            50 × 35 cm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cutting Results */}
                    <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <Calculator className="w-4 h-4 mr-2 text-red-600" />
                        Cutting Results
                      </h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Cut Pieces:</span>
                          <span className="font-semibold text-red-600">
                            {opPaper?.inputWidth && opPaper?.inputHeight ? 
                              calculateCutPieces(opPaper.inputWidth, opPaper.inputHeight, 52, 72).totalPieces : "–"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Layout:</span>
                          <span className="font-semibold text-blue-600">
                            {opPaper?.inputWidth && opPaper?.inputHeight ? 
                              `${calculateCutPieces(opPaper.inputWidth, opPaper.inputHeight, 52, 72).piecesPerRow}×${calculateCutPieces(opPaper.inputWidth, opPaper.inputHeight, 52, 72).piecesPerCol}` : "–"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Efficiency:</span>
                          <span className="font-semibold text-green-600">
                            {opPaper?.inputWidth && opPaper?.inputHeight ? 
                              ((52 * 72 * calculateCutPieces(opPaper.inputWidth, opPaper.inputHeight, 52, 72).totalPieces) / (opPaper.inputWidth * opPaper.inputHeight) * 100).toFixed(1) : "–"}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Final Printing Layout Visualization */}
            <Card className="border-0 shadow-lg w-full mx-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center">
                  <Palette className="w-7 h-7 mr-3 text-green-600" />
                  Final Printing Layout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full px-2">
                <div className="space-y-3">
                  <h5 className="text-lg font-semibold text-slate-700">Final Printing on Cut Pieces (e.g., 50×35cm)</h5>
                  
                  {/* Final Printing Layout Canvas */}
                  <div className="w-full h-[500px] bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-1 shadow-lg">
                    <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                      <canvas
                        id={`final-printing-canvas-${productIndex}-${paperIndex}`}
                        className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                        ref={(canvas) => {
                          if (canvas && opPaper?.inputWidth && opPaper?.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                            setTimeout(() => {
                              const cutPieces = calculateCutPieces(opPaper.inputWidth, opPaper.inputHeight, 52, 72);
                              drawFinalPrintingLayout(canvas, cutPieces, outputDimensions[productIndex].width, outputDimensions[productIndex].height);
                            }, 150);
                          }
                        }}
                      />
                      {(!opPaper?.inputWidth || !opPaper?.inputHeight || !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height) && (
                        <div className="absolute inset-0 grid place-items-center text-lg text-slate-500 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                          <div className="text-center p-8">
                            <div className="text-green-400 mb-4 text-5xl">🎨</div>
                            <div className="font-semibold text-slate-600 text-xl">Complete Data Required</div>
                            <div className="text-sm text-slate-400 mt-3">Set input dimensions and output dimensions to preview final printing layout</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>


                </div>
              </CardContent>
            </Card>

            {/* Enhanced Sheet Optimization Preview - MAXIMUM SCALE */}
            <Card className="border-0 shadow-lg w-full mx-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center">
                  <BarChart3 className="w-7 h-7 mr-3 text-blue-600" />
                  Single Sheet Layout Visualization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full px-2">
                <div className="space-y-3">
                  <h5 className="text-lg font-semibold text-slate-700">Single Sheet Layout Pattern (All sheets use same pattern)</h5>
                  
                  {/* Single Sheet Canvas Visualization */}
                  <div className="w-full h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-1 shadow-lg">
                    <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                      <canvas
                        id={`ultra-canvas-${productIndex}-${paperIndex}`}
                        className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                        ref={(canvas) => {
                          if (canvas && layout.itemsPerSheet > 0 && opPaper?.inputWidth && opPaper?.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                            setTimeout(() => {
                              drawPrintingPattern(canvas, layout, opPaper.inputWidth, opPaper.inputHeight, actualSheetsNeeded, outputDimensions[productIndex].width, outputDimensions[productIndex].height);
                            }, 150);
                          }
                        }}
                      />
                      {(layout.itemsPerSheet === 0 || dimensionError || !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height) && (
                        <div className="absolute inset-0 grid place-items-center text-lg text-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
                          <div className="text-center p-8">
                            <div className="text-slate-400 mb-4 text-5xl">
                              {dimensionError ? "⚠️" : !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height ? "📏" : "🎯"}
                            </div>
                            <div className="font-semibold text-slate-600 text-xl">
                              {dimensionError ? "Invalid Dimensions" : !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height ? "Output Dimensions Required" : "Configure Dimensions"}
                            </div>
                            <div className="text-sm text-slate-400 mt-3">
                              {dimensionError ? "Adjust item size to fit sheet" : !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height ? "Set output dimensions in Step 3 to preview" : "Set sheet & item sizes to preview"}
                            </div>
                            <div className="text-sm text-slate-400">
                              {dimensionError ? "dimensions properly" : !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height ? "the layout visualization" : "the optimized layout pattern"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Information Cards - Below Canvas */}
                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    {/* Advanced Sheet Analysis */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <Package className="w-4 h-4 mr-2 text-blue-600" />
                        Advanced Sheet Analysis
                      </h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Input Sheet:</span>
                          <span className="font-semibold">
                            {inputWidth?.toFixed(1) ?? "–"} × {inputHeight?.toFixed(1) ?? "–"} cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Sheet Area:</span>
                          <span className="font-semibold text-blue-600">
                            {inputWidth && inputHeight ? (inputWidth * inputHeight).toFixed(1) : "–"} cm²
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Material Efficiency:</span>
                          <span className={`font-semibold ${layout.efficiency > 85 ? 'text-green-600' : layout.efficiency > 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {layout.efficiency ? layout.efficiency.toFixed(1) : "–"}%
                          </span>
                        </div>
                        
                        {/* Waste Analysis */}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Used Area:</span>
                            <span className="font-semibold text-green-600">
                              {inputWidth && inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height && layout.itemsPerSheet 
                                ? (layout.itemsPerSheet * outputDimensions[productIndex].width * outputDimensions[productIndex].height).toFixed(1) 
                                : "–"} cm²
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Waste Area:</span>
                            <span className="font-semibold text-red-600">
                              {inputWidth && inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height && layout.itemsPerSheet 
                                ? ((inputWidth * inputHeight) - (layout.itemsPerSheet * outputDimensions[productIndex].width * outputDimensions[productIndex].height)).toFixed(1) 
                                : "–"} cm²
                            </span>
                          </div>
                        </div>

                        {/* Performance Rating */}
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700 flex items-center">
                              <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                              Performance:
                            </span>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < Math.ceil((layout.efficiency / 100) * 5) 
                                      ? layout.efficiency > 85 ? 'bg-green-500' : layout.efficiency > 70 ? 'bg-yellow-500' : 'bg-red-500'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                              <span className="text-xs font-semibold ml-1">
                                {layout.efficiency > 85 ? 'Excellent' : layout.efficiency > 70 ? 'Good' : layout.efficiency > 50 ? 'Fair' : 'Poor'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Production Intelligence */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <Edit3 className="w-4 h-4 mr-2 text-blue-600" />
                        Production Intelligence
                      </h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Item Size:</span>
                          <span className="font-semibold text-blue-600">
                            {outputDimensions[productIndex]?.width?.toFixed(1) ?? "–"} × {outputDimensions[productIndex]?.height?.toFixed(1) ?? "–"} cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Layout Strategy:</span>
                          <span className={`font-semibold ${layout.orientation === 'rotated' ? 'text-purple-600' : 'text-green-600'}`}>
                            {layout.orientation === 'rotated' ? '↻ Optimized Rotation' : '→ Standard Layout'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Grid Pattern:</span>
                          <span className="font-semibold">
                            {layout.itemsPerRow} × {layout.itemsPerCol} matrix
                          </span>
                        </div>

                        {/* Layout Optimization */}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Items per Sheet:</span>
                            <span className="font-bold text-blue-600 text-lg">{layout.itemsPerSheet}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Space Utilization:</span>
                            <span className={`font-semibold ${layout.efficiency > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {inputWidth && inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height && layout.itemsPerSheet
                                ? ((layout.itemsPerRow * outputDimensions[productIndex].width) / inputWidth * 100).toFixed(1)
                                : "–"}% × {inputWidth && inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height && layout.itemsPerSheet
                                ? ((layout.itemsPerCol * outputDimensions[productIndex].height) / inputHeight * 100).toFixed(1)
                                : "–"}%
                            </span>
                          </div>
                        </div>

                        {/* Optimization Recommendations */}
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <p className="text-xs text-blue-800 font-medium">
                            {layout.efficiency > 85 
                              ? "✓ Optimal layout achieved"
                              : layout.efficiency > 70
                              ? "⚡ Consider alternative orientations"
                              : "⚠️ Low efficiency - review dimensions"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Operations Dashboard */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                        Operations Dashboard
                      </h6>
                      <div className="space-y-3">
                        {/* Production Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-blue-600 font-medium">Required</div>
                            <div className="font-bold text-blue-800">{qty || 0}</div>
                          </div>
                          <div className="bg-orange-50 p-2 rounded">
                            <div className="text-orange-600 font-medium">Sheets</div>
                            <div className="font-bold text-orange-800">{sheetsNeeded}</div>
                          </div>
                        </div>

                        {enteredSheets && (
                          <div className="flex justify-between bg-purple-50 p-2 rounded">
                            <span className="text-purple-700 font-medium">Planned Sheets:</span>
                            <span className="font-bold text-purple-800">{enteredSheets}</span>
                          </div>
                        )}

                        {/* Production Efficiency */}
                        <div className="border-t pt-2">
                          <div className="flex justify-between bg-green-50 p-2 rounded border border-green-200">
                            <span className="text-green-700 font-medium">Production Yield:</span>
                            <span className="font-bold text-green-800">{totalItemsPossible}</span>
                          </div>
                          
                          {totalItemsPossible > qty && (
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between bg-amber-50 p-2 rounded border border-amber-200">
                                <span className="text-amber-700 font-medium">Overproduction:</span>
                                <span className="font-bold text-amber-800">{totalItemsPossible - qty}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-600">Waste Rate:</span>
                                <span className="font-semibold text-red-600">
                                  {((totalItemsPossible - qty) / totalItemsPossible * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cost Efficiency Indicator */}
                        <div className="bg-slate-50 p-2 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700">Cost Efficiency:</span>
                            <div className="text-right">
                              <div className="font-bold text-slate-800">
                                {pricePerSheet ? `${(pricePerSheet * actualSheetsNeeded / qty).toFixed(4)}` : "–"}
                              </div>
                              <div className="text-xs text-slate-500">per item</div>
                            </div>
                          </div>
                        </div>

                        {/* Operational Recommendations */}
                        <div className={`p-2 rounded text-xs font-medium ${
                          layout.efficiency > 85 && totalItemsPossible - qty < qty * 0.1
                            ? 'bg-green-50 text-green-800'
                            : totalItemsPossible - qty > qty * 0.2
                            ? 'bg-red-50 text-red-800'
                            : 'bg-yellow-50 text-yellow-800'
                        }`}>
                          {layout.efficiency > 85 && totalItemsPossible - qty < qty * 0.1
                            ? "🎯 Optimal production setup"
                            : totalItemsPossible - qty > qty * 0.2
                            ? "⚠️ High waste - consider reducing sheets"
                            : "📊 Review setup for optimization"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        );
      })}
        </div>
      ))}

      {/* Enhanced Modal Dialog */}
      <Dialog
        open={showSupplierDB}
        onOpenChange={(open) => {
          setShowSupplierDB(open);
          if (open) {
            fetchSuppliersAndMaterials();
          }
        }}
      >
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <Database className="w-8 h-8 mr-3 text-green-600" />
              Supplier Database & Material Catalog
            </DialogTitle>
            <p className="text-slate-600 mt-2">Browse available materials, suppliers, and pricing information</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Search and Filter Section */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                  <Label htmlFor="material-search" className="text-sm font-medium text-slate-700 flex items-center">
                    <Search className="w-4 h-4 mr-2 text-blue-600" />
                    Search Materials
                  </Label>
                  <Input
                    id="material-search"
                    placeholder="Paper name, GSM, supplier..."
                    className="mt-1"
                    value={supplierSearchTerm}
                    onChange={(e) => setSupplierSearchTerm(e.target.value)}
                  />
                    </div>
                <div>
                  <Label htmlFor="supplier-filter" className="text-sm font-medium text-slate-700 flex items-center">
                    <Building className="w-4 h-4 mr-2 text-blue-600" />
                    Supplier
                  </Label>
                  <select
                    id="supplier-filter"
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  </div>
                <div>
                  <Label htmlFor="gsm-filter" className="text-sm font-medium text-slate-700 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                    GSM Range
                  </Label>
                  <select
                    id="gsm-filter"
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedGSM}
                    onChange={(e) => setSelectedGSM(e.target.value)}
                  >
                    <option value="">All GSM</option>
                    <option value="80-120">80-120 gsm</option>
                    <option value="150-200">150-200 gsm</option>
                    <option value="250-300">250-300 gsm</option>
                    <option value="400+">400+ gsm</option>
                  </select>
                  </div>
                </div>
              </div>

            {/* Professional Materials Table */}
            {isLoadingSuppliers ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <div className="text-slate-600 font-medium">Loading supplier database...</div>
                <div className="text-slate-500 text-sm mt-2">Fetching materials and supplier information</div>
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4 text-6xl">🔍</div>
                <div className="text-slate-600 font-medium text-lg">No materials found</div>
                <div className="text-slate-500 text-sm mt-2">
                  {supplierSearchTerm || selectedSupplier || selectedGSM 
                    ? "Try adjusting your search criteria" 
                    : "No materials available in the database"
                  }
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Material
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          GSM
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredMaterials.map((material, index) => {
                        const isPremium = material.cost > 0.05;
                        const isEco = material.name.toLowerCase().includes('recycled') || material.name.toLowerCase().includes('eco');
                        const isStandard = !isPremium && !isEco;
                        
                        let statusColor = 'bg-blue-100 text-blue-800';
                        let statusText = 'Standard';
                        
                        if (isPremium) {
                          statusColor = 'bg-green-100 text-green-800';
                          statusText = 'Premium';
                        } else if (isEco) {
                          statusColor = 'bg-emerald-100 text-emerald-800';
                          statusText = 'Eco-Friendly';
                        }
                        
                        return (
                          <tr key={material.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-slate-900">{material.name}</div>
                                <div className="text-xs text-slate-500">ID: {material.materialId}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {material.gsm} gsm
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-900">{material.supplierName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900">{material.supplierContact || material.supplierEmail}</div>
                              <div className="text-xs text-slate-500">{material.supplierPhone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900">{material.supplierCity}</div>
                              <div className="text-xs text-slate-500">{material.supplierCountry}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm font-semibold text-slate-900">
                                ${material.cost.toFixed(3)}
                              </div>
                              <div className="text-xs text-slate-500">per {material.unit}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h5 className="font-semibold text-slate-800 mb-3 flex items-center">
                <Info className="w-4 h-4 mr-2 text-blue-600" />
                Material Selection Guidelines
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                  <div>
                  <strong>Printing Method:</strong> Consider digital vs offset compatibility
                    </div>
                <div>
                  <strong>Finish Requirements:</strong> Matte, glossy, or textured surfaces
                  </div>
                <div>
                  <strong>Environmental Impact:</strong> Recycled content and sustainability
                  </div>
                <div>
                  <strong>Cost Optimization:</strong> Balance quality with budget constraints
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={() => setShowSupplierDB(false)} className="px-6 py-2 rounded-xl">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Modal Dialog */}
      <Dialog
        open={openIdx != null}
        onOpenChange={(o) => setOpenIdx(o ? openIdx : null)}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-slate-600 text-base font-normal">
                  Detailed Cost Analysis
                </div>
                <div className="text-slate-800 text-xl font-bold">
                  {openData?.paper?.name || "Paper"} {openData?.paper?.gsm ? `${openData.paper.gsm}gsm` : ""}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {openData ? (
            <div className="space-y-8">
              {/* Top Row - Specifications & Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sheet Specifications Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <h6 className="text-lg font-semibold text-slate-800">Sheet Specifications</h6>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Sheet Dimensions</span>
                      <span className="font-bold text-slate-800 text-lg">
                        {openData.op?.inputWidth ?? "—"} × {openData.op?.inputHeight ?? "—"} cm
                      </span>
                    </div>
                                          <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl">
                        <span className="text-slate-600 font-medium">Usable Area</span>
                        <span className="font-bold text-green-700 text-lg">
                          {openData.calc?.layout.usableW?.toFixed(1) ?? "—"} × {openData.calc?.layout.usableH?.toFixed(1) ?? "—"} cm
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-xl">
                        <span className="text-slate-600 font-medium">Total Cost</span>
                        <span className="font-bold text-blue-700 text-lg">
                          {(() => {
                            const totalCost = calculateTotalCost(openData.op, openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0);
                            return totalCost > 0 ? fmt(totalCost) : "—";
                          })()}
                        </span>
                      </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Layout Efficiency</span>
                      <span className={`font-bold text-lg ${(openData.calc?.layout.efficiency ?? 0) > 80 ? 'text-green-600' : (openData.calc?.layout.efficiency ?? 0) > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {openData.calc?.layout.efficiency?.toFixed(1) ?? "—"}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Layout Details Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <h6 className="text-lg font-semibold text-slate-800">Layout Details</h6>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Grid Layout</span>
                      <span className="font-bold text-slate-800 text-lg">
                        {openData.calc?.layout.itemsPerRow} × {openData.calc?.layout.itemsPerCol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Items per Sheet</span>
                      <span className="font-bold text-blue-700 text-lg">
                        {openData.calc?.layout.itemsPerSheet}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Orientation</span>
                      <span className={`font-bold text-lg flex items-center ${openData.calc?.layout.orientation === 'rotated' ? 'text-purple-600' : 'text-green-600'}`}>
                        {openData.calc?.layout.orientation === 'rotated' ? (
                          <>
                            <span className="mr-2">↻</span> Rotated
                          </>
                        ) : (
                          <>
                            <span className="mr-2">→</span> Normal
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown Section */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <Calculator className="w-5 h-5 text-blue-600" />
                  </div>
                  <h6 className="text-xl font-bold text-slate-800">Cost Breakdown</h6>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Paper Cost Breakdown */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h6 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-blue-600" />
                      Paper Costs
                    </h6>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-600">Price per Sheet</span>
                        <span className="font-semibold text-blue-600">
                          {openData.op?.pricePerSheet != null
                            ? fmt(openData.op.pricePerSheet)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-600">Sheets Required</span>
                        <span className="font-semibold text-slate-800">
                          {openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0}
                        </span>
                      </div>
                      <div className="border-t pt-3 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-slate-800">Total Paper Cost</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {(() => {
                              const totalCost = calculateTotalCost(openData.op, openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0);
                              return totalCost > 0 ? fmt(totalCost) : "—";
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Finishing Costs */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h6 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-green-600" />
                      Finishing Options (From Previous Step)
                    </h6>
                    <div className="space-y-3">
                      {formData.products[0]?.finishing && formData.operational.finishing
                        .filter((f) => formData.products[0].finishing.includes(f.name))
                        .map((f) => {
                          const actualSheetsNeeded = openData?.op?.enteredSheets ?? openData?.calc?.recommendedSheets ?? 0;
                          return (
                            <div key={f.name} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg">
                              <div>
                                <span className="text-slate-600 font-medium">{f.name}</span>
                                <div className="text-xs text-slate-500">
                                  {f.cost != null ? `${fmt(f.cost)} per unit × ${actualSheetsNeeded} sheets` : "Cost not specified"}
                                </div>
                              </div>
                              <span className="font-semibold text-slate-800">
                                {f.cost != null ? fmt(f.cost * actualSheetsNeeded) : "—"}
                              </span>
                            </div>
                          );
                        })}
                      <div className="border-t pt-3 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-slate-800">Total Finishing</span>
                          <span className="text-2xl font-bold text-green-600">
                            {fmt(
                              formData.products[0]?.finishing ? formData.operational.finishing
                                .filter((f) => formData.products[0].finishing.includes(f.name))
                                .reduce((acc, f) => {
                                  const actualSheetsNeeded = openData?.op?.enteredSheets ?? openData?.calc?.recommendedSheets ?? 0;
                                  return acc + ((f.cost ?? 0) * actualSheetsNeeded);
                                }, 0) : 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Production Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 text-center">
                  <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-blue-700" />
                  </div>
                  <div className="text-blue-700 font-medium mb-1">Plates Required</div>
                  <div className="text-3xl font-bold text-blue-800">{plates}</div>
                  <div className="text-xs text-blue-600 mt-1">Printing plates</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 p-6 text-center">
                  <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="text-green-700 font-medium mb-1">Units Produced</div>
                  <div className="text-3xl font-bold text-green-800">{units}</div>
                  <div className="text-xs text-green-600 mt-1">Final items</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6 text-center">
                  <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calculator className="w-6 h-6 text-purple-700" />
                  </div>
                  <div className="text-purple-700 font-medium mb-1">Efficiency</div>
                  <div className={`text-3xl font-bold ${(openData.calc?.layout.efficiency ?? 0) > 80 ? 'text-green-600' : (openData.calc?.layout.efficiency ?? 0) > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {openData.calc?.layout.efficiency?.toFixed(1) ?? "—"}%
                  </div>
                  <div className="text-xs text-purple-600 mt-1">Layout optimization</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 p-6 text-center">
                  <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Palette className="w-6 h-6 text-orange-700" />
                  </div>
                  <div className="text-orange-700 font-medium mb-1">Colors</div>
                  <div className="text-3xl font-bold text-orange-800">
                    1
                  </div>
                  <div className="text-xs text-orange-600 mt-1">Printing colors</div>
                </div>
              </div>

              {/* Advanced Cost Analysis */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl border border-slate-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h6 className="text-xl font-bold text-slate-800">Advanced Cost Analysis</h6>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cost per Unit Analysis */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h6 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Calculator className="w-5 h-5 mr-2 text-indigo-600" />
                      Cost per Unit Analysis
                    </h6>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
                        <span className="text-slate-600">Paper Cost per Unit</span>
                        <span className="font-semibold text-indigo-600">
                          {fmt(
                            calculateTotalCost(openData.op, openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) / 
                            (formData.products[0]?.quantity ?? 1)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-xl">
                        <span className="text-slate-600">Finishing Cost per Unit</span>
                        <span className="font-semibold text-blue-600">
                          {fmt(
                            (formData.products[0]?.finishing ? formData.operational.finishing
                              .filter((f) => formData.products[0].finishing.includes(f.name))
                              .reduce((acc, f) => {
                                const actualSheetsNeeded = openData?.op?.enteredSheets ?? openData?.calc?.recommendedSheets ?? 0;
                                return acc + ((f.cost ?? 0) * actualSheetsNeeded);
                              }, 0) : 0) / (formData.products[0]?.quantity ?? 1)
                          )}
                        </span>
                      </div>
                                            <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl">
                        <span className="text-slate-600">Total Cost per Unit</span>
                        <span className="font-bold text-green-600 text-lg">
                          {fmt(
                            (calculateTotalCost(openData.op, openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) + 
                             (formData.products[0]?.finishing ? formData.operational.finishing
                               .filter((f) => formData.products[0].finishing.includes(f.name))
                               .reduce((acc, f) => {
                                 const actualSheetsNeeded = openData?.op?.enteredSheets ?? openData?.calc?.recommendedSheets ?? 0;
                                 return acc + ((f.cost ?? 0) * actualSheetsNeeded);
                               }, 0) : 0)) / (formData.products[0]?.quantity ?? 1)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Production Timeline */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h6 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-orange-600" />
                      Production Timeline
                    </h6>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
                        <span className="text-slate-600">Setup Time</span>
                        <span className="font-semibold text-slate-800">2-3 hours</span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-xl">
                        <span className="text-slate-600">Printing Time</span>
                        <span className="font-semibold text-blue-600">
                          {Math.ceil((openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) / 100)} hours
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl">
                        <span className="text-slate-600">Finishing Time</span>
                        <span className="font-semibold text-green-600">
                          {Math.ceil((openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) / 50)} hours
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-orange-50 rounded-xl">
                        <span className="text-slate-600">Total Production</span>
                        <span className="font-bold text-orange-600 text-lg">
                          {Math.ceil(2 + (openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) / 100 + (openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) / 50)} hours
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grand Total */}
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-2xl border-2 border-slate-300 p-8 text-center">
                <div className="mb-4">
                  <div className="text-slate-600 font-medium text-lg mb-2">Estimated Base Cost</div>
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                    {fmt(
                      calculateTotalCost(openData.op, openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) +
                        (formData.products[0]?.finishing ? formData.operational.finishing
                          .filter((f) => formData.products[0].finishing.includes(f.name))
                          .reduce((acc, f) => {
                            const actualSheetsNeeded = openData?.op?.enteredSheets ?? openData?.calc?.recommendedSheets ?? 0;
                            return acc + ((f.cost ?? 0) * actualSheetsNeeded);
                          }, 0) : 0)
                    )}
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  Includes paper costs, finishing options, and production calculations
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4 text-6xl">📊</div>
              <div className="text-slate-600 font-medium text-lg">No cost data available</div>
              <div className="text-slate-500 text-sm mt-2">Please configure paper specifications to view cost analysis</div>
            </div>
          )}

          <DialogFooter className="pt-6">
            <Button 
              variant="outline" 
              onClick={() => setOpenIdx(null)}
              className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-8 py-3 rounded-xl font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cost Breakdown Modal */}
      <Dialog open={showCostBreakdown} onOpenChange={setShowCostBreakdown}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <BarChart3 className="w-8 h-8 mr-3 text-green-600" />
              Complete Cost Breakdown
            </DialogTitle>
            <p className="text-slate-600 mt-2">Detailed breakdown of all project costs and calculations</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Paper Costs Breakdown */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Paper Costs
              </h3>
              <div className="space-y-3">
                {formData.operational.papers.map((opPaper, index) => {
                  const actualSheetsNeeded = opPaper.enteredSheets ?? 
                                           perPaperCalc[Math.floor(index / formData.products[0]?.papers.length || 1)]?.[index % (formData.products[0]?.papers.length || 1)]?.recommendedSheets ?? 0;
                  const paperCost = calculateTotalCost(opPaper, actualSheetsNeeded);
                  
                  return (
                    <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">Paper {index + 1}</span>
                        <span className="font-semibold text-blue-700">{fmt(paperCost)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {actualSheetsNeeded} sheets × {opPaper.pricePerSheet ? fmt(opPaper.pricePerSheet) : 'packet pricing'}
                      </div>
                    </div>
                  );
                })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">Total Paper Cost:</span>
                    <span className="text-xl font-bold text-blue-800">
                      {fmt(formData.operational.papers.reduce((acc, opPaper, index) => {
                        const actualSheetsNeeded = opPaper.enteredSheets ?? 
                                                 perPaperCalc[Math.floor(index / formData.products[0]?.papers.length || 1)]?.[index % (formData.products[0]?.papers.length || 1)]?.recommendedSheets ?? 0;
                        return acc + calculateTotalCost(opPaper, actualSheetsNeeded);
                      }, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plates Costs Breakdown */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Plates Costs
              </h3>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Plates Required:</span>
                  <span className="font-semibold text-green-700">{formData.operational.plates ?? plates ?? 0}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-slate-700">Cost per Plate:</span>
                  <span className="font-semibold text-green-700">$25.00</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-800">Total Plates Cost:</span>
                    <span className="text-xl font-bold text-green-800">{fmt(calculatePlatesCost())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Units Costs Breakdown */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Units Costs
              </h3>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Units Required:</span>
                  <span className="font-semibold text-purple-700">{formData.operational.units ?? units ?? 0}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-slate-700">Cost per Unit:</span>
                  <span className="font-semibold text-purple-700">$0.05</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-purple-800">Total Units Cost:</span>
                    <span className="text-xl font-bold text-purple-800">{fmt(calculateUnitsCost())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Finishing Costs Breakdown */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Finishing Costs
              </h3>
              <div className="space-y-3">
                {formData.operational.finishing
                  .filter(f => formData.products.some(p => p.finishing?.includes(f.name)))
                  .map((finishing) => {
                    const totalFinishingCost = formData.products.reduce((acc, product, productIndex) => {
                      if (product.finishing?.includes(finishing.name)) {
                        const actualSheetsNeeded = formData.operational.papers[productIndex]?.enteredSheets ?? 
                                                 perPaperCalc[productIndex]?.[0]?.recommendedSheets ?? 0;
                        return acc + ((finishing.cost ?? 0) * actualSheetsNeeded);
                      }
                      return acc;
                    }, 0);
                    
                    return (
                      <div key={finishing.name} className="bg-white rounded-lg p-3 border border-orange-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">{finishing.name}</span>
                          <span className="font-semibold text-orange-700">{fmt(totalFinishingCost)}</span>
                        </div>
                      </div>
                    );
                  })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-orange-800">Total Finishing Cost:</span>
                    <span className="text-xl font-bold text-orange-800">{fmt(calculateFinishingCosts())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Costs Breakdown */}
            {additionalCosts.length > 0 && (
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Other Costs
                </h3>
                <div className="space-y-3">
                  {additionalCosts.map((cost) => (
                    <div key={cost.id} className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">{cost.description}</span>
                        <span className="font-semibold text-slate-700">{fmt(cost.cost)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{cost.comment}</div>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">Total Other Costs:</span>
                      <span className="text-xl font-bold text-slate-800">
                        {fmt(additionalCosts.reduce((acc, cost) => acc + cost.cost, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grand Total */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-xl p-6 border-2 border-slate-300">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Project Total</h3>
                <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-2">
                  {fmt(calculateTotalProjectCost())}
                </div>
                <div className="text-lg font-semibold text-slate-600">
                  Cost per Unit: {fmt(calculateCostPerUnit())}
                </div>
                <div className="text-sm text-slate-500 mt-2">
                  Total Quantity: {formData.products.reduce((acc, product) => acc + (product.quantity || 0), 0)} items
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button 
              onClick={() => setShowCostBreakdown(false)}
              className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Pricing Logic Modal */}
      <Dialog open={showPricingLogic} onOpenChange={setShowPricingLogic}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <Calculator className="w-8 h-8 mr-3 text-blue-600" />
              Pricing Logic & Calculation Methods
            </DialogTitle>
            <p className="text-slate-600 mt-2">Understand how your costs are calculated based on different pricing scenarios</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Pricing Methods Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Available Pricing Methods
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-blue-800 text-center mb-2">Packet Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Buy paper in pre-packaged quantities</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Calculator className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-800 text-center mb-2">Sheet Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Buy individual sheets at unit price</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-purple-800 text-center mb-2">Hybrid Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Combine both methods for optimal cost</p>
                </div>
              </div>
            </div>

            {/* Calculation Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-green-600" />
                Calculation Rules
              </h3>
              
              <div className="space-y-4">
                {/* Rule 1: Packet Only */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-800 mb-2">Packet Only Pricing</h4>
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-blue-700">
                          Total Cost = ⌈(Sheets needed ÷ Sheets per packet)⌉ × Price per packet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When only packet pricing is available, we round up to the nearest whole packet.
                        This ensures you have enough paper for your project.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rule 2: Sheet Only */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-bold text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800 mb-2">Sheet Only Pricing</h4>
                      <div className="bg-green-50 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-green-700">
                          Total Cost = Sheets needed × Price per sheet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When only sheet pricing is available, you pay for exactly the number of sheets needed.
                        No waste, but potentially higher per-sheet cost.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rule 3: Hybrid Pricing */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 font-bold text-sm">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-purple-800 mb-2">Hybrid Pricing (Recommended)</h4>
                      <div className="bg-purple-50 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-purple-700">
                          Total Cost = Full packets × Price per packet + Remaining sheets × Price per sheet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When both pricing methods are available, we optimize by using full packets first,
                        then individual sheets for the remainder. This gives you the best of both worlds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Practical Example */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Practical Example
              </h3>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Scenario</h4>
                    <ul className="text-sm text-slate-700 space-y-1">
                      <li>• Sheets needed: <span className="font-semibold">25</span></li>
                      <li>• Sheets per packet: <span className="font-semibold">20</span></li>
                      <li>• Price per packet: <span className="font-semibold">$200</span></li>
                      <li>• Price per sheet: <span className="font-semibold">$15</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Calculation</h4>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-sm text-green-800 space-y-1">
                        <div>Full packets: ⌊25 ÷ 20⌋ = <span className="font-semibold">1</span></div>
                        <div>Remaining sheets: 25 % 20 = <span className="font-semibold">5</span></div>
                        <div>Packet cost: 1 × $200 = <span className="font-semibold">$200</span></div>
                        <div>Sheet cost: 5 × $15 = <span className="font-semibold">$75</span></div>
                        <div className="border-t pt-1 mt-1 font-semibold">
                          Total: $200 + $75 = <span className="text-lg">$275</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-100 rounded-lg p-3 border border-green-300">
                  <div className="text-sm text-green-800">
                    <span className="font-semibold">💡 Pro Tip:</span> Hybrid pricing often provides the best value 
                    by combining bulk discounts with precise quantity matching.
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Why This System?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Cost Optimization:</span> Always uses the most economical combination
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Flexibility:</span> Adapts to different supplier pricing models
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Transparency:</span> Clear breakdown of all costs
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Accuracy:</span> No rounding errors or hidden costs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button 
              onClick={() => setShowPricingLogic(false)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-medium"
            >
              Got it! Thanks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Pricing Logic Modal */}
      <Dialog open={showPricingLogic} onOpenChange={setShowPricingLogic}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <Calculator className="w-8 h-8 mr-3 text-blue-600" />
              Pricing Logic & Calculation Methods
            </DialogTitle>
            <p className="text-slate-600 mt-2">Understand how your costs are calculated based on different pricing scenarios</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Pricing Methods Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Available Pricing Methods
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-blue-800 text-center mb-2">Packet Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Buy paper in pre-packaged quantities</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Calculator className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-800 text-center mb-2">Sheet Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Buy individual sheets at unit price</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-purple-800 text-center mb-2">Hybrid Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Combine both methods for optimal cost</p>
                </div>
              </div>
            </div>

            {/* Calculation Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-green-600" />
                Calculation Rules
              </h3>
              
              <div className="space-y-4">
                {/* Rule 1: Packet Only */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-800 mb-2">Packet Only Pricing</h4>
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-blue-700">
                          Total Cost = ⌈(Sheets needed ÷ Sheets per packet)⌉ × Price per packet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When only packet pricing is available, we round up to the nearest whole packet.
                        This ensures you have enough paper for your project.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rule 2: Sheet Only */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-bold text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800 mb-2">Sheet Only Pricing</h4>
                      <div className="bg-green-50 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-green-700">
                          Total Cost = Sheets needed × Price per sheet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When only sheet pricing is available, you pay for exactly the number of sheets needed.
                        No waste, but potentially higher per-sheet cost.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rule 3: Hybrid Pricing */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 font-bold text-sm">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-purple-800 mb-2">Hybrid Pricing (Recommended)</h4>
                      <div className="bg-purple-50 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-purple-700">
                          Total Cost = Full packets × Price per packet + Remaining sheets × Price per sheet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When both pricing methods are available, we optimize by using full packets first,
                        then individual sheets for the remainder. This gives you the best of both worlds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Practical Example */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Practical Example
              </h3>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Scenario</h4>
                    <ul className="text-sm text-slate-700 space-y-1">
                      <li>• Sheets needed: <span className="font-semibold">25</span></li>
                      <li>• Sheets per packet: <span className="font-semibold">20</span></li>
                      <li>• Price per packet: <span className="font-semibold">$200</span></li>
                      <li>• Price per sheet: <span className="font-semibold">$15</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Calculation</h4>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-sm text-green-800 space-y-1">
                        <div>Full packets: ⌊25 ÷ 20⌋ = <span className="font-semibold">1</span></div>
                        <div>Remaining sheets: 25 % 20 = <span className="font-semibold">5</span></div>
                        <div>Packet cost: 1 × $200 = <span className="font-semibold">$200</span></div>
                        <div>Sheet cost: 5 × $15 = <span className="font-semibold">$75</span></div>
                        <div className="border-t pt-1 mt-1 font-semibold">
                          Total: $200 + $75 = <span className="text-lg">$275</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-100 rounded-lg p-3 border border-green-300">
                  <div className="text-sm text-green-800">
                    <span className="font-semibold">💡 Pro Tip:</span> Hybrid pricing often provides the best value 
                    by combining bulk discounts with precise quantity matching.
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Why This System?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Cost Optimization:</span> Always uses the most economical combination
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Flexibility:</span> Adapts to different supplier pricing models
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Transparency:</span> Clear breakdown of all costs
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Accuracy:</span> No rounding errors or hidden costs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button 
              onClick={() => setShowPricingLogic(false)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-medium"
            >
              Got it! Thanks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paper Price Modal - Simple Test */}
      <Dialog open={showPaperPrice !== null} onOpenChange={() => setShowPaperPrice(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <Calculator className="w-8 h-8 mr-3 text-blue-600" />
              Paper Price Details
            </DialogTitle>
            <p className="text-slate-600 mt-2">Detailed breakdown of paper pricing and calculations</p>
          </DialogHeader>
          
          {showPaperPrice !== null && (() => {
            const paperIndex = showPaperPrice;
            const opPaper = formData.operational.papers[paperIndex];
            const productIndex = Math.floor(paperIndex / (formData.products[0]?.papers.length || 1));
            const paperCalc = perPaperCalc[productIndex]?.[paperIndex % (formData.products[0]?.papers.length || 1)];
            const actualSheetsNeeded = opPaper?.enteredSheets ?? paperCalc?.recommendedSheets ?? 0;
            const pricePerSheet = opPaper?.pricePerSheet != null
              ? opPaper.pricePerSheet
              : (opPaper?.pricePerPacket != null && opPaper?.sheetsPerPacket != null
                ? opPaper.pricePerPacket / opPaper.sheetsPerPacket
                : null);
            
            return (
              <div className="space-y-6">
                {/* Paper Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Paper Specifications
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Paper Name:</span>
                        <span className="font-semibold text-blue-700">
                          {formData.products[0]?.papers[paperIndex % (formData.products[0]?.papers.length || 1)]?.name || 'Standard Paper'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">GSM:</span>
                        <span className="font-semibold text-blue-700">
                          {formData.products[0]?.papers[paperIndex % (formData.products[0]?.papers.length || 1)]?.gsm || '150'} gsm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Input Size:</span>
                        <span className="font-semibold text-blue-700">
                          {opPaper?.inputWidth || 100} × {opPaper?.inputHeight || 70} cm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Output Size:</span>
                        <span className="font-semibold text-blue-700">
                          {opPaper?.outputWidth || 'Not set'} × {opPaper?.outputHeight || 'Not set'} cm
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Sheets Needed:</span>
                        <span className="font-semibold text-blue-700">{actualSheetsNeeded}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Sheets per Packet:</span>
                        <span className="font-semibold text-blue-700">
                          {opPaper?.sheetsPerPacket || 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Paper Index:</span>
                        <span className="font-semibold text-blue-700">{paperIndex + 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Product Index:</span>
                        <span className="font-semibold text-blue-700">{productIndex + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Pricing Details
                  </h3>
                  <div className="space-y-4">
                    {opPaper?.pricePerSheet != null && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-3">Per-Sheet Pricing</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Price per Sheet:</span>
                            <span className="font-semibold text-green-700">${opPaper.pricePerSheet.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Sheets Required:</span>
                            <span className="font-semibold text-green-700">{actualSheetsNeeded}</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-green-800">Total Cost:</span>
                              <span className="text-xl font-bold text-green-800">
                                ${(opPaper.pricePerSheet * actualSheetsNeeded).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {opPaper?.pricePerPacket != null && opPaper?.sheetsPerPacket != null && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-3">Per-Packet Pricing</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Price per Packet:</span>
                            <span className="font-semibold text-green-700">${opPaper.pricePerPacket.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Sheets per Packet:</span>
                            <span className="font-semibold text-green-700">{opPaper.sheetsPerPacket}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Effective Price per Sheet:</span>
                            <span className="font-semibold text-green-700">
                              ${(opPaper.pricePerPacket / opPaper.sheetsPerPacket).toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-green-800">Total Cost:</span>
                              <span className="text-xl font-bold text-green-800">
                                ${(opPaper.pricePerPacket * Math.ceil(actualSheetsNeeded / opPaper.sheetsPerPacket)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!opPaper?.pricePerSheet && !opPaper?.pricePerPacket && (
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                          <span className="text-amber-800 font-medium">No pricing information available</span>
                        </div>
                        <p className="text-amber-700 text-sm mt-2">
                          Please set either price per sheet or price per packet in the paper specifications above.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Calculation */}
                {pricePerSheet && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                      <Calculator className="w-5 h-5 mr-2" />
                      Cost Calculation
                    </h3>
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Unit Cost:</span>
                          <span className="font-semibold text-purple-700">${pricePerSheet.toFixed(2)} per sheet</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Quantity:</span>
                          <span className="font-semibold text-purple-700">{actualSheetsNeeded} sheets</span>
                        </div>
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-purple-800">Total Paper Cost:</span>
                            <span className="text-xl font-bold text-purple-800">
                              ${(pricePerSheet * actualSheetsNeeded).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Calculation Method:</span>
                        <span className="font-semibold text-slate-700">
                          {opPaper?.pricePerSheet != null ? 'Per-Sheet' : 'Per-Packet'}
                        </span>
                      </div>
                                             <div className="flex justify-between">
                         <span className="text-sm text-slate-600">Efficiency:</span>
                         <span className="font-semibold text-slate-700">
                           {paperCalc ? `${paperCalc.layout.efficiency.toFixed(1)}%` : 'N/A'}
                         </span>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <div className="flex justify-between">
                         <span className="text-sm text-slate-600">Items per Sheet:</span>
                         <span className="font-semibold text-slate-700">
                           {paperCalc ? paperCalc.layout.itemsPerSheet : 'N/A'}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm text-slate-600">Layout Orientation:</span>
                         <span className="font-semibold text-slate-700">
                           {paperCalc ? paperCalc.layout.orientation : 'N/A'}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="pt-6">
            <Button 
              onClick={() => setShowPaperPrice(null)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Step4Operational;