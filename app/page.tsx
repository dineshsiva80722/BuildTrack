"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import {
  CalendarDays,
  Users,
  Package,
  Calculator,
  Menu,
  X,
  Plus,
  Edit,
  Trash2,
  LogOut,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

interface Employee {
  id: number
  name: string
  role: string
  dailyRate: number
  status: "present" | "absent"
  hoursWorked: number
}

interface Material {
  id: number
  name: string
  unit: string
  current: number
  minimum: number
  cost: number
}

interface MaterialUsage {
  id: number
  materialId: number
  materialName: string
  quantity: number
  date: string
  notes: string
}

export default function BuildTrack() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // State for employees
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: "John Smith", role: "Foreman", dailyRate: 150, status: "present", hoursWorked: 8 },
    { id: 2, name: "Mike Johnson", role: "Carpenter", dailyRate: 120, status: "present", hoursWorked: 8 },
    { id: 3, name: "David Brown", role: "Laborer", dailyRate: 100, status: "absent", hoursWorked: 0 },
    { id: 4, name: "Chris Wilson", role: "Electrician", dailyRate: 140, status: "present", hoursWorked: 6 },
  ])

  // State for materials
  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, name: "Cement", unit: "bags", current: 45, minimum: 20, cost: 12.5 },
    { id: 2, name: "Sand", unit: "cubic yards", current: 8, minimum: 5, cost: 35.0 },
    { id: 3, name: "Gravel", unit: "cubic yards", current: 12, minimum: 8, cost: 28.0 },
    { id: 4, name: "Rock", unit: "tons", current: 3, minimum: 2, cost: 45.0 },
  ])

  // State for material usage
  const [materialUsage, setMaterialUsage] = useState<MaterialUsage[]>([])

  // Monthly attendance state
  const [attendanceHistory, setAttendanceHistory] = useState<{
    [key: string]: { [employeeId: number]: { status: "present" | "absent"; hoursWorked: number } }
  }>(
    // Initialize with some sample data for the current month
    (() => {
      const history: {
        [key: string]: { [employeeId: number]: { status: "present" | "absent"; hoursWorked: number } }
      } = {}
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()

      // Generate sample data for the current month
      for (let day = 1; day <= today.getDate(); day++) {
        const dateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
        history[dateKey] = {}
        const currentEmployees = [
          { id: 1, name: "John Smith", role: "Foreman", dailyRate: 150, status: "present", hoursWorked: 8 },
          { id: 2, name: "Mike Johnson", role: "Carpenter", dailyRate: 120, status: "present", hoursWorked: 8 },
          { id: 3, name: "David Brown", role: "Laborer", dailyRate: 100, status: "absent", hoursWorked: 0 },
          { id: 4, name: "Chris Wilson", role: "Electrician", dailyRate: 140, status: "present", hoursWorked: 6 },
        ];
        currentEmployees.forEach((emp) => {
          // Random attendance for demo - in real app this would be actual data
          const isPresent = Math.random() > 0.2 // 80% attendance rate
          history[dateKey][emp.id] = {
            status: isPresent ? "present" : "absent",
            hoursWorked: isPresent ? 8 : 0,
          }
        })
      }

      return history
    })(),
  )

  // Task management state
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Foundation Work', project: 'Residential Tower', assignedTo: 1, status: 'in-progress', progress: 65, dueDate: '2023-06-15', description: 'Complete concrete pouring and leveling for the foundation' },
    { id: 2, title: 'Electrical Wiring', project: 'Office Complex', assignedTo: 4, status: 'not-started', progress: 0, dueDate: '2023-06-20', description: 'Install and test all electrical wiring on 3rd floor' },
    { id: 3, title: 'Material Delivery', project: 'Shopping Mall', assignedTo: 3, status: 'in-progress', progress: 30, dueDate: '2023-06-12', description: 'Receive and verify construction materials delivery' },
  ]);

  // UI state
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<typeof tasks[0] | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [laborUpdates, setLaborUpdates] = useState<{employeeId: number; hours: number; taskId: number}[]>([]);

  // Modal states
  const [employeeModal, setEmployeeModal] = useState({ open: false, mode: "add", employee: null as Employee | null })
  const [materialModal, setMaterialModal] = useState({ open: false, mode: "add", material: null as Material | null })
  const [usageModal, setUsageModal] = useState({ open: false })

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    role: "",
    dailyRate: "",
    status: "present" as "present" | "absent",
    hoursWorked: "8",
  })
  const [materialForm, setMaterialForm] = useState({ name: "", unit: "", current: "", minimum: "", cost: "" })
  const [usageForm, setUsageForm] = useState({ materialId: "", quantity: "", notes: "" })

  // Check authentication on mount
  useEffect(() => {
    const authStatus = localStorage.getItem("buildtrack_auth")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  // Login function
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginForm.username === "admin" && loginForm.password === "buildtrack123") {
      setIsAuthenticated(true)
      localStorage.setItem("buildtrack_auth", "true")
      toast({ title: "Login successful", description: "Welcome to BuildTrack!" })
    } else {
      toast({ title: "Login failed", description: "Invalid username or password", variant: "destructive" })
    }
  }

  // Logout function
  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("buildtrack_auth")
    toast({ title: "Logged out", description: "You have been logged out successfully" })
  }

  // Employee CRUD operations
  const handleAddEmployee = () => {
    if (!employeeForm.name || !employeeForm.role || !employeeForm.dailyRate) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    const newEmployee: Employee = {
      id: Math.max(...employees.map((e) => e.id), 0) + 1,
      name: employeeForm.name,
      role: employeeForm.role,
      dailyRate: Number.parseFloat(employeeForm.dailyRate),
      status: employeeForm.status,
      hoursWorked: Number.parseFloat(employeeForm.hoursWorked),
    }

    setEmployees([...employees, newEmployee])
    setEmployeeForm({ name: "", role: "", dailyRate: "", status: "present", hoursWorked: "8" })
    setEmployeeModal({ open: false, mode: "add", employee: null })
    toast({ title: "Success", description: "Employee added successfully" })
  }

  const handleEditEmployee = () => {
    if (!employeeForm.name || !employeeForm.role || !employeeForm.dailyRate) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    setEmployees(
      employees.map((emp) =>
        emp.id === employeeModal.employee?.id
          ? {
            ...emp,
            name: employeeForm.name,
            role: employeeForm.role,
            dailyRate: Number.parseFloat(employeeForm.dailyRate),
            status: employeeForm.status,
            hoursWorked: Number.parseFloat(employeeForm.hoursWorked),
          }
          : emp,
      ),
    )

    setEmployeeForm({ name: "", role: "", dailyRate: "", status: "present", hoursWorked: "8" })
    setEmployeeModal({ open: false, mode: "add", employee: null })
    toast({ title: "Success", description: "Employee updated successfully" })
  }

  const handleDeleteEmployee = (id: number) => {
    setEmployees(employees.filter((emp) => emp.id !== id))
    toast({ title: "Success", description: "Employee deleted successfully" })
  }

  const openEmployeeModal = (mode: "add" | "edit", employee?: Employee) => {
    if (mode === "edit" && employee) {
      setEmployeeForm({
        name: employee.name,
        role: employee.role,
        dailyRate: employee.dailyRate.toString(),
        status: employee.status,
        hoursWorked: employee.hoursWorked.toString(),
      })
    } else {
      setEmployeeForm({ name: "", role: "", dailyRate: "", status: "present", hoursWorked: "8" })
    }
    setEmployeeModal({ open: true, mode, employee: employee || null })
  }

  // Material CRUD operations
  const handleAddMaterial = () => {
    if (
      !materialForm.name ||
      !materialForm.unit ||
      !materialForm.current ||
      !materialForm.minimum ||
      !materialForm.cost
    ) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    const newMaterial: Material = {
      id: Math.max(...materials.map((m) => m.id), 0) + 1,
      name: materialForm.name,
      unit: materialForm.unit,
      current: Number.parseFloat(materialForm.current),
      minimum: Number.parseFloat(materialForm.minimum),
      cost: Number.parseFloat(materialForm.cost),
    }

    setMaterials([...materials, newMaterial])
    setMaterialForm({ name: "", unit: "", current: "", minimum: "", cost: "" })
    setMaterialModal({ open: false, mode: "add", material: null })
    toast({ title: "Success", description: "Material added successfully" })
  }

  const handleEditMaterial = () => {
    if (
      !materialForm.name ||
      !materialForm.unit ||
      !materialForm.current ||
      !materialForm.minimum ||
      !materialForm.cost
    ) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    setMaterials(
      materials.map((mat) =>
        mat.id === materialModal.material?.id
          ? {
            ...mat,
            name: materialForm.name,
            unit: materialForm.unit,
            current: Number.parseFloat(materialForm.current),
            minimum: Number.parseFloat(materialForm.minimum),
            cost: Number.parseFloat(materialForm.cost),
          }
          : mat,
      ),
    )

    setMaterialForm({ name: "", unit: "", current: "", minimum: "", cost: "" })
    setMaterialModal({ open: false, mode: "add", material: null })
    toast({ title: "Success", description: "Material updated successfully" })
  }

  const handleDeleteMaterial = (id: number) => {
    setMaterials(materials.filter((mat) => mat.id !== id))
    toast({ title: "Success", description: "Material deleted successfully" })
  }

  const openMaterialModal = (mode: "add" | "edit", material?: Material) => {
    if (mode === "edit" && material) {
      setMaterialForm({
        name: material.name,
        unit: material.unit,
        current: material.current.toString(),
        minimum: material.minimum.toString(),
        cost: material.cost.toString(),
      })
    } else {
      setMaterialForm({ name: "", unit: "", current: "", minimum: "", cost: "" })
    }
    setMaterialModal({ open: true, mode, material: material || null })
  }

  // Material usage recording
  const handleRecordUsage = () => {
    if (!usageForm.materialId || !usageForm.quantity) {
      toast({ title: "Error", description: "Please select material and enter quantity", variant: "destructive" })
      return
    }

    const material = materials.find((m) => m.id === Number.parseInt(usageForm.materialId))
    if (!material) return

    const quantity = Number.parseFloat(usageForm.quantity)
    if (quantity > material.current) {
      toast({ title: "Error", description: "Not enough stock available", variant: "destructive" })
      return
    }

    // Update material stock
    setMaterials(
      materials.map((mat) =>
        mat.id === Number.parseInt(usageForm.materialId) ? { ...mat, current: mat.current - quantity } : mat,
      ),
    )

    // Record usage
    const newUsage: MaterialUsage = {
      id: Math.max(...materialUsage.map((u) => u.id), 0) + 1,
      materialId: Number.parseInt(usageForm.materialId),
      materialName: material.name,
      quantity,
      date: new Date().toLocaleDateString(),
      notes: usageForm.notes,
    }

    setMaterialUsage([...materialUsage, newUsage])
    setUsageForm({ materialId: "", quantity: "", notes: "" })
    setUsageModal({ open: false })
    toast({ title: "Success", description: "Material usage recorded successfully" })
  }

  // Toggle attendance
  const toggleAttendance = (id: number) => {
    const today = new Date().toISOString().split("T")[0]

    setEmployees(
      employees.map((emp) =>
        emp.id === id
          ? {
            ...emp,
            status: emp.status === "present" ? "absent" : "present",
            hoursWorked: emp.status === "present" ? 0 : 8,
          }
          : emp,
      ),
    )

    // Update attendance history
    setAttendanceHistory((prev) => ({
      ...prev,
      [today]: {
        ...prev[today],
        [id]: {
          status: employees.find((emp) => emp.id === id)?.status === "present" ? "absent" : "present",
          hoursWorked: employees.find((emp) => emp.id === id)?.status === "present" ? 0 : 8,
        },
      },
    }))

    toast({ title: "Success", description: "Attendance updated" })
  }

  // Calculate totals
  const totalEmployees = employees.length
  const presentEmployees = employees.filter((emp) => emp.status === "present").length
  const totalDailyCost = employees.reduce((sum, emp) => sum + (emp.status === "present" ? emp.dailyRate : 0), 0)
  const lowStockMaterials = materials.filter((mat) => mat.current <= mat.minimum).length

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: CalendarDays },
    { id: "attendance", name: "Daily Attendance", icon: Users },
    { id: "monthly", name: "Monthly Attendance", icon: CalendarDays },
    { id: "supervisor", name: "Supervisor", icon: UserCheck },
    { id: "materials", name: "Materials", icon: Package },
    { id: "payroll", name: "Payroll", icon: Calculator },
  ]

  // Login page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="Login flex items-center justify-center p-2 ">
              <div className="image w-14 h-14 mt-2 ">
                <Image src="/dezproxlogo.png" alt="Dezprox Logo" width={50} height={50} />
              </div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">BuildTrack Login</h2>
            </div>
            <p className="mt-2 text-center text-sm text-gray-600">Construction Site Management Platform</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Demo credentials: <br />
                Username: <strong>admin</strong> <br />
                Password: <strong>buildtrack123</strong>
              </p>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Monthly attendance render function
  const renderMonthlyAttendance = () => {
    const currentMonth = selectedMonth.getMonth()
    const currentYear = selectedMonth.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const monthName = selectedMonth.toLocaleString("default", { month: "long", year: "numeric" })

    // Calculate monthly statistics for each employee
    const monthlyStats = employees.map((employee) => {
      let presentDays = 0
      let totalHours = 0
      let absentDays = 0

      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
        const dayData = attendanceHistory[dateKey]?.[employee.id]

        if (dayData) {
          if (dayData.status === "present") {
            presentDays++
            totalHours += dayData.hoursWorked
          } else {
            absentDays++
          }
        }
      }

      return {
        ...employee,
        presentDays,
        absentDays,
        totalHours,
        attendanceRate: ((presentDays / (presentDays + absentDays)) * 100).toFixed(1),
      }
    })

    // Generate calendar days
    const calendarDays = []
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day)
    }

    const goToPreviousMonth = () => {
      setSelectedMonth(new Date(currentYear, currentMonth - 1, 1))
    }

    const goToNextMonth = () => {
      setSelectedMonth(new Date(currentYear, currentMonth + 1, 1))
    }

    const goToCurrentMonth = () => {
      setSelectedMonth(new Date())
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monthly Attendance</h1>
            <p className="text-muted-foreground">Track and analyze monthly attendance patterns</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={goToPreviousMonth}>
              ←
            </Button>
            <Button variant="outline" onClick={goToCurrentMonth}>
              Current Month
            </Button>
            <Button variant="outline" onClick={goToNextMonth}>
              →
            </Button>
          </div>
        </div>

        {/* Monthly Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Working Days</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{daysInMonth}</div>
              <p className="text-xs text-muted-foreground">Days in {monthName}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthlyStats.length > 0
                  ? (
                    monthlyStats.reduce((sum, emp) => sum + Number.parseFloat(emp.attendanceRate), 0) /
                    monthlyStats.length
                  ).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Team average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyStats.reduce((sum, emp) => sum + emp.totalHours, 0)}h</div>
              <p className="text-xs text-muted-foreground">All employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${monthlyStats.reduce((sum, emp) => sum + emp.presentDays * emp.dailyRate, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total payroll</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Statistics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance Summary - {monthName}</CardTitle>
            <CardDescription>Employee attendance statistics and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Present Days</TableHead>
                  <TableHead>Absent Days</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Monthly Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyStats.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>{employee.presentDays}</TableCell>
                    <TableCell>{employee.absentDays}</TableCell>
                    <TableCell>{employee.totalHours}h</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          Number.parseFloat(employee.attendanceRate) >= 90
                            ? "default"
                            : Number.parseFloat(employee.attendanceRate) >= 75
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {employee.attendanceRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">${employee.presentDays * employee.dailyRate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Daily Attendance Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance Calendar - {monthName}</CardTitle>
            <CardDescription>Day-by-day attendance tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Employee</TableHead>
                    {calendarDays.map((day) => (
                      <TableHead key={day} className="text-center w-8 p-1">
                        {day}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="text-sm">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{employee.role}</p>
                        </div>
                      </TableCell>
                      {calendarDays.map((day) => {
                        const dateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
                        const dayData = attendanceHistory[dateKey]?.[employee.id]
                        const isToday =
                          new Date().getDate() === day &&
                          new Date().getMonth() === currentMonth &&
                          new Date().getFullYear() === currentYear

                        return (
                          <TableCell key={day} className="text-center p-1">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${dayData?.status === "present"
                                ? "bg-green-100 text-green-800"
                                : dayData?.status === "absent"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-400"
                                } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                            >
                              {dayData?.status === "present" ? "✓" : dayData?.status === "absent" ? "✗" : "-"}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-green-800 text-xs">
                  ✓
                </div>
                <span>Present</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-red-800 text-xs">
                  ✗
                </div>
                <span>Absent</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs">
                  -
                </div>
                <span>No Data</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-blue-100 rounded-full ring-2 ring-blue-500"></div>
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your construction site operations</p>
        </div>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentEmployees}</div>
            <p className="text-xs text-muted-foreground">Out of {totalEmployees} employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Labor Cost</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDailyCost}</div>
            <p className="text-xs text-muted-foreground">Today's total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockMaterials}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button onClick={() => openEmployeeModal("add")} className="h-20 flex-col">
              <Plus className="h-6 w-6 mb-2" />
              Add Employee
            </Button>
            <Button onClick={() => openMaterialModal("add")} variant="outline" className="h-20 flex-col">
              <Plus className="h-6 w-6 mb-2" />
              Add Material
            </Button>
            <Button onClick={() => setUsageModal({ open: true })} variant="outline" className="h-20 flex-col">
              <Package className="h-6 w-6 mb-2" />
              Record Usage
            </Button>
            <Button onClick={() => setActiveTab("payroll")} variant="outline" className="h-20 flex-col">
              <Calculator className="h-6 w-6 mb-2" />
              View Payroll
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>Current workforce status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={employee.status === "present" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleAttendance(employee.id)}
                    >
                      {employee.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Material Inventory</CardTitle>
            <CardDescription>Current stock levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{material.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {material.current} {material.unit}
                    </p>
                  </div>
                  <Badge variant={material.current <= material.minimum ? "destructive" : "default"}>
                    {material.current <= material.minimum ? "Low Stock" : "In Stock"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Track daily employee attendance</p>
        </div>
        <Button onClick={() => openEmployeeModal("add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance - {new Date().toLocaleDateString()}</CardTitle>
          <CardDescription>Mark attendance and track working hours</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Daily Rate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.status === "present" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleAttendance(employee.id)}
                    >
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{employee.hoursWorked}h</TableCell>
                  <TableCell>${employee.dailyRate}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEmployeeModal("edit", employee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteEmployee(employee.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderMaterials = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground">Monitor and manage construction materials</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setUsageModal({ open: true })} variant="outline">
            <Package className="mr-2 h-4 w-4" />
            Record Usage
          </Button>
          <Button onClick={() => openMaterialModal("add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material Inventory</CardTitle>
          <CardDescription>Current stock levels and usage tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Minimum Level</TableHead>
                <TableHead>Cost per Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    {material.current} {material.unit}
                  </TableCell>
                  <TableCell>
                    {material.minimum} {material.unit}
                  </TableCell>
                  <TableCell>${material.cost}</TableCell>
                  <TableCell>
                    <Badge variant={material.current <= material.minimum ? "destructive" : "default"}>
                      {material.current <= material.minimum ? "Low Stock" : "In Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openMaterialModal("edit", material)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteMaterial(material.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Material Usage History */}
      {materialUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Material Usage</CardTitle>
            <CardDescription>History of material consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity Used</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialUsage
                  .slice(-10)
                  .reverse()
                  .map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell>{usage.date}</TableCell>
                      <TableCell>{usage.materialName}</TableCell>
                      <TableCell>{usage.quantity}</TableCell>
                      <TableCell>{usage.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderPayroll = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
        <p className="text-muted-foreground">Calculate and manage employee salaries</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Total</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDailyCost}</div>
            <p className="text-xs text-muted-foreground">Labor cost for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Estimate</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDailyCost * 5}</div>
            <p className="text-xs text-muted-foreground">5-day work week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Estimate</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDailyCost * 22}</div>
            <p className="text-xs text-muted-foreground">22 working days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Summary</CardTitle>
          <CardDescription>Daily earnings breakdown by employee</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Daily Rate</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Today's Earnings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const earnings = employee.status === "present" ? employee.dailyRate : 0
                return (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>${employee.dailyRate}</TableCell>
                    <TableCell>{employee.hoursWorked}h</TableCell>
                    <TableCell className="font-medium">${earnings}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === "present" ? "default" : "secondary"}>{employee.status}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const handleUpdateProgress = (taskId: number, progress: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, progress } : task
    ));
  };

  const handleAssignTask = (taskId: number, employeeId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, assignedTo: employeeId } : task
    ));
  };

  const handleAddLaborUpdate = (employeeId: number, hours: number, taskId: number) => {
    setLaborUpdates([...laborUpdates, { employeeId, hours, taskId }]);
  };

  const renderSupervisor = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supervisor Dashboard</h1>
        <p className="text-muted-foreground">Manage labor work, assign tasks, and track progress</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">In progress: {tasks.filter(t => t.status === 'in-progress').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">{presentEmployees} present today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labor Hours</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {laborUpdates.reduce((sum, update) => sum + update.hours, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Hours logged today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Task Management</CardTitle>
                <CardDescription>Assign and track construction tasks</CardDescription>
              </div>
              <Button size="sm" onClick={() => {
                setSelectedTask(null);
                setIsTaskModalOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" /> New Task
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedTask(task);
                    setIsTaskModalOpen(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">{task.project}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Assigned to: {employees.find(e => e.id === task.assignedTo)?.name || 'Unassigned'}
                      </p>
                    </div>
                    <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                      {task.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Update Labor Work</CardTitle>
              <CardDescription>Log hours and update work progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} ({emp.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Task</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.title} - {task.project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Hours Worked</Label>
                  <Input type="number" min="0.5" step="0.5" placeholder="Enter hours" />
                </div>

                <div className="space-y-2">
                  <Label>Work Description</Label>
                  <Textarea placeholder="Describe the work completed" rows={3} />
                </div>

                <Button className="w-full">
                  Log Work
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Labor Updates</CardTitle>
              <CardDescription>Latest work logged by team</CardDescription>
            </CardHeader>
            <CardContent>
              {laborUpdates.length > 0 ? (
                <div className="space-y-4">
                  {laborUpdates.slice(0, 3).map((update, index) => {
                    const employee = employees.find(e => e.id === update.employeeId);
                    const task = tasks.find(t => t.id === update.taskId);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{employee?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {task?.title || 'Task'} - {update.hours}h
                          </p>
                        </div>
                        <Badge variant="outline">
                          {new Date().toLocaleDateString()}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No labor updates logged yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Detail Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask ? 'Edit Task' : 'New Task'}</DialogTitle>
            <DialogDescription>
              {selectedTask ? 'Update task details and progress' : 'Create a new construction task'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input 
                placeholder="Enter task title" 
                value={selectedTask?.title || ''}
                onChange={(e) => selectedTask && setSelectedTask({...selectedTask, title: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Input 
                placeholder="Enter project name"
                value={selectedTask?.project || ''}
                onChange={(e) => selectedTask && setSelectedTask({...selectedTask, project: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select 
                value={selectedTask?.assignedTo?.toString() || ''}
                onValueChange={(value) => selectedTask && setSelectedTask({...selectedTask, assignedTo: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name} ({emp.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={selectedTask?.status || 'not-started'}
                onValueChange={(value) => selectedTask && setSelectedTask({...selectedTask, status: value as any})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Progress: {selectedTask?.progress || 0}%</Label>
                <span className="text-sm text-muted-foreground">
                  {selectedTask?.progress === 100 ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={selectedTask?.progress || 0} 
                onChange={(e) => selectedTask && setSelectedTask({...selectedTask, progress: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input 
                type="date" 
                value={selectedTask?.dueDate || ''}
                onChange={(e) => selectedTask && setSelectedTask({...selectedTask, dueDate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Enter task details" 
                rows={4}
                value={selectedTask?.description || ''}
                onChange={(e) => selectedTask && setSelectedTask({...selectedTask, description: e.target.value})}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedTask) {
                    if (tasks.some(t => t.id === selectedTask.id)) {
                      // Update existing task
                      setTasks(tasks.map(t => 
                        t.id === selectedTask.id ? selectedTask : t
                      ));
                    } else {
                      // Add new task
                      setTasks([...tasks, { ...selectedTask, id: Math.max(...tasks.map(t => t.id), 0) + 1 }]);
                    }
                  }
                  setIsTaskModalOpen(false);
                }}
              >
                {selectedTask ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard()
      case "attendance":
        return renderAttendance()
      case "monthly":
        return renderMonthlyAttendance()
      case "materials":
        return renderMaterials()
      case "payroll":
        return renderPayroll()
      case "supervisor":
        return renderSupervisor()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex flex-shrink-0 items-center px-4 py-4">
              <div className="image w-10 h-10 ">
                <Image src="/dezproxlogo.png" alt="Dezprox Logo" width={32} height={32} />
              </div>
              <h1 className="text-xl font-bold text-green-600">BuildTrack</h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium ${activeTab === item.id
                      ? "bg-green-100 text-green-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center justify-start flex-shrink-0 px-4 py-4">
            <div className="image w-10 h-10 mt-2">
              <Image src="/dezproxlogo.png" alt="Dezprox Logo" width={32} height={32} />
            </div>
            <h1 className="text-xl font-bold text-green-600">BuildTrack</h1>
          </div>
          <nav className="mt-5 flex-1 space-y-1 px-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium ${activeTab === item.id
                    ? "bg-green-100 text-green-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow lg:hidden">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-bold text-green-600">BuildTrack</h1>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{renderContent()}</div>
        </main>
      </div>

      {/* Employee Modal */}
      <Dialog open={employeeModal.open} onOpenChange={(open) => setEmployeeModal({ ...employeeModal, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{employeeModal.mode === "add" ? "Add New Employee" : "Edit Employee"}</DialogTitle>
            <DialogDescription>
              {employeeModal.mode === "add"
                ? "Enter employee details to add them to the system."
                : "Update employee information."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                placeholder="Enter employee name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={employeeForm.role}
                onValueChange={(value) => setEmployeeForm({ ...employeeForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Foreman">Foreman</SelectItem>
                  <SelectItem value="Carpenter">Carpenter</SelectItem>
                  <SelectItem value="Electrician">Electrician</SelectItem>
                  <SelectItem value="Plumber">Plumber</SelectItem>
                  <SelectItem value="Laborer">Laborer</SelectItem>
                  <SelectItem value="Mason">Mason</SelectItem>
                  <SelectItem value="Roofer">Roofer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate">Daily Rate ($)</Label>
              <Input
                id="rate"
                type="number"
                value={employeeForm.dailyRate}
                onChange={(e) => setEmployeeForm({ ...employeeForm, dailyRate: e.target.value })}
                placeholder="Enter daily rate"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={employeeForm.status}
                onValueChange={(value: "present" | "absent") => setEmployeeForm({ ...employeeForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                id="hours"
                type="number"
                value={employeeForm.hoursWorked}
                onChange={(e) => setEmployeeForm({ ...employeeForm, hoursWorked: e.target.value })}
                placeholder="Enter hours worked"
              />
            </div>
          </div>
          <Button className="w-full" onClick={employeeModal.mode === "add" ? handleAddEmployee : handleEditEmployee}>
            {employeeModal.mode === "add" ? "Add Employee" : "Update Employee"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Material Modal */}
      <Dialog open={materialModal.open} onOpenChange={(open) => setMaterialModal({ ...materialModal, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{materialModal.mode === "add" ? "Add New Material" : "Edit Material"}</DialogTitle>
            <DialogDescription>
              {materialModal.mode === "add" ? "Add a new material to track inventory." : "Update material information."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="material-name">Material Name</Label>
              <Input
                id="material-name"
                value={materialForm.name}
                onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                placeholder="Enter material name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={materialForm.unit}
                onValueChange={(value) => setMaterialForm({ ...materialForm, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bags">Bags</SelectItem>
                  <SelectItem value="cubic yards">Cubic Yards</SelectItem>
                  <SelectItem value="tons">Tons</SelectItem>
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="gallons">Gallons</SelectItem>
                  <SelectItem value="feet">Feet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="current-stock">Current Stock</Label>
              <Input
                id="current-stock"
                type="number"
                value={materialForm.current}
                onChange={(e) => setMaterialForm({ ...materialForm, current: e.target.value })}
                placeholder="Enter current quantity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minimum-stock">Minimum Stock Level</Label>
              <Input
                id="minimum-stock"
                type="number"
                value={materialForm.minimum}
                onChange={(e) => setMaterialForm({ ...materialForm, minimum: e.target.value })}
                placeholder="Enter minimum quantity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost">Cost per Unit ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={materialForm.cost}
                onChange={(e) => setMaterialForm({ ...materialForm, cost: e.target.value })}
                placeholder="Enter cost per unit"
              />
            </div>
          </div>
          <Button className="w-full" onClick={materialModal.mode === "add" ? handleAddMaterial : handleEditMaterial}>
            {materialModal.mode === "add" ? "Add Material" : "Update Material"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Usage Recording Modal */}
      <Dialog open={usageModal.open} onOpenChange={(open) => setUsageModal({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Material Usage</DialogTitle>
            <DialogDescription>Track daily material consumption</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="material-select">Material</Label>
              <Select
                value={usageForm.materialId}
                onValueChange={(value) => setUsageForm({ ...usageForm, materialId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id.toString()}>
                      {material.name} ({material.current} {material.unit} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity-used">Quantity Used</Label>
              <Input
                id="quantity-used"
                type="number"
                value={usageForm.quantity}
                onChange={(e) => setUsageForm({ ...usageForm, quantity: e.target.value })}
                placeholder="Enter quantity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="usage-notes">Notes (Optional)</Label>
              <Textarea
                id="usage-notes"
                value={usageForm.notes}
                onChange={(e) => setUsageForm({ ...usageForm, notes: e.target.value })}
                placeholder="Add any notes about the usage..."
              />
            </div>
          </div>
          <Button className="w-full" onClick={handleRecordUsage}>
            Record Usage
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
