import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Plus, Eye, AlertTriangle } from "lucide-react";

interface LoanSummary {
  deduction_id: number;
  deduction_type: string;
  principal_amount: number;
  remaining_balance: number;
  installment_amount: number;
  installments_total: number;
  installments_paid: number;
  next_payment_date?: string;
  is_active: boolean;
}

interface LoanOverviewProps {
  employeeId: string;
  onOpenLoanModal?: () => void;
  className?: string;
}

export function LoanOverview({
  employeeId,
  onOpenLoanModal,
  className,
}: LoanOverviewProps) {
  const [loans, setLoans] = useState<LoanSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalOwed, setTotalOwed] = useState(0);
  const [monthlyDeduction, setMonthlyDeduction] = useState(0);

  useEffect(() => {
    fetchLoanSummary();
  }, [employeeId]);

  const fetchLoanSummary = async () => {
    if (!employeeId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/loans/employee/${employeeId}/summary`);
      if (response.ok) {
        const data = await response.json();
        const loanData = data.data || [];
        setLoans(loanData);

        // Calculate totals
        const total = loanData.reduce(
          (sum: number, loan: LoanSummary) => sum + loan.remaining_balance,
          0
        );
        const monthly = loanData.reduce(
          (sum: number, loan: LoanSummary) =>
            loan.is_active ? sum + loan.installment_amount : sum,
          0
        );

        setTotalOwed(total);
        setMonthlyDeduction(monthly);
      }
    } catch (error) {
      console.error("Failed to fetch loan summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const calculateProgress = (loan: LoanSummary) => {
    return (loan.installments_paid / loan.installments_total) * 100;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Loans & Advances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Loans & Advances
            </CardTitle>
            <CardDescription>
              {loans.length === 0
                ? "No active loans"
                : `${loans.length} active loan(s)`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onOpenLoanModal && (
              <>
                <Button variant="outline" size="sm" onClick={onOpenLoanModal}>
                  <Eye className="h-4 w-4 mr-1" />
                  View All
                </Button>
                <Button size="sm" onClick={onOpenLoanModal}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Loan
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loans.length === 0 ? (
          <div className="text-center py-6">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No loans or advances
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg border">
                <p className="text-xs text-muted-foreground">
                  Total Outstanding
                </p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(totalOwed)}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border">
                <p className="text-xs text-muted-foreground">
                  Monthly Deduction
                </p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(monthlyDeduction)}
                </p>
              </div>
            </div>

            {/* Loan List */}
            <div className="space-y-3">
              {loans.slice(0, 3).map((loan) => (
                <div
                  key={loan.deduction_id}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {loan.deduction_type}
                      </span>
                      <Badge
                        variant={loan.is_active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {loan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(loan.remaining_balance)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        Progress: {loan.installments_paid}/
                        {loan.installments_total}
                      </span>
                      <span>{Math.round(calculateProgress(loan))}%</span>
                    </div>
                    <Progress value={calculateProgress(loan)} className="h-2" />
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Monthly: {formatCurrency(loan.installment_amount)}
                    </span>
                    {loan.next_payment_date && (
                      <span className="text-muted-foreground">
                        Next:{" "}
                        {new Date(loan.next_payment_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {loans.length > 3 && (
                <div className="text-center">
                  <Button variant="outline" size="sm" onClick={onOpenLoanModal}>
                    View {loans.length - 3} more loan(s)
                  </Button>
                </div>
              )}
            </div>

            {/* Alerts */}
            {loans.some(
              (loan) => loan.remaining_balance > 0 && !loan.is_active
            ) && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">
                  Some loans are inactive but have outstanding balances
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
