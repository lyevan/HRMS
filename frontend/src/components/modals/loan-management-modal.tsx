import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Save,
  Plus,
  CreditCard,
  Receipt,
  History,
  Calculator,
} from "lucide-react";

interface LoanData {
  deduction_id: number;
  employee_id: string;
  deduction_type_id: number;
  amount: number;
  principal_amount: number;
  remaining_balance: number;
  installment_amount: number;
  installments_total: number;
  installments_paid: number;
  start_date: string;
  end_date: string;
  description?: string;
  is_active: boolean;
  is_recurring: boolean;
  created_at: string;
  deduction_type?: string;
  employee_name?: string;
}

interface PaymentHistory {
  payment_id: number;
  deduction_id: number;
  payment_date: string;
  amount_paid: number;
  remaining_balance_after: number;
  payroll_period_start?: string;
  payroll_period_end?: string;
  notes?: string;
}

interface DeductionType {
  deduction_type_id: number;
  name: string;
  description?: string;
}

interface LoanManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmployeeId?: string;
  selectedEmployeeName?: string;
}

export function LoanManagementModal({
  open,
  onOpenChange,
  selectedEmployeeId,
  selectedEmployeeName,
}: LoanManagementModalProps) {
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanData | null>(null);

  // New loan form state
  const [newLoanForm, setNewLoanForm] = useState({
    employee_id: selectedEmployeeId || "",
    deduction_type_id: "",
    principal_amount: "",
    installment_amount: "",
    installments_total: "",
    start_date: "",
    description: "",
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, selectedEmployeeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch loans for the employee
      if (selectedEmployeeId) {
        const loansResponse = await fetch(
          `/api/loans/employee/${selectedEmployeeId}`
        );
        if (loansResponse.ok) {
          const loansData = await loansResponse.json();
          setLoans(loansData.data || []);
        }
      }

      // Fetch deduction types
      const typesResponse = await fetch("/api/loans/types");
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        setDeductionTypes(typesData.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (loanId: number) => {
    try {
      const response = await fetch(`/api/loans/${loanId}/payments`);
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newLoanForm,
          principal_amount: parseFloat(newLoanForm.principal_amount),
          installment_amount: parseFloat(newLoanForm.installment_amount),
          installments_total: parseInt(newLoanForm.installments_total),
          deduction_type_id: parseInt(newLoanForm.deduction_type_id),
        }),
      });

      if (response.ok) {
        // Reset form and refresh data
        setNewLoanForm({
          employee_id: selectedEmployeeId || "",
          deduction_type_id: "",
          principal_amount: "",
          installment_amount: "",
          installments_total: "",
          start_date: "",
          description: "",
        });
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to create loan:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/loans/${selectedLoan.deduction_id}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount_paid: parseFloat(paymentForm.amount_paid),
            payment_date: paymentForm.payment_date,
            notes: paymentForm.notes,
          }),
        }
      );

      if (response.ok) {
        // Reset form and refresh data
        setPaymentForm({
          amount_paid: "",
          payment_date: new Date().toISOString().split("T")[0],
          notes: "",
        });
        await fetchData();
        await fetchPaymentHistory(selectedLoan.deduction_id);
      }
    } catch (error) {
      console.error("Failed to record payment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateRemainingMonths = (loan: LoanData) => {
    return loan.installments_total - loan.installments_paid;
  };

  const calculateProgress = (loan: LoanData) => {
    return (loan.installments_paid / loan.installments_total) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Loan & Advance Management
            {selectedEmployeeName && (
              <Badge variant="outline">{selectedEmployeeName}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Manage employee loans, cash advances, and installment payments
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading loan data...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Loan
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Payment
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loans.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No active loans found
                    </p>
                  </div>
                ) : (
                  loans.map((loan) => (
                    <Card
                      key={loan.deduction_id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        selectedLoan?.deduction_id === loan.deduction_id
                          ? "ring-2 ring-primary"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedLoan(loan);
                        fetchPaymentHistory(loan.deduction_id);
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          {loan.deduction_type || "Loan"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          ID: {loan.deduction_id}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Principal:</span>
                          <span className="font-medium">
                            {formatCurrency(loan.principal_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Remaining:</span>
                          <span className="font-medium text-orange-600">
                            {formatCurrency(loan.remaining_balance)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Monthly:</span>
                          <span className="font-medium">
                            {formatCurrency(loan.installment_amount)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress:</span>
                            <span className="font-medium">
                              {loan.installments_paid}/{loan.installments_total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${calculateProgress(loan)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <Badge
                            variant={loan.is_active ? "default" : "secondary"}
                          >
                            {loan.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {calculateRemainingMonths(loan)} months left
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Create New Loan Tab */}
            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Loan/Advance</CardTitle>
                  <CardDescription>
                    Add a new loan or cash advance for the employee
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateLoan} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deduction_type_id">Loan Type</Label>
                        <Select
                          value={newLoanForm.deduction_type_id}
                          onValueChange={(value) =>
                            setNewLoanForm((prev) => ({
                              ...prev,
                              deduction_type_id: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select loan type" />
                          </SelectTrigger>
                          <SelectContent>
                            {deductionTypes.map((type) => (
                              <SelectItem
                                key={type.deduction_type_id}
                                value={type.deduction_type_id.toString()}
                              >
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="principal_amount">
                          Principal Amount
                        </Label>
                        <Input
                          id="principal_amount"
                          type="number"
                          step="0.01"
                          value={newLoanForm.principal_amount}
                          onChange={(e) =>
                            setNewLoanForm((prev) => ({
                              ...prev,
                              principal_amount: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="installment_amount">
                          Monthly Installment
                        </Label>
                        <Input
                          id="installment_amount"
                          type="number"
                          step="0.01"
                          value={newLoanForm.installment_amount}
                          onChange={(e) =>
                            setNewLoanForm((prev) => ({
                              ...prev,
                              installment_amount: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="installments_total">
                          Number of Installments
                        </Label>
                        <Input
                          id="installments_total"
                          type="number"
                          value={newLoanForm.installments_total}
                          onChange={(e) =>
                            setNewLoanForm((prev) => ({
                              ...prev,
                              installments_total: e.target.value,
                            }))
                          }
                          placeholder="12"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="start_date">Start Date</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={newLoanForm.start_date}
                          onChange={(e) =>
                            setNewLoanForm((prev) => ({
                              ...prev,
                              start_date: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newLoanForm.description}
                          onChange={(e) =>
                            setNewLoanForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Enter loan details..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={submitting}>
                      {submitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Plus className="mr-2 h-4 w-4" />
                      Create Loan
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-4">
              {selectedLoan ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Record Payment</CardTitle>
                    <CardDescription>
                      Record a payment for {selectedLoan.deduction_type} (ID:{" "}
                      {selectedLoan.deduction_id})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <p className="text-sm text-muted-foreground">
                          Remaining Balance
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(selectedLoan.remaining_balance)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <p className="text-sm text-muted-foreground">
                          Monthly Installment
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(selectedLoan.installment_amount)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <p className="text-sm text-muted-foreground">
                          Payments Left
                        </p>
                        <p className="text-2xl font-bold">
                          {calculateRemainingMonths(selectedLoan)}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleRecordPayment} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount_paid">Payment Amount</Label>
                          <Input
                            id="amount_paid"
                            type="number"
                            step="0.01"
                            value={paymentForm.amount_paid}
                            onChange={(e) =>
                              setPaymentForm((prev) => ({
                                ...prev,
                                amount_paid: e.target.value,
                              }))
                            }
                            placeholder={selectedLoan.installment_amount.toString()}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment_date">Payment Date</Label>
                          <Input
                            id="payment_date"
                            type="date"
                            value={paymentForm.payment_date}
                            onChange={(e) =>
                              setPaymentForm((prev) => ({
                                ...prev,
                                payment_date: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={paymentForm.notes}
                            onChange={(e) =>
                              setPaymentForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="Payment notes..."
                            rows={2}
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={submitting}>
                        {submitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Save className="mr-2 h-4 w-4" />
                        Record Payment
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a loan from the Overview tab to record payments
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Payment History Tab */}
            <TabsContent value="history" className="space-y-4">
              {selectedLoan ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>
                      Payment history for {selectedLoan.deduction_type} (ID:{" "}
                      {selectedLoan.deduction_id})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {paymentHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            No payment history found
                          </p>
                        </div>
                      ) : (
                        paymentHistory.map((payment) => (
                          <div
                            key={payment.payment_id}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div>
                              <p className="font-medium">
                                {formatCurrency(payment.amount_paid)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(
                                  payment.payment_date
                                ).toLocaleDateString()}
                              </p>
                              {payment.notes && (
                                <p className="text-xs text-muted-foreground">
                                  {payment.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                Balance:{" "}
                                {formatCurrency(
                                  payment.remaining_balance_after
                                )}
                              </p>
                              {payment.payroll_period_start &&
                                payment.payroll_period_end && (
                                  <p className="text-xs text-muted-foreground">
                                    Payroll:{" "}
                                    {new Date(
                                      payment.payroll_period_start
                                    ).toLocaleDateString()}{" "}
                                    -{" "}
                                    {new Date(
                                      payment.payroll_period_end
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a loan from the Overview tab to view payment history
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
