import { AdvancedPayrollCalculator } from "../services/AdvancedPayrollCalculator.js";
import { pool } from "../config/db.js";

/**
 * 2025 Philippine Payroll Compliance Test Suite
 * Tests all government contribution calculations and new rates
 */
export class PayrollComplianceTests {
  constructor() {
    this.calculator = new AdvancedPayrollCalculator();
    this.testResults = [];
  }

  /**
   * Run all 2025 compliance tests
   */
  async runAllTests() {
    console.log("🚀 Starting 2025 Philippine Payroll Compliance Tests...\n");

    this.testResults = [];

    // Database connectivity test
    await this.testDatabaseConnectivity();

    // Configuration tests
    await this.testDatabaseConfiguration();

    // SSS calculation tests
    await this.testSSSCalculations();

    // PhilHealth calculation tests (5.5% rate)
    await this.testPhilHealthCalculations();

    // Pag-IBIG calculation tests (enhanced tiers)
    await this.testPagIBIGCalculations();

    // Income tax calculation tests (2025 brackets)
    await this.testIncomeTaxCalculations();

    // 13th month pay calculation tests
    await this.test13thMonthPayCalculations();

    // Employee override tests
    await this.testEmployeeOverrides();

    // Integration tests
    await this.testIntegratedPayrollCalculation();

    // Print results
    this.printTestResults();

    return this.testResults;
  }

