# AI Service for Pharmacy Management System

This is a Python-based AI service that provides machine learning capabilities for the pharmacy management system.

## Features

- **Stock Prediction**: Forecasts medicine demand based on historical sales data
- **Expiry Prediction**: Predicts which medicines are likely to expire before being sold
- **Anomaly Detection**: Identifies suspicious transactions and patterns

## Setup

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Installation

1. Navigate to the ai_service directory:
```bash
cd ai_service
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

### Configuration

Create a `.env` file in the ai_service directory:

```env
PORT=5000
DEBUG=True
FLASK_ENV=development
```

### Running the Service

```bash
python app.py
```

The service will start on `http://localhost:5000`

## API Endpoints

### Health Check
- **GET** `/health` - Check service status

### Stock Prediction
- **POST** `/predict/stock` - Predict medicine demand
- **POST** `/train/stock_prediction` - Retrain stock prediction model
- **GET** `/evaluate/stock_prediction` - Get model performance metrics

### Expiry Prediction
- **POST** `/predict/expiry` - Predict expiry risk
- **POST** `/train/expiry_prediction` - Retrain expiry prediction model
- **GET** `/evaluate/expiry_prediction` - Get model performance metrics

### Anomaly Detection
- **POST** `/detect/anomaly` - Detect transaction anomalies
- **POST** `/train/anomaly_detection` - Retrain anomaly detection model
- **GET** `/evaluate/anomaly_detection` - Get model performance metrics

### Model Management
- **GET** `/models` - List all available models

## Example Usage

### Stock Prediction Request
```json
POST /predict/stock
{
  "data": {
    "medicine_id": 1,
    "avg_daily_sales": 5.2,
    "sales_trend": 0.1,
    "seasonal_factor": 1.2,
    "current_stock": 100,
    "days_ahead": 30
  }
}
```

### Expiry Prediction Request
```json
POST /predict/expiry
{
  "data": {
    "medicine_id": 1,
    "days_to_expiry": 45,
    "current_stock": 50,
    "avg_daily_sales": 2.1
  }
}
```

### Anomaly Detection Request
```json
POST /detect/anomaly
{
  "data": {
    "transaction_type": "sale",
    "amount": 1500,
    "quantity": 25,
    "customer_history": []
  }
}
```

## Development Notes

This is a simplified implementation for demonstration purposes. In a production environment, you would:

1. Use proper ML frameworks like TensorFlow or PyTorch
2. Implement real model training with historical data
3. Add proper data validation and error handling
4. Use a proper database for model storage
5. Implement authentication and authorization
6. Add comprehensive logging and monitoring
7. Use containerization (Docker) for deployment

## Integration with Laravel

The Laravel application communicates with this AI service through HTTP requests. Make sure to:

1. Update the `AI_API_ENDPOINT` in your Laravel `.env` file to point to this service
2. Ensure the service is running when testing AI features
3. Handle network errors gracefully in the Laravel application

## Scaling Considerations

For production deployment:

- Use a proper WSGI server like Gunicorn
- Implement load balancing for multiple instances
- Use Redis or similar for caching predictions
- Implement proper model versioning and A/B testing
- Add comprehensive monitoring and alerting