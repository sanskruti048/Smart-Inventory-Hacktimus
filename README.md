# Smart Inventory Prediction & Replenishment System

A comprehensive inventory management solution that predicts stock depletion and recommends replenishment orders using AI-driven insights. The system integrates a **Boltic AI workflow** for intelligent predictions with a **React dashboard** for real-time inventory monitoring.

---

## 🎯 Overview

Smart Inventory is an end-to-end system designed to:
- ✅ Predict when inventory will run out using AI analysis
- ✅ Recommend optimal reorder quantities
- ✅ Monitor multiple stores and SKU categories in real-time
- ✅ Alert managers to critical stock situations
- ✅ Enable data-driven replenishment decisions

---

## 🏗️ Architecture

The system consists of three integrated components:

```
┌─────────────────┐
│   BOLTIC        │
│   Workflow      │
│   (AI Engine)   │
└────────┬────────┘
         │ POST /ingest
         │ (JSON predictions)
         ▼
┌─────────────────────────────────┐
│   BACKEND API (FastAPI)         │
│   REST API for data ingestion   │
│   & real-time prediction serve  │
└────────┬────────────────────────┘
         │ GET /latest
         │ (Live data)
         ▼
┌─────────────────────────────────┐
│   FRONTEND DASHBOARD (React)    │
│   Real-time inventory analytics │
└─────────────────────────────────┘
```

---

## 📊 Tech Stack

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.x
- **Server**: Uvicorn (ASGI)
- **API Type**: REST with JSON
- **CORS**: Enabled for multi-origin requests
- **Deployment**: Render

### Frontend
- **Framework**: React 19
- **Build Tool**: Create React App
- **Testing**: Jest + React Testing Library
- **Dependencies**: react-scripts, web-vitals
- **Features**: Dark mode, CSV export, advanced filtering

### AI/ML Integration
- **Boltic Workflow**: No-code AI engine for inventory predictions
- **Integration**: Webhook-based (POST to `/ingest` endpoint)
- **Data Format**: Standardized JSON predictions

---

## 🚀 Getting Started

### Prerequisites
- Python 3.7+ (for backend)
- Node.js 14+ (for frontend)
- Git

### Backend Setup

```bash
cd inventory-backend
pip install -r requirements.txt
python main.py
```

The backend will start on `http://localhost:8000`

**Available Endpoints**:
- `GET /health` - API health check
- `GET /docs` - Swagger UI documentation
- `POST /ingest` - Receive predictions from Boltic
- `GET /latest` - Fetch latest predictions
- `POST /predict-bulk` - Manual batch predictions

### Frontend Setup

```bash
cd inventory-dashboard
npm install
npm start
```

The frontend will open on `http://localhost:3000`

**Features**:
- Real-time inventory table with filtering & sorting
- Critical stock alerts
- Store-wise and category-wise analytics
- CSV export functionality
- Dark mode support

---

## 🔄 System Integration

### Boltic Workflow Integration

The **Boltic workflow** serves as the AI engine that:
1. Analyzes historical sales data
2. Calculates average daily sales per SKU
3. Predicts days until stockout
4. Recommends reorder quantities
5. Sends results to backend via webhook

**Boltic sends data to**: `POST /ingest`

**Expected Payload Format**:
```json
{
  "predictions": [
    {
      "sku_id": "TSHIRT_RED_M",
      "store_id": "STORE_MUMBAI",
      "current_stock": 45,
      "avg_daily_sales": 1.5,
      "days_to_stockout": 30,
      "status": "Safe",
      "recommended_reorder_quantity": 20,
      "category": "T-Shirts",
      "city": "Mumbai"
    }
  ]
}
```

### Data Flow

1. **Boltic** (AI Engine) → Analyzes inventory + sales data
2. **POST /ingest** → Backend receives predictions
3. **Backend** (FastAPI) → Stores data in memory
4. **GET /latest** → Frontend fetches live data
5. **React Dashboard** → Displays real-time insights to users

---

## 📋 Key Features

