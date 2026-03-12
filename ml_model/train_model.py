"""
Student Performance Risk Classification - Model Training Script
Generates synthetic dataset, preprocesses, trains multiple models,
evaluates with cross-validation and saves best model.
"""

import numpy as np
import pandas as pd
import json
import os
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler
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
        study_time = np.random.randint(1, 11)
        absences = np.random.randint(0, 21)
        health_index = np.random.randint(1, 6)
        cum_failures = np.random.choice([0, 1, 2, 3], p=[0.55, 0.25, 0.13, 0.07])
        assignment_base = 40 + study_time * 4 - absences * 1.5 + health_index * 2 - cum_failures * 8
        assignment = np.clip(assignment_base + np.random.normal(0, 8), 0, 100)
        carry_base = 45 + study_time * 3.5 - absences * 1.8 + health_index * 1.5 - cum_failures * 10
        carry_marks = np.clip(carry_base + np.random.normal(0, 9), 0, 100)
        score = (carry_marks * 0.5 + assignment * 0.3
                 - absences * 1.2 - cum_failures * 7
                 + study_time * 1.5 + health_index * 0.8)
        if score >= 60:
            risk = 0
        elif score >= 40:
            risk = 1
        else:
            risk = 2
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

os.makedirs('../dataset', exist_ok=True)
df.to_csv('../dataset/student_performance.csv', index=False)
print("Dataset saved.")

# ─── 2. PREPROCESSING ────────────────────────────────────────────────────────
X = df.drop('risk_level', axis=1)
y = df['risk_level']
FEATURES = list(X.columns)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"Train: {X_train.shape[0]}, Test: {X_test.shape[0]}")

# ─── 3. MODEL TRAINING ───────────────────────────────────────────────────────
results = {}

# Logistic Regression (Baseline)
lr = LogisticRegression(max_iter=1000, random_state=42)
lr.fit(X_train_scaled, y_train)
y_pred_lr = lr.predict(X_test_scaled)
cv_lr = cross_val_score(lr, X_train_scaled, y_train, cv=5, scoring='f1_macro')
results['Logistic Regression (Baseline)'] = {
    'model': lr, 'y_pred': y_pred_lr,
    'accuracy': accuracy_score(y_test, y_pred_lr),
    'f1_macro': f1_score(y_test, y_pred_lr, average='macro'),
    'cv_scores': cv_lr.tolist(), 'scaled': True
}

# Random Forest
rf_params = {'n_estimators': [100, 200], 'max_depth': [None, 10, 20], 'min_samples_split': [2, 5]}
rf_gs = GridSearchCV(RandomForestClassifier(random_state=42), rf_params, cv=5, scoring='f1_macro', n_jobs=-1)
rf_gs.fit(X_train, y_train)
best_rf = rf_gs.best_estimator_
y_pred_rf = best_rf.predict(X_test)
cv_rf = cross_val_score(best_rf, X_train, y_train, cv=5, scoring='f1_macro')
results['Random Forest'] = {
    'model': best_rf, 'y_pred': y_pred_rf,
    'accuracy': accuracy_score(y_test, y_pred_rf),
    'f1_macro': f1_score(y_test, y_pred_rf, average='macro'),
    'cv_scores': cv_rf.tolist(), 'scaled': False,
    'best_params': rf_gs.best_params_
}

# Gradient Boosting
gb = GradientBoostingClassifier(n_estimators=200, learning_rate=0.1, max_depth=4, random_state=42)
gb.fit(X_train, y_train)
y_pred_gb = gb.predict(X_test)
cv_gb = cross_val_score(gb, X_train, y_train, cv=5, scoring='f1_macro')
results['Gradient Boosting'] = {
    'model': gb, 'y_pred': y_pred_gb,
    'accuracy': accuracy_score(y_test, y_pred_gb),
    'f1_macro': f1_score(y_test, y_pred_gb, average='macro'),
    'cv_scores': cv_gb.tolist(), 'scaled': False
}

# SVM
svm = SVC(kernel='rbf', C=10, gamma='scale', probability=True, random_state=42)
svm.fit(X_train_scaled, y_train)
y_pred_svm = svm.predict(X_test_scaled)
cv_svm = cross_val_score(svm, X_train_scaled, y_train, cv=5, scoring='f1_macro')
results['SVM (RBF)'] = {
    'model': svm, 'y_pred': y_pred_svm,
    'accuracy': accuracy_score(y_test, y_pred_svm),
    'f1_macro': f1_score(y_test, y_pred_svm, average='macro'),
    'cv_scores': cv_svm.tolist(), 'scaled': True
}

# ─── 4. EVALUATION ───────────────────────────────────────────────────────────
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
    cv = res['cv_scores']
    print(f"\n--- {name} ---")
    print(f"  Accuracy: {acc:.4f} | F1 Macro: {f1_mac:.4f}")
    print(f"  CV F1 Macro: {np.mean(cv):.4f} (+/- {np.std(cv):.4f})")
    print(f"  Confusion Matrix:\n{confusion_matrix(y_test, y_pred)}")

    eval_data[name] = {
        'accuracy': round(acc, 4),
        'f1_macro': round(f1_mac, 4),
        'f1_micro': round(f1_mic, 4),
        'precision_macro': round(prec, 4),
        'recall_macro': round(rec, 4),
        'confusion_matrix': cm,
        'classification_report': report,
        'cv_scores': [round(s, 4) for s in cv],
        'cv_mean': round(float(np.mean(cv)), 4),
        'cv_std': round(float(np.std(cv)), 4)
    }

# ─── 5. SELECT & SAVE BEST MODEL ─────────────────────────────────────────────
best_name = max(results, key=lambda k: results[k]['f1_macro'])
best = results[best_name]
print(f"\n✅ Best Model: {best_name} (F1 Macro: {best['f1_macro']:.4f})")

os.makedirs('../backend/model', exist_ok=True)
joblib.dump(best['model'], '../backend/model/best_model.pkl')
joblib.dump(scaler, '../backend/model/scaler.pkl')

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

print("✅ Training complete! Models saved.")