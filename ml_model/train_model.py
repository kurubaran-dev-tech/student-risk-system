"""
Student Performance Risk Classification - Model Training Script
Generates synthetic dataset, preprocesses, trains multiple models, evaluates and saves best model.
"""

import numpy as np
import pandas as pd
import json
import os
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    precision_score, recall_score, f1_score
)
import warnings
warnings.filterwarnings('ignore')

# ─── 1. GENERATE SYNTHETIC DATASET ───────────────────────────────────────────
np.random.seed(42)
N = 1000

def generate_student_data(n):
    records = []
    for _ in range(n):
        # Study time: 1-10 hours/week
        study_time = np.random.randint(1, 11)
        # Absences: 0-20
        absences = np.random.randint(0, 21)
        # Health index: 1-5
        health_index = np.random.randint(1, 6)
        # Cumulative failures: 0-3
        cum_failures = np.random.choice([0, 1, 2, 3], p=[0.55, 0.25, 0.13, 0.07])
        # Assignment score: 0-100
        assignment_base = 40 + study_time * 4 - absences * 1.5 + health_index * 2 - cum_failures * 8
        assignment = np.clip(assignment_base + np.random.normal(0, 8), 0, 100)
        # Carry marks (0-100): weighted by study, absences, prior failures
        carry_base = 45 + study_time * 3.5 - absences * 1.8 + health_index * 1.5 - cum_failures * 10
        carry_marks = np.clip(carry_base + np.random.normal(0, 9), 0, 100)

        # Compute risk label based on carry marks + modifiers
        score = (carry_marks * 0.5 + assignment * 0.3
                 - absences * 1.2 - cum_failures * 7
                 + study_time * 1.5 + health_index * 0.8)
        
        if score >= 60:
            risk = 0  # Low Risk
        elif score >= 40:
            risk = 1  # Medium Risk
        else:
            risk = 2  # High Risk

        records.append({
            'carry_marks': round(carry_marks, 2),
            'assignment_score': round(assignment, 2),
            'absences': absences,
            'study_time': study_time,
            'health_index': health_index,
            'cumulative_failures': cum_failures,
            'risk_level': risk
        })
    return pd.DataFrame(records)

df = generate_student_data(N)
print(f"Dataset shape: {df.shape}")
print(f"Class distribution:\n{df['risk_level'].value_counts().sort_index()}")

# Save dataset
os.makedirs('../dataset', exist_ok=True)
df.to_csv('../dataset/student_performance.csv', index=False)
print("Dataset saved to ../dataset/student_performance.csv")

# ─── 2. PREPROCESSING ─────────────────────────────────────────────────────────
X = df.drop('risk_level', axis=1)
y = df['risk_level']

FEATURES = list(X.columns)

# Train-test split 80/20
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"\nTrain size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

# ─── 3. MODEL TRAINING ────────────────────────────────────────────────────────
results = {}

## 3a. Baseline: Logistic Regression
lr = LogisticRegression(max_iter=1000, random_state=42)
lr.fit(X_train_scaled, y_train)
y_pred_lr = lr.predict(X_test_scaled)
results['Logistic Regression (Baseline)'] = {
    'model': lr,
    'y_pred': y_pred_lr,
    'accuracy': accuracy_score(y_test, y_pred_lr),
    'f1_macro': f1_score(y_test, y_pred_lr, average='macro'),
    'scaled': True
}

## 3b. Random Forest
rf_params = {'n_estimators': [100, 200], 'max_depth': [None, 10, 20], 'min_samples_split': [2, 5]}
rf_gs = GridSearchCV(RandomForestClassifier(random_state=42), rf_params, cv=5, scoring='f1_macro', n_jobs=-1)
rf_gs.fit(X_train, y_train)
best_rf = rf_gs.best_estimator_
y_pred_rf = best_rf.predict(X_test)
results['Random Forest'] = {
    'model': best_rf,
    'y_pred': y_pred_rf,
    'accuracy': accuracy_score(y_test, y_pred_rf),
    'f1_macro': f1_score(y_test, y_pred_rf, average='macro'),
    'scaled': False,
    'best_params': rf_gs.best_params_
}
print(f"\nRandom Forest best params: {rf_gs.best_params_}")

## 3c. Gradient Boosting
gb = GradientBoostingClassifier(n_estimators=200, learning_rate=0.1, max_depth=4, random_state=42)
gb.fit(X_train, y_train)
y_pred_gb = gb.predict(X_test)
results['Gradient Boosting'] = {
    'model': gb,
    'y_pred': y_pred_gb,
    'accuracy': accuracy_score(y_test, y_pred_gb),
    'f1_macro': f1_score(y_test, y_pred_gb, average='macro'),
    'scaled': False
}

## 3d. SVM
svm = SVC(kernel='rbf', C=10, gamma='scale', probability=True, random_state=42)
svm.fit(X_train_scaled, y_train)
y_pred_svm = svm.predict(X_test_scaled)
results['SVM (RBF)'] = {
    'model': svm,
    'y_pred': y_pred_svm,
    'accuracy': accuracy_score(y_test, y_pred_svm),
    'f1_macro': f1_score(y_test, y_pred_svm, average='macro'),
    'scaled': True
}

# ─── 4. EVALUATION ────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("MODEL EVALUATION RESULTS")
print("="*60)

eval_data = {}
for name, res in results.items():
    y_pred = res['y_pred']
    acc = res['accuracy']
    f1_mac = res['f1_macro']
    f1_mic = f1_score(y_test, y_pred, average='micro')
    prec = precision_score(y_test, y_pred, average='macro')
    rec = recall_score(y_test, y_pred, average='macro')
    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred,
                                    target_names=['Low Risk', 'Medium Risk', 'High Risk'],
                                    output_dict=True)

    print(f"\n--- {name} ---")
    print(f"  Accuracy:       {acc:.4f}")
    print(f"  F1 (Macro):     {f1_mac:.4f}")
    print(f"  F1 (Micro):     {f1_mic:.4f}")
    print(f"  Precision:      {prec:.4f}")
    print(f"  Recall:         {rec:.4f}")
    print(f"  Confusion Matrix:\n{confusion_matrix(y_test, y_pred)}")

    eval_data[name] = {
        'accuracy': round(acc, 4),
        'f1_macro': round(f1_mac, 4),
        'f1_micro': round(f1_mic, 4),
        'precision_macro': round(prec, 4),
        'recall_macro': round(rec, 4),
        'confusion_matrix': cm,
        'classification_report': report
    }

# ─── 5. SELECT & SAVE BEST MODEL ──────────────────────────────────────────────
best_name = max(results, key=lambda k: results[k]['f1_macro'])
best = results[best_name]
print(f"\n✅ Best Model: {best_name} (F1 Macro: {best['f1_macro']:.4f})")

# Save artifacts
os.makedirs('../backend/model', exist_ok=True)
joblib.dump(best['model'], '../backend/model/best_model.pkl')
joblib.dump(scaler, '../backend/model/scaler.pkl')

# Save metadata
meta = {
    'best_model_name': best_name,
    'features': FEATURES,
    'class_labels': {0: 'Low Risk', 1: 'Medium Risk', 2: 'High Risk'},
    'scaled': best['scaled'],
    'best_accuracy': best['accuracy'],
    'best_f1_macro': best['f1_macro'],
    'evaluation': eval_data
}
with open('../backend/model/model_meta.json', 'w') as f:
    json.dump(meta, f, indent=2)

print("Models saved to ../backend/model/")
print("\n✅ Training complete!")
