# NeuroNav

**Neurological Exam → Brain Topology**



Observed findings lead to anatomical constraints, candidate localizations, supporting features, contradictions and compatible syndromes. A 3D atlas illustrates anatomical context.

## Features

- Simple mode: 18 core NIHSS-style findings. Expanded mode: 48 brain-relevant findings.
- Transparent localization rules, uncertainty and competing explanations.
- Interactive 3D cortical parcels and deep structures, with a compatibility renderer.
- Local English/Portuguese examination phrase matching; users review matches before applying.
- Collapsible examination categories and preserved selections across modes.

## Project files

- `dist/`: Complete runnable app, including editable HTML, CSS and JavaScript.
- `dist/assets/`: Meshes, logo, provenance and data licenses.
- `dist/vendor/`: Three.js modules and license.
- `scripts/verify*.cjs`: Regression checks.
- `scripts/prepare-anatomy.py` and `scripts/subdivide-anatomy.py`: Optional anatomy preprocessing. Generated assets are included. Regeneration requires internet access, numpy, nibabel, scipy and scikit-image; upstream datasets may change.
- `.github/workflows/pages.yml`: Optional manual publication.

## Clinical scope

Educational prototype, not intended for patient care. Rule weights are author-defined, unvalidated and not probabilities. Simple mode is not a complete NIHSS assessment and does not calculate an NIHSS score. Template anatomy is not a patient scan. Highlighted parcels illustrate candidate networks, not diagnosed lesion boundaries. Spinal, peripheral, multifocal and systemic explanations may remain possible. Clinical references and limitations are available in the app.
