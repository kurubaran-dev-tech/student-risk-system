const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, Header, Footer, PageNumberElement
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = {
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }
};

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial" })],
    spacing: { before: 360, after: 200 }
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial" })],
    spacing: { before: 280, after: 160 }
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial" })],
    spacing: { before: 200, after: 120 }
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24, font: "Arial", ...opts })],
    spacing: { before: 80, after: 120 },
    alignment: AlignmentType.JUSTIFIED
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text, size: 24, font: "Arial" })],
    spacing: { before: 60, after: 60 }
  });
}
function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    children: [new TextRun({ text, size: 24, font: "Arial" })],
    spacing: { before: 60, after: 60 }
  });
}
function blank() { return new Paragraph({ children: [new TextRun("")], spacing: { before: 60, after: 60 } }); }
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } });
}

function mkTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: "1A56DB", type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, size: 22, color: "FFFFFF", font: "Arial" })],
        alignment: AlignmentType.CENTER
      })]
    }))
  });
  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text: cell, size: 22, font: "Arial" })],
        alignment: AlignmentType.LEFT
      })]
    }))
  }));
  return new Table({
    width: { size: colWidths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }, {
          level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 24 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1A56DB" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "1A56DB", space: 4 } } }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "1E429F" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "374151" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({ text: "End-to-End Predictive System for Student Academic Performance Risk Classification", size: 18, italics: true, color: "6B7280", font: "Arial" })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB", space: 4 } }
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "KURUBARAN A/L MURASU  |  B25030045  |  ", size: 18, color: "6B7280", font: "Arial" }),
            new TextRun({ children: ["Page ", new PageNumberElement()], size: 18, color: "6B7280", font: "Arial" })
          ],
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB", space: 4 } }
        })]
      })
    },
    children: [
      // ═══════════════════════════════ TITLE PAGE ════════════════════════════
      new Paragraph({
        children: [new TextRun({ text: "", size: 24 })],
        spacing: { before: 1200, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "🎓", size: 72 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "END-TO-END PREDICTIVE SYSTEM FOR", bold: true, size: 36, font: "Arial", color: "1A56DB" })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "STUDENT ACADEMIC PERFORMANCE RISK CLASSIFICATION", bold: true, size: 36, font: "Arial", color: "1A56DB" })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 400 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Project Work (40%) — Predictive System Development", size: 24, font: "Arial", color: "374151", italics: true })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 600 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Submitted by:", size: 24, font: "Arial", color: "6B7280" })],
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        children: [new TextRun({ text: "KURUBARAN A/L MURASU", bold: true, size: 28, font: "Arial" })],
        alignment: AlignmentType.CENTER, spacing: { before: 80, after: 60 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Student ID: B25030045", size: 24, font: "Arial", color: "374151" })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 800 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "March 2026", size: 24, font: "Arial", color: "6B7280" })],
        alignment: AlignmentType.CENTER
      }),
      pageBreak(),

      // ═══════════════════════════════ CHAPTER 1 ════════════════════════════
      h1("Chapter 1: Introduction and Problem Statement"),

      h2("1.1 Background"),
      para("In the rapidly evolving landscape of Malaysian higher education, academic institutions are managing increasingly large and diverse student populations. As enrollment numbers grow, the ability of academic advisors and lecturers to provide personalized, one-on-one monitoring for every student has become a significant challenge. Traditional methods of tracking student progress often rely on manual reviews of mid-term results or attendance records, which can be inconsistent and time-consuming."),
      para("This delay in identification often means that by the time a student is flagged as \"at risk,\" the semester is too far advanced for effective remedial intervention. The growing availability of educational data presents a compelling opportunity to develop automated, proactive tools that can predict student outcomes early and enable timely, targeted support."),

      h2("1.2 Problem Statement"),
      para("The core issue addressed by this project is the lack of a proactive, data-driven mechanism for identifying academic performance risks in real-time. Currently, many institutions operate on a reactive model where academic failure is only addressed after the final examination. This \"lag time\" in intervention leads to lower retention rates and prevents students from receiving the specific support—such as tutoring or counseling—that they require."),
      para("There is a critical need for a system that bridges the gap between raw student behavioral data (such as absences and study habits) and actionable academic interventions. The challenge is not merely technical—it also involves designing a system that is accessible, interpretable, and useful for non-technical stakeholders such as lecturers and academic advisors."),

      h2("1.3 Proposed Predictive Solution"),
      para("This project develops an end-to-end predictive system utilizing Multi-class Classification machine learning algorithms to address these gaps. By analyzing historical data and behavioral attributes, the system categorizes students into three distinct risk tiers:"),
      blank(),
      mkTable(
        ["Class", "Label", "Description"],
        [
          ["0", "Low Risk", "Students likely to maintain a high CGPA (Grade B and above). No immediate intervention required."],
          ["1", "Medium Risk", "Students performing at a passing level but showing signs that require monitoring and counseling."],
          ["2", "High Risk", "Students at immediate risk of failure or academic probation. Urgent intervention required."]
        ],
        [1200, 1800, 5760]
      ),
      blank(),
      para("Unlike binary systems that only predict \"pass\" or \"fail,\" this multi-class approach allows for more nuanced intervention strategies tailored to each risk tier. The system is built as a fully integrated web application, ensuring accessibility for end users without requiring any technical expertise."),

      h2("1.4 Stakeholders and Expected Benefits"),
      para("The system is designed to serve the following key stakeholders:"),
      bullet("Academic Advisors and Lecturers: They gain a decision-support tool that highlights students requiring immediate attention, allowing for better-targeted mentorship and resource allocation."),
      bullet("University Administration: The system provides a high-level view of student performance trends, aiding in institutional resource allocation and policy-making."),
      bullet("Students: By being identified as 'Medium' or 'High Risk' early, students can be directed toward support services that increase their probability of success."),

      h2("1.5 Success Criteria"),
      para("The project targets the following measurable success criteria to demonstrate system effectiveness:"),
      bullet("Overall model accuracy greater than or equal to 85%."),
      bullet("Macro-averaged F1-Score greater than or equal to 0.80 across all three risk classes."),
      bullet("Fully functional Role-Based Access Control (RBAC) with Admin and User roles."),
      bullet("A complete web-based UI with input validation for all model features."),
      bullet("Prediction history logging with per-user and admin-wide visibility."),
      pageBreak(),

      // ═══════════════════════════════ CHAPTER 2 ════════════════════════════
      h1("Chapter 2: Research Methodology and Data Sourcing"),

      h2("2.1 Research Design and Framework"),
      para("The development of this predictive system follows a quantitative research design, utilizing a supervised machine learning framework. The methodology is structured into three primary phases: data acquisition and preprocessing, model development and evaluation, and system integration and deployment. By adopting an end-to-end approach, the project ensures that the mathematical performance of the model is fully integrated into a functional web-based architecture."),
      para("The CRISP-DM (Cross-Industry Standard Process for Data Mining) methodology guides the project lifecycle, providing a structured, iterative framework that aligns technical machine learning activities with business objectives. The six phases—Business Understanding, Data Understanding, Data Preparation, Modeling, Evaluation, and Deployment—map directly to the chapters of this report."),

      h2("2.2 Data Acquisition and Source Identification"),
      para("The dataset used in this project is modeled after the Student Performance Dataset, a widely recognized benchmark in educational data mining research, originally derived from public repositories such as Kaggle and the UCI Machine Learning Repository. For this project, a synthetic dataset of 1,000 student records was generated using statistically grounded simulation techniques to ensure privacy compliance while preserving realistic distributional properties."),
      para("The dataset generation process used domain knowledge to establish correlations between input features and the target risk class. For example, students with high carry marks (>70), low absences (<5), and no prior failures were predominantly assigned to Class 0 (Low Risk), while students with carry marks below 50, high absences, and multiple prior failures were mapped to Class 2 (High Risk). The intermediate Class 1 (Medium Risk) captured students in a transitional performance zone."),
      blank(),
      mkTable(
        ["Parameter", "Value"],
        [
          ["Total Records", "1,000 student records"],
          ["Train/Test Split", "80% Training (800) / 20% Testing (200)"],
          ["Target Classes", "3 (Low Risk, Medium Risk, High Risk)"],
          ["Class 0 (Low Risk)", "135 records (13.5%)"],
          ["Class 1 (Medium Risk)", "217 records (21.7%)"],
          ["Class 2 (High Risk)", "648 records (64.8%)"],
          ["Data Format", "CSV (student_performance.csv)"]
        ],
        [3500, 5260]
      ),

      h2("2.3 Definition of Predictive Scope"),
      para("The predictive scope is clearly bounded to mid-semester behavioral and academic indicators, enabling early identification before the final examination period. The three target classes are defined as follows:"),
      bullet("Target Class 0 (Low Risk): Students likely to maintain a CGPA equivalent to Grade B (60%+) or above. These students demonstrate consistent attendance, adequate study time, and strong internal assessment performance."),
      bullet("Target Class 1 (Medium Risk): Students performing at a passing level (Grade C) but showing one or more warning signs such as irregular attendance or declining assignment scores. These students require monitoring and light-touch intervention."),
      bullet("Target Class 2 (High Risk): Students at immediate risk of failure or academic probation. This group exhibits multiple risk factors simultaneously—poor carry marks, high absenteeism, low study time, and prior academic failures."),

      h2("2.4 Development Environment and Technology Stack"),
      para("The technology stack was carefully selected to balance capability, accessibility, and maintainability at a Master's level. The following components constitute the full-stack architecture:"),
      blank(),
      mkTable(
        ["Component", "Technology", "Purpose"],
        [
          ["ML Engine", "Python 3.12 + Scikit-Learn 1.8", "Model training, evaluation, and serialization"],
          ["Backend API", "Flask (Python)", "RESTful API server with RBAC and prediction endpoint"],
          ["Frontend", "Vue.js 3 + Chart.js 4", "Single-page web application with responsive UI"],
          ["Model Storage", "Joblib (.pkl files)", "Persistent model and scaler serialization"],
          ["Data Processing", "Pandas + NumPy", "Dataset manipulation and feature engineering"],
          ["Visualization", "Chart.js", "In-browser charts for metrics and distributions"]
        ],
        [1800, 2800, 4160]
      ),
      pageBreak(),

      // ═══════════════════════════════ CHAPTER 3 ════════════════════════════
      h1("Chapter 3: Technical Feature Selection and Justification"),

      h2("3.1 Criteria for Feature Selection"),
      para("The effectiveness of a predictive system in an educational setting depends heavily on the selection of features that have a logical and statistical correlation with academic success. For this Student Performance Risk scenario, attributes were selected based on three key criteria: (1) availability during the mid-semester period to enable early intervention, (2) demonstrated correlation with academic outcomes in prior educational research, and (3) measurability through existing institutional data collection systems."),
      para("By focusing on a lean set of six high-impact variables, the system remains computationally efficient and interpretable, while maintaining the required technical rigor for a Master's level project. Each feature maps directly to a UI input field, satisfying the 'Interfaces for Every Attribute' requirement."),

      h2("3.2 Feature Descriptions and Justifications"),

      h3("3.2.1 Carry Marks (0–100)"),
      para("This represents the total marks accumulated through quizzes, assignments, and mid-term tests before the final examination, expressed as a percentage of the total available carry marks. It is the strongest single predictor of whether a student will pass or fail the course. Research consistently shows that carry marks correlate with a student's ability to sustain academic effort over time. Students with carry marks below 50% face a statistically significant uphill challenge in the final examination."),

      h3("3.2.2 Assignment Score (0–100)"),
      para("This sub-feature tracks the student's ability to handle independent research and practical tasks. Low assignment scores indicate disengagement, poor time management, or difficulty understanding course material—all of which are precursors to academic failure. Unlike quiz scores which may reflect test anxiety, assignment scores reflect consistent effort and comprehension over time."),

      h3("3.2.3 Number of Absences (0–20)"),
      para("Attendance is one of the most reliable behavioral indicators of student engagement. Empirical studies in Malaysian higher education have found that students with more than 20% absenteeism (approximately 6–8 classes per semester) have significantly lower final exam scores. High absence rates also correlate with missed instructional content, reduced peer learning, and lower assignment submission rates."),

      h3("3.2.4 Study Time per Week (1–10 hours)"),
      para("Self-reported average study hours per week serves as a proxy for academic motivation and time investment. While self-reported data has inherent measurement noise, studies in educational psychology consistently identify study time as a significant predictor of academic performance. Students studying fewer than 3 hours per week are consistently overrepresented in the High Risk category."),

      h3("3.2.5 Health Index (1–5)"),
      para("General health status is included as a holistic factor, recognizing that physical and mental health directly affect cognitive function, concentration, and academic stamina. A health index of 1 or 2 (Poor to Very Poor) often correlates with increased absenteeism, reduced assignment completion, and poor examination performance. This feature acknowledges the biopsychosocial dimensions of student success."),

      h3("3.2.6 Cumulative Failures (0–3)"),
      para("This feature tracks historical academic struggles by recording the number of previously failed courses. It serves as a strong cumulative risk indicator—students with prior failures have both a statistical tendency toward repeated failure and a psychological burden (reduced confidence, increased anxiety) that compounds current risk. Prior research identifies cumulative failures as one of the top predictors of academic dropout."),

      h2("3.3 Feature Attribute Mapping Table"),
      para("The following table provides the complete attribute mapping between UI input fields, model feature names, data types, and validation constraints:"),
      blank(),
      mkTable(
        ["Attribute Name", "Model Feature", "Data Type", "Valid Range", "UI Input Type"],
        [
          ["Carry Marks", "carry_marks", "Float", "0.0 – 100.0", "Numeric Input"],
          ["Assignment Score", "assignment_score", "Float", "0.0 – 100.0", "Numeric Input"],
          ["Number of Absences", "absences", "Integer", "0 – 20", "Numeric Input"],
          ["Study Time (hrs/wk)", "study_time", "Integer", "1 – 10", "Numeric Input"],
          ["Health Index", "health_index", "Integer", "1 – 5", "Dropdown Select"],
          ["Cumulative Failures", "cumulative_failures", "Integer", "0 – 3", "Dropdown Select"]
        ],
        [1700, 1800, 1200, 1200, 1800]
      ),
      pageBreak(),

      // ═══════════════════════════════ CHAPTER 4 ════════════════════════════
      h1("Chapter 4: Data Preprocessing and Preparation"),

      h2("4.1 Data Cleaning"),
      para("The synthetic dataset was generated with controlled properties, resulting in no missing values. In a real-world deployment, missing values would be handled using the following strategy: continuous features (carry_marks, assignment_score) would use median imputation; discrete features (absences, study_time) would use mode imputation; and any records with more than 50% missing features would be dropped from training."),
      para("Outlier detection was performed using the Interquartile Range (IQR) method. Values falling more than 1.5 × IQR beyond the first or third quartile were flagged. For this dataset, all generated values fell within theoretically valid ranges due to the bounded generation constraints (e.g., carry_marks is bounded between 0 and 100)."),

      h2("4.2 Feature Encoding"),
      para("All six input features are numeric in nature, eliminating the need for categorical encoding techniques such as one-hot encoding or label encoding. This simplifies the preprocessing pipeline and reduces the risk of the dummy variable trap. The health_index and cumulative_failures features, while presented as dropdown selections in the UI, are treated as ordinal integers by the model, preserving their inherent ordering relationship."),

      h2("4.3 Feature Scaling"),
      para("StandardScaler (z-score normalization) was applied to all features before training the Logistic Regression and SVM models. This transformation ensures that features with larger numeric ranges (e.g., carry_marks at 0–100) do not disproportionately dominate features with smaller ranges (e.g., health_index at 1–5). Tree-based models (Random Forest and Gradient Boosting) are inherently scale-invariant and were trained on unscaled features."),
      para("The scaling formula applied is: z = (x − μ) / σ, where μ is the training set mean and σ is the training set standard deviation. The scaler is fitted on the training data only to prevent data leakage, and is then applied to the test set using the same parameters."),

      h2("4.4 Train/Test Split"),
      para("The dataset was partitioned using an 80/20 stratified split, ensuring that the proportion of each class label is preserved in both the training and test sets. Stratified splitting is critical for imbalanced datasets—without stratification, a random split could produce a test set that underrepresents the Low Risk class (13.5% of data), leading to biased evaluation metrics."),
      blank(),
      mkTable(
        ["Split", "Records", "Low Risk (0)", "Medium Risk (1)", "High Risk (2)"],
        [
          ["Training (80%)", "800", "108", "174", "518"],
          ["Testing (20%)", "200", "27", "43", "130"],
          ["Total", "1,000", "135", "217", "648"]
        ],
        [1800, 1500, 1900, 2000, 1560]
      ),
      pageBreak(),

      // ═══════════════════════════════ CHAPTER 5 ════════════════════════════
      h1("Chapter 5: Model Training and Algorithm Selection"),

      h2("5.1 Model Selection Strategy"),
      para("Four machine learning algorithms were selected for comparative evaluation, following a progression from simple baseline to complex ensemble methods. This multi-model approach enables objective comparison and ensures the best-performing algorithm is deployed in the production system."),

      h2("5.2 Model 1: Logistic Regression (Baseline)"),
      para("Logistic Regression with multinomial cross-entropy loss serves as the interpretable baseline model. It provides probabilistic class predictions through the softmax function and requires no hyperparameter tuning beyond regularization strength. Despite its simplicity, it performs exceptionally well when features are linearly separable after scaling—as is the case with this dataset. The model was trained with L2 regularization (C=1.0) and a maximum of 1,000 iterations using the L-BFGS solver."),

      h2("5.3 Model 2: Random Forest"),
      para("Random Forest is an ensemble of decision trees trained on bootstrapped samples with random feature subsets at each split. This bagging approach reduces variance and improves generalization. Hyperparameter tuning was performed using 5-fold cross-validated Grid Search over the following parameter space:"),
      bullet("n_estimators: [100, 200]"),
      bullet("max_depth: [None, 10, 20]"),
      bullet("min_samples_split: [2, 5]"),
      para("Best parameters found: n_estimators=200, max_depth=None, min_samples_split=2. The unscaled feature set was used for this model, as decision trees are invariant to feature scaling."),

      h2("5.4 Model 3: Gradient Boosting"),
      para("Gradient Boosting builds an ensemble sequentially, where each new tree corrects the errors of the previous ensemble. This boosting approach reduces bias at the cost of increased training time. The model was trained with n_estimators=200, learning_rate=0.1, and max_depth=4 using the deviance loss function for multi-class classification."),

      h2("5.5 Model 4: Support Vector Machine (SVM)"),
      para("SVM with an RBF (Radial Basis Function) kernel was selected as the fourth model. The RBF kernel maps the feature space into a higher-dimensional space to find non-linear decision boundaries. Parameters used: C=10, gamma='scale', and probability=True to enable class probability estimates via Platt scaling. Feature scaling was applied before training."),

      h2("5.6 Model Selection Decision"),
      para("The final model was selected automatically based on the highest macro-averaged F1 score on the held-out test set. Macro F1 was chosen as the primary selection criterion because it equally weights each class, preventing dominance by the majority class (High Risk at 64.8%). The winning model is integrated into the Flask API and serialized using Joblib for persistent deployment."),
      pageBreak(),

      // ═══════════════════════════════ CHAPTER 6 ════════════════════════════
      h1("Chapter 6: Model Evaluation and Results"),

      h2("6.1 Comparative Evaluation"),
      para("All four models were evaluated on the held-out 200-record test set. The following table summarizes the comparative performance metrics:"),
      blank(),
      mkTable(
        ["Model", "Accuracy", "F1 Macro", "F1 Micro", "Precision", "Recall"],
        [
          ["Logistic Regression (Baseline)", "99.50%", "99.49%", "99.50%", "99.24%", "99.74%"],
          ["SVM (RBF Kernel)", "97.50%", "96.92%", "97.50%", "96.71%", "97.16%"],
          ["Random Forest", "93.50%", "90.31%", "93.50%", "90.10%", "91.02%"],
          ["Gradient Boosting", "92.50%", "88.29%", "92.50%", "88.49%", "88.09%"]
        ],
        [2800, 1300, 1300, 1100, 1300, 1100]
      ),
      blank(),
      para("The Logistic Regression baseline achieved the highest performance across all metrics, surpassing the more complex ensemble methods. This outcome demonstrates that the student risk classification problem is largely linearly separable in the scaled feature space—a finding that aligns with the structured, rule-based nature of the synthetic dataset generation process."),

      h2("6.2 Best Model: Logistic Regression — Detailed Results"),
      blank(),
      mkTable(
        ["Class", "Precision", "Recall", "F1-Score", "Support"],
        [
          ["Low Risk (Class 0)", "100.00%", "100.00%", "100.00%", "27"],
          ["Medium Risk (Class 1)", "97.73%", "100.00%", "98.85%", "43"],
          ["High Risk (Class 2)", "100.00%", "99.23%", "99.61%", "130"],
          ["Macro Average", "99.24%", "99.74%", "99.49%", "200"],
          ["Weighted Average", "99.64%", "99.50%", "99.56%", "200"]
        ],
        [2200, 1700, 1500, 1600, 1760]
      ),

      h2("6.3 Confusion Matrix Analysis"),
      para("The confusion matrix for the best model (Logistic Regression) on the test set shows:"),
      blank(),
      mkTable(
        ["Actual \\ Predicted", "Predicted: Low Risk", "Predicted: Med Risk", "Predicted: High Risk"],
        [
          ["Actual: Low Risk", "27 (TP)", "0", "0"],
          ["Actual: Medium Risk", "0", "43 (TP)", "0"],
          ["Actual: High Risk", "0", "1", "129 (TP)"]
        ],
        [2500, 2100, 2100, 2060]
      ),
      blank(),
      para("Only 1 misclassification occurred: one High Risk student was incorrectly predicted as Medium Risk. This is an acceptable error type—incorrectly classifying a High Risk student as Medium Risk is less severe than classifying them as Low Risk, since the student would still receive some level of monitoring and intervention."),
      para("Zero false negatives for the Low Risk class confirm that no Low Risk student was incorrectly flagged as High Risk, which would cause unnecessary alarm and waste institutional resources."),

      h2("6.4 Interpretation and Practical Implications"),
      para("The model's near-perfect performance (F1 Macro = 99.49%) exceeds the success criteria of F1 >= 0.80 by a significant margin. In practical deployment, this means that for every 200 students assessed, the system is expected to misclassify at most 1–2 students, making it highly reliable for supporting—though not replacing—academic advisor judgment."),
      para("The high recall for High Risk students (99.23%) is particularly important: it means the system rarely misses a student who truly needs intervention. In academic risk prediction, a missed High Risk student (false negative) carries a far higher real-world cost than a false alarm for a Medium Risk student."),
      pageBreak(),

      // ═══════════════════════════════ CHAPTER 7 ════════════════════════════
      h1("Chapter 7: System Architecture and Deployment"),

      h2("7.1 System Architecture Overview"),
      para("The system follows a classic three-tier web architecture consisting of a Presentation Layer (Vue.js frontend), a Business Logic Layer (Flask REST API), and a Data/Model Layer (Scikit-Learn model + in-memory storage). All layers communicate via JSON over HTTP."),
      blank(),
      mkTable(
        ["Layer", "Technology", "Responsibility"],
        [
          ["Presentation", "Vue.js 3 (Single HTML File)", "UI rendering, form validation, RBAC routing, chart display"],
          ["Business Logic", "Flask REST API (Python)", "Authentication, authorization, input validation, prediction orchestration"],
          ["ML Model", "Scikit-Learn + Joblib", "Feature preprocessing, risk classification, probability estimation"],
          ["Data Store", "In-Memory (Python dicts)", "User accounts, session tokens, prediction logs"]
        ],
        [1500, 2400, 4860]
      ),

      h2("7.2 API Endpoints"),
      para("The backend provides the following RESTful API endpoints organized by functional area:"),
      blank(),
      mkTable(
        ["Method", "Endpoint", "Role Required", "Description"],
        [
          ["POST", "/api/login", "Public", "Authenticate user and return JWT-style session token"],
          ["POST", "/api/logout", "Any", "Invalidate current session token"],
          ["GET", "/api/me", "Any", "Return current user profile"],
          ["POST", "/api/predict", "Any", "Submit student data and receive risk prediction"],
          ["GET", "/api/predictions/history", "Any", "Retrieve prediction history (filtered by role)"],
          ["GET", "/api/admin/users", "Admin", "List all registered users"],
          ["POST", "/api/admin/users", "Admin", "Create a new user account"],
          ["PUT", "/api/admin/users/{id}", "Admin", "Update user details or status"],
          ["DELETE", "/api/admin/users/{id}", "Admin", "Deactivate a user account"],
          ["GET", "/api/admin/dataset", "Admin", "View dataset statistics and sample records"],
          ["GET", "/api/admin/model", "Admin", "View trained model metadata"],
          ["GET", "/api/admin/evaluation", "Admin", "View full model evaluation metrics"],
          ["GET", "/api/admin/stats", "Admin", "View system-wide prediction statistics"]
        ],
        [900, 2500, 1500, 3860]
      ),

      h2("7.3 Role-Based Access Control (RBAC)"),
      para("The system implements two roles with distinct permissions:"),
      blank(),
      mkTable(
        ["Feature", "Admin", "User (Lecturer/Advisor)"],
        [
          ["Login / Logout", "Yes", "Yes"],
          ["Submit Predictions", "Yes", "Yes"],
          ["View Own Prediction History", "Yes", "Yes"],
          ["View All Users' Prediction History", "Yes", "No"],
          ["User Management (CRUD)", "Yes", "No"],
          ["Dataset Viewer", "Yes", "No"],
          ["Model Evaluation Dashboard", "Yes", "No"],
          ["System Statistics", "Yes", "No"]
        ],
        [3500, 2000, 3260]
      ),

      h2("7.4 Input Validation"),
      para("The system implements a two-layer validation strategy. On the frontend, HTML5 form constraints (min, max, required) provide immediate user feedback before submission. On the backend, the Flask API performs independent server-side validation, returning specific field-level error messages for any out-of-range or missing values. This dual validation approach ensures data integrity regardless of how the API is accessed."),

      h2("7.5 Prediction Logging"),
      para("Every prediction submitted through the system is automatically logged with the following metadata: a unique prediction ID, timestamp, submitting user's username, student name and ID, all six input feature values, the predicted risk class (0, 1, or 2), the prediction confidence (%), the probability breakdown for all three classes, and the system-generated intervention recommendation. These logs are accessible to the submitting user (own records) and to administrators (all records)."),
      pageBreak(),

      // ═══════════════════════════════ CHAPTER 8 ════════════════════════════
      h1("Chapter 8: System Interface and User Guide"),

      h2("8.1 User Interface Overview"),
      para("The frontend is implemented as a single self-contained HTML file using Vue.js 3 for reactive state management and Chart.js 4 for data visualization. The interface is fully responsive and organized into a sidebar-navigation layout with the following pages:"),
      bullet("Login Page: Secure credential entry with demo account hints."),
      bullet("Dashboard: System statistics, recent predictions, and a risk distribution doughnut chart."),
      bullet("New Prediction: The main prediction form with all six input fields, validation, and result display."),
      bullet("Prediction History: Tabular log of all past predictions (filtered by role)."),
      bullet("User Management (Admin only): Full CRUD operations for user accounts via modal dialogs."),
      bullet("Dataset Viewer (Admin only): Sample records from the training dataset with class distribution statistics."),
      bullet("Model & Evaluation (Admin only): Multi-tab evaluation dashboard with per-class metrics, confusion matrix, and model comparison bar chart."),

      h2("8.2 Prediction Output Display"),
      para("Upon successful prediction, the system displays a colour-coded result banner (green/orange/red), the risk level label, the confidence percentage, and a three-bar probability breakdown showing the probability for each class. An evidence-based intervention recommendation is also displayed based on the predicted risk tier, guiding academic advisors on the appropriate next steps."),

      h2("8.3 Running the System"),
      para("To run the complete system, follow these steps:"),
      numbered("Ensure Python 3.8+ and the required packages are installed: pandas, scikit-learn, flask, joblib, numpy."),
      numbered("Navigate to the ml_model/ directory and run: python3 train_model.py. This generates the dataset and trains all models."),
      numbered("Navigate to the backend/ directory and run: python3 app.py. The API server starts on http://localhost:5000."),
      numbered("Open the frontend/index.html file in any modern web browser. The application is ready to use."),
      numbered("Log in with one of the demo credentials: admin/admin123 (Admin role) or lecturer1/user123 (User role)."),
      pageBreak(),

      // ═══════════════════════════════ CHAPTER 9 ════════════════════════════
      h1("Chapter 9: Limitations and Future Work"),

      h2("9.1 Current Limitations"),
      bullet("Dataset Scope: The 1,000-record synthetic dataset, while sufficient for proof-of-concept, does not capture the full complexity of real student populations across different demographics, faculties, and course types."),
      bullet("Self-Reported Features: Study time and health index are self-reported, introducing potential measurement bias. Students may over-report study hours or health status."),
      bullet("Class Imbalance: The dataset exhibits significant class imbalance (64.8% High Risk), which, while handled via stratified splitting, may affect generalization to populations with different risk distributions."),
      bullet("In-Memory Storage: The current backend uses Python dictionaries for user and session storage. This means all data is lost when the server restarts. A production deployment would require a persistent database (e.g., PostgreSQL, MySQL)."),
      bullet("Static Model: The deployed model is not retrained automatically when new prediction data accumulates. A production system would benefit from scheduled retraining pipelines."),

      h2("9.2 Future Enhancements"),
      bullet("Persistent Database Integration: Replace in-memory storage with PostgreSQL or SQLite to enable data persistence across server restarts."),
      bullet("Real Dataset Integration: Integrate with the institution's Learning Management System (LMS) to import real student data in compliance with PDPA (Personal Data Protection Act) 2010."),
      bullet("Advanced Explainability: Implement SHAP (SHapley Additive exPlanations) values to provide feature-level explanations for individual predictions, increasing advisor trust in the system."),
      bullet("Email Notification System: Automatically notify students and advisors when a High Risk classification is made, enabling faster intervention."),
      bullet("Deep Learning Extension: Explore LSTM-based temporal models to capture sequential academic performance trends across multiple semesters."),
      bullet("Mobile Application: Develop a companion mobile app for on-the-go access by academic advisors during student consultations."),
      pageBreak(),

      // ═══════════════════════════════ CHAPTER 10 ════════════════════════════
      h1("Chapter 10: Conclusion"),
      para("This project successfully developed and deployed an end-to-end predictive system for student academic performance risk classification using multi-class machine learning. Starting from a well-defined problem statement grounded in the challenges of Malaysian higher education, the project progressed through rigorous data generation, comprehensive preprocessing, multi-model training, and full-stack web application development."),
      para("The system achieves its primary technical objective with the Logistic Regression baseline model delivering 99.50% accuracy and a 99.49% macro-averaged F1-Score—significantly exceeding the target threshold of F1 >= 0.80. More importantly, the system achieves its practical objective: providing academic advisors and administrators with a reliable, accessible, and interpretable decision-support tool that enables proactive, data-driven intervention."),
      para("The three-tier classification schema (Low, Medium, High Risk) provides sufficient granularity for differentiated intervention strategies, while the web-based interface with Role-Based Access Control ensures the system is accessible to both technical administrators and non-technical end users. The complete system—including the training pipeline, REST API backend, and Vue.js frontend—is packaged as a self-contained project deliverable ready for demonstration and academic evaluation."),
      para("The system represents a meaningful step toward evidence-based academic advising, where institutional data is transformed into actionable intelligence that benefits students, educators, and institutions alike. With further development toward production readiness—including real data integration, persistent storage, and explainability features—this system has strong potential for real-world deployment in Malaysian higher education institutions."),
      pageBreak(),

      // ═══════════════════════════════ REFERENCES ════════════════════════════
      h1("References"),
      blank(),
      para("1. Cortez, P., & Silva, A. (2008). Using data mining to predict secondary school student performance. In Proceedings of the 5th Annual Future Business Technology Conference (pp. 5–12). EUROSIS."),
      blank(),
      para("2. Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., ... & Duchesnay, E. (2011). Scikit-learn: Machine learning in Python. Journal of Machine Learning Research, 12, 2825–2830."),
      blank(),
      para("3. Breiman, L. (2001). Random forests. Machine Learning, 45(1), 5–32."),
      blank(),
      para("4. Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. Annals of Statistics, 29(5), 1189–1232."),
      blank(),
      para("5. Vapnik, V. N. (1995). The nature of statistical learning theory. Springer."),
      blank(),
      para("6. Romero, C., & Ventura, S. (2010). Educational data mining: A review of the state of the art. IEEE Transactions on Systems, Man, and Cybernetics, Part C, 40(6), 601–618."),
      blank(),
      para("7. Malaysian Ministry of Education. (2015). Malaysia Education Blueprint 2015–2025 (Higher Education). Putrajaya: Ministry of Education Malaysia."),
      blank(),
      para("8. Delen, D. (2011). Predicting student attrition with data mining methods. Journal of College Student Retention: Research, Theory & Practice, 13(1), 17–35."),
      blank(),
      para("9. Chapman, P., Clinton, J., Kerber, R., Khabaza, T., Reinartz, T., Shearer, C., & Wirth, R. (2000). CRISP-DM 1.0: Step-by-step data mining guide. SPSS Inc."),
      blank(),
      para("10. Han, J., Pei, J., & Kamber, M. (2011). Data mining: Concepts and techniques (3rd ed.). Elsevier."),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/Student_Risk_System_Report.docx', buf);
  console.log('Report written successfully.');
});
