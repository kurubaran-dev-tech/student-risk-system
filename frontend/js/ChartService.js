/**
 * ChartService.js
 * Manages all Chart.js rendering.
 * Single Responsibility: Chart creation and destruction only.
 */

class ChartService {
  constructor() {
    this._charts = {};
  }

  /**
   * Destroy a chart by key before re-rendering.
   */
  _destroy(key) {
    if (this._charts[key]) {
      this._charts[key].destroy();
      delete this._charts[key];
    }
  }

  /**
   * Render the dashboard doughnut chart showing risk distribution.
   * @param {string} canvasId
   * @param {{ 'Low Risk': number, 'Medium Risk': number, 'High Risk': number }} riskData
   */
  renderDashChart(canvasId, riskData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    this._destroy(canvasId);
    this._charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Low Risk', 'Medium Risk', 'High Risk'],
        datasets: [{
          data: [
            riskData['Low Risk'] || 0,
            riskData['Medium Risk'] || 0,
            riskData['High Risk'] || 0
          ],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 2
        }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        cutout: '65%'
      }
    });
  }

  /**
   * Render the model comparison bar chart.
   * @param {string} canvasId
   * @param {Object} evalData - All models evaluation data
   */
  renderModelCompChart(canvasId, evalData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || !evalData) return;
    this._destroy(canvasId);
    const names = Object.keys(evalData);
    this._charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: names,
        datasets: [
          { label: 'Accuracy',  data: names.map(n => +(evalData[n].accuracy * 100).toFixed(2)),  backgroundColor: '#3b82f6' },
          { label: 'F1 Macro',  data: names.map(n => +(evalData[n].f1_macro * 100).toFixed(2)),  backgroundColor: '#10b981' },
          { label: 'Precision', data: names.map(n => +(evalData[n].precision_macro * 100).toFixed(2)), backgroundColor: '#f59e0b' },
          { label: 'Recall',    data: names.map(n => +(evalData[n].recall_macro * 100).toFixed(2)),    backgroundColor: '#8b5cf6' }
        ]
      },
      options: {
        scales: { y: { min: 0, max: 105, ticks: { callback: v => v + '%' } } },
        plugins: { legend: { position: 'bottom' } },
        responsive: true,
        maintainAspectRatio: true
      }
    });
  }

  destroyAll() {
    Object.keys(this._charts).forEach(k => this._destroy(k));
  }
}
