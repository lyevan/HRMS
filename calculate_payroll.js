const fs = require('fs');

const csv = fs.readFileSync('test-payroll.csv', 'utf8');
const lines = csv.split('\n').slice(1); // Skip header

let totalGrossPay = 0;
const hourlyRate = 86.88;

lines.forEach((line, index) => {
  if (!line.trim()) return;
  
  const columns = line.split(',');
  const payrollBreakdownStr = columns.slice(30).join(','); // payroll_breakdown is the last column
  
  try {
    const payrollBreakdown = JSON.parse(payrollBreakdownStr);
    let dailyPay = 0;
    
    // Calculate worked hours pay
    Object.keys(payrollBreakdown.worked_hours).forEach(key => {
      if (key !== 'total' && payrollBreakdown.worked_hours[key].value > 0) {
        const pay = hourlyRate * payrollBreakdown.worked_hours[key].value * payrollBreakdown.worked_hours[key].rate.total;
        dailyPay += pay;
        console.log(`  ${key}: ${payrollBreakdown.worked_hours[key].value}h * ${payrollBreakdown.worked_hours[key].rate.total} = ${pay.toFixed(2)}`);
      }
    });
    
    // Calculate overtime pay
    Object.keys(payrollBreakdown.overtime.computed).forEach(key => {
      if (key !== 'total' && payrollBreakdown.overtime.computed[key].value > 0) {
        const pay = hourlyRate * payrollBreakdown.overtime.computed[key].value * payrollBreakdown.overtime.computed[key].rate.total;
        dailyPay += pay;
        console.log(`  ${key}: ${payrollBreakdown.overtime.computed[key].value}h * ${payrollBreakdown.overtime.computed[key].rate.total} = ${pay.toFixed(2)}`);
      }
    });
    
    console.log(`Day ${index + 1} (${columns[2]}): ${dailyPay.toFixed(2)}\n`);
    totalGrossPay += dailyPay;
  } catch (e) {
    console.log(`Error parsing day ${index + 1}: ${e.message}`);
  }
});

console.log(`Total Gross Pay: ${totalGrossPay.toFixed(2)}`);
