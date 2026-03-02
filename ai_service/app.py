#!/usr/bin/env python3
"""
AI Service for Pharmacy Management System
Provides stock prediction, expiry prediction, and anomaly detection
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple in-memory storage for demo purposes
# In production, this would connect to a proper ML model storage
models = {
    'stock_prediction': {
        'version': '1.0.0',
        'accuracy': 0.85,
        'last_trained': datetime.now().isoformat()
    },
    'expiry_prediction': {
        'version': '1.0.0',
        'accuracy': 0.92,
        'last_trained': datetime.now().isoformat()
    },
    'anomaly_detection': {
        'version': '1.0.0',
        'accuracy': 0.88,
        'last_trained': datetime.now().isoformat()
    }
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'models': len(models)
    })

@app.route('/predict/stock', methods=['POST'])
def predict_stock():
    """Stock prediction endpoint"""
    try:
        data = request.json.get('data', {})
        
        # Extract features
        medicine_id = data.get('medicine_id')
        avg_daily_sales = data.get('avg_daily_sales', 0)
        sales_trend = data.get('sales_trend', 0)
        seasonal_factor = data.get('seasonal_factor', 1)
        current_stock = data.get('current_stock', 0)
        days_ahead = data.get('days_ahead', 30)
        
        # Simple prediction algorithm (in production, use trained ML model)
        base_demand = avg_daily_sales * days_ahead
        trend_adjustment = base_demand * sales_trend * 0.1
        seasonal_adjustment = base_demand * (seasonal_factor - 1) * 0.2
        
        predicted_demand = max(0, base_demand + trend_adjustment + seasonal_adjustment)
        
        # Add some randomness for demo
        noise = np.random.normal(0, predicted_demand * 0.1)
        predicted_demand = max(0, predicted_demand + noise)
        
        # Calculate confidence based on data quality
        confidence = min(0.95, 0.5 + (avg_daily_sales / 10) * 0.1)
        
        # Generate daily breakdown
        daily_breakdown = []
        for i in range(min(days_ahead, 7)):  # Show first 7 days
            daily_pred = predicted_demand / days_ahead
            daily_breakdown.append({
                'date': (datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d'),
                'predicted_quantity': round(daily_pred, 2)
            })
        
        result = {
            'demand': round(predicted_demand, 2),
            'confidence': round(confidence, 4),
            'daily_breakdown': daily_breakdown,
            'influencing_factors': [
                f'Average daily sales: {avg_daily_sales}',
                f'Sales trend: {sales_trend:+.2%}',
                f'Seasonal factor: {seasonal_factor:.2f}',
                f'Current stock: {current_stock}'
            ],
            'model_version': models['stock_prediction']['version']
        }
        
        logger.info(f"Stock prediction for medicine {medicine_id}: {predicted_demand}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Stock prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict/expiry', methods=['POST'])
def predict_expiry():
    """Expiry prediction endpoint"""
    try:
        data = request.json.get('data', {})
        
        medicine_id = data.get('medicine_id')
        days_to_expiry = data.get('days_to_expiry', 365)
        current_stock = data.get('current_stock', 0)
        avg_daily_sales = data.get('avg_daily_sales', 0)
        
        # Simple expiry risk calculation
        if avg_daily_sales > 0:
            days_to_sell_out = current_stock / avg_daily_sales
            risk_score = max(0, min(1, 1 - (days_to_sell_out / days_to_expiry)))
        else:
            risk_score = 0.8 if days_to_expiry < 90 else 0.3
        
        # Generate recommendations
        recommendations = []
        if risk_score > 0.7:
            recommendations.append("Consider promotional pricing")
            recommendations.append("Contact regular customers")
        elif risk_score > 0.5:
            recommendations.append("Monitor closely")
            recommendations.append("Consider bundling with popular items")
        
        result = {
            'risk_score': round(risk_score, 4),
            'days_to_expiry': days_to_expiry,
            'estimated_sellout_days': round(current_stock / max(avg_daily_sales, 0.1), 1),
            'recommendations': recommendations,
            'model_version': models['expiry_prediction']['version']
        }
        
        logger.info(f"Expiry prediction for medicine {medicine_id}: risk {risk_score}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Expiry prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/detect/anomaly', methods=['POST'])
def detect_anomaly():
    """Anomaly detection endpoint"""
    try:
        data = request.json.get('data', {})
        
        transaction_type = data.get('transaction_type', 'sale')
        amount = data.get('amount', 0)
        quantity = data.get('quantity', 0)
        customer_history = data.get('customer_history', [])
        
        # Simple anomaly detection rules
        anomalies = []
        risk_score = 0
        
        # Check for unusual quantities
        if quantity > 100:
            anomalies.append("Unusually large quantity")
            risk_score += 0.3
        
        # Check for unusual amounts
        if amount > 10000:
            anomalies.append("Unusually high transaction amount")
            risk_score += 0.4
        
        # Check customer history
        if len(customer_history) == 0 and amount > 1000:
            anomalies.append("New customer with high-value transaction")
            risk_score += 0.3
        
        # Random factor for demo
        if np.random.random() < 0.1:  # 10% chance of flagging
            anomalies.append("Statistical anomaly detected")
            risk_score += 0.2
        
        risk_score = min(1.0, risk_score)
        
        result = {
            'risk_score': round(risk_score, 4),
            'anomalies_detected': anomalies,
            'requires_review': risk_score > 0.6,
            'model_version': models['anomaly_detection']['version']
        }
        
        logger.info(f"Anomaly detection: risk {risk_score}, anomalies: {len(anomalies)}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Anomaly detection error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/train/<model_type>', methods=['POST'])
def train_model(model_type):
    """Model training endpoint (mock implementation)"""
    try:
        if model_type not in models:
            return jsonify({'error': 'Unknown model type'}), 400
        
        # Mock training process
        models[model_type]['last_trained'] = datetime.now().isoformat()
        models[model_type]['accuracy'] = min(0.99, models[model_type]['accuracy'] + 0.01)
        
        logger.info(f"Model {model_type} training completed")
        return jsonify({
            'success': True,
            'model_type': model_type,
            'new_accuracy': models[model_type]['accuracy'],
            'trained_at': models[model_type]['last_trained']
        })
        
    except Exception as e:
        logger.error(f"Model training error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/evaluate/<model_type>', methods=['GET'])
def evaluate_model(model_type):
    """Model evaluation endpoint"""
    try:
        if model_type not in models:
            return jsonify({'error': 'Unknown model type'}), 400
        
        model_info = models[model_type]
        
        # Mock evaluation metrics
        result = {
            'model_type': model_type,
            'accuracy': model_info['accuracy'],
            'precision': model_info['accuracy'] * 0.95,
            'recall': model_info['accuracy'] * 0.98,
            'f1_score': model_info['accuracy'] * 0.96,
            'last_trained': model_info['last_trained'],
            'version': model_info['version']
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Model evaluation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/models', methods=['GET'])
def list_models():
    """List all available models"""
    return jsonify({
        'models': models,
        'total_models': len(models)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting AI service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)