"""
Student Performance Risk Classification - Model Training Script
Uses realistic academic features available to lecturers/advisors.
Trains multiple models, evaluates with cross-validation, saves best.
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
    """
    Generate synthetic student records using realistic academic features
    that lecturers/advisors can actually access from university systems.
    """
    records = []
    for _ in range(n):
        # ── Features from university systems ──
        attendance_rate     = np.clip(np.random.normal(78, 18), 0, 100)
        midterm_score       = np.clip(np.random.normal(62, 18), 0, 100)
        assignment_avg      = np.clip(np.random.normal(68, 15), 0, 100)
        quiz_avg            = np.clip(np.random.normal(65, 16), 0, 100)
        lab_score           = np.clip(np.random.normal(70, 14), 0, 100)
        participation_score = np.clip(np.random.normal(6.5, 2.2), 0, 10)
        late_submissions    = int(np.clip(np.random.poisson(2), 0, 10))
        previous_cgpa       = np.clip(np.random.normal(2.8, 0.7), 0.0, 4.0)

        # ── Risk label formula ──
        academic_score = (
            midterm_score       * 0.30 +
            assignment_avg      * 0.20 +
            quiz_avg            * 0.15 +
            lab_score           * 0.15 +
            attendance_rate     * 0.10 +
            participation_score * 10 * 0.05 +
            previous_cgpa       * 25 * 0.05
        )
        penalty = late_submissions * 1.5 + max(0, (60 - attendance_rate) * 0.3)
        final_score = academic_score - penalty

        if final_score >= 65:
            risk = 0   # Low Risk
        elif final_score >= 45:
            risk = 1   # Medium Risk
        else:
            risk = 2   # High Risk

        records.append({
            'attendance_rate':     round(attendance_rate, 2),
            'midterm_score':       round(midterm_score, 2),
            'assignment_avg':      round(assignment_avg, 2),
            'quiz_avg':            round(quiz_avg, 2),
            'lab_score':           round(lab_score, 2),
            'participation_score': round(participation_score, 2),
            'late_submissions':    late_submissions,
            'previous_cgpa':       round(previous_cgpa, 2),
            'risk_level':          risk
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

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

print(f"\nTrain: {X_train.shape[0]} | Test: {X_test.shape[0]}")
print(f"Features: {FEATURES}")

# ─── 3. MODEL TRAINING ────────────────────────────────────────────────────────
results = {}

## 3a. Logistic Regression (Baseline)
print("\n[1/4] Training Logistic Regression...")
lr = LogisticRegression(max_iter=1000, random_state=42)
lr.fit(X_train_scaled, y_train)
y_pred_lr = lr.predict(X_test_scaled)
cv_lr = cross_val_score(lr, X_train_scaled, y_train, cv=5, scoring='f1_macro')
results['Logistic Regression (Baseline)'] = {
    'model': lr, 'y_pred': y_pred_lr, 'scaled': True,
    'accuracy': accuracy_score(y_test, y_pred_lr),
    'f1_macro': f1_score(y_test, y_pred_lr, average='macro'),
    'cv_scores': cv_lr
}

## 3b. Random Forest
print("[2/4] Training Random Forest (GridSearchCV)...")
rf_params = {
    'n_estimators': [100, 200],
    'max_depth': [None, 10, 20],
    'min_samples_split': [2, 5]
}
rf_gs = GridSearchCV(RandomForestClassifier(random_state=42),
                     rf_params, cv=5, scoring='f1_macro', n_jobs=-1)
rf_gs.fit(X_train, y_train)
best_rf   = rf_gs.best_estimator_
y_pred_rf = best_rf.predict(X_test)
cv_rf = cross_val_score(best_rf, X_train, y_train, cv=5, scoring='f1_macro')
results['Random Forest'] = {
    'model': best_rf, 'y_pred': y_pred_rf, 'scaled': False,
    'accuracy': accuracy_score(y_test, y_pred_rf),
    'f1_macro': f1_score(y_test, y_pred_rf, average='macro'),
    'cv_scores': cv_rf,
    'best_params': rf_gs.best_params_
}
print(f"   Best params: {rf_gs.best_params_}")

## 3c. Gradient Boosting
print("[3/4] Training Gradient Boosting...")
gb = GradientBoostingClassifier(n_estimators=200, learning_rate=0.1,
                                 max_depth=4, random_state=42)
gb.fit(X_train, y_train)
y_pred_gb = gb.predict(X_test)
cv_gb = cross_val_score(gb, X_train, y_train, cv=5, scoring='f1_macro')
results['Gradient Boosting'] = {
    'model': gb, 'y_pred': y_pred_gb, 'scaled': False,
    'accuracy': accuracy_score(y_test, y_pred_gb),
    'f1_macro': f1_score(y_test, y_pred_gb, average='macro'),
    'cv_scores': cv_gb
}

## 3d. SVM
print("[4/4] Training SVM...")
svm = SVC(kernel='rbf', C=10, gamma='scale', probability=True, random_state=42)
svm.fit(X_train_scaled, y_train)
y_pred_svm = svm.predict(X_test_scaled)
cv_svm = cross_val_score(svm, X_train_scaled, y_train, cv=5, scoring='f1_macro')
results['SVM (RBF)'] = {
    'model': svm, 'y_pred': y_pred_svm, 'scaled': True,
    'accuracy': accuracy_score(y_test, y_pred_svm),
    'f1_macro': f1_score(y_test, y_pred_svm, average='macro'),
    'cv_scores': cv_svm
}

# ─── 4. EVALUATION ────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("MODEL EVALUATION RESULTS")
print("="*60)

eval_data = {}
for name, res in results.items():
    y_pred  = res['y_pred']
    acc     = res['accuracy']
    f1_mac  = res['f1_macro']
    f1_mic  = f1_score(y_test, y_pred, average='micro')
    prec    = precision_score(y_test, y_pred, average='macro')
    rec     = recall_score(y_test, y_pred, average='macro')
    cm      = confusion_matrix(y_test, y_pred).tolist()
    report  = classification_report(
        y_test, y_pred,
        target_names=['Low Risk', 'Medium Risk', 'High Risk'],
        output_dict=True
    )
    cv_scores = res['cv_scores']

    print(f"\n--- {name} ---")
    print(f"  Accuracy:    {acc:.4f}")
    print(f"  F1 (Macro):  {f1_mac:.4f}")
    print(f"  F1 (Micro):  {f1_mic:.4f}")
    print(f"  Precision:   {prec:.4f}")
    print(f"  Recall:      {rec:.4f}")
    print(f"  CV Mean F1:  {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print(f"  CV Scores:   {np.round(cv_scores, 4)}")

    eval_data[name] = {
        'accuracy':         round(acc, 4),
        'f1_macro':         round(f1_mac, 4),
        'f1_micro':         round(f1_mic, 4),
        'precision_macro':  round(prec, 4),
        'recall_macro':     round(rec, 4),
        'confusion_matrix': cm,
        'classification_report': report,
        'cv_scores':        [round(s, 4) for s in cv_scores.tolist()],
        'cv_mean':          round(float(cv_scores.mean()), 4),
        'cv_std':           round(float(cv_scores.std()), 4),
    }

# ─── 5. SELECT & SAVE BEST MODEL ──────────────────────────────────────────────
best_name = max(results, key=lambda k: results[k]['f1_macro'])
best      = results[best_name]
print(f"\n✅ Best Model: {best_name}")
print(f"   Accuracy: {best['accuracy']:.4f}  |  F1 Macro: {best['f1_macro']:.4f}")

os.makedirs('../backend/model', exist_ok=True)
joblib.dump(best['model'], '../backend/model/best_model.pkl')
joblib.dump(scaler,        '../backend/model/scaler.pkl')

meta = {
    'best_model_name': best_name,
    'features':        FEATURES,
    'class_labels':    {0: 'Low Risk', 1: 'Medium Risk', 2: 'High Risk'},
    'scaled':          best['scaled'],
    'best_accuracy':   round(best['accuracy'], 4),
    'best_f1_macro':   round(best['f1_macro'], 4),
    'evaluation':      eval_data
}
with open('../backend/model/model_meta.json', 'w') as f:
    json.dump(meta, f, indent=2)

print("✅ Saved: backend/model/best_model.pkl")
print("✅ Saved: backend/model/scaler.pkl")
print("✅ Saved: backend/model/model_meta.json")
print("\n🎉 Training complete!")
