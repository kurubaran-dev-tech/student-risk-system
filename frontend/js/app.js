/**
 * app.js
 * Main Vue 3 application entry point.
 * Wires together all page controllers and services.
 * Single Responsibility: App-level state + navigation only.
 */

const { createApp, ref, computed, watch, nextTick } = Vue;

const API_BASE = 'https://student-risk-backend-e7jv.onrender.com/api';

createApp({
  setup() {

    // ─── GLOBAL SERVICES ──────────────────────────────
    const api          = new ApiService(API_BASE);
    const chartService = new ChartService();

    // ─── AUTH STATE ───────────────────────────────────
    const authToken  = ref(localStorage.getItem('token'));
    const currentUser = ref(null);
    const page        = ref('dashboard');

    // ─── LOGIN STATE ──────────────────────────────────
    const loginForm    = ref({ username: '', password: '' });
    const loginError   = ref('');
    const loginLoading = ref(false);

    // ─── DASHBOARD STATE ──────────────────────────────
    const dashStats         = ref({});
    const recentPredictions = ref([]);

    // ─── PREDICT STATE ────────────────────────────────
    const predForm    = ref(Utils.emptyPredForm());
    const predErrors  = ref({});
    const predLoading = ref(false);
    const predResult  = ref(null);
    const predAlert   = ref(null);

    // ─── HISTORY STATE ────────────────────────────────
    const historyList    = ref([]);
    const historyLoading = ref(false);

    // ─── USER MANAGEMENT STATE ────────────────────────
    const userList       = ref([]);
    const usersLoading   = ref(false);
    const showUserModal  = ref(false);
    const editingUser    = ref(null);
    const userForm       = ref(Utils.emptyUserForm());
    const userSaving     = ref(false);
    const userModalAlert = ref(null);

    // ─── DATASET / MODEL STATE ────────────────────────
    const datasetInfo = ref(null);
    const evalData    = ref(null);
    const modelMeta   = ref(null);
    const evalTab     = ref('summary');

    // ─── PAGE CONTROLLERS ─────────────────────────────
    const dashCtrl = new DashboardPage(api, chartService, { dashStats, recentPredictions });

    const predictCtrl = new PredictPage(api, { predForm, predErrors, predLoading, predResult, predAlert });

    const historyCtrl = new HistoryPage(api, { historyList, historyLoading });

    const userCtrl = new UserManagementPage(api, {
      userList, usersLoading, showUserModal,
      editingUser, userForm, userSaving, userModalAlert
    });

    const evalCtrl = new ModelEvalPage(api, chartService, { evalData, modelMeta, evalTab });

    // ─── COMPUTED ─────────────────────────────────────
    const nowStr = computed(() => new Date().toLocaleString('en-MY'));

    const pageTitle = computed(() => ({
      'dashboard':     '📊 Dashboard',
      'predict':       '🔮 New Prediction',
      'history':       '📋 Prediction History',
      'admin-users':   '👥 User Management',
      'admin-dataset': '📁 Dataset Viewer',
      'admin-model':   '🤖 Model & Evaluation'
    })[page.value] || 'Dashboard');

    const pageBreadcrumb = computed(() => ({
      'dashboard':     'Overview of system activity and statistics',
      'predict':       'Enter student academic attributes to get a risk classification',
      'history':       'View past prediction records',
      'admin-users':   'Create, edit, and manage system users',
      'admin-dataset': 'View training dataset records and statistics',
      'admin-model':   'Evaluate model performance and metrics'
    })[page.value] || '');

    const bestEval = computed(() => evalCtrl.getBestEval());

    const perClassMetrics = computed(() => evalCtrl.getPerClassMetrics());

    // ─── AUTH ACTIONS ─────────────────────────────────
    async function doLogin() {
      loginError.value   = '';
      loginLoading.value = true;
      try {
        const data = await api.login(loginForm.value.username, loginForm.value.password);
        localStorage.setItem('token', data.token);
        authToken.value = data.token;
        currentUser.value = await api.getMe();
        navigate('dashboard');
      } catch(e) {
        loginError.value = e.error || 'Login failed. Please check your credentials.';
      } finally {
        loginLoading.value = false;
      }
    }

    async function doLogout() {
      try { await api.logout(); } catch(e) {}
      localStorage.removeItem('token');
      authToken.value   = null;
      currentUser.value = null;
    }

    // ─── NAVIGATION ───────────────────────────────────
    async function navigate(p) {
      page.value       = p;
      predResult.value = null;
      predAlert.value  = null;

      if (p === 'dashboard') {
        await dashCtrl.load(currentUser.value?.role === 'admin');
        await nextTick();
        dashCtrl.renderChart('dashChart');
      }
      if (p === 'history')       await historyCtrl.load();
      if (p === 'admin-users')   await userCtrl.load();
      if (p === 'admin-dataset') await loadDataset();
      if (p === 'admin-model') {
        await evalCtrl.load();
        await nextTick();
      }
    }

    // ─── PREDICT ACTIONS ──────────────────────────────
    async function submitPrediction() {
      await predictCtrl.submit();
    }

    function clearPredForm() {
      predictCtrl.reset();
    }

    // ─── HISTORY ACTIONS ──────────────────────────────
    async function loadHistory() {
      await historyCtrl.load();
    }

    // ─── USER ACTIONS ─────────────────────────────────
    function openCreateUser()  { userCtrl.openCreate(); }
    function openEditUser(u)   { userCtrl.openEdit(u); }
    async function saveUser()  { await userCtrl.save(); }
    async function deactivateUser(u) { await userCtrl.deactivate(u); }

    // ─── DATASET ──────────────────────────────────────
    async function loadDataset() {
      try { datasetInfo.value = await api.getDataset(); } catch(e) {}
    }

    // ─── EVAL TAB SWITCH ──────────────────────────────
    async function switchToAllTab() {
      evalTab.value = 'all';
      await nextTick();
      evalCtrl.renderCompChart('modelCompChart');
    }

    watch(evalTab, async (t) => {
      if (t === 'all') {
        await nextTick();
        evalCtrl.renderCompChart('modelCompChart');
      }
    });

    // ─── UTILITY PASSTHROUGH ──────────────────────────
    const pct          = (v)     => Utils.pct(v);
    const fmtDate      = (ts)    => Utils.fmtDate(ts);
    const riskBadge    = (pred)  => Utils.riskBadge(pred);
    const riskBadgeStr = (label) => Utils.riskBadgeStr(label);
    const resultIcon   = (color) => Utils.resultIcon(color);
    const probColor    = (label) => Utils.probColor(label);

    // ─── INIT ─────────────────────────────────────────
    if (authToken.value) {
      api.getMe()
        .then(user => {
          currentUser.value = user;
          navigate('dashboard');
        })
        .catch(() => {
          localStorage.removeItem('token');
          authToken.value = null;
        });
    }

    // ─── EXPOSE TO TEMPLATE ───────────────────────────
    return {
      // state
      authToken, currentUser, page,
      loginForm, loginError, loginLoading,
      dashStats, recentPredictions,
      predForm, predErrors, predLoading, predResult, predAlert,
      historyList, historyLoading,
      userList, usersLoading, showUserModal, editingUser,
      userForm, userSaving, userModalAlert,
      datasetInfo, evalData, modelMeta, evalTab,
      // computed
      nowStr, pageTitle, pageBreadcrumb, bestEval, perClassMetrics,
      // actions
      doLogin, doLogout, navigate,
      submitPrediction, clearPredForm,
      loadHistory,
      openCreateUser, openEditUser, saveUser, deactivateUser,
      switchToAllTab,
      // utils
      pct, fmtDate, riskBadge, riskBadgeStr, resultIcon, probColor
    };
  }
}).mount('#app');
