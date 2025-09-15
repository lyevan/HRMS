import express from "express";
import { runPayrollComplianceTests } from "../tests/PayrollComplianceTests.js";
import { AdvancedPayrollCalculator } from "../services/AdvancedPayrollCalculator.js";

const router = express.Router();

// Run 2025 payroll compliance tests
router.get("/compliance-tests", async (req, res) => {
  try {
    console.log("🚀 Running 2025 Philippine Payroll Compliance Tests...");

    const results = await runPayrollComplianceTests();

    res.status(200).json({
      success: true,
      message: "Payroll compliance tests completed",
      data: results,
    });
  } catch (error) {
    console.error("Error running compliance tests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to run compliance tests",
      error: error.message,
    });
  }
});

// Get current rates summary from database
router.get("/rates-summary", async (req, res) => {
  try {
    const summary = await AdvancedPayrollCalculator.getCurrentRatesSummary();

    res.status(200).json({
      success: true,
      message: "Current rates summary retrieved",
      data: summary,
    });
  } catch (error) {
    console.error("Error getting rates summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get rates summary",
      error: error.message,
    });
  }
});

// Validate calculation with specific employee data
router.post("/validate-calculation", async (req, res) => {
  try {
    const { employeeId, grossPay } = req.body;

    if (!employeeId || !grossPay) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and gross pay are required",
      });
    }

    const validation =
      await AdvancedPayrollCalculator.validateCalculationSource(
        employeeId,
        parseFloat(grossPay)
      );

    res.status(200).json({
      success: true,
      message: "Calculation validation completed",
      data: validation,
    });
  } catch (error) {
    console.error("Error validating calculation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate calculation",
      error: error.message,
    });
  }
});

// Sync database configuration
router.post("/sync-config", async (req, res) => {
  try {
    const result =
      await AdvancedPayrollCalculator.syncConfigurationWithDatabase();

    res.status(200).json({
      success: true,
      message: result
        ? "Configuration is synchronized"
        : "Configuration sync required - run migration",
      synced: result,
    });
  } catch (error) {
    console.error("Error syncing configuration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync configuration",
      error: error.message,
    });
  }
});

// Test individual calculation methods
router.post("/test-calculation/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { salary } = req.body;

    if (!salary) {
      return res.status(400).json({
        success: false,
        message: "Salary amount is required",
      });
    }

    const calculator = new AdvancedPayrollCalculator();
    const monthlySalary = parseFloat(salary);
    let result;

    switch (type) {
      case "sss":
        result = await calculator.calculateSSSContribution(monthlySalary);
        break;
      case "philhealth":
        result = await calculator.calculatePhilHealthContribution(
          monthlySalary
        );
        break;
      case "pagibig":
        result = await calculator.calculatePagIBIGContribution(monthlySalary);
        break;
      case "tax":
        // For tax, assume basic deductions
        const basicDeductions = monthlySalary * 0.135; // Approximate government contributions
        const taxableIncome = monthlySalary - basicDeductions;
        result = await calculator.calculateIncomeTax(taxableIncome);
        break;
      default:
        return res.status(400).json({
          success: false,
          message:
            "Invalid calculation type. Use: sss, philhealth, pagibig, or tax",
        });
    }

    res.status(200).json({
      success: true,
      message: `${type.toUpperCase()} calculation completed`,
      data: {
        salary: monthlySalary,
        calculation_type: type,
        result: result,
      },
    });
  } catch (error) {
    console.error(`Error testing ${type} calculation:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to test ${type} calculation`,
      error: error.message,
    });
  }
});

export default router;
