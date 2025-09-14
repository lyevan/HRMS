#!/bin/bash

# Backend dependencies for bulk upload functionality
cd backend
npm install exceljs multer csv-parser papaparse @types/multer

# Frontend dependencies
cd ../frontend
npm install papaparse @types/papaparse

echo "Bulk upload dependencies installed successfully!"