import React, { useEffect, useState } from "react";

const AnimatedLogo = () => {
  const [key, setKey] = useState(0); // Add key to force remounting

  // Restart animation periodically
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setKey(prevKey => prevKey + 1);
    }, 30000); // Extend interval to 30 seconds for slower animation cycle
    
    return () => clearInterval(animationInterval);
  }, []);

  return (
    <div className="flex items-center">
      <svg
        key={key}
        width="180"
        height="80" 
        viewBox="0 0 180 80"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-animation-container"
      >
        <style>
          {`
          @keyframes drawPath {
            0% { stroke-dashoffset: 1000; }
            80% { stroke-dashoffset: 0; } /* Extend to 80% to ensure complete drawing */
            100% { stroke-dashoffset: 0; }
          }

          @keyframes fillIn {
            0%, 80% { fill-opacity: 0; } /* Start fill after path is fully drawn */
            100% { fill-opacity: 1; }
          }
          
          @keyframes colorShift {
            0%, 80% { fill: #3b6939; }
            90% { fill: #4a8a47; }
            100% { fill: #3b6939; }
          }
          
          .animated-path {
            stroke: #3b6939;
            stroke-width: 1.5;
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            fill-opacity: 0;
            animation: drawPath 4s ease forwards, fillIn 4s ease forwards, colorShift 10s infinite 4s; /* Slowed down animations */
          }
          
          .animated-text {
            stroke: #3b6939;
            stroke-width: 0.5;
            fill: #3b6939;
            opacity: 0;
            animation: fillIn 2s ease 3.5s forwards; /* Show text after paths are drawn */
          }
          `}
        </style>

        {/* Main pig body */}
        <path
          className="animated-path"
          d="M47.5,15 C42.4,15.5 38,20 38,25 C38,30 42,35 47,35 C48,32 52,32 53,35 C57.5,35 62,30 62,25 C62,20 57.5,15.5 52.5,15 C51,15 49,15 47.5,15 Z"
        />
        
        {/* Pig's snout */}
        <path
          className="animated-path"
          d="M50,25 C50,27.76 47.76,30 45,30 C42.24,30 40,27.76 40,25 C40,22.24 42.24,20 45,20 C47.76,20 50,22.24 50,25 Z"
        />
        
        {/* Pig's ear */}
        <path
          className="animated-path"
          d="M62,20 C63,15 68,13 68,18 C68,23 64,25 62,20 Z"
        />
        
        {/* Pig's tail */}
        <path
          className="animated-path" 
          d="M30,25 C28,23 26,23 25,25 C24,27 25,30 28,30 C31,30 33,25 30,25 Z"
        />

        {/* DealPig text */}
        <path 
          className="animated-text"
          d="M75,25 h3 v-7 h3 v7 h3 v3 h-3 v7 h-3 v-7 h-3 Z" 
        />
        <path 
          className="animated-text"
          d="M87,18 c5,0 7,3 7,8.5 c0,5.5 -2,8.5 -7,8.5 c-5,0 -7,-3 -7,-8.5 c0,-5.5 2,-8.5 7,-8.5 Z M87,21 c-2,0 -3,2 -3,5.5 c0,3.5 1,5.5 3,5.5 c2,0 3,-2 3,-5.5 c0,-3.5 -1,-5.5 -3,-5.5 Z" 
        />
        <path 
          className="animated-text"
          d="M95,18 h7 c4,0 5,3 5,6 c0,3 -1,6 -5,6 h-4 v5 h-3 Z M102,21 h-4 v6 h4 c2,0 2,-1.5 2,-3 c0,-1.5 0,-3 -2,-3 Z" 
        />
        <path 
          className="animated-text"
          d="M110,18 h10 v3 h-7 v3 h6 v3 h-6 v3 h7 v3 h-10 Z" 
        />
        <path 
          className="animated-text"
          d="M126,35 h-3 v-17 h3 Z" 
        />
        <path 
          className="animated-text"
          d="M130,18 h7 c4,0 5,2 5,5 c0,2 -1,4 -3,5 l3,7 h-4 l-3,-6 h-2 v6 h-3 Z M137,21 h-4 v5 h4 c2,0 2,-1 2,-2.5 c0,-1.5 0,-2.5 -2,-2.5 Z" 
        />
        <path 
          className="animated-text"
          d="M144,18 h3 v13 h7 v4 h-10 Z" 
        />
        
        {/* Add sparkles */}
        <circle className="sparkle" cx="68" cy="16" r="1" />
        <circle className="sparkle" cx="64" cy="14" r="0.8" />
        <circle className="sparkle" cx="60" cy="17" r="0.6" />
      </svg>
    </div>
  );
};

export default AnimatedLogo;