---
title: 'MVE Experiment Workshop Guide & Template'
author: 'Phidiax, LLC | Microsoft Partner | Azure Cloud Architects | Tom Canter, Partner & Founder'
date: 'May 30, 2025'
---

## MVE Experiment Workshop Guide & Template

- Guide teams through Agentic AI experiments using the MVE approach
- Provide a clear, step-by-step workshop structure
- Ensure alignment, clarity, and actionable outcomes

::: notes

**Workshop Guide Usage**

- This guide is designed for live workshop facilitation and as a template for documenting your
  experiment.
- Each section includes prompts and best practices to ensure thoroughness and reproducibility.
- Capture workshop notes, decisions, and action items directly in the relevant sections.

:::

---

## 1. Experiment Framing

- Define the experiment's purpose, hypothesis, and context
- Clarify what you want to achieve or learn
- Identify the problem and goal

::: notes Guidance: Experiment Summary

Tips and context for writing a clear experiment summary and purpose statement

The purpose of the experiment is the reason why you’re conducting it. This should be a clear and
concise statement that explains what you hope to learn or achieve. Here are some questions you might
answer in this section:

- What question are you trying to answer?
- What problem are you trying to solve?
- What is the goal of the experiment?

For example, if you’re testing a new feature for a software application, the purpose of your
experiment might be “To determine whether Feature X increases user engagement.”

Remember, the goal here is to provide enough context so that anyone reading your experiment
documentation understands why the experiment is being conducted and what the expected outcomes are.
This will also help when it comes time to analyze your results and draw conclusions. :::

## 1.2 Hypothesis

- Predictive: What do you expect to happen?
- Exploratory: What are you seeking to discover?

::: notes Guidance: Hypothesis

How to write clear, testable, and measurable hypotheses with examples

The hypothesis of an experiment is a proposed explanation or prediction about the relationship
between two or more variables that can be tested through the experiment. Here are some tips for
describing your hypothesis:

1. **Clarity**: Your hypothesis should be simple and concise. It should be easily understandable by
   anyone reading it.
2. **Testability**: Your hypothesis should be something that can be supported or refuted through
   your experiment.
3. **Measurability**: Your hypothesis should involve variables that can be quantified. That is, you
   should be able to measure the variables in some way.
4. **Predictive or Exploratory**: Your hypothesis can either make a prediction about the outcome of
   your experiment or pose an exploratory question.

**Examples:**

- Predictive Hypothesis: "Introducing a new word embedding method will improve the model's
  performance by 10%."
- Exploratory Hypothesis: "Can introducing a new word embedding method improve the model's
  performance?"
- Predictive Hypothesis: "Implementing a new optimization algorithm will reduce the model's training
  time by 20%."
- Exploratory Hypothesis: "Will implementing a new optimization algorithm reduce the model's
  training time?"
- Predictive Hypothesis: "Adding more layers to the neural network will increase its F1 score by
  5%."
- Exploratory Hypothesis: "Can adding more layers to the neural network increase its F1 score?" :::

---

## 2. Impact & Success Metrics

- Define what success means for the project or business
- Identify what will be measured and how
- Set clear criteria for success and failure

::: notes Guidance: Impact

How to consider and document the impact of your experiment being true or false

The impact of an experiment refers to the potential effects or consequences if the hypothesis is
proved true or false. It's important to consider both scenarios:

1. **If the Hypothesis is True**: If your hypothesis is confirmed, what will this mean for your
   project, product, or research? How will it influence your future work?
2. **If the Hypothesis is False**: If your hypothesis is not confirmed, this is equally informative.
   It could indicate that your understanding of the problem needs to be revised, or that a different
   approach may be needed.

Remember, no experiment is a failure. Whether your hypothesis is proved true or false, you always
gain valuable insights. :::

## 2.2 Measure of Success

- What will you measure?
- What value/range indicates success?
- What value/range indicates failure?

::: notes Guidance: Measure of Success

How to define metrics, success, and failure criteria for your experiment

1. **Metric(s)**: Specify the metric(s) that you will use to measure the outcome of your experiment.
   These should be quantifiable measures that are directly related to your hypothesis.
2. **Success Criteria**: Define what value or range of values of your metric(s) would indicate
   success for your experiment.
3. **Failure Criteria**: Similarly, define what value or range of values would indicate failure.

Remember, defining your measure of success upfront helps keep your experiment focused and makes it
easier to interpret the results. :::

---

## 3. Dependencies & Readiness

- List prior experiments, required data sets, and relevant ADRs
- Assess data quality, security, compliance, and technical readiness
- Clarify roles and responsibilities

::: notes Guidance: Dependencies

How to identify and document experiment, data, and ADR dependencies