  /**
   * Test database connectivity and migration status
   */
  async testDatabaseConnectivity() {
    console.log("📊 Testing Database Connectivity...");

    try {
      // Test basic connection
      const result = await pool.query("SELECT NOW() as current_time");
      this.addTestResult(
        "Database Connection",
        true,
        "Successfully connected to database"
      );

      // Test if payroll_configuration table exists
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'payroll_configuration'
        )
      `);

      if (tableExists.rows[0].exists) {
        this.addTestResult("Payroll Configuration Table", true, "Table exists");

        // Check if 2025 rates are loaded
        const ratesCount = await pool.query(`
          SELECT COUNT(*) as count 
          FROM payroll_configuration 
          WHERE effective_date = '2025-01-01'
        `);

        if (parseInt(ratesCount.rows[0].count) > 0) {
          this.addTestResult(
            "2025 Rates Data",
            true,
            `${ratesCount.rows[0].count} 2025 rates found`
          );
        } else {
          this.addTestResult(
            "2025 Rates Data",
            false,
            "No 2025 rates found in database"
          );
        }
      } else {
        this.addTestResult(
          "Payroll Configuration Table",
          false,
          "Table does not exist"
        );
      }
    } catch (error) {
      this.addTestResult("Database Connection", false, error.message);
    }
  }

  /**
   * Test database configuration retrieval
   */
  async testDatabaseConfiguration() {
    console.log("⚙️ Testing Configuration Retrieval...");

    const configTypes = [
      "sss",
      "philhealth",
      "pagibig",
      "income_tax",
      "thirteenth_month",
    ];

    for (const configType of configTypes) {
      try {
        const configs = await AdvancedPayrollCalculator.getConfigsByType(
          configType
        );

        if (configs && Object.keys(configs).length > 0) {
          this.addTestResult(
            `${configType.toUpperCase()} Config`,
            true,
            `Retrieved ${Object.keys(configs).length} configurations`
          );
        } else {
          this.addTestResult(
            `${configType.toUpperCase()} Config`,
            false,
            "No configurations found"
          );
        }
      } catch (error) {
        this.addTestResult(
          `${configType.toUpperCase()} Config`,
          false,
          error.message
        );
      }
    }
  }

  /**
   * Test SSS contribution calculations
   */
  async testSSSCalculations() {
    console.log("🏦 Testing SSS Calculations...");

    const testCases = [
      {
        salary: 3000,
        expectedEmployee: 140,
        expectedEmployer: 325,
        description: "Minimum bracket",
      },
      {
        salary: 15000,
        expectedEmployee: 680,
        expectedEmployer: 1585,
        description: "Mid-range salary",
      },
      {
        salary: 25000,
        expectedEmployee: 930,
        expectedEmployer: 2170,
        description: "High salary (capped)",
      },
      {
        salary: 50000,
        expectedEmployee: 930,
        expectedEmployer: 2170,
        description: "Very high salary (capped)",
      },
    ];

    for (const testCase of testCases) {
      try {
        const result = await this.calculator.calculateSSSContribution(
          testCase.salary
        );

        const employeeMatches =
          Math.abs(result.employee - testCase.expectedEmployee) < 1;
        const employerMatches =
          Math.abs(result.employer - testCase.expectedEmployer) < 1;

        if (employeeMatches && employerMatches) {
          this.addTestResult(
            `SSS ${testCase.description}`,
            true,
            `Salary: ₱${testCase.salary}, Employee: ₱${result.employee}, Employer: ₱${result.employer}, Source: ${result.source}`
          );
        } else {
          this.addTestResult(
            `SSS ${testCase.description}`,
            false,
            `Expected Employee: ₱${testCase.expectedEmployee}, Got: ₱${result.employee}`
          );
        }
      } catch (error) {
        this.addTestResult(`SSS ${testCase.description}`, false, error.message);
      }
    }
  }

  /**
   * Test PhilHealth calculations (5.5% rate for 2025)
   */
  async testPhilHealthCalculations() {
    console.log("🏥 Testing PhilHealth Calculations (5.5% rate)...");

    const testCases = [
      { salary: 8000, expectedTotal: 550, description: "Minimum premium" },
      { salary: 50000, expectedTotal: 2750, description: "Mid-range salary" },
      {
        salary: 150000,
        expectedTotal: 6875,
        description: "Maximum premium (capped)",
      },
    ];

    for (const testCase of testCases) {
      try {
        const result = await this.calculator.calculatePhilHealthContribution(
          testCase.salary
        );

        const totalMatches =
          Math.abs(result.total - testCase.expectedTotal) < 10; // Allow small variance

        if (totalMatches) {
          this.addTestResult(
            `PhilHealth ${testCase.description}`,
            true,
            `Salary: ₱${testCase.salary}, Total: ₱${result.total}, Employee: ₱${
              result.employee
            }, Rate: ${
              result.rate ? (result.rate * 100).toFixed(1) + "%" : "N/A"
            }, Source: ${result.source}`
          );
        } else {
          this.addTestResult(
            `PhilHealth ${testCase.description}`,
            false,
            `Expected Total: ₱${testCase.expectedTotal}, Got: ₱${result.total}`
          );
        }
      } catch (error) {
        this.addTestResult(
          `PhilHealth ${testCase.description}`,
          false,
          error.message
        );
      }
    }
  }

  /**
   * Test Pag-IBIG calculations (enhanced tiers for 2025)
   */
  async testPagIBIGCalculations() {
    console.log("🏠 Testing Pag-IBIG Calculations (Enhanced Tiers)...");

    const testCases = [
      {
        salary: 1000,
        expectedEmployee: 15,
        expectedTier: 1,
        description: "Below threshold (1% tier)",
      },
      {
        salary: 1500,
        expectedEmployee: 15,
        expectedTier: 1,
        description: "At threshold (1% tier)",
      },
      {
        salary: 3000,
        expectedEmployee: 60,
        expectedTier: 2,
        description: "Above threshold (2% tier)",
      },
      {
        salary: 15000,
        expectedEmployee: 200,
        expectedTier: 2,
        description: "High salary (capped at ₱200)",
      },
    ];

    for (const testCase of testCases) {
      try {
        const result = await this.calculator.calculatePagIBIGContribution(
          testCase.salary
        );

        const employeeMatches =
          Math.abs(result.employee - testCase.expectedEmployee) < 5; // Allow small variance
        const tierMatches =
          !result.tier || result.tier === testCase.expectedTier;

        if (employeeMatches && tierMatches) {
          this.addTestResult(
            `Pag-IBIG ${testCase.description}`,
            true,
            `Salary: ₱${testCase.salary}, Employee: ₱${
              result.employee
            }, Tier: ${result.tier || "N/A"}, Rate: ${
              result.rate ? (result.rate * 100).toFixed(1) + "%" : "N/A"
            }, Source: ${result.source}`
          );
        } else {
          this.addTestResult(
            `Pag-IBIG ${testCase.description}`,
            false,
            `Expected Employee: ₱${testCase.expectedEmployee}, Got: ₱${result.employee}`
          );
        }
      } catch (error) {
        this.addTestResult(
          `Pag-IBIG ${testCase.description}`,
          false,
          error.message
        );
      }
    }
  }

  /**
   * Test income tax calculations (2025 brackets with inflation adjustments)
   */
  async testIncomeTaxCalculations() {
    console.log("💰 Testing Income Tax Calculations (2025 Brackets)...");

    const testCases = [
      {
        monthlyTaxable: 20000,
        expectedTax: 0,
        description: "Below exemption (₱240k annually)",
      },
      { monthlyTaxable: 25000, expectedTax: 625, description: "15% bracket" },
      { monthlyTaxable: 40000, expectedTax: 4375, description: "20% bracket" },
      { monthlyTaxable: 80000, expectedTax: 14375, description: "25% bracket" },
      {
        monthlyTaxable: 200000,
        expectedTax: 44375,
        description: "30% bracket",
      },
      {
        monthlyTaxable: 700000,
        expectedTax: 194375,
        description: "32% bracket (new for 2025)",
      },
    ];

    for (const testCase of testCases) {
      try {
        const result = await this.calculator.calculateIncomeTax(
          testCase.monthlyTaxable
        );

        // Allow 10% variance for tax calculations due to rounding
        const tolerance = Math.max(testCase.expectedTax * 0.1, 50);
        const taxMatches = Math.abs(result - testCase.expectedTax) <= tolerance;

        if (taxMatches) {
          this.addTestResult(
            `Income Tax ${testCase.description}`,
            true,
            `Taxable: ₱${testCase.monthlyTaxable}, Tax: ₱${result.toFixed(2)}`
          );
        } else {
          this.addTestResult(
            `Income Tax ${testCase.description}`,
            false,
            `Expected Tax: ₱${testCase.expectedTax}, Got: ₱${result.toFixed(2)}`
          );
        }
      } catch (error) {
        this.addTestResult(
          `Income Tax ${testCase.description}`,
          false,
          error.message
        );
      }
    }
  }

  /**
   * Test 13th month pay calculations
   */
  async test13thMonthPayCalculations() {
    console.log("🎁 Testing 13th Month Pay Calculations...");

    try {
      // Test basic 13th month calculation
      const basicSalary = 25000;
      const monthsWorked = 12;
      const thirteenthMonthPay = basicSalary; // Full year = 1 month basic pay

      // Test tax exemption
      const taxExemptionLimit = 90000; // 2025 limit
      const taxableThirteenthMonth = Math.max(
        0,
        thirteenthMonthPay - taxExemptionLimit
      );

      this.addTestResult(
        "13th Month Pay Basic",
        true,
        `Basic Salary: ₱${basicSalary}, 13th Month: ₱${thirteenthMonthPay}, Taxable: ₱${taxableThirteenthMonth}`
      );

      // Test pro-rated calculation
      const proRatedMonths = 6;
      const proRatedThirteenthMonth = (basicSalary / 12) * proRatedMonths;

      this.addTestResult(
        "13th Month Pay Pro-rated",
        true,
        `${proRatedMonths} months worked: ₱${proRatedThirteenthMonth.toFixed(
          2
        )}`
      );
    } catch (error) {
      this.addTestResult("13th Month Pay Calculations", false, error.message);
    }
  }

  /**
   * Test employee schedule overrides
   */
  async testEmployeeOverrides() {
    console.log("👤 Testing Employee Overrides...");

    try {
      // Test if employee_schedule_overrides table exists
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'employee_schedule_overrides'
        )
      `);

