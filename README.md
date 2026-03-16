# 🎓 Student Performance Risk Classification System
**End-to-End Predictive System | Multi-class Classification | B25030045**

---

## 📁 Project Structure
```
student_risk_system/
├── backend/
│   ├── app.py              ← Flask REST API (all endpoints + RBAC)
│   └── model/              ← Trained model artifacts (auto-generated)
│       ├── best_model.pkl
│       ├── scaler.pkl
│       └── model_meta.json
├── dataset/
│   └── student_performance.csv   ← Generated training data (1000 records)
├── frontend/
│   └── index.html          ← Full Vue.js SPA (single file)
├── ml_model/
│   └── train_model.py      ← Model training script
└── README.md
```

---

## ⚡ Quick Start

### Step 1 – Train the Model (if not already done)
```bash
cd ml_model
python3 train_model.py
```

### Step 2 – Start the Backend
```bash
cd backend
python3 app.py
```

### Step 3 – Open the Frontend
Open `frontend/index.html` directly in any browser.

> ⚠️ The frontend connects to `http://localhost:5000/api`  
> Make sure the backend is running before opening the frontend.

---

## 🔐 Default Login Credentials

| Username   | Password   | Role  |
|------------|------------|-------|
| admin      | admin123   | Admin |
| lecturer1  | user123    | User  |
| advisor1   | user123    | User  |

---

## 🏗️ System Architecture

```
Vue.js Frontend  ←→  Flask REST API  ←→  Scikit-Learn Model
  (index.html)         (app.py)          (best_model.pkl)
```

- **Frontend**: Single HTML file with Vue.js 3, Chart.js
- **Backend**: Flask with in-memory RBAC, prediction logging, user management
- **ML**: Logistic Regression (baseline), Random Forest, Gradient Boosting, SVM

---

## 📊 Model Performance

| Model               | Accuracy | F1 Macro |
|---------------------|----------|----------|
| Logistic Regression | 99.50%   | 99.49%   |
| SVM (RBF)           | 97.50%   | 96.92%   |
| Random Forest       | 93.50%   | 90.31%   |
| Gradient Boosting   | 92.50%   | 88.29%   |

**Best Model: Logistic Regression** (selected automatically)

---

## 🔮 Input Features

| Feature             | Range   | Description                              |
|---------------------|---------|------------------------------------------|
| Carry Marks         | 0–100   | Mid-term + quiz + assignment total marks |
| Assignment Score    | 0–100   | Average individual assignment score      |
| Absences            | 0–20    | Number of class absences                 |
| Study Time          | 1–10    | Average study hours per week             |
| Health Index        | 1–5     | Self-reported health (1=Poor, 5=Excellent)|
| Cumulative Failures | 0–3     | Number of previously failed courses      |

---

## 🎯 Output Classes

| Class | Label       | Meaning                                     |
|-------|-------------|---------------------------------------------|
| 0     | Low Risk    | Performing well; Grade B or above expected  |
| 1     | Medium Risk | Passing but needs monitoring                |
| 2     | High Risk   | At risk of failure; immediate intervention  |

---

## 🛡️ Role-Based Access Control

### Admin
- View all prediction history (all users)
- Manage users (create / edit / deactivate)
- View dataset records and statistics
- View model evaluation metrics and confusion matrix
- View system-wide stats

### User (Lecturer / Advisor)
- Submit student data for prediction
- View own prediction history
- View probability breakdown and intervention advice