### Dashboard Features
- **Inventory Table**: View all SKUs with current stock levels
- **Status Indicators**: Safe, Warning, Critical stock levels
- **Filtering**: By store, category, and SKU
- **Sorting**: By any column for easy analysis
- **Summary Cards**: Count of critical, warning, and safe items
- **Top 5 Critical**: Highlight items at risk of stockout
- **Charts**: Visual representation of inventory by store
- **CSV Export**: Download data for external analysis
- **Refresh Data**: Manual refresh or auto-sync with backend

### Backend Features
- **CORS Support**: Multiple origin requests
- **Automatic Status Calculation**: Assigns status based on days to stockout
- **In-Memory Storage**: Fast data retrieval
- **Validation**: Input validation via Pydantic
- **Auto Documentation**: Swagger UI at `/docs`

---

## 🔗 Connections & Dependencies

| Component | Status | Details |
|-----------|--------|---------|
| **Boltic → Backend** | ✅ Connected | Webhook to `/ingest` endpoint |
| **Backend → Frontend** | ✅ Connected | REST API via `/latest` endpoint |
| **Frontend Features** | ✅ All Working | Dashboard fully functional |

---

## 📁 Project Structure

```
Smart Inventory/
├── inventory-backend/           # FastAPI backend
│   ├── main.py                 # Main API application
│   ├── requirements.txt         # Python dependencies
│   └── inventory_data.csv       # Sample data
├── inventory-dashboard/         # React frontend
│   ├── src/
│   │   ├── App.js              # Main React component
│   │   ├── InventoryHealthPage.jsx
│   │   └── InventoryHealthPageEnhanced.jsx
│   ├── public/
│   ├── package.json            # Dependencies & scripts
│   └── README.md
├── ARCHITECTURE_AND_CONNECTIONS.md  # Detailed tech docs
├── requirements.txt             # Root dependencies
├── Procfile                     # Deployment config
├── render.yaml                  # Render deployment config
└── build.sh                     # Build script
```

---

## 🧪 Testing the Integration

### 1. Test Backend Health
```bash
curl https://smart-inventory-4ubc.onrender.com/health
```

### 2. Send Test Data (Simulate Boltic)
```bash
curl -X POST https://smart-inventory-4ubc.onrender.com/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "predictions": [{
      "sku_id": "TEST001",
      "store_id": "STORE1",
      "current_stock": 25,
      "avg_daily_sales": 1.0,
      "days_to_stockout": 25,
      "status": "Warning",
      "recommended_reorder_quantity": 15,
      "category": "Test",
      "city": "Mumbai"
    }]
  }'
```

### 3. Fetch Predictions
```bash
curl https://smart-inventory-4ubc.onrender.com/latest
```

---

## 🚢 Deployment

### Live URLs
- **Backend**: https://smart-inventory-4ubc.onrender.com
- **Frontend**: [Render deployment URL]

### Deployment Steps
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables
4. Deploy backend and frontend services
5. Configure Boltic webhook to point to `/ingest` endpoint

---

## 🛠️ Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API base URL (for frontend)
- `PORT`: Server port (default: 8000 for backend, 3000 for frontend)

---

## 📚 Documentation

- [Architecture & Connections](ARCHITECTURE_AND_CONNECTIONS.md) - Detailed integration guide
- [Inventory Data](inventory-backend/inventory_data.csv) - Sample data format

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally (both backend and frontend)
4. Submit a pull request

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For issues, questions, or suggestions:
- Check the [Architecture & Connections](ARCHITECTURE_AND_CONNECTIONS.md) guide
- Review backend documentation at `/docs` endpoint
- Check React component console for frontend errors

---

## 👩‍💻 Author

**Sanskruti Sugandhi**
*AI & Data Science Engineer*

---

## 📫 **Connect:**

- **GitHub:** [sanskruti048](https://github.com/sanskruti048)
- **LinkedIn:** [Sanskruti Sugandhi](https://www.linkedin.com/in/sanskruti-sugandhi/)
- **Blog:** [dev.to/sanskruti_sugandhi](https://dev.to/sanskruti_sugandhi)
