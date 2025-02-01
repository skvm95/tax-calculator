const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

const app = express();
app.use(cors());

// Swagger definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Income Tax Calculator API",
    version: "1.0.0",
    description: "This API calculates the tax payable based on the income.",
  },
  servers: [
    {
      url: "http://localhost:5005", // Update to your deployment URL for production
    },
  ],
};

// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  apis: ["server.js"], // Path to the API docs
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Swagger UI setup
app.use("/api", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const taxSlabs = [
  { limit: 400000, rate: 0 },
  { limit: 800000, rate: 0.05 },
  { limit: 1200000, rate: 0.10 },
  { limit: 1600000, rate: 0.15 },
  { limit: 2000000, rate: 0.20 },
  { limit: 2400000, rate: 0.25 },
  { limit: Infinity, rate: 0.30 },
];

// Function to calculate tax
const calculateTax = (income) => {
  //console.log("--- CTC : ", income)
  let tax = 0;
  let previousLimit = 0;

  for (let slab of taxSlabs) {
    if (income > slab.limit) {
      tax += parseInt((slab.limit - previousLimit) * slab.rate);
      previousLimit = slab.limit;
      //console.log(`${slab.limit} has tax ${tax}`)
    } else {
      tax += parseInt((income - previousLimit) * slab.rate);
      //console.log(`Final ${slab.limit} has tax ${tax}`)
      break;
    }
  }
  return parseInt(tax);
};

// API endpoint using GET method and query params
app.get("/calculateTax", (req, res) => {
  const income = parseFloat(req.query.income);
  let basicIncome = parseFloat(req.query.basic);
  const mealCardOpted = req.query.mealCardOpted === "false" ? false : true;

  if (!income || isNaN(income) || income < 0) {
    return res.status(400).json({ error: "Invalid income amount" });
  }

  if (!basicIncome || isNaN(basicIncome) || basicIncome < 0) {
    basicIncome = parseInt((income * 0.37) / 12)
  }

  console.log("CTC : ", income)
  console.log("Basic Sal : ", basicIncome)

  const gratutity = parseInt(basicIncome / 26 * 15)
  console.log("gratutity : ", gratutity)

  const epfo = parseInt(1800 * 2 * 12)
  console.log("epfo : ", epfo)

  const professionalTax = 2500

  let finalIncome = parseInt(income - gratutity - epfo - professionalTax)

  finalIncome = mealCardOpted ? parseInt(finalIncome - 2200*12) : finalIncome
  console.log("finalIncome : ", finalIncome)

  const rawTaxPayable = calculateTax(finalIncome);
  console.log("rawTaxPayable : ", rawTaxPayable)

  const taxPayable = parseInt(rawTaxPayable * 1.04)
  console.log("taxPayable : ", taxPayable)

  let inhandSalary = parseInt(((finalIncome - taxPayable) / 13))
  console.log("inhandSal : ", inhandSalary)

  res.json({ income, taxPayable , inhandSalary })
});

app.get("/health", (req, res) => {
  const health = "ok"
  res.json({health})
})

// Start server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