1. **Experiment Dependencies**: List any prior experiments that this experiment depends on. Include
   a brief description of each experiment and its findings.
2. **Data Dependencies**: Identify any specific data sets that this experiment relies on.
3. **ADR Dependencies**: If there are any ADRs that influence the design or execution of this
   experiment, list them here. :::

## 3.2 Readiness Assessment

- Is the data accurate, complete, and relevant?
- How will sensitive data be handled?
- Is the infrastructure available and configured?
- Are roles and responsibilities clear?

::: notes Guidance: Readiness Assessment

Checklist for assessing data, security, compliance, and team readiness

- **Data Quality:** Is the data accurate, complete, and relevant?
- **Security:** How will sensitive data be handled and protected?
- **Compliance:** Are all activities compliant with regulations and policies?
- **Technical Readiness:** Is the necessary infrastructure available and configured?
- **Stakeholder Alignment:** Are roles and responsibilities clear? :::

---

## 4. Experiment Design & Planning

- Describe experiment type, variables, and methodology
- Outline step-by-step procedures, resources, and timeline
- Assign roles and responsibilities

::: notes Guidance: Methodology

How to describe your experimental design, data collection, and analysis

1. **Experimental Design**: Describe the overall design of your experiment.
2. **Data Collection**: Explain how you will collect data during your experiment.
3. **Data Analysis**: Describe how you will analyze the data from your experiment.
4. **Testing the Hypothesis**: Explain how your experimental design and data analysis will test your
   hypothesis. :::

## 4.2 Initial Plan

- Step-by-step procedures
- List all tools, data, and resources needed
- Estimated schedule for each step
- Who is doing what?

::: notes Guidance: Initial Plan

How to outline procedures, materials, timeline, roles, and assumptions

- **Procedure:** Step-by-step guide on how to conduct the experiment.
- **Materials:** List all tools and resources.
- **Timeline:** Provide an estimated timeline for each step.
- **Roles and Responsibilities:** Define who is responsible for each part.
- **Assumptions and Limitations:** Clearly state assumptions and limitations. :::

---

## 5. Execution & Iteration

- Document execution steps, challenges, and solutions
- Note deviations from plan and quality controls
- Record how the process was documented

::: notes Guidance: Execution Log

What to document during execution: steps, challenges, controls, and records

- **Execution Steps:** Detail the exact steps taken during the execution.
- **Challenges and Solutions:** Describe any challenges or obstacles encountered.
- **Quality Control:** Explain any measures taken to ensure quality.
- **Safety Measures:** If applicable, describe any safety measures.
- **Documentation:** Discuss how the experiment execution was documented. :::

---

## 6. Results & Review

- Present key findings, data, and conclusions
- Document artifacts and review process
- Summarize main findings, issues, and recommendations

::: notes Guidance: Results Analysis

How to present, interpret, and conclude from your experiment results

- **Data Presentation:** Present the data collected during your experiment.
- **Observations:** Describe any observations made during the experiment.
- **Interpretation:** Interpret your results in the context of your hypothesis.
- **Statistical Analysis:** If applicable, include any statistical analysis.
- **Conclusion:** Draw a conclusion about your experiment. :::

## 6.2 Artifacts

- Links to notebooks, logs, models, etc.
- Hardware/software details
- Ensure all artifacts are well explained

::: notes Guidance: Results Artifacts

How to document and explain experiment artifacts and environment

- **Artifact Links:** Provide links or references to the artifacts.
- **Execution Environment:** Describe the environment in which the artifacts were created.
- **Explanation:** Ensure that your artifacts are well-documented and explained.
- **Data Visualization:** If your artifacts include data visualizations, make sure they are clearly
  labeled.
- **Results Interpretation:** Include sections in your artifacts where you interpret the results.
  :::

## 6.3 Review & Recommendations

- Main findings
- Problems or open questions
- Next steps or further experiments
- Who contributed to the review

::: notes Guidance: Review & Recommendations

How to summarize findings, issues, recommendations, and reviewers

- **Key Takeaways:** Summarize the most important findings.
- **Issues Raised:** Document any significant issues.
- **Recommendations for Future Experiments:** Provide any recommendations for future experiments.
- **Reviewer(s):** List the people who participated in the review process. :::

---

## 7. References & Citations

- List related notebooks, experiments, and external references
- Provide citation guidance

::: notes Guidance: References & Citations

How to provide related work, external references, and citation guidance

- **Related Notebooks:** Provide links to related notebooks.
- **Related Experiments:** Provide references to related experiments.
- **External References:** List any external resources.
- **Citation Guidance:** Format your citations with in-text and reference list entries. :::

---

_This guide is intended to be a living document. Update it as you learn and iterate. Use it to drive
clarity, alignment, and successful Agentic AI experimentation._
