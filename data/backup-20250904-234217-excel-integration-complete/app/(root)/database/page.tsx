"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Database, Save, X, RefreshCw } from "lucide-react";

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  data: any[];
}

interface ColumnInfo {
  name: string;
  type: string;
  isPrimary?: boolean;
  isRequired?: boolean;
  defaultValue?: any;
}

interface DatabasePageProps {}

const DatabasePage: React.FC<DatabasePageProps> = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [showAddRowDialog, setShowAddRowDialog] = useState(false);
  const [showEditRowDialog, setShowEditRowDialog] = useState(false);
  const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deleteRowIndex, setDeleteRowIndex] = useState<number | null>(null);
  const [newRowData, setNewRowData] = useState<any>({});
  const [newColumnData, setNewColumnData] = useState({
    name: '',
    type: 'text',
    isRequired: false,
    defaultValue: ''
  });

  // Load database tables on component mount
  useEffect(() => {
    loadTables();
  }, []);

  // Load table data when table is selected
  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/database/tables-simple');
      if (response.ok) {
        const data = await response.json();
        const tableNames = data.tables.map((t: any) => t.table_name);
        setTables(tableNames);
        if (tableNames.length > 0 && !selectedTable) {
          setSelectedTable(tableNames[0]);
        }
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    try {
      // Load columns
      const columnsResponse = await fetch(`/api/database/tables/${tableName}/columns`);
      if (columnsResponse.ok) {
        const columns = await columnsResponse.json();
        setTableColumns(columns);
      }

      // Load data
      const dataResponse = await fetch(`/api/database/tables/${tableName}/rows`);
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        setTableData(data);
      }
    } catch (error) {
      console.error('Error loading table data:', error);
    }
  };

  const handleEditRow = (rowIndex: number) => {
    setEditingRow(rowIndex);
    setEditingData({ ...tableData[rowIndex] });
    setShowEditRowDialog(true);
  };

  const handleSaveRow = async () => {
    if (editingRow === null) return;

    try {
      const response = await fetch(`/api/database/tables/${selectedTable}/rows`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rowIndex: editingRow,
          data: editingData
        }),
      });

      if (response.ok) {
        await loadTableData(selectedTable);
        setEditingRow(null);
        setEditingData({});
        setShowEditRowDialog(false);
      }
    } catch (error) {
      console.error('Error saving row:', error);
    }
  };

  const handleDeleteRow = async (rowIndex: number) => {
    setDeleteRowIndex(rowIndex);
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteRow = async () => {
    if (deleteRowIndex === null) return;
    
    try {
      const response = await fetch(`/api/database/tables/${selectedTable}/rows`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rowIndex: deleteRowIndex }),
      });

      if (response.ok) {
        await loadTableData(selectedTable);
      }
    } catch (error) {
      console.error('Error deleting row:', error);
    } finally {
      setShowDeleteConfirmDialog(false);
      setDeleteRowIndex(null);
    }
  };

  const handleAddRow = async () => {
    try {
      const response = await fetch(`/api/database/tables/${selectedTable}/rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRowData),
      });

      if (response.ok) {
        await loadTableData(selectedTable);
        setShowAddRowDialog(false);
        setNewRowData({});
      }
    } catch (error) {
      console.error('Error adding row:', error);
    }
  };

  const handleAddColumn = async () => {
    try {
      const response = await fetch(`/api/database/tables/${selectedTable}/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newColumnData),
      });

      if (response.ok) {
        await loadTableData(selectedTable);
        setShowAddColumnDialog(false);
        setNewColumnData({
          name: '',
          type: 'text',
          isRequired: false,
          defaultValue: ''
        });
      }
    } catch (error) {
      console.error('Error adding column:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading database tables...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-2">
          <Database className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Database Management</h1>
        </div>
        <Button onClick={loadTables} variant="outline" className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Table</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((tableName) => (
                <SelectItem key={tableName} value={tableName}>
                  {tableName} ({tableData.length} rows)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTable && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">{selectedTable} Table</CardTitle>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <Dialog open={showAddRowDialog} onOpenChange={setShowAddRowDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Row
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">Add New Row to {selectedTable}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col h-full">
                      <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[60vh]">
                        {tableColumns.map((column) => (
                          <div key={column.name} className="space-y-2">
                            <Label htmlFor={column.name} className="flex items-center gap-2">
                              {column.name}
                              {column.isPrimary && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">PK</span>
                              )}
                              {column.isRequired && (
                                <span className="text-xs bg-red-100 text-red-800 px-1 rounded">*</span>
                              )}
                            </Label>
                            <Input
                              id={column.name}
                              value={newRowData[column.name] || ''}
                              onChange={(e) => setNewRowData({
                                ...newRowData,
                                [column.name]: e.target.value
                              })}
                              placeholder={`Enter ${column.name} (${column.type})`}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => {
                          setShowAddRowDialog(false);
                          setNewRowData({});
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddRow}>
                          Add Row
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showAddColumnDialog} onOpenChange={setShowAddColumnDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Column
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md w-[95vw]">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">Add New Column to {selectedTable}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="columnName">Column Name</Label>
                        <Input
                          id="columnName"
                          value={newColumnData.name}
                          onChange={(e) => setNewColumnData({
                            ...newColumnData,
                            name: e.target.value
                          })}
                          placeholder="Enter column name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="columnType">Data Type</Label>
                        <Select
                          value={newColumnData.type}
                          onValueChange={(value) => setNewColumnData({
                            ...newColumnData,
                            type: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="integer">Integer</SelectItem>
                            <SelectItem value="real">Float</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="timestamp">Timestamp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isRequired"
                          checked={newColumnData.isRequired}
                          onChange={(e) => setNewColumnData({
                            ...newColumnData,
                            isRequired: e.target.checked
                          })}
                        />
                        <Label htmlFor="isRequired">Required (NOT NULL)</Label>
                      </div>
                      <div>
                        <Label htmlFor="defaultValue">Default Value</Label>
                        <Input
                          id="defaultValue"
                          value={newColumnData.defaultValue}
                          onChange={(e) => setNewColumnData({
                            ...newColumnData,
                            defaultValue: e.target.value
                          })}
                          placeholder="Default value (optional)"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setShowAddColumnDialog(false);
                          setNewColumnData({
                            name: '',
                            type: 'text',
                            isRequired: false,
                            defaultValue: ''
                          });
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddColumn}>
                          Add Column
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Row Dialog */}
                <Dialog open={showEditRowDialog} onOpenChange={setShowEditRowDialog}>
                  <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">Edit Row in {selectedTable}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col h-full">
                      <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[60vh]">
                        {tableColumns.map((column) => (
                          <div key={column.name} className="space-y-2">
                            <Label htmlFor={`edit-${column.name}`} className="flex items-center gap-2">
                              {column.name}
                              {column.isPrimary && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">PK</span>
                              )}
                              {column.isRequired && (
                                <span className="text-xs bg-red-100 text-red-800 px-1 rounded">*</span>
                              )}
                            </Label>
                            <Input
                              id={`edit-${column.name}`}
                              value={editingData[column.name] || ''}
                              onChange={(e) => setEditingData({
                                ...editingData,
                                [column.name]: e.target.value
                              })}
                              placeholder={`Enter ${column.name} (${column.type})`}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => {
                          setShowEditRowDialog(false);
                          setEditingRow(null);
                          setEditingData({});
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveRow}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">Confirm Delete</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Are you sure you want to delete this row? This action cannot be undone.
                      </p>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowDeleteConfirmDialog(false);
                            setDeleteRowIndex(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={confirmDeleteRow}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableColumns.map((column) => (
                      <TableHead key={column.name}>
                        <div className="flex items-center space-x-1">
                          <span>{column.name}</span>
                          {column.isPrimary && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">PK</span>
                          )}
                          {column.isRequired && (
                            <span className="text-xs bg-red-100 text-red-800 px-1 rounded">*</span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {tableColumns.map((column) => (
                        <TableCell key={column.name}>
                          <span className="truncate max-w-xs block" title={row[column.name]?.toString() || ''}>
                            {row[column.name]?.toString() || ''}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="w-32">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRow(rowIndex)}
                            className="hover:bg-blue-50 hover:border-blue-300 px-2"
                            title="Edit Row"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRow(rowIndex)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 px-2"
                            title="Delete Row"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {tableData.map((row, rowIndex) => (
                <Card key={rowIndex} className="p-4">
                  <div className="space-y-3">
                    {tableColumns.map((column) => (
                      <div key={column.name} className="flex flex-col">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-700">{column.name}</span>
                          {column.isPrimary && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">PK</span>
                          )}
                          {column.isRequired && (
                            <span className="text-xs bg-red-100 text-red-800 px-1 rounded">*</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-900 break-all">
                          {row[column.name]?.toString() || ''}
                        </span>
                      </div>
                    ))}
                    <div className="flex space-x-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRow(rowIndex)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRow(rowIndex)}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatabasePage;