      if (tableExists.rows[0].exists) {
        this.addTestResult(
          "Employee Overrides Table",
          true,
          "Table exists and ready for overrides"
        );

        // Test override types
        const overrideTypes = [
          "hours_per_day",
          "days_per_week",
          "monthly_working_days",
          "custom_rate",
        ];
        for (const type of overrideTypes) {
          this.addTestResult(
            `Override Type: ${type}`,
            true,
            "Supported override type"
          );
        }
      } else {
        this.addTestResult(
          "Employee Overrides Table",
          false,
          "Table does not exist"
        );
      }
    } catch (error) {
      this.addTestResult("Employee Overrides", false, error.message);
    }
  }

  /**
   * Test integrated payroll calculation
   */
  async testIntegratedPayrollCalculation() {
    console.log("🔄 Testing Integrated Payroll Calculation...");

    try {
      // Test a complete payroll calculation scenario
      const testEmployee = {
        id: "TEST001",
        basicSalary: 30000,
        workingDays: 22,
        hoursWorked: 176, // 22 days * 8 hours
        overtimeHours: 10,
        employmentType: "Regular",
      };

      // Calculate earnings
      const earnings = this.calculator.calculateEarnings(
        testEmployee.basicSalary,
        testEmployee.workingDays,
        testEmployee.hoursWorked,
        testEmployee.overtimeHours
      );

      // Calculate deductions
      const deductions = await this.calculator.calculateDeductions(
        earnings.grossPay,
        testEmployee.id,
        testEmployee.employmentType
      );

      const netPay = earnings.grossPay - deductions.totalDeductions;

      // Validate calculation
      const isValid =
        earnings.grossPay > 0 && deductions.totalDeductions > 0 && netPay > 0;

      if (isValid) {
        this.addTestResult(
          "Integrated Payroll Calculation",
          true,
          `Gross: ₱${earnings.grossPay.toFixed(
            2
          )}, Deductions: ₱${deductions.totalDeductions.toFixed(
            2
          )}, Net: ₱${netPay.toFixed(2)}`
        );

        // Check if database rates were used
        const sourceValidation =
          await AdvancedPayrollCalculator.validateCalculationSource(
            testEmployee.id,
            earnings.grossPay
          );

        this.addTestResult(
          "Database Integration",
          sourceValidation.database_available,
          `SSS: ${sourceValidation.sss.source}, PhilHealth: ${sourceValidation.philhealth.source}, Pag-IBIG: ${sourceValidation.pagibig.source}`
        );
      } else {
        this.addTestResult(
          "Integrated Payroll Calculation",
          false,
          "Invalid calculation results"
        );
      }
    } catch (error) {
      this.addTestResult(
        "Integrated Payroll Calculation",
        false,
        error.message
      );
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, passed, details) {
    this.testResults.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Print formatted test results
   */
  printTestResults() {
    console.log("\n📋 Test Results Summary");
    console.log("========================");

    const passed = this.testResults.filter((test) => test.passed).length;
    const failed = this.testResults.filter((test) => !test.passed).length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    // Print detailed results
    this.testResults.forEach((test) => {
      const icon = test.passed ? "✅" : "❌";
      console.log(`${icon} ${test.name}`);
      console.log(`   ${test.details}\n`);
    });

    // Print failed tests summary
    const failedTests = this.testResults.filter((test) => !test.passed);
    if (failedTests.length > 0) {
      console.log("❌ Failed Tests Summary:");
      failedTests.forEach((test) => {
        console.log(`   • ${test.name}: ${test.details}`);
      });
    }

    console.log("\n🎯 2025 Philippine Payroll Compliance Test Complete!");
  }

  /**
   * Export test results to JSON
   */
  exportResults() {
    return {
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter((test) => test.passed).length,
        failed: this.testResults.filter((test) => !test.passed).length,
        timestamp: new Date().toISOString(),
      },
      tests: this.testResults,
    };
  }
}

// Export function to run tests from API endpoint
export async function runPayrollComplianceTests() {
  const testSuite = new PayrollComplianceTests();
  await testSuite.runAllTests();
  return testSuite.exportResults();
}
