import React from 'react';
import { Card, CardBody, Button, Avatar, Badge, Tooltip, Progress } from '@heroui/react';
import { Icon } from '@iconify/react';
import { RaceTrack } from './race-track';
import { generateRandomUsers, User } from '../utils/user-generator';
import { generateRandomMetrics, Metrics } from '../utils/metrics-generator';

export const KPIRaceDashboard: React.FC = () => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [metrics, setMetrics] = React.useState<Record<string, Metrics>>({});
  const [positions, setPositions] = React.useState<Record<string, number>>({});
  const [isRacing, setIsRacing] = React.useState(false);
  const [raceComplete, setRaceComplete] = React.useState(false);
  const [winner, setWinner] = React.useState<User | null>(null);
  
  // Initialize users and starting positions
  React.useEffect(() => {
    const initialUsers = generateRandomUsers(10);
    setUsers(initialUsers);
    
    // Initialize all users at position 0
    const initialPositions: Record<string, number> = {};
    initialUsers.forEach(user => {
      initialPositions[user.id] = 0;
    });
    setPositions(initialPositions);
    
    // Generate initial metrics
    const initialMetrics: Record<string, Metrics> = {};
    initialUsers.forEach(user => {
      initialMetrics[user.id] = {
        emailsSent: 0,
        emailsDelivered: 0,
        emailsBounced: 0
      };
    });
    setMetrics(initialMetrics);
  }, []);
  
  // Race simulation
  React.useEffect(() => {
    if (!isRacing) return;
    
    const raceInterval = setInterval(() => {
      // Generate new metrics for each user
      const newMetrics = { ...metrics };
      const newPositions = { ...positions };
      let raceFinished = false;
      let raceWinner: User | null = null;
      
      users.forEach(user => {
        // Generate random metrics for this iteration
        const iterationMetrics = generateRandomMetrics();
        
        // Update total metrics
        newMetrics[user.id] = {
          emailsSent: newMetrics[user.id].emailsSent + iterationMetrics.emailsSent,
          emailsDelivered: newMetrics[user.id].emailsDelivered + iterationMetrics.emailsDelivered,
          emailsBounced: newMetrics[user.id].emailsBounced + iterationMetrics.emailsBounced
        };
        
        // Calculate position change
        // sent moves 3 spaces, delivered moves 2 space, bounced moves -1 space
        const positionChange = 
          (iterationMetrics.emailsSent * 3) + 
          (iterationMetrics.emailsDelivered * 2) - 
          (iterationMetrics.emailsBounced);
        
        // Update position
        newPositions[user.id] = Math.max(0, newPositions[user.id] + positionChange);
        
        // Check if anyone has finished the race (400m)
        if (newPositions[user.id] >= 400 && !raceFinished) {
          raceFinished = true;
          raceWinner = user;
        }
      });
      
      setMetrics(newMetrics);
      setPositions(newPositions);
      
      // If race is finished, stop the interval
      if (raceFinished) {
        clearInterval(raceInterval);
        setIsRacing(false);
        setRaceComplete(true);
        setWinner(raceWinner);
      }
    }, 1000); // Update every second
    
    return () => clearInterval(raceInterval);
  }, [isRacing, metrics, positions, users]);
  
  const handleStartRace = () => {
    setIsRacing(true);
    setRaceComplete(false);
    setWinner(null);
  };
  
  const handleResetRace = () => {
    // Reset positions
    const resetPositions: Record<string, number> = {};
    users.forEach(user => {
      resetPositions[user.id] = 0;
    });
    setPositions(resetPositions);
    
    // Reset metrics
    const resetMetrics: Record<string, Metrics> = {};
    users.forEach(user => {
      resetMetrics[user.id] = {
        emailsSent: 0,
        emailsDelivered: 0,
        emailsBounced: 0
      };
    });
    setMetrics(resetMetrics);
    
    setIsRacing(false);
    setRaceComplete(false);
    setWinner(null);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">KPI Email Race Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            color="primary" 
            onPress={handleStartRace}
            isDisabled={isRacing}
            startContent={<Icon icon="lucide:play" />}
          >
            {raceComplete ? "Race Again" : "Start Race"}
          </Button>
          <Button 
            variant="flat" 
            onPress={handleResetRace}
            isDisabled={isRacing}
            startContent={<Icon icon="lucide:refresh-cw" />}
          >
            Reset
          </Button>
        </div>
      </div>
      
      {/* Race Track */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <RaceTrack 
            users={users} 
            positions={positions} 
            isRacing={isRacing}
          />
        </CardBody>
      </Card>
      
      {/* Winner Announcement */}
      {raceComplete && winner && (
        <Card className="mb-6 bg-success-50">
          <CardBody className="p-4 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-bold mb-2">Race Complete!</h2>
              <div className="flex items-center gap-2">
                <Badge content="🏆" color="warning">
                  <Avatar 
                    src={winner.avatar} 
                    name={winner.name} 
                    size="lg" 
                    isBordered 
                    color="success"
                  />
                </Badge>
                <div>
                  <p className="font-bold">{winner.name} wins!</p>
                  <p className="text-sm text-gray-500">
                    Emails Sent: {metrics[winner.id].emailsSent} | 
                    Delivered: {metrics[winner.id].emailsDelivered} | 
                    Bounced: {metrics[winner.id].emailsBounced}
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Metrics Table */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-bold mb-4">User Email Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <Card key={user.id} className="shadow-sm">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar src={user.avatar} name={user.name} />
                    <div>
                      <p className="font-bold">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Position: {positions[user.id]}/400m</span>
                        <span className="text-sm">{Math.min(100, Math.round(positions[user.id] / 4))}%</span>
                      </div>
                      <Progress 
                        value={positions[user.id]} 
                        maxValue={400}
                        color="primary"
                        className="h-2"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <Tooltip content="Emails Sent: +3 spaces">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="flex items-center justify-center gap-1">
                            <Icon icon="lucide:send" className="text-blue-500" />
                            <span className="font-bold">{metrics[user.id].emailsSent}</span>
                          </div>
                          <span className="text-xs text-gray-500">Sent</span>
                        </div>
                      </Tooltip>
                      
                      <Tooltip content="Emails Delivered: +2 spaces">
                        <div className="bg-green-50 p-2 rounded">
                          <div className="flex items-center justify-center gap-1">
                            <Icon icon="lucide:check" className="text-green-500" />
                            <span className="font-bold">{metrics[user.id].emailsDelivered}</span>
                          </div>
                          <span className="text-xs text-gray-500">Delivered</span>
                        </div>
                      </Tooltip>
                      
                      <Tooltip content="Emails Bounced: -1 space">
                        <div className="bg-red-50 p-2 rounded">
                          <div className="flex items-center justify-center gap-1">
                            <Icon icon="lucide:x" className="text-red-500" />
                            <span className="font-bold">{metrics[user.id].emailsBounced}</span>
                          </div>
                          <span className="text-xs text-gray-500">Bounced</span>
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};