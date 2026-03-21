import React, { useState, useEffect } from 'react';
import { MapIcon } from '@heroicons/react/24/outline';
import shipperService from '../../services/shipperService';

const ShipperRoute = () => {
  const [route, setRoute] = useState({
    totalStops: 0,
    completedStops: 0,
    distance: '0 km',
    estimatedTime: '0 min',
  });

  useEffect(() => {
    fetchRoute();
  }, []);

  const fetchRoute = async () => {
    try {
      const response = await shipperService.getShipperRoute();
      if (response.success) {
        setRoute(response.data.route || {
          totalStops: 0,
          completedStops: 0,
          distance: '0 km',
          estimatedTime: '0 min',
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Map Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden h-96">
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Map integration coming soon</p>
            <p className="text-sm text-gray-500 mt-1">
              This will show your delivery route and real-time location
            </p>
          </div>
        </div>
      </div>

      {/* Route Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-600 text-sm">Total Stops</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {route.totalStops}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-600 text-sm">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {route.completedStops}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-600 text-sm">Distance</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {route.distance}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-600 text-sm">Est. Time</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {route.estimatedTime}
          </p>
        </div>
      </div>

      {/* Route Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Route Details
        </h3>
        <div className="text-center text-gray-500 py-8">
          No active route. Accept orders to start your delivery route.
        </div>
      </div>
    </div>
  );
};

export default ShipperRoute;
