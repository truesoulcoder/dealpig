import React from 'react';
import { Avatar, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { User } from '../utils/user-generator';
import Color from 'color';

interface RaceTrackProps {
  users: User[];
  positions: Record<string, number>;
  isRacing: boolean;
}

export const RaceTrack: React.FC<RaceTrackProps> = ({ users, positions, isRacing }) => {
  const trackRef = React.useRef<HTMLDivElement>(null);
  
  // Calculate user lane colors based on their avatar
  const getLaneColor = (user: User) => {
    try {
      // Generate a pastel color based on user id for consistency
      const hue = parseInt(user.id.substring(0, 3), 16) % 360;
      return Color.hsl(hue, 70, 85).alpha(0.5).toString();
    } catch (error) {
      // Fallback color if there's an error
      return 'rgba(229, 231, 235, 0.5)'; // gray-200 with 0.5 opacity
    }
  };
  
  // Calculate position on the oval track
  const calculatePosition = (position: number, laneIndex: number) => {
    // Track is 400m, with 100m per side
    const normalizedPosition = position % 400;
    const trackPercentage = (normalizedPosition / 400) * 100;
    
    // Calculate x and y coordinates based on track percentage
    // This creates an oval path
    const angle = (trackPercentage / 100) * 2 * Math.PI;
    
    // Adjust these values to fit your track dimensions
    // Base radius - each lane is slightly larger
    const laneWidth = 2.5; // Width of each lane in percentage
    const baseRadiusX = 35; // Base horizontal radius for innermost lane
    const baseRadiusY = 25; // Base vertical radius for innermost lane
    
    // Calculate radius for this specific lane
    const radiusX = baseRadiusX + (laneIndex * laneWidth);
    const radiusY = baseRadiusY + (laneIndex * laneWidth);
    
    const centerX = 50;
    const centerY = 50;
    
    const x = centerX + radiusX * Math.cos(angle - Math.PI / 2);
    const y = centerY + radiusY * Math.sin(angle - Math.PI / 2);
    
    return { x, y };
  };
  
  return (
    <div className="relative w-full" style={{ paddingTop: '75%' }}> {/* 4:3 aspect ratio */}
      <div 
        ref={trackRef}
        className="absolute inset-0 rounded-full border-4 border-blue-700 bg-green-600 overflow-hidden"
        style={{ borderRadius: '50% / 40%' }} // Create oval shape
      >
        {/* Track outer border - blue border around the track */}
        <div 
          className="absolute inset-0 border-8 border-blue-700"
          style={{ borderRadius: '50% / 40%' }}
        />
        
        {/* Track inner field - green center */}
        <div 
          className="absolute bg-green-500"
          style={{ 
            borderRadius: '50% / 40%',
            top: '15%',
            left: '15%',
            right: '15%',
            bottom: '15%',
            zIndex: 1
          }}
        />
        
        {/* Track lanes - red running surface */}
        <div 
          className="absolute bg-red-600"
          style={{ 
            borderRadius: '50% / 40%',
            top: '5%',
            left: '5%',
            right: '5%',
            bottom: '5%',
            zIndex: 0
          }}
        />
        
        {/* Lane dividers - white lines */}
        {Array.from({ length: 10 }).map((_, index) => {
          // Skip the innermost "lane" which is actually the field border
          if (index === 0) return null;
          
          const lanePercentage = 5 + (index * 2.5);
          
          return (
            <div 
              key={`lane-${index}`}
              className="absolute border border-white"
              style={{ 
                borderRadius: '50% / 40%',
                top: `${lanePercentage}%`,
                left: `${lanePercentage}%`,
                right: `${lanePercentage}%`,
                bottom: `${lanePercentage}%`,
                zIndex: 2
              }}
            />
          );
        })}
        
        {/* Company logo in the center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-lg z-10">
          <Icon icon="logos:google" width={80} height={80} />
        </div>
        
        {/* Start/Finish line */}
        <div 
          className="absolute h-[40%] w-2 bg-white z-20"
          style={{ 
            left: '50%',
            top: '5%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs font-bold">
            START
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs font-bold">
            FINISH
          </div>
        </div>
        
        {/* User avatars on the track */}
        {users.map((user, index) => {
          const position = positions[user.id] || 0;
          const { x, y } = calculatePosition(position, index);
          
          return (
            <Tooltip 
              key={user.id} 
              content={`${user.name}: ${position}m`}
              placement="top"
            >
              <div 
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-1000 ${
                  isRacing ? 'ease-linear' : 'ease-out'
                }`}
                style={{ 
                  left: `${x}%`, 
                  top: `${y}%`,
                }}
              >
                <Avatar 
                  src={user.avatar} 
                  name={user.name}
                  size="sm"
                  isBordered
                  color={position >= 400 ? "success" : "default"}
                  className="ring-2 ring-white"
                />
              </div>
            </Tooltip>
          );
        })}
        
        {/* Distance markers */}
        {[100, 200, 300].map(marker => {
          // Use the middle lane (lane 5) for markers
          const { x, y } = calculatePosition(marker, 5);
          
          return (
            <div 
              key={marker}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white px-1 py-0.5 rounded text-xs font-bold z-20"
              style={{ 
                left: `${x}%`, 
                top: `${y}%`,
              }}
            >
              {marker}m
            </div>
          );
        })}
      </div>
    </div>
  );
};