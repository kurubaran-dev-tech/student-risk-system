"""
Student Performance Risk Classification - Flask Backend
Realistic academic features: attendance, midterm, assignments, quizzes,
lab scores, participation, late submissions, previous CGPA.
REST API with Role-Based Access Control (RBAC).
"""

from flask import Flask, request, jsonify
import joblib
import json
import os
import hashlib
import datetime
import uuid
import pandas as pd

app = Flask(__name__)

# ─── LOAD MODEL ───────────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
model      = joblib.load(os.path.join(MODEL_DIR, 'best_model.pkl'))
scaler     = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))

with open(os.path.join(MODEL_DIR, 'model_meta.json')) as f:
    model_meta = json.load(f)

FEATURES = model_meta['features']
SCALED   = model_meta['scaled']

# ─── PERSISTENT PREDICTION LOG ────────────────────────────────────────────────
LOG_PATH = os.path.join(os.path.dirname(__file__), 'prediction_log.json')

def load_log():
    if os.path.exists(LOG_PATH):
        with open(LOG_PATH) as f:
            return json.load(f)
    return []

def save_log(log):
    with open(LOG_PATH, 'w') as f:
        json.dump(log, f, indent=2)

PREDICTION_LOG = load_log()

# ─── USER STORE ───────────────────────────────────────────────────────────────
def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

USERS = {
    'admin': {
        'id': 'u001', 'username': 'admin',
        'password': hash_pw('admin123'), 'role': 'admin',
        'full_name': 'System Administrator',
        'email': 'admin@edu.my', 'active': True
    },
    'lecturer1': {
        'id': 'u002', 'username': 'lecturer1',
        'password': hash_pw('user123'), 'role': 'user',
        'full_name': 'Dr. Siti Rahimah',
        'email': 'siti@edu.my', 'active': True
    },
    'advisor1': {
        'id': 'u003', 'username': 'advisor1',
        'password': hash_pw('user123'), 'role': 'user',
        'full_name': 'Mr. Ravi Kumar',
        'email': 'ravi@edu.my', 'active': True
    },
}

SESSIONS    = {}   # token -> { username, role, expires }
DATASET_STATS = {}

def init_dataset_stats():
    """Load dataset statistics once at startup."""
    csv_path = os.path.join(os.path.dirname(__file__), '../dataset/student_performance.csv')
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        DATASET_STATS['total_records']       = len(df)
        DATASET_STATS['class_distribution']  = df['risk_level'].value_counts().to_dict()
        DATASET_STATS['feature_stats']       = df.describe().to_dict()
        DATASET_STATS['sample_records']      = df.head(20).to_dict(orient='records')

init_dataset_stats()

# ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
def create_token(username, role):
    token = str(uuid.uuid4())
    SESSIONS[token] = {
        'username': username,
        'role':     role,
        'expires':  (datetime.datetime.now() + datetime.timedelta(hours=8)).isoformat()
    }
    return token

def get_session(token):
    if not token or token not in SESSIONS:
        return None
    s = SESSIONS[token]
    if datetime.datetime.fromisoformat(s['expires']) < datetime.datetime.now():
        del SESSIONS[token]
        return None
    return s

def require_auth(f):
    def wrapper(*args, **kwargs):
        token   = request.headers.get('Authorization', '').replace('Bearer ', '')
        session = get_session(token)
        if not session:
            return jsonify({'error': 'Unauthorized. Please login.'}), 401
        request.session = session
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def require_admin(f):
    def wrapper(*args, **kwargs):
        token   = request.headers.get('Authorization', '').replace('Bearer ', '')
        session = get_session(token)
        if not session:
            return jsonify({'error': 'Unauthorized.'}), 401
        if session['role'] != 'admin':
            return jsonify({'error': 'Admin access required.'}), 403
        request.session = session
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

# ─── CORS ─────────────────────────────────────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin']  = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options(path):
    return jsonify({}), 200

# ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
def login():
    data     = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    user     = USERS.get(username)
    if not user or user['password'] != hash_pw(password):
        return jsonify({'error': 'Invalid username or password.'}), 401
    if not user['active']:
        return jsonify({'error': 'Account is deactivated.'}), 403
    token = create_token(username, user['role'])
    return jsonify({
        'token':     token,
        'role':      user['role'],
        'full_name': user['full_name'],
        'username':  username
    })

@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    SESSIONS.pop(token, None)
    return jsonify({'message': 'Logged out.'})

@app.route('/api/me', methods=['GET'])
@require_auth
def me():
    u = USERS[request.session['username']]
    return jsonify({k: v for k, v in u.items() if k != 'password'})

