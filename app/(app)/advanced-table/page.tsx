"use client";

import React from "react";
import AdvancedTable from "@/components/table/AdvancedTable";

// Sample data for the table
const users = [
  {
    id: 1,
    name: "Tony Reichert",
    role: "CEO",
    team: "Management",
    status: "active",
    age: "29",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    email: "tony.reichert@example.com",
  },
  {
    id: 2,
    name: "Zoey Lang",
    role: "Tech Lead",
    team: "Development",
    status: "paused",
    age: "25",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    email: "zoey.lang@example.com",
  },
  {
    id: 3,
    name: "Jane Fisher",
    role: "Sr. Dev",
    team: "Development",
    status: "active",
    age: "22",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
    email: "jane.fisher@example.com",
  },
  {
    id: 4,
    name: "William Howard",
    role: "C.M.",
    team: "Marketing",
    status: "vacation",
    age: "28",
    avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
    email: "william.howard@example.com",
  },
  {
    id: 5,
    name: "Kristen Copper",
    role: "S. Manager",
    team: "Sales",
    status: "active",
    age: "24",
    avatar: "https://i.pravatar.cc/150?u=a092581d4ef9026700d",
    email: "kristen.cooper@example.com",
  },
  // Add more sample data as needed
];

// Custom columns definition
const columns = [
  {name: "NAME", uid: "name", sortable: true},
  {name: "ROLE", uid: "role", sortable: true},
  {name: "STATUS", uid: "status", sortable: true},
  {name: "TEAM", uid: "team", sortable: true},
  {name: "AGE", uid: "age", sortable: true},
  {name: "ACTIONS", uid: "actions"},
];

export default function AdvancedTableDemo() {
  // Handlers for table actions
  const handleAddNew = () => {
    console.log("Add new item clicked");
    // You could open a modal here to add a new item
  };

  const handleView = (item: any) => {
    console.log("View item:", item);
    // You could navigate to a detail page or open a modal
  };

  const handleEdit = (item: any) => {
    console.log("Edit item:", item);
    // You could open an edit modal or navigate to an edit page
  };

  const handleDelete = (item: any) => {
    console.log("Delete item:", item);
    // You could show a confirmation dialog before deletion
  };

  return (
    <div className="w-full p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Advanced Data Table</h1>
        <p className="text-default-500">
          A feature-rich data table with sorting, filtering, pagination, and more.
        </p>
      </div>
      
      <div className="w-full">
        <AdvancedTable 
          data={users} 
          columns={columns}
          onAddNew={handleAddNew}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          initialVisibleColumns={["name", "role", "team", "status", "actions"]}
        />
      </div>
    </div>
  );
}