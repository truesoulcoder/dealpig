export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

// Generate a random ID
const generateId = () => {
  return Math.random().toString(16).substring(2, 10);
};

// Generate a random user
export const generateRandomUser = (): User => {
  const id = generateId();
  const firstName = getRandomFirstName();
  const lastName = getRandomLastName();
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  const avatar = `https://img.heroui.chat/image/avatar?w=200&h=200&u=${id}`;
  
  return {
    id,
    name,
    email,
    avatar
  };
};

// Generate multiple random users
export const generateRandomUsers = (count: number): User[] => {
  return Array.from({ length: count }, () => generateRandomUser());
};

// Random first names
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
];

// Random last names
const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson',
  'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
  'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee',
  'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez',
  'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter'
];

// Get a random first name
const getRandomFirstName = (): string => {
  return firstNames[Math.floor(Math.random() * firstNames.length)];
};

// Get a random last name
const getRandomLastName = (): string => {
  return lastNames[Math.floor(Math.random() * lastNames.length)];
};
