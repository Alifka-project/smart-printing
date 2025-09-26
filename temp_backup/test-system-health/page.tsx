"use client";

import React from 'react';
import Navbar from '@/components/ui/Navbar';

export default function TestSystemHealthPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Database Health Check Test
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Testing the New Database Health Check
            </h2>
            
            <div className="space-y-4 text-gray-600">
              <p>
                This page tests the new realistic database health check modal that provides comprehensive database monitoring instead of synthetic dummy data.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">What's New:</h3>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Real database storage metrics for each table</li>
                  <li>Actual table row counts and estimated sizes</li>
                  <li>Database performance and error monitoring</li>
                  <li>Real storage usage statistics</li>
                  <li>No more synthetic dummy data</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">How to Test:</h3>
                <ol className="list-decimal list-inside space-y-1 text-green-700">
                  <li>Click the notification bell icon in the top navigation</li>
                  <li>The database health check modal will open with real data</li>
                  <li>You can refresh the data using the refresh button</li>
                  <li>All metrics are pulled from your actual database</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Data Sources:</h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>Database connection health and response times</li>
                  <li>Individual table storage and row counts</li>
                  <li>Database performance and error monitoring</li>
                  <li>Business data summary (users, clients, quotes)</li>
                  <li>Storage usage and file sizes</li>
                  <li>Error rates and performance issues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