# ─── PREDICTION ROUTE ─────────────────────────────────────────────────────────
@app.route('/api/predict', methods=['POST'])
@require_auth
def predict():
    data   = request.get_json()
    errors = {}

    student_name = data.get('student_name', 'N/A')
    student_id   = data.get('student_id',   'N/A')

    def check_range(val, name, lo, hi):
        try:
            v = float(val)
            if not (lo <= v <= hi):
                errors[name] = f"Must be between {lo} and {hi}."
            return v
        except (TypeError, ValueError):
            errors[name] = "Required numeric value."
            return None

    attendance_rate     = check_range(data.get('attendance_rate'),     'attendance_rate',     0,   100)
    midterm_score       = check_range(data.get('midterm_score'),       'midterm_score',       0,   100)
    assignment_avg      = check_range(data.get('assignment_avg'),      'assignment_avg',      0,   100)
    quiz_avg            = check_range(data.get('quiz_avg'),            'quiz_avg',            0,   100)
    lab_score           = check_range(data.get('lab_score'),           'lab_score',           0,   100)
    participation_score = check_range(data.get('participation_score'), 'participation_score', 0,    10)
    late_submissions    = check_range(data.get('late_submissions'),    'late_submissions',    0,    10)
    previous_cgpa       = check_range(data.get('previous_cgpa'),      'previous_cgpa',       0.0, 4.0)

    if errors:
        return jsonify({'errors': errors}), 422

    input_row = [[
        attendance_rate, midterm_score, assignment_avg, quiz_avg,
        lab_score, participation_score, late_submissions, previous_cgpa
    ]]

    if SCALED:
        input_row = scaler.transform(input_row)

    prediction    = int(model.predict(input_row)[0])
    probabilities = model.predict_proba(input_row)[0].tolist()

    label_map = {0: 'Low Risk',  1: 'Medium Risk',  2: 'High Risk'}
    color_map = {0: 'green',     1: 'orange',        2: 'red'}
    advice_map = {
        0: 'Student is on track. Continue monitoring and encourage consistency.',
        1: 'Student needs attention. Schedule a counseling session and monitor submission activity.',
        2: 'Immediate intervention required. Refer to academic advisor, provide tutoring, review workload.'
    }

    record = {
        'id':               str(uuid.uuid4())[:8],
        'timestamp':        datetime.datetime.now().isoformat(),
        'submitted_by':     request.session['username'],
        'student_name':     student_name,
        'student_id':       student_id,
        'inputs': {
            'attendance_rate':     attendance_rate,
            'midterm_score':       midterm_score,
            'assignment_avg':      assignment_avg,
            'quiz_avg':            quiz_avg,
            'lab_score':           lab_score,
            'participation_score': participation_score,
            'late_submissions':    int(late_submissions),
            'previous_cgpa':       previous_cgpa
        },
        'prediction':       prediction,
        'prediction_label': label_map[prediction],
        'confidence':       round(max(probabilities) * 100, 2),
        'probabilities': {
            'Low Risk':    round(probabilities[0] * 100, 2),
            'Medium Risk': round(probabilities[1] * 100, 2),
            'High Risk':   round(probabilities[2] * 100, 2)
        },
        'advice': advice_map[prediction],
        'color':  color_map[prediction]
    }

    PREDICTION_LOG.append(record)
    save_log(PREDICTION_LOG)

    return jsonify(record)

# ─── PREDICTION HISTORY ───────────────────────────────────────────────────────
@app.route('/api/predictions/history', methods=['GET'])
@require_auth
def prediction_history():
    session = request.session
    if session['role'] == 'admin':
        logs = PREDICTION_LOG
    else:
        logs = [p for p in PREDICTION_LOG if p['submitted_by'] == session['username']]
    return jsonify({'predictions': list(reversed(logs))})

# ─── ADMIN: USER MANAGEMENT ───────────────────────────────────────────────────
@app.route('/api/admin/users', methods=['GET'])
@require_admin
def list_users():
    users = [{k: v for k, v in u.items() if k != 'password'} for u in USERS.values()]
    return jsonify({'users': users})

@app.route('/api/admin/users', methods=['POST'])
@require_admin
def create_user():
    data     = request.get_json()
    username = data.get('username', '').strip()
    if not username or username in USERS:
        return jsonify({'error': 'Username required or already exists.'}), 400
    USERS[username] = {
        'id':        'u' + str(uuid.uuid4())[:6],
        'username':  username,
        'password':  hash_pw(data.get('password', 'password123')),
        'role':      data.get('role', 'user'),
        'full_name': data.get('full_name', username),
        'email':     data.get('email', f'{username}@edu.my'),
        'active':    True
    }
    return jsonify({
        'message': f'User {username} created.',
        'user': {k: v for k, v in USERS[username].items() if k != 'password'}
    })

@app.route('/api/admin/users/<uid>', methods=['PUT'])
@require_admin
def update_user(uid):
    data = request.get_json()
    user = next((u for u in USERS.values() if u['id'] == uid), None)
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    for field in ['full_name', 'email', 'role', 'active']:
        if field in data:
            user[field] = data[field]
    if 'password' in data and data['password']:
        user['password'] = hash_pw(data['password'])
    return jsonify({'message': 'User updated.'})

@app.route('/api/admin/users/<uid>', methods=['DELETE'])
@require_admin
def deactivate_user(uid):
    user = next((u for u in USERS.values() if u['id'] == uid), None)
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    user['active'] = False
    return jsonify({'message': f"User {user['username']} deactivated."})

# ─── ADMIN: DATASET & MODEL ───────────────────────────────────────────────────
@app.route('/api/admin/dataset', methods=['GET'])
@require_admin
def dataset_info():
    return jsonify(DATASET_STATS)

@app.route('/api/admin/model', methods=['GET'])
@require_admin
def model_info():
    return jsonify(model_meta)

@app.route('/api/admin/evaluation', methods=['GET'])
@require_admin
def evaluation():
    return jsonify(model_meta.get('evaluation', {}))

@app.route('/api/admin/stats', methods=['GET'])
@require_admin
def admin_stats():
    total  = len(PREDICTION_LOG)
    by_risk = {0: 0, 1: 0, 2: 0}
    for p in PREDICTION_LOG:
        by_risk[p['prediction']] = by_risk.get(p['prediction'], 0) + 1
    return jsonify({
        'total_predictions': total,
        'predictions_by_risk': {
            'Low Risk':    by_risk[0],
            'Medium Risk': by_risk[1],
            'High Risk':   by_risk[2]
        },
        'total_users':   len(USERS),
        'active_users':  sum(1 for u in USERS.values() if u['active']),
        'model_name':    model_meta['best_model_name'],
        'model_accuracy': model_meta['best_accuracy'],
        'model_f1':      model_meta['best_f1_macro']
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
